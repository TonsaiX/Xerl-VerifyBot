// apps/api/src/util/turnstile.js
// ✅ verify Cloudflare Turnstile token

export async function verifyTurnstile({ token, ip }) {
  const form = new URLSearchParams();
  form.append("secret", process.env.TURNSTILE_SECRET_KEY);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);

  const resp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
  });

  return resp.json(); // { success, ... }
}
