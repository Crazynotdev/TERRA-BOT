// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//        TERRA - XMD | UTILS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const { downloadMediaMessage } = require("gifted-baileys")
const fs   = require("fs-extra")
const path = require("path")

// ── Type de média ─────────────────────
function getMediaType(m) {
  if (!m) return "unknown"
  if (m.conversation || m.extendedTextMessage) return "text"
  if (m.imageMessage)    return "image"
  if (m.videoMessage)    return "video"
  if (m.audioMessage)    return "audio"
  if (m.stickerMessage)  return "sticker"
  if (m.documentMessage) return "document"
  if (m.contactMessage)  return "contact"
  if (m.locationMessage) return "location"
  if (m.reactionMessage) return "reaction"
  if (m.pollCreationMessage) return "poll"
  return "unknown"
}

// ── Extrait le média d'un message (𝖻𝗒 𝖼𝗋𝖺𝗓𝗒) ──
function extractMedia(message) {
  if (!message) return null
  const msg    = message.message || message
  const quoted = msg?.extendedTextMessage?.contextInfo?.quotedMessage
  const target = quoted || msg
  if (!target) return null

  const mediaKeys = ["imageMessage", "videoMessage", "stickerMessage", "audioMessage", "documentMessage"]
  for (const key of Object.keys(target)) {
    if (mediaKeys.includes(key)) {
      return { type: key, message: target[key], mime: target[key]?.mimetype || "" }
    }
    if (key === "viewOnceMessageV2" || key === "viewOnceMessage") {
      const voMsg = target[key]?.message
      if (voMsg) {
        for (const voKey of Object.keys(voMsg)) {
          if (mediaKeys.includes(voKey)) {
            return { type: voKey, message: voMsg[voKey], mime: voMsg[voKey]?.mimetype || "" }
          }
        }
      }
    }
  }
  return null
}

// ── Télécharge un buffer média ────────
async function downloadMedia(msg, type = "buffer") {
  const buffer = await downloadMediaMessage(msg, "buffer", {})
  if (type === "buffer") return buffer
  const ext      = getMediaExt(msg)
  const filePath = path.join("./temp", `terra_${Date.now()}.${ext}`)
  await fs.ensureDir("./temp")
  await fs.writeFile(filePath, buffer)
  return filePath
}

// ── Extension fichier ─────────────────
function getMediaExt(msg) {
  const m = msg.message
  if (m?.imageMessage)    return "jpg"
  if (m?.videoMessage)    return "mp4"
  if (m?.audioMessage)    return "mp3"
  if (m?.stickerMessage)  return "webp"
  if (m?.documentMessage) return m.documentMessage.fileName?.split(".").pop() || "bin"
  return "bin"
}

// ── Formate uptime ────────────────────
function formatUptime(ms) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  return `${d}j ${h % 24}h ${m % 60}m ${s % 60}s`
}

module.exports = { getMediaType, extractMedia, downloadMedia, getMediaExt, formatUptime }
