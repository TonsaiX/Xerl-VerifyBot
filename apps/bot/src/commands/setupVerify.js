// apps/bot/src/commands/setupVerify.js
// ✅ /setup-verify ส่ง Embed + ปุ่ม Verify และตั้งค่า role ที่จะให้หลัง verify
// ✅ Embed ใหม่: ภาษาง่าย, ดูโปร, ใส่รูปได้ (thumbnail + image)

import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("setup-verify")
  .setDescription("ตั้งค่าข้อความ Verify (สวยๆ) + roles ที่จะให้หลัง verify")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addStringOption((opt) =>
    opt
      .setName("roles")
      .setDescription("ใส่ Role IDs คั่นด้วย , เช่น 111,222,333")
      .setRequired(true)
  )
  .addChannelOption((opt) =>
    opt
      .setName("channel")
      .setDescription("ห้องที่จะส่งข้อความ Verify")
      .setRequired(true)
  )
  .addStringOption((opt) =>
    opt
      .setName("title")
      .setDescription("หัวข้อ (ไม่ใส่ก็ได้) เช่น 'ยืนยันตัวตนเพื่อเข้าเซิร์ฟเวอร์'")
      .setRequired(false)
  )
  .addStringOption((opt) =>
    opt
      .setName("image")
      .setDescription("ลิงก์รูปใหญ่ใน Embed (https://...) ไม่ใส่ก็ได้")
      .setRequired(false)
  )
  .addStringOption((opt) =>
    opt
      .setName("thumbnail")
      .setDescription("ลิงก์รูปมุมขวา (thumbnail) (https://...) ไม่ใส่ก็ได้")
      .setRequired(false)
  )
  .addStringOption((opt) =>
    opt
      .setName("note")
      .setDescription("ข้อความสั้นๆ เพิ่มเติม (ไม่ใส่ก็ได้) เช่น 'ถ้าไม่ขึ้นหน้าเว็บ ลองปิด adblock'")
      .setRequired(false)
  );

export async function execute(interaction) {
  // ✅ ต้องอยู่ใน guild
  if (!interaction.guildId) {
    return interaction.reply({ content: "ใช้คำสั่งนี้ได้เฉพาะในเซิร์ฟเวอร์", ephemeral: true });
  }

  const rolesCsv = interaction.options.getString("roles", true);
  const channel = interaction.options.getChannel("channel", true);

  const customTitle = interaction.options.getString("title", false);
  const imageUrl = interaction.options.getString("image", false);
  const thumbUrl = interaction.options.getString("thumbnail", false);
  const note = interaction.options.getString("note", false);

  // ✅ แปลง CSV -> array roleIds
  const roleIds = rolesCsv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // ✅ เซฟ config ลง API
  const res = await fetch(
    `${process.env.API_BASE_URL}/api/guilds/${interaction.guildId}/verify-config`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-BOT-AUTH": process.env.INTERNAL_BOT_SECRET,
      },
      body: JSON.stringify({ roleIds }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    return interaction.reply({ content: `ตั้งค่าไม่สำเร็จ: ${text}`, ephemeral: true });
  }

  // ✅ สร้าง embed โทนสะอาด อ่านง่าย
  const guildName = interaction.guild?.name || "เซิร์ฟเวอร์นี้";
  const serverIcon = interaction.guild?.iconURL({ size: 256 }) || null;

  const embed = new EmbedBuilder()
    .setColor(0x2b2d31) // โทนเข้มสวยๆ (ปรับได้)
    .setTitle(customTitle || "🔐 ยืนยันตัวตนก่อนเข้าใช้งาน")
    .setDescription(
      [
        `เพื่อความปลอดภัยของ **${guildName}**`,
        "กรุณากดปุ่ม **Verify** ด้านล่าง แล้วทำตามขั้นตอนบนหน้าเว็บ",
        "",
        "✅ ทำครั้งเดียว • ระบบจะให้ยศอัตโนมัติหลังผ่าน",
      ].join("\n")
    )
    .addFields(
      {
        name: "ทำไมต้อง Verify?",
        value: "ช่วยกันบอท/สแปม และลดบัญชีแปลกปลอมในเซิร์ฟเวอร์",
        inline: false,
      },
      {
        name: "ขั้นตอน",
        value: "1) กดปุ่ม Verify\n2) ล็อกอิน Discord\n3) ติ๊ก Turnstile\n4) กลับมาเช็คยศในเซิร์ฟเวอร์",
        inline: false,
      }
    )
    .setFooter({ text: "Secure Verify • กดปุ่มแล้วทำตามหน้าเว็บ" });

  // ✅ ใส่ thumbnail (ถ้าไม่ใส่ให้ใช้รูปเซิร์ฟเวอร์)
  if (thumbUrl) embed.setThumbnail(thumbUrl);
  else if (serverIcon) embed.setThumbnail(serverIcon);

  // ✅ ใส่รูปใหญ่ (ถ้าระบุมา)
  if (imageUrl) embed.setImage(imageUrl);

  // ✅ note สั้นๆ (ถ้ามี)
  if (note) {
    embed.addFields({
      name: "หมายเหตุ",
      value: note.length > 200 ? note.slice(0, 200) + "..." : note,
      inline: false,
    });
  }

  // ✅ ปุ่ม verify (customId) เพื่อให้บอทสร้างลิงก์เฉพาะคนแบบปลอดภัย
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("verify_start").setLabel("✅ Verify ตอนนี้").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setLabel("ℹ️ ช่วยเหลือ").setStyle(ButtonStyle.Secondary).setCustomId("verify_help")
  );

  await channel.send({ embeds: [embed], components: [row] });

  return interaction.reply({
    content: `✅ ส่ง Verify embed แล้วใน ${channel}\nตั้งค่า roles: ${roleIds.join(", ")}`,
    ephemeral: true,
  });
}
