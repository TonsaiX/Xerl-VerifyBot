// apps/bot/src/registerCommands.js
// ✅ Register slash commands ไปที่ Discord (Fix Windows ESM path)

import "dotenv/config";
import { REST, Routes } from "discord.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// ✅ ทำ __dirname สำหรับ ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ รวบรวม command data ทั้งหมด
const commands = [];
const commandsPath = path.join(__dirname, "commands");

// ✅ โหลดทุกไฟล์ใน commands
for (const file of fs.readdirSync(commandsPath).filter((f) => f.endsWith(".js"))) {
  const filePath = path.join(commandsPath, file);

  // ✅ FIX: Windows ESM ต้อง import ผ่าน file:// URL
  const commandModule = await import(pathToFileURL(filePath).href);

  // ✅ ใส่ command data (SlashCommandBuilder) ลง array
  commands.push(commandModule.data.toJSON());
}

// ✅ REST client
const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_BOT_TOKEN);

// ✅ register commands แบบ global
(async () => {
  try {
    console.log("⏳ Registering slash commands...");
    await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), {
      body: commands,
    });
    console.log("✅ Slash commands registered");
  } catch (err) {
    console.error("❌ Register failed:", err);
    process.exit(1);
  }
})();
