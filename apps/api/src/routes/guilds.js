// apps/api/src/routes/guilds.js
// ✅ routes สำหรับ bot ตั้งค่า role ต่อ guild + ดึง verify config

import express from "express";
import { pool } from "../db.js";

const router = express.Router();

/**
 * ✅ middleware: internal bot auth
 * Bot จะต้องส่ง header: X-BOT-AUTH = INTERNAL_BOT_SECRET
 */
function requireBotAuth(req, res, next) {
  const got = req.headers["x-bot-auth"];
  if (!got || got !== process.env.INTERNAL_BOT_SECRET) {
    return res.status(401).json({ error: "unauthorized" });
  }
  return next();
}

/**
 * PUT /api/guilds/:guildId/verify-config
 * body: { roleIds: string[] }
 */
router.put("/guilds/:guildId/verify-config", requireBotAuth, async (req, res) => {
  const { guildId } = req.params;
  const { roleIds } = req.body || {};

  if (!Array.isArray(roleIds)) {
    return res.status(400).json({ error: "roleIds must be array" });
  }

  await pool.query(
    `
    INSERT INTO guild_verify_config (guild_id, role_ids, updated_at)
    VALUES ($1, $2::jsonb, now())
    ON CONFLICT (guild_id)
    DO UPDATE SET role_ids = EXCLUDED.role_ids, updated_at = now()
  `,
    [guildId, JSON.stringify(roleIds)]
  );

  return res.json({ ok: true, guildId, roleIds });
});

/**
 * GET /api/guilds/:guildId/verify-config
 * headers: X-BOT-AUTH
 * return: { roleIds: string[] }
 */
router.get("/guilds/:guildId/verify-config", requireBotAuth, async (req, res) => {
  const { guildId } = req.params;

  const r = await pool.query(`SELECT role_ids FROM guild_verify_config WHERE guild_id=$1`, [guildId]);
  const roleIds = r.rowCount ? r.rows[0].role_ids || [] : [];

  return res.json({ roleIds: Array.isArray(roleIds) ? roleIds : [] });
});

export default router;
