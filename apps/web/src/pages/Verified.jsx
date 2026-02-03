// apps/web/src/pages/Verified.jsx
// ✅ หน้าแสดงผลหลัง verify สำเร็จ

import React from "react";

export default function Verified() {
  const g = new URL(window.location.href).searchParams.get("g") || "";

  return (
    <div className="container">
      <h1>✅ Verify สำเร็จ</h1>
      <p className="small">กลับไปที่ Discord ได้เลย ระบบจะให้ยศอัตโนมัติ</p>
      {g && <p className="small">Guild: {g}</p>}
    </div>
  );
}
