// apps/web/src/pages/VerifyStart.jsx
// ✅ รับ sid แล้ว “ส่งต่อไปเริ่ม OAuth” ที่ API

import React, { useEffect } from "react";

export default function VerifyStart() {
  useEffect(() => {
    const sid = new URL(window.location.href).searchParams.get("sid");
    if (!sid) {
      window.location.href = "/error?m=" + encodeURIComponent("Missing sid");
      return;
    }

    // ✅ โยนไป API เพื่อเริ่ม OAuth
    const API = import.meta.env.VITE_API_BASE_URL;
    window.location.href = `${API.replace(/\/$/, "")}/auth/discord/login?sid=${encodeURIComponent(sid)}`;
  }, []);

  return (
    <div className="page">
      <div className="card">
        <div className="cardHeader">
          <div className="titleRow">
            <div className="badge">⏳</div>
            <h1 className="h1">กำลังพาไปล็อกอิน…</h1>
          </div>
          <p className="sub">ถ้าไม่เด้งอัตโนมัติ ลองรีเฟรชอีกครั้ง</p>
        </div>
      </div>
    </div>
  );
}
