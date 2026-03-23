// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//        TERRA - XMD | DATABASE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const fs     = require("fs-extra")
const config = require("../config")

let db = { users: {}, groups: {}, settings: {}, stats: { totalCmds: 0 } }

// ── Init ──────────────────────────────
async function initDB() {
  try {
    await fs.ensureFile(config.DB_PATH)
    const raw = await fs.readFile(config.DB_PATH, "utf-8")
    if (raw.trim()) db = JSON.parse(raw)
  } catch {
    await saveDB()
  }
}

async function saveDB() {
  await fs.writeJson(config.DB_PATH, db, { spaces: 2 })
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//              USERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function getUser(id) {
  const key = id.replace(/[^0-9]/g, "")
  if (!db.users[key]) {
    db.users[key] = {
      id,
      banned:    false,
      cmdUsed:   0,
      lastSeen:  Date.now(),
      joinedAt:  Date.now()
    }
    await saveDB()
  }
  return db.users[key]
}

async function updateUser(id, data) {
  const key = id.replace(/[^0-9]/g, "")
  db.users[key] = { ...(db.users[key] || {}), ...data }
  await saveDB()
}

async function banUser(id)   { await updateUser(id, { banned: true  }) }
async function unbanUser(id) { await updateUser(id, { banned: false }) }

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//              GROUPS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function getGroup(jid) {
  if (!db.groups[jid]) {
    db.groups[jid] = {
      jid,
      // Protections
      antilink:       false,
      antilinkAction: "delete",   // delete | kick
      antispam:       false,
      antitag:        false,
      antimedia:      false,
      antitransfert:  false,
      antibadword:    false,
      badwords:       [],
      antipromote:    false,
      antidemote:     false,
      // Auto
      autoreact:      false,
      // Welcome / Goodbye
      welcome:        false,
      welcomeMsg:     "👋 Bienvenue @user dans *@group* !\n\n@desc",
      goodbye:        false,
    }
    await saveDB()
  }
  return db.groups[jid]
}

async function updateGroup(jid, data) {
  db.groups[jid] = { ...(db.groups[jid] || {}), ...data }
  await saveDB()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//             SETTINGS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function getSettings() {
  return db.settings || {}
}

async function updateSetting(key, value) {
  db.settings[key] = value
  await saveDB()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//              STATS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function incrementStats() {
  db.stats.totalCmds = (db.stats.totalCmds || 0) + 1
  await saveDB()
}

function getStats() {
  return {
    totalUsers:  Object.keys(db.users).length,
    totalGroups: Object.keys(db.groups).length,
    totalCmds:   db.stats.totalCmds || 0
  }
}

module.exports = {
  initDB, saveDB,
  getUser, updateUser, banUser, unbanUser,
  getGroup, updateGroup,
  getSettings, updateSetting,
  incrementStats, getStats
}
