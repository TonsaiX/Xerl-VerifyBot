// apps/web/src/pages/Verified.jsx
// ✅ หน้า success

import React, { useMemo } from "react";

export default function Verified() {
  const g = useMemo(() => new URL(window.location.href).searchParams.get("g") || "", []);
  return (
    <div className="page">
      <div className="card">
        <div className="cardHeader">
          <div className="titleRow">
            <div className="badge">✅</div>
            <h1 className="h1">ยืนยันสำเร็จ</h1>
          </div>
          <p className="sub">ระบบได้ให้ยศใน Discord แล้ว (ถ้ายังไม่ขึ้น ลองรอสักครู่)</p>
        </div>
        <div className="cardBody">
          <div className="pillRow">
            <div className="pill">Guild: {g || "unknown"}</div>
          </div>
        </div>
        <div className="footer">
          <span>Secure Verify</span>
          <a className="mutedLink" href="/">กลับหน้าแรก</a>
        </div>
      </div>
    </div>
  );
}
