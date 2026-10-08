import CryptoJS from 'crypto-js';

// src/core/crypto.ts
var COURSE_GRADING_SECRET_KEY = "Client8Sess!06ID";
function encryptPassword(password, secretKey = COURSE_GRADING_SECRET_KEY) {
  const key = CryptoJS.enc.Utf8.parse(secretKey);
  const encrypted = CryptoJS.AES.encrypt(password, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  });
  return encrypted.toString();
}
function decryptPassword(ciphertext, secretKey = COURSE_GRADING_SECRET_KEY) {
  const key = CryptoJS.enc.Utf8.parse(secretKey);
  const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  });
  return decrypted.toString(CryptoJS.enc.Utf8);
}

// src/core/http.ts
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
      throw new Error(`GET ${url} \u54CD\u5E94\u9519\u8BEF: ${res.status}`);
    }
    return res.text();
  }
  async post(url, data, headers = {}) {
    let bodyStr;
    const finalHeaders = { ...this.defaultHeaders, ...headers };
    if (typeof data === "string") {
      bodyStr = data;
      if (!finalHeaders["Content-Type"]) {
        finalHeaders["Content-Type"] = "application/x-www-form-urlencoded";
      }
    } else {
      bodyStr = JSON.stringify(data);
      if (!finalHeaders["Content-Type"]) {
        finalHeaders["Content-Type"] = "application/json";
      }
    }
    const res = await fetch(url, {
      method: "POST",
      headers: finalHeaders,
      body: bodyStr
    });
    if (!res.ok) {
      throw new Error(`POST ${url} \u54CD\u5E94\u9519\u8BEF: ${res.status}`);
    }
    return res.text();
  }
};

// src/core/time.ts
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
      return `\u5DF2\u622A\u6B62 ${Math.max(1, Math.round(passedHours))} \u5C0F\u65F6`;
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
function parseDeadlineBeijing(rawDeadlineStr, nowMs = Date.now()) {
  const raw = rawDeadlineStr.trim();
  if (!raw) {
    return createEmptyDeadline("\u672A\u6807\u6CE8\u622A\u6B62\u65F6\u95F4");
  }
  let cleaned = raw.replace(/[年月]/g, "-").replace(/[日号]/g, " ").replace(/\./g, "-").replace(/\//g, "-").replace(/\s+/g, " ").trim();
  const fullMatch = cleaned.match(/(?:截止[：:\s]*)?(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  const noYearMatch = cleaned.match(/(?:截止[：:\s]*)?(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  let year;
  let month;
  let day;
  let hour = 23;
  let minute = 59;
  let second = 0;
  const currentYear = new Date(nowMs).getFullYear();
  if (fullMatch && fullMatch[1]) {
    year = parseInt(fullMatch[1], 10);
    month = parseInt(fullMatch[2], 10);
    day = parseInt(fullMatch[3], 10);
    if (fullMatch[4] !== void 0) hour = parseInt(fullMatch[4], 10);
    if (fullMatch[5] !== void 0) minute = parseInt(fullMatch[5], 10);
    if (fullMatch[6] !== void 0) second = parseInt(fullMatch[6], 10);
  } else if (noYearMatch && noYearMatch[1]) {
    year = currentYear;
    month = parseInt(noYearMatch[1], 10);
    day = parseInt(noYearMatch[2], 10);
    if (noYearMatch[3] !== void 0) hour = parseInt(noYearMatch[3], 10);
    if (noYearMatch[4] !== void 0) minute = parseInt(noYearMatch[4], 10);
    if (noYearMatch[5] !== void 0) second = parseInt(noYearMatch[5], 10);
  } else {
    return createEmptyDeadline(raw);
  }
  const beijingTimestamp = Date.UTC(year, month - 1, day, hour, minute, second) - 8 * 3600 * 1e3;
  const diffMs = beijingTimestamp - nowMs;
  const remainingHours = Number((diffMs / (1e3 * 60 * 60)).toFixed(1));
  const remainingText = formatRemainingTime(remainingHours);
  const urgency = calculateUrgency(remainingHours);
  const pad = (n) => String(n).padStart(2, "0");
  const normalized = `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}:${pad(second)}`;
  return {
    raw,
    normalized,
    timestamp: beijingTimestamp,
    remainingHours,
    remainingText,
    urgency
  };
}
function createEmptyDeadline(rawText) {
  return {
    raw: rawText,
    normalized: rawText,
    timestamp: 0,
    remainingHours: 9999,
    remainingText: "\u5F85\u5B9A",
    urgency: "normal"
  };
}

// src/core/parsers.ts
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
    const dateMatch = block.match(/(?:截止[：:\s]*)?(\d{4}[-/年.]\d{1,2}[-/月.]\d{1,2}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?)/) || block.match(/(?:截止[：:\s]*)?(\d{1,2}[-/月.]\d{1,2}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?)/);
    const rawDeadline = dateMatch ? dateMatch[1] : "";
    const parsed = parseDeadlineBeijing(rawDeadline, nowMs);
    let status = "pending";
    if (/已打分|得分|满分/i.test(block)) status = "graded";
    else if (/已提交|评测中/i.test(block)) status = "submitted";
    assignments.push({
      id,
      courseName,
      title,
      deadline: rawDeadline ? parsed.normalized : "\u8BF7\u67E5\u770B\u8BE6\u60C5",
      deadlineTimestamp: parsed.timestamp,
      remainingHours: parsed.remainingHours,
      remainingText: parsed.remainingText,
      status,
      urgency: parsed.urgency,
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
function parseAssignmentDetailHtml(html, nowMs = Date.now()) {
  const dateMatch = html.match(/截止时间[：:\s]*([\d\-/年. :]+)/i) || html.match(/(\d{4}[-/年.]\d{1,2}[-/月.]\d{1,2}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?)/);
  const rawDeadline = dateMatch ? dateMatch[1].trim() : "";
  const parsed = parseDeadlineBeijing(rawDeadline, nowMs);
  const titleMatch = html.match(/<b>([\s\S]*?)<\/b>/i) || html.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : void 0;
  return {
    title,
    deadline: rawDeadline ? parsed.normalized : void 0,
    deadlineTimestamp: parsed.timestamp,
    remainingHours: parsed.remainingHours,
    remainingText: parsed.remainingText
  };
}
function parseTestCases(html) {
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
  return {
    id: problemId,
    title: `\u9898\u76EE ${problemId}`,
    descriptionHtml: descHtml,
    descriptionText: descText,
    testCases: parseTestCases(html),
    currentCode
  };
}
function parseSubmissionsHtml(html) {
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
   * 登录平台（自动使用固定 AES 密钥加密）
   */
  async login(stid, plainPwd) {
    const encryptedPwd = encryptPassword(plainPwd);
    const body = new URLSearchParams({
      IndexStyle: "1",
      stid,
      pwd: encryptedPwd
    }).toString();
    const responseText = await this.http.post(`${this.baseUrl}/login/loginproc.jsp`, body);
    if (responseText.includes("loginErr=1") || responseText.includes("\u5BC6\u7801\u9519\u8BEF")) {
      return { success: false, message: "\u8D26\u53F7\u6216\u5BC6\u7801\u9519\u8BEF" };
    }
    if (responseText.includes("loginErr=6")) {
      return { success: false, message: "\u9700\u8981\u8F93\u5165\u56FE\u5F62\u9A8C\u8BC1\u7801" };
    }
    return { success: true, message: "\u767B\u5F55\u6210\u529F" };
  }
  /**
   * 获取学生加入的课程列表
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
   */
  async enterCourse(courseId) {
    await this.http.get(`${this.baseUrl}/courselist.jsp?courseID=${encodeURIComponent(courseId)}`, this.getAuthHeaders());
  }
  /**
   * 汇聚所有课程中未完成的作业与实训
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
              if (item.deadline === "\u8BF7\u67E5\u770B\u8BE6\u60C5" || item.deadlineTimestamp === 0) {
                try {
                  const detailHtml = await this.http.get(
                    `${this.baseUrl}/assignment/index.jsp?assignID=${item.id}`,
                    this.getAuthHeaders()
                  );
                  const detail = parseAssignmentDetailHtml(detailHtml);
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
   */
  async getProblemDetail(assignId, proNum = 1) {
    const url = `${this.baseUrl}/assignment/programList.jsp?proNum=${proNum}&assignID=${encodeURIComponent(assignId)}`;
    const html = await this.http.get(url, this.getAuthHeaders());
    return parseProblemDetailHtml(`${assignId}_${proNum}`, html);
  }
  /**
   * 查询最新评测结果
   */
  async getLatestSubmissions() {
    const url = `${this.baseUrl}/acm/problemset_stat.jsp`;
    const html = await this.http.get(url, this.getAuthHeaders());
    return parseSubmissionsHtml(html);
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
    const urgentCount = pending.filter((a) => a.urgency === "critical" || a.urgency === "urgent").length;
    const title = `\u3010NoDDL \u9884\u8B66\u3011\u6709 ${pending.length} \u9879\u4F5C\u4E1A\u5F85\u63D0\u4EA4\uFF08${urgentCount} \u9879\u7D27\u6025\uFF09`;
    const markdown = [
      `### \u{1F514} NoDDL \u4F5C\u4E1A\u6B7B\u7EBF\u63D0\u9192`,
      `\u5F53\u524D\u6709 **${pending.length}** \u9879\u672A\u4EA4\u4F5C\u4E1A\uFF1A`,
      "",
      ...pending.map((item, idx) => `${idx + 1}. [${item.courseName}] ${item.title} (\u622A\u6B62: ${item.deadline}, ${item.remainingText})`)
    ].join("\n");
    try {
      if (config.pushplusToken) {
        await this.http.post("https://www.pushplus.plus/send", {
          token: config.pushplusToken,
          title,
          content: markdown.replace(/\n/g, "<br>"),
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

export { COURSE_GRADING_SECRET_KEY, CourseGradingClient, FetchHttpClient, calculateUrgency, decryptPassword, encryptPassword, formatRemainingTime, parseActiveAssignmentsHtml, parseAssignmentDetailHtml, parseCourseListHtml, parseDeadlineBeijing, parseProblemDetailHtml, parseSubmissionsHtml, parseTestCases };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map