# NoDDL (Not Only DDL) 🚀

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](extension/README.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

> **武汉大学人工智能学院一体化专业课平台 (http://115.156.107.145/) Chrome 扩展与工具包**
> 一套 TypeScript 代码，复用底层解析与业务逻辑，直接安装 Chrome 扩展即可使用。

---

## 🚀 快速开始

NoDDL 只支持自托管。每个用户都使用自己的 Cloudflare Worker、D1 数据库和加密密钥，课程会话不会进入共享服务。

1. [Fork 仓库](https://github.com/Ariestar/NoDDL/fork) 到自己的 GitHub 账户。
2. 打开 Fork 的 **Actions** 页面，点击 **I understand my workflows, enable them**。
3. 按下面的“自托管到 Cloudflare”流程部署 Worker。
4. 从 Fork 的 Actions 下载 `NoDDL-extension-self-hosted`，解压后打开 `chrome://extensions`，启用“开发者模式”，选择“加载已解压的扩展程序”，选中其中的 `extension` 目录。
5. 登录课程平台，扩展会自动绑定课程会话。

## 💻 1. Chrome 扩展说明

### 本地加载
按照 [Chrome 扩展安装说明](extension/README.md) 加载 `extension` 目录。Chrome 只有通过 Chrome Web Store 安装才能跳过开发者模式；GitHub Release 提供的是可审查、可本地加载的构建包。

### 主要功能
访问 `http://115.156.107.145/` 后自动启用。

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

## ☁️ 自托管到 Cloudflare

[![Fork on GitHub](https://img.shields.io/badge/Fork_on_GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Ariestar/NoDDL/fork)
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Ariestar/NoDDL)

按下面流程完成自己的 Worker 和数据存储：

1. 将仓库 [Fork 到自己的 GitHub 账户](https://github.com/Ariestar/NoDDL/fork)。
2. 打开 Fork 的 **Actions** 页面，点击 **I understand my workflows, enable them**。这是 GitHub 对新 Fork 的安全要求，仓库代码无法代替用户开启 Actions。
3. 点击上面的 Cloudflare 按钮，选择 **Continue with GitHub**，再选择自己的 Fork 和 `main` 分支。
4. Cloudflare 会向 Fork 发送部署事件；如果你是在启用 Actions 之前点击的按钮，打开 Fork 的 **Actions → Deploy to Cloudflare → Run workflow** 手动补触发一次。
5. 等待部署完成。工作流会自动创建 D1、生成加密密钥、启用 `workers.dev`、部署 Worker 并构建自托管扩展。
6. 在最新一次运行中下载 `NoDDL-extension-self-hosted`，解压后在 `chrome://extensions` 中加载其中的 `extension` 目录。

邮件提醒的可选配置：

- `EMAIL_CODE_SECRET`：至少 32 位随机字符串
- `RESEND_API_KEY`：启用邮箱提醒时需要
- `RESEND_FROM`：可选，默认使用 `onboarding@resend.dev`

上面三个变量只在启用邮件提醒时需要；课程同步、自动同步和日历不需要手动填写密钥或域名。自托管构建包已经写入你的 Worker 地址，不需要再打开扩展设置填写服务地址。

如果使用通用 Release 扩展，它不包含任何公共服务地址，需要在扩展的“高级设置”中填入自己的 Worker 地址，例如：

```text
https://你的 Worker 名称.你的 Cloudflare 子域.workers.dev
```

扩展会自动绑定课程会话；每天北京时间 02:00 由 Cloudflare Cron 抓取全部课程、作业和云实验并更新日历 Feed。手机日历使用扩展生成的服务器地址、账户名 `noddl` 和 Feed Token。

邮件提醒使用 Resend 作为发信服务，其余运行时数据都保存在 Cloudflare D1。

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

---

## 📄 开源许可
MIT License.
