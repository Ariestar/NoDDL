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
function parseHomeworkListHtml(html, nowMs = Date.now()) {
  const results = [];
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let trMatch;
  while ((trMatch = trRegex.exec(html)) !== null) {
    const rowHtml = trMatch[1];
    if (/<th/i.test(rowHtml)) continue;
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const tds = [];
    let tdMatch;
    while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
      const text = tdMatch[1].replace(/<[^>]+>/g, "").trim();
      tds.push(text);
    }
    if (tds.length >= 4) {
      const idMatch = rowHtml.match(/id=([a-zA-Z0-9_-]+)/i);
      const urlMatch = rowHtml.match(/href=["']([^"']+)["']/i);
      const dateMatch = rowHtml.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?)/);
      const deadlineStr = dateMatch ? dateMatch[1] : "";
      let status = "pending";
      if (/已评测|已打分|满分|得分/i.test(rowHtml)) {
        status = "graded";
      } else if (/已提交|评测中|重交/i.test(rowHtml)) {
        status = "submitted";
      } else if (/未交|未提交|未完成|进行中/i.test(rowHtml)) {
        status = "pending";
      }
      if (deadlineStr) {
        const { timestamp, remainingHours, remainingText } = parseDeadline(deadlineStr, nowMs);
        const urgency = calculateUrgency(remainingHours);
        const title = tds[1] || tds[0] || "\u672A\u77E5\u4F5C\u4E1A";
        const courseName = tds.length > 4 ? tds[0] : "\u4E13\u4E1A\u8BFE\u7A0B";
        results.push({
          id: idMatch ? idMatch[1] : `hw_${results.length + 1}`,
          courseName,
          title,
          deadline: deadlineStr,
          deadlineTimestamp: timestamp,
          remainingHours,
          remainingText,
          status,
          urgency,
          url: urlMatch ? urlMatch[1] : void 0
        });
      }
    }
  }
  if (results.length === 0) {
    const cardRegex = /class=["'][^"']*(?:homework|task|exp-item)[^"']*["'][^>]*>([\s\S]*?)(?=class=["'][^"']*(?:homework|task|exp-item)|$)/gi;
    let cardMatch;
    while ((cardMatch = cardRegex.exec(html)) !== null) {
      const card = cardMatch[1];
      const dateMatch = card.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?)/);
      if (dateMatch) {
        const titleMatch = card.match(/<h[345][^>]*>([^<]+)<\/h[345]>/i) || card.match(/title=["']([^"']+)["']/i);
        const deadlineStr = dateMatch[1];
        const { timestamp, remainingHours, remainingText } = parseDeadline(deadlineStr, nowMs);
        results.push({
          id: `card_${results.length + 1}`,
          courseName: "\u4EBA\u5DE5\u667A\u80FD\u4E13\u4E1A\u8BFE",
          title: titleMatch ? titleMatch[1].trim() : "\u5B9E\u8BAD\u4EFB\u52A1",
          deadline: deadlineStr,
          deadlineTimestamp: timestamp,
          remainingHours,
          remainingText,
          status: /未提交|待完成/i.test(card) ? "pending" : "submitted",
          urgency: calculateUrgency(remainingHours)
        });
      }
    }
  }
  return results;
}
function parseProblemTestCases(html) {
  const testCases = [];
  const sampleRegex = /(?:样例输入|输入样例|Sample Input)[\s\S]*?<pre[^>]*>([\s\S]*?)<\/pre>[\s\S]*?(?:样例输出|输出样例|Sample Output)[\s\S]*?<pre[^>]*>([\s\S]*?)<\/pre>/gi;
  let match;
  let idx = 1;
  while ((match = sampleRegex.exec(html)) !== null) {
    const input = cleanCodeBlock(match[1]);
    const output = cleanCodeBlock(match[2]);
    testCases.push({ index: idx++, input, output });
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
  const titleMatch = html.match(/<h[123][^>]*>([\s\S]*?)<\/h[123]>/i);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : `\u9898\u76EE ${problemId}`;
  const testCases = parseProblemTestCases(html);
  const plainText = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return {
    id: problemId,
    title,
    descriptionHtml: html,
    descriptionText: plainText,
    testCases
  };
}
function parseSubmissionResultHtml(html) {
  const results = [];
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let trMatch;
  while ((trMatch = trRegex.exec(html)) !== null) {
    const row = trMatch[1];
    if (/<th/i.test(row)) continue;
    let status = "Unknown";
    if (/Accepted|正确|通过|AC/i.test(row)) status = "Accepted";
    else if (/Wrong Answer|答案错误|WA/i.test(row)) status = "Wrong Answer";
    else if (/Time Limit|超时|TLE/i.test(row)) status = "Time Limit Exceeded";
    else if (/Memory Limit|超内存|MLE/i.test(row)) status = "Memory Limit Exceeded";
    else if (/Compile Error|编译错误|CE/i.test(row)) status = "Compile Error";
    else if (/Judging|Running|评测中/i.test(row)) status = "Judging";
    const idMatch = row.match(/runid=([0-9]+)|submission[_-]?id=([0-9]+)/i);
    const dateMatch = row.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?)/);
    if (idMatch || dateMatch) {
      results.push({
        id: idMatch ? idMatch[1] || idMatch[2] : `sub_${results.length + 1}`,
        problemId: "unknown",
        status,
        submitTime: dateMatch ? dateMatch[1] : (/* @__PURE__ */ new Date()).toISOString()
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
   * 登录平台（自动使用固定密钥加密密码）
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
    if (responseText.includes("\u5BC6\u7801\u9519\u8BEF") || responseText.includes("\u7528\u6237\u4E0D\u5B58\u5728")) {
      return { success: false, message: "\u8D26\u53F7\u6216\u5BC6\u7801\u9519\u8BEF" };
    }
    return { success: true, message: "\u767B\u5F55\u6210\u529F" };
  }
  /**
   * 获取所有未提交且按截止时间升序排序的作业列表
   */
  async getPendingAssignments(hoursThreshold = 72) {
    const endpoints = [
      `${this.baseUrl}/pages`,
      `${this.baseUrl}/sv2/indexexp/index.jsp`,
      `${this.baseUrl}/student/homework`
    ];
    const allAssignments = [];
    const seenIds = /* @__PURE__ */ new Set();
    for (const url of endpoints) {
      try {
        const html = await this.http.get(url, this.getAuthHeaders());
        for (const item of parseHomeworkListHtml(html)) {
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
  async getProblemDetail(problemId) {
    const url = `${this.baseUrl}/pages/problem/detail.jsp?id=${encodeURIComponent(problemId)}`;
    const html = await this.http.get(url, this.getAuthHeaders());
    return parseProblemDetailHtml(problemId, html);
  }
  /**
   * 查询最新评测结果
   */
  async getLatestSubmissions() {
    const url = `${this.baseUrl}/acm/index.jsp`;
    const html = await this.http.get(url, this.getAuthHeaders());
    return parseSubmissionResultHtml(html);
  }
  /**
   * 触发死线告警推送（支持 PushPlus / Bark / Webhook）
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