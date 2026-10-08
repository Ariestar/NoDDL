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
    const passed = Math.abs(remainingHours);
    if (passed < 24) {
      return `\u5DF2\u8D85 DDL ${Math.max(1, Math.round(passed))} \u5C0F\u65F6`;
    }
    return `\u5DF2\u8D85 DDL ${Math.floor(passed / 24)} \u5929`;
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
  const xijiTagMatch = text.match(/作业时间[：:\s]*<b[^>]*>[^<]*<\/b>\s*(?:至|到|~)\s*<b[^>]*>([^<]+)<\/b>/i);
  if (xijiTagMatch && xijiTagMatch[1]) {
    return xijiTagMatch[1].trim();
  }
  const tagRangeMatch = text.match(/<b[^>]*>[^<]*<\/b>\s*(?:至|到|~)\s*<b[^>]*>([\d\-/年月日. :]+)<\/b>/i);
  if (tagRangeMatch && tagRangeMatch[1]) {
    return tagRangeMatch[1].trim();
  }
  const rangeParts = text.split(/\s*(?:至|到|~)\s*/);
  if (rangeParts.length > 1) {
    const candidate = rangeParts[rangeParts.length - 1].trim();
    const dateM = candidate.match(/\b(?:\d{4}[-/.年])?\d{1,2}[-/.月]\d{1,2}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?\b/);
    if (dateM) return dateM[0].trim();
  }
  const kwMatch = text.match(/(?:截止|结束)(?:时间|日期)?[:：\s]*([\d\-/年月日. :]+)/i);
  if (kwMatch && kwMatch[1]) {
    return kwMatch[1].trim();
  }
  const exactDateMatch = text.trim().match(/^(\d{4}[-/.年]\d{1,2}[-/.月]\d{1,2}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?)$/);
  if (exactDateMatch && exactDateMatch[1]) {
    return exactDateMatch[1].trim();
  }
  return "";
}
function parseDeadlineBeijing(rawInput, nowMs = Date.now()) {
  const raw = rawInput.trim();
  if (!raw) {
    return emptyDeadline("\u672A\u6807\u6CE8\u622A\u6B62\u65F6\u95F4");
  }
  const extracted = extractDeadlineFromText(raw);
  if (!extracted) {
    return emptyDeadline(raw);
  }
  const clean = extracted.replace(/[年月]/g, "-").replace(/[日号]/g, " ").replace(/[./]/g, "-").replace(/\s+/g, " ").trim();
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
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h < 0 || h > 23 || min < 0 || min > 59) {
    return emptyDeadline(raw);
  }
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
    normalized: "\u8BF7\u67E5\u770B\u8BE6\u60C5",
    timestamp: 0,
    remainingHours: 9999,
    remainingText: "\u5F85\u5B9A",
    urgency: "normal"
  };
}

// src/core/parsers.ts
function parseActiveCourseInfo(html) {
  const activeCourseM = html.match(/<span[^>]*class=["'][^"']*dropdown-item-course[^"']*font-weight-bold[^"']*["'][^>]*value=["']([^"']+)["'][^>]*>([\s\S]*?)<\/span>/i);
  if (activeCourseM) {
    return {
      id: activeCourseM[1],
      name: activeCourseM[2].replace(/<[^>]+>/g, "").trim()
    };
  }
  return {};
}
function parseCourseListHtml(html) {
  const list = [];
  const seen = /* @__PURE__ */ new Set();
  const spanRe = /<span[^>]*class=["'][^"']*dropdown-item-course[^"']*["'][^>]*value=["']([a-zA-Z0-9_-]+)["'][^>]*>([\s\S]*?)<\/span>/gi;
  let m;
  while ((m = spanRe.exec(html)) !== null) {
    const id = m[1];
    const name = m[2].replace(/<[^>]+>/g, "").trim();
    if (id && name && !seen.has(id)) {
      seen.add(id);
      list.push({ id, name });
    }
  }
  const linkRe = /<a[^>]*href=["'][^"']*courselist\.jsp\?courseID=([a-zA-Z0-9_-]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  while ((m = linkRe.exec(html)) !== null) {
    const id = m[1];
    const name = m[2].replace(/<[^>]+>/g, "").trim();
    if (id && name && !seen.has(id)) {
      seen.add(id);
      list.push({ id, name });
    }
  }
  return list;
}
function parseActiveAssignmentsHtml(html, courseName = "", defaultCourseId = "") {
  const list = [];
  const seen = /* @__PURE__ */ new Set();
  let activeSection = html;
  const historyIdx = html.search(/fas\s+fa-history|历史作业/i);
  if (historyIdx !== -1) {
    const clockIdx = html.search(/fas\s+fa-clock|当前作业/i);
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
    if (/^(?:返回|详细|提交|查看|重做|编辑|删除|\d+|文件上传题|程序题)$/.test(title)) continue;
    seen.add(id);
    const courseIdM = rawUrl.match(/courseID=([a-zA-Z0-9_-]+)/i);
    const courseId = courseIdM ? courseIdM[1] : defaultCourseId;
    const finalUrl = courseId ? `/assignment/index.jsp?courseID=${courseId}&assignID=${id}` : `/assignment/index.jsp?assignID=${id}`;
    list.push({
      id,
      courseId,
      courseName,
      title,
      deadline: "\u8BF7\u67E5\u770B\u8BE6\u60C5",
      deadlineTimestamp: 0,
      remainingHours: 9999,
      remainingText: "\u5F85\u5B9A",
      status: "pending",
      urgency: "normal",
      url: finalUrl
    });
  }
  return list;
}
function parseAssignmentDetailHtml(html, nowMs = Date.now()) {
  const h4Match = html.match(/<div[^>]*class=["'][^"']*bg-light[^"']*["'][^>]*>[\s\S]*?<h[3-5][^>]*>([\s\S]*?)<\/h[3-5]>/i) || html.match(/<h[3-5][^>]*>([\s\S]*?)<\/h[3-5]>\s*<p>[^<]*作业时间/i);
  let title = h4Match ? h4Match[1].replace(/<[^>]+>/g, "").trim() : void 0;
  if (!title) {
    const breadcrumbM = html.match(/<ol[^>]*class=["'][^"']*breadcrumb[^"']*["'][^>]*>([\s\S]*?)<\/ol>/i);
    if (breadcrumbM) {
      const items = [...breadcrumbM[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((i) => i[1].replace(/<[^>]+>/g, "").trim());
      if (items.length > 0) {
        title = items[0].replace(/<[^>]+>/g, "").trim();
      }
    }
  }
  const ddl = parseDeadlineBeijing(html, nowMs);
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

// src/core/db.ts
var STORE_STORAGE_KEY = "nodd_normalized_store_v2";
var HomeworkDB = class {
  storage;
  constructor(storage) {
    this.storage = storage;
  }
  async load() {
    try {
      const raw = await this.storage.get(STORE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.version === 2 && parsed.courses && parsed.assignments) {
          return parsed;
        }
      }
    } catch {
    }
    return {
      version: 2,
      lastSync: 0,
      courses: {},
      assignments: {}
    };
  }
  async save(data) {
    data.lastSync = Date.now();
    await this.storage.set(STORE_STORAGE_KEY, JSON.stringify(data));
  }
  /**
   * 注册或更新课程元数据（按 courseId 唯一索引，绝无重复课程）
   */
  async upsertCourse(id, name) {
    if (!id) return;
    const store = await this.load();
    const existing = store.courses[id];
    const finalName = (!existing || existing.name === "\u5F53\u524D\u8BFE\u7A0B") && name !== "\u5F53\u524D\u8BFE\u7A0B" ? name : existing?.name || name;
    store.courses[id] = {
      id,
      name: finalName,
      updatedAt: Date.now()
    };
    for (const a of Object.values(store.assignments)) {
      if (a.courseId === id && a.courseName !== finalName) {
        a.courseName = finalName;
      }
    }
    await this.save(store);
  }
  /**
   * 归一化插入或更新单项作业（以 assignId 为唯一主键）
   */
  async upsertAssignment(item) {
    if (!item.id) return;
    const store = await this.load();
    const existing = store.assignments[item.id];
    const courseId = item.courseId || existing?.courseId || "";
    let courseName = item.courseName || existing?.courseName || "\u4E13\u4E1A\u8BFE\u7A0B";
    if (courseId && store.courses[courseId]) {
      courseName = store.courses[courseId].name;
    } else if (courseId && courseName !== "\u5F53\u524D\u8BFE\u7A0B") {
      store.courses[courseId] = { id: courseId, name: courseName, updatedAt: Date.now() };
    }
    let finalDeadline = item.deadline;
    let finalTimestamp = item.deadlineTimestamp;
    let finalRemHours = item.remainingHours;
    let finalRemText = item.remainingText;
    let finalUrgency = item.urgency;
    if (finalTimestamp === 0 && existing && existing.deadlineTimestamp > 0) {
      finalDeadline = existing.deadline;
      finalTimestamp = existing.deadlineTimestamp;
      finalRemHours = existing.remainingHours;
      finalRemText = existing.remainingText;
      finalUrgency = existing.urgency;
    }
    let finalUrl = item.url || existing?.url || "";
    if (!finalUrl || !finalUrl.includes("courseID") && courseId) {
      finalUrl = courseId ? `/assignment/index.jsp?courseID=${courseId}&assignID=${item.id}` : `/assignment/index.jsp?assignID=${item.id}`;
    }
    store.assignments[item.id] = {
      id: item.id,
      courseId,
      courseName,
      title: item.title || existing?.title || `\u4F5C\u4E1A ${item.id}`,
      deadline: finalDeadline,
      deadlineTimestamp: finalTimestamp,
      remainingHours: finalRemHours,
      remainingText: finalRemText,
      status: item.status || existing?.status || "pending",
      urgency: finalUrgency,
      url: finalUrl,
      updatedAt: Date.now()
    };
    await this.save(store);
  }
  /**
   * 批量归一化更新作业
   */
  async batchUpsertAssignments(items) {
    for (const item of items) {
      await this.upsertAssignment(item);
    }
  }
  /**
   * 获取结构化数据库中全部聚合作业列表，并进行最佳实践排序
   * 排序逻辑：
   * 1. 距离 DDL 越近的进行中作业排在最前
   * 2. 已超期的作业沉底展示
   * 3. 课程名称实时关联 courses 表，保证展示统一规范
   */
  async getAllAssignments() {
    const store = await this.load();
    const records = Object.values(store.assignments);
    const list = records.map((r) => {
      const canonicalName = r.courseId && store.courses[r.courseId]?.name ? store.courses[r.courseId].name : r.courseName && r.courseName !== "\u5F53\u524D\u8BFE\u7A0B" ? r.courseName : "\u4E13\u4E1A\u8BFE\u7A0B";
      const url = !r.url.includes("courseID") && r.courseId ? `/assignment/index.jsp?courseID=${r.courseId}&assignID=${r.id}` : r.url;
      return {
        id: r.id,
        courseId: r.courseId,
        courseName: canonicalName,
        title: r.title,
        deadline: r.deadline,
        deadlineTimestamp: r.deadlineTimestamp,
        remainingHours: r.remainingHours,
        remainingText: r.remainingText,
        status: r.status,
        urgency: r.urgency,
        url
      };
    });
    return list.sort((a, b) => {
      const aActive = a.remainingHours > 0 && a.deadlineTimestamp > 0;
      const bActive = b.remainingHours > 0 && b.deadlineTimestamp > 0;
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      if (aActive && bActive) {
        return a.deadlineTimestamp - b.deadlineTimestamp;
      }
      if (a.deadlineTimestamp > 0 && b.deadlineTimestamp > 0) {
        return b.deadlineTimestamp - a.deadlineTimestamp;
      }
      return (b.deadlineTimestamp || 0) - (a.deadlineTimestamp || 0);
    });
  }
};

// src/core/client.ts
var CourseGradingClient = class {
  baseUrl;
  http;
  sessionCookie;
  db;
  constructor(config = {}, http = new FetchHttpClient(), storage) {
    this.http = http;
    this.baseUrl = (config.baseUrl || "http://115.156.107.145").replace(/\/+$/, "");
    this.sessionCookie = config.sessionCookie || "";
    if (storage) {
      this.db = new HomeworkDB(storage);
    }
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
   * 切换当前激活课程上下文
   */
  async enterCourse(courseId) {
    await this.http.get(`${this.baseUrl}/courselist.jsp?courseID=${encodeURIComponent(courseId)}`, this.getAuthHeaders());
  }
  /**
   * 只读读取当前活跃课程的作业列表（不篡改 Session 状态）
   */
  async getPendingAssignments(hoursThreshold = 72) {
    const allAssignments = [];
    const seenIds = /* @__PURE__ */ new Set();
    try {
      const indexHtml = await this.http.get(
        `${this.baseUrl}/assignment/index.jsp`,
        this.getAuthHeaders()
      );
      const activeCourse = parseActiveCourseInfo(indexHtml);
      const courseId = activeCourse.id || "";
      const courseName = activeCourse.name || "";
      if (this.db && courseId && courseName) {
        await this.db.upsertCourse(courseId, courseName);
      }
      const list = parseActiveAssignmentsHtml(indexHtml, courseName, courseId);
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
          const detailUrl = item.courseId ? `${this.baseUrl}/assignment/index.jsp?courseID=${item.courseId}&assignID=${item.id}` : `${this.baseUrl}/assignment/index.jsp?assignID=${item.id}`;
          const detailHtml = await this.http.get(detailUrl, this.getAuthHeaders());
          const detail = parseAssignmentDetailHtml(detailHtml);
          if (detail.deadlineTimestamp > 0) {
            item.deadline = detail.deadline;
            item.deadlineTimestamp = detail.deadlineTimestamp;
            item.remainingHours = detail.remainingHours;
            item.remainingText = detail.remainingText;
            item.urgency = calculateUrgency(detail.remainingHours);
          }
        } catch {
        }
      }
      if (this.db) {
        await this.db.upsertAssignment(item);
      }
    }
    if (this.db) {
      return this.db.getAllAssignments();
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
   * 全量安全同步所有课程的作业并持久化存入数据库
   * 【核心保障】爬取前记录当前用户所处课程 ID，依序抓取各门课后立即切回原课程，彻底杜绝串课
   */
  async safeSyncAllCourses(currentCourseId, onProgress) {
    const courses = await this.getCourses();
    if (courses.length === 0) {
      return this.getPendingAssignments();
    }
    for (let i = 0; i < courses.length; i++) {
      const c = courses[i];
      if (onProgress) onProgress(`\u6B63\u5728\u540C\u6B65 [${i + 1}/${courses.length}] \u300A${c.name}\u300B...`);
      try {
        if (this.db) {
          await this.db.upsertCourse(c.id, c.name);
        }
        await this.enterCourse(c.id);
        const indexHtml = await this.http.get(`${this.baseUrl}/assignment/index.jsp`, this.getAuthHeaders());
        const list = parseActiveAssignmentsHtml(indexHtml, c.name, c.id);
        for (const item of list) {
          item.courseId = c.id;
          item.courseName = c.name;
          item.url = `/assignment/index.jsp?courseID=${c.id}&assignID=${item.id}`;
          if (item.deadlineTimestamp === 0) {
            try {
              const detailHtml = await this.http.get(
                `${this.baseUrl}/assignment/index.jsp?courseID=${c.id}&assignID=${item.id}`,
                this.getAuthHeaders()
              );
              const detail = parseAssignmentDetailHtml(detailHtml);
              if (detail.deadlineTimestamp > 0) {
                item.deadline = detail.deadline;
                item.deadlineTimestamp = detail.deadlineTimestamp;
                item.remainingHours = detail.remainingHours;
                item.remainingText = detail.remainingText;
                item.urgency = calculateUrgency(detail.remainingHours);
              }
            } catch {
            }
          }
          if (this.db) {
            await this.db.upsertAssignment(item);
          }
        }
      } catch {
      }
    }
    if (currentCourseId) {
      if (onProgress) onProgress("\u6B63\u5728\u6062\u590D\u5F53\u524D\u9875\u9762\u8BFE\u7A0B\u72B6\u6001...");
      try {
        await this.enterCourse(currentCourseId);
      } catch {
      }
    }
    return this.db ? this.db.getAllAssignments() : this.getPendingAssignments();
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
   * 触发 DDL 告警推送（支持微信 PushPlus、Bark iOS 以及短信提醒 SMS）
   */
  async triggerPushAlert(config) {
    const threshold = config.hoursThreshold ?? 48;
    const allPending = this.db ? await this.db.getAllAssignments() : await this.getPendingAssignments(threshold);
    const activeUrgent = allPending.filter((a) => a.remainingHours > 0 && a.remainingHours <= threshold);
    if (activeUrgent.length === 0) {
      return { sent: false, count: 0, error: "\u5F53\u524D\u6682\u65E0\u5373\u5C06\u622A\u6B62\u7684\u4F5C\u4E1A" };
    }
    const title = `\u3010NoDDL \u63D0\u9192\u3011\u6709 ${activeUrgent.length} \u9879\u4F5C\u4E1A\u5373\u5C06\u5230\u8FBE DDL`;
    const markdown = [
      `### \u{1F514} NoDDL \u4F5C\u4E1A DDL \u63D0\u9192`,
      `\u5F53\u524D\u6709 **${activeUrgent.length}** \u9879\u4F5C\u4E1A\u5373\u5C06\u622A\u6B62\uFF1A`,
      "",
      ...activeUrgent.map((item, idx) => `${idx + 1}. [${item.courseName}] ${item.title} (\u622A\u6B62: ${item.deadline}, ${item.remainingText})`)
    ].join("\n");
    const smsText = `\u3010NoDDL\u3011\u60A8\u6709${activeUrgent.length}\u9879\u4F5C\u4E1A\u5373\u5C06\u622A\u6B62\uFF1A` + activeUrgent.slice(0, 3).map((i) => `${i.courseName}-${i.title}(${i.remainingText})`).join("\uFF1B") + (activeUrgent.length > 3 ? `\u7B49\u5171${activeUrgent.length}\u9879` : "") + "\uFF0C\u8BF7\u53CA\u65F6\u63D0\u4EA4\uFF01";
    let triggeredAny = false;
    try {
      if (config.pushplusToken) {
        await this.http.post("https://www.pushplus.plus/send", {
          token: config.pushplusToken,
          title,
          content: markdown.replace(/\n/g, "<br>"),
          template: "html"
        });
        triggeredAny = true;
      }
      if (config.barkUrl) {
        const barkBase = config.barkUrl.replace(/\/+$/, "");
        await this.http.get(`${barkBase}/${encodeURIComponent(title)}/${encodeURIComponent(markdown)}?group=NoDDL`);
        triggeredAny = true;
      }
      if (config.smsWebhookUrl) {
        let targetUrl = config.smsWebhookUrl;
        const phone = config.smsPhone || "";
        if (targetUrl.includes("{phone}") || targetUrl.includes("{msg}")) {
          targetUrl = targetUrl.replace(/\{phone\}/g, encodeURIComponent(phone)).replace(/\{msg\}/g, encodeURIComponent(smsText));
          await this.http.get(targetUrl);
        } else {
          await this.http.post(targetUrl, {
            phone,
            to: phone,
            msg: smsText,
            message: smsText,
            text: smsText
          });
        }
        triggeredAny = true;
      }
      if (config.customWebhookUrl) {
        await this.http.post(config.customWebhookUrl, {
          msg_type: "text",
          content: { text: `${title}

${markdown}` }
        });
        triggeredAny = true;
      }
      if (!triggeredAny) {
        return { sent: false, count: activeUrgent.length, error: "\u672A\u914D\u7F6E\u4EFB\u4F55\u6709\u6548\u63A8\u9001\u51ED\u636E\uFF08\u5FAE\u4FE1 / Bark / \u77ED\u4FE1\uFF09" };
      }
      return { sent: true, count: activeUrgent.length };
    } catch (err) {
      return { sent: false, count: activeUrgent.length, error: String(err) };
    }
  }
};

export { COURSE_GRADING_SECRET_KEY, CourseGradingClient, FetchHttpClient, HomeworkDB, calculateUrgency, decryptPassword, encryptPassword, extractDeadlineFromText, formatRemainingTime, parseActiveAssignmentsHtml, parseActiveCourseInfo, parseAssignmentDetailHtml, parseCourseListHtml, parseDeadlineBeijing, parseProblemDetailHtml, parseSubmissionsHtml, parseTestCases };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map