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
app.use(
  cors({
    origin: ["http://localhost:5173"],
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
