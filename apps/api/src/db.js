// apps/api/src/db.js
// ✅ สร้าง pg pool + helper init tables

import pg from "pg";
const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ✅ ฟังก์ชัน init ตาราง (เรียกตอน server start)
export async function initDb() {
  // ✅ config roles ต่อ guild
  await pool.query(`
    CREATE TABLE IF NOT EXISTS guild_verify_config (
      guild_id TEXT PRIMARY KEY,
      role_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  // ✅ session sid แบบ one-time
  await pool.query(`
    CREATE TABLE IF NOT EXISTS verify_sessions (
      sid TEXT PRIMARY KEY,
      guild_id TEXT NOT NULL,
      expected_user_id TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      expires_at TIMESTAMPTZ NOT NULL,
      used BOOLEAN NOT NULL DEFAULT FALSE
    );
  `);
  // ✅ กัน schema เก่าที่สร้างไว้ก่อนมี expected_user_id
    await pool.query(`
    ALTER TABLE verify_sessions
    ADD COLUMN IF NOT EXISTS expected_user_id TEXT NOT NULL DEFAULT '';
    `);


  // ✅ oauth state map
  await pool.query(`
    CREATE TABLE IF NOT EXISTS oauth_states (
      state TEXT PRIMARY KEY,
      sid TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL
    );
  `);

  // ✅ token สำหรับเว็บ (หลัง callback) เพื่อไปทำ turnstile ต่อ
  await pool.query(`
    CREATE TABLE IF NOT EXISTS web_verify_tokens (
      token TEXT PRIMARY KEY,
      sid TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used BOOLEAN NOT NULL DEFAULT FALSE
    );
  `);

  // ✅ ผู้ใช้ verify แล้ว
  await pool.query(`
    CREATE TABLE IF NOT EXISTS verified_users (
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (guild_id, user_id)
    );
  `);
}
