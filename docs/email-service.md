# 邮件提醒服务

NoDDL 通过 Resend API 发送邮箱验证码和作业提醒。用户只需验证自己的邮箱；发信 API Key 保存在 Vercel 服务端。

## 配置 Resend

1. 在 [Resend](https://resend.com/) 注册账号。
2. 在 **Domains** 添加并验证你管理 DNS 的发信域名。你提供的 `mail.sair-club.com` 可作为发件域。
3. 在 **API Keys** 创建一个用于发送邮件的 API Key，复制一次性显示的 Key。
4. 在 Resend 的域名详情中复制 DKIM、SPF 等 DNS 记录，添加到该域名的 DNS 提供商，等待验证通过。

Resend 的 `onboarding@resend.dev` 适合初步验证；多用户发信要使用已验证域名下的 `RESEND_FROM` 地址。

## 配置 Vercel

打开 [nodd-l-email 环境变量](https://vercel.com/ariestars-projects/nodd-l-email/settings/environment-variables)，选择 **Production**，添加：

| 变量 | 值 |
|---|---|
| `RESEND_API_KEY` | Resend API Key（设为 Sensitive） |
| `RESEND_FROM` | 发件地址，例如 `NoDDL <no-reply@mail.sair-club.com>` |
| `EMAIL_CODE_SECRET` | 随机生成、至少 32 字符的密钥（设为 Sensitive） |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis 的 REST URL（设为 Sensitive） |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis 的 REST Token（设为 Sensitive） |

`VITE_EMAIL_API_BASE_URL` 配置为 `https://mail.sair-club.com`。不要把 API Key 或 Redis Token 提交到 Git，也不要发到聊天里。

在 [Upstash Console](https://console.upstash.com/) 创建 Redis 数据库后，从数据库详情页复制 REST URL 和 REST Token。数据库用于验证码、已验证邮箱绑定和发送限流。

生成 `EMAIL_CODE_SECRET`：

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

保存完环境变量后，重新部署 `nodd-l-email`。然后在 Tampermonkey 安装 [线上 userscript](https://nodd-l-email.vercel.app/nodd-l.user.js)，打开课程平台，在“推送与提醒”中绑定邮箱并发送测试邮件。

## 服务行为

- 验证码 10 分钟有效；同一邮箱每天最多申请 3 次，服务端也限制 IP 和总发送量。
- 邮件只发给用户已验证的地址，支持解绑。
- 提醒由 userscript 在课程页面运行时触发；浏览器关闭时不会自动同步课程和发信。
