import test from 'node:test';
import assert from 'node:assert';
import { encryptPassword, decryptPassword } from '../src/core/crypto';
import { calculateUrgency, formatRemainingTime, parseDeadline, formatNotificationContent } from '../src/core/ddl';
import { parseHomeworkListHtml, parseProblemTestCases } from '../src/core/parser';

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

test('作业 HTML 表格解析', () => {
  const sampleHtml = `
    <table>
      <tr>
        <td>机器学习与深度学习</td>
        <td><a href="/pages/detail.jsp?id=hw_99">实验三：CNN模型训练</a></td>
        <td>2026-10-09 23:59:00</td>
        <td>未提交</td>
        <td>100</td>
      </tr>
    </table>
  `;

  const parsed = parseHomeworkListHtml(sampleHtml, new Date('2026-10-08T12:00:00Z').getTime());
  assert.strictEqual(parsed.length, 1);
  assert.strictEqual(parsed[0].title, '实验三：CNN模型训练');
  assert.strictEqual(parsed[0].courseName, '机器学习与深度学习');
  assert.strictEqual(parsed[0].status, 'pending');
});

test('测试用例提取', () => {
  const problemHtml = `
    <div class="problem">
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
