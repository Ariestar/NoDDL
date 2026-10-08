import { Assignment, ProblemDetail, SubmissionResult, TestCase } from './types';
import { calculateUrgency, parseDeadline } from './ddl';

/**
 * 从一体化平台作业列表页面 HTML 解析作业项
 * 采用通用正则解析，兼顾 Node.js（无需重型 jsdom）与浏览器原生环境
 */
export function parseHomeworkListHtml(html: string, nowMs = Date.now()): Assignment[] {
  const results: Assignment[] = [];

  // 1. 匹配表格行 <tr>...</tr> 或 卡片模式
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let trMatch: RegExpExecArray | null;

  while ((trMatch = trRegex.exec(html)) !== null) {
    const rowHtml = trMatch[1];
    // 跳过表头
    if (/<th/i.test(rowHtml)) continue;

    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const tds: string[] = [];
    let tdMatch: RegExpExecArray | null;
    while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
      // 去除内部标签并去除两端空格
      const text = tdMatch[1].replace(/<[^>]+>/g, '').trim();
      tds.push(text);
    }

    if (tds.length >= 4) {
      // 提取链接中的 ID（如 href="/pages/homework/detail.jsp?id=123"）
      const idMatch = rowHtml.match(/id=([a-zA-Z0-9_-]+)/i);
      const urlMatch = rowHtml.match(/href=["']([^"']+)["']/i);

      // 寻找时间格式 "YYYY-MM-DD HH:mm:ss" 或 "YYYY/MM/DD HH:mm"
      const dateMatch = rowHtml.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?)/);
      const deadlineStr = dateMatch ? dateMatch[1] : '';

      // 判断提交状态
      let status: Assignment['status'] = 'pending';
      if (/已评测|已打分|满分|得分/i.test(rowHtml)) {
        status = 'graded';
      } else if (/已提交|评测中|重交/i.test(rowHtml)) {
        status = 'submitted';
      } else if (/未交|未提交|未完成|进行中/i.test(rowHtml)) {
        status = 'pending';
      }

      if (deadlineStr) {
        const { timestamp, remainingHours, remainingText } = parseDeadline(deadlineStr, nowMs);
        const urgency = calculateUrgency(remainingHours);

        // 提取作业标题与课程名（通常在第1或第2列）
        const title = tds[1] || tds[0] || '未知作业';
        const courseName = tds.length > 4 ? tds[0] : '专业课程';

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
          url: urlMatch ? urlMatch[1] : undefined
        });
      }
    }
  }

  // 2. 如果标准表格没命中，尝试卡片/通用块匹配
  if (results.length === 0) {
    const cardRegex = /class=["'][^"']*(?:homework|task|exp-item)[^"']*["'][^>]*>([\s\S]*?)(?=class=["'][^"']*(?:homework|task|exp-item)|$)/gi;
    let cardMatch: RegExpExecArray | null;
    while ((cardMatch = cardRegex.exec(html)) !== null) {
      const card = cardMatch[1];
      const dateMatch = card.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?)/);
      if (dateMatch) {
        const titleMatch = card.match(/<h[345][^>]*>([^<]+)<\/h[345]>/i) || card.match(/title=["']([^"']+)["']/i);
        const deadlineStr = dateMatch[1];
        const { timestamp, remainingHours, remainingText } = parseDeadline(deadlineStr, nowMs);

        results.push({
          id: `card_${results.length + 1}`,
          courseName: '人工智能专业课',
          title: titleMatch ? titleMatch[1].trim() : '实训任务',
          deadline: deadlineStr,
          deadlineTimestamp: timestamp,
          remainingHours,
          remainingText,
          status: /未提交|待完成/i.test(card) ? 'pending' : 'submitted',
          urgency: calculateUrgency(remainingHours)
        });
      }
    }
  }

  return results;
}

/**
 * 解析题目描述中的测试用例（输入样例/输出样例）
 */
export function parseProblemTestCases(html: string): TestCase[] {
  const testCases: TestCase[] = [];

  // 常见模式 1: <pre>样例输入...</pre> 与 <pre>样例输出...</pre>
  const sampleRegex = /(?:样例输入|输入样例|Sample Input)[\s\S]*?<pre[^>]*>([\s\S]*?)<\/pre>[\s\S]*?(?:样例输出|输出样例|Sample Output)[\s\S]*?<pre[^>]*>([\s\S]*?)<\/pre>/gi;
  let match: RegExpExecArray | null;
  let idx = 1;

  while ((match = sampleRegex.exec(html)) !== null) {
    const input = cleanCodeBlock(match[1]);
    const output = cleanCodeBlock(match[2]);
    testCases.push({ index: idx++, input, output });
  }

  // 常见模式 2: 单个 pre 块包含格式化用例
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
 * 解析题目详情
 */
export function parseProblemDetailHtml(problemId: string, html: string): ProblemDetail {
  const titleMatch = html.match(/<h[123][^>]*>([\s\S]*?)<\/h[123]>/i);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : `题目 ${problemId}`;

  const testCases = parseProblemTestCases(html);
  const plainText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  return {
    id: problemId,
    title,
    descriptionHtml: html,
    descriptionText: plainText,
    testCases
  };
}

/**
 * 解析最近一次提交评测结果
 */
export function parseSubmissionResultHtml(html: string): SubmissionResult[] {
  const results: SubmissionResult[] = [];
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let trMatch: RegExpExecArray | null;

  while ((trMatch = trRegex.exec(html)) !== null) {
    const row = trMatch[1];
    if (/<th/i.test(row)) continue;

    let status = 'Unknown';
    if (/Accepted|正确|通过|AC/i.test(row)) status = 'Accepted';
    else if (/Wrong Answer|答案错误|WA/i.test(row)) status = 'Wrong Answer';
    else if (/Time Limit|超时|TLE/i.test(row)) status = 'Time Limit Exceeded';
    else if (/Memory Limit|超内存|MLE/i.test(row)) status = 'Memory Limit Exceeded';
    else if (/Compile Error|编译错误|CE/i.test(row)) status = 'Compile Error';
    else if (/Judging|Running|评测中/i.test(row)) status = 'Judging';

    const idMatch = row.match(/runid=([0-9]+)|submission[_-]?id=([0-9]+)/i);
    const dateMatch = row.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?)/);

    if (idMatch || dateMatch) {
      results.push({
        id: idMatch ? (idMatch[1] || idMatch[2]) : `sub_${results.length + 1}`,
        problemId: 'unknown',
        status: status as SubmissionResult['status'],
        submitTime: dateMatch ? dateMatch[1] : new Date().toISOString()
      });
    }
  }

  return results;
}
