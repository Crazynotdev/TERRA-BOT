# 🌍 TERRA - XMD

> Bot WhatsApp multi-fonctions propulsé par **Baileys** & **Node.js**

```
████████╗███████╗██████╗ ██████╗  █████╗      ██╗  ██╗███╗   ███╗██████╗ 
╚══██╔══╝██╔════╝██╔══██╗██╔══██╗██╔══██╗     ╚██╗██╔╝████╗ ████║██╔══██╗
   ██║   █████╗  ██████╔╝██████╔╝███████║      ╚███╔╝ ██╔████╔██║██║  ██║
   ██║   ██╔══╝  ██╔══██╗██╔══██╗██╔══██║      ██╔██╗ ██║╚██╔╝██║██║  ██║
   ██║   ███████╗██║  ██║██║  ██║██║  ██║     ██╔╝ ██╗██║ ╚═╝ ██║██████╔╝
   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝     ╚═╝  ╚═╝╚═╝     ╚═╝╚═════╝ 
```

---

## ✨ Fonctionnalités

| Catégorie | Commandes |
|-----------|-----------|
| 🌍 Général | `menu`, `ping`, `info` |
| 🎮 Fun | `8ball`, `dice`, `flip`, `quote`, `calc`, `choisir`, `verite`, `defi` |
| 🎵 Média | `play`, `ytmp4`, `tiktok`, `sticker`, `ig` |
| 👥 Groupe | `kick`, `promote`, `demote`, `mute`, `unmute`, `antilink`, `welcome`, `ginfo`, `tagall` |
| 👑 Owner | `ban`, `unban`, `bc`, `stats`, `mode`, `setprefix` |

---

## 🚀 Installation

### Prérequis
- Node.js **v20+**
- NPM v9+

### Étapes

```bash
# 1. Cloner le projet
git clone https://github.com/TON_USERNAME/TERRA-XMD
cd TERRA-XMD

# 2. Installer les dépendances
npm install

# 3. Configurer le bot
nano config.js
# → Mets ton numéro dans OWNER_NUMBER

# 4. Lancer le bot
npm start
```

---

## 🔗 Connexion par PairCode

Au premier lancement, le bot te demandera ton numéro WhatsApp :

```
┌─────────────────────────────────────┐
│     🔗  CONNEXION PAR PAIRCODE      │
└─────────────────────────────────────┘

📱 Numéro WhatsApp : 22507XXXXXXXX

⏳ Génération du paircode en cours...

┌─────────────────────────────────────┐
│       🔑  PAIRCODE : ABCD-EFGH      │
└─────────────────────────────────────┘
1. Ouvre WhatsApp → Appareils connectés
2. Lier un appareil → Entre ce code
```

---

## ⚙️ Configuration (`config.js`)

```js
OWNER_NUMBER: ["22507XXXXXXXX"]  // Ton numéro
PREFIX: "."                       // Préfixe des commandes
MODE: "public"                    // public ou private
AUTO_READ: true                   // Marquer messages lus
AUTO_TYPING: true                 // Afficher en train d'écrire
AUTO_REACT: true                  // Réagir aux commandes
```

---

## 📁 Structure du projet

```
TERRA-XMD/
├── index.js              → Point d'entrée + connexion paircode
├── handler.js            → Router central des commandes
├── config.js             → Configuration globale
├── commands/
│   ├── general/          → menu, ping, info
│   ├── fun/              → jeux & divertissement
│   ├── media/            → YouTube, TikTok, Instagram
│   ├── group/            → modération de groupe
│   └── owner/            → commandes owner
├── lib/
│   ├── loader.js         → Chargement dynamique des plugins
│   ├── utils.js          → Fonctions utilitaires Baileys
│   └── groupEvents.js    → Welcome / Goodbye
└── database/
    └── db.js             → Base de données JSON légère
```

---

## 🌍 Déploiement

### Railway
```bash
# Connecte ton repo GitHub à Railway
# Variable d'env : NODE_ENV=production
```

### Heroku
```bash
heroku create terra-xmd
git push heroku main
```

### VPS
```bash
npm install -g pm2
pm2 start index.js --name "TERRA-XMD"
pm2 save
```

---

## 📜 Licence

MIT © TERRA-XMD
