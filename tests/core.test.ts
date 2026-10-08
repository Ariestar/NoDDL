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
  // 当前时间: 2026-10-08 21:56:00
  const nowMs = Date.UTC(2026, 9, 8, 21, 56, 0) - 8 * 3600 * 1000;

  // 典型格式: 开始时间 至 结束时间
  const raw = '第七章链接-课后作业 2026-09-09 12:50:00 至 2026-10-15 00:00:00';
  const parsed = parseDeadlineBeijing(raw, nowMs);

  assert.strictEqual(parsed.normalized, '2026-10-15 00:00:00');
  assert.strictEqual(parsed.urgency, 'normal');
  assert.strictEqual(parsed.remainingText, '剩 6 天 2 小时');
  assert.ok(parsed.remainingHours > 0, '截止时间应该在未来，而不是识别成开始时间后已逾期');

  // 波浪号连接与缺年格式
  const raw2 = '实训 09-09 12:00 ~ 10-12 18:00';
  const parsed2 = parseDeadlineBeijing(raw2, nowMs);
  assert.strictEqual(parsed2.normalized, '2026-10-12 18:00:00');
  assert.ok(parsed2.remainingHours > 0);
});

test('时间引擎：已过期与紧急程度梯队判定', () => {
  const nowMs = Date.UTC(2026, 9, 15, 12, 0, 0) - 8 * 3600 * 1000;

  // 已过期
  const passed = parseDeadlineBeijing('2026-10-14 20:00:00', nowMs);
  assert.strictEqual(passed.urgency, 'passed');
  assert.ok(passed.remainingText.includes('已超 DDL'));

  // <6h: 极紧急
  assert.strictEqual(calculateUrgency(3), 'critical');
  // <24h: 紧急
  assert.strictEqual(calculateUrgency(18), 'urgent');
  // <72h: 关注
  assert.strictEqual(calculateUrgency(48), 'warning');
  // >72h: 正常
  assert.strictEqual(calculateUrgency(100), 'normal');

  assert.strictEqual(formatRemainingTime(0.5), '仅剩 30 分钟');
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
  assert.strictEqual(courses[1].id, '2002');
  assert.strictEqual(courses[1].name, '人工智能导论');
});

test('CourseGrading 活跃作业列表解析 (/assignment/mainActiveAssigns.jsp)', () => {
  const sampleHtml = `
    <div class="main-zy">
      <p class="main-title"><a href="/assignment/index.jsp?assignID=5001"> 第七章链接-课后作业 </a></p>
      <p class="main-time">2026-09-09 12:50:00 至 2026-10-15 00:00:00</p>
    </div>
  `;

  const nowMs = Date.UTC(2026, 9, 8, 21, 56, 0) - 8 * 3600 * 1000;
  const assignments = parseActiveAssignmentsHtml(sampleHtml, '计算机视觉', nowMs);
  assert.strictEqual(assignments.length, 1);
  assert.strictEqual(assignments[0].id, '5001');
  assert.strictEqual(assignments[0].title, '第七章链接-课后作业');
  assert.strictEqual(assignments[0].courseName, '计算机视觉');
  assert.strictEqual(assignments[0].deadline, '2026-10-15 00:00:00');
  assert.strictEqual(assignments[0].status, 'pending');
  assert.strictEqual(assignments[0].remainingText, '剩 6 天 2 小时');
});

test('CourseGrading 作业详情页解析 (/assignment/index.jsp)', () => {
  const sampleHtml = `
    <span>当前作业</span><b>实训二：特征匹配</b>
    <p>截止时间：2026-09-09 12:50:00 至 2026-10-15 00:00:00</p>
  `;

  const nowMs = Date.UTC(2026, 9, 8, 21, 56, 0) - 8 * 3600 * 1000;
  const detail = parseAssignmentDetailHtml(sampleHtml, nowMs);
  assert.strictEqual(detail.title, '实训二：特征匹配');
  assert.strictEqual(detail.deadline, '2026-10-15 00:00:00');
  assert.strictEqual(detail.remainingText, '剩 6 天 2 小时');
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
