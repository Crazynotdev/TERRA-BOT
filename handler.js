// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//        TERRA - XMD | HANDLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const path   = require("path")
const fs     = require("fs")
const chalk  = require("chalk")
const config = require("./config")
const logger = require("./lib/logger")
const { getUser, updateUser } = require("./database/db")
const { normalizeJid, isAdmin } = require("./lib/authHelper")
const { getMediaType } = require("./lib/utils")

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//   PLUGINS GLOBAUX
//   Chargés une fois, lus à chaque msg
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const plugins = {}

function loadPlugins() {
  const pluginDir = path.join(__dirname, "commands")
  if (!fs.existsSync(pluginDir)) return

  const categories = fs.readdirSync(pluginDir)
  let total = 0

  for (const cat of categories) {
    const catPath = path.join(pluginDir, cat)
    if (!fs.lstatSync(catPath).isDirectory()) continue

    const files = fs.readdirSync(catPath).filter(f => f.endsWith(".js"))
    for (const file of files) {
      try {
        const filePath = path.join(catPath, file)
        delete require.cache[require.resolve(filePath)]
        const mod = require(filePath)
        const cmds = Array.isArray(mod) ? mod : [mod]

        for (const cmd of cmds) {
          if (!cmd || !cmd.cmd || !cmd.exec) continue
          const names = Array.isArray(cmd.cmd) ? cmd.cmd : [cmd.cmd]
          for (const name of names) {
            plugins[name.toLowerCase()] = { ...cmd, category: cat }
          }
          total++
        }
      } catch (err) {
        console.log(chalk.red(`  [LOADER] Erreur ${file}: ${err.message}`))
      }
    }
  }

  console.log(chalk.cyan(`  ✔ ${total} commandes chargées`))
  return plugins
}

// Exposer pour le menu
function getPlugins() { return plugins }
function getPluginCount() { return Object.keys(plugins).length }

// Grouper par catégorie pour le menu
function groupByCategory() {
  const grouped = {}
  const seen    = new Set()

  for (const [name, cmd] of Object.entries(plugins)) {
    const cat  = cmd.category || "misc"
    const main = Array.isArray(cmd.cmd) ? cmd.cmd[0] : cmd.cmd
    if (seen.has(main)) continue
    seen.add(main)
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(cmd)
  }
  return grouped
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//         MESSAGE HANDLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function handleMessage(sock, m) {
  try {
    const message = m.messages[0]
    if (!message || !message.message) return

    const chatId  = message.key.remoteJid
    const fromMe  = message.key.fromMe
    const isGroup = chatId.endsWith("@g.us")

    // ── Sender — exactement ────
    let sender
    if (fromMe) {
      sender = sock.user.id.split(":")[0] + "@s.whatsapp.net"
    } else {
      sender = isGroup
        ? (message.key.participant || message.participant)
        : chatId
    }

    const pushName  = message.pushName || ""
    const senderNum = normalizeJid(sender)

    // ── Body ─────────────────────────────
    const body =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      message.message?.imageMessage?.caption ||
      message.message?.videoMessage?.caption || ""

    // ── fromMe : texte seulement──
    if (fromMe && !message.message?.conversation && !message.message?.extendedTextMessage) return

    // ── Auto read ─────────────────────────
    if (config.AUTO_READ) {
      await sock.readMessages([message.key]).catch(() => {})
    }

    // ── Log ───────────────────────────────
    const mediaType = getMediaType(message.message)
    if (mediaType !== "text" && mediaType !== "unknown") {
      logger.media(sender, mediaType, chatId, pushName)
    } else if (body && !body.startsWith(config.PREFIX)) {
      logger.msg(sender, chatId, body, "text", pushName)
    }

    // ── Prefix check ──────────────────────
    if (!body.startsWith(config.PREFIX)) return

    const args        = body.slice(config.PREFIX.length).trim().split(/ +/)
    const commandName = args.shift()?.toLowerCase()
    if (!commandName) return

    // ── Trouver dans les plugins globaux ──
    const cmd = plugins[commandName]
    if (!cmd) return

    logger.cmd(sender, commandName, args, chatId, pushName)

    // ── isOwner ─────────────────
    const isOwner = fromMe || config.OWNER_NUMBER.includes(senderNum)

    // ── Ban ───────────────────────────────
    const user = await getUser(senderNum)
    if (user?.banned) {
      logger.ban(sender, "tentative (banni)")
      return sock.sendMessage(chatId, { text: "🚫 Tu es banni d'utiliser *TERRA - XMD*." }, { quoted: message })
    }

    // ── Mode privé — silent fail ──────────
    if (config.MODE === "private" && !isOwner) return

    // ── Owner only — silent fail ──────────
    if (cmd.owner && !isOwner) return

    // ── Group only ────────────────────────
    if (cmd.groupOnly && !isGroup) {
      return sock.sendMessage(chatId, { text: "👥 Cette commande ne fonctionne qu'en groupe." }, { quoted: message })
    }

    // ── DM only ───────────────────────────
    if (cmd.dmOnly && isGroup) {
      return sock.sendMessage(chatId, { text: "💬 Cette commande ne fonctionne qu'en DM." }, { quoted: message })
    }

    // ── Admin check ───────────────────────
    let isUserAdmin = false
    let isBotAdmin  = false
    if (isGroup) {
      isUserAdmin = await isAdmin(sock, chatId, sender)
      isBotAdmin  = await isAdmin(sock, chatId, sock.user.id)
    }

    if (cmd.adminOnly && !isUserAdmin && !isOwner) {
      return sock.sendMessage(chatId, { text: "👮 Cette commande est réservée aux admins." }, { quoted: message })
    }

    // ── Contexte ──────────────────────────
    const ctx = {
      sock,
      msg: message,
      jid: chatId,
      sender,
      senderNum,
      pushName,
      args,
      body,
      isOwner,
      isUserAdmin,
      isBotAdmin,
      isGroup,
      prefix:  config.PREFIX,
      reply:   (text)  => sock.sendMessage(chatId, { text }, { quoted: message }),
      react:   (emoji) => sock.sendMessage(chatId, { react: { text: emoji, key: message.key } })
    }

    // ── React ⏳ ──────────────────────────
    if (config.AUTO_REACT) await ctx.react("⏳").catch(() => {})

    // ── Exécution ─────────────────────────
    await cmd.exec(ctx)

    // ── React ✅ ──────────────────────────
    if (config.AUTO_REACT) await ctx.react("✅").catch(() => {})

    // ── Stats ─────────────────────────────
    await updateUser(senderNum, { lastSeen: Date.now(), cmdUsed: (user?.cmdUsed || 0) + 1 })

  } catch (err) {
    logger.error("HANDLER", err)
    try {
      await sock.sendMessage(m.messages[0]?.key?.remoteJid, {
        text: `❌ Erreur : _${err.message}_`
      }, { quoted: m.messages[0] })
    } catch (_) {}
  }
}

module.exports = { loadPlugins, handleMessage, getPlugins, getPluginCount, groupByCategory }
