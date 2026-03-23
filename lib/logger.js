// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//        TERRA - XMD | LOGGER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const chalk = require("chalk")
const moment = require("moment")

// ── Helpers ───────────────────────────
const time = () => chalk.gray(`[${moment().format("HH:mm:ss")}]`)

const tag = {
  msg:     chalk.bgCyan.black(" MSG "),
  cmd:     chalk.bgGreen.black(" CMD "),
  media:   chalk.bgMagenta.black(" MEDIA "),
  group:   chalk.bgBlue.black(" GROUP "),
  connect: chalk.bgGreenBright.black(" ONLINE "),
  disconnect: chalk.bgRed.white(" OFFLINE "),
  error:   chalk.bgRed.white(" ERROR "),
  warn:    chalk.bgYellow.black(" WARN "),
  info:    chalk.bgWhite.black(" INFO "),
  owner:   chalk.bgYellow.black(" OWNER "),
  ai:      chalk.bgMagenta.white(" AI "),
  boot:    chalk.bgGreenBright.black(" BOOT "),
  spam:    chalk.bgYellow.black(" SPAM "),
  ban:     chalk.bgRed.white(" BAN "),
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//            LOGGER OBJECT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const logger = {

  // ── Message reçu ─────────────────────
  // sender   = JID complet  ex: 22507xxxxxxxx@s.whatsapp.net
  // jid      = chat JID     ex: 120363xxx@g.us  ou  22507xxx@s.whatsapp.net
  // name     = pseudo WhatsApp (pushName)
  // text     = contenu du message
  // type     = text | image | video | audio | sticker | document ...
  msg(sender, jid, text, type = "text", name = "") {
    const numero  = chalk.cyan(sender.replace(/[^0-9]/g, ""))
    const pseudo  = name ? chalk.bold.white(`~${name}`) : chalk.gray("inconnu")
    const lid     = chalk.gray(sender)                         // JID complet
    const chat    = isGroupJid(jid)
                    ? chalk.blue(`[groupe ${chalk.gray(jid)}]`)
                    : chalk.gray("[DM]")
    const content = chalk.white(truncate(text, 80))
    const mtype   = type !== "text" ? chalk.magenta(` [${type}]`) : ""

    console.log(
      `${time()} ${tag.msg} ` +
      `${pseudo} ${chalk.gray("(")}${numero}${chalk.gray(")")} ` +
      `${chalk.gray("•")} ${lid} ` +
      `${chalk.gray("→")} ${chat}${mtype}\n` +
      `${chalk.gray("             ›")} ${content}`
    )
  },

  // ── Commande exécutée ─────────────────
  cmd(sender, cmdName, args, jid, name = "") {
    const numero = chalk.greenBright(sender.replace(/[^0-9]/g, ""))
    const pseudo = name ? chalk.bold.white(`~${name}`) : chalk.gray("inconnu")
    const lid    = chalk.gray(sender)
    const chat   = isGroupJid(jid)
                   ? chalk.blue(`[groupe ${chalk.gray(jid)}]`)
                   : chalk.gray("[DM]")
    const cmd    = chalk.bold.green(cmdName)
    const a      = args.length ? chalk.gray(args.join(" ").slice(0, 40)) : ""
    console.log(
      `${time()} ${tag.cmd} ` +
      `${pseudo} ${chalk.gray("(")}${numero}${chalk.gray(")")} ` +
      `${chalk.gray("•")} ${lid} ` +
      `${chalk.gray("→")} ${chat} ${chalk.gray("›")} ${cmd} ${a}`
    )
  },

  // ── Message média ─────────────────────
  media(sender, mediaType, jid, name = "") {
    const numero = chalk.magenta(sender.replace(/[^0-9]/g, ""))
    const pseudo = name ? chalk.bold.white(`~${name}`) : chalk.gray("inconnu")
    const lid    = chalk.gray(sender)
    const chat   = isGroupJid(jid)
                   ? chalk.blue(`[groupe ${chalk.gray(jid)}]`)
                   : chalk.gray("[DM]")
    console.log(
      `${time()} ${tag.media} ` +
      `${pseudo} ${chalk.gray("(")}${numero}${chalk.gray(")")} ` +
      `${chalk.gray("•")} ${lid} ` +
      `${chalk.gray("→")} ${chat} ${chalk.gray("›")} ${chalk.magenta(mediaType)}`
    )
  },

  // ── IA query ──────────────────────────
  ai(sender, query, model = "claude") {
    const from = chalk.magentaBright(sender.replace(/[^0-9]/g, "").slice(0, 12))
    console.log(`${time()} ${tag.ai} ${from} ${chalk.gray("›")} ${chalk.magenta(model)} ${chalk.gray("›")} ${chalk.white(truncate(query, 50))}`)
  },

  // ── Connexion ─────────────────────────
  connect(name, jid) {
    console.log(`${time()} ${tag.connect} ${chalk.greenBright(name)} ${chalk.gray(jid?.split(":")[0] || "")}`)
  },

  // ── Déconnexion ───────────────────────
  disconnect(reason) {
    console.log(`${time()} ${tag.disconnect} ${chalk.red(reason || "Connexion perdue")}`)
  },

  // ── Reconnexion ───────────────────────
  reconnect(attempt) {
    console.log(`${time()} ${tag.warn} ${chalk.yellow(`Reconnexion tentative #${attempt}...`)}`)
  },

  // ── Groupe event ─────────────────────
  group(action, who, groupName) {
    const actions = {
      add:     chalk.green("➕ rejoint"),
      remove:  chalk.red("➖ quitté"),
      promote: chalk.yellow("👑 promu admin"),
      demote:  chalk.gray("⬇️ rétrogradé"),
    }
    const label = actions[action] || chalk.white(action)
    const name = chalk.blue(truncate(groupName || "groupe", 25))
    console.log(`${time()} ${tag.group} ${chalk.cyan(who.replace(/[^0-9]/g, ""))} ${label} ${chalk.gray("dans")} ${name}`)
  },

  // ── Erreur ────────────────────────────
  error(context, err) {
    const msg = err?.message || String(err)
    console.log(`${time()} ${tag.error} ${chalk.red(context)} ${chalk.gray("›")} ${chalk.redBright(truncate(msg, 80))}`)
  },

  // ── Warning ───────────────────────────
  warn(text) {
    console.log(`${time()} ${tag.warn} ${chalk.yellow(text)}`)
  },

  // ── Info général ─────────────────────
  info(text) {
    console.log(`${time()} ${tag.info} ${chalk.white(text)}`)
  },

  // ── Boot ──────────────────────────────
  boot(text) {
    console.log(`${time()} ${tag.boot} ${chalk.greenBright(text)}`)
  },

  // ── Spam détecté ─────────────────────
  spam(sender) {
    console.log(`${time()} ${tag.spam} ${chalk.yellow(sender.replace(/[^0-9]/g, ""))} ${chalk.gray("› spam détecté, ignoré")}`)
  },

  // ── Ban ───────────────────────────────
  ban(sender, action = "banni") {
    console.log(`${time()} ${tag.ban} ${chalk.red(sender.replace(/[^0-9]/g, ""))} ${chalk.gray("›")} ${action}`)
  },

  // ── Commandes chargées ───────────────
  loaded(count, categories) {
    console.log(`${time()} ${tag.boot} ${chalk.greenBright(`${count} commandes chargées`)} ${chalk.gray("›")} ${chalk.cyan(categories.join(", "))}`)
  },

  // ── Séparateur visuel ─────────────────
  divider() {
    console.log(chalk.gray("  " + "━".repeat(55)))
  }
}

// ── Helpers internes ──────────────────
function truncate(str, max) {
  if (!str) return ""
  return str.length > max ? str.slice(0, max) + "…" : str
}

function isGroupJid(jid) {
  return jid?.endsWith("@g.us")
}

module.exports = logger
