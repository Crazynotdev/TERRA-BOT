// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//        TERRA - XMD | CONFIG
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

require("dotenv").config()

module.exports = {
  // ── Bot Identity ──────────────────────
  BOT_NAME:    "𝐓𝐄𝐑𝐑𝐀 𝐗𝐌𝐃",
  BOT_VERSION: "1.0.0",
  BOT_TAG:     "𝖢𝖱𝖤𝖠𝖳𝖤𝖣 𝖡𝖸 𝖢𝖱𝖠𝖹𝖸 🎶",

  // ── Owner ─────────────────────────────
  OWNER_NUMBER: [(process.env.OWNER_NUMBER || "𝟤𝟦𝟣𝟨𝟧𝟩𝟥𝟢𝟣𝟤𝟥")],
  OWNER_NAME:   process.env.OWNER_NAME || "Crazy",

  // ── Prefix ────────────────────────────
  PREFIX: process.env.PREFIX || ".",

  // ── Mode ──────────────────────────────
  MODE: process.env.MODE || "public",   // public | private

  // ── Auto Features ─────────────────────
  AUTO_READ:        true,
  AUTO_TYPING:      true,
  AUTO_REACT:       true,
  AUTO_STATUS_READ: false,

  // ── Anti Spam ─────────────────────────
  ANTI_SPAM:  true,
  SPAM_DELAY: 3000,

  // ── Newsletter & Branding ─────────────
  NEWSLETTER_JID:  "120363426385705403@newsletter",
  NEWSLETTER_NAME: "𝖢𝖫𝖨𝖢𝖪 𝖧𝖤𝖱𝖤 𝖳𝖮 𝖶𝖮𝖭 𝟧$",
  LOGO_URL:        "https://files.catbox.moe/btqmt0.jpg",
  CHANNEL_URL:     "https://whatsapp.com/channel/0029VbBJKKB2phHCqX7HVU0Q",

  // ── IA — Anthropic Claude ─────────────
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "VOTRE_CLE_ICI",
  AI_MODEL_CLAUDE:   "claude-opus-4-5",

  // ── IA — OpenAI ChatGPT ───────────────
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "VOTRE_CLE_ICI",
  AI_MODEL_GPT:   "gpt-4o-mini",

  // ── Prompt IA ─────────────────────────
  AI_SYSTEM_PROMPT: `Tu es TERRA, un assistant WhatsApp intelligent créé by crazy.
Tu réponds toujours en français sauf si on te parle dans une autre langue.
Sois direct, utile et concis (max 300 mots sauf si demandé).`,

  // ── Paths ─────────────────────────────
  DB_PATH:      "./database/terra.json",
  SESSION_PATH: "./session",
  TEMP_DIR:     "./temp",
}
