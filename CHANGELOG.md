# Changelog

## Unreleased

- Remove a one-use UI barrel export.

## 1.0.65 - 2026-10-15

- Add deadline reminders one day and fifteen minutes in advance.

## 1.0.64 - 2026-10-15

- Keep a one-minute end time so Vivo does not render point events as 1970.

## 1.0.63 - 2026-10-15

- Represent course deadlines as point events with a fifteen-minute reminder.

## 1.0.62 - 2026-10-15

- Require CalDAV capability discovery to complete Basic authentication for Vivo clients.

## 1.0.61 - 2026-10-15

- Move CalDAV reads to the Cloudflare Worker and remove the Vercel CalDAV handlers and temporary deployment hosts.

## 1.0.60 - 2026-10-15

- Point CalDAV setup at the latest verified deployment host after Vercel system mitigation on older hosts.

## 1.0.59 - 2026-10-15

- Route CalDAV clients through the verified deployment host that avoids the active Vercel challenge.

## 1.0.58 - 2026-10-15

- Use the canonical Vercel domain for CalDAV clients instead of domains challenged by Vercel Firewall.

## 1.0.57 - 2026-10-15

- Use the stable Vercel project domain for CalDAV clients that are challenged on the custom domain.

## 1.0.56 - 2026-10-15

- Serve individual CalDAV events through the existing calendar endpoint instead of an unimplemented event path.

## 1.0.55 - 2026-10-15

- Include calendar events in CalDAV collection discovery for clients that do not issue a follow-up report.

## 1.0.54 - 2026-10-15

- Allow unauthenticated CalDAV capability discovery before credential validation.

## 1.0.53 - 2026-10-15

- Confirm the server-side calendar item count after every full sync and keep sync independent from auto-sync status reads.

## 1.0.52 - 2026-10-15

- Refresh CalDAV clients with data-based collection ETags and preserve existing assignments when a full sync fails.

## 1.0.51 - 2026-10-15

- Use one browser-session sync path for page load and manual full sync.
- Remove the server refresh path that cannot reach the course platform from Vercel.

## 1.0.50 - 2026-10-15

- Keep manual full sync on the bound server session even when background sync is disabled.

## 1.0.49 - 2026-10-15

- Reuse the sync status endpoint for manual refresh to stay within Vercel Hobby's function limit.

## 1.0.48 - 2026-10-15

- Run manual full sync through the bound server session and update the calendar feed in the same request.

## 1.0.47 - 2026-10-15

- Surface sync failures without clearing the current assignment list.
- Remove the silent autosave JSON fallback.

## 1.0.46 - 2026-10-15

- Preserve course results when a calendar publish fails after full sync.

## 1.0.45 - 2026-10-15

- Publish all parsed course DDLs to calendar feeds, including overdue items.
- Return CalDAV collection metadata according to the requested depth.

## 1.0.44 - 2026-10-15

- Make full sync always publish the latest assignments to the calendar service.
- Remove redundant automatic-sync status copy.

## 1.0.43 - 2026-10-15

- Use an ASCII CalDAV authentication realm so Node accepts the challenge header.

## 1.0.42 - 2026-10-15

- Use a dedicated CalDAV endpoint to avoid Vercel file-route conflicts.

## 1.0.41 - 2026-10-15

- Expose explicit CalDAV entry handlers for Vercel function discovery.

## 1.0.40 - 2026-10-15

- Share one CalDAV handler between the root and collection routes for Vercel runtime compatibility.

## 1.0.39 - 2026-10-15

- Add a root CalDAV endpoint so mobile clients can validate the server address.

## 1.0.38 - 2026-10-15

- Use the tokenized CalDAV endpoint as the mobile calendar server address.

## 1.0.37 - 2026-10-15

- Make automatic sync switchable while keeping it enabled by default.
- Remove redundant setting labels and expose the CalDAV account as noddl.

## 1.0.36 - 2026-10-15

- Use a default-on automatic sync switch without rebind controls.
- Restore animated collapsible settings and simplify reminder actions.

## 1.0.35 - 2026-10-15

- Make automatic sync a default top-level setting.
- Group calendar and reminder actions into consistent collapsible sections.
- Rename the mobile calendar to 课程作业截止 and show only the three CalDAV fields.

## 1.0.34 - 2026-10-15

- Fix Node ESM imports that prevented sync functions from starting.
- Verify compiled API handlers and encrypted session binding in plain Node.
- Keep the Vercel CLI build hook and fix the lockfile JSON.

## 1.0.33 - 2026-10-15

- Preserve the Vercel build hook required to publish the CLI entrypoint.

## 1.0.32 - 2026-10-15

- Route extension API calls through the service worker to avoid page CORS restrictions.

## 1.0.31 - 2026-10-15

- Remove the userscript distribution and ship the page assistant as one Chrome extension.

## 1.0.30 - 2026-10-15

- Bundle the page assistant and HttpOnly session bridge into one Chrome extension install.

## 1.0.29 - 2026-10-15

- Report missing auto-sync service configuration as an actionable server error.

## 1.0.28 - 2026-10-15

- Connect the session bridge through the real page window when Tampermonkey runs in its sandbox.

## 1.0.27 - 2026-10-15

- Add a stable Chrome MV3 bridge for reading the platform's HttpOnly session cookie.

## 1.0.26 - 2026-10-15

- Keep automatic sync failure notices concise while retaining diagnostics in the console.

## 1.0.25 - 2026-10-15

- Log automatic sync binding diagnostics to the console instead of exposing raw errors in the UI.

## 1.0.24 - 2026-10-15

- Use the platform's actual `educg_session` cookie for automatic sync.

## 1.0.23 - 2026-10-15

- Read the current course page session through one authoritative cookie API and report the actual cookie names when the session is unavailable.

## 1.0.22 - 2026-10-15

- Enable automatic sync by default and store server-side assignment snapshots.

## 1.0.21 - 2026-10-14

- Add encrypted daily server-side course synchronization.

## 1.0.20 - 2026-10-14

- Keep cloud experiment links out of ordinary assignment parsing.

## 1.0.19 - 2026-10-14

- Sync cloud experiments and keep the pet mounted through course switches.

## 1.0.18 - 2026-10-14

- Keep submitted assignments visible and remove stale sync fallbacks.

## 1.0.17 - 2026-10-14

- Keep the desktop pet on the top-level page only.

- Replace the hand-written panel styling with daisyUI components and its corporate theme.

## 1.0.16 - 2026-10-14

- Reject course context mismatches during full assignment sync.

## 1.0.15 - 2026-10-14

- Refresh assignment details and completion status during full course sync.
