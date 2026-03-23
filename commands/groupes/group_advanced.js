// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//   TERRA - XMD | GROUP ADVANCED CMDS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const { buildCtx, sendMsg, BOT_THUMB } = require("../../lib/msgHelper")
const { getGroup, updateGroup }   = require("../../database/db")

module.exports = [

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //     HIDETAG — Mention invisible
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    cmd: ["hidetag", "ht", "htag"],
    desc: "Mentionner tout le groupe en silence",
    category: "group",
    groupOnly: true,
    adminOnly: true,
    exec: async ({ sock, jid, msg, args, react }) => {
      await react("📢")
      const meta    = await sock.groupMetadata(jid)
      const members = meta.participants.map(p => p.id)
      const text    = args.join(" ") || "📢"

      await sock.sendMessage(jid, {
        text,
        mentions:    members,
        contextInfo: buildCtx("HideTag", `${members.length} membres notifiés`)
      }, { quoted: msg })
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //     REVOKE — Reset lien d'invitation
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    cmd: ["revoke", "resetlink", "newlink"],
    desc: "Réinitialiser le lien d'invitation du groupe",
    category: "group",
    groupOnly: true,
    adminOnly: true,
    exec: async ({ sock, jid, msg, react, isBotAdmin }) => {
      if (!isBotAdmin) return sock.sendMessage(jid,
        { text: "❌ Je dois être *admin* pour réinitialiser le lien." },
        { quoted: msg }
      )
      await react("🔄")
      try {
        const newCode = await sock.groupRevokeInvite(jid)
        await sendMsg(sock, jid,
          `🔄 *Lien réinitialisé !*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `🔗 Nouveau lien :\n` +
          `https://chat.whatsapp.com/${newCode}\n\n` +
          `_L'ancien lien ne fonctionne plus._`,
          msg, "Nouveau lien", "Groupe"
        )
      } catch (err) {
        sock.sendMessage(jid, { text: `❌ Erreur : _${err.message}_` }, { quoted: msg })
      }
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //     GETLINK — Obtenir le lien
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    cmd: ["getlink", "lien", "invitelink"],
    desc: "Obtenir le lien d'invitation du groupe",
    category: "group",
    groupOnly: true,
    adminOnly: true,
    exec: async ({ sock, jid, msg, react, isBotAdmin }) => {
      if (!isBotAdmin) return sock.sendMessage(jid,
        { text: "❌ Je dois être *admin* pour obtenir le lien." },
        { quoted: msg }
      )
      await react("🔗")
      try {
        const code = await sock.groupInviteCode(jid)
        const meta = await sock.groupMetadata(jid)
        await sendMsg(sock, jid,
          `🔗 *Lien d'invitation*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `👥 Groupe : *${meta.subject}*\n` +
          `🔗 https://chat.whatsapp.com/${code}\n\n` +
          `_🌍 TERRA - XMD_`,
          msg, "Lien d'invitation", meta.subject
        )
      } catch (err) {
        sock.sendMessage(jid, { text: `❌ Erreur : _${err.message}_` }, { quoted: msg })
      }
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //     SETNAME — Changer le nom
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    cmd: ["setname", "rename", "nomgroupe"],
    desc: "Changer le nom du groupe",
    category: "group",
    groupOnly: true,
    adminOnly: true,
    exec: async ({ sock, jid, msg, args, react, isBotAdmin }) => {
      if (!isBotAdmin) return sock.sendMessage(jid,
        { text: "❌ Je dois être *admin* pour changer le nom." },
        { quoted: msg }
      )
      const name = args.join(" ")
      if (!name) return sock.sendMessage(jid,
        { text: "❌ Donne un nom.\nEx: `.setname Mon Super Groupe`" },
        { quoted: msg }
      )
      if (name.length > 100) return sock.sendMessage(jid,
        { text: "❌ Nom trop long (max 100 caractères)." },
        { quoted: msg }
      )
      await react("✏️")
      try {
        await sock.groupUpdateSubject(jid, name)
        await sendMsg(sock, jid,
          `✏️ *Nom du groupe modifié !*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `📝 Nouveau nom : *${name}*`,
          msg, "Renommage", name
        )
      } catch (err) {
        sock.sendMessage(jid, { text: `❌ Erreur : _${err.message}_` }, { quoted: msg })
      }
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //     SETDESC — Changer la description
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    cmd: ["setdesc", "description", "desc"],
    desc: "Changer la description du groupe",
    category: "group",
    groupOnly: true,
    adminOnly: true,
    exec: async ({ sock, jid, msg, args, react, isBotAdmin }) => {
      if (!isBotAdmin) return sock.sendMessage(jid,
        { text: "❌ Je dois être *admin* pour changer la description." },
        { quoted: msg }
      )
      const desc = args.join(" ")
      if (!desc) return sock.sendMessage(jid,
        { text: "❌ Donne une description.\nEx: `.setdesc Groupe officiel TERRA`" },
        { quoted: msg }
      )
      await react("📋")
      try {
        await sock.groupUpdateDescription(jid, desc)
        await sendMsg(sock, jid,
          `📋 *Description mise à jour !*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `📝 _${desc}_`,
          msg, "Description", "Groupe"
        )
      } catch (err) {
        sock.sendMessage(jid, { text: `❌ Erreur : _${err.message}_` }, { quoted: msg })
      }
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //     POLL — Sondage
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    cmd: ["poll", "sondage", "vote"],
    desc: "Créer un sondage",
    category: "group",
    groupOnly: true,
    exec: async ({ sock, jid, msg, args, react }) => {
      // Usage: .poll Question | Option1 | Option2 | Option3
      const full    = args.join(" ")
      const parts   = full.split("|").map(p => p.trim()).filter(Boolean)

      if (parts.length < 3) return sock.sendMessage(jid, {
        text:
          `❌ *Usage :*\n` +
          `\`.poll Question | Option 1 | Option 2 | Option 3\`\n\n` +
          `Ex: \`.poll Tu préfères ? | Pizza | Burger | Tacos\``
      }, { quoted: msg })

      const question = parts[0]
      const options  = parts.slice(1).slice(0, 12) // max 12 options WA

      await react("📊")
      try {
        await sock.sendMessage(jid, {
          poll: {
            name:              question,
            values:            options,
            selectableCount:   1
          }
        })
      } catch (err) {
        sock.sendMessage(jid, { text: `❌ Erreur sondage : _${err.message}_` }, { quoted: msg })
      }
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //     AUTOREACT — Toggle réaction auto
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    cmd: ["autoreact"],
    desc: "Activer/désactiver la réaction automatique",
    category: "group",
    groupOnly: true,
    adminOnly: true,
    exec: async ({ jid, args, react, sock, msg }) => {
      const toggle = args[0]?.toLowerCase()
      if (!["on", "off"].includes(toggle)) return sock.sendMessage(jid,
        { text: "❌ Utilise : `.autoreact on` ou `.autoreact off`" },
        { quoted: msg }
      )
      await updateGroup(jid, { autoreact: toggle === "on" })
      await react(toggle === "on" ? "❤️" : "✅")
      await sendMsg(sock, jid,
        `${toggle === "on" ? "❤️" : "🔕"} AutoReact *${toggle === "on" ? "activé" : "désactivé"}* dans ce groupe.`,
        msg, "AutoReact", "Groupe"
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //     SETGOODBYE — Message de départ
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    cmd: ["goodbye", "aurevoir"],
    desc: "Activer/désactiver le message d'au revoir",
    category: "group",
    groupOnly: true,
    adminOnly: true,
    exec: async ({ jid, args, react, sock, msg }) => {
      const toggle = args[0]?.toLowerCase()
      if (!["on", "off"].includes(toggle)) return sock.sendMessage(jid,
        { text: "❌ Utilise : `.goodbye on` ou `.goodbye off`" },
        { quoted: msg }
      )
      await updateGroup(jid, { goodbye: toggle === "on" })
      await react("👋")
      await sendMsg(sock, jid,
        `👋 Message d'au revoir *${toggle === "on" ? "activé" : "désactivé"}*.`,
        msg, "Goodbye", "Groupe"
      )
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //     LISTADMINS — Liste des admins
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    cmd: ["admins", "listadmins"],
    desc: "Lister les admins du groupe",
    category: "group",
    groupOnly: true,
    exec: async ({ sock, jid, msg, react }) => {
      await react("👮")
      const meta   = await sock.groupMetadata(jid)
      const admins = meta.participants.filter(p => p.admin)

      if (!admins.length) return sock.sendMessage(jid,
        { text: "❌ Aucun admin trouvé." },
        { quoted: msg }
      )

      const list = admins
        .map((a, i) => `  ${i + 1}. @${a.id.split("@")[0]}${a.admin === "superadmin" ? " 👑" : ""}`)
        .join("\n")

      await sock.sendMessage(jid, {
        text:
          `👮 *Admins de ${meta.subject}*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `${list}\n\n` +
          `👥 Total : *${admins.length} admin(s)*`,
        mentions:    admins.map(a => a.id),
        contextInfo: buildCtx("Admins", meta.subject)
      }, { quoted: msg })
    }
  }

]
