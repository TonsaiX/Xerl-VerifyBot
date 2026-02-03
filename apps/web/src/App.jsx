// apps/web/src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Verify from "./pages/Verify.jsx";
import Verified from "./pages/Verified.jsx";

export default function App() {
  return (
    <Routes>
      {/* หน้า verify ที่ต้องยิง /api/verify/complete */}
      <Route path="/verify" element={<Verify />} />

      {/* หน้าสำเร็จ */}
      <Route path="/verified" element={<Verified />} />

      {/* default */}
      <Route path="*" element={<Navigate to="/verify" replace />} />
    </Routes>
  );
}
