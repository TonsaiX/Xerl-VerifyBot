// apps/web/src/pages/Verify.jsx
// ✅ หน้า Verify: รับ token จาก query -> Turnstile -> POST complete ไป API

import React, { useEffect, useMemo, useState } from "react";
import { apiPost } from "../api.js";

export default function Verify() {
  const [status, setStatus] = useState("ready");
  const [error, setError] = useState("");
  const [tsToken, setTsToken] = useState("");

  const token = useMemo(() => new URL(window.location.href).searchParams.get("token") || "", []);

  useEffect(() => {
    if (!token) {
      window.location.href = "/error?m=" + encodeURIComponent("Missing token");
      return;
    }

    // ✅ Turnstile callbacks
    window.__xerlTurnstileOk = (t) => {
      setTsToken(t);
      setError("");
    };
    window.__xerlTurnstileExpired = () => setTsToken("");
    window.__xerlTurnstileError = () => {
      setTsToken("");
      setError("Turnstile โหลดไม่สำเร็จ (เช็ค domain/ส่วนขยายบล็อกโฆษณา)");
    };

    // ✅ Load script once
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
        turnstileToken: tsToken
      });

      window.location.href = "/verified?g=" + encodeURIComponent(out.guildId);
    } catch (e) {
      setStatus("ready");
      setError(String(e.message || e));
    }
  }

  const ready = Boolean(tsToken);

  return (
    <div className="page">
      <div className="card">
        <div className="cardHeader">
          <div className="titleRow">
            <div className="badge">🔐</div>
            <h1 className="h1">ยืนยันตัวตน</h1>
          </div>
          <p className="sub">ล็อกอิน Discord แล้วติ๊ก Turnstile — เสร็จแล้วระบบจะให้ยศอัตโนมัติ</p>
        </div>

        <div className="cardBody">
          <div className="pillRow">
            <div className="pill">Discord Login ✓</div>
            <div className="pill">
              Turnstile:{" "}
              <span className={ready ? "stateOk" : "stateBad"}>{ready ? "พร้อมแล้ว" : "ยังไม่ผ่าน"}</span>
            </div>
          </div>

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
              สถานะ:{" "}
              <b className={ready ? "stateOk" : "stateBad"}>{ready ? "พร้อมยืนยัน" : "รอ Turnstile"}</b>
            </div>
          </div>

          {error && <div className="errorBox">{error}</div>}
        </div>

        <div className="footer">
          <span>Secure Verify</span>
          <a className="mutedLink" href="/">กลับหน้าแรก</a>
        </div>
      </div>
    </div>
  );
}
