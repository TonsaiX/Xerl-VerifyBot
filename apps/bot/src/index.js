// apps/bot/src/index.js
// ✅ Discord bot main (Windows ESM safe)

import "dotenv/config";
import { Client, Collection, GatewayIntentBits } from "discord.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// ✅ commands map
client.commands = new Collection();

// ✅ load commands
const commandsPath = path.join(__dirname, "commands");
for (const file of fs.readdirSync(commandsPath).filter((f) => f.endsWith(".js"))) {
  const filePath = path.join(commandsPath, file);
  const mod = await import(pathToFileURL(filePath).href);
  client.commands.set(mod.data.name, mod);
}

// ✅ load events
const eventsPath = path.join(__dirname, "events");
for (const file of fs.readdirSync(eventsPath).filter((f) => f.endsWith(".js"))) {
  const filePath = path.join(eventsPath, file);
  const ev = await import(pathToFileURL(filePath).href);

  if (ev.default?.once) client.once(ev.default.name, (...args) => ev.default.execute(...args, client));
  else client.on(ev.default.name, (...args) => ev.default.execute(...args, client));
}

client.once("ready", () => console.log(`✅ Bot logged in as ${client.user.tag}`));

client.login(process.env.DISCORD_BOT_TOKEN);
