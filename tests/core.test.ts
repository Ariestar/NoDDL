import test from 'node:test';
import assert from 'node:assert';
import { encryptPassword, decryptPassword } from '../src/core/crypto';
import { parseDeadlineBeijing, formatRemainingTime, calculateUrgency } from '../src/core/time';
import {
  parseCourseListHtml,
  parseActiveAssignmentsHtml,
  parseAssignmentDetailHtml,
  parseActiveCourseInfo,
  parseTestCases
} from '../src/core/parsers';
import { HomeworkDB } from '../src/core/db';
import { CourseGradingClient } from '../src/core/client';
import { StorageAdapter, Assignment, HttpClient } from '../src/core/types';
import { parseExperimentDeadlineFromDom } from '../src/userscript/experiment-dom';

class MemoryStorage implements StorageAdapter {
  private map = new Map<string, string>();
  async get(k: string) { return this.map.get(k) || null; }
  async set(k: string, v: string) { this.map.set(k, v); }
  async remove(k: string) { this.map.delete(k); }
}

class MockHttpClient implements HttpClient {
  public lastGetUrl = '';
  public lastPostUrl = '';
  public lastPostData: any = null;

  async get(url: string): Promise<string> {
    this.lastGetUrl = url;
    return 'ok';
  }

  async post(url: string, data?: unknown): Promise<string> {
    this.lastPostUrl = url;
    this.lastPostData = data;
    return 'ok';
  }
}

test('AES-ECB 密码加密与解密一致性', () => {
  const password = 'mypassword123';
  const encrypted = encryptPassword(password);
  assert.notStrictEqual(encrypted, password);

  const decrypted = decryptPassword(encrypted);
  assert.strictEqual(decrypted, password);
});

test('希冀平台生产真实结构：激活课程名称提取', () => {
  const realDropdownHtml = `
    <div class="dropdown-menu">
      <span class="dropdown-item dropdown-item-course font-weight-bold" value="184">离散数学</span>
      <span class="dropdown-item dropdown-item-course" value="182">计算机系统结构</span>
    </div>
  `;

  const info = parseActiveCourseInfo(realDropdownHtml);
  assert.strictEqual(info.id, '184');
  assert.strictEqual(info.name, '离散数学');
});

test('希冀平台生产真实结构：作业主卡片与精确时间解析', () => {
  // 来自真实 115.156.107.145/assignment/index.jsp?assignID=3548 导出 HTML
  const realCardHtml = `
    <div class="shadow-sm p-3 mb-3 bg-light rounded">
        <h4>第四周作业</h4>
        <p>
            作业时间：<b>2026-09-30 21:28:00</b> 至 <b>2026-10-11 23:59:00</b>
        </p>
        <div class="d-flex justify-content-between">
            <div>作业满分：<u><strong> 100.00 </strong></u></div>
        </div>
    </div>
  `;

  const nowMs = Date.UTC(2026, 9, 8, 23, 20, 0) - 8 * 3600 * 1000;
  const detail = parseAssignmentDetailHtml(realCardHtml, nowMs);

  assert.strictEqual(detail.title, '第四周作业');
  assert.strictEqual(detail.deadline, '2026-10-11 23:59:00');
  // 10月8日 23:20 到 10月11日 23:59: 约 72.6 小时 (剩 3 天)
  assert.ok(detail.remainingHours > 70 && detail.remainingHours < 75);
  assert.strictEqual(detail.remainingText, '剩 3 天 1 小时');
});

test('希冀平台生产真实结构：侧边栏当前作业与历史作业切分', () => {
  // 来自真实 115.156.107.145/assignment/fileUploadList.jsp 侧边栏导出 HTML
  const realSidebarHtml = `
    <span class="text-muted"><strong>
        <i class="fas fa-clock"></i> 当前作业</strong></span>
    <div class="list-group list-group-flush mb-4">
        <a href="index.jsp?courseID=184&amp;assignID=3548" class="list-group-item list-group-item-action active">
            第四周作业
        </a>
    </div>

    <span class="text-muted"><strong>
        <i class="fas fa-history"></i> 历史作业</strong></span>
    <div class="list-group list-group-flush">
        <a href="index.jsp?courseID=184&amp;assignID=3543" class="list-group-item list-group-item-action">
            第3周作业
        </a>                                 
        <a href="index.jsp?courseID=184&amp;assignID=3525" class="list-group-item list-group-item-action">
            第二周作业
        </a>                                 
        <a href="index.jsp?courseID=184&amp;assignID=3519" class="list-group-item list-group-item-action">
            第一周作业
        </a>                                 
    </div>
  `;

  const list = parseActiveAssignmentsHtml(realSidebarHtml, '离散数学');

  // 必须精准只抓取当前作业第四周作业 (3548)，历史作业不混入
  assert.strictEqual(list.length, 1);
  assert.strictEqual(list[0].id, '3548');
  assert.strictEqual(list[0].title, '第四周作业');
  assert.strictEqual(list[0].courseName, '离散数学');
});

test('希冀平台生产真实结构：入口按钮不作为作业名称', () => {
  const mainPageHtml = `
    <div class="main-zy">
      <div class="main-zy-box">
        <div class="main-box"><p class="main-title">第四周作业 </p></div>
      </div>
      <a href="assignment/index.jsp?assignID=3548"><div class="into">进入作业</div></a>
    </div>
  `;
  const experimentPageHtml = `
    <div class="card"><h4 class="title">括号匹配实验</h4>
      <a href="index.jsp?assignID=612&amp;guideID=5542"><button>开始实验</button></a>
    </div>
  `;

  const mainAssignments = parseActiveAssignmentsHtml(mainPageHtml);
  const experimentAssignments = parseActiveAssignmentsHtml(experimentPageHtml);

  assert.strictEqual(mainAssignments[0].title, '第四周作业');
  assert.strictEqual(experimentAssignments.length, 0);
});

test('希冀平台生产真实结构：fileUploadList 面包屑导航提取', () => {
  const realBreadcrumbHtml = `
    <nav aria-label="breadcrumb">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><a href="index.jsp?assignID=3548">第四周作业</a></li>
          <li class="breadcrumb-item"><a href="index.jsp?assignID=3548#An_Upload">文件上传题</a></li>
          <li class="breadcrumb-item active" aria-current="page"><b>1.</b> 课后练习题（习题3.1-3.5）</li>
        </ol>
    </nav>
  `;

  const detail = parseAssignmentDetailHtml(realBreadcrumbHtml);
  assert.strictEqual(detail.title, '第四周作业');
});

test('时间引擎：严格边界校验，杜绝无日期文本误判为 00-00 或 311 天', () => {
  const noDate1 = parseDeadlineBeijing('第八章异常控制流-课后作业');
  assert.strictEqual(noDate1.timestamp, 0);
  assert.strictEqual(noDate1.normalized, '请查看详情');
  assert.strictEqual(noDate1.remainingText, '待定');
});

test('时间引擎：标准格式解析与东八区校准', () => {
  const nowMs = Date.UTC(2026, 9, 15, 12, 0, 0) - 8 * 3600 * 1000;
  const d1 = parseDeadlineBeijing('2026-10-15 20:00:00', nowMs);
  assert.strictEqual(d1.normalized, '2026-10-15 20:00:00');
  assert.strictEqual(d1.remainingHours, 8);
  assert.strictEqual(d1.remainingText, '剩 8 小时');
});

test('云实验：直接读取真实 DOM 的截止时间', () => {
  const deadlineElement = { textContent: '开始时间：2026-10-15 16:00:00 截止时间：2026-10-15 20:00:00' };
  const fakeDocument = {
    querySelectorAll: (selector: string) => selector === '.blog-sidebar .panel-body p' ? [deadlineElement] : []
  } as unknown as Document;
  const nowMs = Date.UTC(2026, 9, 15, 12, 0, 0) - 8 * 3600 * 1000;

  const deadline = parseExperimentDeadlineFromDom(fakeDocument, nowMs);

  assert.strictEqual(deadline?.normalized, '2026-10-15 20:00:00');
  assert.strictEqual(deadline?.remainingHours, 8);
});

test('云实验：不从其他区域的日期文本猜测截止时间', () => {
  const fakeDocument = {
    querySelectorAll: () => [{ textContent: '实验说明：2026-10-15 20:00:00' }]
  } as unknown as Document;

  assert.strictEqual(parseExperimentDeadlineFromDom(fakeDocument), undefined);
});

test('云实验：保留原始实验入口链接', async () => {
  const db = new HomeworkDB(new MemoryStorage());
  await db.upsertAssignment({
    id: '612',
    courseName: '云实验',
    title: '实验',
    deadline: '2026-10-15 20:00:00',
    deadlineTimestamp: Date.UTC(2026, 9, 15, 12, 0, 0),
    remainingHours: 8,
    remainingText: '剩 8 小时',
    status: 'pending',
    urgency: 'urgent',
    url: '/exp/index.jsp?assignID=612'
  });

  assert.strictEqual((await db.getAllAssignments())[0].url, '/exp/index.jsp?assignID=612');
});

test('归一化结构存储：彻底杜绝重复课程，规范解析与排序', async () => {
  const db = new HomeworkDB(new MemoryStorage());

  // 1. 先插入一个临时占位课程 "当前课程"
  await db.upsertCourse('184', '当前课程');
  // 随后识别出规范课程名称 "离散数学" 并更新
  await db.upsertCourse('184', '离散数学');

  // 2. 插入未包含 DDL 的侧边栏作业
  await db.upsertAssignment({
    id: '3548',
    courseId: '184',
    courseName: '当前课程',
    title: '第四周作业',
    deadline: '请查看详情',
    deadlineTimestamp: 0,
    remainingHours: 9999,
    remainingText: '待定',
    status: 'pending',
    urgency: 'normal',
    url: '/assignment/index.jsp?assignID=3548'
  });

  // 3. 抓取到详情后补齐精确 DDL
  const ts = Date.UTC(2026, 9, 11, 23, 59, 0) - 8 * 3600 * 1000;
  await db.upsertAssignment({
    id: '3548',
    courseId: '184',
    courseName: '离散数学',
    title: '第四周作业',
    deadline: '2026-10-11 23:59:00',
    deadlineTimestamp: ts,
    remainingHours: 72,
    remainingText: '剩 3 天',
    status: 'pending',
    urgency: 'warning',
    url: '/assignment/index.jsp?courseID=184&assignID=3548'
  });

  // 4. 重复插入同一作业不应生成重复条目
  await db.upsertAssignment({
    id: '3548',
    courseId: '184',
    courseName: '当前课程',
    title: '第四周作业',
    deadline: '请查看详情',
    deadlineTimestamp: 0,
    remainingHours: 9999,
    remainingText: '待定',
    status: 'pending',
    urgency: 'normal',
    url: '/assignment/index.jsp?assignID=3548'
  });

  const list = await db.getAllAssignments();
  // 必须仅有一项
  assert.strictEqual(list.length, 1);
  const item = list[0];
  assert.strictEqual(item.id, '3548');
  assert.strictEqual(item.courseName, '离散数学'); // 课程名称必须关联为规范名称
  assert.strictEqual(item.deadline, '2026-10-11 23:59:00'); // 合法 DDL 得到保留
  assert.strictEqual(item.url, '/assignment/index.jsp?courseID=184&assignID=3548'); // 链接必须带有 courseID
});

test('短信提醒 (SMS)：占位符解析与触发支持', async () => {
  const http = new MockHttpClient();
  const storage = new MemoryStorage();
  const client = new CourseGradingClient({}, http, storage);

  // 写入一条临近截止的测试作业
  await client.db?.upsertAssignment({
    id: '1001',
    courseId: '10',
    courseName: '操作系统',
    title: '进程管理实验',
    deadline: '2026-10-10 12:00:00',
    deadlineTimestamp: Date.now() + 10 * 3600 * 1000,
    remainingHours: 10,
    remainingText: '剩 10 小时',
    status: 'pending',
    urgency: 'urgent',
    url: '/assignment/index.jsp?courseID=10&assignID=1001'
  });

  const res = await client.triggerPushAlert({
    smsPhone: '13812345678',
    smsWebhookUrl: 'http://127.0.0.1:8080/sms?phone={phone}&text={msg}',
    hoursThreshold: 24
  });

  assert.strictEqual(res.sent, true);
  assert.strictEqual(res.count, 1);
  assert.ok(http.lastGetUrl.includes('phone=13812345678'));
  assert.ok(decodeURIComponent(http.lastGetUrl).includes('操作系统'));
});
