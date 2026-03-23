// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//      TERRA - XMD | MSG HELPER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const config = require("../config")

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//   1. NEWSLETTER CONTEXT (forwarded)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function getNewsletterContext() {
  return {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid:     config.NEWSLETTER_JID,
      newsletterName:    config.NEWSLETTER_NAME,
      serverMessageId:   -1
    }
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//   2. AD REPLY CONTEXT (thumbnail)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function getAdReplyContext(title, body) {
  return {
    externalAdReply: {
      title:                 title || config.BOT_NAME,
      body:                  body  || "Join my crazy channel",
      thumbnailUrl:          config.LOGO_URL,
      sourceUrl:             config.CHANNEL_URL,
      mediaType:             1,
      mediaUrl:              config.CHANNEL_URL,
      renderLargerThumbnail: true,
      showAdAttribution:     true
    }
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//   3. BUILD OPTIONS (combine les deux)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// newsletterShow → ajoute le forward newsletter
// adReply        → ajoute le thumbnail
function buildCtx(title, body, { newsletterShow = true, adReply = true } = {}) {
  let contextInfo = {}
  if (newsletterShow) Object.assign(contextInfo, getNewsletterContext())
  if (adReply)        Object.assign(contextInfo, getAdReplyContext(title, body))
  return Object.keys(contextInfo).length > 0 ? { contextInfo } : {}
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//   4. HELPERS D'ENVOI
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Texte + thumbnail + newsletter
async function sendMsg(sock, jid, text, quotedMsg, title, body) {
  const ctx = buildCtx(title, body)
  return sock.sendMessage(jid, { text, ...ctx }, { quoted: quotedMsg })
}

// Image + caption + thumbnail + newsletter
async function sendImage(sock, jid, imageUrl, caption, quotedMsg, title, body) {
  const ctx = buildCtx(title, body)
  return sock.sendMessage(jid, { image: { url: imageUrl }, caption, ...ctx }, { quoted: quotedMsg })
}

module.exports = {
  getNewsletterContext,
  getAdReplyContext,
  buildCtx,
  sendMsg,
  sendImage,
  BOT_THUMB: config.LOGO_URL
}
