// apps/api/src/util/crypto.js
// ✅ helper สร้าง random token

import crypto from "node:crypto";

export function randomHex(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}
