#!/usr/bin/env node
import CryptoJS from 'crypto-js';

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
var COURSE_GRADING_SECRET_KEY = "Client8Sess!06ID";
function encryptPassword(password, secretKey = COURSE_GRADING_SECRET_KEY) {
  const key = CryptoJS.enc.Utf8.parse(secretKey);
  const encrypted = CryptoJS.AES.encrypt(password, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  });
  return encrypted.toString();
}

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
      return `\u5DF2\u8D85 DDL ${Math.max(1, Math.round(passedHours))} \u5C0F\u65F6`;
    }
    return `\u5DF2\u8D85 DDL ${Math.floor(passedHours / 24)} \u5929`;
  }
  if (remainingHours < 1) {
    const mins = Math.max(1, Math.round(remainingHours * 60));
    return `\u4EC5\u5269 ${mins} \u5206\u949F`;
  }
  if (remainingHours < 24) {
    const hrs2 = Math.floor(remainingHours);
    const mins = Math.round((remainingHours - hrs2) * 60);
    return mins > 0 ? `\u5269 ${hrs2} \u5C0F\u65F6 ${mins} \u5206` : `\u5269 ${hrs2} \u5C0F\u65F6`;
  }
  const days = Math.floor(remainingHours / 24);
  const hrs = Math.round(remainingHours % 24);
  return hrs > 0 ? `\u5269 ${days} \u5929 ${hrs} \u5C0F\u65F6` : `\u5269 ${days} \u5929`;
}
function extractDeadlineFromText(text) {
  if (!text) return "";
  const range = text.split(/\s*(?:至|到|~|-{2,})\s*/);
  if (range.length > 1) {
    return range[range.length - 1].trim();
  }
  const kw = text.match(/(?:截止|结束)(?:时间|日期)?[:：\s]*([^\n<]+)/i);
  if (kw) return kw[1].trim();
  const cleaned = text.replace(/[年月日]/g, (m) => m === "\u65E5" ? " " : "-");
  const dates = cleaned.match(/\d{1,4}[-/.]\d{1,2}(?:[-/.]\d{1,2})?(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?/g);
  return dates ? dates[dates.length - 1].trim() : text.trim();
}
function parseDeadlineBeijing(rawInput, nowMs = Date.now()) {
  const raw = rawInput.trim();
  if (!raw) {
    return emptyDeadline("\u672A\u6807\u6CE8\u622A\u6B62\u65F6\u95F4");
  }
  const target = extractDeadlineFromText(raw);
  const clean = target.replace(/[年月]/g, "-").replace(/[日号]/g, " ").replace(/[./]/g, "-").replace(/\s+/g, " ").trim();
  const m = clean.match(/(?:(\d{4})-)?(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (!m) {
    return emptyDeadline(raw);
  }
  const curYear = new Date(nowMs).getFullYear();
  const y = m[1] ? parseInt(m[1], 10) : curYear;
  const mo = parseInt(m[2], 10);
  const d = parseInt(m[3], 10);
  const h = m[4] !== void 0 ? parseInt(m[4], 10) : 23;
  const min = m[5] !== void 0 ? parseInt(m[5], 10) : 59;
  const s = m[6] !== void 0 ? parseInt(m[6], 10) : 0;
  const ts = Date.UTC(y, mo - 1, d, h, min, s) - 8 * 3600 * 1e3;
  const remHrs = Number(((ts - nowMs) / 36e5).toFixed(1));
  const pad = (n) => String(n).padStart(2, "0");
  return {
    raw,
    normalized: `${y}-${pad(mo)}-${pad(d)} ${pad(h)}:${pad(min)}:${pad(s)}`,
    timestamp: ts,
    remainingHours: remHrs,
    remainingText: formatRemainingTime(remHrs),
    urgency: calculateUrgency(remHrs)
  };
}
function emptyDeadline(rawText) {
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
  const list = [];
  const seen = /* @__PURE__ */ new Set();
  const linkRe = /<a[^>]*href=["'][^"']*courselist\.jsp\?courseID=([a-zA-Z0-9_-]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = linkRe.exec(html)) !== null) {
    const id = m[1];
    const name = m[2].replace(/<[^>]+>/g, "").trim();
    if (id && name && !seen.has(id)) {
      seen.add(id);
      list.push({ id, name });
    }
  }
  const spanRe = /<span[^>]*class=["'][^"']*dropdown-item-course[^"']*["'][^>]*value=["']([a-zA-Z0-9_-]+)["'][^>]*>([\s\S]*?)<\/span>/gi;
  while ((m = spanRe.exec(html)) !== null) {
    const id = m[1];
    const name = m[2].replace(/<[^>]+>/g, "").trim();
    if (id && name && !seen.has(id)) {
      seen.add(id);
      list.push({ id, name });
    }
  }
  return list;
}
function parseActiveAssignmentsHtml(html, courseName = "\u5F53\u524D\u8BFE\u7A0B", nowMs = Date.now()) {
  const list = [];
  const seen = /* @__PURE__ */ new Set();
  let activeSection = html;
  const historyIdx = html.search(/fas\s+fa-history|历史作业/i);
  if (historyIdx !== -1) {
    const clockIdx = html.search(/fas\s+fa-clock|当前作业|进行中/i);
    if (clockIdx !== -1 && clockIdx < historyIdx) {
      activeSection = html.slice(clockIdx, historyIdx);
    } else {
      activeSection = html.slice(0, historyIdx);
    }
  }
  const linkRe = /<a[^>]*href=["']([^"']*assignID=([a-zA-Z0-9_-]+)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = linkRe.exec(activeSection)) !== null) {
    const rawUrl = m[1];
    const id = m[2];
    const title = m[3].replace(/<[^>]+>/g, "").trim();
    if (!title || seen.has(id)) continue;
    if (/^(?:详细|提交|查看|重做|编辑|删除)$/.test(title)) continue;
    seen.add(id);
    const matchPos = m.index;
    const ctx = activeSection.slice(Math.max(0, matchPos - 200), Math.min(activeSection.length, matchPos + 350));
    const ddl = parseDeadlineBeijing(ctx, nowMs);
    list.push({
      id,
      courseName,
      title,
      deadline: ddl.timestamp > 0 ? ddl.normalized : "\u8BF7\u67E5\u770B\u8BE6\u60C5",
      deadlineTimestamp: ddl.timestamp,
      remainingHours: ddl.remainingHours,
      remainingText: ddl.remainingText,
      status: "pending",
      urgency: ddl.urgency,
      url: rawUrl.startsWith("/") ? rawUrl : `/assignment/${rawUrl}`
    });
  }
  if (list.length === 0) {
    const blockRe = /<div[^>]*class=["'][^"']*main-zy[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi;
    let bm;
    while ((bm = blockRe.exec(html)) !== null) {
      const block = bm[1];
      const linkM = block.match(/href=["']([^"']*assignID=([a-zA-Z0-9_-]+)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/i);
      if (!linkM) continue;
      const rawUrl = linkM[1];
      const id = linkM[2];
      if (seen.has(id)) continue;
      seen.add(id);
      const title = linkM[3].replace(/<[^>]+>/g, "").trim() || `\u4F5C\u4E1A ${id}`;
      const ddl = parseDeadlineBeijing(block, nowMs);
      list.push({
        id,
        courseName,
        title,
        deadline: ddl.timestamp > 0 ? ddl.normalized : "\u8BF7\u67E5\u770B\u8BE6\u60C5",
        deadlineTimestamp: ddl.timestamp,
        remainingHours: ddl.remainingHours,
        remainingText: ddl.remainingText,
        status: "pending",
        urgency: ddl.urgency,
        url: rawUrl.startsWith("/") ? rawUrl : `/assignment/${rawUrl}`
      });
    }
  }
  return list;
}
function parseAssignmentDetailHtml(html, nowMs = Date.now()) {
  const ddl = parseDeadlineBeijing(html, nowMs);
  const titleM = html.match(/(?:当前作业|作业名称)[：:\s]*<b>([^<]+)<\/b>/i) || html.match(/<b>([^<]{2,40})<\/b>\s*<p>[^<]*作业时间/i) || html.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i);
  const title = titleM ? titleM[1].replace(/<[^>]+>/g, "").trim() : void 0;
  return {
    title,
    deadline: ddl.timestamp > 0 ? ddl.normalized : void 0,
    deadlineTimestamp: ddl.timestamp,
    remainingHours: ddl.remainingHours,
    remainingText: ddl.remainingText
  };
}
function parseTestCases(html) {
  const cases = [];
  const re = /(?:样例输入|输入样例|Sample Input)[\s\S]*?<pre[^>]*>([\s\S]*?)<\/pre>[\s\S]*?(?:样例输出|输出样例|Sample Output)[\s\S]*?<pre[^>]*>([\s\S]*?)<\/pre>/gi;
  let m;
  let idx = 1;
  while ((m = re.exec(html)) !== null) {
    cases.push({
      index: idx++,
      input: cleanCode(m[1]),
      output: cleanCode(m[2])
    });
  }
  return cases;
}
function cleanCode(s) {
  return s.replace(/<br\s*\/?>/gi, "\n").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}
function parseProblemDetailHtml(problemId, html) {
  const contentM = html.match(/<div[^>]*class=["'][^"']*cgProblemContentClass[^"']*["'][^>]*>([\s\S]*?)<\/div>/i) || html.match(/<div[^>]*id=["']cgpreviewmarkdown["'][^>]*>([\s\S]*?)<\/div>/i);
  const descHtml = contentM ? contentM[1] : html;
  const descText = descHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const codeM = html.match(/<textarea[^>]*id=["']cgsoucecode["'][^>]*>([\s\S]*?)<\/textarea>/i);
  const currentCode = codeM ? codeM[1].trim() : void 0;
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
  const list = [];
  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let m;
  while ((m = trRe.exec(html)) !== null) {
    const row = m[1];
    if (/<th/i.test(row)) continue;
    const tds = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((t) => t[1].replace(/<[^>]+>/g, "").trim());
    if (tds.length >= 6) {
      const rawStatus = tds[5];
      let status = "Unknown";
      if (/Accepted|正确|通过|AC/i.test(rawStatus)) status = "Accepted";
      else if (/Wrong Answer|答案错误|WA/i.test(rawStatus)) status = "Wrong Answer";
      else if (/Time Limit|超时|TLE/i.test(rawStatus)) status = "Time Limit Exceeded";
      else if (/Memory Limit|超内存|MLE/i.test(rawStatus)) status = "Memory Limit Exceeded";
      else if (/Compile Error|编译错误|CE/i.test(rawStatus)) status = "Compile Error";
      else if (/Judging|Running|评测中|排队/i.test(rawStatus)) status = "Judging";
      list.push({
        id: tds[0],
        problemId: tds[3],
        problemTitle: tds[3],
        status,
        submitTime: tds[1]
      });
    }
  }
  return list;
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
   * 获取学生加入的课程列表（只读查询）
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
   * 查询当前激活课程中的活跃作业与实训
   * 【核心原则】严禁在后台静默请求 /courselist.jsp?courseID=xxx 篡改用户的会话上下文，
   * 仅只读请求当前课程作业页面，绝不影响浏览器当前课程状态。
   */
  async getPendingAssignments(hoursThreshold = 72) {
    const allAssignments = [];
    const seenIds = /* @__PURE__ */ new Set();
    try {
      const indexHtml = await this.http.get(
        `${this.baseUrl}/assignment/index.jsp`,
        this.getAuthHeaders()
      );
      const list = parseActiveAssignmentsHtml(indexHtml, "\u5F53\u524D\u8BFE\u7A0B");
      for (const item of list) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          allAssignments.push(item);
        }
      }
    } catch {
    }
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
    for (const item of allAssignments) {
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
    }
    return allAssignments.filter((item) => item.status === "pending").sort((a, b) => {
      if (a.remainingHours > 0 && b.remainingHours <= 0) return -1;
      if (a.remainingHours <= 0 && b.remainingHours > 0) return 1;
      if (a.remainingHours > 0 && b.remainingHours > 0) {
        return a.deadlineTimestamp - b.deadlineTimestamp;
      }
      return b.deadlineTimestamp - a.deadlineTimestamp;
    });
  }
  /**
   * 获取题目详情与测试用例（兼容 programList.jsp 与 fileUploadList.jsp）
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
   * 触发 DDL 告警推送
   */
  async triggerPushAlert(config) {
    const threshold = config.hoursThreshold ?? 48;
    const allPending = await this.getPendingAssignments(threshold);
    const activeUrgent = allPending.filter((a) => a.remainingHours > 0 && a.remainingHours <= threshold);
    if (activeUrgent.length === 0) {
      return { sent: false, count: 0 };
    }
    const title = `\u3010NoDDL \u63D0\u9192\u3011\u6709 ${activeUrgent.length} \u9879\u4F5C\u4E1A\u5373\u5C06\u5230\u8FBE DDL`;
    const markdown = [
      `### \u{1F514} NoDDL \u4F5C\u4E1A DDL \u63D0\u9192`,
      `\u5F53\u524D\u6709 **${activeUrgent.length}** \u9879\u4F5C\u4E1A\u5373\u5C06\u622A\u6B62\uFF1A`,
      "",
      ...activeUrgent.map((item, idx) => `${idx + 1}. [${item.courseName}] ${item.title} (\u622A\u6B62: ${item.deadline}, ${item.remainingText})`)
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
      return { sent: true, count: activeUrgent.length };
    } catch (err) {
      return { sent: false, count: activeUrgent.length, error: String(err) };
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