// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//       TERRA - XMD | MONITOR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const { getGroup, updateGroup } = require("../database/db")
const { isAdmin, normalizeJid } = require("./authHelper")
const config = require("../config")

const LINK_REGEX = /(https?:\/\/)?(chat\.whatsapp\.com\/[0-9A-Za-z]{20,24}|wa\.me\/\d+)/i
const REACT_EMOJIS = ["👍", "❤️", "😂", "😮", "🙏", "🔥", "✨", "💯", "👀", "🤔"]

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//       SURVEILLANCE DES MESSAGES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function monitorMessage(sock, m) {
  try {
    const message = m.messages[0]
    if (!message || message.key.fromMe) return

    const chatId = message.key.remoteJid
    if (!chatId.endsWith("@g.us")) return

    const sender = message.key.participant || message.participant
    if (!sender) return

    const body =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      message.message?.imageMessage?.caption || ""

    const grp         = await getGroup(chatId)
    const userIsAdmin = await isAdmin(sock, chatId, sender)

    // ── AutoReact ─────────────────────────
    if (grp.autoreact) {
      const emoji = REACT_EMOJIS[Math.floor(Math.random() * REACT_EMOJIS.length)]
      await sock.sendMessage(chatId, { react: { text: emoji, key: message.key } }).catch(() => {})
    }

    // Les admins sont exemptés des protections
    if (userIsAdmin) return

    // ── Antilink ──────────────────────────
    if (grp.antilink && LINK_REGEX.test(body)) {
      await sock.sendMessage(chatId, { delete: message.key }).catch(() => {})
      if (grp.antilinkAction === "kick") {
        await sock.groupParticipantsUpdate(chatId, [sender], "remove").catch(() => {})
        await sock.sendMessage(chatId, {
          text: `🚫 @${sender.split("@")[0]} a été expulsé pour avoir envoyé un lien.`,
          mentions: [sender]
        }).catch(() => {})
      } else {
        await sock.sendMessage(chatId, { text: "🔗 Les liens sont interdits dans ce groupe." }).catch(() => {})
      }
      return
    }

    // ── Anti BadWord ──────────────────────
    if (grp.antibadword && grp.badwords?.length > 0) {
      const isBad = grp.badwords.some((w) => body.toLowerCase().includes(w.toLowerCase()))
      if (isBad) {
        await sock.sendMessage(chatId, { delete: message.key }).catch(() => {})
        await sock.sendMessage(chatId, { text: "🤐 Langage interdit dans ce groupe." }).catch(() => {})
        return
      }
    }

    // ── Anti Tag Massif ───────────────────
    const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
    if (grp.antitag && mentions.length > 5) {
      await sock.sendMessage(chatId, { delete: message.key }).catch(() => {})
      await sock.groupParticipantsUpdate(chatId, [sender], "remove").catch(() => {})
      await sock.sendMessage(chatId, { text: "🚫 Tag massif interdit." }).catch(() => {})
      return
    }

    // ── Anti Média ────────────────────────
    if (grp.antimedia && message.message) {
      const msgType  = Object.keys(message.message)[0]
      const mediaTps = ["imageMessage", "videoMessage", "stickerMessage", "audioMessage", "documentMessage"]
      if (mediaTps.includes(msgType)) {
        await sock.sendMessage(chatId, { delete: message.key }).catch(() => {})
        return
      }
    }

    // ── Anti Transfert ────────────────────
    const ctx =
      message.message?.extendedTextMessage?.contextInfo ||
      message.message?.imageMessage?.contextInfo ||
      message.message?.videoMessage?.contextInfo
    if (grp.antitransfert && ctx?.isForwarded) {
      await sock.sendMessage(chatId, { delete: message.key }).catch(() => {})
      await sock.sendMessage(chatId, { text: "🔄 Les transferts sont interdits dans ce groupe." }).catch(() => {})
      return
    }

    // ── Anti Spam (message trop long) ─────
    if (grp.antispam && body.length > 3000) {
      await sock.sendMessage(chatId, { delete: message.key }).catch(() => {})
      await sock.groupParticipantsUpdate(chatId, [sender], "remove").catch(() => {})
      return
    }

  } catch (err) {
    console.error("[MONITOR] Message:", err.message)
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//     SURVEILLANCE DES ÉVÉNEMENTS GROUPE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function monitorGroupUpdate(sock, update) {
  try {
    const { id, participants, action } = update
    const grp = await getGroup(id)

    // ── Anti Promote ──────────────────────
    if (grp.antipromote && action === "promote") {
      const author = update.author || update.actor
      if (!author) return
      const botId = normalizeJid(sock.user.id)
      if (normalizeJid(author) === botId) return
      if (config.OWNER_NUMBER.some((n) => author.includes(n))) return
      for (const p of participants) {
        await sock.groupParticipantsUpdate(id, [p], "demote").catch(() => {})
      }
      await sock.groupParticipantsUpdate(id, [author], "demote").catch(() => {})
      await sock.sendMessage(id, { text: "⚠️ La promotion non autorisée a été annulée." }).catch(() => {})
    }

    // ── Anti Demote ───────────────────────
    if (grp.antidemote && action === "demote") {
      const author = update.author || update.actor
      if (!author) return
      const botId = normalizeJid(sock.user.id)
      if (normalizeJid(author) === botId) return
      if (config.OWNER_NUMBER.some((n) => author.includes(n))) return
      for (const p of participants) {
        await sock.groupParticipantsUpdate(id, [p], "promote").catch(() => {})
      }
      await sock.groupParticipantsUpdate(id, [author], "demote").catch(() => {})
      await sock.sendMessage(id, { text: "⚠️ La rétrogradation non autorisée a été annulée." }).catch(() => {})
    }

    // ── Welcome ───────────────────────────
    if (grp.welcome && action === "add") {
      for (const participant of participants) {
        const ppUrl = await sock.profilePictureUrl(participant, "image")
          .catch(() => "https://i.postimg.cc/8cKZBMZw/lv-0-20251105211949.jpg")
        const meta = await sock.groupMetadata(id).catch(() => null)

        let text = grp.welcomeMsg || "👋 Bienvenue @user dans *@group* !\n\n_Bonne ambiance 🌍_"
        text = text.replace("@user",  `@${participant.split("@")[0]}`)
        text = text.replace("@group", meta?.subject || "le groupe")
        text = text.replace("@desc",  meta?.desc    || "")

        await sock.sendMessage(id, {
          image:    { url: ppUrl },
          caption:  text,
          mentions: [participant]
        }).catch(() => {})
      }
    }

    // ── Goodbye ───────────────────────────
    if (grp.goodbye && action === "remove") {
      for (const participant of participants) {
        const meta = await sock.groupMetadata(id).catch(() => null)
        await sock.sendMessage(id, {
          text: `👋 *@${participant.split("@")[0]}* a quitté *${meta?.subject || "le groupe"}*.\n_À bientôt 🌍_`,
          mentions: [participant]
        }).catch(() => {})
      }
    }

  } catch (err) {
    console.error("[MONITOR] Group:", err.message)
  }
}

module.exports = { monitorMessage, monitorGroupUpdate }
