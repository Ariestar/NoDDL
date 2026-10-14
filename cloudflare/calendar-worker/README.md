# NoDDL Calendar Worker

This Worker is the public CalDAV edge for the phone calendar. It reads the published iCalendar feed from the existing Vercel API, which is backed by the same Upstash Redis data, and translates it into CalDAV discovery responses.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Ariestar/NoDDL/tree/main/cloudflare/calendar-worker)

## One-click deployment

Click the button above, sign in to Cloudflare, and choose a Worker name. Cloudflare deploys the Worker to your account and provides a `workers.dev` address; a custom domain is not required.

Use this path as the Vivo calendar server address:

```text
https://<your-worker>.<your-cloudflare-subdomain>.workers.dev/api/caldav-server/
```

Use `noddl` (or any label) as the account name. Use the calendar Feed Token shown in the NoDDL extension as the password. The Worker remains an edge adapter: course scraping, feed publishing, automatic sync, and email features continue to use the Vercel API.

Deploy with:

```bash
npx wrangler deploy --config cloudflare/calendar-worker/wrangler.toml
```

The current public address is `https://nodd-calendar.1941137088.workers.dev/api/caldav-server/`.
