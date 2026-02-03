// apps/bot/src/commands/setupVerify.js
// ✅ /setup-verify ส่ง embed + ปุ่ม verify_start + help
// ✅ ตั้งค่า roles ต่อ guild ผ่าน API

import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("setup-verify")
  .setDescription("ตั้งค่าข้อความ Verify + roles ที่จะได้หลังผ่าน")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addStringOption((opt) =>
    opt.setName("roles").setDescription("Role IDs คั่นด้วย , เช่น 111,222").setRequired(true)
  )
  .addChannelOption((opt) =>
    opt.setName("channel").setDescription("ห้องที่จะส่ง Verify").setRequired(true)
  )
  .addStringOption((opt) =>
    opt.setName("image").setDescription("ลิ้งรูปใหญ่ใน embed (https://...)").setRequired(false)
  )
  .addStringOption((opt) =>
    opt.setName("thumbnail").setDescription("ลิ้งรูปมุมขวา (https://...)").setRequired(false)
  );

export async function execute(interaction) {
  if (!interaction.guildId) {
    return interaction.reply({ content: "ใช้คำสั่งนี้ได้เฉพาะในเซิร์ฟเวอร์", ephemeral: true });
  }

  const rolesCsv = interaction.options.getString("roles", true);
  const channel = interaction.options.getChannel("channel", true);
  const imageUrl = interaction.options.getString("image", false);
  const thumbUrl = interaction.options.getString("thumbnail", false);

  const roleIds = rolesCsv.split(",").map((s) => s.trim()).filter(Boolean);

  // ✅ save config -> API
  const res = await fetch(`${process.env.API_BASE_URL}/api/guilds/${interaction.guildId}/verify-config`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-BOT-AUTH": process.env.INTERNAL_BOT_SECRET
    },
    body: JSON.stringify({ roleIds })
  });

  if (!res.ok) {
    const text = await res.text();
    return interaction.reply({ content: `ตั้งค่าไม่สำเร็จ: ${text}`, ephemeral: true });
  }

  const guildName = interaction.guild?.name || "Server";

  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle("🔐 ยืนยันตัวตนก่อนเข้าใช้งาน")
    .setDescription(
      `เพื่อความปลอดภัยของ **${guildName}**\nกดปุ่ม **Verify ตอนนี้** แล้วทำตามหน้าเว็บ (ล็อกอิน Discord + ติ๊ก Turnstile)\n\nเสร็จแล้วระบบจะให้ยศอัตโนมัติ ✅`
    )
    .addFields(
      { name: "ขั้นตอน", value: "1) กด Verify\n2) ล็อกอิน Discord\n3) ติ๊ก Turnstile\n4) ได้ยศอัตโนมัติ", inline: false },
      //{ name: "ยศที่จะได้รับ", value: roleIds.map((id) => `<@&${id}>`).join(" ") || "ยังไม่ได้ตั้ง", inline: false }
      { name: "ยศที่จะได้รับ", value: roleIds.length > 0 ? `<@&${roleIds[0]}>` : "ยังไม่ได้ตั้ง", inline: false }

    )
    .setFooter({ text: "Secure Verify • กดปุ่มแล้วทำตามหน้าเว็บ" });

  if (thumbUrl) embed.setThumbnail(thumbUrl);
  if (imageUrl) embed.setImage(imageUrl);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("verify_start").setStyle(ButtonStyle.Success).setLabel("✅ Verify ตอนนี้"),
    new ButtonBuilder().setCustomId("verify_help").setStyle(ButtonStyle.Secondary).setLabel("ℹ️ ขอความช่วยเหลือ")
  );

  await channel.send({ embeds: [embed], components: [row] });

  return interaction.reply({ content: `✅ ส่ง Verify แล้วใน ${channel}`, ephemeral: true });
}
