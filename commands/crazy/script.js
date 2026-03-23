// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//     TERRA - XMD | SCRIPT COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const { buildCtx } = require("../../lib/msgHelper")
const config = require("../../config")

const REPO_URL    = "https://github.com/Crazynotdev/TERRA-BOT"
const SUPPORT_URL = "https://whatsapp.com/channel/0029VbCdEt4EgGfUp0X6bG3o"
const FORK_URL    = "https://github.com/Crazynotdev/TERRA-BOT/fork"
const STAR_URL    = "https://github.com/Crazynotdev/TERRA-BOT/stargazers"
const SCRIPT_IMG  = "https://files.catbox.moe/zrnprr.jpg"

module.exports = [
  {
    cmd: ["script", "repo", "source"],
    desc: "Informations sur le script du bot",
    category: "general",
    exec: async ({ sock, jid, msg, react }) => {
      await react("🌍")

      const ctx = buildCtx("TERRA - XMD", "by crazy")

      await sock.sendMessage(jid, {
        image:   { url: SCRIPT_IMG },
        caption:
          `『 🌍 *TERRA - XMD* 』\n\n` +

          `*╭───〔 📜 sᴄʀɪᴘᴛ ɪɴꜰᴏ 〕───┈⊷*\n` +
          `│ 🤖 *ɴᴀᴍᴇ:* ${config.BOT_NAME}\n` +
          `│ 👨‍💻 *ᴅᴇᴠ:* crazy\n` +
          `│ 🌿 *ᴠᴇʀsɪᴏɴ:* 1.0.0\n` +
          `│ ⚙️ *ʟᴀɴɢ:* Node.js\n` +
          `│ 📦 *ʟɪʙ:* gifted-baileys\n` +
          `╰────────────────┈⊷\n\n` +

          `*╭───〔 🔗 ʟɪɴᴋs 〕───┈⊷*\n` +
          `│\n` +
          `│ 🐙 *ʀᴇᴘᴏ ɢɪᴛʜᴜʙ*\n` +
          `│ ${REPO_URL}\n` +
          `│\n` +
          `│ 💬 *sᴜᴘᴘᴏʀᴛ ᴄʜᴀɴɴᴇʟ*\n` +
          `│ ${SUPPORT_URL}\n` +
          `│\n` +
          `│ 🍴 *ꜰᴏʀᴋ ʟᴇ ʀᴇᴘᴏ*\n` +
          `│ ${FORK_URL}\n` +
          `│\n` +
          `│ ⭐ *sᴛᴀʀ ʟᴇ ʀᴇᴘᴏ*\n` +
          `│ ${STAR_URL}\n` +
          `│\n` +
          `╰────────────────┈⊷\n\n` +

          `*╭───〔 💡 ɪɴꜰᴏ 〕───┈⊷*\n` +
          `│ ⭐ sᴛᴀʀ ʟᴇ ʀᴇᴘᴏ sɪ ᴛᴜ ʟ'ᴀɪᴍᴇs !\n` +
          `│ 🍴 ꜰᴏʀᴋ ᴘᴏᴜʀ ᴛᴏɴ ᴘʀᴏᴘʀᴇ ʙᴏᴛ\n` +
          `│ 🐛 ʀᴇᴘᴏʀᴛᴇ ʟᴇs ʙᴜɢs sᴜʀ ɢɪᴛʜᴜʙ\n` +
          `╰────────────────┈⊷\n\n` +

          `> ɢᴇɴᴇʀᴀᴛᴇᴅ ʙʏ *TERRA - XMD* ✨\n` +
          `> _${config.BOT_TAG}_`,
        ...ctx
      }, { quoted: msg })
    }
  }
]