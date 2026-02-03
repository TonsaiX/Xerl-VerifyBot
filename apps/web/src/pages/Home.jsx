// apps/web/src/pages/Home.jsx
// ✅ หน้ากลาง: ถ้ามี sid ใน query ให้ redirect ไป API oauth start

import React, { useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Home() {
  useEffect(() => {
    // ✅ ถ้าเข้าผ่านลิ้ง verify/start?sid=...
    const url = new URL(window.location.href);
    const sid = url.searchParams.get("sid");

    // ✅ ถ้ามี sid → ไปเริ่ม OAuth ที่ API
    if (window.location.pathname === "/verify/start" && sid) {
      window.location.href = `${API_BASE_URL}/auth/discord/start?sid=${encodeURIComponent(sid)}`;
    }
  }, []);

  return (
    <div className="container">
      <h1>Verify Portal (localhost)</h1>
      <p className="small">
        หน้านี้ใช้สำหรับ Verify จาก Discord เท่านั้น — กรุณากดปุ่ม Verify ในเซิร์ฟเวอร์ของคุณ
      </p>
    </div>
  );
}
