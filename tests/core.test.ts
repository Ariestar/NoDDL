import test from 'node:test';
import assert from 'node:assert';
import { encryptPassword, decryptPassword } from '../src/core/crypto';
import { calculateUrgency, formatRemainingTime, parseDeadline, formatNotificationContent } from '../src/core/ddl';
import {
  parseCourseListHtml,
  parseActiveAssignmentsHtml,
  parseAssignmentIndexHtml,
  parseProblemTestCases
} from '../src/core/parser';

test('AES-ECB 密码加密与解密一致性', () => {
  const password = 'mypassword123';
  const encrypted = encryptPassword(password);
  assert.notStrictEqual(encrypted, password);

  const decrypted = decryptPassword(encrypted);
  assert.strictEqual(decrypted, password);
});

test('DDL 紧急度计算与文本生成', () => {
  assert.strictEqual(calculateUrgency(3), 'critical');
  assert.strictEqual(calculateUrgency(18), 'urgent');
  assert.strictEqual(calculateUrgency(48), 'warning');
  assert.strictEqual(calculateUrgency(100), 'normal');
  assert.strictEqual(calculateUrgency(-2), 'passed');

  assert.strictEqual(formatRemainingTime(0.5), '仅剩 30 分钟');
  assert.strictEqual(formatRemainingTime(5), '剩余 5 小时');
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
      <p class="main-title"><a href="/assignment/index.jsp?assignID=5001"> 实验三：CNN图像分类 </a></p>
      <p class="main-time">截止时间：2026-10-10 23:59:00</p>
    </div>
  `;

  const assignments = parseActiveAssignmentsHtml(sampleHtml, '计算机视觉', new Date('2026-10-08T12:00:00Z').getTime());
  assert.strictEqual(assignments.length, 1);
  assert.strictEqual(assignments[0].id, '5001');
  assert.strictEqual(assignments[0].title, '实验三：CNN图像分类');
  assert.strictEqual(assignments[0].courseName, '计算机视觉');
  assert.strictEqual(assignments[0].status, 'pending');
});

test('CourseGrading 作业详情与题目列表解析 (/assignment/index.jsp)', () => {
  const sampleHtml = `
    <span>当前作业</span><b>实训二</b>
    <p>截止时间：2026-10-10 23:59:00</p>
    <table class="table table-striped">
      <thead>
        <tr><th>#</th><th>题目</th><th>分值</th><th>详细信息</th></tr>
      </thead>
      <tr>
        <th>1.</th>
        <td><a href="/assignment/programList.jsp?proNum=1&assignID=1001"> 第一题：快速排序</a></td>
        <td>100.00</td>
        <td><a href="/assignment/judgeDetailsRedirect.jsp?assignID=1001&problemID=20001">详细</a></td>
      </tr>
    </table>
  `;

  const detail = parseAssignmentIndexHtml(sampleHtml);
  assert.strictEqual(detail.title, '实训二');
  assert.strictEqual(detail.deadline, '2026-10-10 23:59:00');
  assert.strictEqual(detail.problems.length, 1);
  assert.strictEqual(detail.problems[0].title, '第一题：快速排序');
  assert.strictEqual(detail.problems[0].score, 100);
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

  const testCases = parseProblemTestCases(problemHtml);
  assert.strictEqual(testCases.length, 1);
  assert.strictEqual(testCases[0].input, '3 4\n1 2 3 4');
  assert.strictEqual(testCases[0].output, '10');
});

test('告警推送消息组装', () => {
  const assignments = [
    {
      id: '1',
      courseName: '计算机视觉',
      title: '实训一',
      deadline: '2026-10-09 12:00:00',
      deadlineTimestamp: Date.now() + 1000 * 3600 * 5,
      remainingHours: 5,
      remainingText: '剩余 5 小时',
      status: 'pending' as const,
      urgency: 'critical' as const
    }
  ];

  const notification = formatNotificationContent(assignments);
  assert.ok(notification.title.includes('NoDDL 预警'));
  assert.ok(notification.markdown.includes('计算机视觉'));
  assert.ok(notification.html.includes('实训一'));
});
