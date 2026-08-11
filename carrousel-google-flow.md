# KALEFLEH — Carrousel + Import Google Flow

## 📐 Formats générés

| Fichier | Dimensions | Usage |
|---|---|---|
| `public/carrousel/slide-1.png` → `slide-6.png` | 1080×1080 | Carrousel FB/IG « Comment ça marche » (6 slides) |
| `public/affiche-carre.png` | 1080×1080 | Post annonce unique |
| `public/affiche-story.png` | 1080×1920 | Story IG/FB, TikTok |

Tous les `.svg` correspondants sont fournis pour une édition vectorielle illimitée.

---

## 🎨 Régénérer le carrousel (après modification du script)

```bash
node tools/generate-carousel.mjs
```
Puis re-convertir en PNG (Edge headless) comme indiqué dans l'historique de session / le script de rendu.

---

## ✍️ Remplacer les coordonnées

- `[NUMERO_WHATSAPP]` → ton numéro (dans `slide-6.png`, faute : régénérer `slide-6.svg` après édition)
- Autres textes : éditer les fichiers `.svg` puis re-rendre.

---

## 🤖 Prompts Google Flow (Nano Banana — image)

Si tu préfères régénérer les visuels en images AI via **labs.google/fx/flow** (mode « Bild erstellen » / Nano Banana Pro), copie-colle ces prompts, un par image :

### Prompt 1 — Cover carrousel
```
Professional e-commerce advertisement poster, square format. Dark charcoal to burnt orange gradient background with subtle floating circles. Centered orange text badge "KALEFLEH" in bold white logo. Big white headline "Commande tout ce que tu veux," with subheadline "depuis l'étranger ou en Côte d'Ivoire." Below: shopping tote bag icon, then text list "Vêtements · Cosmétiques · Perruques · Alimentaire" with small clothing, lipstick, wig and grocery emoji-style icons. Bottom orange button bar labeled "Remplir mon devis". Clean flat modern social media design, high contrast, no photo.
```

### Prompt 2 — Étape 1 : remplir la demande
```
Social media carousel slide, square. Dark charcoal to burnt orange gradient. Top orange badge "ÉTAPE 1". White headline "Tu commandes", orange subhead "Depuis l'étranger ou au pays, même sans temps". Center white panel with three lines: pencil icon "Remplis la fiche de devis en ligne", location pin "Pays, articles, budget, livraison", crossed-out document "Pas de documents administratifs". Bottom orange button "Je remplis la demande". Clean flat modern design.
```

### Prompt 3 — Étape 2 : devis
```
Social media carousel slide, square. Dark charcoal to burnt orange gradient. Top orange badge "ÉTAPE 2". Headline "On te calcule le devis", subhead "Tout est clair avant de commencer". Center panel: checkmark "Prestation KALEFLEH (déplacement)", parcel icon "Expédition par ta compagnie", bank card icon "Ou on te propose les frais". Money symbol accent. Bottom orange button "Recevoir mon devis". Clean flat design.
```

### Prompt 4 — Étape 3 : courses
```
Social media carousel slide, square. Dark charcoal to burnt orange gradient. Badge "ÉTAPE 3". Headline "On fait tes courses", subhead "Photos + reçus, rien ne se perd". Center panel: shopping cart icon, lines "Vêtements · Cosmétiques", "Perruques · Alimentaire", camera icon "On t'envoie tout en photos". Bottom orange button "Lancer ma course". Clean flat design.
```

### Prompt 5 — Étape 4 : expédition
```
Social media carousel slide, square. Dark charcoal to burnt orange gradient. Badge "ÉTAPE 4". Headline "Expédition & livraison", subhead "Par la compagnie de ton choix". Center panel: rocket icon "Ta compagnie favorite, direct", Côte d'Ivoire flag "Ou livraison via KALEFLEH", tracking pin "Suivi de l'expédition au bout du doigt". Bottom orange button "Je veux être livré". Clean flat design.
```

### Prompt 6 — CTA final
```
Social media carousel slide, square. Dark charcoal to burnt orange gradient. Badge "LANCEMENT". Headline "Passer commande ?", subhead "À l'étranger ou au pays, on s'occupe de tout". Center panel: phone icon "Devis en 2 minutes", WhatsApp bubble "WhatsApp : ton numéro ici". Bottom orange button "Envoyer ma demande". Clean flat modern design.
```

---

## 🎬 Prompts Google Flow (Veo 3.1 — vidéo) si tu veux un Reel

### Prompt Reel KALEFLEH (~24s, 3 segments de 8s)
Charge les keyframes générés (slide-1 comme image de départ) dans Flow mode « Video aus Frames » :

**Segment 1 (8s) :**
```
Slow dolly push toward a stylish young African woman in Abidjan walking through a colorful market carrying shopping bags full of clothes, wigs and cosmetics. She smiles at camera while holding up printed receipts. Warm golden-hour sunlight, busy vibrant market stalls in soft bokeh, energetic but smooth camera movement, photorealistic cinematic quality, friendly commercial tone.
```

**Segment 2 (8s) :**
```
Smooth lateral tracking shot following neatly packed cardboard boxes being sealed and labeled on a delivery table, stacks of parcels addressed for France and Canada visible. A hand attaches a shipping label reading "KALEFLEH". Bright clean studio light, orange and black branding accents, reassuring professional atmosphere, photorealistic commercial look.
```

**Segment 3 (8s) :**
```
Gentle crane-down reveal of a smiling woman opening a parcel in an apartment abroad, pulling out clothes and a wig, joy on her face. Around her family video-calls on a phone showing relatives in Abidjan waving. Soft warm interior light, emotional warm mood, shallow depth of field, photorealistic cinematic quality.
```

---

## 🔗 Ordre de publication du carrousel
1. slide-1 (cover) → **« Commande tout ce que tu veux, depuis l'étranger ou au pays »**
2. slide-2 → Étape 1 « Tu commandes »
3. slide-3 → Étape 2
4. slide-4 → Étape 3
5. slide-5 → Étape 4
6. slide-6 → CTA (avec ton numéro)

Légende du post : voir `posts-lancement.md` → **Post 2 (carrousel)**.