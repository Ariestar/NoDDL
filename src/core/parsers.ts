import { Assignment, Course, ProblemDetail, SubmissionResult, TestCase } from './types';
import { parseDeadlineBeijing } from './time';

/**
 * 解析 CourseGrading 课程列表
 * 来源：/courselist.jsp 或 /main.jsp
 */
export function parseCourseListHtml(html: string): Course[] {
  const courses: Course[] = [];
  const seenIds = new Set<string>();

  // 1. 多课程链接: <a href="courselist.jsp?courseID=1001"> 高等数学 </a>
  const linkRegex = /<a[^>]*href=["'][^"']*courselist\.jsp\?courseID=([a-zA-Z0-9_-]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(html)) !== null) {
    const id = match[1];
    const name = match[2].replace(/<[^>]+>/g, '').trim();
    if (id && name && !seenIds.has(id)) {
      seenIds.add(id);
      courses.push({ id, name });
    }
  }

  // 2. 单课程下拉菜单: <span class="dropdown-item-course" value="1001">高等数学</span>
  const spanRegex = /<span[^>]*class=["'][^"']*dropdown-item-course[^"']*["'][^>]*value=["']([a-zA-Z0-9_-]+)["'][^>]*>([\s\S]*?)<\/span>/gi;
  while ((match = spanRegex.exec(html)) !== null) {
    const id = match[1];
    const name = match[2].replace(/<[^>]+>/g, '').trim();
    if (id && name && !seenIds.has(id)) {
      seenIds.add(id);
      courses.push({ id, name });
    }
  }

  return courses;
}

/**
 * 解析 CourseGrading 活跃作业列表
 * 来源：/assignment/mainActiveAssigns.jsp 或当前页面中的 .main-zy 容器
 */
export function parseActiveAssignmentsHtml(html: string, courseName = '专业课程', nowMs = Date.now()): Assignment[] {
  const assignments: Assignment[] = [];
  const seenIds = new Set<string>();

  // CourseGrading 核心容器: <div class="main-zy"> ... <a href="...assignID=5001">作业名</a> ... </div>
  const blockRegex = /<div[^>]*class=["'][^"']*main-zy[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi;
  let blockMatch: RegExpExecArray | null;

  while ((blockMatch = blockRegex.exec(html)) !== null) {
    const block = blockMatch[1];

    const linkMatch = block.match(/href=["'][^"']*assignID=([a-zA-Z0-9_-]+)[^"']*["'][^>]*>([\s\S]*?)<\/a>/i);
    if (!linkMatch) continue;

    const id = linkMatch[1];
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    const title = linkMatch[2].replace(/<[^>]+>/g, '').trim() || `作业 ${id}`;

    // 提取时间字符串
    const dateMatch = block.match(/(?:截止[：:\s]*)?(\d{4}[-/年.]\d{1,2}[-/月.]\d{1,2}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?)/) ||
                      block.match(/(?:截止[：:\s]*)?(\d{1,2}[-/月.]\d{1,2}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?)/);

    const rawDeadline = dateMatch ? dateMatch[1] : '';
    const parsed = parseDeadlineBeijing(rawDeadline, nowMs);

    let status: Assignment['status'] = 'pending';
    if (/已打分|得分|满分/i.test(block)) status = 'graded';
    else if (/已提交|评测中/i.test(block)) status = 'submitted';

    assignments.push({
      id,
      courseName,
      title,
      deadline: rawDeadline ? parsed.normalized : '请查看详情',
      deadlineTimestamp: parsed.timestamp,
      remainingHours: parsed.remainingHours,
      remainingText: parsed.remainingText,
      status,
      urgency: parsed.urgency,
      url: `/assignment/index.jsp?assignID=${id}`
    });
  }

  // 兜底扫描: 纯链接形式
  if (assignments.length === 0) {
    const directLinkRegex = /<a[^>]*href=["'][^"']*assignID=([a-zA-Z0-9_-]+)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;
    let linkM: RegExpExecArray | null;
    while ((linkM = directLinkRegex.exec(html)) !== null) {
      const id = linkM[1];
      if (seenIds.has(id)) continue;
      seenIds.add(id);

      const title = linkM[2].replace(/<[^>]+>/g, '').trim();
      if (!title || title.includes('详细') || title.includes('提交')) continue;

      assignments.push({
        id,
        courseName,
        title,
        deadline: '请查看详情',
        deadlineTimestamp: 0,
        remainingHours: 9999,
        remainingText: '待定',
        status: 'pending',
        urgency: 'normal',
        url: `/assignment/index.jsp?assignID=${id}`
      });
    }
  }

  return assignments;
}

/**
 * 解析 CourseGrading 作业详情页
 * 来源：/assignment/index.jsp?assignID={id}
 */
export function parseAssignmentDetailHtml(html: string, nowMs = Date.now()): {
  title?: string;
  deadline?: string;
  deadlineTimestamp: number;
  remainingHours: number;
  remainingText: string;
} {
  const dateMatch = html.match(/截止时间[：:\s]*([\d\-/年. :]+)/i) ||
                    html.match(/(\d{4}[-/年.]\d{1,2}[-/月.]\d{1,2}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?)/);

  const rawDeadline = dateMatch ? dateMatch[1].trim() : '';
  const parsed = parseDeadlineBeijing(rawDeadline, nowMs);

  const titleMatch = html.match(/<b>([\s\S]*?)<\/b>/i) || html.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : undefined;

  return {
    title,
    deadline: rawDeadline ? parsed.normalized : undefined,
    deadlineTimestamp: parsed.timestamp,
    remainingHours: parsed.remainingHours,
    remainingText: parsed.remainingText
  };
}

/**
 * 解析题目输入输出用例
 * 来源：/assignment/programList.jsp 或 /acm/submit.jsp
 */
export function parseTestCases(html: string): TestCase[] {
  const testCases: TestCase[] = [];

  const sampleRegex = /(?:样例输入|输入样例|Sample Input)[\s\S]*?<pre[^>]*>([\s\S]*?)<\/pre>[\s\S]*?(?:样例输出|输出样例|Sample Output)[\s\S]*?<pre[^>]*>([\s\S]*?)<\/pre>/gi;
  let match: RegExpExecArray | null;
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
    const blocks: string[] = [];
    let preMatch: RegExpExecArray | null;
    while ((preMatch = preRegex.exec(html)) !== null) {
      blocks.push(cleanCodeBlock(preMatch[1]));
    }
    for (let i = 0; i < blocks.length - 1; i += 2) {
      testCases.push({
        index: (i / 2) + 1,
        input: blocks[i],
        output: blocks[i + 1]
      });
    }
  }

  return testCases;
}

function cleanCodeBlock(raw: string): string {
  return raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * 解析题目描述与代码
 * 来源：/assignment/programList.jsp
 */
export function parseProblemDetailHtml(problemId: string, html: string): ProblemDetail {
  const contentMatch = html.match(/<div[^>]*class=["'][^"']*cgProblemContentClass[^"']*["'][^>]*>([\s\S]*?)<\/div>/i) ||
                       html.match(/<div[^>]*id=["']cgpreviewmarkdown["'][^>]*>([\s\S]*?)<\/div>/i);

  const descHtml = contentMatch ? contentMatch[1] : html;
  const descText = descHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  const codeMatch = html.match(/<textarea[^>]*id=["']cgsoucecode["'][^>]*>([\s\S]*?)<\/textarea>/i);
  const currentCode = codeMatch ? codeMatch[1].trim() : undefined;

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
 * 来源：/acm/problemset_stat.jsp
 */
export function parseSubmissionsHtml(html: string): SubmissionResult[] {
  const results: SubmissionResult[] = [];
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let trMatch: RegExpExecArray | null;

  while ((trMatch = trRegex.exec(html)) !== null) {
    const row = trMatch[1];
    if (/<th/i.test(row)) continue;

    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const tds: string[] = [];
    let tdMatch: RegExpExecArray | null;
    while ((tdMatch = tdRegex.exec(row)) !== null) {
      tds.push(tdMatch[1].replace(/<[^>]+>/g, '').trim());
    }

    if (tds.length >= 6) {
      const runId = tds[0];
      const submitTime = tds[1];
      const problemTitle = tds[3];
      const rawStatus = tds[5];

      let status: SubmissionResult['status'] = 'Unknown';
      if (/Accepted|正确|通过|AC/i.test(rawStatus)) status = 'Accepted';
      else if (/Wrong Answer|答案错误|WA/i.test(rawStatus)) status = 'Wrong Answer';
      else if (/Time Limit|超时|TLE/i.test(rawStatus)) status = 'Time Limit Exceeded';
      else if (/Memory Limit|超内存|MLE/i.test(rawStatus)) status = 'Memory Limit Exceeded';
      else if (/Compile Error|编译错误|CE/i.test(rawStatus)) status = 'Compile Error';
      else if (/Judging|Running|评测中|排队/i.test(rawStatus)) status = 'Judging';

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
