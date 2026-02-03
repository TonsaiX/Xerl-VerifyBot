// apps/bot/src/events/interactionCreate.js
// ✅ Button handler: verify_start -> เช็คว่าได้ verify role แล้วไหม -> ถ้าได้แล้วห้ามทำซ้ำ
// ✅ verify_help -> ตอบวิธีใช้งาน
// ✅ กันบอท crash ด้วย try/catch

import { Events, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export default {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    try {
      // ✅ Slash command
      if (interaction.isChatInputCommand()) {
        const cmd = client.commands.get(interaction.commandName);
        if (!cmd) return;
        await cmd.execute(interaction);
        return;
      }

      // ✅ Button
      if (!interaction.isButton()) return;

      // ✅ Help
      if (interaction.customId === "verify_help") {
        return interaction.reply({
          ephemeral: true,
          content:
            "🆘 วิธี Verify (สั้นๆ)\n" +
            "1) กดปุ่ม **Verify ตอนนี้**\n" +
            "2) ล็อกอิน Discord\n" +
            "3) ติ๊ก Turnstile\n" +
            "4) ได้ยศอัตโนมัติ ✅\n\n" +
            "ถ้าเว็บไม่ขึ้น: ลองปิด Adblock/ลองเบราว์เซอร์อื่น"
        });
      }

      // ✅ Start verify
      if (interaction.customId !== "verify_start") return;

      if (!interaction.guildId) {
        return interaction.reply({ content: "ปุ่มนี้ใช้ในเซิร์ฟเวอร์เท่านั้น", ephemeral: true });
      }

      // =========================
      // ✅ 1) โหลด verify-config
      // =========================
      const cfgRes = await fetch(`${process.env.API_BASE_URL}/api/guilds/${interaction.guildId}/verify-config`, {
        method: "GET",
        headers: {
          "X-BOT-AUTH": process.env.INTERNAL_BOT_SECRET
        }
      });

      let roleIds = [];
      if (cfgRes.ok) {
        const cfg = await cfgRes.json();
        roleIds = Array.isArray(cfg.roleIds) ? cfg.roleIds : [];
      }

      // ✅ ใช้ role ตัวแรกเป็น verify role หลัก (ง่ายสุด)
      const verifyRoleId = roleIds[0];

      // =========================
      // ✅ 2) ถ้ามี role แล้ว -> ห้ามทำซ้ำ
      // =========================
      if (verifyRoleId) {
        const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
        if (member && member.roles.cache.has(verifyRoleId)) {
          return interaction.reply({
            ephemeral: true,
            content: "✅ คุณได้ยศ Verify แล้ว ไม่ต้องยืนยันซ้ำครับ"
          });
        }
      }

      // =========================
      // ✅ 3) create session
      // =========================
      const res = await fetch(`${process.env.API_BASE_URL}/api/verify/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-BOT-AUTH": process.env.INTERNAL_BOT_SECRET
        },
        body: JSON.stringify({
          guildId: interaction.guildId,
          userId: interaction.user.id
        })
      });

      if (!res.ok) {
        const text = await res.text();
        return interaction.reply({ content: `สร้าง session ไม่สำเร็จ: ${text}`, ephemeral: true });
      }

      const { sid } = await res.json();

      // ✅ build frontend link from ENV (สำคัญ)
      const FRONT = process.env.FRONTEND_URL;
      if (!FRONT) throw new Error("FRONTEND_URL missing in bot .env");

      const url = `${FRONT.replace(/\/$/, "")}/verify/start?sid=${encodeURIComponent(sid)}`;

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel("ไปหน้า Verify").setURL(url)
      );

      return interaction.reply({
        ephemeral: true,
        content: "กดปุ่มนี้เพื่อไปหน้าเว็บ Verify:",
        components: [row]
      });
    } catch (e) {
      console.error("interactionCreate error:", e);
      if (interaction?.isRepliable?.()) {
        try {
          return interaction.reply({
            ephemeral: true,
            content: "ตอนนี้ระบบมีปัญหาชั่วคราว ลองใหม่อีกครั้ง หรือแจ้งแอดมิน"
          });
        } catch {}
      }
    }
  }
};
