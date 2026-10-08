# NoDDL (Not Only DDL) 🚀

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

安装 `dist/nodd-l.user.js` 后访问 `http://115.156.107.145/`：
* **死线倒计时横幅**：顶部常驻显示最近截止作业倒计时，支持展开未完成列表。
* **测试用例复制**：在题目页所有 `<pre>` 样例右上角注入「📋 复制样例」按钮。
* **代码自动暂存**：编辑框输入自动保存到本地，误关网页可一键「💾 恢复自动暂存代码」。
* **推送配置**：横幅右上角点击「⚙️ 推送设置」，填入 PushPlus Token 或 Bark URL。
* **凭据复制**：点击「📋 复制会话凭据」，自动复制当前 Cookie。

---

## ⌨️ 2. 工具包 / CLI 使用

既可以作为库在代码中调用：
```typescript
import { CourseGradingClient } from '@projectluojia/nodd-l';

const client = new CourseGradingClient({ sessionCookie: 'JSESSIONID=xxxx' });
const pending = await client.getPendingAssignments(48);
console.log(pending);
```

也可以直接通过命令行运行：
```bash
# 查询未完成作业
node cli.cjs list --cookie "JSESSIONID=xxxx" --threshold 72

# 测试账号密码自动加密登录
node cli.cjs login --stid "2023xxxxxxxx" --pwd "your_password"

# 查询题目详情与测试用例
node cli.cjs detail --id "problem_101" --cookie "JSESSIONID=xxxx"

# 触发死线告警推送
node cli.cjs push --threshold 48 --pushplus "YOUR_TOKEN"
```

---

## 📄 开源许可
MIT License.
