CREATE TABLE IF NOT EXISTS oauth_registrations (
  worker_url TEXT PRIMARY KEY,
  worker_name TEXT NOT NULL,
  account_id TEXT NOT NULL,
  hook_url TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
