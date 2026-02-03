// apps/web/src/pages/Verify.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_BASE, APP_NAME } from "../config.js";

// ✅ ถ้าพาวาใช้ Turnstile แบบ script + widget ภายนอกอยู่แล้ว
// ให้ส่ง turnstileToken มาที่ setTurnstileToken(...) ตรงนี้
// (โค้ดนี้ไม่ผูก library ใดๆ เพื่อให้ "React ธรรมดา" จริง)

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function Verify() {
  const navigate = useNavigate();
  const q = useQuery();

  const token = q.get("token") || "";
  const [turnstileToken, setTurnstileToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("พร้อมยืนยัน");

  // ✅ ถ้าไม่มี token ให้แจ้งชัด
  useEffect(() => {
    if (!token) {
      setError("ไม่พบ token (ลิงก์ไม่ถูกต้อง) กรุณากด Verify จาก Discord ใหม่");
    }
  }, [token]);

  // ✅ ตัวอย่าง: ถ้าพาวาใช้ Turnstile widget แล้วเรียก callback ได้
  // ให้เอา callback นั้นมา setTurnstileToken
  // window.__setTurnstile = (t) => setTurnstileToken(t);

  async function handleSubmit() {
    setError("");

    if (!API_BASE) {
      setError("API_BASE (VITE_API_BASE_URL) ยังไม่ถูกตั้งค่า");
      return;
    }
    if (!token) {
      setError("ไม่พบ token กรุณากด Verify จาก Discord ใหม่");
      return;
    }
    if (!turnstileToken) {
      setError("กรุณายืนยัน Turnstile ก่อน");
      return;
    }

    try {
      setLoading(true);
      setStatus("กำลังยืนยัน...");

      const res = await fetch(`${API_BASE.replace(/\/$/, "")}/api/verify/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          turnstileToken
        })
      });

      const data = await res.json().catch(() => ({}));

      // ✅ ถ้า API ตอบ error (เช่น assign role failed) ให้โชว์เลย
      if (!res.ok) {
        setStatus("ยืนยันไม่สำเร็จ");
        const msg =
          data?.error ||
          data?.message ||
          "เกิดข้อผิดพลาดในการยืนยัน (ดูรายละเอียดใน Network → /api/verify/complete)";
        setError(typeof data === "string" ? data : JSON.stringify(data, null, 2) || msg);
        return;
      }

      setStatus("ยืนยันสำเร็จ");

      // ✅ สำเร็จแล้วค่อยไปหน้า verified (ห้ามข้ามขั้น!)
      const guildId = data.guildId || "";
      navigate(`/verified?g=${encodeURIComponent(guildId)}`, { replace: true });
    } catch (e) {
      setStatus("ยืนยันไม่สำเร็จ");
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.icon}>✅</div>
          <div>
            <div style={styles.title}>ยืนยันตัวตน</div>
            <div style={styles.sub}>
              ล็อกอิน Discord แล้วติ๊ก Turnstile จากนั้นกด “ยืนยัน” เพื่อรับยศอัตโนมัติ
            </div>
          </div>
        </div>

        <div style={styles.row}>
          <span style={styles.badge}>สถานะ: {status}</span>
        </div>

        {/* ✅ Turnstile area (พาวาเอา widget จริงมายัดตรงนี้ได้เลย) */}
        <div style={styles.turnstileBox}>
          <div style={styles.turnstileHint}>
            Turnstile: {turnstileToken ? "พร้อมแล้ว ✅" : "ยังไม่ยืนยัน"}
          </div>

          {/* ✅ ปุ่มนี้ไว้ทดสอบเฉยๆ (อย่าลืมลบเมื่อใช้ widget จริง) */}
          <button
            style={styles.fakeTurnstileBtn}
            onClick={() => setTurnstileToken("TEST_TOKEN")}
            disabled={loading}
          >
            (ทดสอบ) ใส่ Turnstile Token
          </button>
        </div>

        <button style={styles.btn} onClick={handleSubmit} disabled={loading || !token}>
          {loading ? "กำลังยืนยัน..." : "ยืนยัน"}
        </button>

        {error ? <pre style={styles.error}>{error}</pre> : null}

        <div style={styles.footer}>
          <span>{APP_NAME}</span>
        </div>
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
  row: { display: "flex", gap: 10, margin: "10px 0 14px" },
  badge: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.10)"
  },
  turnstileBox: {
    borderRadius: 14,
    border: "1px dashed rgba(255,255,255,0.18)",
    padding: 12,
    marginBottom: 12
  },
  turnstileHint: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginBottom: 10 },
  fakeTurnstileBtn: {
    width: "100%",
    borderRadius: 12,
    padding: "10px 12px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "white",
    cursor: "pointer"
  },
  btn: {
    width: "100%",
    borderRadius: 12,
    padding: "12px 14px",
    background: "rgba(255,255,255,0.14)",
    border: "1px solid rgba(255,255,255,0.16)",
    color: "white",
    fontWeight: 800,
    cursor: "pointer"
  },
  error: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    background: "rgba(255,70,70,0.10)",
    border: "1px solid rgba(255,70,70,0.25)",
    color: "rgba(255,230,230,0.92)",
    whiteSpace: "pre-wrap",
    overflowX: "auto",
    fontSize: 12
  },
  footer: { marginTop: 12, color: "rgba(255,255,255,0.45)", fontSize: 12, textAlign: "center" }
};
