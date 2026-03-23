// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//      TERRA - XMD | GROUP COMMANDS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const { getGroup, updateGroup } = require("../../database/db")

module.exports = [
  // ── Kick ──────────────────────────────
  {
    cmd: ["kick", "virer", "expulser"],
    desc: "Expulser un membre du groupe",
    category: "group",
    groupOnly: true,
    adminOnly: true,
    exec: async ({ sock, jid, msg, reply, react, isBotAdmin }) => {
      if (!isBotAdmin) return reply("❌ Je dois être *admin* pour expulser quelqu'un.")
      const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid ||
                        msg.message?.extendedTextMessage?.contextInfo?.participant
      if (!mentioned?.length) return reply("❌ Mentionne le membre à expulser.")
      await sock.groupParticipantsUpdate(jid, Array.isArray(mentioned) ? mentioned : [mentioned], "remove")
      await react("👢")
      reply(`👢 Membre expulsé avec succès.`)
    }
  },

  // ── Promote ───────────────────────────
  {
    cmd: ["promote", "admin", "promouvoir"],
    desc: "Promouvoir un membre admin",
    category: "group",
    groupOnly: true,
    adminOnly: true,
    exec: async ({ sock, jid, msg, reply, react, isBotAdmin }) => {
      if (!isBotAdmin) return reply("❌ Je dois être *admin* pour promouvoir.")
      const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid
      if (!mentioned?.length) return reply("❌ Mentionne le membre à promouvoir.")
      await sock.groupParticipantsUpdate(jid, mentioned, "promote")
      await react("👑")
      reply(`👑 *@${mentioned[0].replace(/[^0-9]/g, "")}* est maintenant *admin* !`)
    }
  },

  // ── Demote ────────────────────────────
  {
    cmd: ["demote", "deadmin", "rétrograder"],
    desc: "Retirer les droits admin",
    category: "group",
    groupOnly: true,
    adminOnly: true,
    exec: async ({ sock, jid, msg, reply, react, isBotAdmin }) => {
      if (!isBotAdmin) return reply("❌ Je dois être *admin* pour rétrograder.")
      const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid
      if (!mentioned?.length) return reply("❌ Mentionne le membre à rétrograder.")
      await sock.groupParticipantsUpdate(jid, mentioned, "demote")
      await react("⬇️")
      reply(`⬇️ *@${mentioned[0].replace(/[^0-9]/g, "")}* n'est plus admin.`)
    }
  },

  // ── Mute / Open ───────────────────────
  {
    cmd: ["mute", "fermer"],
    desc: "Fermer le groupe (admins seulement)",
    category: "group",
    groupOnly: true,
    adminOnly: true,
    exec: async ({ sock, jid, reply, react, isBotAdmin }) => {
      if (!isBotAdmin) return reply("❌ Je dois être *admin* pour fermer le groupe.")
      await sock.groupSettingUpdate(jid, "announcement")
      await react("🔒")
      reply("🔒 Groupe *fermé*. Seuls les admins peuvent écrire.")
    }
  },

  {
    cmd: ["unmute", "ouvrir"],
    desc: "Ouvrir le groupe à tous",
    category: "group",
    groupOnly: true,
    adminOnly: true,
    exec: async ({ sock, jid, reply, react, isBotAdmin }) => {
      if (!isBotAdmin) return reply("❌ Je dois être *admin* pour ouvrir le groupe.")
      await sock.groupSettingUpdate(jid, "not_announcement")
      await react("🔓")
      reply("🔓 Groupe *ouvert*. Tout le monde peut écrire.")
    }
  },

  // ── Antilink ──────────────────────────
  {
    cmd: ["antilink"],
    desc: "Activer/désactiver l'antilink",
    category: "group",
    groupOnly: true,
    adminOnly: true,
    exec: async ({ jid, args, reply, react }) => {
      const grp = await getGroup(jid)
      const toggle = args[0]?.toLowerCase()
      if (!["on", "off"].includes(toggle)) return reply("❌ Utilise : `.antilink on` ou `.antilink off`")
      await updateGroup(jid, { antilink: toggle === "on" })
      await react(toggle === "on" ? "🛡️" : "✅")
      reply(`🔗 Antilink *${toggle === "on" ? "activé" : "désactivé"}* dans ce groupe.`)
    }
  },

  // ── Welcome ───────────────────────────
  {
    cmd: ["welcome"],
    desc: "Activer/désactiver le message de bienvenue",
    category: "group",
    groupOnly: true,
    adminOnly: true,
    exec: async ({ jid, args, reply, react }) => {
      const toggle = args[0]?.toLowerCase()
      if (!["on", "off"].includes(toggle)) return reply("❌ Utilise : `.welcome on` ou `.welcome off`")
      await updateGroup(jid, { welcome: toggle === "on" })
      await react("👋")
      reply(`👋 Message de bienvenue *${toggle === "on" ? "activé" : "désactivé"}*.`)
    }
  },

  // ── Infos groupe ──────────────────────
  {
    cmd: ["ginfo", "groupinfo"],
    desc: "Infos sur le groupe",
    category: "group",
    groupOnly: true,
    exec: async ({ sock, jid, reply, react }) => {
      const meta = await sock.groupMetadata(jid)
      const admins = meta.participants.filter(p => p.admin).length
      await react("📋")
      reply(
        `📋 *${meta.subject}*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🆔 ID : \`${jid}\`\n` +
        `👥 Membres : *${meta.participants.length}*\n` +
        `👮 Admins : *${admins}*\n` +
        `📝 Description : _${meta.desc || "Aucune description"}_\n` +
        `📅 Créé le : *${new Date(meta.creation * 1000).toLocaleDateString("fr-FR")}*`
      )
    }
  },

  // ── Tagall ────────────────────────────
  {
    cmd: ["tagall", "everyone", "touslemonde"],
    desc: "Mentionner tous les membres",
    category: "group",
    groupOnly: true,
    adminOnly: true,
    exec: async ({ sock, jid, args, msg, react }) => {
      const meta = await sock.groupMetadata(jid)
      const members = meta.participants.map(p => p.id)
      const text = args.length ? args.join(" ") : "📢 Attention tout le monde !"
      const mentions = members.map(m => `@${m.replace(/[^0-9]/g, "")}`).join(" ")
      await react("📢")
      await sock.sendMessage(jid, {
        text: `📢 *${text}*\n\n${mentions}`,
        mentions: members
      }, { quoted: msg })
    }
  }
]
