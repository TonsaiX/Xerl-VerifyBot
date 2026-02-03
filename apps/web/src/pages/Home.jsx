// apps/web/src/pages/Home.jsx
// ✅ หน้าแรกเรียบๆ

import React from "react";

export default function Home() {
  return (
    <div className="page">
      <div className="card">
        <div className="cardHeader">
          <div className="titleRow">
            <div className="badge">🛡️</div>
            <h1 className="h1">Secure Verify</h1>
          </div>
          <p className="sub">หน้านี้เอาไว้รองรับลิ้ง Verify จากบอท</p>
        </div>
        <div className="cardBody">
          <div className="pillRow">
            <div className="pill">กด Verify จาก Discord</div>
            <div className="pill">แล้วระบบจะพามาที่นี่</div>
          </div>
        </div>
        <div className="footer">
          <span>Secure Verify</span>
          <a className="mutedLink" href="/error?m=Use%20Discord%20Verify">ช่วยเหลือ</a>
        </div>
      </div>
    </div>
  );
}
