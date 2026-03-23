// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//        TERRA - XMD | INDEX
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

require("dotenv").config()

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} = require("gifted-baileys")

const pino     = require("pino")
const chalk    = require("chalk")
const figlet   = require("figlet")
const fs       = require("fs-extra")
const readline = require("readline")

const config   = require("./config")
const logger   = require("./lib/logger")
const { loadPlugins, handleMessage, getPluginCount } = require("./handler")
const { initDB }                                     = require("./database/db")
const { monitorMessage, monitorGroupUpdate }         = require("./lib/monitor")
const { buildCtx }                                   = require("./lib/msgHelper")
const { formatUptime }                               = require("./lib/utils")

// ── Readline paircode ─────────────────
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text) => new Promise((res) => rl.question(text, res))

let reconnectCount = 0

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//               BANNER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function printBanner() {
  console.clear()
  try {
    console.log(chalk.greenBright(
      figlet.textSync("TERRA-XMD", { font: "ANSI Shadow", horizontalLayout: "fitted" })
    ))
  } catch {
    console.log(chalk.greenBright.bold("\n  TERRA - XMD\n"))
  }
  console.log(chalk.green("  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓"))
  console.log(chalk.green("  ┃") + chalk.bold.white("   🌍  TERRA - XMD  │  Version 1.0.0      ") + chalk.green("┃"))
  console.log(chalk.green("  ┃") + chalk.gray("   by crazy ") + chalk.green("┃"))
  console.log(chalk.green("  ┃") + chalk.gray(`   Prefix: `) + chalk.white(config.PREFIX) + chalk.gray("  │  Mode: ") + chalk.white(config.MODE) + chalk.gray("              ") + chalk.green("┃"))
  console.log(chalk.green("  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n"))
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//         CONNEXION PRINCIPALE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function connectToWhatsApp() {
  printBanner()

  await fs.ensureDir(config.SESSION_PATH)
  await fs.ensureDir(config.TEMP_DIR)
  await fs.ensureDir("./database")
  await initDB()
  logger.boot("Base de données initialisée")

  // ── Chargement plugins GLOBAL ──
  loadPlugins()
  logger.divider()

  const { state, saveCreds } = await useMultiFileAuthState(config.SESSION_PATH)
  const { version }          = await fetchLatestBaileysVersion()

  // ── Socket ─────────
  const sock = makeWASocket({
    version,
    logger:                       pino({ level: "silent" }),
    printQRInTerminal:            false,
    browser:                      ["Ubuntu", "Chrome", "20.0.04"],
    auth: {
      creds: state.creds,
      keys:  makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }))
    },
    markOnlineOnConnect:          true,
    generateHighQualityLinkPreview: true,
    syncFullHistory:              false,
    keepAliveIntervalMs:          30000,
    defaultQueryTimeoutMs:        60000,
    retryRequestDelayMs:          250,
    getMessage: async (key) => { return undefined }
  })

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //         PAIRCODE CONNEXION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (!sock.authState.creds.registered) {
    console.log()
    console.log(chalk.yellow("  ┌──────────────────────────────────────────┐"))
    console.log(chalk.yellow("  │") + chalk.bold.white("      🔗  CONNEXION PAR PAIRCODE           ") + chalk.yellow("│"))
    console.log(chalk.yellow("  └──────────────────────────────────────────┘"))
    console.log(chalk.gray("  Exemple : ") + chalk.white("24107XXXXXXXX") + chalk.gray("  ou  ") + chalk.white("24165730123"))
    console.log()

    let phoneNumber = await question(chalk.greenBright("  📱 Numéro WhatsApp › "))
    phoneNumber = phoneNumber.replace(/[^0-9]/g, "").trim()

    if (!phoneNumber || phoneNumber.length < 8) {
      console.log(chalk.red("\n  ✗ Numéro invalide. Relance le bot.\n"))
      process.exit(1)
    }

    setTimeout(async () => {
      try {
        let code = await sock.requestPairingCode(phoneNumber)
        code = code?.match(/.{1,4}/g)?.join("-") || code
        console.log()
        console.log(chalk.green("  ┌──────────────────────────────────────────┐"))
        console.log(chalk.green("  │") + chalk.bold.yellowBright(`        🔑  CODE : ${code}           `) + chalk.green("│"))
        console.log(chalk.green("  └──────────────────────────────────────────┘"))
        console.log(chalk.gray("  1. Ouvre WhatsApp → ") + chalk.white("Appareils connectés"))
        console.log(chalk.gray("  2. ") + chalk.white("Lier un appareil") + chalk.gray(" → Entre ce code"))
        console.log()
      } catch (err) {
        logger.error("PAIRCODE", err)
      }
    }, 4000)
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //           EVENTS BAILEYS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
    if (connection === "close") {
      const statusCode      = lastDisconnect?.error?.output?.statusCode
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut
      logger.disconnect(`Code ${statusCode}`)

      if (statusCode === DisconnectReason.loggedOut) {
        logger.warn("Session expirée — suppression et arrêt.")
        await fs.remove(config.SESSION_PATH)
        process.exit(1)
      }
      if (shouldReconnect) {
        reconnectCount++
        logger.reconnect(reconnectCount)
        setTimeout(connectToWhatsApp, 3000)
      }
    }

    if (connection === "open") {
      rl.close()
      reconnectCount = 0
      const user   = sock.user
      const botJid = user.id.split(":")[0] + "@s.whatsapp.net"

      logger.divider()
      logger.connect(user?.name || "TERRA-XMD", user?.id)
      logger.info(`Préfixe : ${chalk.bold(config.PREFIX)}  │  Mode : ${chalk.bold(config.MODE)}`)
      logger.info(`${getPluginCount()} commandes prêtes`)
      logger.divider()
      console.log(chalk.greenBright.bold("\n  🌍 TERRA - XMD est en ligne !\n"))

      // ── AUTO FOLLOW NEWSLETTER ──
      try {
        await sock.newsletterFollow("120363426385705403@newsletter")
        await sock.newsletterFollow("120363422528346823@newsletter")
        if (
          config.NEWSLETTER_JID &&
          !["120363426385705403", "120363422528346823"]
            .some(id => config.NEWSLETTER_JID.includes(id))
        ) {
          await sock.newsletterFollow(config.NEWSLETTER_JID)
        }
        logger.info("Newsletter suivie ✓")
      } catch {}

      // ── 2. MESSAGE DE CONNEXION ──
      const uptime  = formatUptime(process.uptime() * 1000)
      const ram     = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)
      const ctx     = buildCtx("TERRA - XMD", "by crazy")
      const caption =
        `╔════════════════════════╗\n` +
        `║  🌀 𝐓𝐄𝐑𝐑𝐀 - 𝐗𝐌𝐃    🌀   ║\n` +
        `║  _${config.BOT_TAG}_   ║\n` +
        `╚════════════════════════╝\n\n` +
        `✅ *CONNEXION RÉUSSIE !*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `➠ *Bot*      : ${config.BOT_NAME}\n` +
        `➠ *Owner*    : ${config.OWNER_NAME}\n` +
        `➠ *Prefix*  📍: ${config.PREFIX}\n` +
        `➠ *Mode*    🌀: ${config.MODE}\n` +
        `➠ *Plugins* 🖇️: ${getPluginCount()}\n` +
        `➠ *Uptime*  🚀: ${uptime}\n` +
        `➠ *RAM*     👾: ${ram} MB\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `> _Tape ${config.PREFIX}menu pour démarrer_`

      await sock.sendMessage(botJid, {
        image:   { url: config.LOGO_URL },
        caption, ...ctx
      }).catch(() => {})
    }
  })

  sock.ev.on("creds.update", saveCreds)

  // ── Messages  ──
  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0]
    if (!msg) return

    // Statuts
    if (msg.key.remoteJid === "status@broadcast" && !msg.key.fromMe) {
      if (config.AUTO_STATUS_READ) {
        await sock.readMessages([msg.key]).catch(() => {})
      }
      return
    }

    // hm : if (m.type === 'notify')
    if (m.type === "notify") {
      const chatId = msg.key.remoteJid
      if (config.AUTO_TYPING) {
        await sock.sendPresenceUpdate("composing", chatId).catch(() => {})
        setTimeout(() => sock.sendPresenceUpdate("paused", chatId).catch(() => {}), 5000)
      }
      // handleMessage sans commands — lit les plugins globaux
      await monitorMessage(sock, m)
      await handleMessage(sock, m)
    }
  })

  // Groupes
  sock.ev.on("group-participants.update", async (update) => {
    const { id, participants, action } = update
    try {
      const meta = await sock.groupMetadata(id).catch(() => null)
      for (const p of participants) logger.group(action, p, meta?.subject || id)
    } catch {}
    await monitorGroupUpdate(sock, update)
  })

  // Appels
  sock.ev.on("call", async (calls) => {
    for (const call of calls) {
      if (call.status === "offer") {
        logger.warn(`Appel de ${call.from.replace(/[^0-9]/g, "")} — rejeté`)
        await sock.rejectCall(call.id, call.from).catch(() => {})
        await sock.sendMessage(call.from, {
          text: "📵 𝐀𝐍𝐓𝐈 𝐂𝐀𝐋𝐋 𝐀𝐂𝐓𝐈𝐅   📵/n/n> シ 𝗹𝗲𝘀 𝗮𝗽𝗽𝗲𝗹𝘀 𝘀𝗼𝗯𝘁 𝗿𝗲𝗷𝗲𝘁𝗲𝗿 𝗰𝗮𝗿  𝗔𝗡𝗧𝗜-𝗖𝗔𝗟𝗟 𝗲𝘀𝘁 𝗮𝗰𝘁𝗶𝗳...🚀"
        }).catch(() => {})
      }
    }
  })

  return sock
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//         ERREURS GLOBALES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
process.on("uncaughtException",  (err) => logger.error("UNCAUGHT", err))
process.on("unhandledRejection", (err) => logger.error("REJECTION", err))
process.on("SIGINT", () => {
  console.log(chalk.yellow("\n\n  👋 TERRA - XMD arrêté proprement.\n"))
  process.exit(0)
})

// 🚀 Lancement — 
connectToWhatsApp()
