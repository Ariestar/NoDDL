# Changelog

## Unreleased

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
