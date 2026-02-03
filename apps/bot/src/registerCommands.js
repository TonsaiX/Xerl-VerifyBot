// apps/bot/src/registerCommands.js
// ✅ Register slash commands (Windows ESM safe)

import "dotenv/config";
import { REST, Routes } from "discord.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = [];
const commandsPath = path.join(__dirname, "commands");

for (const file of fs.readdirSync(commandsPath).filter((f) => f.endsWith(".js"))) {
  const filePath = path.join(commandsPath, file);
  const mod = await import(pathToFileURL(filePath).href);
  commands.push(mod.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_BOT_TOKEN);

(async () => {
  try {
    console.log("⏳ Registering slash commands...");
    await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body: commands });
    console.log("✅ Slash commands registered");
  } catch (e) {
    console.error("❌ Register failed:", e);
    process.exit(1);
  }
})();
