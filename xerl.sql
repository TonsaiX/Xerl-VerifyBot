-- =========================================================
-- xerl-verify : PostgreSQL Schema
-- =========================================================
-- รองรับ:
-- - Multi Guild
-- - Verify session (one-time)
-- - OAuth2 state
-- - Web verify token
-- - Verified users
-- =========================================================

-- =========================
-- 1) ตั้งค่า roles ที่จะให้หลัง verify ต่อ guild
-- =========================
CREATE TABLE IF NOT EXISTS guild_verify_config (
  guild_id TEXT PRIMARY KEY,
  role_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- 2) Verify sessions (สร้างตอนกดปุ่ม Verify)
-- one-time + มีอายุ
-- =========================
CREATE TABLE IF NOT EXISTS verify_sessions (
  sid TEXT PRIMARY KEY,
  guild_id TEXT NOT NULL,
  expected_user_id TEXT NOT NULL, -- user ที่กดปุ่มใน Discord
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_verify_sessions_guild
  ON verify_sessions(guild_id);

CREATE INDEX IF NOT EXISTS idx_verify_sessions_user
  ON verify_sessions(expected_user_id);

-- =========================
-- 3) OAuth2 state (กัน CSRF)
-- =========================
CREATE TABLE IF NOT EXISTS oauth_states (
  state TEXT PRIMARY KEY,
  sid TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_oauth_states_sid
  ON oauth_states(sid);

-- =========================
-- 4) Web verify token
-- ใช้หลัง OAuth สำเร็จ → ไปหน้าเว็บ Verify
-- =========================
CREATE TABLE IF NOT EXISTS web_verify_tokens (
  token TEXT PRIMARY KEY,
  sid TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_web_tokens_guild
  ON web_verify_tokens(guild_id);

CREATE INDEX IF NOT EXISTS idx_web_tokens_user
  ON web_verify_tokens(user_id);

-- =========================
-- 5) ผู้ใช้ที่ verify สำเร็จแล้ว
-- =========================
CREATE TABLE IF NOT EXISTS verified_users (
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (guild_id, user_id)
);

-- =========================================================
-- (OPTIONAL) 6) Cleanup helper (เอาไว้ล้างข้อมูลหมดอายุ)
-- =========================================================
-- ลบ session ที่หมดอายุ
-- DELETE FROM verify_sessions WHERE expires_at < now();

-- ลบ oauth state ที่หมดอายุ
-- DELETE FROM oauth_states WHERE expires_at < now();

-- ลบ web token ที่หมดอายุ
-- DELETE FROM web_verify_tokens WHERE expires_at < now();

-- =========================================================
-- END OF SCHEMA
-- =========================================================
