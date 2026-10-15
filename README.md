# NoDDL (Not Only DDL) 🚀

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](extension/README.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

> **武汉大学人工智能学院一体化专业课平台 (http://115.156.107.145/) Chrome 扩展与工具包**
> 一套 TypeScript 代码，复用底层解析与业务逻辑，直接安装 Chrome 扩展即可使用。

---

## 🚀 快速开始

NoDDL 只支持自托管。每个用户都使用自己的 Cloudflare Worker、D1 数据库和加密密钥，课程会话不会进入共享服务。

1. 如果你是仓库所有者，请在 Cloudflare Workers & Pages 中选择“导入现有 Git 仓库”，连接 GitHub 后选择 `Ariestar/NoDDL`；其他用户可以点击下面的 **Deploy to Cloudflare**，把公开模板克隆到自己的账号并部署。
2. 在 [最新 Release](https://github.com/Ariestar/NoDDL/releases/latest) 下载扩展并解压。
3. 打开 `chrome://extensions`，启用“开发者模式”，加载解压后的 `extension` 目录；登录课程平台后，在设置中填入你自己的 Worker 地址。

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

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Ariestar/NoDDL)

使用 Deploy 按钮时，Cloudflare 会要求授权一个 GitHub 或 GitLab 账号，因为它会先把模板克隆到你的账号，再配置 Workers Builds、创建 D1 并部署 Worker。后续向仓库 `main` 分支推送代码时，Cloudflare 会自动重新部署，不需要 GitHub Actions。这是 Cloudflare Deploy Button 的固定流程，不能通过仓库配置取消 Git 授权。

如果不想绑定 Git 账号，就不能使用这个按钮；需要改用 Wrangler 或 Cloudflare API 上传，并单独完成 Cloudflare 登录、D1 初始化和密钥配置。

如果你登录的 GitHub 账号就是 `Ariestar`，请在 Cloudflare Workers & Pages 中选择“导入现有 Git 仓库”，直接选择 `Ariestar/NoDDL`；Deploy 按钮用于把公开模板克隆到其他账号，不能克隆到已经存在的同名仓库。

部署完成后，在扩展的“高级设置”中填入 Cloudflare 显示的 Worker 地址：

```text
https://你的 Worker 名称.你的 Cloudflare 子域.workers.dev
```

部署向导不需要填写 Resend。只有主动启用邮件提醒时，才在 Cloudflare Worker 的“Variables & Secrets”中添加下面的可选配置：

- `EMAIL_CODE_SECRET`：至少 32 位随机字符串
- `RESEND_API_KEY`：启用邮箱提醒时需要
- `RESEND_FROM`：可选，默认使用 `onboarding@resend.dev`

上面三个变量只在启用邮件提醒时需要；课程同步、自动同步和日历不需要额外密钥。仓库不再提供 `.env.example`，避免 Cloudflare Deploy 按钮把可选邮件变量误识别为必填项。Release 扩展不包含公共服务地址，只连接你填写的自托管 Worker。

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
