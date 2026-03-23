// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//     TERRA - XMD | PROFIL COMMANDS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const { buildCtx, sendMsg, sendImage, BOT_THUMB } = require("../../lib/msgHelper")
const { normalizeJid } = require("../../lib/authHelper")
const { formatUptime }  = require("../../lib/utils")
const { getUser, getStats } = require("../../database/db")

// ── Résoudre la cible (mention ou reply) ──
function resolveTarget(msg, sender, sock) {
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid
  const quoted    = msg.message?.extendedTextMessage?.contextInfo?.participant
  if (mentioned?.length) return mentioned[0]
  if (quoted)            return quoted
  return sender
}

module.exports = [

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //         PHOTO DE PROFIL
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    cmd: ["pp", "profil", "avatar"],
    desc: "Voir la photo de profil",
    category: "profil",
    exec: async ({ sock, jid, msg, sender, react }) => {
      await react("🖼️")
      const target = resolveTarget(msg, sender, sock)

      try {
        const ppUrl = await sock.profilePictureUrl(target, "image")
        const num   = normalizeJid(target)

        await sock.sendMessage(jid, {
          image:       { url: ppUrl },
          caption:
            `🖼️ *Photo de profil*\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `👤 Numéro : *+${num}*\n\n` +
            `_🌍 TERRA - XMD_`,
          contextInfo: buildCtx("Photo de profil", `+${num}`)
        }, { quoted: msg })
      } catch {
        await sendMsg(sock, jid,
          `🚫 *Aucune photo de profil*\n\nCet utilisateur n'a pas de photo visible.`,
          msg, "Photo de profil", "Privée"
        )
      }
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //            USER INFO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    cmd: ["info", "userinfo", "profil"],
    desc: "Infos sur un utilisateur",
    category: "profil",
    exec: async ({ sock, jid, msg, sender, isOwner, react }) => {
      await react("👤")
      const target  = resolveTarget(msg, sender, sock)
      const num     = normalizeJid(target)
      const isSelf  = normalizeJid(target) === normalizeJid(sender)

      let ppUrl
      try {
        ppUrl = await sock.profilePictureUrl(target, "image")
      } catch {
        ppUrl = null
      }

      let bio = "Pas de bio disponible."
      try {
        const status = await sock.fetchStatus(target)
        bio = status?.status || bio
      } catch {}

      const dbUser   = await getUser(num)
      const joinDate = new Date(dbUser.joinedAt || Date.now()).toLocaleDateString("fr-FR")
      const lastSeen = new Date(dbUser.lastSeen  || Date.now()).toLocaleString("fr-FR")

      const text =
        `👤 *Informations Utilisateur*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📱 Numéro : *+${num}*\n` +
        `📝 Bio : _${bio}_\n` +
        `🚫 Banni : *${dbUser.banned ? "Oui" : "Non"}*\n` +
        `📩 Cmds utilisées : *${dbUser.cmdUsed || 0}*\n` +
        `📅 Vu pour la 1ère fois : *${joinDate}*\n` +
        `🕐 Dernière activité : *${lastSeen}*\n\n` +
        `_🌍 TERRA - XMD_`

      if (ppUrl) {
        await sock.sendMessage(jid, {
          image:       { url: ppUrl },
          caption:     text,
          contextInfo: buildCtx("User Info", `+${num}`)
        }, { quoted: msg })
      } else {
        await sendMsg(sock, jid, text, msg, "User Info", `+${num}`)
      }
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //              VCARD
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    cmd: ["vcard", "contact"],
    desc: "Envoyer un contact WhatsApp",
    category: "profil",
    exec: async ({ sock, jid, msg, sender, args, react }) => {
      await react("📇")
      const target = resolveTarget(msg, sender, sock)
      const num    = normalizeJid(target)

      let displayName = args.join(" ") || `+${num}`
      try {
        const status = await sock.fetchStatus(target)
        if (!args.length && status?.name) displayName = status.name
      } catch {}

      await sock.sendMessage(jid, {
        contacts: {
          displayName,
          contacts: [{
            vcard:
              `BEGIN:VCARD\n` +
              `VERSION:3.0\n` +
              `FN:${displayName}\n` +
              `ORG:TERRA - XMD;\n` +
              `TEL;type=CELL;type=VOICE;waid=${num}:+${num}\n` +
              `END:VCARD`
          }]
        },
        contextInfo: buildCtx("Contact", displayName)
      }, { quoted: msg })
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //              BIO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    cmd: ["bio", "status"],
    desc: "Voir la bio/status d'un utilisateur",
    category: "profil",
    exec: async ({ sock, jid, msg, sender, react }) => {
      await react("📝")
      const target = resolveTarget(msg, sender, sock)
      const num    = normalizeJid(target)

      try {
        const status = await sock.fetchStatus(target)
        const bio    = status?.status || "Aucune bio disponible."
        const setAt  = status?.setAt
          ? new Date(status.setAt * 1000).toLocaleDateString("fr-FR")
          : ""

        await sendMsg(sock, jid,
          `📝 *Bio / Status*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `👤 +${num}\n` +
          `💬 _"${bio}"_\n` +
          (setAt ? `📅 Défini le : *${setAt}*\n` : "") +
          `\n_🌍 TERRA - XMD_`,
          msg, "Bio", `+${num}`
        )
      } catch {
        await sendMsg(sock, jid,
          `🚫 *Bio non disponible*\n\nCet utilisateur a sa bio en privé.`,
          msg, "Bio", `+${num}`
        )
      }
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //           BOTINFO / STATS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    cmd: ["botinfo", "about"],
    desc: "Infos et stats du bot",
    category: "profil",
    exec: async ({ sock, jid, msg, react }) => {
      await react("🤖")
      const uptime = formatUptime(process.uptime() * 1000)
      const ram    = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)
      const stats  = getStats()

      await sock.sendMessage(jid, {
        image: { url: "https://files.catbox.moe/zrnprr.jpg" },
        caption:
          `🌍 *TERRA - XMD*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `📌 Version : *1.0.0*\n` +
          `⚙️ Runtime : *Node.js ${process.version}*\n` +
          `⏱️ Uptime : *${uptime}*\n` +
          `🧠 RAM : *${ram} MB*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `👥 Utilisateurs : *${stats.totalUsers}*\n` +
          `🏘️ Groupes : *${stats.totalGroups}*\n` +
          `📩 Commandes exécutées : *${stats.totalCmds}*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `_Powered by Crazy_`,
        contextInfo: buildCtx("TERRA - XMD", "Bot WhatsApp v1.0.0")
      }, { quoted: msg })
    }
  }

]
