// apps/web/src/router.jsx
// ✅ Simple client router without react-router (ตามที่พาวาขอ “React ธรรมดา”)

import React, { useEffect, useState } from "react";
import Home from "./pages/Home.jsx";
import VerifyStart from "./pages/VerifyStart.jsx";
import Verify from "./pages/Verify.jsx";
import Verified from "./pages/Verified.jsx";
import ErrorPage from "./pages/Error.jsx";

function getPath() {
  return window.location.pathname;
}

export default function Router() {
  const [path, setPath] = useState(getPath());

  useEffect(() => {
    const onPop = () => setPath(getPath());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  if (path === "/") return <Home />;
  if (path === "/verify/start") return <VerifyStart />;
  if (path === "/verify") return <Verify />;
  if (path === "/verified") return <Verified />;
  if (path === "/error") return <ErrorPage />;

  return <ErrorPage fallbackMessage="404 ไม่พบหน้านี้" />;
}
