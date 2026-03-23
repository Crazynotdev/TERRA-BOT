// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//      TERRA - XMD | OWNER COMMANDS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const { banUser, unbanUser, getStats } = require("../../database/db")
const { formatUptime } = require("../../lib/utils")
const config = require("../../config")

module.exports = [
  // ── Ban ──────────────────────────────
  {
    cmd: ["ban"],
    desc: "Bannir un utilisateur",
    category: "owner",
    owner: true,
    exec: async ({ reply, msg, react }) => {
      const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid
      if (!mentioned?.length) return reply("❌ Mentionne un utilisateur à bannir.")
      await banUser(mentioned[0])
      await react("🚫")
      reply(`🚫 *${mentioned[0].replace(/[^0-9]/g, "")}* a été banni de TERRA-XMD.`)
    }
  },

  // ── Unban ─────────────────────────────
  {
    cmd: ["unban"],
    desc: "Débannir un utilisateur",
    category: "owner",
    owner: true,
    exec: async ({ reply, msg, react }) => {
      const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid
      if (!mentioned?.length) return reply("❌ Mentionne un utilisateur à débannir.")
      await unbanUser(mentioned[0])
      await react("✅")
      reply(`✅ *${mentioned[0].replace(/[^0-9]/g, "")}* a été débanni.`)
    }
  },

  // ── Broadcast ─────────────────────────
  {
    cmd: ["bc", "broadcast"],
    desc: "Envoyer un message à tous les groupes",
    category: "owner",
    owner: true,
    exec: async ({ sock, args, reply, react }) => {
      const text = args.join(" ")
      if (!text) return reply("❌ Donne un message à broadcaster.")
      const groups = await sock.groupFetchAllParticipating()
      let count = 0
      for (const [jid] of Object.entries(groups)) {
        try {
          await sock.sendMessage(jid, { text: `📢 *TERRA - XMD*\n\n${text}` })
          count++
          await new Promise(r => setTimeout(r, 1000))
        } catch {}
      }
      await react("📢")
      reply(`✅ Message envoyé à *${count}* groupes.`)
    }
  },

  // ── Stats ─────────────────────────────
  {
    cmd: ["stats"],
    desc: "Statistiques du bot",
    category: "owner",
    owner: true,
    exec: async ({ reply }) => {
      const s = getStats()
      const uptime = formatUptime(process.uptime() * 1000)
      reply(
        `📊 *TERRA - XMD | Statistiques*\n\n` +
        `👥 Utilisateurs : *${s.totalUsers}*\n` +
        `🏘️ Groupes : *${s.totalGroups}*\n` +
        `📩 Commandes exécutées : *${s.totalCmds}*\n` +
        `⏱️ Uptime : *${uptime}*\n` +
        `🧠 RAM : *${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)} MB*`
      )
    }
  },

  // ── Mode ──────────────────────────────
  {
    cmd: ["mode"],
    desc: "Changer le mode du bot (public/private)",
    category: "owner",
    owner: true,
    exec: async ({ args, reply, react }) => {
      const mode = args[0]?.toLowerCase()
      if (!["public", "private"].includes(mode)) return reply("❌ Utilise : .mode public ou .mode private")
      config.MODE = mode
      await react("⚙️")
      reply(`⚙️ Mode bot changé en *${mode}*.`)
    }
  },

  // ── Prefix ────────────────────────────
  {
    cmd: ["setprefix"],
    desc: "Changer le prefix des commandes",
    category: "owner",
    owner: true,
    exec: async ({ args, reply, react }) => {
      const p = args[0]
      if (!p) return reply("❌ Donne un nouveau préfixe. Ex: .setprefix !")
      config.PREFIX = p
      await react("✅")
      reply(`✅ Préfixe changé en *${p}*`)
    }
  }
]
