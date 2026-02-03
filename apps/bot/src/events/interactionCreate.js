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
            "1) กด **Verify ตอนนี้**\n" +
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

      // ✅ create session
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

      // ✅ build frontend link from ENV
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
            content: "ตอนนี้ระบบมีปัญหาชั่วคราว ลองใหม่อีกครั้ง หรือแจ้งแอดมิน"
          });
        } catch {}
      }
    }
  }
};
