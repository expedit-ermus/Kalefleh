import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "public");
const URL = "https://kalefleh.vercel.app";

function enc(s) { return encodeURIComponent(s); }

function favicon() {
  return `  <link rel="icon" type="image/png" href="favicon-32.png" />
  <link rel="icon" type="image/svg+xml" href="favicon.svg" />
  <link rel="apple-touch-icon" href="apple-touch-icon.png" />`;
}

function head(meta) {
  const { slug, title, desc, robots } = meta;
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${desc}" />
  ${robots === "noindex" ? '  <meta name="robots" content="noindex" />\n' : ""}${favicon()}
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:url" content="${URL}/${slug}" />
  <meta property="og:image" content="${URL}/affiche-carre.png" />
  <meta property="og:locale" content="fr_FR" />
  <link rel="canonical" href="${URL}/${slug}" />
  <meta name="theme-color" content="#1C1208" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800;900&family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="style.css" />
</head>
<body>
<a href="#main-content" class="skip-link">Aller au contenu</a>`;
}

function nav() {
  return `
<nav class="navbar">
  <a href="index.html" class="navbar-logo">KALEFLEH</a>
  <div class="navbar-links" id="navbarLinks">
    <a href="tarifs.html" class="navbar-nowrap">Tarifs</a>
    <a href="suivi.html">Suivi</a>
    <a href="faq.html">FAQ</a>
    <a href="payer.html" class="navbar-nowrap">Payer</a>
    <a href="contact.html">Contact</a>
    <a href="index.html#devis" class="btn-nav">Devis gratuit</a>
  </div>
  <button type="button" class="navbar-burger" id="navbarBurger" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="navbarLinks">
    <span></span><span></span><span></span>
  </button>
</nav>`;
}

function footer() {
  return `
<footer class="footer">
  <div class="footer-grid">
    <div>
      <div class="footer-logo">KALEFLEH</div>
      <p>Tu commandes, on fait ta course en Côte d'Ivoire. À l'étranger ou au pays, sans stress.</p>
    </div>
    <div>
      <strong>Navigation</strong>
      <ul>
        <li><a href="index.html#temoignages">Avis</a></li>
        <li><a href="index.html#comment">Étapes</a></li>
        <li><a href="tarifs.html">Tarifs &amp; prestation</a></li>
        <li><a href="suivi.html">Suivi de commande</a></li>
        <li><a href="faq.html">Questions fréquentes</a></li>
        <li><a href="contact.html">Contact</a></li>
        <li><a href="index.html#devis">Devis gratuit</a></li>
      </ul>
    </div>
    <div>
      <strong>Nos courses</strong>
      <ul>
        <li><a href="niche-vetements.html">Vêtements</a></li>
        <li><a href="niche-cosmetiques.html">Cosmétiques</a></li>
        <li><a href="niche-perruques.html">Perruques &amp; cheveux</a></li>
        <li><a href="niche-alimentaire.html">Alimentaire</a></li>
      </ul>
    </div>
    <div>
      <strong>Infos &amp; légal</strong>
      <ul>
        <li><a href="livraison.html">Livraison &amp; expédition</a></li>
        <li><a href="payer.html">Payer mon avance</a></li>
        <li><a href="cgv.html">CGV</a></li>
        <li><a href="mentions-legales.html">Mentions légales</a></li>
      </ul>
    </div>
    <div>
      <strong>Contact</strong>
      <ul>
        <li><a href="mailto:kalefleh.shop@gmail.com">kalefleh.shop@gmail.com</a></li>
        <li><span>Côte d'Ivoire 🇨🇮 · Diaspora 🌍</span></li>
      </ul>
    </div>
  </div>
  <p class="footer-copy">© <span id="year"></span> KALEFLEH — Tu commandes, on fait tes courses.</p>
</footer>`;
}

function page(meta, body, opts = {}) {
  const sticky = opts.sticky === false ? "" : `
  <div class="sticky-cta"><a href="index.html#devis" class="btn-primary">Obtenir mon devis gratuit 🚀</a></div>`;
  return head(meta) + nav() + "\n\n<main class=\"wrap\" id=\"main-content\">\n" + body + "\n</main>\n" + sticky + footer() + "\n<script src=\"nav.js\" defer></script>\n<script src=\"year.js\"></script>\n</body>\n</html>\n";
}

function hero(ic, titleHtml, tagline, crumbsLabels, pills = []) {
  const crumbs = crumbsLabels.map((c, i) => (i < crumbsLabels.length - 1 ? `<a href="${c[1]}">${c[0]}</a> ·` : `<span>${c[0]}</span>`)).join(" ");
  return `  <header class="page-hero">
    <span class="niche-hero-ic">${ic}</span>
    <h1>${titleHtml}</h1>
    <p>${tagline}</p>
    ${pills.length ? `<div class="pill-row">${pills.map((p) => `<span class="pill">${p}</span>`).join("")}</div>` : ""}
    <div class="crumbs">${crumbs}</div>
  </header>`;
}

// ---------- NICHES ----------
const niches = [
  {
    slug: "niche-vetements.html",
    file: "niche-vetements.html",
    emoji: "👗",
    title: "Courses de vêtements en Côte d'Ivoire — faits par KALEFLEH",
    desc: "Pagne, wax, tissus, prêt-à-porter, chaussures, sacs et accessoires achetés pour toi au pays. Photos + reçus, expédition par ta compagnie. Devis gratuit.",
    h1: "Vêtements &amp; mode",
    h1Span: "achetés pour toi au pays",
    tagline: "Tu repères ce que tu veux — pagne, wax, boutique, tissu au marché — on te le trouve, on achète, et on t'envoie tout avec photos et reçus.",
    pills: ["👗 Prêt-à-porter", "🪡 Pagne &amp; wax", "👟 Chaussures", "👜 Sacs"],
    type: "Vêtements",
    budget: "",
    ok: [
      "Tissus, pagne et wax choisis avec toi (photo des motifs avant achat)",
      "Prêt-à-porter (tailles précises demandées avant le shopping)",
      "Chaussures et sacs (envoi des photos + pointure avant départ)",
      "Achat en boutique comme au marché (Sogeprix, Cap Sud, Adjamé, marchés de quartier…)",
      "Contrôle qualité : on vérifie l'état, on photographie, tu valides tout avant expédition"
    ],
    ko: [
      "Copies de marques connues vendues comme originales",
      "Pièces manifestement contrefaites",
      "Produits importés interdits en CI",
      "Documents administratifs (passeport, papiers…) — jamais"
    ],
    examples: [
      { em: "🪡", title: "Pagne & wax", p: "3 à 6 yards, motifs photo envoyée" },
      { em: "👗", title: "Robe prêt-à-porter", p: "Taille et couleur précises" },
      { em: "👟", title: "Baskets neuves", p: "Pointure + photos de la boîte" },
      { em: "👜", title: "Sac à main", p: "Marque, modèle, budget" },
      { em: "🧵", title: "Accessoires", p: "Bijoux, ceintures, écharpes" },
      { em: "👔", title: "Tenue homme/enfant", p: "Ensemble complet cohérent" }
    ],
    notes: "Pense à préciser les tailles, couleurs et boutiques préférées dans ton formulaire. Pour le tissu, envoie une photo du motif ou du dessin. Plus tu es précis, plus vite on achète juste.",
    cta: "Commander mes vêtements",
    topics: ["Shopping mode", "Marché & boutiques", "Achat vérifié"]
  },
  {
    slug: "niche-cosmetiques.html",
    file: "niche-cosmetiques.html",
    emoji: "💄",
    title: "Cosmétiques & parfums en Côte d'Ivoire — achetés par KALEFLEH",
    desc: "Parfums, soins visage et corps, maquillage, produits capillaire achetés au pays avec photos + reçus. Produits certifiés, pas de contrefaçons. Devis gratuit.",
    h1: "Cosmétiques &amp; parfums",
    h1Span: "sans mauvaise surprise",
    tagline: "Parfums, soins, maquillage… On achète exactement la référence demandée, dans des boutiques sérieuses, et tu valides les photos avant envoi.",
    pills: ["🌸 Parfums", "🧴 Soins du visage", "✨ Maquillage", "🫧 Hygiène"],
    type: "Cosmétiques",
    budget: "100000",
    ok: [
      "Parfums : référence exacte, envoi de la photo avant achat",
      "Soins visage et corps (sérum, crèmes, gommages)",
      "Maquillage professionnel et du quotidien (fond de teint, rouges à lèvres…)",
      "Produits d'entretien capillaire et pour la peau",
      "Achat dans des boutiques officielles et distributeurs agréés"
    ],
    ko: [
      "Contrefaçons « de contrefaçon » proposées à bas prix",
      "Produits expirés ou douteux",
      "Articles à base d'ingrédients interdits",
      "Documents administratifs — jamais"
    ],
    examples: [
      { em: "🌸", title: "Parfum signature", p: "Référence exacte en photo" },
      { em: "🧴", title: "Routine visage", p: "Nettoyant, sérum, crème" },
      { em: "💋", title: "Coffret maquillage", p: "Palette + rouges à lèvres" },
      { em: "🫧", title: "Soins cheveux", p: "Shampoings, masques, huiles" },
      { em: "🧼", title: "Hygiène & bain", p: "Savons, déodorants, cotons" },
      { em: "🎁", title: "Coffret cadeau", p: "Pour offrir bien emballé" }
    ],
    notes: "Pour les parfums et cosmétiques réglementés, précise le modèle exact et envoie si possible une photo du produit souhaité. On vérifie la date de péremption avant tout achat.",
    cta: "Commander mes cosmétiques",
    topics: ["Beauté", "Produits certifiés", "Photos avant achat"]
  },
  {
    slug: "niche-perruques.html",
    file: "niche-perruques.html",
    emoji: "💇🏾‍♀️",
    title: "Perruques & cheveux en Côte d'Ivoire — achetés par KALEFLEH",
    desc: "Perruques, mèches, tresses, bonnets et accessoires capillaires achetés pour toi. Conseil, photos + reçus, expédition. Devis gratuit.",
    h1: "Perruques &amp; cheveux",
    h1Span: "ton style, exactement",
    tagline: "Perruques prêtes à porter, mèches de qualité, bonnets, tresses… On choisit avec toi (photos avant), on achète et on t'envoie tout.",
    pills: ["💇🏾‍♀️ Perruques", "🧬 Mèches &amp; tresses", "🧢 Bonnets", "🪮 Accessoires"],
    type: "Perruques",
    budget: "200000",
    ok: [
      "Perruques (17 à 30 pouces, plusieurs textures disponibles)",
      "Mèches, extensions et tresses (qualité et origine précisées)",
      "Bonnets (tulle, soie), élastiques et accessoires",
      "Conseil et photos de la texture choisie avant achat",
      "Possibilité de combo perruques + vêtements + cosmétiques sur une seule course"
    ],
    ko: [
      "Chevelure vendue sciemment comme type A alors que ce n'est pas le cas (origine vérifiée)",
      "Achat sans ton accord si le modèle demandé n'existe plus",
      "Documents administratifs — jamais"
    ],
    examples: [
      { em: "👑", title: "Perruque lace front", p: "Texture, taille, couleur" },
      { em: "🧬", title: "12 pouces + franges", p: "Lot arrivé en bon état" },
      { em: "🧢", title: "Bonnets de soie", p: "3-4 couleur neutre" },
      { em: "🪮", title: "Peignes & accessoires", p: "Compléments stylo" },
      { em: "💆🏾‍♀️", title: "Soins capillaire", p: "Shampoings, huiles" },
      { em: "🎀", title: "Bandanas / foulards", p: "Pour protéger la coiffure" }
    ],
    notes: "La texture et la taille font tout. Indique la longueur en pouces, ta texture préférée et un budget max. On te montre les options avant d'acheter.",
    cta: "Commander ma perruque",
    topics: ["Coiffure", "Extensions", "Choix validé"]
  },
  {
    slug: "niche-alimentaire.html",
    file: "niche-alimentaire.html",
    emoji: "🛒",
    title: "Épicerie & alimentaire en Côte d'Ivoire — achetés par KALEFLEH",
    desc: "Épicerie de là-bas, denrées et paniers de famille achetés au pays plus les courses du marché. Produits périssables gérés avec soin. Devis gratuit.",
    h1: "Alimentaire &amp; épicerie",
    h1Span: "les saveurs de là-bas",
    tagline: "Attiéké, épices, huile, panier de la semaine ou colis de famille : on fait les courses au marché et en épicerie, avec dates de péremption vérifiées.",
    pills: ["🍚 Attiéké &amp; acadjou", "🧂 Épices", "🫙 Conserves", "🧺 Panier de famille"],
    type: "Alimentaire",
    budget: "100000",
    ok: [
      "Épicerie de là-bas : épices, huiles, conserves, produits d'origine CI",
      "Attiéké, poisson fumé/braisé et spécialités locales (arrangement selon disponibilité)",
      "Panier de famille : produits de base livrés chez les proches",
      "Courses de marché : fruits, légumes, vivriers au jour le jour",
      "Péremptions et état des emballages vérifiés avant achat"
    ],
    ko: [
      "Produits périmés ou emballages percés",
      "Frais périssables très sensibles sans accord sur le transport",
      "Alcools à forte cargaison au-delà du raisonnable",
      "Documents administratifs — jamais"
    ],
    examples: [
      { em: "🍚", title: "Attiéké & poisson", p: "Selon arrivage du jour" },
      { em: "🧂", title: "Épices + bouillon", p: "Pour cuisiner comme au pays" },
      { em: "🫙", title: "Huile & conserves", p: "Marques locales" },
      { em: "🍵", title: "Thé, sucre, café", p: "Standard de la famille" },
      { em: "🧺", title: "Panier famille", p: "Produits de base en quantité" },
      { em: "🍫", title: "Cadeaux gourmands", p: "Chocolats et douceurs locales" }
    ],
    notes: "Pour le frais et le périssable, on te confirme le jour de l'achat et on s'assure que la compagnie d'expédition soit rapide. Précise ton budget pour le panier de famille.",
    cta: "Commander mes vivres",
    topics: ["Épicerie", "Marché", "Colis famille"]
  }
];

function nichePage(n) {
  const body = `
  ${hero(n.emoji, `${n.h1}<br /><span>${n.h1Span}</span>`, n.tagline, [["Accueil", "index.html"], [n.title.split(" — ")[0], ""]], n.pills)}`;

  const typesLink = `index.html?type=${enc(n.type)}#devis`;
  const ctaLink = n.budget ? `${typesLink}&budget=${n.budget}` : typesLink;

  const out = body + `
  <section class="card">
    <p class="eyebrow">Notre service</p>
    <h2>Ce que fait KALEFLEH — et ce qu'on ne fait pas</h2>
    <div class="two-card">
      <div class="subcard">
        <h3>✅ On s'en occupe</h3>
        <ul>${n.ok.map((x) => `<li>${x}</li>`).join("")}</ul>
      </div>
      <div class="subcard non">
        <h3>✕ On ne fait pas</h3>
        <ul>${n.ko.map((x) => `<li>${x}</li>`).join("")}</ul>
      </div>
    </div>
  </section>

  <section class="card">
    <p class="eyebrow">Inspirations</p>
    <h2>Des idées de commande ${n.emoji}</h2>
    <ul class="example-grid">${n.examples.map((e) => `<li class="example"><span class="em">${e.em}</span><strong>${e.title}</strong><p>${e.p}</p></li>`).join("")}</ul>
    <p class="muted" style="margin-top:14px">${n.notes}</p>
  </section>

  <section class="card">
    <p class="eyebrow">Budget</p>
    <h2>Budget &amp; déroulé</h2>
    <ul class="list-dash">
      <li>Prestation : <b>8 000 F</b> (petite course) à <b>15 000 F</b> (course complète au marché).</li>
      <li>Avance demandée pour lancer les courses — le solde se règle à l'expédition.</li>
      <li>Photos + reçus à chaque étape, rien ne part sans ton accord.</li>
      <li>Expédition par ta compagnie (ASJ, Coris, Karwa, La Poste…) ou via nous.</li>
    </ul>
    <div class="center" style="margin-top:18px">
      <a href="${ctaLink}" class="btn-primary">${n.cta} →</a>
      <a href="tarifs.html" class="btn-outline btn-lg" style="color:var(--primary-dark);border-color:var(--primary-dark)">Voir les tarifs</a>
    </div>
  </section>
`;
  const meta = { slug: n.file, title: n.title, desc: n.desc };
  const html = page(meta, out) + `<!-- topics: ${n.topics.join(", ")} -->\n`;
  fs.writeFileSync(path.join(OUT, n.file), html, "utf8");
  console.log("✓ " + n.file);
}

// ---------- TARIFS ----------
function tarifsPage() {
  const body = `
  ${hero("💰", "Tarifs &amp; prestation<br /><span>simples, sans surprise</span>", "On paie la course (déplacement). L'expédition est en plus, à ta charge — par ta compagnie ou via nous.", [["Accueil", "index.html"], ["Tarifs", ""]])}
  <section class="card">
    <p class="eyebrow">La prestation</p>
    <h2>Prestation KALEFLEH</h2>
    <p class="muted">La prestation rémunère nos déplacements et le temps passé : shopping, marché, contrôle, photos, envoi.</p>
    <div class="price-grid">
      <div class="price"><strong>8 000 F</strong><span>Petite course</span><p>3 à 5 petits articles — une zone (Abidjan)</p></div>
      <div class="price price-hot"><span class="pop">★ Le plus choisi</span><strong>15 000 F</strong><span>Course complète</span><p>Multi-boutiques, marché, plusieurs villes à l'intérieur</p></div>
      <div class="price"><strong>Sur devis</strong><span>Grosse commande</span><p>Plusieurs livraisons, différentes villes, gros volumes</p></div>
    </div>
    <p class="muted" style="font-size:.85rem">La prestation exacte est confirmée au devis, avant toute avance. Aucun coût pour la demande.</p>
  </section>

  <section class="card">
    <p class="eyebrow">L'expédition</p>
    <h2>Expédition (à ta charge)</h2>
    <p class="muted">Tu choisis ta compagnie préférée, ou on s'en occupe pour toi au meilleur tarif du moment. Les tarifs varient au poids et selon la destination.</p>
    <div class="tbl-wrap">
      <table class="tb">
        <thead><tr><th>Type de colis</th><th>Poids indicatif</th><th>Délai indicatif</th><th>Prix indicatif</th></tr></thead>
        <tbody>
          <tr><td>Petit colis (vêtements, accessoires)</td><td>&lt; 5 kg</td><td>5 à 10 jours</td><td>à partir de <b>15 000 F</b></td></tr>
          <tr><td>Colis moyen (perruques, cosmétiques)</td><td>5 – 15 kg</td><td>7 à 14 jours</td><td>à partir de <b>35 000 F</b></td></tr>
          <tr><td>Gros colis / famille</td><td>15 – 30 kg</td><td>10 à 21 jours</td><td>à partir de <b>65 000 F</b></td></tr>
          <tr><td>Intérieur du pays (CI)</td><td>variable</td><td>2 à 5 jours</td><td>selon distance</td></tr>
        </tbody>
      </table>
    </div>
    <p class="muted" style="font-size:.85rem;margin-top:10px">Montants et compagnies (ASJ, Coris, Karwa, La Poste…) confirmés à la pesée. Si tu as un compte voyageur, envoie-lui juste nos coordonnées : c'est encore moins cher.</p>
  </section>

  <section class="card">
    <p class="eyebrow">Le paiement</p>
    <h2>Paiement : avance puis solde</h2>
    <ol class="pay-steps">
      <li class="pay-step"><span class="n">1</span><strong>Avance</strong><p>Pour lancer les achats (Wave, Orange, MTN, Moov, virement)</p></li>
      <li class="pay-step"><span class="n">2</span><strong>Courses + preuves</strong><p>On achète, tu reçois photos et reçus</p></li>
      <li class="pay-step"><span class="n">3</span><strong>Expédition + solde</strong><p>Tu valides, on envoie, tu règles le reste</p></li>
    </ol>
    <div class="center" style="margin-top:18px">
      <a href="payer.html" class="btn-primary">Déclarer une avance →</a>
      <a href="index.html#devis" class="btn-outline btn-lg" style="color:var(--primary-dark);border-color:var(--primary-dark)">Demander un devis</a>
    </div>
  </section>`;
  const meta = { slug: "tarifs.html", title: "Tarifs & prestation KALEFLEH — courses en Côte d'Ivoire", desc: "Prestation de course 8 000 à 15 000 F, expédition à la charge du client, paiement en avance puis solde. Devis gratuit, sans engagement." };
  fs.writeFileSync(path.join(OUT, "tarifs.html"), page(meta, body), "utf8");
  console.log("✓ tarifs.html");
}

// ---------- FAQ ----------
function faqPage() {
  const qa = [
    ["Je suis à l'étranger, comment je paie ?", "Wave, Orange Money, MTN MoMo, Moov ou virement international (Western Union…). Tu verses une avance pour lancer les courses, puis le solde à l'expédition. Tu peux déclarer ton avance depuis la page « Payer mon avance »."],
    ["Comment mes articles sont-ils expédiés ?", "Par la compagnie de ton choix (ASJ, Coris, Karwa, La Poste…) ou via KALEFLEH. Dans ce cas on te propose le meilleur tarif du moment à la pesée."],
    ["J'aurai une preuve d'achat ?", "Oui. Photos + reçus à chaque étape, avant toute expédition. Rien ne part sans ton accord."],
    ["Quelle est la prestation ?", "8 000 F pour une petite course (3 à 5 petits articles), 15 000 F pour une course complète au marché ou multi-boutiques, sur devis pour une grosse commande. L'expédition est en plus."],
    ["Faut-il payer la demande de devis ?", "Non. La demande est gratuite et sans engagement. Ça prend 2 minutes et on te répond vite sur WhatsApp."],
    ["Combien de temps ça prend ?", "Les courses se font en 1 à 3 jours après l'avance. L'expédition dépend de la compagnie : 5 à 10 jours pour un petit colis, jusqu'à 3 semaines pour un gros colis."],
    ["Est-ce que ça marche aussi si je suis au pays ?", "Oui. On fait la course en ville (Abidjan ou zone convenue) et on t'envoie le colis en ville ou en région par transport."],
    ["Quels types de courses faites-vous ?", "On fait : vêtements et accessoires, cosmétiques réglementés et parfums, perruques et extensions, alimentaire et épicerie. C'est tout — on est spécialisés, pas généralistes."],
    ["Pourquoi ne faites-vous pas les documents administratifs ?", "On fait des courses et du shopping, pas des démarches. Pour ta sécurité et la nôtre, on refuse tout ce qui n'est pas une course."],
    ["Qu'est-ce qui garantit ma confiance ?", "Tu reçois des photos et des reçus à chaque étape, tu valides tout avant l'expédition, et le suivi de commande est accessible en ligne via ta référence."],
    ["Puis-je suivre ma commande ?", "Oui : avec la référence KF-… que tu reçois après ta demande, va sur la page « Suivi ». Tu vois le statut et tu peux nous écrire directement."],
    ["Comment commander ?", "Remplis le formulaire en 2 minutes (index « Devis gratuit ») ou passe par la page de la catégorie que tu veux : vêtements, cosmétiques, perruques ou alimentaire."],
    ["Que se passe-t-il si l'article n'existe plus ?", "On te prévient avec une alternative ou une photo de remplacement. Rien n'est acheté sans ton accord."],
    ["Livrez-vous à la diaspora ?", "On achète au pays et on expédie partout : France, Canada, USA, UK et reste du monde via compagnie ou compte voyageur."]
  ];
  const details = qa.map(([q, a], i) => `<details${i === 0 ? " open" : ""}><summary>${q}</summary><p>${a}</p></details>`).join("\n");
  const body = `
  ${hero("❓", "Questions fréquentes<br /><span>tout ce qu'il faut savoir</span>", "Paiement, expédition, délais, confiance. Si ta question n'est pas là, écris-nous : on répond vite.", [["Accueil", "index.html"], ["FAQ", ""]], ["Paiement", "Expédition", "Délais", "Confiance"])}
  <section class="card">
    <p class="eyebrow">FAQ</p>
    <h2>Les questions qu'on nous pose</h2>
    ${details}
    <div class="center" style="margin-top:18px">
      <a href="index.html#devis" class="btn-primary">J'ai une commande en tête →</a>
      <a href="contact.html" class="btn-outline btn-lg" style="color:var(--primary-dark);border-color:var(--primary-dark)">Poser une autre question</a>
    </div>
  </section>`;
  const meta = { slug: "faq.html", title: "Questions fréquentes KALEFLEH — courses en Côte d'Ivoire", desc: "Paiement (Wave, Orange, MTN, Moov), expédition, délais, prestation, suivi de commande : toutes les réponses sur le service de courses KALEFLEH." };
  fs.writeFileSync(path.join(OUT, "faq.html"), page(meta, body), "utf8");
  console.log("✓ faq.html");
}

// ---------- LIVRAISON ----------
function livraisonPage() {
  const body = `
  ${hero("📦", "Livraison &amp; expédition<br /><span>de l'achat à tes mains</span>", "On achète, tu valides, on envoie. Ta compagnie ou la nôtre, avec photos et reçus à chaque étape.", [["Accueil", "index.html"], ["Livraison", ""]])}
  <section class="card">
    <p class="eyebrow">Le déroulé</p>
    <h2>Comment ça se passe</h2>
    <ol class="pay-steps">
      <li class="pay-step"><span class="n">1</span><strong>Courses + photos</strong><p>On achète, tu valides tout avant envoi</p></li>
      <li class="pay-step"><span class="n">2</span><strong>Emballage soigné</strong><p>Colis protégé, pesé, étiqueté</p></li>
      <li class="pay-step"><span class="n">3</span><strong>Expédition</strong><p>Ta compagnie (ou la nôtre) jusqu'à ta porte</p></li>
    </ol>
  </section>

  <section class="card">
    <p class="eyebrow">Expédition</p>
    <h2>Compagnies et délais indicatifs</h2>
    <div class="tbl-wrap">
      <table class="tb">
        <thead><tr><th>Destination</th><th>Compagnies usuelles</th><th>Délai</th></tr></thead>
        <tbody>
          <tr><td>Abidjan / intérieur CI</td><td>ASJ, Coris, Karwa, La Poste, gbaka-brousse</td><td>2 à 5 jours</td></tr>
          <tr><td>France</td><td>ASJ, Coris, Karwa, La Poste, compte voyageur</td><td>5 à 10 jours</td></tr>
          <tr><td>Canada</td><td>ASJ, Coris, Karwa, compte voyageur</td><td>7 à 14 jours</td></tr>
          <tr><td>USA / Royaume-Uni</td><td>Schaffer, ASJ, compte voyageur</td><td>10 à 21 jours</td></tr>
          <tr><td>Autre pays</td><td>Selon disponibilité</td><td>sur devis</td></tr>
        </tbody>
      </table>
    </div>
    <p class="muted" style="font-size:.85rem;margin-top:10px">Les délais sont indicatifs et dépendent de la compagnie. Si tu as un compte voyageur en partance, on peut lui remettre le colis directement : plus rapide et moins cher.</p>
  </section>

  <section class="card">
    <p class="eyebrow">En cas de souci</p>
    <h2>Retraits, retours &amp; litiges</h2>
    <ul class="list-dash">
      <li>Les articles sont photographiés avant l'achat et avant l'expédition : le colis part en l'état validé.</li>
      <li>Si un article est défectueux à la réception (endommagé au transport), prens des photos et écris-nous sur la page Suivi sous 48 h.</li>
      <li>Les perruques, cosmétiques et produits d'hygiène ne sont pas repris après expédition, sauf vices apparents.</li>
      <li>L'avance est non remboursable une fois les courses achetées (elles sont faites pour toi).</li>
      <li>En cas de problème avec la compagnie (perte, casse), on t'accompagne dans la réclamation auprès de la compagnie concernée.</li>
    </ul>
    <div class="center" style="margin-top:18px">
      <a href="suivi.html" class="btn-primary">Suivre ma commande →</a>
    </div>
  </section>`;
  const meta = { slug: "livraison.html", title: "Livraison & expédition KALEFLEH — comment tu reçois", desc: "Expédition par ta compagnie (ASJ, Coris, Karwa, La Poste) ou via KALEFLEH : délais indicatifs, retraits et retours, carte et suivi." };
  fs.writeFileSync(path.join(OUT, "livraison.html"), page(meta, body), "utf8");
  console.log("✓ livraison.html");
}

// ---------- CONTACT ----------
function contactPage() {
  const body = `
  ${hero("✉️", "Contact &amp; questions<br /><span>on te répond vite</span>", "Une question, une précision, un devis ? Passe par le formulaire ou écris-nous directement.", [["Accueil", "index.html"], ["Contact", ""]])}
  <section class="card">
    <p class="eyebrow">Nous joindre</p>
    <h2>Les meilleurs canaux</h2>
    <div class="contact-grid">
      <div class="contact-card"><span class="ic">📱</span><strong>WhatsApp</strong><a href="https://wa.me/[NUMERO_WHATSAPP]">Écrire sur WhatsApp</a><p>La réponse la plus rapide</p></div>
      <div class="contact-card"><span class="ic">📋</span><strong>Demande de devis</strong><a href="index.html#devis">Remplir le formulaire →</a><p>Gratuit, 2 minutes, sans engagement</p></div>
      <div class="contact-card"><span class="ic">📦</span><strong>Suivi de commande</strong><a href="suivi.html">Suivre ma référence →</a><p>Avec ta réf KF-…</p></div>
      <div class="contact-card"><span class="ic">💳</span><strong>Paiement d'avance</strong><a href="payer.html">Déclarer mon avance →</a><p>Wave, Orange, MTN, Moov</p></div>
    </div>
    <p class="muted" style="margin-top:14px;text-align:center">Email : <a href="mailto:kalefleh.shop@gmail.com">kalefleh.shop@gmail.com</a> · Côte d'Ivoire 🇨🇮 · Diaspora 🌍</p>
  </section>

  <section class="card">
    <p class="eyebrow">Disponibilité</p>
    <h2>Horaires indicatifs</h2>
    <div class="tbl-wrap">
      <table class="tb">
        <thead><tr><th>Jour</th><th>Disponibilité</th></tr></thead>
        <tbody>
          <tr><td>Lundi – Samedi</td><td>8h00 – 20h00 (GMT+0 / heure d'Abidjan)</td></tr>
          <tr><td>Dimanche</td><td>Courses urgentes uniquement</td></tr>
        </tbody>
      </table>
    </div>
  </section>`;
  const meta = { slug: "contact.html", title: "Contact KALEFLEH — WhatsApp, devis, suivi", desc: "Contacte KALEFLEH par WhatsApp, par email ou via le formulaire de devis gratuit. Suivi de commande et paiement d'avance en ligne." };
  fs.writeFileSync(path.join(OUT, "contact.html"), page(meta, body), "utf8");
  console.log("✓ contact.html");
}

// ---------- PAIER ----------
function payerPage() {
  const body = `
  ${hero("💳", "Payer mon avance<br /><span>lancer mes courses</span>", "Déclare ton avance en ligne : on prépare tes courses dès réception, puis on te le confirme. Tu reçois une trace dans ton suivi.", [["Accueil", "index.html"], ["Payer", ""]])}
  <section class="card form-card">
    <div class="form-head">
      <h2>Déclarer mon avance</h2>
      <p>Réf de commande (KF-…) · montant · moyen de paiement. 30 secondes.</p>
    </div>
    <form id="payForm" novalidate>
      <input type="text" id="payWebsite" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" class="hp-field" />
      <div class="form-block">
        <h3>1. Ta commande</h3>
        <div class="grid">
          <label>Référence (KF-…)
            <input type="text" id="payRef" placeholder="KF-XXXXXXXX" required />
          </label>
          <label>Montant de l'avance (FCFA)
            <input type="number" id="payMontant" min="1000" step="500" placeholder="Ex : 25 000" required />
          </label>
        </div>
      </div>
      <fieldset class="form-block fieldset">
        <legend class="legend-title">2. Moyen de paiement envoyé</legend>
        <div class="method-grid">
          <label class="method"><input type="radio" name="methode" value="Wave" checked /> <span class="m-ic">🌊</span><div>Wave <span class="m-note">Transfert instantané</span></div></label>
          <label class="method"><input type="radio" name="methode" value="Orange Money" /> <span class="m-ic">🟠</span><div>Orange Money <span class="m-note">Dispo tout CI</span></div></label>
          <label class="method"><input type="radio" name="methode" value="MTN MoMo" /> <span class="m-ic">🟡</span><div>MTN MoMo <span class="m-note">Transfert mobile</span></div></label>
          <label class="method"><input type="radio" name="methode" value="Moov Money" /> <span class="m-ic">🔵</span><div>Moov Money <span class="m-note">Transfert mobile</span></div></label>
          <label class="method"><input type="radio" name="methode" value="Virement international (Western Union…)" /> <span class="m-ic">🌐</span><div>Virement international <span class="m-note">Western Union, OM/MTN diaspora…</span></div></label>
        </div>
      </fieldset>
      <div class="form-block">
        <h3>3. Ton numéro (pour te confirmer)</h3>
        <label class="full">Téléphone / WhatsApp
          <input type="tel" id="payTel" placeholder="+225 07 07 07 07 07" />
        </label>
      </div>
      <div class="form-cta">
        <button type="submit" class="btn-primary btn-submit">Déclarer mon avance</button>
        <p class="form-status" id="payStatus" role="status"></p>
      </div>
    </form>

    <div id="payOk" hidden style="margin-top:18px">
      <div class="instruction-box">
        <h3>✅ Avance enregistrée</h3>
        <p>Ton numéro de suivi reste le même : <strong id="okRef" class="big"></strong></p>
        <p id="okResume" style="color:#ffe7c9"></p>
        <p>On démarre tes <b>courses dès confirmation du virement</b>. Une trace de cette déclaration a été ajoutée à ton suivi.</p>
        <a id="okWa" href="#" target="_blank" rel="noopener" class="copy" style="color:#fff">📱 Confirmer sur WhatsApp</a>
        <a href="suivi.html" class="copy" style="color:#fff">📦 Voir mon suivi</a>
      </div>
      <input type="hidden" id="payWhatsappAdmin" value="[NUMERO_WHATSAPP]" />
    </div>
  </section>`;
  const meta = { slug: "payer.html", title: "Payer mon avance en ligne — KALEFLEH", desc: "Déclare ton avance en ligne (Wave, Orange Money, MTN MoMo, Moov) pour lancer tes courses au pays. Trace ajoutée à ton suivi de commande." };
  const html = head(meta) + nav() + "\n\n<main class=\"wrap\" id=\"main-content\">\n" + body + "\n</main>\n" + footer() + "\n<script src=\"nav.js\" defer></script>\n<script src=\"year.js\"></script>\n<script src=\"payer.js\"></script>\n</body>\n</html>\n";
  fs.writeFileSync(path.join(OUT, "payer.html"), html, "utf8");
  console.log("✓ payer.html");
}

// ---------- LEGALES ----------
function legalPages() {
  const cgvBody = `
  ${hero("📋", "Conditions générales<br /><span>claires et honnêtes</span>", "Comment on travaille ensemble : commande, prestation, paiement, expédition, responsabilités. À lire avant de commander.", [["Accueil", "index.html"], ["CGV", ""]])}
  <section class="card prose">
    <p class="updated">Dernière mise à jour : <time datetime="2026-08">août 2026</time></p>
    <h2>1. Objet</h2>
    <p>KALEFLEH propose un service de courses et de shopping en Côte d'Ivoire pour le compte de clients résidant en Côte d'Ivoire ou à l'étranger (diaspora). Le présent document encadre la demande de devis, la prestation de courses, le paiement et l'expédition.</p>
    <h2>2. Demande de devis</h2>
    <p>La demande de devis est gratuite et sans engagement. Elle est effectuée via le formulaire du site, ou directement par WhatsApp ou téléphone. Une fiche de commande avec référence unique (KF-…) est créée.</p>
    <h2>3. Prestation</h2>
    <p>Le service couvert est la réalisation de courses : achats de vêtements et accessoires, cosmétiques réglementés, perruques et extensions, et alimentaire. KALEFLEH n'effectue pas de démarches administratives et refuse les produits interdits ou non conformes.</p>
    <h2>4. Prix et paiement</h2>
    <p>Le coût de la prestation (déplacement) est indiqué au devis : 8 000 F pour une petite course, 15 000 F pour une course complète, montant sur devis pour une grosse commande. L'expédition est à la charge du client. Le client verse une avance pour lancer les achats, le solde étant réglé à l'expédition. Moyens acceptés : Wave, Orange Money, MTN MoMo, Moov Money, virement international, espèces.</p>
    <h2>5. Validation et photos</h2>
    <p>Les articles sont photographiés avant achat et avant expédition. Aucun achat n'est réalisé sans accord du client ; en cas d'indisponibilité, KALEFLEH propose une alternative. Le client valide les photos et le choix de la compagnie d'expédition avant l'envoi.</p>
    <h2>6. Expédition</h2>
    <p>L'expédition est réalisée par la compagnie de transport choisie par le client, ou par une compagnie proposée par KALEFLEH. Les délais et tarifs sont indicatifs et dépendent du transporteur. KALEFLEH n'est pas le transporteur et ne saurait être tenu responsable des délais ou dommages imputables à la compagnie retenue, hors accompagnement de la réclamation.</p>
    <h2>7. Retours et réclamations</h2>
    <p>Les produits périssables, cosmétiques et perruques ne sont pas repris après expédition, sauf vices apparents. Toute réclamation doit être adressée sous 48 h après réception, avec photos, via la page Suivi de commande.</p>
    <h2>8. Avance</h2>
    <p>L'avance permet de lancer les achats. Une fois les courses effectuées, elle n'est pas remboursable. En cas d'annulation avant achat, l'avance est restituée, déduction des frais réellement engagés (déplacement, emballage).</p>
    <h2>9. Responsabilité</h2>
    <p>KALEFLEH s'engage à acheter les articles conformément à la demande et à vérifier leur état. KALEFLEH ne garantit pas la disponibilité exacte des références ni l'absence de variations de qualité entre lots. En cas de litige, les parties recherchent prioritairement une solution amiable.</p>
    <h2>10. Contact</h2>
    <p>Pour toute question : <a href="contact.html">page Contact</a> ou email <a href="mailto:kalefleh.shop@gmail.com">kalefleh.shop@gmail.com</a>.</p>
  </section>`;
  fs.writeFileSync(path.join(OUT, "cgv.html"), page({ slug: "cgv.html", title: "Conditions générales KALEFLEH", desc: "Conditions générales du service de courses et shopping KALEFLEH : prestation, paiement, expédition, retours et responsabilité." }, cgvBody), "utf8");
  console.log("✓ cgv.html");

  const mlBody = `
  ${hero("⚖️", "Mentions légales<br /><span>qui sommes-nous</span>", "Informations éditeur, hébergement et données personnelles du site KALEFLEH.", [["Accueil", "index.html"], ["Mentions légales", ""]])}
  <section class="card prose">
    <p class="updated">Dernière mise à jour : <time datetime="2026-08">août 2026</time></p>
    <h2>Éditeur</h2>
    <p>KALEFLEH — Service de courses et shopping en Côte d'Ivoire.<br />Email : <a href="mailto:kalefleh.shop@gmail.com">kalefleh.shop@gmail.com</a> · WhatsApp : voir <a href="contact.html">page Contact</a>.</p>
    <h2>Hébergement</h2>
    <p>Le site est hébergé par <b>Vercel Inc.</b> (340 S Lemon Ave #4133, Walnut, CA 91789, USA). Les données de commande sont stockées sur Vercel Blob.</p>
    <h2>Données personnelles</h2>
    <p>Les données collectées via le formulaire de devis (nom, téléphone, email facultatif, adresse de livraison) servent uniquement à traiter ta demande de devis et ta commande. Elles ne sont jamais revendues ni transmises à des tiers, hors transporteur pour la livraison du colis.</p>
    <p>Tu peux demander la rectification ou la suppression de tes données à tout moment : <a href="mailto:kalefleh.shop@gmail.com">kalefleh.shop@gmail.com</a>.</p>
    <h2>Cookies et mesure d'audience</h2>
    <p>Le site n'utilise pas de cookies publicitaires. Une mesure d'audience anonyme peut être utilisée pour améliorer le service.</p>
    <h2>Propriété intellectuelle</h2>
    <p>Le nom KALEFLEH, le logotype et l'ensemble des contenus du site (textes, visuels) sont la propriété de KALEFLEH. Toute reproduction sans accord est interdite.</p>
    <h2>Liens et responsabilité</h2>
    <p>Le site peut contenir des liens vers des sites tiers (WhatsApp, compagnies de transport). KALEFLEH n'est pas responsable du contenu de ces sites.</p>
  </section>`;
  fs.writeFileSync(path.join(OUT, "mentions-legales.html"), page({ slug: "mentions-legales.html", title: "Mentions légales KALEFLEH", desc: "Mentions légales du site KALEFLEH : éditeur, hébergement (Vercel), données personnelles et propriété intellectuelle." }, mlBody), "utf8");
  console.log("✓ mentions-legales.html");
}

niches.forEach(nichePage);
tarifsPage();
faqPage();
livraisonPage();
contactPage();
payerPage();
legalPages();
console.log("Toutes les pages régénérées avec succès.");
