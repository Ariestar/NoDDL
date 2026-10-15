# OAuth 自动更新服务

这是维护者配置，运行在 Cloudflare Worker，不需要 Vercel、Upstash 或独立 API 服务。

在 Cloudflare 创建公开 OAuth Client：

- 回调地址：`https://mail.sair-club.com/api/oauth`
- Authorization Code 流程
- 服务端 `client_secret_post`
- 只授予读取账户与 Worker、管理 Workers Builds 的最小范围

把 `mail.sair-club.com` 作为当前 Worker 的 Custom Domain，然后在该 Worker 配置以下 Variables & Secrets：

```text
CF_OAUTH_CLIENT_ID
CF_OAUTH_CLIENT_SECRET
CF_OAUTH_REDIRECT_URI=https://mail.sair-club.com/api/oauth
CF_OAUTH_SCOPE=<Cloudflare OAuth Client 中配置的 scope>
OAUTH_STATE_SECRET=<至少 32 位随机值>
NODDL_RELEASE_WEBHOOK_SECRET=<至少 32 位随机值>
```

部署后执行 D1 迁移 `migrations/0002_oauth_registrations.sql`。OAuth 注册信息和加密后的 Deploy Hook URL 都存放在该 Worker 绑定的 D1 中；Cloudflare OAuth Access Token 只在回调请求期间使用，不进入用户仓库或 Release 包。

GitHub Actions 只需要同名的 `NODDL_RELEASE_WEBHOOK_SECRET`，用于调用 `https://mail.sair-club.com/api/release-dispatch`。Release 发布后，Worker 会向所有已授权的自托管 Worker 触发 Deploy Hook。
