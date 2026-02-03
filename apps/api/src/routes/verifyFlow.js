// apps/api/src/routes/verifyFlow.js
// ✅ Flow หลัก: create sid (bot) -> oauth start -> oauth callback -> complete (turnstile + give roles)

import express from "express";
import { pool } from "../db.js";
import { requireBotAuth } from "../middleware/botAuth.js";
import { randomHex } from "../util/crypto.js";
import { exchangeCodeForToken, fetchMe, addRole } from "../util/discordRest.js";
import { verifyTurnstile } from "../util/turnstile.js";

const router = express.Router();

/**
 * ✅ POST /api/verify/session (เรียกจากบอท)
 * body: { guildId, userId }
 */
router.post("/verify/session", requireBotAuth, async (req, res) => {
  const { guildId, userId } = req.body;

  if (!guildId || !userId) {
    return res.status(400).json({ error: "Missing guildId/userId" });
  }

  // ✅ sid one-time
  const sid = randomHex(32);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await pool.query(
    `INSERT INTO verify_sessions (sid, guild_id, expected_user_id, expires_at) VALUES ($1, $2, $3, $4)`,
    [sid, String(guildId), String(userId), expiresAt]
  );

  return res.json({ sid });
});

/**
 * ✅ GET /auth/discord/start?sid=...
 * ทำหน้าที่:
 * - ตรวจ sid
 * - สร้าง state
 * - บันทึก state -> sid
 * - redirect ไป Discord authorize
 */
router.get("/auth/discord/start", async (req, res) => {
  const sid = req.query.sid?.toString();
  if (!sid) return res.status(400).send("Missing sid");

  // ✅ ตรวจ sid ว่ายังใช้ได้
  const s = await pool.query(`SELECT sid, expires_at, used FROM verify_sessions WHERE sid=$1`, [sid]);
  if (s.rows.length === 0) return res.status(400).send("Invalid sid");
  if (s.rows[0].used) return res.status(400).send("Sid already used");
  if (new Date(s.rows[0].expires_at).getTime() < Date.now()) return res.status(400).send("Sid expired");

  // ✅ สร้าง oauth state
  const state = randomHex(24);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await pool.query(`INSERT INTO oauth_states (state, sid, expires_at) VALUES ($1,$2,$3)`, [
    state,
    sid,
    expiresAt,
  ]);

  // ✅ ไป Discord OAuth2 (scope identify เท่านั้นพอ)
  const u = new URL("https://discord.com/api/oauth2/authorize");
  u.searchParams.set("client_id", process.env.DISCORD_CLIENT_ID);
  u.searchParams.set("redirect_uri", process.env.DISCORD_REDIRECT_URI);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", "identify");
  u.searchParams.set("state", state);

  return res.redirect(u.toString());
});

/**
 * ✅ GET /auth/discord/callback?code=...&state=...
 * ทำหน้าที่:
 * - ตรวจ state -> sid
 * - แลก code -> access token
 * - fetch user
 * - เช็คว่า user.id ตรงกับ expected_user_id (กันแชร์ลิ้ง)
 * - สร้าง web token (สำหรับเว็บไปทำ Turnstile + complete)
 * - redirect กลับ React: /verify?token=...
 */
router.get("/auth/discord/callback", async (req, res) => {
  const code = req.query.code?.toString();
  const state = req.query.state?.toString();
  if (!code || !state) return res.status(400).send("Missing code/state");

  // ✅ หา sid จาก state
  const st = await pool.query(`SELECT state, sid, expires_at FROM oauth_states WHERE state=$1`, [state]);
  if (st.rows.length === 0) return res.status(400).send("Invalid state");
  if (new Date(st.rows[0].expires_at).getTime() < Date.now()) return res.status(400).send("State expired");

  const sid = st.rows[0].sid;

  // ✅ โหลด session
  const sess = await pool.query(
    `SELECT sid, guild_id, expected_user_id, expires_at, used FROM verify_sessions WHERE sid=$1`,
    [sid]
  );
  if (sess.rows.length === 0) return res.status(400).send("Invalid sid");
  if (sess.rows[0].used) return res.status(400).send("Sid already used");
  if (new Date(sess.rows[0].expires_at).getTime() < Date.now()) return res.status(400).send("Sid expired");

  // ✅ แลก token + ดึง user
  let tokenData;
  let me;
  try {
    tokenData = await exchangeCodeForToken(code);
    me = await fetchMe(tokenData.access_token);
  } catch (e) {
    return res.status(500).send(String(e.message));
  }

  // ✅ กันแชร์: คน login ต้องเป็นคนที่กดปุ่มใน Discord เท่านั้น
  if (String(me.id) !== String(sess.rows[0].expected_user_id)) {
    return res.status(403).send("This verify link is not for your account");
  }

  // ✅ สร้าง web token (ใช้ต่อที่หน้า verify)
  const webToken = randomHex(32);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await pool.query(
    `INSERT INTO web_verify_tokens (token, sid, guild_id, user_id, expires_at) VALUES ($1,$2,$3,$4,$5)`,
    [webToken, sid, sess.rows[0].guild_id, me.id, expiresAt]
  );

  // ✅ redirect กลับ React
  const front = new URL(`${process.env.FRONTEND_URL}/verify`);
  front.searchParams.set("token", webToken);

  return res.redirect(front.toString());
});

/**
 * ✅ POST /api/verify/complete
 * body: { token, turnstileToken }
 */
router.post("/verify/complete", async (req, res) => {
  const { token, turnstileToken } = req.body;

  if (!token || !turnstileToken) {
    return res.status(400).json({ error: "Missing token/turnstileToken" });
  }

  // ✅ ตรวจ web token
  const wt = await pool.query(
    `SELECT token, sid, guild_id, user_id, expires_at, used FROM web_verify_tokens WHERE token=$1`,
    [String(token)]
  );
  if (wt.rows.length === 0) return res.status(400).json({ error: "Invalid token" });
  if (wt.rows[0].used) return res.status(400).json({ error: "Token already used" });
  if (new Date(wt.rows[0].expires_at).getTime() < Date.now()) return res.status(400).json({ error: "Token expired" });

  const { sid, guild_id: guildId, user_id: userId } = wt.rows[0];

  // ✅ ตรวจ sid อีกที
  const sess = await pool.query(
    `SELECT sid, expires_at, used FROM verify_sessions WHERE sid=$1`,
    [sid]
  );
  if (sess.rows.length === 0) return res.status(400).json({ error: "Invalid sid" });
  if (sess.rows[0].used) return res.status(400).json({ error: "Sid already used" });
  if (new Date(sess.rows[0].expires_at).getTime() < Date.now()) return res.status(400).json({ error: "Sid expired" });

  // ✅ ตรวจ Turnstile
  const ip = req.headers["cf-connecting-ip"] || req.ip;
  const ts = await verifyTurnstile({ token: turnstileToken, ip });

  if (!ts.success) {
    return res.status(400).json({ error: "Turnstile failed", details: ts["error-codes"] || [] });
  }

  // ✅ ดึง roleIds ของกิลด์นี้
  const cfg = await pool.query(`SELECT role_ids FROM guild_verify_config WHERE guild_id=$1`, [String(guildId)]);
  const roleIds = cfg.rows[0]?.role_ids || [];

  // ✅ ใส่ role ทีละอัน
  try {
    for (const roleId of roleIds) {
      await addRole({ guildId: String(guildId), userId: String(userId), roleId: String(roleId) });
    }
  } catch (e) {
    // ✅ มักพังเพราะ bot ไม่มี Manage Roles หรือ role บอทต่ำกว่า role เป้าหมาย
    return res.status(500).json({ error: "Role assign failed", message: String(e.message) });
  }

  // ✅ mark used (กันกดซ้ำ)
  await pool.query(`UPDATE verify_sessions SET used=TRUE WHERE sid=$1`, [sid]);
  await pool.query(`UPDATE web_verify_tokens SET used=TRUE WHERE token=$1`, [String(token)]);

  // ✅ upsert verified_users
  await pool.query(
    `
    INSERT INTO verified_users (guild_id, user_id)
    VALUES ($1,$2)
    ON CONFLICT (guild_id, user_id)
    DO UPDATE SET verified_at = now()
    `,
    [String(guildId), String(userId)]
  );

  console.log("verify complete body:", req.body);

  return res.json({ ok: true, guildId, userId, rolesGiven: roleIds });
});

export default router;
