// apps/web/src/config.js
// ✅ รวมค่าคงที่จาก ENV ให้ใช้ในหลายที่

export const API_BASE = import.meta.env.VITE_API_BASE_URL; // เช่น https://verify-api.xerl.store
export const APP_NAME = import.meta.env.VITE_APP_NAME || "Secure Verify";

if (!API_BASE) {
  // ช่วยให้ debug ง่าย
  console.warn("⚠️ Missing VITE_API_BASE_URL in web env");
}
