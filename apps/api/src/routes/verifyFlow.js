// apps/api/src/routes/verifyFlow.js
// ✅ Verify Flow
// 1) bot -> POST /api/verify/session (สร้าง sid)
// 2) web -> GET /verify/start?sid=... -> redirect ไป /auth/discord/login?sid=...
// 3) api -> GET /auth/discord/login?sid=... -> redirect to Discord OAuth
// 4) api -> GET /auth/discord/callback?code&state -> exchange code -> get user id -> create web token -> redirect FRONTEND_URL/verify?token=...
// 5) web -> POST /api/verify/complete { token, turnstileToken } -> verify turnstile -> assign roles -> success

import express from "express";
import { pool } from "../db.js";
import crypto from "node:crypto";

const router = express.Router();

/** ✅ helper: random hex */
function hex(n = 32) {
  return crypto.randomBytes(n).toString("hex");
}

/** ✅ helper: now + ms */
function addMs(ms) {
  return new Date(Date.now() + ms);
}

/** ✅ internal auth from bot */
function requireBotAuth(req, res, next) {
  const got = req.headers["x-bot-auth"];
  if (!got || got !== process.env.INTERNAL_BOT_SECRET) {
    return res.status(401).json({ error: "unauthorized" });
  }
  return next();
}

/**
 * ✅ 1) Bot creates verify session
 * POST /api/verify/session
 * headers: X-BOT-AUTH
 * body: { guildId, userId }
 */
router.post("/api/verify/session", requireBotAuth, async (req, res) => {
  const { guildId, userId } = req.body || {};
  if (!guildId || !userId) {
    return res.status(400).json({ error: "missing guildId/userId" });
  }

  const sid = hex(16);
  const expiresAt = addMs(10 * 60 * 1000); // 10 min

  await pool.query(
    `INSERT INTO verify_sessions (sid, guild_id, expected_user_id, expires_at, used)
     VALUES ($1, $2, $3, $4, false)`,
    [sid, guildId, userId, expiresAt]
  );

  return res.json({ sid });
});

/**
 * ✅ 2) Web entry page
 * GET /verify/start?sid=...
 */
router.get("/verify/start", async (req, res) => {
  const sid = String(req.query.sid || "");
  if (!sid) {
    return res.redirect("/error?m=" + encodeURIComponent("Missing sid"));
  }
  return res.redirect(`/auth/discord/login?sid=${encodeURIComponent(sid)}`);
});

/**
 * ✅ 3) Start Discord OAuth
 * GET /auth/discord/login?sid=...
 */
router.get("/auth/discord/login", async (req, res) => {
  const sid = String(req.query.sid || "");
  if (!sid) return res.status(400).send("Missing sid");

  // ✅ session must exist + not expired + not used
  const r = await pool.query(
    `SELECT sid, guild_id, expected_user_id, expires_at, used
     FROM verify_sessions WHERE sid=$1`,
    [sid]
  );
  if (r.rowCount === 0) return res.status(400).send("Invalid sid");

  const sess = r.rows[0];
  if (sess.used) return res.status(400).send("Session used");
  if (new Date(sess.expires_at).getTime() < Date.now()) return res.status(400).send("Session expired");

  // ✅ create OAuth state
  const state = hex(16);
  const stateExpires = addMs(10 * 60 * 1000);

  await pool.query(`INSERT INTO oauth_states (state, sid, expires_at) VALUES ($1, $2, $3)`, [
    state,
    sid,
    stateExpires
  ]);

  const redirectUri = process.env.DISCORD_REDIRECT_URI;
  const clientId = process.env.DISCORD_CLIENT_ID;

  if (!redirectUri || !clientId) {
    return res.status(500).send("Missing Discord env");
  }

  // ✅ minimal scope for identify
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify",
    state
  });

  return res.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
});

/**
 * ✅ 4) Discord callback
 * GET /auth/discord/callback?code&state
 */
router.get("/auth/discord/callback", async (req, res) => {
  const code = String(req.query.code || "");
  const state = String(req.query.state || "");
  if (!code || !state) return res.status(400).send("Missing code/state");

  // ✅ validate state
  const st = await pool.query(`SELECT state, sid, expires_at FROM oauth_states WHERE state=$1`, [state]);
  if (st.rowCount === 0) return res.status(400).send("Invalid state");
  if (new Date(st.rows[0].expires_at).getTime() < Date.now()) return res.status(400).send("State expired");

  const sid = st.rows[0].sid;

  // ✅ get session
  const sr = await pool.query(
    `SELECT sid, guild_id, expected_user_id, expires_at, used FROM verify_sessions WHERE sid=$1`,
    [sid]
  );
  if (sr.rowCount === 0) return res.status(400).send("Invalid sid");
  const sess = sr.rows[0];

  // ✅ exchange code for access token
  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.DISCORD_REDIRECT_URI
    })
  });

  if (!tokenRes.ok) {
    const t = await tokenRes.text();
    return res.status(400).send("Token exchange failed: " + t);
  }

  const tokenJson = await tokenRes.json();
  const accessToken = tokenJson.access_token;

  // ✅ fetch user identity
  const meRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!meRes.ok) {
    const t = await meRes.text();
    return res.status(400).send("Fetch user failed: " + t);
  }

  const me = await meRes.json();
  const userId = String(me.id || "");

  // ✅ ensure user matches who clicked verify
  if (userId !== String(sess.expected_user_id)) {
    return res.status(403).send("This login is not the same account who started verify.");
  }

  // ✅ create web verify token
  const webToken = hex(32);
  const expiresAt = addMs(10 * 60 * 1000);

  await pool.query(
    `INSERT INTO web_verify_tokens (token, sid, guild_id, user_id, expires_at, used)
     VALUES ($1, $2, $3, $4, $5, false)`,
    [webToken, sid, sess.guild_id, userId, expiresAt]
  );

  // ✅ redirect to frontend
  const front = process.env.FRONTEND_URL;
  if (!front) return res.status(500).send("Missing FRONTEND_URL");

  return res.redirect(`${front.replace(/\/$/, "")}/verify?token=${encodeURIComponent(webToken)}`);
});

/**
 * ✅ 5) Complete verify (web)
 * POST /api/verify/complete
 * body: { token, turnstileToken }
 */
router.post("/api/verify/complete", async (req, res) => {
  const { token, turnstileToken } = req.body || {};
  if (!token || !turnstileToken) {
    return res.status(400).json({ error: "missing token/turnstileToken" });
  }

  // ✅ validate web token
  const tr = await pool.query(
    `SELECT token, sid, guild_id, user_id, expires_at, used
     FROM web_verify_tokens WHERE token=$1`,
    [token]
  );

  if (tr.rowCount === 0) return res.status(400).json({ error: "invalid token" });

  const wt = tr.rows[0];

  if (wt.used) return res.status(400).json({ error: "token used" });
  if (new Date(wt.expires_at).getTime() < Date.now()) return res.status(400).json({ error: "token expired" });

  // ✅ verify turnstile
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return res.status(500).json({ error: "missing TURNSTILE_SECRET_KEY" });

  const tsRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret,
      response: turnstileToken
    })
  });

  const tsJson = await tsRes.json();
  if (!tsJson.success) {
    return res.status(400).json({ error: "turnstile failed", detail: tsJson });
  }

  // ✅ get roles config
  const cfg = await pool.query(`SELECT role_ids FROM guild_verify_config WHERE guild_id=$1`, [wt.guild_id]);
  const roleIds = cfg.rowCount ? cfg.rows[0].role_ids || [] : [];

  if (!Array.isArray(roleIds)) {
    return res.status(500).json({ error: "role_ids invalid in db" });
  }

  // ✅ กันซ้ำ: ถ้าเคย verified แล้ว ไม่ต้องทำซ้ำ
  const already = await pool.query(`SELECT 1 FROM verified_users WHERE guild_id=$1 AND user_id=$2`, [
    wt.guild_id,
    wt.user_id
  ]);

  if (already.rowCount > 0) {
    await pool.query(`UPDATE web_verify_tokens SET used=true WHERE token=$1`, [token]);
    await pool.query(`UPDATE verify_sessions SET used=true WHERE sid=$1`, [wt.sid]);

    return res.json({
      ok: true,
      alreadyVerified: true,
      guildId: wt.guild_id,
      userId: wt.user_id,
      roleIds
    });
  }

  // ✅ assign roles via Discord API (MUST CHECK RESPONSE)
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) return res.status(500).json({ error: "missing DISCORD_BOT_TOKEN in API env" });

  const failures = [];

  for (const roleId of roleIds) {
    const url = `https://discord.com/api/v10/guilds/${wt.guild_id}/members/${wt.user_id}/roles/${roleId}`;

    const r = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bot ${botToken}`
      }
    });

    if (!r.ok) {
      const body = await r.text().catch(() => "");
      failures.push({
        roleId,
        status: r.status,
        body
      });
    }
  }

  // ✅ ถ้าใส่ role ไม่ผ่าน -> ตอบ error พร้อมเหตุผลจริง
  if (failures.length > 0) {
    console.error("Role assign failures:", {
      guildId: wt.guild_id,
      userId: wt.user_id,
      failures
    });

    return res.status(500).json({
      error: "assign role failed",
      guildId: wt.guild_id,
      userId: wt.user_id,
      failures
    });
  }


  // ✅ mark verified
  await pool.query(
    `INSERT INTO verified_users (guild_id, user_id, verified_at)
     VALUES ($1, $2, now())
     ON CONFLICT (guild_id, user_id) DO UPDATE SET verified_at=now()`,
    [wt.guild_id, wt.user_id]
  );

  // ✅ mark token + session used
  await pool.query(`UPDATE web_verify_tokens SET used=true WHERE token=$1`, [token]);
  await pool.query(`UPDATE verify_sessions SET used=true WHERE sid=$1`, [wt.sid]);

  return res.json({ ok: true, guildId: wt.guild_id, userId: wt.user_id, roleIds });
});

export default router;
