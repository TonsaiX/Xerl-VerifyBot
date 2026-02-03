// apps/api/src/server.js
// ✅ Express API สำหรับ Verify flow + Discord OAuth + Turnstile + Assign Roles
// ✅ สำคัญ: CORS + OPTIONS ต้องผ่าน (ไม่งั้น browser จะ Failed to fetch)

import "dotenv/config";
import express from "express";
import cors from "cors";
import { initDb } from "./db.js";
import guildsRouter from "./routes/guilds.js";
import verifyRouter from "./routes/verifyFlow.js";

const app = express();

// ✅ parse JSON body
app.use(express.json({ limit: "1mb" }));

// ======================
// ✅ CORS (prod-ready)
// ======================
const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // ✅ allow non-browser (curl/postman) ที่ไม่มี origin
      if (!origin) return cb(null, true);

      // ✅ allow whitelist
      if (allowedOrigins.includes(origin)) return cb(null, true);

      // ✅ อย่า throw error (ถ้า throw จะกลายเป็น 500)
      console.log("❌ CORS blocked:", origin);
      return cb(null, false);
    },
    methods: ["GET", "POST", "PUT", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-BOT-AUTH"]
  })
);

// ✅ สำคัญ: ตอบ OPTIONS ให้หมด
app.options("*", cors());

// ✅ health
app.get("/health", (req, res) => res.json({ ok: true }));

// ✅ routes
app.use("/api", guildsRouter);
app.use("/", verifyRouter);

// ✅ start
const PORT = Number(process.env.PORT || 3001);

(async () => {
  await initDb();
  app.listen(PORT, () => {
    console.log(`✅ API running on http://localhost:${PORT}`);
  });
})();
