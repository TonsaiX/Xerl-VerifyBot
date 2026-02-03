// apps/api/src/util/discordRest.js
// ✅ เรียก Discord REST (OAuth2 + Bot API)

function discordHeadersBearer(accessToken) {
  return { Authorization: `Bearer ${accessToken}` };
}

function discordHeadersBot() {
  return { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` };
}

// ✅ แลก code -> access_token
export async function exchangeCodeForToken(code) {
  const body = new URLSearchParams();
  body.append("client_id", process.env.DISCORD_CLIENT_ID);
  body.append("client_secret", process.env.DISCORD_CLIENT_SECRET);
  body.append("grant_type", "authorization_code");
  body.append("code", code);
  body.append("redirect_uri", process.env.DISCORD_REDIRECT_URI);

  const resp = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!resp.ok) {
    throw new Error(`Token exchange failed: ${await resp.text()}`);
  }

  return resp.json();
}

// ✅ ดึง user
export async function fetchMe(accessToken) {
  const resp = await fetch("https://discord.com/api/users/@me", {
    headers: discordHeadersBearer(accessToken),
  });

  if (!resp.ok) {
    throw new Error(`Fetch /users/@me failed: ${await resp.text()}`);
  }

  return resp.json();
}

// ✅ ใส่ role (Bot token) → 204 = success
export async function addRole({ guildId, userId, roleId }) {
  const url = `https://discord.com/api/v10/guilds/${guildId}/members/${userId}/roles/${roleId}`;
  const resp = await fetch(url, {
    method: "PUT",
    headers: {
      ...discordHeadersBot(),
      "Content-Type": "application/json",
    },
  });

  if (resp.status !== 204) {
    throw new Error(`AddRole failed ${resp.status}: ${await resp.text()}`);
  }
}
