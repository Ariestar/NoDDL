import { Assignment, Course, ProblemDetail, SubmissionResult, TestCase } from './types';
import { parseDeadlineBeijing } from './time';

/**
 * 解析希冀平台当前激活课程信息
 * 真实结构: <span class="... dropdown-item-course font-weight-bold" value="184">离散数学</span>
 */
export function parseActiveCourseInfo(html: string): { id?: string; name?: string } {
  const activeCourseM = html.match(/<span[^>]*class=["'][^"']*dropdown-item-course[^"']*font-weight-bold[^"']*["'][^>]*value=["']([^"']+)["'][^>]*>([\s\S]*?)<\/span>/i);
  if (activeCourseM) {
    return {
      id: activeCourseM[1],
      name: activeCourseM[2].replace(/<[^>]+>/g, '').trim()
    };
  }

  return {};
}

/**
 * 解析希冀平台课程列表
 * 真实结构: <span class="dropdown-item dropdown-item-course..." value="184">离散数学</span>
 * 或 <a href="courselist.jsp?courseID=184">离散数学</a>
 */
export function parseCourseListHtml(html: string): Course[] {
  const list: Course[] = [];
  const seen = new Set<string>();

  const spanRe = /<span[^>]*class=["'][^"']*dropdown-item-course[^"']*["'][^>]*value=["']([a-zA-Z0-9_-]+)["'][^>]*>([\s\S]*?)<\/span>/gi;
  let m: RegExpExecArray | null;
  while ((m = spanRe.exec(html)) !== null) {
    const id = m[1];
    const name = m[2].replace(/<[^>]+>/g, '').trim();
    if (id && name && !seen.has(id)) {
      seen.add(id);
      list.push({ id, name });
    }
  }

  const linkRe = /<a[^>]*href=["'][^"']*courselist\.jsp\?courseID=([a-zA-Z0-9_-]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  while ((m = linkRe.exec(html)) !== null) {
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
 * 解析希冀平台侧边栏中的作业列表
 * 真实结构:
 * <span class="text-muted"><strong><i class="fas fa-clock"></i> 当前作业</strong></span>
 * <div class="list-group list-group-flush mb-4">
 *     <a href="index.jsp?courseID=184&assignID=3548" class="list-group-item list-group-item-action active">第四周作业</a>
 * </div>
 * <span class="text-muted"><strong><i class="fas fa-history"></i> 历史作业</strong></span>
 * <div class="list-group list-group-flush">...</div>
 */
export function parseActiveAssignmentsHtml(html: string, courseName = '', defaultCourseId = ''): Assignment[] {
  const list: Assignment[] = [];
  const seen = new Set<string>();

  // 1. 按希冀平台原生结构截取侧边栏 "当前作业" 区域，在 "历史作业" 处截止
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

  // 2. 匹配侧边栏或列表中的作业链接: a[href*="assignID="]
  const linkRe = /<a[^>]*href=["']([^"']*assignID=([a-zA-Z0-9_-]+)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;

  while ((m = linkRe.exec(activeSection)) !== null) {
    const rawUrl = m[1];
    const id = m[2];
    const title = m[3].replace(/<[^>]+>/g, '').trim();

    if (!title || seen.has(id)) continue;
    // 过滤操作辅助按钮（如 "返回文件上传题列表", "详细", "1", "文件上传题" 等）
    if (/^(?:返回|详细|提交|查看|重做|编辑|删除|\d+|文件上传题|程序题)$/.test(title)) continue;

    seen.add(id);

    const courseIdM = rawUrl.match(/courseID=([a-zA-Z0-9_-]+)/i);
    const courseId = courseIdM ? courseIdM[1] : defaultCourseId;

    // 格式化为根路径可直接点击的作业入口 URL
    const finalUrl = courseId
      ? `/assignment/index.jsp?courseID=${courseId}&assignID=${id}`
      : `/assignment/index.jsp?assignID=${id}`;

    list.push({
      id,
      courseId,
      courseName,
      title,
      deadline: '请查看详情',
      deadlineTimestamp: 0,
      remainingHours: 9999,
      remainingText: '待定',
      status: 'pending',
      urgency: 'normal',
      url: finalUrl
    });
  }

  return list;
}

/**
 * 解析希冀平台作业主卡片（包含作业标题、作业时间与满分）
 * 真实结构:
 * <div class="shadow-sm p-3 mb-3 bg-light rounded">
 *     <h4>第四周作业</h4>
 *     <p>作业时间：<b>2026-09-30 21:28:00</b> 至 <b>2026-10-11 23:59:00</b></p>
 * </div>
 */
export function parseAssignmentDetailHtml(html: string, nowMs = Date.now()): {
  title?: string;
  deadline?: string;
  deadlineTimestamp: number;
  remainingHours: number;
  remainingText: string;
} {
  // 1. 精准提取卡片标题 h4 (例如 "第四周作业")
  const h4Match = html.match(/<div[^>]*class=["'][^"']*bg-light[^"']*["'][^>]*>[\s\S]*?<h[3-5][^>]*>([\s\S]*?)<\/h[3-5]>/i) ||
                  html.match(/<h[3-5][^>]*>([\s\S]*?)<\/h[3-5]>\s*<p>[^<]*作业时间/i);
  let title = h4Match ? h4Match[1].replace(/<[^>]+>/g, '').trim() : undefined;

  // 2. 备用面包屑提取 (如 fileUploadList.jsp 中的 breadcrumb)
  if (!title) {
    const breadcrumbM = html.match(/<ol[^>]*class=["'][^"']*breadcrumb[^"']*["'][^>]*>([\s\S]*?)<\/ol>/i);
    if (breadcrumbM) {
      const items = [...breadcrumbM[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map(i => i[1].replace(/<[^>]+>/g, '').trim());
      // 面包屑首项通常是作业名（如 "第四周作业"）
      if (items.length > 0) {
        title = items[0].replace(/<[^>]+>/g, '').trim();
      }
    }
  }

  // 3. 精准提取截止时间（希冀平台: 作业时间：<b>...</b> 至 <b>2026-10-11 23:59:00</b>）
  const ddl = parseDeadlineBeijing(html, nowMs);

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
