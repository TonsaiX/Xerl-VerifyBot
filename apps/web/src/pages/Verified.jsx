// apps/web/src/pages/Verified.jsx
import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { APP_NAME } from "../config.js";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function Verified() {
  const navigate = useNavigate();
  const q = useQuery();
  const guildId = q.get("g") || "";

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.icon}>✅</div>
          <div>
            <div style={styles.title}>ยืนยันสำเร็จ</div>
            <div style={styles.sub}>
              ระบบได้ส่งคำขอให้ Discord แจกยศแล้ว (ถ้ายังไม่ขึ้น ลองรอสักครู่แล้วเช็คใหม่)
            </div>
          </div>
        </div>

        <div style={styles.meta}>Guild: {guildId || "-"}</div>

        <button style={styles.btn} onClick={() => navigate("/verify", { replace: true })}>
          กลับไปหน้า Verify
        </button>

        <div style={styles.footer}>{APP_NAME}</div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 24,
    background:
      "radial-gradient(1000px 500px at 20% 10%, rgba(60,100,255,0.18), transparent), radial-gradient(800px 500px at 80% 20%, rgba(0,200,160,0.14), transparent), #070a10"
  },
  card: {
    width: "min(520px, 92vw)",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    boxShadow: "0 18px 60px rgba(0,0,0,0.45)",
    backdropFilter: "blur(16px)",
    padding: 18
  },
  header: { display: "flex", gap: 12, alignItems: "center", marginBottom: 12 },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.12)"
  },
  title: { color: "white", fontSize: 20, fontWeight: 800 },
  sub: { color: "rgba(255,255,255,0.72)", fontSize: 13, marginTop: 4, lineHeight: 1.4 },
  meta: {
    marginTop: 10,
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    padding: "8px 10px",
    borderRadius: 12,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)"
  },
  btn: {
    marginTop: 14,
    width: "100%",
    borderRadius: 12,
    padding: "12px 14px",
    background: "rgba(255,255,255,0.14)",
    border: "1px solid rgba(255,255,255,0.16)",
    color: "white",
    fontWeight: 800,
    cursor: "pointer"
  },
  footer: { marginTop: 12, color: "rgba(255,255,255,0.45)", fontSize: 12, textAlign: "center" }
};
