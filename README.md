# NoDDL (Not Only DDL) 🚀

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](extension/README.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

> **武汉大学人工智能学院一体化专业课平台 (http://115.156.107.145/) Chrome 扩展与工具包**
> 一套 TypeScript 代码，复用底层解析与业务逻辑，直接安装 Chrome 扩展即可使用。

---

## 💡 为什么叫 NoDDL？

* **No DDL**：拒绝死线压迫，在最后一秒前搞定作业。
* **Not Only DDL**：仿照 NoSQL（Not Only SQL）命名，它**不仅是死线提醒**，还包含：
  * 📋 **样例测试用例一键复制**：在题目描述中一键复制输入输出样例。
  * 💾 **代码防丢实时暂存**：自动保存编辑框代码至本地存储，误关标签页一键恢复。
  * 🔄 **评测状态追踪**：自动获取判题与测试点结果。
  * 🔔 **全渠道消息推送**：支持微信（PushPlus）、iOS（Bark）与自定义 Webhook。

---

## 📦 项目结构

```text
NoDDL/
├── ailuo.toml                # ailuo 包清单 (isolated executor 组件)
├── package.json
├── tsconfig.json
├── tsup.config.ts            # 构建 NPM / TS 工具库与 CLI
├── vite.extension.config.ts  # 构建 Chrome 扩展 content script
│
├── src/
│   ├── core/                 # 【公用底层核心逻辑】
│   │   ├── types.ts          # 统一数据结构
│   │   ├── crypto.ts         # 平台 AES 密码加解密
│   │   ├── parser.ts         # 页面表格与题目用例解析
│   │   ├── ddl.ts            # 死线计算与告警文本格式化
│   │   ├── client.ts         # CourseGradingClient (HTTP 请求与业务封装)
│   │   └── index.ts          # core 统一导出
│   │
│   ├── cli.ts                # 【命令行入口 / ailuo 包入口】
│   │
│   └── extension/            # 【Chrome 扩展 content script】
│       ├── index.ts          # 浏览器环境启动与生命周期
│       ├── ui.ts             # 顶部横幅、样例复制、代码暂存
│       └── browser-adapter.ts# Chrome fetch 与本地存储封装
│
└── dist/
    ├── index.js / index.cjs  # 产物 1：TS / JS 工具包（供外部直接 import）
    └── cli.cjs               # 产物 2：独立 CLI 工具 / ailuo entrypoint
```

---

## 🛠️ 构建与打包

### 1. 安装与测试
```bash
pnpm install
pnpm test
```

### 2. 编译
```bash
pnpm build
```

产物生成：
* **`extension/nodd-extension.js`**：Chrome 扩展 content script。
* **`dist/index.js` & `dist/index.d.ts`**：作为 npm / TS 库被外部代码引用。
* **`cli.cjs`**：包的直接执行入口。

### 3. 打包为 ailuo 包
```bash
# 使用 ailuo-pm 直接打包为 .tgz
ailuo-pm pack . dist
```

---

## 💻 1. Chrome 扩展功能说明

### 一键安装
按照 [Chrome 扩展安装说明](extension/README.md) 加载 `extension` 目录。

### 主要功能
访问 `http://115.156.107.145/` 后自动启用：
* **死线倒计时横幅**：顶部常驻显示最近截止作业倒计时，支持展开未完成列表。
* **测试用例复制**：在题目页所有 `<pre>` 样例右上角注入「📋 复制样例」按钮。
* **代码自动暂存**：编辑框输入自动保存到本地，误关网页可一键「💾 恢复自动暂存代码」。
* **推送配置**：横幅右上角点击「⚙️ 推送设置」，填入 PushPlus Token 或 Bark URL。
*(本地开发调试构建产物位于 `extension/nodd-extension.js`)*

---

## ⌨️ 2. 工具包 / CLI 使用

既可以作为库在代码中调用：
```typescript
import { CourseGradingClient } from '@projectluojia/nodd-l';

const client = new CourseGradingClient({ sessionCookie: 'educg_session=xxxx' });
const pending = await client.getPendingAssignments(48);
console.log(pending);
```

也可以直接通过命令行运行：
```bash
# 查询未完成作业
node cli.cjs list --cookie "educg_session=xxxx" --threshold 72

# 测试账号密码自动加密登录
node cli.cjs login --stid "2023xxxxxxxx" --pwd "your_password"

# 查询题目详情与测试用例
node cli.cjs detail --id "problem_101" --cookie "educg_session=xxxx"

# 触发死线告警推送
node cli.cjs push --threshold 48 --pushplus "YOUR_TOKEN"
```

## ☁️ 一键部署到 Cloudflare

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Ariestar/NoDDL)

Cloudflare Worker 现在同时提供课程 API、自动同步、Feed 和 CalDAV。部署向导会创建 D1 数据库；首次部署后，在 Worker 设置中填写：

- `SYNC_ENCRYPTION_KEY`：至少 32 位随机字符串
- `EMAIL_CODE_SECRET`：至少 32 位随机字符串（启用邮箱提醒时需要）
- `RESEND_API_KEY`：启用邮箱提醒时需要
- `RESEND_FROM`：可选，默认使用 `onboarding@resend.dev`

部署完成后，把 Worker 地址填入扩展设置的“服务地址”，例如：

```text
https://你的 Worker 名称.你的 Cloudflare 子域.workers.dev
```

扩展会自动绑定课程会话；每天北京时间 02:00 由 Cloudflare Cron 抓取全部课程、作业和云实验并更新日历 Feed。手机日历使用扩展生成的服务器地址、账户名 `noddl` 和 Feed Token。

邮件提醒使用 Resend 作为发信服务，其余运行时数据都保存在 Cloudflare D1。

---

## 📄 开源许可
MIT License.
