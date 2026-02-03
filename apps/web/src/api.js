// apps/web/src/api.js
// ✅ fetch helper

const API = import.meta.env.VITE_API_BASE_URL;

/**
 * ✅ POST JSON
 */
export async function apiPost(path, body) {
  if (!API) throw new Error("VITE_API_BASE_URL missing");

  const res = await fetch(`${API.replace(/\/$/, "")}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {})
  });

  if (!res.ok) {
    // ✅ อ่าน error JSON หรือ text เพื่อโชว์ใน UI
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const j = await res.json();
      throw new Error(j.error ? JSON.stringify(j) : "API error");
    } else {
      const t = await res.text();
      throw new Error(t || "API error");
    }
  }
  return res.json();
}
