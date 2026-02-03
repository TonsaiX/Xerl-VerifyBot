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

/* ================= COMMANDS ================= */
const commandsPath = path.join(__dirname, "commands");
for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"))) {
  const filePath = path.join(commandsPath, file);

  // ✅ FIX: Windows ESM ต้องแปลงเป็น file://
  const command = await import(pathToFileURL(filePath).href);

  client.commands.set(command.data.name, command);
}

/* ================= EVENTS ================= */
const eventsPath = path.join(__dirname, "events");
for (const file of fs.readdirSync(eventsPath).filter(f => f.endsWith(".js"))) {
  const filePath = path.join(eventsPath, file);

  // ✅ FIX เหมือนกัน
  const event = await import(pathToFileURL(filePath).href);

  if (event.default?.once) {
    client.once(event.default.name, (...args) =>
      event.default.execute(...args, client)
    );
  } else {
    client.on(event.default.name, (...args) =>
      event.default.execute(...args, client)
    );
  }
}

client.once("ready", () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);
});

client.login(process.env.DISCORD_BOT_TOKEN);
