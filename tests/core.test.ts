import test from 'node:test';
import assert from 'node:assert';
import { encryptPassword, decryptPassword } from '../src/core/crypto';
import { parseDeadlineBeijing, formatRemainingTime, calculateUrgency, extractDeadlineFromText } from '../src/core/time';
import {
  parseCourseListHtml,
  parseActiveAssignmentsHtml,
  parseAssignmentDetailHtml,
  parseTestCases
} from '../src/core/parsers';

test('AES-ECB 密码加密与解密一致性', () => {
  const password = 'mypassword123';
  const encrypted = encryptPassword(password);
  assert.notStrictEqual(encrypted, password);

  const decrypted = decryptPassword(encrypted);
  assert.strictEqual(decrypted, password);
});

test('时间引擎：严格边界校验，杜绝无日期文本误判为 00-00 或 311 天', () => {
  // 无日期的普通标题文本
  const noDate1 = parseDeadlineBeijing('第八章异常控制流-课后作业');
  assert.strictEqual(noDate1.timestamp, 0);
  assert.strictEqual(noDate1.normalized, '请查看详情');
  assert.strictEqual(noDate1.remainingText, '待定');
  assert.notStrictEqual(noDate1.normalized, '2026-00-00 23:59:00');

  const noDate2 = parseDeadlineBeijing('第十章异常控制流-课后作业');
  assert.strictEqual(noDate2.timestamp, 0);
  assert.strictEqual(noDate2.remainingText, '待定');
});

test('时间引擎：标准格式解析与东八区校准', () => {
  const nowMs = Date.UTC(2026, 9, 15, 12, 0, 0) - 8 * 3600 * 1000;

  // 1. 标准年月日
  const d1 = parseDeadlineBeijing('2026-10-15 20:00:00', nowMs);
  assert.strictEqual(d1.normalized, '2026-10-15 20:00:00');
  assert.strictEqual(d1.remainingHours, 8);
  assert.strictEqual(d1.remainingText, '剩 8 小时');
  assert.strictEqual(d1.urgency, 'urgent');

  // 2. 中文格式清洗: 2026年10月15日 20:00
  const d2 = parseDeadlineBeijing('截止时间：2026年10月15日 20:00', nowMs);
  assert.strictEqual(d2.normalized, '2026-10-15 20:00:00');
  assert.strictEqual(d2.remainingHours, 8);

  // 3. 点分隔符格式: 2026.10.15 20:00
  const d3 = parseDeadlineBeijing('2026.10.15 20:00', nowMs);
  assert.strictEqual(d3.normalized, '2026-10-15 20:00:00');
  assert.strictEqual(d3.remainingHours, 8);

  // 4. 缺少年份格式: 10-15 20:00 (自动补齐当前年 2026)
  const d4 = parseDeadlineBeijing('10-15 20:00', nowMs);
  assert.strictEqual(d4.normalized, '2026-10-15 20:00:00');
  assert.strictEqual(d4.remainingHours, 8);
});

test('时间引擎：时间范围精准提取结束 DDL（忽略开始时间）', () => {
  const nowMs = Date.UTC(2026, 9, 8, 21, 56, 0) - 8 * 3600 * 1000;

  // 真实场景: 开始时间 至 结束时间
  const raw = '第七章链接-课后作业 2026-09-09 12:50:00 至 2026-10-15 00:00:00';
  const parsed = parseDeadlineBeijing(raw, nowMs);

  assert.strictEqual(parsed.normalized, '2026-10-15 00:00:00');
  assert.strictEqual(parsed.urgency, 'normal');
  assert.strictEqual(parsed.remainingText, '剩 6 天 2 小时');
  assert.ok(parsed.remainingHours > 0);

  // 希冀平台规范标签包裹: 作业时间：<b>...</b> 至 <b>...</b>
  const rawHtml = '作业时间：<b>2026-09-09 12:50:00</b> 至 <b>2026-10-15 00:00:00</b>';
  const parsedHtml = parseDeadlineBeijing(rawHtml, nowMs);
  assert.strictEqual(parsedHtml.normalized, '2026-10-15 00:00:00');
  assert.ok(parsedHtml.remainingHours > 0);
});

test('希冀平台侧边栏切分 (当前作业 vs 历史作业)', () => {
  const sampleSidebar = `
    <div class="sidebar">
      <div><i class="fas fa-clock"></i> 当前作业</div>
      <ul>
        <li>
          <a href="fileUploadList.jsp?proNum=1&assignID=3548">第七章链接-课后作业</a>
          <span>2026-09-09 12:50:00 至 2026-10-15 00:00:00</span>
        </li>
      </ul>
      <div><i class="fas fa-history"></i> 历史作业</div>
      <ul>
        <li><a href="index.jsp?assignID=2001">实训九 流水线CPU</a></li>
        <li><a href="index.jsp?assignID=2002">实训八 单周期CPU</a></li>
        <li><a href="index.jsp?assignID=2003">实训七 CPU组件设计</a></li>
      </ul>
    </div>
  `;

  const nowMs = Date.UTC(2026, 9, 8, 21, 56, 0) - 8 * 3600 * 1000;
  const list = parseActiveAssignmentsHtml(sampleSidebar, '计算机网络', nowMs);

  assert.strictEqual(list.length, 1);
  assert.strictEqual(list[0].id, '3548');
  assert.strictEqual(list[0].title, '第七章链接-课后作业');
  assert.strictEqual(list[0].deadline, '2026-10-15 00:00:00');
  assert.strictEqual(list[0].remainingText, '剩 6 天 2 小时');
});

test('希冀平台作业详情页解析 (/assignment/index.jsp 或 fileUploadList.jsp)', () => {
  const sampleDetail = `
    <ol class="breadcrumb">
      <li><a href="index.jsp">作业列表</a></li>
      <li class="active">第七章链接-课后作业</li>
    </ol>
    <div>
      <p>作业时间：<b>2026-09-09 12:50:00</b> 至 <b>2026-10-15 00:00:00</b></p>
      <a href="fileUploadList.jsp?proNum=1&assignID=3548">第一题：实验报告提交</a>
    </div>
  `;

  const nowMs = Date.UTC(2026, 9, 8, 21, 56, 0) - 8 * 3600 * 1000;
  const detail = parseAssignmentDetailHtml(sampleDetail, nowMs);
  assert.strictEqual(detail.title, '第七章链接-课后作业');
  assert.strictEqual(detail.deadline, '2026-10-15 00:00:00');
  assert.strictEqual(detail.remainingText, '剩 6 天 2 小时');
});

test('CourseGrading 课程列表解析 (/courselist.jsp)', () => {
  const sampleHtml = `
    <ul>
      <li><a href="courselist.jsp?courseID=1001"> 高等数学 </a></li>
      <li><a href="courselist.jsp?courseID=2002"> 人工智能导论 </a></li>
    </ul>
  `;

  const courses = parseCourseListHtml(sampleHtml);
  assert.strictEqual(courses.length, 2);
  assert.strictEqual(courses[0].id, '1001');
  assert.strictEqual(courses[0].name, '高等数学');
});

test('测试用例提取', () => {
  const problemHtml = `
    <div class="cgProblemContentClass">
      <h3>样例输入</h3>
      <pre>3 4\n1 2 3 4</pre>
      <h3>样例输出</h3>
      <pre>10</pre>
    </div>
  `;

  const testCases = parseTestCases(problemHtml);
  assert.strictEqual(testCases.length, 1);
  assert.strictEqual(testCases[0].input, '3 4\n1 2 3 4');
  assert.strictEqual(testCases[0].output, '10');
});
