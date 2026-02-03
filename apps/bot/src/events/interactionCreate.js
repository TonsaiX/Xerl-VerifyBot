// apps/bot/src/events/interactionCreate.js
// ✅ handle slash commands + verify buttons (verify_start / verify_help) + กันบอทล้ม

import { Events, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export default {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    try {
      // ✅ Slash command
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        await command.execute(interaction);
        return;
      }

      // ✅ Button interaction
      if (!interaction.isButton()) return;

      // ✅ ปุ่มช่วยเหลือ (ต้องอยู่ก่อน ไม่งั้นจะ return ทิ้ง)
      if (interaction.customId === "verify_help") {
        return interaction.reply({
          ephemeral: true,
          content:
            "🆘 วิธี Verify (สั้นๆ)\n" +
            "1) กดปุ่ม **Verify ตอนนี้**\n" +
            "2) ล็อกอิน Discord\n" +
            "3) ติ๊ก Turnstile\n" +
            "4) กลับมาเช็คยศในเซิร์ฟเวอร์\n\n" +
            "ถ้าเว็บไม่ขึ้น/กดยืนยันไม่ได้:\n" +
            "• ลองปิด Adblock/ส่วนขยายกันโฆษณา\n" +
            "• ลองเปิดใหม่ใน Chrome/Edge\n" +
            "• แจ้งแอดมินให้เช็คว่า API และเว็บรันอยู่",
        });
      }

      // ✅ ปุ่ม Verify เริ่มต้น
      if (interaction.customId !== "verify_start") return;

      // ✅ ต้องอยู่ใน guild
      if (!interaction.guildId) {
        return interaction.reply({
          content: "ปุ่มนี้ใช้ได้เฉพาะในเซิร์ฟเวอร์นะ",
          ephemeral: true,
        });
      }

      // ✅ ขอ session sid จาก API (one-time)
      const res = await fetch(`${process.env.API_BASE_URL}/api/verify/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-BOT-AUTH": process.env.INTERNAL_BOT_SECRET,
        },
        body: JSON.stringify({
          guildId: interaction.guildId,
          userId: interaction.user.id,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        return interaction.reply({
          content: `สร้าง verify session ไม่สำเร็จ: ${text}`,
          ephemeral: true,
        });
      }

      const { sid } = await res.json();

      // ✅ ลิ้งไปหน้าเว็บ React (localhost ตอนนี้)
      const url = `http://localhost:5173/verify/start?sid=${encodeURIComponent(sid)}`;

      // ✅ ส่งปุ่ม link แบบ ephemeral
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel("ไปหน้า Verify").setStyle(ButtonStyle.Link).setURL(url)
      );

      return interaction.reply({
        content: "กดปุ่มนี้เพื่อไปหน้าเว็บ Verify:",
        components: [row],
        ephemeral: true,
      });
    } catch (err) {
      // ✅ กันบอทล้ม
      console.error("interactionCreate error:", err);

      if (interaction?.isRepliable?.()) {
        try {
          return interaction.reply({
            content:
              "ระบบ Verify ตอนนี้เชื่อมต่อ API ไม่ได้ 😵‍💫\n" +
              "เช็คว่า API รันอยู่ที่ http://127.0.0.1:3001/health แล้วลองใหม่",
            ephemeral: true,
          });
        } catch {
          // ignore
        }
      }
    }
  },
};
