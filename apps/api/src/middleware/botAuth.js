// apps/api/src/middleware/botAuth.js
// ✅ middleware สำหรับ endpoint ที่ให้บอทเรียกเท่านั้น

export function requireBotAuth(req, res, next) {
  const secret = req.header("X-BOT-AUTH");
  if (!secret || secret !== process.env.INTERNAL_BOT_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}
