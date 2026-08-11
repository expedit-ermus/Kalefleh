# KALEFLEH — Service de Courses &amp; Shopping 🇨🇮🌍

**KALEFLEH** fait les courses à la place des clients (diaspora et Côte d'Ivoire) :
vêtements, cosmétiques réglementés, perruques, alimentaire.  
→ Pas de documents administratifs.  
→ Prestation (déplacement) payée au service, expédition à la charge du client (ou proposée par KALEFLEH).

## 📦 Contenu du projet

| Fichier | Rôle |
|---|---|
| `server.js` | Serveur Node/Express : page web + base de fiches clients (JSON) + export CSV |
| `public/index.html` | Landing one-page / funnel de conversion (pain → solution → preuve → étapes → tarifs → devis express → FAQ) |
| `public/style.css` | Styles (identité visuelle charte : Ambre `#E86A00`, Charbon `#1C1208`, Crème `#F7F1E7`) |
| `public/app.js` | Devis express : estimation live du budget, envoi de la fiche |
| `public/admin.html` | Espace admin : consulter / exporter les fiches clients |
| `docs/charte-graphique.md` | **Charte graphique v1.0** : couleurs, typo (Montserrat/Inter), composants, visuels |
| `public/affiche-carre.png`, `affiche-story.png`, `carrousel/*` | Visuels de lancement (posts FB/IG 1080×1080, story 1080×1920) |
| `public/favicon.svg`, `favicon.png`, `apple-touch-icon.png` | Logo « K » (Ambre sur Charbon) + icônes navigateur/mobile |
| `data/fiche-clients.json` | Base de données (créée automatiquement) |
| `posts-lancement.md` | **Tous les posts de lancement** (Facebook, Instagram, TikTok, Stories, Ads) |

## 🚀 Lancer en local (chez toi)

```bash
cd kalefleh
npm install
npm start
```

Ouvre ensuite dans ton navigateur :
- Page de devis : **http://localhost:3000**
- Espace admin : **http://localhost:3000/admin.html**

## 🔑 Espace admin

Mot de passe par défaut (modifiable dans `server.js`, tableau `ADMINS`) :
- `ALJABIR` / `KADJA` / `ADMIN`

L'admin permet de :
- Voir toutes les fiches clients (reçues via le formulaire)
- Exporter tout en CSV (ouvrable dans Excel) → bouton **Exporter CSV**

## 🗂️ Base de données

Chaque demande de devis crée une fiche avec :
Nom, téléphone, WhatsApp, pays, ville · types de courses · détail · budget · prestation · expédition · total estimé · avance · mode de paiement · compagnie d'expédition · adresse de livraison · commentaire.

## 🌐 Mise en ligne

Le site est **déjà en ligne sur Vercel** :

- **Page de devis :** https://kalefleh.vercel.app/ ← c'est ton `[LIEN_DEVIS]`
- **Espace admin :** https://kalefleh.vercel.app/admin.html
- **Persistance :** les fiches clients sont stockées dans un store **Vercel Blob** (durables, survivent aux redéploiements)

Chaque push sur `main` (GitHub) redéploie automatiquement.

## 📁 Mettre à jour les numéros

Avant de partager les posts : remplace dans `posts-lancement.md`, `public/index.html` et les SVG (`.svg`) :
- `[NUMERO_WHATSAPP]` / `[VOTRE NUMERO]` → ton numéro WhatsApp réel
- Le lien de devis est déjà en place : `https://kalefleh.vercel.app/`

## 🎨 Régénérer les visuels de marque

Après édition des SVG ou du carrousel (`tools/generate-carousel.mjs`), reconvertir en PNG :

```bash
cd kalefleh
npm run visuels:svg   # régénère SVG carrousel + tous les PNG (nécessite playwright installé)
```

Le rendu utilise Chromium/Playwright pour charger les polices Google Fonts (Montserrat/Inter).

## 🛠️ API (facultatif)

- `POST /api/fiches` — enregistre une fiche client
- `GET /api/fiches?pass=MOTDEPASSE` — liste les fiches
- `GET /api/export/fiches.csv?pass=MOTDEPASSE` — export CSV

## 📢 Lancement

Tous les contenus prêts à publier sont dans **`posts-lancement.md`** : annonce, tuto carrousel, post diaspora, Reels TikTok, Story, témoignage et textes publicitaires.