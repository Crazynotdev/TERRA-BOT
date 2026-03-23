// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//       TERRA - XMD | FUN COMMANDS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = [
  // ── 8ball ─────────────────────────────
  {
    cmd: ["8ball", "boule"],
    desc: "Poser une question à la boule magique",
    category: "fun",
    exec: async ({ args, reply, react }) => {
      const responses = [
        "🟢 Oui, absolument !",
        "🟢 C'est certain.",
        "🟢 Sans aucun doute.",
        "🟡 Peut-être...",
        "🟡 Les signes ne sont pas clairs.",
        "🟡 Repose la question plus tard.",
        "🔴 Non, définitivement.",
        "🔴 Ne compte pas là-dessus.",
        "🔴 Mes sources disent non."
      ]
      if (!args.length) return reply("❓ Pose une question ! Ex: `.8ball Suis-je beau ?`")
      const answer = responses[Math.floor(Math.random() * responses.length)]
      await react("🎱")
      reply(`🎱 *8Ball*\n\n❓ *${args.join(" ")}*\n\n${answer}`)
    }
  },

  // ── Dé ────────────────────────────────
  {
    cmd: ["dice", "de", "dé"],
    desc: "Lancer un dé",
    category: "fun",
    exec: async ({ args, reply, react }) => {
      const faces = parseInt(args[0]) || 6
      if (faces < 2 || faces > 100) return reply("❌ Entre un nombre de faces entre 2 et 100.")
      const result = Math.floor(Math.random() * faces) + 1
      await react("🎲")
      reply(`🎲 Tu as lancé un *d${faces}* → **${result}**`)
    }
  },

  // ── Pile ou Face ──────────────────────
  {
    cmd: ["flip", "pile"],
    desc: "Pile ou face",
    category: "fun",
    exec: async ({ reply, react }) => {
      const result = Math.random() < 0.5 ? "🪙 *PILE*" : "🪙 *FACE*"
      await react("🪙")
      reply(`${result}`)
    }
  },

  // ── Quote aléatoire ───────────────────
  {
    cmd: ["quote", "citation"],
    desc: "Citation motivante aléatoire",
    category: "fun",
    exec: async ({ reply, react }) => {
      const quotes = [
        ["La vie c'est comme une bicyclette, il faut avancer pour ne pas perdre l'équilibre.", "Albert Einstein"],
        ["Le succès c'est tomber sept fois et se relever huit.", "Proverbe japonais"],
        ["La créativité c'est l'intelligence qui s'amuse.", "Albert Einstein"],
        ["Sois le changement que tu veux voir dans le monde.", "Gandhi"],
        ["Le seul endroit où le succès vient avant le travail, c'est dans le dictionnaire.", "Vidal Sassoon"],
        ["N'attends pas. Le moment ne sera jamais parfait.", "Napoléon Hill"],
        ["Chaque expert a d'abord été un débutant.", "Proverbe"],
      ]
      const [text, author] = quotes[Math.floor(Math.random() * quotes.length)]
      await react("💬")
      reply(`💬 _"${text}"_\n\n— *${author}*`)
    }
  },

  // ── Calcul ────────────────────────────
  {
    cmd: ["calc", "calcul"],
    desc: "Calculatrice simple",
    category: "fun",
    exec: async ({ args, reply, react }) => {
      const expr = args.join(" ").replace(/[^0-9+\-*/.() ]/g, "")
      if (!expr) return reply("❌ Donne une expression. Ex: `.calc 5 * 8 + 2`")
      try {
        const result = Function(`"use strict"; return (${expr})`)()
        await react("🧮")
        reply(`🧮 *${expr}* = *${result}*`)
      } catch {
        reply("❌ Expression invalide.")
      }
    }
  },

  // ── Choisir ───────────────────────────
  {
    cmd: ["choisir", "choose", "pick"],
    desc: "Choisir parmi plusieurs options",
    category: "fun",
    exec: async ({ args, reply, react }) => {
      const options = args.join(" ").split("|").map(o => o.trim()).filter(Boolean)
      if (options.length < 2) return reply("❌ Donne au moins 2 options séparées par `|`\nEx: `.choisir Pizza | Burger | Tacos`")
      const chosen = options[Math.floor(Math.random() * options.length)]
      await react("🎯")
      reply(`🎯 TERRA a choisi : *${chosen}*`)
    }
  },

  // ── Vérité ou défi ────────────────────
  {
    cmd: ["verite", "truth"],
    desc: "Une question vérité aléatoire",
    category: "fun",
    exec: async ({ reply, react }) => {
      const questions = [
        "Quelle est ta plus grande peur ?",
        "Quel est ton plus grand regret ?",
        "As-tu déjà menti à ton meilleur ami ?",
        "Quelle est la chose la plus folle que tu aies jamais faite ?",
        "Quelle est ta qualité que tu préfères chez toi ?",
        "Quel est ton rêve secret ?",
        "As-tu déjà eu le coup de foudre ?"
      ]
      await react("💭")
      reply(`💭 *Vérité :*\n\n_${questions[Math.floor(Math.random() * questions.length)]}_`)
    }
  },

  // ── Défi ──────────────────────────────
  {
    cmd: ["defi", "dare"],
    desc: "Un défi aléatoire",
    category: "fun",
    exec: async ({ reply, react }) => {
      const dares = [
        "Envoie un selfie ridicule dans le groupe !",
        "Imite quelqu'un du groupe pendant 1 minute.",
        "Chante 10 secondes de ta chanson préférée en vocal !",
        "Dis quelque chose de gentil à chaque membre du groupe.",
        "Raconte une blague (bonne ou mauvaise) !",
        "Fais 10 pompes et poste une photo comme preuve.",
        "Change ton nom dans ce groupe pour 1 heure."
      ]
      await react("🔥")
      reply(`🔥 *Défi :*\n\n_${dares[Math.floor(Math.random() * dares.length)]}_`)
    }
  }
]
