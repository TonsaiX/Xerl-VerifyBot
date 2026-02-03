-- xerl-verify : PostgreSQL Schema

CREATE TABLE IF NOT EXISTS guild_verify_config (
  guild_id TEXT PRIMARY KEY,
  role_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS verify_sessions (
  sid TEXT PRIMARY KEY,
  guild_id TEXT NOT NULL,
  expected_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_verify_sessions_guild ON verify_sessions(guild_id);
CREATE INDEX IF NOT EXISTS idx_verify_sessions_user ON verify_sessions(expected_user_id);

CREATE TABLE IF NOT EXISTS oauth_states (
  state TEXT PRIMARY KEY,
  sid TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_oauth_states_sid ON oauth_states(sid);

CREATE TABLE IF NOT EXISTS web_verify_tokens (
  token TEXT PRIMARY KEY,
  sid TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_web_tokens_guild ON web_verify_tokens(guild_id);
CREATE INDEX IF NOT EXISTS idx_web_tokens_user ON web_verify_tokens(user_id);

CREATE TABLE IF NOT EXISTS verified_users (
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (guild_id, user_id)
);
