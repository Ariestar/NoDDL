# Changelog

## Unreleased

- Remove a one-use UI barrel export.

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
