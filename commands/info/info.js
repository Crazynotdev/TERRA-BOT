// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//      TERRA - XMD | INFO COMMANDS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const axios = require("axios")
const { sendMsg, sendImage, getContextInfo } = require("../../lib/msgHelper")

// ── Helper fetch sécurisé ─────────────
async function safeFetch(url) {
  const res = await axios.get(url, { timeout: 10000 })
  return res.data
}

module.exports = [

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //            WIKIPEDIA
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    cmd: ["wiki", "wikipedia"],
    desc: "Rechercher sur Wikipédia",
    category: "info",
    exec: async ({ args, reply, react, sock, jid, msg }) => {
      if (!args.length) return reply("❌ Donne un terme à rechercher.\nEx: `.wiki Intelligence artificielle`")
      await react("🔍")

      const query = args.join(" ")
      try {
        // Recherche Wikipedia API FR
        const searchRes = await safeFetch(
          `https://fr.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&format=json`
        )
        const title   = searchRes[1]?.[0]
        const summary = searchRes[2]?.[0]
        const url     = searchRes[3]?.[0]

        if (!title) return reply(`❌ Aucun résultat pour *${query}* sur Wikipédia.`)

        // Récupère l'image de la page
        const pageRes = await safeFetch(
          `https://fr.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=500`
        )
        const pages    = pageRes.query?.pages
        const pageData = pages?.[Object.keys(pages)[0]]
        const imgUrl   = pageData?.thumbnail?.source

        const text =
          `📖 *${title}*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `${summary || "Aucun résumé disponible."}\n\n` +
          `🔗 ${url}`

        if (imgUrl) {
          await sendImage(sock, jid, imgUrl, text, msg, "Wikipédia")
        } else {
          await sendMsg(sock, jid, text, msg, "Wikipédia", title)
        }
      } catch (err) {
        reply(`❌ Erreur Wikipedia : _${err.message}_`)
      }
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //             BLAGUE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    cmd: ["blague", "joke", "lol"],
    desc: "Une blague aléatoire",
    category: "info",
    exec: async ({ react, sock, jid, msg }) => {
      await react("😂")
      try {
        const data = await safeFetch("https://v2.jokeapi.dev/joke/Any?lang=fr&blacklistFlags=nsfw,racist&format=json")

        let text
        if (data.type === "twopart") {
          text = `😂 *Blague*\n\n❓ ${data.setup}\n\n💡 ${data.delivery}`
        } else {
          text = `😂 *Blague*\n\n${data.joke}`
        }
        await sendMsg(sock, jid, text, msg, "😂 Blague", "TERRA - XMD")
      } catch {
        // Fallback blagues locales
        const blagues = [
          ["Pourquoi les plongeurs plongent-ils toujours en arrière ?", "Parce que sinon ils tomberaient dans le bateau !"],
          ["C'est l'histoire d'une pizza qui rencontre un hamburger.", "La pizza dit : 'T'es carré ou quoi ?' 🍕"],
          ["Qu'est-ce qu'un crocodile qui surveille la cour ?", "Un sac à dents ! 👜"],
          ["Pourquoi le livre de maths était triste ?", "Parce qu'il avait trop de problèmes. 📚"],
          ["Comment appelle-t-on un chat tombé dans un pot de peinture le jour de Noël ?", "Un chat-peint de Noël ! 🐱"]
        ]
        const [q, r] = blagues[Math.floor(Math.random() * blagues.length)]
        await sendMsg(sock, jid, `😂 *Blague*\n\n❓ ${q}\n\n💡 ${r}`, msg, "😂 Blague", "TERRA - XMD")
      }
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //            HOROSCOPE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    cmd: ["horoscope", "astro", "signe"],
    desc: "Horoscope du jour",
    category: "info",
    exec: async ({ args, react, sock, jid, msg }) => {
      const SIGNES = {
        belier:    { en: "aries",       emoji: "♈", dates: "21 mars – 19 avril" },
        taureau:   { en: "taurus",      emoji: "♉", dates: "20 avril – 20 mai" },
        gemeaux:   { en: "gemini",      emoji: "♊", dates: "21 mai – 20 juin" },
        cancer:    { en: "cancer",      emoji: "♋", dates: "21 juin – 22 juillet" },
        lion:      { en: "leo",         emoji: "♌", dates: "23 juillet – 22 août" },
        vierge:    { en: "virgo",       emoji: "♍", dates: "23 août – 22 sept" },
        balance:   { en: "libra",       emoji: "♎", dates: "23 sept – 22 oct" },
        scorpion:  { en: "scorpio",     emoji: "♏", dates: "23 oct – 21 nov" },
        sagittaire:{ en: "sagittarius", emoji: "♐", dates: "22 nov – 21 déc" },
        capricorne:{ en: "capricorn",   emoji: "♑", dates: "22 déc – 19 jan" },
        verseau:   { en: "aquarius",    emoji: "♒", dates: "20 jan – 18 fév" },
        poissons:  { en: "pisces",      emoji: "♓", dates: "19 fév – 20 mars" }
      }

      const signe = args[0]?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

      if (!signe || !SIGNES[signe]) {
        const liste = Object.entries(SIGNES)
          .map(([k, v]) => `${v.emoji} ${k}`)
          .join("  ")
        return await sendMsg(sock, jid,
          `⭐ *Horoscope du jour*\n\n` +
          `Donne ton signe :\n${liste}\n\n` +
          `Ex: \`.horoscope lion\``,
          msg, "⭐ Horoscope", "TERRA - XMD"
        )
      }

      await react("⭐")
      const { en, emoji, dates } = SIGNES[signe]

      try {
        const data = await safeFetch(`https://horoscope-app-api.vercel.app/api/v1/get-horoscope/daily?sign=${en}&day=today`)
        const prediction = data.data?.horoscope_data || "Pas de prédiction disponible."

        await sendMsg(sock, jid,
          `${emoji} *${signe.charAt(0).toUpperCase() + signe.slice(1)}*\n` +
          `📅 _${dates}_\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `${prediction}\n\n` +
          `_🌍 TERRA - XMD_`,
          msg, `${emoji} Horoscope`, signe
        )
      } catch {
        // Horoscopes locaux de fallback
        const predictions = [
          "Les astres te sont favorables aujourd'hui. Profite des opportunités qui se présentent.",
          "Une surprise agréable t'attend. Garde l'esprit ouvert aux nouvelles rencontres.",
          "Journée idéale pour te concentrer sur tes projets. Ta persévérance paiera.",
          "Les étoiles t'invitent à la patience. Ce qui tarde à venir n'en sera que meilleur.",
          "Une conversation importante changera ta perspective sur une situation."
        ]
        const pred = predictions[Math.floor(Math.random() * predictions.length)]
        await sendMsg(sock, jid,
          `${emoji} *${signe.charAt(0).toUpperCase() + signe.slice(1)}*\n` +
          `📅 _${dates}_\n━━━━━━━━━━━━━━━━━━━━\n\n${pred}`,
          msg, `${emoji} Horoscope`, signe
        )
      }
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //            MÉTÉO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    cmd: ["meteo", "weather", "temps"],
    desc: "Météo d'une ville",
    category: "info",
    exec: async ({ args, reply, react, sock, jid, msg }) => {
      if (!args.length) return reply("❌ Donne une ville.\nEx: `.meteo Abidjan`")
      await react("🌤️")

      const city = args.join(" ")
      try {
        const data = await safeFetch(
          `https://wttr.in/${encodeURIComponent(city)}?format=j1`
        )
        const cur  = data.current_condition?.[0]
        const area = data.nearest_area?.[0]

        if (!cur) return reply("❌ Ville introuvable.")

        const nom       = area?.areaName?.[0]?.value || city
        const pays      = area?.country?.[0]?.value  || ""
        const temp      = cur.temp_C
        const feelsLike = cur.FeelsLikeC
        const humidity  = cur.humidity
        const wind      = cur.windspeedKmph
        const desc      = cur.weatherDesc?.[0]?.value || ""

        const emoji =
          desc.toLowerCase().includes("rain")  ? "🌧️" :
          desc.toLowerCase().includes("cloud") ? "☁️" :
          desc.toLowerCase().includes("sun")   ? "☀️" :
          desc.toLowerCase().includes("snow")  ? "❄️" :
          desc.toLowerCase().includes("storm") ? "⛈️" : "🌤️"

        await sendMsg(sock, jid,
          `${emoji} *Météo — ${nom}, ${pays}*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `🌡️ Température : *${temp}°C*\n` +
          `🤔 Ressenti : *${feelsLike}°C*\n` +
          `💧 Humidité : *${humidity}%*\n` +
          `💨 Vent : *${wind} km/h*\n` +
          `📋 Conditions : *${desc}*\n\n` +
          `_🌍 TERRA - XMD_`,
          msg, `${emoji} Météo`, `${nom}, ${pays}`
        )
      } catch (err) {
        reply(`❌ Erreur météo : _${err.message}_`)
      }
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //            HEURE MONDIALE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    cmd: ["heure", "time", "date"],
    desc: "Heure et date actuelles",
    category: "info",
    exec: async ({ args, react, sock, jid, msg }) => {
      await react("🕐")
      const zone = args[0] || "Africa/Abidjan"

      try {
        const now = new Date().toLocaleString("fr-FR", {
          timeZone: zone,
          weekday: "long", year: "numeric", month: "long",
          day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit"
        })
        await sendMsg(sock, jid,
          `🕐 *Heure actuelle*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `📍 Zone : *${zone}*\n` +
          `📅 ${now}\n\n` +
          `_🌍 TERRA - XMD_`,
          msg, "🕐 Heure", zone
        )
      } catch {
        reply(`❌ Zone invalide. Ex: \`.heure Africa/Abidjan\` ou \`.heure Europe/Paris\``)
      }
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //          CONVERTISSEUR DEVISE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    cmd: ["convert", "taux", "devise"],
    desc: "Convertir des devises",
    category: "info",
    exec: async ({ args, reply, react, sock, jid, msg }) => {
      // Usage: .convert 100 USD EUR
      if (args.length < 3) return reply(
        "❌ Usage : `.convert [montant] [de] [vers]`\n" +
        "Ex: `.convert 100 USD EUR`\n" +
        "Ex: `.convert 50000 XOF EUR`"
      )
      await react("💱")

      const [amount, from, to] = [parseFloat(args[0]), args[1].toUpperCase(), args[2].toUpperCase()]
      if (isNaN(amount)) return reply("❌ Montant invalide.")

      try {
        const data = await safeFetch(`https://api.exchangerate-api.com/v4/latest/${from}`)
        const rate  = data.rates?.[to]
        if (!rate) return reply(`❌ Devise *${to}* inconnue.`)

        const result = (amount * rate).toFixed(2)
        await sendMsg(sock, jid,
          `💱 *Conversion de devises*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `💵 ${amount} *${from}*\n` +
          `💰 = *${result} ${to}*\n` +
          `📊 Taux : 1 ${from} = ${rate} ${to}\n\n` +
          `_🌍 TERRA - XMD_`,
          msg, "💱 Conversion", `${from} → ${to}`
        )
      } catch (err) {
        reply(`❌ Erreur conversion : _${err.message}_`)
      }
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //           CALCULATRICE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    cmd: ["calc", "calcul", "math"],
    desc: "Calculatrice",
    category: "info",
    exec: async ({ args, react, sock, jid, msg }) => {
      const expr = args.join(" ").replace(/[^0-9+\-*/.()% ]/g, "")
      if (!expr) return sock.sendMessage(jid,
        { text: "❌ Donne une expression.\nEx: `.calc 15% * 200 + 50`" },
        { quoted: msg }
      )
      await react("🧮")
      try {
        const result = Function(`"use strict"; return (${expr})`)()
        await sendMsg(sock, jid,
          `🧮 *Calculatrice*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `📝 Expression : \`${expr}\`\n` +
          `✅ Résultat : *${result}*`,
          msg, "🧮 Calcul", `${expr} = ${result}`
        )
      } catch {
        sock.sendMessage(jid, { text: "❌ Expression invalide." }, { quoted: msg })
      }
    }
  }

]
