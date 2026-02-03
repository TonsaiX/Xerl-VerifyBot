// apps/api/src/db.js
// ✅ PostgreSQL pool + init schema (ไม่พังถ้า table มีแล้ว)

import pg from "pg";
const { Pool } = pg;

export let pool = null;

/**
 * ✅ initDb: connect + ensure tables exist
 */
export async function initDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing");
  }

  pool = new Pool({ connectionString: process.env.DATABASE_URL });

  // ✅ test connect
  await pool.query("SELECT 1");

  // ✅ ensure tables (เหมือน schema.sql แต่ทำให้รันได้เองด้วย)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS guild_verify_config (
      guild_id TEXT PRIMARY KEY,
      role_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS oauth_states (
      state TEXT PRIMARY KEY,
      sid TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL
    );
  `);

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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS verified_users (
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (guild_id, user_id)
    );
  `);
}
