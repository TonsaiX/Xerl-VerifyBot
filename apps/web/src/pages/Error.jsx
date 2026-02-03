// apps/web/src/pages/Error.jsx
// ✅ หน้า error

import React from "react";

export default function ErrorPage({ message }) {
  const m = message || new URL(window.location.href).searchParams.get("m") || "เกิดข้อผิดพลาด";

  return (
    <div className="container">
      <h1>⚠️ Error</h1>
      <div className="error">{m}</div>
    </div>
  );
}
