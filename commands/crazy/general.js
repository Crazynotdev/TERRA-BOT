// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//     TERRA - XMD | GENERAL COMMANDS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const { groupByCategory } = require("../../handler")
const { buildCtx, BOT_THUMB } = require("../../lib/msgHelper")
const { formatUptime }        = require("../../lib/utils")
const config = require("../../config")
const moment = require("moment")

// ── Convertisseur small caps / fancy ──
function fancy(text) {
  const norm  = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const small = "ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ"
  return text.split("").map(c => {
    const i = norm.indexOf(c)
    return i !== -1 ? small[i] : c
  }).join("")
}

// ── Icônes et titres fancy par catégorie
const CATS = {
  general: { icon: "🌍", title: "ɢᴇɴᴇʀᴀʟ"  },
  fun:     { icon: "🎮", title: "ꜰᴜɴ & ɢᴀᴍᴇs" },
  info:    { icon: "📖", title: "ɪɴꜰᴏ & ᴛᴏᴏʟs" },
  profil:  { icon: "👤", title: "ᴘʀᴏꜰɪʟ"    },
  media:   { icon: "📥", title: "ᴅᴏᴡɴʟᴏᴀᴅ"  },
  group:   { icon: "👥", title: "ɢʀᴏᴜᴘ"     },
  ai:      { icon: "🤖", title: "ᴀɪ ᴛᴏᴏʟs"  },
  owner:   { icon: "👑", title: "ᴏᴡɴᴇʀ"     },
}

module.exports = [

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //               MENU
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    cmd: ["menu", "help", "aide"],
    desc: "Afficher le menu des commandes",
    category: "general",
    exec: async ({ sock, jid, msg, prefix, isOwner, pushName }) => {
      const grouped  = groupByCategory()
      const now      = moment().format("DD/MM/YYYY • HH:mm")
      const uptime   = formatUptime(process.uptime() * 1000)
      const total    = Object.values(grouped).flat().length

      let text = ""

      // ── Header ────────────────────────
      text += `『 🌍 *TERRA - XMD* 🌍 』\n\n`

      // ── User Info ─────────────────────
      text += `*╭───〔 👤 ᴜsᴇʀ ɪɴꜰᴏ 〕───┈⊷*\n`
      text += `│ 🌿 *ɴᴀᴍᴇ:* ${pushName || "ᴜsᴇʀ"}\n`
      text += `│ 🌀 *ᴘʀᴇꜰɪx:* ${prefix}\n`
      text += `│ ⏳ *ᴜᴘᴛɪᴍᴇ:* ${uptime}\n`
      text += `│ 📅 *ᴅᴀᴛᴇ:* ${now}\n`
      text += `│ 📦 *ᴘʟᴜɢɪɴs:* ${total}\n`
      text += `╰────────────────┈⊷\n\n`

      // ── Catégories ────────────────────
      for (const [cat, cmds] of Object.entries(grouped)) {
        if (cat === "owner" && !isOwner) continue

        const { icon, title } = CATS[cat] || { icon: "㋛", title: cat.toUpperCase() }

        // Dédoublonner par nom principal
        const uniq = [...new Map(cmds.map(c => {
          const k = Array.isArray(c.cmd) ? c.cmd[0] : c.cmd
          return [k, c]
        })).values()]

        text += `*┏━━〔 ${icon} ${title.toUpperCase()} 〕*\n`
        for (const cmd of uniq) {
          const name = Array.isArray(cmd.cmd) ? cmd.cmd[0] : cmd.cmd
          text += `┃ ❍ ${fancy("." + name)}\n`
        }
        text += `┗━━━━━━━━━━━━┛\n\n`
      }

      // ── Footer ────────────────────────
      text += `> *TERRA - XMD* ✨\n`
      text += `> _${config.BOT_TAG}_`

      const ctx = buildCtx("TERRA - XMD", "by crazy")

      await sock.sendMessage(jid, {
        image:   { url: BOT_THUMB },
        caption: text,
        ...ctx
      }, { quoted: msg })
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //               PING
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    cmd: ["ping", "speed"],
    desc: "Tester la vitesse du bot",
    category: "general",
    exec: async ({ sock, jid, msg, react }) => {
      const start = Date.now()
      await react("⚡")
      const ms  = Date.now() - start
      const ctx = buildCtx("Ping", `${ms}ms`)
      await sock.sendMessage(jid, {
        text:
          `*╭───〔 ⚡ ᴘɪɴɢ 〕───┈⊷*\n` +
          `│ 🏓 *ʟᴀᴛᴇɴᴄʏ:* ${ms}ms\n` +
          `╰────────────────┈⊷\n` +
          `> _${config.BOT_TAG}_`,
        ...ctx
      }, { quoted: msg })
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //              UPTIME
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    cmd: ["uptime", "runtime"],
    desc: "Temps de fonctionnement du bot",
    category: "general",
    exec: async ({ sock, jid, msg, react }) => {
      await react("⏱️")
      const uptime = formatUptime(process.uptime() * 1000)
      const ram    = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)
      const ctx    = buildCtx("Uptime", uptime)
      await sock.sendMessage(jid, {
        text:
          `*╭───〔 ⏱️ ᴜᴘᴛɪᴍᴇ 〕───┈⊷*\n` +
          `│ 🕐 *ᴏɴʟɪɴᴇ:* ${uptime}\n` +
          `│ 🧠 *ʀᴀᴍ:* ${ram} MB\n` +
          `│ ⚙️ *ɴᴏᴅᴇ:* ${process.version}\n` +
          `╰────────────────┈⊷\n` +
          `> _${config.BOT_TAG}_`,
        ...ctx
      }, { quoted: msg })
    }
  }

]
