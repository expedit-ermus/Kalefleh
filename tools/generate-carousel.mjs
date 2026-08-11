import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "public", "carrousel");

const SHEET = `@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');`;

function render(s) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <defs>
    <style>${SHEET}
      .k { font-family:'Montserrat',Arial,sans-serif; }
      .b { font-family:'Inter',"Segoe UI",Arial,sans-serif; }
    </style>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1C1208"/>
      <stop offset="0.55" stop-color="#3A1D00"/>
      <stop offset="1" stop-color="#5A2C00"/>
    </linearGradient>
    <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#E86A00"/>
      <stop offset="1" stop-color="#FFA64D"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1080" fill="url(#bg)"/>
  <circle cx="980" cy="120" r="170" fill="#ffffff" opacity="0.05"/>
  <circle cx="60" cy="980" r="200" fill="#E86A00" opacity="0.12"/>

  <text x="540" y="105" class="k" font-size="26" font-weight="700" letter-spacing="3" fill="#FFCF9E" text-anchor="middle">KALEFLEH</text>
  <rect x="210" y="145" width="660" height="74" rx="16" fill="url(#bar)"/>
  <text x="540" y="194" class="k" font-size="30" font-weight="800" fill="#1C1208" text-anchor="middle">${s.tag}</text>

  <text x="540" y="330" class="k" font-size="${s.big ? 88 : 62}" font-weight="900" fill="#FFFFFF" text-anchor="middle">${s.title}</text>
  <text x="540" y="${s.big ? 405 : 405}" class="b" font-size="${s.big ? 40 : 34}" font-weight="600" fill="#FFCF9E" text-anchor="middle">${s.subtitle}</text>
  <rect x="350" y="${s.big ? 470 : 455}" width="380" height="8" rx="4" fill="url(#bar)"/>

  <rect x="90" y="${s.big ? 520 : 530}" width="900" height="290" rx="22" fill="#FFFFFF" opacity="0.08"/>
  <text x="540" y="${s.big ? 600 : 630}" class="${s.big ? 'b' : 'b'}" font-size="${s.big ? 60 : 30}" font-weight="${s.big ? 700 : 600}" fill="#FFFFFF" text-anchor="middle">
    ${s.body}
  </text>

  <rect x="330" y="940" width="420" height="90" rx="18" fill="url(#bar)"/>
  <text x="540" y="998" class="k" font-size="28" font-weight="800" fill="#1C1208" text-anchor="middle">${s.cta}</text>
</svg>`;
}

const slides = [
  {
    tag: "COURSES & SHOPPING",
    title: "Commande tout ce que tu veux,",
    subtitle: "depuis l'étranger ou en Côte d'Ivoire.",
    big: true,
    body: "<tspan x='540' dy='0' font-size='90'>🛍️</tspan><tspan x='540' dy='80' font-size='30'>👗 Vêtements · 💄 Cosmétiques</tspan><tspan x='540' dy='56' font-size='30'>💇🏾‍♀️ Perruques · 🛒 Alimentaire</tspan>",
    cta: "Remplir mon devis 👉"
  },
  {
    tag: "ÉTAPE 1",
    title: "Tu commandes",
    subtitle: "Depuis l'étranger ou au pays, même sans temps.",
    big: false,
    body: "<tspan x='540' dy='0' class='b'>📱 Remplis la fiche de devis en ligne</tspan><tspan x='540' dy='52' class='b'>📍 Pays, articles, budget, livraison</tspan><tspan x='540' dy='52' class='b'>🚫 Pas de documents administratifs</tspan>",
    cta: "Je remplis la demande"
  },
  {
    tag: "ÉTAPE 2",
    title: "On te calcule le devis",
    subtitle: "Tout est clair avant de commencer.",
    big: false,
    body: "<tspan x='540' dy='0' class='b'>✅ Prestation KALEFLEH (déplacement)</tspan><tspan x='540' dy='52' class='b'>📦 + Expédition par ta compagnie</tspan><tspan x='540' dy='52' class='b'>💳 Ou on te propose les frais</tspan>",
    cta: "Recevoir mon devis"
  },
  {
    tag: "ÉTAPE 3",
    title: "On fait tes courses",
    subtitle: "Photos + reçus, rien ne se perd.",
    big: false,
    body: "<tspan x='540' dy='0' class='b'>👗 Vêtements · 💄 Cosmétiques</tspan><tspan x='540' dy='52' class='b'>💇🏾‍♀️ Perruques · 🛒 Alimentaire</tspan><tspan x='540' dy='52' class='b'>📸 On t'envoie tout en photos</tspan>",
    cta: "Lancer ma course"
  },
  {
    tag: "ÉTAPE 4",
    title: "Expédition & livraison",
    subtitle: "Par la compagnie de ton choix.",
    big: false,
    body: "<tspan x='540' dy='0' class='b'>🚀 Ta compagnie favorite, direct</tspan><tspan x='540' dy='52' class='b'>🇨🇮 Ou livraison via KALEFLEH</tspan><tspan x='540' dy='52' class='b'>🎯 Suivi de l'expédition au bout du doigt</tspan>",
    cta: "Je veux être livré"
  },
  {
    tag: "LANCEMENT",
    title: "Passer commande ?",
    subtitle: "À l'étranger ou au pays, on s'occupe de tout.",
    big: false,
    body: "<tspan x='540' dy='0' class='b'>📲 Devis en 2 minutes</tspan><tspan x='540' dy='52' class='b'>💬 WhatsApp : [NUMERO_WHATSAPP]</tspan>",
    cta: "Envoyer ma demande"
  }
];

for (let i = 0; i < slides.length; i++) {
  const file = path.join(OUT, `slide-${i + 1}.svg`);
  fs.writeFileSync(file, render(slides[i]));
  console.log("ok", file);
}