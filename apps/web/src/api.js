// apps/web/src/api.js
// ✅ helper เรียก API

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function apiPost(path, body) {
  const resp = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await resp.text();

  // ✅ ถ้าเป็น JSON ก็ parse
  try {
    const data = JSON.parse(text);
    if (!resp.ok) throw new Error(data?.error || text);
    return data;
  } catch {
    if (!resp.ok) throw new Error(text);
    return text;
  }
}
