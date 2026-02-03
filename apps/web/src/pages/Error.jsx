// apps/web/src/pages/Error.jsx
// ✅ หน้า error

import React, { useMemo } from "react";

export default function ErrorPage({ fallbackMessage }) {
  const msg = useMemo(() => new URL(window.location.href).searchParams.get("m") || "", []);
  const text = msg || fallbackMessage || "เกิดข้อผิดพลาด";
  return (
    <div className="page">
      <div className="card">
        <div className="cardHeader">
          <div className="titleRow">
            <div className="badge">⚠️</div>
            <h1 className="h1">มีบางอย่างผิดพลาด</h1>
          </div>
          <p className="sub">{text}</p>
        </div>
        <div className="footer">
          <span>Secure Verify</span>
          <a className="mutedLink" href="/">กลับหน้าแรก</a>
        </div>
      </div>
    </div>
  );
}
