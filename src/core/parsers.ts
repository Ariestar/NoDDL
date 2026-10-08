import { Assignment, Course, ProblemDetail, SubmissionResult, TestCase } from './types';
import { parseDeadlineBeijing } from './time';

/**
 * 解析 CourseGrading 课程列表
 * 结构: a[href*="courselist.jsp?courseID="] 或 span.dropdown-item-course[value]
 */
export function parseCourseListHtml(html: string): Course[] {
  const list: Course[] = [];
  const seen = new Set<string>();

  // 1. 多课程列表
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

  // 2. 单课程下拉
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
 * 解析 CourseGrading 活跃作业列表
 * 结构: div.main-zy > a[href*="assignID="]
 */
export function parseActiveAssignmentsHtml(html: string, courseName = '专业课程', nowMs = Date.now()): Assignment[] {
  const list: Assignment[] = [];
  const seen = new Set<string>();

  const blockRe = /<div[^>]*class=["'][^"']*main-zy[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi;
  let m: RegExpExecArray | null;

  while ((m = blockRe.exec(html)) !== null) {
    const block = m[1];
    const linkM = block.match(/href=["'][^"']*assignID=([a-zA-Z0-9_-]+)[^"']*["'][^>]*>([\s\S]*?)<\/a>/i);
    if (!linkM) continue;

    const id = linkM[1];
    if (seen.has(id)) continue;
    seen.add(id);

    const title = linkM[2].replace(/<[^>]+>/g, '').trim() || `作业 ${id}`;
    const ddl = parseDeadlineBeijing(block, nowMs);

    let status: Assignment['status'] = 'pending';
    if (/已打分|得分|满分/i.test(block)) status = 'graded';
    else if (/已提交|评测中/i.test(block)) status = 'submitted';

    list.push({
      id,
      courseName,
      title,
      deadline: ddl.timestamp > 0 ? ddl.normalized : '请查看详情',
      deadlineTimestamp: ddl.timestamp,
      remainingHours: ddl.remainingHours,
      remainingText: ddl.remainingText,
      status,
      urgency: ddl.urgency,
      url: `/assignment/index.jsp?assignID=${id}`
    });
  }

  return list;
}

/**
 * 解析 CourseGrading 作业详情页
 * 结构: 包含截止时间与题目
 */
export function parseAssignmentDetailHtml(html: string, nowMs = Date.now()): {
  title?: string;
  deadline?: string;
  deadlineTimestamp: number;
  remainingHours: number;
  remainingText: string;
} {
  const ddl = parseDeadlineBeijing(html, nowMs);
  const titleM = html.match(/<b>([\s\S]*?)<\/b>/i) || html.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i);
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
 * 解析题目详情与代码
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
