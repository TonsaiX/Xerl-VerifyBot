// apps/web/src/pages/Verify.jsx
// ✅ Clean Verify Page (minimal copy + สบายตา)

import React, { useEffect, useMemo, useState } from "react";
import { apiPost } from "../api.js";

export default function Verify() {
  const [status, setStatus] = useState("ready"); // ready | working
  const [error, setError] = useState("");
  const [tsToken, setTsToken] = useState("");

  // ✅ token จาก query (มาจาก API callback)
  const token = useMemo(() => new URL(window.location.href).searchParams.get("token") || "", []);

  useEffect(() => {
    // ✅ ถ้าไม่มี token -> ไป error
    if (!token) {
      window.location.href = "/error?m=" + encodeURIComponent("Missing token");
      return;
    }

    // ✅ Turnstile callback: ได้ token แล้วถือว่าผ่าน
    window.__xerlTurnstileOk = (t) => {
      setTsToken(t);
      setError("");
    };

    // ✅ Turnstile expired / error
    window.__xerlTurnstileExpired = () => setTsToken("");
    window.__xerlTurnstileError = () => {
      setTsToken("");
      setError("Turnstile โหลดไม่สำเร็จ (เช็ค domain/ส่วนขยายบล็อกโฆษณา)");
    };

    // ✅ โหลดสคริปต์ครั้งเดียว (กัน StrictMode dev ลบ)
    if (!document.querySelector('script[data-xerl-turnstile="1"]')) {
      const s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      s.async = true;
      s.defer = true;
      s.setAttribute("data-xerl-turnstile", "1");
      document.body.appendChild(s);
    }
  }, [token]);

  async function onSubmit() {
    setStatus("working");
    setError("");

    if (!tsToken) {
      setStatus("ready");
      setError("กรุณายืนยัน Turnstile ก่อน");
      return;
    }

    try {
      const out = await apiPost("/api/verify/complete", {
        token,
        turnstileToken: tsToken,
      });

      window.location.href = "/verified?g=" + encodeURIComponent(out.guildId);
    } catch (e) {
      setStatus("ready");
      setError(String(e.message || e));
    }
  }

  const ready = Boolean(tsToken);
  const statusText = ready ? "พร้อมแล้ว" : "ยังไม่ผ่าน";
  const statusClass = ready ? "stateOk" : "stateBad";

  return (
    <div className="page">
      <div className="card">
        <div className="cardHeader">
          <div className="titleRow">
            <div className="badge">🔐</div>
            <h1 className="h1">ยืนยันตัวตน</h1>
          </div>

          {/* ✅ คำอธิบายสั้น ๆ พอดี ไม่ยาว */}
          <p className="sub">
            ทำ 2 ขั้นตอน: ล็อกอิน Discord แล้วติ๊ก Turnstile — เสร็จแล้วระบบจะให้ยศอัตโนมัติ
          </p>
        </div>

        <div className="cardBody">
          {/* ✅ เล็ก ๆ พอ: แสดงสถานะ */}
          <div className="pillRow">
            <div className="pill">Discord Login ✓</div>
            <div className="pill">
              Turnstile: <span className={statusClass}>{statusText}</span>
            </div>
          </div>

          {/* ✅ Turnstile widget */}
          <div
            className="cf-turnstile"
            data-sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
            data-callback="__xerlTurnstileOk"
            data-expired-callback="__xerlTurnstileExpired"
            data-error-callback="__xerlTurnstileError"
          />

          <div className="ctaRow">
            <button className="btn" onClick={onSubmit} disabled={status === "working"}>
              {status === "working" ? "กำลังตรวจสอบ..." : "ยืนยัน"}
            </button>

            <div className="miniStatus">
              สถานะ: <b className={statusClass}>{ready ? "พร้อมยืนยัน" : "รอ Turnstile"}</b>
            </div>
          </div>

          {error && <div className="errorBox">{error}</div>}
        </div>

        <div className="footer">
          <span>Secure Verify • localhost</span>
          <a className="mutedLink" href="/" title="กลับหน้าแรก">
            กลับหน้าแรก
          </a>
        </div>
      </div>
    </div>
  );
}
