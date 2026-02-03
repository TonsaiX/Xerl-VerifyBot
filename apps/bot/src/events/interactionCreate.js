// apps/bot/src/events/interactionCreate.js
// ✅ interactionCreate - handle commands + verify buttons

import { Events, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export default {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    try {
      // Slash command
      if (interaction.isChatInputCommand()) {
        const cmd = client.commands.get(interaction.commandName);
        if (!cmd) return;
        await cmd.execute(interaction);
        return;
      }

      if (!interaction.isButton()) return;

      // Help button
      if (interaction.customId === "verify_help") {
        return interaction.reply({
          ephemeral: true,
          content:
            "🆘 วิธี Verify (สั้นๆ)\n" +
            "1) กด **Verify ตอนนี้**\n" +
            "2) ล็อกอิน Discord\n" +
            "3) ติ๊ก Turnstile\n" +
            "4) ได้ยศอัตโนมัติ ✅"
        });
      }

      // Verify button
      if (interaction.customId !== "verify_start") return;

      if (!interaction.guildId) {
        return interaction.reply({ ephemeral: true, content: "ปุ่มนี้ใช้ในเซิร์ฟเวอร์เท่านั้น" });
      }

      // ✅ ดึง roleIds ของ guild
      const cfgRes = await fetch(`${process.env.API_BASE_URL}/api/guilds/${interaction.guildId}/verify-config`, {
        method: "GET",
        headers: { "X-BOT-AUTH": process.env.INTERNAL_BOT_SECRET }
      });

      let roleIds = [];
      if (cfgRes.ok) {
        const cfg = await cfgRes.json();
        roleIds = Array.isArray(cfg.roleIds) ? cfg.roleIds : [];
      }

      const verifyRoleId = roleIds[0]; // ✅ ใช้ role ตัวแรกเป็น Verify role หลัก

      // ✅ ถ้ามี role แล้วห้ามทำซ้ำ
      if (verifyRoleId) {
        const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
        if (member && member.roles.cache.has(verifyRoleId)) {
          return interaction.reply({
            ephemeral: true,
            content: "✅ คุณได้ยศ Verify แล้ว ไม่ต้องยืนยันซ้ำครับ"
          });
        }
      }

      // create session
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
        return interaction.reply({ ephemeral: true, content: `สร้าง session ไม่สำเร็จ: ${text}` });
      }

      const { sid } = await res.json();

      const FRONT = process.env.FRONTEND_URL;
      if (!FRONT) throw new Error("FRONTEND_URL missing in bot env");

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
            content: "ระบบมีปัญหาชั่วคราว ลองใหม่อีกครั้ง"
          });
        } catch {}
      }
    }
  }
};
