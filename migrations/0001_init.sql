CREATE TABLE IF NOT EXISTS accounts (
  token TEXT PRIMARY KEY,
  cookie TEXT NOT NULL,
  feed_token TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL,
  last_sync_at INTEGER,
  last_error TEXT,
  assignments TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS feeds (
  token TEXT PRIMARY KEY,
  assignments TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS email_codes (
  email_hash TEXT PRIMARY KEY,
  digest TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS email_bindings (
  token_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS email_sent (
  key TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
