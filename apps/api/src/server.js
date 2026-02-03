// apps/api/src/server.js
// ✅ Express server + routes + CORS + init DB

import "dotenv/config";
import express from "express";
import cors from "cors";
import { initDb } from "./db.js";

import verifyConfigRoutes from "./routes/verifyConfig.js";
import verifyFlowRoutes from "./routes/verifyFlow.js";

const app = express();

// ✅ JSON body
app.use(express.json());

// ✅ CORS ให้ React เรียก API ได้
// ✅ CORS: รองรับทั้ง dev + prod ผ่าน ENV
const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // ✅ อนุญาต non-browser (เช่น curl/postman) ที่ไม่มี origin
      if (!origin) return cb(null, true);

      // ✅ อนุญาต origin ที่อยู่ใน whitelist
      if (allowedOrigins.includes(origin)) return cb(null, true);

      // ❌ ไม่อยู่ในลิสต์ = block
      return cb(new Error(`CORS blocked: ${origin}`));
    },
    credentials: false,
  })
);


// ✅ health check
app.get("/health", (req, res) => res.json({ ok: true }));

// ✅ routes
app.use("/api", verifyConfigRoutes);   // /api/guilds/:guildId/verify-config
app.use("/api", verifyFlowRoutes);     // /api/verify/session , /api/verify/complete
app.use("/", verifyFlowRoutes);        // /auth/discord/start , /auth/discord/callback

// ✅ start server
const port = Number(process.env.PORT || 3001);

(async () => {
  await initDb();
  app.listen(port, () => {
    console.log(`✅ API running on http://localhost:${port}`);
    console.log(`✅ OAuth redirect_uri: ${process.env.DISCORD_REDIRECT_URI}`);
  });
})();
