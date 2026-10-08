import { Assignment, Course, ProblemDetail, SubmissionResult, TestCase } from './types';
import { parseDeadlineBeijing } from './time';

/**
 * 解析希冀平台课程列表（仅用于只读展示，严禁后台静默切换课程上下文）
 */
export function parseCourseListHtml(html: string): Course[] {
  const list: Course[] = [];
  const seen = new Set<string>();

  const linkRe = /<a[^>]*href=["'][^"']*courselist\.jsp\?courseID=([a-zA-Z0-9_-]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(html)) !== null) {
    const id = m[1];
    const name = m[2].replace(/<[^>]+>/g, '').trim();
    if (id && name && !seen.has(id)) {
      seen.add(id);
      list.push({ id, name });
    }
  }

  const spanRe = /<span[^>]*class=["'][^"']*dropdown-item-course[^"']*["'][^>]*value=["']([a-zA-Z0-9_-]+)["'][^>]*>([\s\S]*?)<\/span>/gi;
  while ((m = spanRe.exec(html)) !== null) {
    const id = m[1];
    const name = m[2].replace(/<[^>]+>/g, '').trim();
    if (id && name && !seen.has(id)) {
      seen.add(id);
      list.push({ id, name });
    }
  }

  return list;
}

/**
 * 解析希冀平台活跃作业列表
 * 支持结构：
 * 1. 侧边栏结构：精准切分当前作业（fas fa-clock）与历史作业（fas fa-history），只抓取当前作业
 * 2. 标准活跃容器：div.main-zy 或包含 assignID 的链接列表
 */
export function parseActiveAssignmentsHtml(html: string, courseName = '当前课程', nowMs = Date.now()): Assignment[] {
  const list: Assignment[] = [];
  const seen = new Set<string>();

  // 1. 若存在侧边栏 "历史作业" (fas fa-history)，仅截取历史作业前面的 "当前进行中作业" 区域
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

  // 2. 匹配作业链接（支持 index.jsp?assignID=..., fileUploadList.jsp?proNum=1&assignID=..., programList.jsp?...）
  const linkRe = /<a[^>]*href=["']([^"']*assignID=([a-zA-Z0-9_-]+)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;

  while ((m = linkRe.exec(activeSection)) !== null) {
    const rawUrl = m[1];
    const id = m[2];
    const title = m[3].replace(/<[^>]+>/g, '').trim();

    if (!title || seen.has(id)) continue;
    if (/^(?:详细|提交|查看|重做|编辑|删除)$/.test(title)) continue;

    seen.add(id);

    // 取该链接周围上下文解析 DDL
    const matchPos = m.index;
    const ctx = activeSection.slice(Math.max(0, matchPos - 200), Math.min(activeSection.length, matchPos + 350));
    const ddl = parseDeadlineBeijing(ctx, nowMs);

    list.push({
      id,
      courseName,
      title,
      deadline: ddl.timestamp > 0 ? ddl.normalized : '请查看详情',
      deadlineTimestamp: ddl.timestamp,
      remainingHours: ddl.remainingHours,
      remainingText: ddl.remainingText,
      status: 'pending',
      urgency: ddl.urgency,
      url: rawUrl.startsWith('/') ? rawUrl : `/assignment/${rawUrl}`
    });
  }

  // 3. 兜底扫描: div.main-zy 容器结构
  if (list.length === 0) {
    const blockRe = /<div[^>]*class=["'][^"']*main-zy[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi;
    let bm: RegExpExecArray | null;

    while ((bm = blockRe.exec(html)) !== null) {
      const block = bm[1];
      const linkM = block.match(/href=["']([^"']*assignID=([a-zA-Z0-9_-]+)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/i);
      if (!linkM) continue;

      const rawUrl = linkM[1];
      const id = linkM[2];
      if (seen.has(id)) continue;
      seen.add(id);

      const title = linkM[3].replace(/<[^>]+>/g, '').trim() || `作业 ${id}`;
      const ddl = parseDeadlineBeijing(block, nowMs);

      list.push({
        id,
        courseName,
        title,
        deadline: ddl.timestamp > 0 ? ddl.normalized : '请查看详情',
        deadlineTimestamp: ddl.timestamp,
        remainingHours: ddl.remainingHours,
        remainingText: ddl.remainingText,
        status: 'pending',
        urgency: ddl.urgency,
        url: rawUrl.startsWith('/') ? rawUrl : `/assignment/${rawUrl}`
      });
    }
  }

  return list;
}

/**
 * 解析希冀平台作业详情页与题目列表
 * 来源：/assignment/index.jsp?assignID={id} 或 fileUploadList.jsp / programList.jsp
 */
export function parseAssignmentDetailHtml(html: string, nowMs = Date.now()): {
  title?: string;
  deadline?: string;
  deadlineTimestamp: number;
  remainingHours: number;
  remainingText: string;
} {
  // 提取 DDL：支持 "作业时间：<b>...</b> 至 <b>...</b>" 规范格式
  const ddl = parseDeadlineBeijing(html, nowMs);

  // 提取作业名称：通常在 <b>作业名</b> 或 breadcrumb 中
  const titleM = html.match(/(?:当前作业|作业名称)[：:\s]*<b>([^<]+)<\/b>/i) ||
                 html.match(/<b>([^<]{2,40})<\/b>\s*<p>[^<]*作业时间/i) ||
                 html.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i);
  const title = titleM ? titleM[1].replace(/<[^>]+>/g, '').trim() : undefined;

  return {
    title,
    deadline: ddl.timestamp > 0 ? ddl.normalized : undefined,
    deadlineTimestamp: ddl.timestamp,
    remainingHours: ddl.remainingHours,
    remainingText: ddl.remainingText
  };
}

/**
 * 解析题目输入输出用例
 */
export function parseTestCases(html: string): TestCase[] {
  const cases: TestCase[] = [];
  const re = /(?:样例输入|输入样例|Sample Input)[\s\S]*?<pre[^>]*>([\s\S]*?)<\/pre>[\s\S]*?(?:样例输出|输出样例|Sample Output)[\s\S]*?<pre[^>]*>([\s\S]*?)<\/pre>/gi;
  let m: RegExpExecArray | null;
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

function cleanCode(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * 解析题目详情（兼容编程题 programList.jsp 与文件上传题 fileUploadList.jsp）
 */
export function parseProblemDetailHtml(problemId: string, html: string): ProblemDetail {
  const contentM = html.match(/<div[^>]*class=["'][^"']*cgProblemContentClass[^"']*["'][^>]*>([\s\S]*?)<\/div>/i) ||
                   html.match(/<div[^>]*id=["']cgpreviewmarkdown["'][^>]*>([\s\S]*?)<\/div>/i);

  const descHtml = contentM ? contentM[1] : html;
  const descText = descHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  const codeM = html.match(/<textarea[^>]*id=["']cgsoucecode["'][^>]*>([\s\S]*?)<\/textarea>/i);
  const currentCode = codeM ? codeM[1].trim() : undefined;

  return {
    id: problemId,
    title: `题目 ${problemId}`,
    descriptionHtml: descHtml,
    descriptionText: descText,
    testCases: parseTestCases(html),
    currentCode
  };
}

/**
 * 解析评测记录表
 */
export function parseSubmissionsHtml(html: string): SubmissionResult[] {
  const list: SubmissionResult[] = [];
  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let m: RegExpExecArray | null;

  while ((m = trRe.exec(html)) !== null) {
    const row = m[1];
    if (/<th/i.test(row)) continue;

    const tds = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(t => t[1].replace(/<[^>]+>/g, '').trim());

    if (tds.length >= 6) {
      const rawStatus = tds[5];
      let status: SubmissionResult['status'] = 'Unknown';
      if (/Accepted|正确|通过|AC/i.test(rawStatus)) status = 'Accepted';
      else if (/Wrong Answer|答案错误|WA/i.test(rawStatus)) status = 'Wrong Answer';
      else if (/Time Limit|超时|TLE/i.test(rawStatus)) status = 'Time Limit Exceeded';
      else if (/Memory Limit|超内存|MLE/i.test(rawStatus)) status = 'Memory Limit Exceeded';
      else if (/Compile Error|编译错误|CE/i.test(rawStatus)) status = 'Compile Error';
      else if (/Judging|Running|评测中|排队/i.test(rawStatus)) status = 'Judging';

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
