import { Assignment, ProblemDetail, SubmissionResult, TestCase } from './types';
import { calculateUrgency, parseDeadline } from './ddl';

export interface CourseInfo {
  id: string;
  name: string;
}

/**
 * 解析 CourseGrading 课程列表
 * 来源：/courselist.jsp 或 /main.jsp 下拉菜单
 */
export function parseCourseListHtml(html: string): CourseInfo[] {
  const courses: CourseInfo[] = [];
  const seenIds = new Set<string>();

  // 1. 多课程列表：<a href="courselist.jsp?courseID=1001"> 高等数学 </a>
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

  // 2. 单课程 / 下拉菜单：<span class="dropdown-item-course" value="1001">高等数学</span>
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
 * 来源：/assignment/mainActiveAssigns.jsp 或页面上的 .main-zy 容器
 */
export function parseActiveAssignmentsHtml(html: string, courseName = '专业课程', nowMs = Date.now()): Assignment[] {
  const assignments: Assignment[] = [];
  const seenIds = new Set<string>();

  // CourseGrading 标准结构: <div class="main-zy"> ... <a href="...assignID=5001">作业名</a> ... </div>
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

    // 匹配时间字符串（如 "2026-10-10 23:59:00" 或 "2026/10/10 23:59"）
    const dateMatch = block.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?)/);
    const deadlineStr = dateMatch ? dateMatch[1] : '';

    const { timestamp, remainingHours, remainingText } = deadlineStr
      ? parseDeadline(deadlineStr, nowMs)
      : { timestamp: 0, remainingHours: 9999, remainingText: '请查看详情' };

    let status: Assignment['status'] = 'pending';
    if (/已提交|评测中/i.test(block)) status = 'submitted';
    else if (/已打分|得分|满分/i.test(block)) status = 'graded';

    assignments.push({
      id,
      courseName,
      title,
      deadline: deadlineStr || '未标注明确截止时间',
      deadlineTimestamp: timestamp,
      remainingHours,
      remainingText,
      status,
      urgency: calculateUrgency(remainingHours),
      url: `/assignment/index.jsp?assignID=${id}`
    });
  }

  // 兜底：若未包含 .main-zy 外层，直接扫描包含 assignID 的链接
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
 * 解析 CourseGrading 作业详情页面
 * 来源：/assignment/index.jsp?assignID={id}
 */
export function parseAssignmentIndexHtml(html: string, nowMs = Date.now()): {
  title?: string;
  deadline?: string;
  deadlineTimestamp: number;
  remainingHours: number;
  remainingText: string;
  problems: { index: number; id: string; title: string; score?: number }[];
} {
  // 提取截止时间
  const dateMatch = html.match(/截止时间[：:\s]*(\d{4}[-/]\d{1,2}[-/]\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?)/i) ||
                    html.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?)/);
  const deadline = dateMatch ? dateMatch[1] : undefined;
  const { timestamp, remainingHours, remainingText } = deadline
    ? parseDeadline(deadline, nowMs)
    : { timestamp: 0, remainingHours: 9999, remainingText: '未设截止时间' };

  // 提取作业标题
  const titleMatch = html.match(/<b>([\s\S]*?)<\/b>/i) || html.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : undefined;

  // 提取题目列表 (<table class="table-striped">)
  const problems: { index: number; id: string; title: string; score?: number }[] = [];
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let trMatch: RegExpExecArray | null;

  while ((trMatch = trRegex.exec(html)) !== null) {
    const row = trMatch[1];
    if (/<th[^>]*>#<\/th>/i.test(row)) continue;

    const proLinkMatch = row.match(/href=["'][^"']*programList\.jsp\?proNum=(\d+)&assignID=(\d+)["'][^>]*>([\s\S]*?)<\/a>/i);
    const judgeLinkMatch = row.match(/problemID=(\d+)/i);

    if (proLinkMatch) {
      const index = parseInt(proLinkMatch[1], 10);
      const proTitle = proLinkMatch[3].replace(/<[^>]+>/g, '').trim();
      const problemId = judgeLinkMatch ? judgeLinkMatch[1] : `pro_${index}`;

      const scoreMatch = row.match(/<td>\s*(\d+(?:\.\d+)?)\s*<\/td>/i);
      const score = scoreMatch ? parseFloat(scoreMatch[1]) : undefined;

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

/**
 * 解析题目输入输出样例
 * 来源：/assignment/programList.jsp 或 /acm/submit.jsp
 */
export function parseProblemTestCases(html: string): TestCase[] {
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
 * 解析题目详情与代码
 * 来源：/assignment/programList.jsp
 */
export function parseProblemDetailHtml(problemId: string, html: string): ProblemDetail {
  const contentMatch = html.match(/<div[^>]*class=["'][^"']*cgProblemContentClass[^"']*["'][^>]*>([\s\S]*?)<\/div>/i) ||
                       html.match(/<div[^>]*id=["']cgpreviewmarkdown["'][^>]*>([\s\S]*?)<\/div>/i);

  const descHtml = contentMatch ? contentMatch[1] : html;
  const descText = descHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  // 提取现有代码
  const codeMatch = html.match(/<textarea[^>]*id=["']cgsoucecode["'][^>]*>([\s\S]*?)<\/textarea>/i);
  const currentCode = codeMatch ? codeMatch[1].trim() : undefined;

  const testCases = parseProblemTestCases(html);

  return {
    id: problemId,
    title: `题目 ${problemId}`,
    descriptionHtml: descHtml,
    descriptionText: descText,
    testCases,
    currentCode
  };
}

/**
 * 解析评测结果状态表
 * 来源：/acm/problemset_stat.jsp
 */
export function parseSubmissionResultHtml(html: string): SubmissionResult[] {
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
      // 表头: Run ID, 提交时间, 用户, 题目, 语言, 评测结果, 时间, 内存
      const runId = tds[0];
      const submitTime = tds[1];
      const problemTitle = tds[3];
      const rawStatus = tds[5];

      let status = 'Unknown';
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
        status: status as SubmissionResult['status'],
        submitTime
      });
    }
  }

  return results;
}
