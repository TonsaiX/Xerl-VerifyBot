// apps/web/src/App.jsx
// ✅ Router แบบง่าย (ไม่ใช้ react-router) ด้วย hash/path

import React, { useMemo } from "react";
import Home from "./pages/Home.jsx";
import Verify from "./pages/Verify.jsx";
import Verified from "./pages/Verified.jsx";
import ErrorPage from "./pages/Error.jsx";

export default function App() {
  // ✅ อ่าน path ปัจจุบัน
  const path = useMemo(() => window.location.pathname, []);

  // ✅ dispatch ตาม path
  if (path === "/") return <Home />;
  if (path === "/verify/start") return <Home />; // start จะ redirect ด้วย script ใน Home
  if (path === "/verify") return <Verify />;
  if (path === "/verified") return <Verified />;
  if (path === "/error") return <ErrorPage />;

  return <ErrorPage message="404 ไม่พบหน้า" />;
}
