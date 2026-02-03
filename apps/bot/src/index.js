import "dotenv/config";
import { Client, Collection, GatewayIntentBits } from "discord.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// ===== load commands =====
const commandsPath = path.join(__dirname, "commands");
for (const file of fs.readdirSync(commandsPath).filter((f) => f.endsWith(".js"))) {
  const filePath = path.join(commandsPath, file);
  const mod = await import(pathToFileURL(filePath).href);

  if (!mod?.data?.name || typeof mod.execute !== "function") {
    console.warn(`⚠️ Skip command (invalid export): ${file}`);
    continue;
  }
  client.commands.set(mod.data.name, mod);
}

// ===== load events =====
const eventsPath = path.join(__dirname, "events");
for (const file of fs.readdirSync(eventsPath).filter((f) => f.endsWith(".js"))) {
  const filePath = path.join(eventsPath, file);
  const mod = await import(pathToFileURL(filePath).href);

  const ev = mod?.default;
  if (!ev || !ev.name || typeof ev.execute !== "function") {
    console.warn(`⚠️ Skip event (invalid export): ${file}`);
    continue;
  }

  if (ev.once) client.once(ev.name, (...args) => ev.execute(...args, client));
  else client.on(ev.name, (...args) => ev.execute(...args, client));
}

client.once("ready", () => console.log(`✅ Bot logged in as ${client.user.tag}`));

client.login(process.env.DISCORD_BOT_TOKEN);
