# NoDDL (Not Only DDL) 🚀

[![Install with Tampermonkey](https://img.shields.io/badge/Install_with-Tampermonkey-00485B?style=for-the-badge&logo=tampermonkey&logoColor=white)](https://raw.githubusercontent.com/Ariestar/NoDDL/main/dist/nodd-l.user.js)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FAriestar%2FNoDDL&env=UPSTASH_REDIS_REST_URL%2CUPSTASH_REDIS_REST_TOKEN%2CRESEND_API_KEY%2CEMAIL_CODE_SECRET%2CSYNC_ENCRYPTION_KEY%2CCRON_SECRET&envDescription=%E4%B8%80%E6%AC%A1%E5%A1%AB%E5%86%99%20Upstash%20Redis%E3%80%81Resend%20%E5%92%8C%E9%AA%8C%E8%AF%81%E7%A0%81%E5%AF%86%E9%92%A5%EF%BC%8C%E6%9C%8D%E5%8A%A1%E5%9C%B0%E5%9D%80%E4%BC%9A%E8%87%AA%E5%8A%A8%E5%86%99%E5%85%A5%E8%84%9A%E6%9C%AC)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

> **武汉大学人工智能学院一体化专业课平台 (http://115.156.107.145/) 工具包与油猴脚本**  
> 一套 TypeScript 代码，公用底层逻辑：既是**浏览器油猴脚本 (Tampermonkey)**，又是可直接打包进 **ailuo 包管理器** 的通用工具包。

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
├── vite.config.ts            # 构建油猴脚本 (.user.js)
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
│   └── userscript/           # 【油猴脚本入口】
│       ├── index.ts          # 浏览器环境启动与生命周期
│       ├── ui.ts             # 顶部横幅、样例复制、代码暂存
│       ├── browser-adapter.ts# 浏览器 fetch 与 GM API 封装
│       └── types.d.ts        # 油猴 GM API 类型声明
│
└── dist/
    ├── nodd-l.user.js        # 产物 1：油猴脚本（直接安装到浏览器）
    ├── index.js / index.cjs  # 产物 2：TS / JS 工具包（供外部直接 import）
    └── cli.cjs               # 产物 3：独立 CLI 工具 / ailuo entrypoint
```

---

## 🛠️ 构建与打包

### 1. 安装与测试
```bash
pnpm install
pnpm test
```

### 2. 双端编译
```bash
pnpm build
```

产物生成：
* **`dist/nodd-l.user.js`**：独立油猴脚本，浏览器打开直接安装。
* **`dist/index.js` & `dist/index.d.ts`**：作为 npm / TS 库被外部代码引用。
* **`cli.cjs`**：包的直接执行入口。

### 3. 打包为 ailuo 包
```bash
# 使用 ailuo-pm 直接打包为 .tgz
ailuo-pm pack . dist
```

---

## 💻 1. 油猴脚本功能说明

### 一键安装
直接点击上方 **`Install with Tampermonkey`** 徽章，浏览器扩展将自动拦截并弹出安装确认界面。

### 主要功能
访问 `http://115.156.107.145/` 后自动启用：
* **死线倒计时横幅**：顶部常驻显示最近截止作业倒计时，支持展开未完成列表。
* **测试用例复制**：在题目页所有 `<pre>` 样例右上角注入「📋 复制样例」按钮。
* **代码自动暂存**：编辑框输入自动保存到本地，误关网页可一键「💾 恢复自动暂存代码」。
* **推送配置**：横幅右上角点击「⚙️ 推送设置」，填入 PushPlus Token 或 Bark URL。
* **凭据复制**：点击「📋 复制会话凭据」，自动复制当前 Cookie。

*(本地开发调试构建产物位于 `dist/nodd-l.user.js`)*

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

## ✉️ 邮件提醒服务

邮件验证码和作业提醒由 Vercel Functions 通过 Resend API 发送。API Key、Redis 和可选发件域名配置见 [邮件服务配置说明](docs/email-service.md)。

## ☁️ 使用自己的 Vercel 地址

不需要购买域名。Vercel 会为每个项目提供一个 `https://项目名.vercel.app` 的生产地址。

1. 点击上方按钮，按页面提示连接 Upstash 和 Resend，并填写验证码密钥。
2. 部署完成后打开 `https://你的项目.vercel.app/nodd-l.user.js` 安装脚本。
3. 脚本会自动使用当前 Vercel 项目的生产地址，日历、Webcal、CalDAV 和邮件绑定都走这个服务。

邮件默认使用 Resend 的 `onboarding@resend.dev` 发件人，不需要购买域名。需要自定义发件人时，再额外设置可选变量 `RESEND_FROM`。部署链接只声明变量名称，不会把密码、Redis Token 或 API Key 放进 URL；这些值由你在 Vercel 部署页填写，不要提交到仓库。

### 每日自动同步

部署后 userscript 会默认尝试启用自动同步；也可以在“手机日历”区域手动重新绑定会话。脚本通过 `GM_cookie` 读取当前课程平台的登录会话，服务端只保存 AES-GCM 加密后的 Session 和完整作业快照，不保存学号或密码。Vercel Cron 每天北京时间 02:00 抓取全部课程、普通作业和云实验，并更新日历 feed。

需要在 Vercel 配置 `SYNC_ENCRYPTION_KEY` 和 `CRON_SECRET`，都使用至少 32 位随机字符串。课程平台 Session 过期后，自动同步会记录失败状态，需要重新点击绑定；日历订阅地址不会改变。

---

## 📄 开源许可
MIT License.
