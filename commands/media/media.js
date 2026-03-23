// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//      TERRA - XMD | MEDIA COMMANDS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const axios = require("axios")
const fs = require("fs-extra")
const path = require("path")

// ── Helpers ───────────────────────────
async function cleanTemp(filePath) {
  try { await fs.remove(filePath) } catch {}
}

module.exports = [
  // ── YouTube Audio ─────────────────────
  {
    cmd: ["play", "ytmp3", "song"],
    desc: "Télécharger une musique YouTube",
    category: "media",
    exec: async ({ args, reply, react, sock, jid, msg }) => {
      if (!args.length) return reply("❌ Donne un titre ou un lien YouTube.\nEx: `.play Afro B Drogba`")
      await react("🎵")
      const query = args.join(" ")
      try {
        // API publique de recherche/téléchargement YouTube
        const search = await axios.get(`https://apis.davidcyriltech.my.id/youtube/search?query=${encodeURIComponent(query)}`)
        const results = search.data?.results
        if (!results?.length) return reply("❌ Aucun résultat trouvé pour : " + query)

        const top = results[0]
        await reply(`🎵 *${top.title}*\n⏱️ Durée : ${top.duration}\n⬇️ Téléchargement en cours...`)

        const dl = await axios.get(`https://apis.davidcyriltech.my.id/youtube/mp3?url=${encodeURIComponent(top.url)}`)
        const audioUrl = dl.data?.download_url

        if (!audioUrl) return reply("❌ Impossible de télécharger cette musique.")

        const audioRes = await axios.get(audioUrl, { responseType: "arraybuffer" })
        const buffer = Buffer.from(audioRes.data)

        await sock.sendMessage(jid, {
          audio: buffer,
          mimetype: "audio/mpeg",
          fileName: `${top.title}.mp3`,
          ptt: false
        }, { quoted: msg })

      } catch (err) {
        reply("❌ Erreur lors du téléchargement.\n_" + err.message + "_")
      }
    }
  },

  // ── YouTube Vidéo ─────────────────────
  {
    cmd: ["ytmp4", "video", "yt"],
    desc: "Télécharger une vidéo YouTube",
    category: "media",
    exec: async ({ args, reply, react, sock, jid, msg }) => {
      if (!args.length) return reply("❌ Donne un titre ou lien YouTube.\nEx: `.ytmp4 Burna Boy Ye`")
      await react("🎬")
      const query = args.join(" ")
      try {
        const search = await axios.get(`https://apis.davidcyriltech.my.id/youtube/search?query=${encodeURIComponent(query)}`)
        const results = search.data?.results
        if (!results?.length) return reply("❌ Aucun résultat pour : " + query)

        const top = results[0]
        if (parseInt(top.duration?.split(":")[0]) > 10) {
          return reply("❌ Vidéo trop longue (max 10 min).")
        }

        await reply(`🎬 *${top.title}*\n⏱️ ${top.duration}\n⬇️ Téléchargement en cours...`)

        const dl = await axios.get(`https://apis.davidcyriltech.my.id/youtube/mp4?url=${encodeURIComponent(top.url)}`)
        const videoUrl = dl.data?.download_url
        if (!videoUrl) return reply("❌ Impossible de télécharger cette vidéo.")

        const videoRes = await axios.get(videoUrl, { responseType: "arraybuffer" })
        const buffer = Buffer.from(videoRes.data)

        await sock.sendMessage(jid, {
          video: buffer,
          mimetype: "video/mp4",
          fileName: `${top.title}.mp4`,
          caption: `🎬 *${top.title}*\n_TERRA - XMD_`
        }, { quoted: msg })

      } catch (err) {
        reply("❌ Erreur : " + err.message)
      }
    }
  },

  // ── TikTok ───────────────────────────
  {
    cmd: ["tiktok", "tt"],
    desc: "Télécharger une vidéo TikTok sans watermark",
    category: "media",
    exec: async ({ args, reply, react, sock, jid, msg }) => {
      const url = args[0]
      if (!url || !url.includes("tiktok")) return reply("❌ Donne un lien TikTok valide.\nEx: `.tiktok https://vm.tiktok.com/xxx`")
      await react("🎵")
      await reply("⬇️ Téléchargement TikTok en cours...")
      try {
        const res = await axios.get(`https://apis.davidcyriltech.my.id/tiktok?url=${encodeURIComponent(url)}`)
        const data = res.data
        if (!data?.video) return reply("❌ Impossible de récupérer cette vidéo TikTok.")

        const videoRes = await axios.get(data.video, { responseType: "arraybuffer" })
        const buffer = Buffer.from(videoRes.data)

        await sock.sendMessage(jid, {
          video: buffer,
          mimetype: "video/mp4",
          caption: `🎵 *${data.title || "TikTok"}*\n👤 ${data.author || ""}\n\n_TERRA - XMD_`
        }, { quoted: msg })

      } catch (err) {
        reply("❌ Erreur TikTok : " + err.message)
      }
    }
  },

  // ── Sticker ───────────────────────────
  {
    cmd: ["sticker", "s", "stick"],
    desc: "Convertir une image en sticker",
    category: "media",
    exec: async ({ sock, jid, msg, reply, react }) => {
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
      const imgMsg = msg.message?.imageMessage || quoted?.imageMessage

      if (!imgMsg) return reply("❌ Envoie une image ou réponds à une image avec `.sticker`")
      await react("🎨")

      try {
        const { downloadMediaMessage } = require("gifted-baileys")
        const buffer = await downloadMediaMessage({ message: imgMsg ? { imageMessage: imgMsg } : msg, key: msg.key }, "buffer", {})
        await sock.sendMessage(jid, {
          sticker: buffer
        }, { quoted: msg })
      } catch (err) {
        reply("❌ Erreur lors de la création du sticker.")
      }
    }
  },

  // ── Instagram ─────────────────────────
  {
    cmd: ["ig", "instagram", "insta"],
    desc: "Télécharger une vidéo Instagram",
    category: "media",
    exec: async ({ args, reply, react, sock, jid, msg }) => {
      const url = args[0]
      if (!url || !url.includes("instagram")) return reply("❌ Donne un lien Instagram valide.")
      await react("📸")
      await reply("⬇️ Téléchargement Instagram en cours...")
      try {
        const res = await axios.get(`https://apis.davidcyriltech.my.id/instagram?url=${encodeURIComponent(url)}`)
        const data = res.data
        if (!data?.video) return reply("❌ Impossible de télécharger ce contenu.")

        const videoRes = await axios.get(data.video, { responseType: "arraybuffer" })
        await sock.sendMessage(jid, {
          video: Buffer.from(videoRes.data),
          mimetype: "video/mp4",
          caption: `📸 *Instagram*\n_TERRA - XMD_`
        }, { quoted: msg })
      } catch (err) {
        reply("❌ Erreur Instagram : " + err.message)
      }
    }
  }
]
