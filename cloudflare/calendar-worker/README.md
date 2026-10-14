# NoDDL Calendar Worker

This Worker is the public CalDAV edge for the phone calendar. It reads the published iCalendar feed from the existing Vercel API, which is backed by the same Upstash Redis data, and translates it into CalDAV discovery responses.

Deploy with:

```bash
npx wrangler deploy --config cloudflare/calendar-worker/wrangler.toml
```

The current public address is `https://nodd-calendar.1941137088.workers.dev/api/caldav-server/`.
