// apps/api/src/routes/verifyConfig.js
// ✅ PUT /api/guilds/:guildId/verify-config เพื่อเซ็ต roles ของกิลด์นั้น

import express from "express";
import { pool } from "../db.js";
import { requireBotAuth } from "../middleware/botAuth.js";

const router = express.Router();

router.put("/guilds/:guildId/verify-config", requireBotAuth, async (req, res) => {
  const { guildId } = req.params;
  const { roleIds } = req.body;

  // ✅ sanitize
  const clean = Array.isArray(roleIds) ? roleIds.map(String).filter(Boolean) : [];

  await pool.query(
    `
    INSERT INTO guild_verify_config (guild_id, role_ids)
    VALUES ($1, $2::jsonb)
    ON CONFLICT (guild_id)
    DO UPDATE SET role_ids = EXCLUDED.role_ids, updated_at = now()
    `,
    [guildId, JSON.stringify(clean)]
  );

  return res.json({ ok: true, guildId, roleIds: clean });
});

export default router;
