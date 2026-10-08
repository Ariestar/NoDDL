#!/usr/bin/env node
import CryptoJS from 'crypto-js';

// src/core/adapter.ts
var FetchHttpClient = class {
  defaultHeaders;
  constructor(defaultHeaders = {}) {
    this.defaultHeaders = defaultHeaders;
  }
  async get(url, headers = {}) {
    const res = await fetch(url, {
      method: "GET",
      headers: { ...this.defaultHeaders, ...headers }
    });
    if (!res.ok) {
      throw new Error(`HTTP GET ${url} \u5931\u8D25: ${res.status} ${res.statusText}`);
    }
    return res.text();
  }
  async post(url, data, headers = {}) {
    const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
    const isUrlEncoded = typeof data === "string" && data.includes("=");
    let body;
    const finalHeaders = { ...this.defaultHeaders, ...headers };
    if (isFormData || typeof data === "string") {
      body = data;
    } else if (isUrlEncoded) {
      body = data;
      finalHeaders["Content-Type"] = "application/x-www-form-urlencoded";
    } else {
      body = JSON.stringify(data);
      if (!finalHeaders["Content-Type"]) {
        finalHeaders["Content-Type"] = "application/json";
      }
    }
    const res = await fetch(url, {
      method: "POST",
      headers: finalHeaders,
      body
    });
    if (!res.ok) {
      throw new Error(`HTTP POST ${url} \u5931\u8D25: ${res.status} ${res.statusText}`);
    }
    return res.text();
  }
};
var COURSE_GRADING_SECRET_KEY = "Client8Sess!06ID";
function encryptPassword(password, secretKey = COURSE_GRADING_SECRET_KEY) {
  const key = CryptoJS.enc.Utf8.parse(secretKey);
  const encrypted = CryptoJS.AES.encrypt(password, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  });
  return encrypted.toString();
}

// src/core/ddl.ts
function calculateUrgency(remainingHours) {
  if (remainingHours <= 0) return "passed";
  if (remainingHours <= 6) return "critical";
  if (remainingHours <= 24) return "urgent";
  if (remainingHours <= 72) return "warning";
  return "normal";
}
function formatRemainingTime(remainingHours) {
  if (remainingHours <= 0) {
    const passedHours = Math.abs(remainingHours);
    if (passedHours < 24) {
      return `\u5DF2\u622A\u6B62 ${Math.round(passedHours)} \u5C0F\u65F6`;
    }
    return `\u5DF2\u622A\u6B62 ${Math.floor(passedHours / 24)} \u5929`;
  }
  if (remainingHours < 1) {
    const mins = Math.max(1, Math.round(remainingHours * 60));
    return `\u4EC5\u5269 ${mins} \u5206\u949F`;
  }
  if (remainingHours < 24) {
    const hrs2 = Math.floor(remainingHours);
    const mins = Math.round((remainingHours - hrs2) * 60);
    return mins > 0 ? `\u5269\u4F59 ${hrs2} \u5C0F\u65F6 ${mins} \u5206` : `\u5269\u4F59 ${hrs2} \u5C0F\u65F6`;
  }
  const days = Math.floor(remainingHours / 24);
  const hrs = Math.round(remainingHours % 24);
  return hrs > 0 ? `\u5269\u4F59 ${days} \u5929 ${hrs} \u5C0F\u65F6` : `\u5269\u4F59 ${days} \u5929`;
}
function parseDeadline(deadlineStr, nowMs = Date.now()) {
  const cleanStr = deadlineStr.trim().replace(/-/g, "/");
  const timestamp = new Date(cleanStr).getTime();
  if (isNaN(timestamp)) {
    return {
      timestamp: 0,
      remainingHours: 9999,
      remainingText: "\u672A\u77E5\u622A\u6B62\u65F6\u95F4"
    };
  }
  const diffMs = timestamp - nowMs;
  const remainingHours = Number((diffMs / (1e3 * 60 * 60)).toFixed(1));
  const remainingText = formatRemainingTime(remainingHours);
  return { timestamp, remainingHours, remainingText };
}
function formatNotificationContent(assignments) {
  const pendingCount = assignments.length;
  const urgentCount = assignments.filter((a) => a.urgency === "critical" || a.urgency === "urgent").length;
  const title = `\u3010NoDDL \u9884\u8B66\u3011\u6709 ${pendingCount} \u9879\u4F5C\u4E1A\u5F85\u63D0\u4EA4\uFF08${urgentCount} \u9879\u7D27\u6025\uFF09`;
  const markdownLines = [
    `### \u{1F514} NoDDL (Not Only DDL) \u4F5C\u4E1A\u6B7B\u7EBF\u63D0\u9192`,
    `\u5F53\u524D\u5171\u6709 **${pendingCount}** \u9879\u4F5C\u4E1A\u5C1A\u672A\u63D0\u4EA4\uFF0C\u5176\u4E2D **${urgentCount}** \u9879\u5373\u5C06\u622A\u6B62\uFF1A`,
    "",
    ...assignments.map((item, idx) => {
      const emoji = item.urgency === "critical" ? "\u{1F6A8}" : item.urgency === "urgent" ? "\u26A0\uFE0F" : "\u23F3";
      return `${idx + 1}. ${emoji} **${item.courseName}** - ${item.title}
   - \u622A\u6B62\u65F6\u95F4\uFF1A\`${item.deadline}\` (${item.remainingText})`;
    }),
    "",
    `*\u6765\u6E90\uFF1A\u6B66\u6C49\u5927\u5B66\u4EBA\u5DE5\u667A\u80FD\u5B66\u9662\u4E00\u4F53\u5316\u4E13\u4E1A\u8BFE\u5E73\u53F0 (115.156.107.145)*`
  ];
  const htmlLines = [
    `<h3>\u{1F514} NoDDL \u4F5C\u4E1A\u6B7B\u7EBF\u50AC\u547D\u7B26</h3>`,
    `<p>\u5F53\u524D\u6709 <b>${pendingCount}</b> \u9879\u672A\u63D0\u4EA4\u4F5C\u4E1A\uFF1A</p>`,
    `<ul>`,
    ...assignments.map((item) => {
      const color = item.urgency === "critical" ? "#e53e3e" : item.urgency === "urgent" ? "#dd6b20" : "#3182ce";
      return `<li><b>[${item.courseName}]</b> ${item.title} <span style="color:${color};font-weight:bold;">(${item.remainingText})</span><br><small>\u622A\u6B62\uFF1A${item.deadline}</small></li>`;
    }),
    `</ul>`
  ];
  return {
    title,
    markdown: markdownLines.join("\n"),
    html: htmlLines.join("\n")
  };
}

// src/core/parser.ts
function parseCourseListHtml(html) {
  const courses = [];
  const seenIds = /* @__PURE__ */ new Set();
  const linkRegex = /<a[^>]*href=["'][^"']*courselist\.jsp\?courseID=([a-zA-Z0-9_-]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const id = match[1];
    const name = match[2].replace(/<[^>]+>/g, "").trim();
    if (id && name && !seenIds.has(id)) {
      seenIds.add(id);
      courses.push({ id, name });
    }
  }
  const spanRegex = /<span[^>]*class=["'][^"']*dropdown-item-course[^"']*["'][^>]*value=["']([a-zA-Z0-9_-]+)["'][^>]*>([\s\S]*?)<\/span>/gi;
  while ((match = spanRegex.exec(html)) !== null) {
    const id = match[1];
    const name = match[2].replace(/<[^>]+>/g, "").trim();
    if (id && name && !seenIds.has(id)) {
      seenIds.add(id);
      courses.push({ id, name });
    }
  }
  return courses;
}
function parseActiveAssignmentsHtml(html, courseName = "\u4E13\u4E1A\u8BFE\u7A0B", nowMs = Date.now()) {
  const assignments = [];
  const seenIds = /* @__PURE__ */ new Set();
  const blockRegex = /<div[^>]*class=["'][^"']*main-zy[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi;
  let blockMatch;
  while ((blockMatch = blockRegex.exec(html)) !== null) {
    const block = blockMatch[1];
    const linkMatch = block.match(/href=["'][^"']*assignID=([a-zA-Z0-9_-]+)[^"']*["'][^>]*>([\s\S]*?)<\/a>/i);
    if (!linkMatch) continue;
    const id = linkMatch[1];
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    const title = linkMatch[2].replace(/<[^>]+>/g, "").trim() || `\u4F5C\u4E1A ${id}`;
    const dateMatch = block.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?)/);
    const deadlineStr = dateMatch ? dateMatch[1] : "";
    const { timestamp, remainingHours, remainingText } = deadlineStr ? parseDeadline(deadlineStr, nowMs) : { timestamp: 0, remainingHours: 9999, remainingText: "\u8BF7\u67E5\u770B\u8BE6\u60C5" };
    let status = "pending";
    if (/已提交|评测中/i.test(block)) status = "submitted";
    else if (/已打分|得分|满分/i.test(block)) status = "graded";
    assignments.push({
      id,
      courseName,
      title,
      deadline: deadlineStr || "\u672A\u6807\u6CE8\u660E\u786E\u622A\u6B62\u65F6\u95F4",
      deadlineTimestamp: timestamp,
      remainingHours,
      remainingText,
      status,
      urgency: calculateUrgency(remainingHours),
      url: `/assignment/index.jsp?assignID=${id}`
    });
  }
  if (assignments.length === 0) {
    const directLinkRegex = /<a[^>]*href=["'][^"']*assignID=([a-zA-Z0-9_-]+)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;
    let linkM;
    while ((linkM = directLinkRegex.exec(html)) !== null) {
      const id = linkM[1];
      if (seenIds.has(id)) continue;
      seenIds.add(id);
      const title = linkM[2].replace(/<[^>]+>/g, "").trim();
      if (!title || title.includes("\u8BE6\u7EC6") || title.includes("\u63D0\u4EA4")) continue;
      assignments.push({
        id,
        courseName,
        title,
        deadline: "\u8BF7\u67E5\u770B\u8BE6\u60C5",
        deadlineTimestamp: 0,
        remainingHours: 9999,
        remainingText: "\u5F85\u5B9A",
        status: "pending",
        urgency: "normal",
        url: `/assignment/index.jsp?assignID=${id}`
      });
    }
  }
  return assignments;
}
function parseAssignmentIndexHtml(html, nowMs = Date.now()) {
  const dateMatch = html.match(/截止时间[：:\s]*(\d{4}[-/]\d{1,2}[-/]\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?)/i) || html.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?)/);
  const deadline = dateMatch ? dateMatch[1] : void 0;
  const { timestamp, remainingHours, remainingText } = deadline ? parseDeadline(deadline, nowMs) : { timestamp: 0, remainingHours: 9999, remainingText: "\u672A\u8BBE\u622A\u6B62\u65F6\u95F4" };
  const titleMatch = html.match(/<b>([\s\S]*?)<\/b>/i) || html.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : void 0;
  const problems = [];
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let trMatch;
  while ((trMatch = trRegex.exec(html)) !== null) {
    const row = trMatch[1];
    if (/<th[^>]*>#<\/th>/i.test(row)) continue;
    const proLinkMatch = row.match(/href=["'][^"']*programList\.jsp\?proNum=(\d+)&assignID=(\d+)["'][^>]*>([\s\S]*?)<\/a>/i);
    const judgeLinkMatch = row.match(/problemID=(\d+)/i);
    if (proLinkMatch) {
      const index = parseInt(proLinkMatch[1], 10);
      const proTitle = proLinkMatch[3].replace(/<[^>]+>/g, "").trim();
      const problemId = judgeLinkMatch ? judgeLinkMatch[1] : `pro_${index}`;
      const scoreMatch = row.match(/<td>\s*(\d+(?:\.\d+)?)\s*<\/td>/i);
      const score = scoreMatch ? parseFloat(scoreMatch[1]) : void 0;
      problems.push({
        index,
        id: problemId,
        title: proTitle,
        score
      });
    }
  }
  return {
    title,
    deadline,
    deadlineTimestamp: timestamp,
    remainingHours,
    remainingText,
    problems
  };
}
function parseProblemTestCases(html) {
  const testCases = [];
  const sampleRegex = /(?:样例输入|输入样例|Sample Input)[\s\S]*?<pre[^>]*>([\s\S]*?)<\/pre>[\s\S]*?(?:样例输出|输出样例|Sample Output)[\s\S]*?<pre[^>]*>([\s\S]*?)<\/pre>/gi;
  let match;
  let idx = 1;
  while ((match = sampleRegex.exec(html)) !== null) {
    testCases.push({
      index: idx++,
      input: cleanCodeBlock(match[1]),
      output: cleanCodeBlock(match[2])
    });
  }
  if (testCases.length === 0) {
    const preRegex = /<pre[^>]*>([\s\S]*?)<\/pre>/gi;
    const blocks = [];
    let preMatch;
    while ((preMatch = preRegex.exec(html)) !== null) {
      blocks.push(cleanCodeBlock(preMatch[1]));
    }
    for (let i = 0; i < blocks.length - 1; i += 2) {
      testCases.push({
        index: i / 2 + 1,
        input: blocks[i],
        output: blocks[i + 1]
      });
    }
  }
  return testCases;
}
function cleanCodeBlock(raw) {
  return raw.replace(/<br\s*\/?>/gi, "\n").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}
function parseProblemDetailHtml(problemId, html) {
  const contentMatch = html.match(/<div[^>]*class=["'][^"']*cgProblemContentClass[^"']*["'][^>]*>([\s\S]*?)<\/div>/i) || html.match(/<div[^>]*id=["']cgpreviewmarkdown["'][^>]*>([\s\S]*?)<\/div>/i);
  const descHtml = contentMatch ? contentMatch[1] : html;
  const descText = descHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const codeMatch = html.match(/<textarea[^>]*id=["']cgsoucecode["'][^>]*>([\s\S]*?)<\/textarea>/i);
  const currentCode = codeMatch ? codeMatch[1].trim() : void 0;
  const testCases = parseProblemTestCases(html);
  return {
    id: problemId,
    title: `\u9898\u76EE ${problemId}`,
    descriptionHtml: descHtml,
    descriptionText: descText,
    testCases,
    currentCode
  };
}
function parseSubmissionResultHtml(html) {
  const results = [];
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let trMatch;
  while ((trMatch = trRegex.exec(html)) !== null) {
    const row = trMatch[1];
    if (/<th/i.test(row)) continue;
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const tds = [];
    let tdMatch;
    while ((tdMatch = tdRegex.exec(row)) !== null) {
      tds.push(tdMatch[1].replace(/<[^>]+>/g, "").trim());
    }
    if (tds.length >= 6) {
      const runId = tds[0];
      const submitTime = tds[1];
      const problemTitle = tds[3];
      const rawStatus = tds[5];
      let status = "Unknown";
      if (/Accepted|正确|通过|AC/i.test(rawStatus)) status = "Accepted";
      else if (/Wrong Answer|答案错误|WA/i.test(rawStatus)) status = "Wrong Answer";
      else if (/Time Limit|超时|TLE/i.test(rawStatus)) status = "Time Limit Exceeded";
      else if (/Memory Limit|超内存|MLE/i.test(rawStatus)) status = "Memory Limit Exceeded";
      else if (/Compile Error|编译错误|CE/i.test(rawStatus)) status = "Compile Error";
      else if (/Judging|Running|评测中|排队/i.test(rawStatus)) status = "Judging";
      results.push({
        id: runId,
        problemId: problemTitle,
        problemTitle,
        status,
        submitTime
      });
    }
  }
  return results;
}

// src/core/client.ts
var CourseGradingClient = class {
  baseUrl;
  http;
  sessionCookie;
  constructor(config = {}, http = new FetchHttpClient()) {
    this.http = http;
    this.baseUrl = (config.baseUrl || "http://115.156.107.145").replace(/\/+$/, "");
    this.sessionCookie = config.sessionCookie || "";
  }
  setSessionCookie(cookie) {
    this.sessionCookie = cookie;
  }
  getSessionCookie() {
    return this.sessionCookie;
  }
  getAuthHeaders() {
    return this.sessionCookie ? { Cookie: this.sessionCookie } : {};
  }
  /**
   * 登录一体化平台（自动加密密码）
   */
  async login(stid, plainPwd) {
    const encryptedPwd = encryptPassword(plainPwd);
    const body = new URLSearchParams({
      IndexStyle: "1",
      stid,
      pwd: encryptedPwd
    }).toString();
    const responseText = await this.http.post(`${this.baseUrl}/login/loginproc.jsp`, body, {
      "Content-Type": "application/x-www-form-urlencoded"
    });
    if (responseText.includes("loginErr=1") || responseText.includes("\u5BC6\u7801\u9519\u8BEF")) {
      return { success: false, message: "\u8D26\u53F7\u6216\u5BC6\u7801\u9519\u8BEF" };
    }
    if (responseText.includes("loginErr=6")) {
      return { success: false, message: "\u9700\u8981\u8F93\u5165\u9A8C\u8BC1\u7801" };
    }
    return { success: true, message: "\u767B\u5F55\u6210\u529F" };
  }
  /**
   * 获取当前学生加入的所有课程列表
   * 接口: GET /courselist.jsp 或 /main.jsp
   */
  async getCourses() {
    try {
      const html = await this.http.get(`${this.baseUrl}/courselist.jsp`, this.getAuthHeaders());
      let courses = parseCourseListHtml(html);
      if (courses.length === 0) {
        const mainHtml = await this.http.get(`${this.baseUrl}/main.jsp`, this.getAuthHeaders());
        courses = parseCourseListHtml(mainHtml);
      }
      return courses;
    } catch {
      return [];
    }
  }
  /**
   * 切换当前激活课程上下文
   * 接口: GET /courselist.jsp?courseID={id}
   */
  async enterCourse(courseId) {
    await this.http.get(`${this.baseUrl}/courselist.jsp?courseID=${encodeURIComponent(courseId)}`, this.getAuthHeaders());
  }
  /**
   * 查询所有课程中当前未完成的作业与实训
   * 接口: GET /assignment/mainActiveAssigns.jsp 及 /assignment/index.jsp
   */
  async getPendingAssignments(hoursThreshold = 72) {
    const allAssignments = [];
    const seenIds = /* @__PURE__ */ new Set();
    const courses = await this.getCourses();
    if (courses.length > 0) {
      for (const course of courses) {
        try {
          await this.enterCourse(course.id);
          const activeHtml = await this.http.get(
            `${this.baseUrl}/assignment/mainActiveAssigns.jsp`,
            this.getAuthHeaders()
          );
          const list = parseActiveAssignmentsHtml(activeHtml, course.name);
          for (const item of list) {
            if (!seenIds.has(item.id)) {
              seenIds.add(item.id);
              if (item.deadline === "\u672A\u6807\u6CE8\u660E\u786E\u622A\u6B62\u65F6\u95F4" || item.deadline === "\u8BF7\u67E5\u770B\u8BE6\u60C5") {
                try {
                  const detailHtml = await this.http.get(
                    `${this.baseUrl}/assignment/index.jsp?assignID=${item.id}`,
                    this.getAuthHeaders()
                  );
                  const detail = parseAssignmentIndexHtml(detailHtml);
                  if (detail.deadline) {
                    item.deadline = detail.deadline;
                    item.deadlineTimestamp = detail.deadlineTimestamp;
                    item.remainingHours = detail.remainingHours;
                    item.remainingText = detail.remainingText;
                  }
                } catch {
                }
              }
              allAssignments.push(item);
            }
          }
        } catch {
        }
      }
    } else {
      try {
        const activeHtml = await this.http.get(
          `${this.baseUrl}/assignment/mainActiveAssigns.jsp`,
          this.getAuthHeaders()
        );
        const list = parseActiveAssignmentsHtml(activeHtml, "\u5F53\u524D\u8BFE\u7A0B");
        for (const item of list) {
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            allAssignments.push(item);
          }
        }
      } catch {
      }
    }
    return allAssignments.filter((item) => item.status === "pending" && item.remainingHours <= hoursThreshold).sort((a, b) => a.deadlineTimestamp - b.deadlineTimestamp);
  }
  /**
   * 获取题目详情与测试用例
   * 接口: GET /assignment/programList.jsp?proNum={proNum}&assignID={assignId}
   */
  async getProblemDetail(assignId, proNum = 1) {
    const url = `${this.baseUrl}/assignment/programList.jsp?proNum=${proNum}&assignID=${encodeURIComponent(assignId)}`;
    const html = await this.http.get(url, this.getAuthHeaders());
    return parseProblemDetailHtml(`${assignId}_${proNum}`, html);
  }
  /**
   * 查询最新评测结果
   * 接口: GET /acm/problemset_stat.jsp
   */
  async getLatestSubmissions() {
    const url = `${this.baseUrl}/acm/problemset_stat.jsp`;
    const html = await this.http.get(url, this.getAuthHeaders());
    return parseSubmissionResultHtml(html);
  }
  /**
   * 触发死线告警推送
   */
  async triggerPushAlert(config) {
    const threshold = config.hoursThreshold ?? 48;
    const pending = await this.getPendingAssignments(threshold);
    if (pending.length === 0) {
      return { sent: false, count: 0 };
    }
    const { title, markdown, html } = formatNotificationContent(pending);
    try {
      if (config.pushplusToken) {
        await this.http.post("https://www.pushplus.plus/send", {
          token: config.pushplusToken,
          title,
          content: html,
          template: "html"
        });
      }
      if (config.barkUrl) {
        const barkBase = config.barkUrl.replace(/\/+$/, "");
        await this.http.get(`${barkBase}/${encodeURIComponent(title)}/${encodeURIComponent(markdown)}?group=NoDDL`);
      }
      if (config.customWebhookUrl) {
        await this.http.post(config.customWebhookUrl, {
          msg_type: "text",
          content: { text: `${title}

${markdown}` }
        });
      }
      return { sent: true, count: pending.length };
    } catch (err) {
      return { sent: false, count: pending.length, error: String(err) };
    }
  }
};

// src/cli.ts
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "help";
  const getArg = (flag) => {
    const idx = args.indexOf(flag);
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : "";
  };
  const cookie = getArg("--cookie") || process.env.NODD_COOKIE || "";
  const client = new CourseGradingClient({ sessionCookie: cookie });
  switch (command) {
    case "list": {
      const threshold = parseInt(getArg("--threshold") || "72", 10);
      const list = await client.getPendingAssignments(threshold);
      console.log(JSON.stringify({ total: list.length, assignments: list }, null, 2));
      break;
    }
    case "login": {
      const stid = getArg("--stid");
      const pwd = getArg("--pwd");
      if (!stid || !pwd) {
        console.error("\u7528\u6CD5: nodd login --stid <\u5B66\u53F7> --pwd <\u5BC6\u7801>");
        process.exit(1);
      }
      const res = await client.login(stid, pwd);
      console.log(JSON.stringify(res, null, 2));
      process.exit(res.success ? 0 : 1);
    }
    case "detail": {
      const id = getArg("--id");
      if (!id) {
        console.error("\u7528\u6CD5: nodd detail --id <\u9898\u76EEID>");
        process.exit(1);
      }
      const detail = await client.getProblemDetail(id);
      console.log(JSON.stringify(detail, null, 2));
      break;
    }
    case "eval": {
      const subs = await client.getLatestSubmissions();
      console.log(JSON.stringify(subs, null, 2));
      break;
    }
    case "push": {
      const pushplus = getArg("--pushplus");
      const bark = getArg("--bark");
      const threshold = parseInt(getArg("--threshold") || "48", 10);
      const res = await client.triggerPushAlert({
        pushplusToken: pushplus,
        barkUrl: bark,
        hoursThreshold: threshold
      });
      console.log(JSON.stringify(res, null, 2));
      break;
    }
    case "help":
    case "--help":
    case "-h":
    default:
      console.log(`
NoDDL - \u6B66\u6C49\u5927\u5B66\u4E00\u4F53\u5316\u5E73\u53F0\u5DE5\u5177\u5305
---------------------------------------
\u547D\u4EE4\u5217\u8868:
  nodd list [--cookie "..."] [--threshold 72]      \u67E5\u8BE2\u672A\u5B8C\u6210\u4F5C\u4E1A\u4E0EDDL
  nodd login --stid <\u5B66\u53F7> --pwd <\u5BC6\u7801>              \u6D4B\u8BD5\u81EA\u52A8\u52A0\u5BC6\u767B\u5F55
  nodd detail --id <\u9898\u76EEID> [--cookie "..."]        \u83B7\u53D6\u9898\u76EE\u8981\u6C42\u4E0E\u6837\u4F8B
  nodd eval [--cookie "..."]                         \u67E5\u8BE2\u6700\u65B0\u5224\u9898\u7ED3\u679C
  nodd push [--pushplus "..."] [--bark "..."]       \u89E6\u53D1\u6B7B\u7EBF\u63A8\u9001
      `);
      break;
  }
}
main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
//# sourceMappingURL=cli.js.map
//# sourceMappingURL=cli.js.map