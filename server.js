const express = require("express");
const path = require("path");
const fs = require("fs");
const { put, get } = require("@vercel/blob");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.VERCEL ? "/tmp" : path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "fiche-clients.json");
const ADMINS = process.env.KALEFLEH_ADMINS
  ? process.env.KALEFLEH_ADMINS.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean)
  : ["ALJABIR", "KADJA", "ADMIN"];
// Mot de passe admin : header X-Admin-Pass en priorité (ne laisse pas de trace dans les logs d'URL),
// query/body ?pass= gardé en compatibilité.
function getAdminPass(req) {
  return String(req.headers["x-admin-pass"] || req.query.pass || (req.body && req.body.pass) || "").trim();
}
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const BLOB_PATH = "kalefleh/fiche-clients.json";
const SMTP = {
  host: process.env.SMTP_HOST || "",
  port: Number(process.env.SMTP_PORT) || 587,
  user: process.env.SMTP_USER || "",
  pass: process.env.SMTP_PASS || "",
  to: process.env.SMTP_TO || "kalefleh.shop@gmail.com"
};
const SMTP_READY = Boolean(SMTP.host && SMTP.user && SMTP.pass);

app.use(express.json({ limit: "100kb" }));
app.use(
  express.static(path.join(__dirname, "public"), {
    // Cache navigateur : les images/icônes changent rarement (7j), CSS/JS un peu plus souvent (1h),
    // les pages HTML jamais en cache long (toujours revalidées) pour éviter du contenu obsolète.
    setHeaders: (res, filePath) => {
      if (/\.(png|jpg|jpeg|svg|webp|ico)$/i.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=604800"); // 7 jours
      } else if (/\.(css|js)$/i.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=3600"); // 1 heure
      } else if (/\.html$/i.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
      }
    }
  })
);

// ---- Anti-abus : limiteur de requêtes simple, en mémoire (par IP + route) ----
const RATE_BUCKETS = new Map();
function rateLimit(key, max, windowMs) {
  return function (req, res, next) {
    const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown").split(",")[0].trim();
    const bucketKey = key + ":" + ip;
    const now = Date.now();
    const bucket = RATE_BUCKETS.get(bucketKey) || [];
    const recent = bucket.filter((t) => now - t < windowMs);
    if (recent.length >= max) {
      return res.status(429).json({ ok: false, error: "Trop de requêtes, réessayez dans quelques minutes." });
    }
    recent.push(now);
    RATE_BUCKETS.set(bucketKey, recent);
    next();
  };
}
// Nettoyage périodique pour éviter une fuite mémoire sur les instances qui restent chaudes
setInterval(() => {
  const now = Date.now();
  for (const [k, arr] of RATE_BUCKETS) {
    const recent = arr.filter((t) => now - t < 30 * 60 * 1000);
    if (recent.length) RATE_BUCKETS.set(k, recent);
    else RATE_BUCKETS.delete(k);
  }
}, 10 * 60 * 1000).unref?.();

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, "[]");

async function readDb() {
  if (BLOB_TOKEN) {
    try {
      const result = await get(BLOB_PATH, { token: BLOB_TOKEN, access: "private" });
      if (!result) return [];
      const chunks = [];
      for await (const c of result.stream) chunks.push(c);
      const text = Buffer.concat(chunks).toString("utf8");
      return text.trim() ? JSON.parse(text) : [];
    } catch {
      return [];
    }
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeDb(data) {
  const json = JSON.stringify(data, null, 2);
  if (BLOB_TOKEN) {
    await put(BLOB_PATH, json, {
      token: BLOB_TOKEN,
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true
    });
    return;
  }
  fs.writeFileSync(DB_FILE, json);
}

async function sendNotification(fiche) {
  if (!SMTP_READY) return;
  const money = (v) => (Number(v) || 0).toLocaleString("fr-FR") + " FCFA";
  const lines = [
    `Nouvelle demande de devis — ${fiche.ref}`,
    "",
    `Client : ${fiche.nom_client} (${fiche.telephone}${fiche.email_client ? " · " + fiche.email_client : ""})`,
    `Localisation : ${fiche.pays} — ${fiche.ville}`,
    `Courses : ${fiche.types_courses.join(", ") || "—"}`,
    `Budget : ${money(fiche.budget_fcfa)} · Prestation : ${money(fiche.prestation_fcfa)}`,
    `Total estimé : ${money(fiche.total_estime_fcfa)} · Avance : ${money(fiche.avance_fcfa)}`,
    `Paiement : ${fiche.paiement || "—"}`,
    `Délai souhaité : ${fiche.delai_souhaite || "—"}`,
    `Livraison : ${fiche.adresse_livraison || "—"} (${fiche.compagnie_expedition})`,
    "",
    `Détails : ${fiche.details_course || "—"}`,
    `Commentaire : ${fiche.commentaire || "—"}`,
    "",
    "Réponds-lui vite sur WhatsApp pour confirmer le devis."
  ].join("\n");
  try {
    const transporter = nodemailer.createTransport({
      host: SMTP.host,
      port: SMTP.port,
      secure: SMTP.port === 465,
      auth: { user: SMTP.user, pass: SMTP.pass }
    });
    await transporter.sendMail({
      from: `"KALEFLEH" <${SMTP.user}>`,
      to: SMTP.to,
      subject: `🔔 Nouvelle demande ${fiche.ref} — ${fiche.nom_client}`,
      text: lines
    });
    console.log(`[notif] Email envoyé pour ${fiche.ref}`);
  } catch (err) {
    console.warn(`[notif] Échec email pour ${fiche.ref} :`, err.message);
  }
}

async function sendClientMessageNotification(fiche, texte) {
  if (!SMTP_READY) return;
  try {
    const transporter = nodemailer.createTransport({
      host: SMTP.host,
      port: SMTP.port,
      secure: SMTP.port === 465,
      auth: { user: SMTP.user, pass: SMTP.pass }
    });
    await transporter.sendMail({
      from: `"KALEFLEH" <${SMTP.user}>`,
      to: SMTP.to,
      subject: `💬 Nouveau message client — ${fiche.ref} (${fiche.nom_client})`,
      text: [
        `Message de ${fiche.nom_client} sur la commande ${fiche.ref} :`,
        "",
        texte,
        "",
        `Téléphone : ${fiche.telephone}${fiche.email_client ? " · " + fiche.email_client : ""}`
      ].join("\n")
    });
    console.log(`[notif] Email client message ${fiche.ref}`);
  } catch (err) {
    console.warn(`[notif] Échec email message ${fiche.ref} :`, err.message);
  }
}

function toCsv(rows) {
  const headers = [
    "ref", "date", "nom_client", "telephone", "email_client", "whatsapp", "pays", "ville",
    "types_courses", "details_course", "delai_souhaite", "budget_fcfa", "prestation_fcfa",
    "expedition_fcfa", "total_estime_fcfa", "avance_fcfa", "paiement",
    "compagnie_expedition", "adresse_livraison", "commentaire", "statut"
  ];
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.join(",")];
  for (const r of rows) {
    const arr = headers.map((h) => {
      const v = Array.isArray(r[h]) ? r[h].join(" | ") : r[h];
      return esc(v);
    });
    lines.push(arr.join(","));
  }
  return lines.join("\r\n");
}

app.get("/api/fiches", rateLimit("admin-auth", 20, 10 * 60 * 1000), async (req, res) => {
  const pass = getAdminPass(req);
  if (!ADMINS.includes(pass.toUpperCase())) {
    return res.status(401).json({ error: "Accès refusé : mot de passe admin requis." });
  }
  const rows = await readDb();
  res.json({ count: rows.length, fiches: rows.slice().reverse() });
});

app.post("/api/fiches", rateLimit("nouvelle-fiche", 5, 15 * 60 * 1000), async (req, res) => {
  const b = req.body || {};
  if (b.website) return res.status(200).json({ ok: true }); // honeypot : on feint le succès sans rien écrire
  const nomClient = String(b.nomClient || b.nom_client || "").trim().slice(0, 120);
  const telephone = String(b.telephone || "").trim().slice(0, 40);
  if (!nomClient && !telephone) {
    return res.status(400).json({ error: "Le nom du client ou le téléphone est obligatoire." });
  }
  if (!b.consentTraitement) {
    return res.status(400).json({ error: "Le consentement au traitement des données est obligatoire pour envoyer une demande." });
  }
  const fiche = {
    ref: `KF-${Date.now().toString(36).toUpperCase()}`,
    date: new Date().toISOString(),
    nom_client: nomClient,
    telephone,
    email_client: String(b.emailClient || "").trim().slice(0, 160),
    whatsapp: String(b.whatsapp || telephone || "").trim().slice(0, 40),
    pays: String(b.pays || "Côte d'Ivoire").trim().slice(0, 80),
    ville: String(b.ville || "Abidjan").trim().slice(0, 80),
    types_courses: Array.isArray(b.typesCourses) ? b.typesCourses.map((t) => String(t).slice(0, 60)).slice(0, 10) : [],
    details_course: String(b.detailsCourse || "").trim().slice(0, 2000),
    delai_souhaite: String(b.delaiSouhaite || "").trim().slice(0, 120),
    budget_fcfa: Number(b.budgetFcfa) || 0,
    prestation_fcfa: Number(b.prestationFcfa) || 0,
    expedition_fcfa: Number(b.expeditionFcfa) || 0,
    total_estime_fcfa: Number(b.totalEstimeFcfa) || 0,
    avance_fcfa: Number(b.avanceFcfa) || 0,
    paiement: String(b.paiement || "").trim().slice(0, 80),
    compagnie_expedition: String(b.compagnieExpedition || "KALEFLEH s'occupe de tout").trim().slice(0, 160),
    adresse_livraison: String(b.adresseLivraison || "").trim().slice(0, 300),
    commentaire: String(b.commentaire || "").trim().slice(0, 1000),
    consent_traitement: true,
    consent_marketing: Boolean(b.consentMarketing),
    consent_date: new Date().toISOString(),
    statut: "NOUVEAU",
    suivi: [{ date: new Date().toISOString(), auteur: "système", texte: "Demande de devis reçue.", visibilite: "client" }]
  };
  const db = await readDb();
  db.push(fiche);
  try {
    await writeDb(db);
    sendNotification(fiche); // non bloquant, silencieux si SMTP non configuré
    res.status(201).json({ ok: true, fiche });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Suivi public (sans mot de passe) : statut + récap non sensible
app.get("/api/fiches/:ref/statut", async (req, res) => {
  const ref = String(req.params.ref || "").trim().toUpperCase();
  const db = await readDb();
  const f = db.find((x) => x.ref === ref);
  if (!f) return res.status(404).json({ ok: false, error: "Référence introuvable." });
  const suivi = Array.isArray(f.suivi) ? f.suivi.filter((e) => e.visibilite === "client") : [];
  res.json({
    ok: true,
    ref: f.ref,
    date: f.date,
    statut: f.statut,
    nom_client: f.nom_client,
    pays: f.pays,
    ville: f.ville,
    types_courses: f.types_courses,
    delai_souhaite: f.delai_souhaite || "",
    total_estime_fcfa: f.total_estime_fcfa,
    avance_fcfa: f.avance_fcfa,
    suivi: suivi.slice(-20).reverse()
  });
});

const ALLOWED_PATCH = ["statut", "avance_fcfa", "total_estime_fcfa", "commentaire", "note", "notePublic"];
const STATUT_ORDER = ["NOUVEAU", "CONTACTÉ", "EN COURS", "EXPÉDIÉ", "TERMINÉ"];

// Message du client (public) : ajouté au journal, alerte email admin
app.post("/api/fiches/:ref/messages", rateLimit("message-client", 15, 15 * 60 * 1000), async (req, res) => {
  const ref = String(req.params.ref || "").trim().toUpperCase();
  if ((req.body && req.body.website)) return res.status(200).json({ ok: true }); // honeypot
  const texte = String((req.body && req.body.message) || "").trim().slice(0, 500);
  if (!texte) return res.status(400).json({ ok: false, error: "Message vide." });
  const db = await readDb();
  const f = db.find((x) => x.ref === ref);
  if (!f) return res.status(404).json({ ok: false, error: "Référence introuvable." });
  f.suivi = Array.isArray(f.suivi) ? f.suivi : [];
  f.suivi.push({ date: new Date().toISOString(), auteur: "client", texte, visibilite: "client" });
  try {
    await writeDb(db);
    sendClientMessageNotification(f, texte);
    res.status(201).json({ ok: true, fiche: f });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Déclaration d'avance / paiement (public) : journal + alerte email admin
const PAIEMENT_METHODES = ["Wave", "Orange Money", "MTN MoMo", "Moov Money", "Virement international (Western Union…)", "Espèces"];
app.post("/api/fiches/:ref/paiement", rateLimit("declaration-paiement", 15, 15 * 60 * 1000), async (req, res) => {
  const ref = String(req.params.ref || "").trim().toUpperCase();
  if (req.body && req.body.website) return res.status(200).json({ ok: true }); // honeypot
  const montant = Number((req.body && req.body.montant) || 0);
  const methode = String((req.body && req.body.methode) || "").trim();
  const telephone = String((req.body && req.body.telephone) || "").trim();
  if (!montant || montant <= 0) {
    return res.status(400).json({ ok: false, error: "Indique un montant valide." });
  }
  const db = await readDb();
  const f = db.find((x) => x.ref === ref);
  if (!f) return res.status(404).json({ ok: false, error: "Référence introuvable." });
  const methodeOk = PAIEMENT_METHODES.indexOf(methode) !== -1 ? methode : "Autre";
  f.suivi = Array.isArray(f.suivi) ? f.suivi : [];
  const texte = `💳 Avance déclarée : ${montant.toLocaleString("fr-FR")} FCFA via ${methodeOk}${telephone ? " (" + telephone + ")" : ""} — à confirmer par KALEFLEH.`;
  f.suivi.push({ date: new Date().toISOString(), auteur: "client", texte, visibilite: "client" });
  try {
    await writeDb(db);
    sendClientMessageNotification(f, texte);
    res.status(201).json({ ok: true, ref: f.ref, montant, methode: methodeOk, telephone });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.patch("/api/fiches/:ref", rateLimit("admin-auth", 20, 10 * 60 * 1000), async (req, res) => {
  const pass = getAdminPass(req).toUpperCase();
  if (!ADMINS.includes(pass)) return res.status(401).json({ error: "Accès refusé." });
  const db = await readDb();
  const idx = db.findIndex((f) => f.ref === req.params.ref);
  if (idx === -1) return res.status(404).json({ error: "Fiche introuvable." });
  const fiche = db[idx];
  fiche.suivi = Array.isArray(fiche.suivi) ? fiche.suivi : [];
  const now = new Date().toISOString();

  for (const key of ALLOWED_PATCH) {
    if (key in req.body) {
      if (key === "statut") {
        const next = String(req.body.statut).trim().toUpperCase();
        if (next !== fiche.statut && STATUT_ORDER.indexOf(next) !== -1) {
          fiche.suivi.push({
            date: now,
            auteur: "système",
            texte: `Statut : ${fiche.statut} → ${next}`,
            visibilite: "client"
          });
          fiche.statut = next;
        }
      } else if (key === "note") {
        const texte = String(req.body.note).trim();
        if (texte) {
          fiche.suivi.push({
            date: now,
            auteur: "admin",
            texte,
            visibilite: req.body.notePublic ? "client" : "interne"
          });
        }
      } else if (key === "notePublic") {
        // consommé avec note, ignoré séparément
      } else {
        const v = req.body[key];
        fiche[key] = key.endsWith("_fcfa") ? (Number(v) || 0) : String(v || "");
      }
    }
  }
  try {
    await writeDb(db);
    res.json({ ok: true, fiche });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.delete("/api/fiches/:ref", rateLimit("admin-auth", 20, 10 * 60 * 1000), async (req, res) => {
  const pass = getAdminPass(req).toUpperCase();
  if (!ADMINS.includes(pass)) return res.status(401).json({ error: "Accès refusé." });
  const db = await readDb();
  const idx = db.findIndex((f) => f.ref === req.params.ref);
  if (idx === -1) return res.status(404).json({ error: "Fiche introuvable." });
  const [removed] = db.splice(idx, 1);
  try {
    await writeDb(db);
    res.json({ ok: true, ref: removed.ref });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/api/export/fiches.csv", rateLimit("admin-auth", 20, 10 * 60 * 1000), async (req, res) => {
  const pass = getAdminPass(req);
  if (!ADMINS.includes(pass.toUpperCase())) {
    return res.status(401).json({ error: "Accès refusé." });
  }
  const csv = toCsv(await readDb());
  res.header("Content-Type", "text/csv; charset=utf-8");
  res.header("Content-Disposition", 'attachment; filename="kalefleh-fiches-clients.csv"');
  res.send("\uFEFF" + csv);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`KALEFLEH est en ligne sur http://localhost:${PORT}`);
    console.log(`Base de fiches clients : ${BLOB_TOKEN ? "Vercel Blob (persistant)" : DB_FILE}`);
  });
}

module.exports = app;