import "dotenv/config";
import { Client, Collection, GatewayIntentBits } from "discord.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection();

/* =======================
   LOAD COMMANDS
======================= */
const commandsPath = path.join(__dirname, "commands");
for (const file of fs.readdirSync(commandsPath)) {
  if (!file.endsWith(".js")) continue;

  const filePath = path.join(commandsPath, file);
  const mod = await import(pathToFileURL(filePath).href);

  if (!mod?.data?.name || typeof mod.execute !== "function") {
    console.warn(`⚠️ Skip command (invalid export): ${file}`);
    continue;
  }

  client.commands.set(mod.data.name, mod);
}

/* =======================
   LOAD EVENTS (SAFE)
======================= */
const eventsPath = path.join(__dirname, "events");
for (const file of fs.readdirSync(eventsPath)) {
  if (!file.endsWith(".js")) continue;

  const filePath = path.join(eventsPath, file);
  const mod = await import(pathToFileURL(filePath).href);
  const event = mod?.default;

  if (!event || !event.name || typeof event.execute !== "function") {
    console.warn(`⚠️ Skip event (invalid export): ${file}`);
    continue;
  }

  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

client.once("ready", () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);
});

client.login(process.env.DISCORD_BOT_TOKEN);
