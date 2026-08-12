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
| `public/*.html` | Pages du site : niches (vêtements, cosmétiques, perruques, alimentaire), tarifs, FAQ, livraison, contact, payer, CGV, mentions légales |
| `public/style.css` | Styles (identité visuelle charte : Ambre `#E86A00`, Charbon `#1C1208`, Crème `#F7F1E7`) |
| `public/app.js` | Devis express : estimation live du budget, envoi de la fiche, pré-remplissage via URL (`?type=…&budget=…&pays=…&ville=…`) |
| `public/admin.html` | Espace admin : consulter / modifier / exporter les fiches clients |
| `public/suivi.html` | Suivi de commande en ligne (statut + timeline + écrire à KALEFLEH) |
| `public/payer.html` | Déclaration d'avance en ligne (Wave, Orange, MTN, Moov) → ajoutée au suivi |
| `tools/generate-pages.mjs` | **Générateur des pages internes** (shell nav/footer commun + contenu). Après édition → `node tools/generate-pages.mjs` |
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
- Lien vers toutes les pages : `http://localhost:3000/tarifs.html`, `faq.html`, `payer.html`, `niche-vetements.html`, etc.

## 🧭 Pages du site

| Page | Rôle |
|---|---|
| `/` | Landing : devis express, FAQ, fin de la conversion |
| `/niche-vetements.html`, `/niche-cosmetiques.html`, `/niche-perruques.html`, `/niche-alimentaire.html` | Pages par catégorie → CTA pré-remplissant le devis (`?type=…&budget=…`) |
| `/tarifs.html` | Prestation (8 000/15 000 F) + barème d'expédition indicatif |
| `/faq.html` | Questions fréquentes enrichie |
| `/livraison.html` | Expédition, délais, retours / réclamations |
| `/payer.html` | Déclaration d'avance en ligne (Wave, Orange, MTN, Moov) |
| `/suivi.html` | Suivi de commande (statut + timeline + message) |
| `/contact.html` | Contact WhatsApp / devis / support |
| `/cgv.html`, `/mentions-legales.html` | Pages légales |

> **Génération des pages** : le shell (navbar + footer + héros) et le contenu des pages internes sont produits par `tools/generate-pages.mjs`. Édite ce fichier puis `cd kalefleh && node tools/generate-pages.mjs`.

## 🎨 Pré-remplissage du devis par URL

Les pages niches et publicités peuvent cibler le formulaire avec des paramètres :

```
index.html?type=Vêtements,Perruques&budget=100000&pays=France&ville=Paris#devis
```

Reconnus : `type` (valeurs du formulaire, séparées par des virgules), `budget` (FCFA), `pays`, `ville`, `nom`, `tel`, `email`.

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

Avant de partager les posts : remplace dans `posts-lancement.md`, `public/index.html`, `tools/generate-pages.mjs` (puis relance `node tools/generate-pages.mjs`) et les SVG (`.svg`) :
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
- `GET /api/fiches/:ref/statut` — statut + timeline public (sans mot de passe)
- `POST /api/fiches/:ref/messages` — message client (ajouté au journal)
- `POST /api/fiches/:ref/paiement` — déclaration d'avance (ajoutée au journal)
- `PATCH /api/fiches/:ref?pass=…` — statut / avance / total / note (admin)
- `DELETE /api/fiches/:ref?pass=…` — suppression (admin)
- `GET /api/export/fiches.csv?pass=MOTDEPASSE` — export CSV

## 📢 Lancement

Tous les contenus prêts à publier sont dans **`posts-lancement.md`** : annonce, tuto carrousel, post diaspora, Reels TikTok, Story, témoignage et textes publicitaires.