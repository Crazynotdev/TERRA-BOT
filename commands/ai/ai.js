// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//       TERRA - XMD | AI COMMANDS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const axios = require("axios")
const config = require("../../config")
const logger = require("../../lib/logger")

// Historique de conversation par user (multi-turn)
const conversations = new Map()
const MAX_HISTORY = 10 // messages gardés en mémoire

// ── Helper : appel Claude API ─────────
async function askClaude(userJid, userMessage, systemPrompt) {
  const history = conversations.get(userJid) || []

  history.push({ role: "user", content: userMessage })

  const response = await axios.post(
    "https://api.anthropic.com/v1/messages",
    {
      model: "claude-opus-4-5",
      max_tokens: 1024,
      system: systemPrompt || config.AI_SYSTEM_PROMPT,
      messages: history.slice(-MAX_HISTORY)
    },
    {
      headers: {
        "x-api-key": config.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      }
    }
  )

  const reply = response.data?.content?.[0]?.text || "❌ Pas de réponse."
  history.push({ role: "assistant", content: reply })
  conversations.set(userJid, history.slice(-MAX_HISTORY))

  return reply
}

// ── Helper : appel GPT ────────────────
async function askGPT(userJid, userMessage, systemPrompt) {
  const history = conversations.get(`gpt_${userJid}`) || []

  history.push({ role: "user", content: userMessage })

  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini",
      max_tokens: 1024,
      messages: [
        { role: "system", content: systemPrompt || config.AI_SYSTEM_PROMPT },
        ...history.slice(-MAX_HISTORY)
      ]
    },
    {
      headers: {
        "Authorization": `Bearer ${config.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  )

  const reply = response.data?.choices?.[0]?.message?.content || "❌ Pas de réponse."
  history.push({ role: "assistant", content: reply })
  conversations.get(`gpt_${userJid}`) || conversations.set(`gpt_${userJid}`, [])
  conversations.set(`gpt_${userJid}`, history.slice(-MAX_HISTORY))

  return reply
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
module.exports = [

  // ── Ask Claude ────────────────────────
  {
    cmd: ["ai", "claude", "ask"],
    desc: "Poser une question à l'IA Claude",
    category: "ai",
    exec: async ({ args, reply, react, sender }) => {
      const query = args.join(" ")
      if (!query) return reply(
        `🤖 *TERRA AI — Claude*\n\n` +
        `Pose-moi n'importe quelle question !\n` +
        `Ex: \`${config.PREFIX}ai Explique-moi la blockchain\`\n\n` +
        `_💡 Je me souviens de notre conversation._`
      )

      if (!config.ANTHROPIC_API_KEY || config.ANTHROPIC_API_KEY === "VOTRE_CLE_ICI") {
        return reply("❌ Clé API Anthropic non configurée dans `config.js`")
      }

      await react("🤔")
      logger.ai(sender, query, "claude")

      try {
        const answer = await askClaude(sender, query)
        await react("🤖")
        reply(`🤖 *Claude AI*\n\n${answer}\n\n_— TERRA-XMD_`)
      } catch (err) {
        logger.error("AI/Claude", err)
        reply(`❌ Erreur Claude API : _${err.message}_`)
      }
    }
  },

  // ── Ask GPT ───────────────────────────
  {
    cmd: ["gpt", "chatgpt"],
    desc: "Poser une question à ChatGPT",
    category: "ai",
    exec: async ({ args, reply, react, sender }) => {
      const query = args.join(" ")
      if (!query) return reply(
        `🧠 *TERRA AI — ChatGPT*\n\n` +
        `Ex: \`${config.PREFIX}gpt C'est quoi l'IA ?\``
      )

      if (!config.OPENAI_API_KEY || config.OPENAI_API_KEY === "VOTRE_CLE_ICI") {
        return reply("❌ Clé API OpenAI non configurée dans `config.js`")
      }

      await react("🤔")
      logger.ai(sender, query, "gpt-4o-mini")

      try {
        const answer = await askGPT(sender, query)
        await react("🧠")
        reply(`🧠 *ChatGPT*\n\n${answer}\n\n_— TERRA-XMD_`)
      } catch (err) {
        logger.error("AI/GPT", err)
        reply(`❌ Erreur OpenAI : _${err.message}_`)
      }
    }
  },

  // ── Reset conversation ────────────────
  {
    cmd: ["aireset", "newchat"],
    desc: "Réinitialiser la conversation IA",
    category: "ai",
    exec: async ({ reply, react, sender }) => {
      conversations.delete(sender)
      conversations.delete(`gpt_${sender}`)
      await react("🔄")
      reply("🔄 Conversation IA réinitialisée. On repart à zéro !")
    }
  },

  // ── Traducteur IA ─────────────────────
  {
    cmd: ["translate", "trad", "traduire"],
    desc: "Traduire un texte avec l'IA",
    category: "ai",
    exec: async ({ args, reply, react, sender }) => {
      // Usage: .trad en Bonjour tout le monde
      // ou: .trad Bonjour (auto-détecte et traduit en anglais)
      const LANGS = { fr: "français", en: "anglais", es: "espagnol", ar: "arabe", pt: "portugais", de: "allemand", it: "italien", zh: "chinois", ja: "japonais", ru: "russe" }

      let targetLang = "en"
      let text = args.join(" ")

      if (args[0] && LANGS[args[0].toLowerCase()]) {
        targetLang = args.shift().toLowerCase()
        text = args.join(" ")
      }

      if (!text) return reply(
        `🌐 *Traducteur IA*\n\n` +
        `Usage : \`${config.PREFIX}trad [langue] [texte]\`\n` +
        `Ex : \`${config.PREFIX}trad en Bonjour tout le monde\`\n\n` +
        `Langues : ${Object.entries(LANGS).map(([k, v]) => `\`${k}\` ${v}`).join(", ")}`
      )

      if (!config.ANTHROPIC_API_KEY || config.ANTHROPIC_API_KEY === "VOTRE_CLE_ICI") {
        return reply("❌ Clé API Anthropic non configurée.")
      }

      await react("🌐")

      try {
        const prompt = `Traduis ce texte en ${LANGS[targetLang] || targetLang}. Réponds UNIQUEMENT avec la traduction, sans explication ni guillemets : "${text}"`
        const translated = await askClaude(`translate_${sender}`, prompt, "Tu es un traducteur expert. Tu traduis uniquement, sans ajouter de commentaire.")
        conversations.delete(`translate_${sender}`)
        await react("✅")
        reply(`🌐 *Traduction → ${LANGS[targetLang] || targetLang}*\n\n${translated}`)
      } catch (err) {
        reply(`❌ Erreur traduction : _${err.message}_`)
      }
    }
  },

  // ── Résumé ────────────────────────────
  {
    cmd: ["resume", "summarize", "tldr"],
    desc: "Résumer un texte long avec l'IA",
    category: "ai",
    exec: async ({ args, msg, reply, react, sender }) => {
      // Supporte le texte en argument OU en message cité
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
      const quotedText =
        quoted?.conversation ||
        quoted?.extendedTextMessage?.text || ""

      const text = args.length ? args.join(" ") : quotedText

      if (!text || text.length < 50) return reply(
        `📝 *Résumé IA*\n\n` +
        `Envoie un texte long ou réponds à un message avec \`${config.PREFIX}resume\``
      )

      if (!config.ANTHROPIC_API_KEY || config.ANTHROPIC_API_KEY === "VOTRE_CLE_ICI") {
        return reply("❌ Clé API Anthropic non configurée.")
      }

      await react("📝")

      try {
        const prompt = `Fais un résumé clair et concis de ce texte en bullet points :\n\n${text}`
        const summary = await askClaude(`resume_${sender}`, prompt, "Tu es un assistant qui résume les textes de façon claire, concise et structurée.")
        conversations.delete(`resume_${sender}`)
        await react("✅")
        reply(`📝 *Résumé*\n\n${summary}`)
      } catch (err) {
        reply(`❌ Erreur résumé : _${err.message}_`)
      }
    }
  },

  // ── Correcteur ────────────────────────
  {
    cmd: ["correct", "corriger", "grammar"],
    desc: "Corriger les fautes d'un texte",
    category: "ai",
    exec: async ({ args, msg, reply, react, sender }) => {
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
      const quotedText = quoted?.conversation || quoted?.extendedTextMessage?.text || ""
      const text = args.length ? args.join(" ") : quotedText

      if (!text) return reply(`✏️ Envoie un texte ou réponds à un message avec \`${config.PREFIX}correct\``)

      if (!config.ANTHROPIC_API_KEY || config.ANTHROPIC_API_KEY === "VOTRE_CLE_ICI") {
        return reply("❌ Clé API Anthropic non configurée.")
      }

      await react("✏️")

      try {
        const prompt = `Corrige les fautes d'orthographe et de grammaire dans ce texte. Réponds avec :\n1. Le texte corrigé\n2. La liste des corrections faites\n\nTexte : "${text}"`
        const corrected = await askClaude(`correct_${sender}`, prompt, "Tu es un correcteur orthographique et grammatical expert en français.")
        conversations.delete(`correct_${sender}`)
        await react("✅")
        reply(`✏️ *Correction*\n\n${corrected}`)
      } catch (err) {
        reply(`❌ Erreur correction : _${err.message}_`)
      }
    }
  },

  // ── Generateur de texte ───────────────
  {
    cmd: ["write", "ecrire", "generate"],
    desc: "Générer du contenu avec l'IA",
    category: "ai",
    exec: async ({ args, reply, react, sender }) => {
      const query = args.join(" ")
      if (!query) return reply(
        `✍️ *Générateur IA*\n\n` +
        `Ex :\n` +
        `\`${config.PREFIX}write un poème sur la pluie\`\n` +
        `\`${config.PREFIX}write un email professionnel pour demander un congé\`\n` +
        `\`${config.PREFIX}write une bio Instagram pour un photographe\``
      )

      if (!config.ANTHROPIC_API_KEY || config.ANTHROPIC_API_KEY === "VOTRE_CLE_ICI") {
        return reply("❌ Clé API Anthropic non configurée.")
      }

      await react("✍️")
      logger.ai(sender, query, "claude/write")

      try {
        const answer = await askClaude(`write_${sender}`, `Génère : ${query}`, "Tu es un rédacteur créatif expert. Tu génères du contenu de qualité, original et adapté à la demande.")
        conversations.delete(`write_${sender}`)
        await react("✅")
        reply(`✍️ *Contenu généré*\n\n${answer}`)
      } catch (err) {
        reply(`❌ Erreur : _${err.message}_`)
      }
    }
  }
]
