// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//      TERRA - XMD | AUTH HELPER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const NodeCache = require("node-cache")
const chalk     = require("chalk")
const config    = require("../config")

// Cache métadonnées groupes (10 min)
const groupCache = new NodeCache({
  stdTTL: 600,
  checkperiod: 180,
  useClones: false
})

// ── Normalise un JID ─────────────────
// Ex: 22507XXXXXXXX:2@s.whatsapp.net → 22507XXXXXXXX
function normalizeJid(jid) {
  if (!jid) return ""
  return jid.split(":")[0].split("@")[0]
}

// ── Métadonnées groupe avec cache ─────
async function getGroupMetadataSafe(sock, chatId) {
  const cached = groupCache.get(chatId)
  if (cached) return cached

  try {
    const meta = await sock.groupMetadata(chatId)
    if (meta) groupCache.set(chatId, meta)
    return meta
  } catch (err) {
    const code = err?.output?.statusCode || 0
    if (code === 428 || code === 429) {
      console.warn(chalk.yellow(`⚠️ Metadata ignoré pour ${chatId} (Rate Limit)`))
    }
    return null
  }
}

// ── Vérifie si admin ──────────────────
async function isAdmin(sock, chatId, userJid) {
  if (!chatId.endsWith("@g.us")) return false
  try {
    const meta = await getGroupMetadataSafe(sock, chatId)
    if (!meta?.participants) return false
    const p = meta.participants.find(
      (p) => normalizeJid(p.id) === normalizeJid(userJid)
    )
    return !!(p && (p.admin === "admin" || p.admin === "superadmin"))
  } catch {
    return false
  }
}

// ── Vérifie si owner ─────
function isOwner(sock, msg) {
  try {
    if (msg.key.fromMe) return true
    const senderId = msg.key.participant || msg.key.remoteJid
    if (!senderId) return false
    const num = normalizeJid(senderId)
    return config.OWNER_NUMBER.some((o) => normalizeJid(o) === num)
  } catch {
    return false
  }
}

module.exports = { normalizeJid, getGroupMetadataSafe, isAdmin, isOwner }
