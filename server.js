const express = require("express");
const path = require("path");
const fs = require("fs");
const { put, get } = require("@vercel/blob");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.VERCEL ? "/tmp" : path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "fiche-clients.json");
const ADMINS = process.env.KALEFLEH_ADMINS
  ? process.env.KALEFLEH_ADMINS.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean)
  : ["ALJABIR", "KADJA", "ADMIN"];

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

const TYPES_COURSES_ALLOWED = ["Vêtements", "Cosmétiques", "Perruques", "Alimentaire"];
const PAIEMENT_METHODES = ["Wave", "Orange Money", "MTN MoMo", "Moov Money", "Virement international (Western Union…)", "Espèces"];
const PHONE_RE = /^\+?[0-9\s().-]{7,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_STR = 300;
const MAX_COMMENT = 2000;

if (process.env.VERCEL) app.set("trust proxy", 1);

// ---- En-têtes de sécurité HTTP ----
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join("; ")
  );
  next();
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de requêtes. Réessaie dans quelques minutes." }
});
const devisLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de demandes envoyées. Réessaie plus tard." }
});
const actionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de requêtes. Réessaie plus tard." }
});

function cleanStr(v, max) {
  return String(v == null ? "" : v).replace(/\s+/g, " ").trim().slice(0, max || MAX_STR);
}
function isValidPhone(v) {
  if (!v || !PHONE_RE.test(v)) return false;
  const digits = v.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

app.use(express.json({ limit: "100kb" }));
app.use("/api", apiLimiter);
app.use(
  express.static(path.join(__dirname, "public"), {
    setHeaders: (res, filePath) => {
      if (/\.(png|jpg|jpeg|svg|webp|ico)$/i.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=604800");
      } else if (/\.(css|js)$/i.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=3600");
      } else if (/\.html$/i.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
      }
    }
  })
);

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

async function findFiche(ref, retries = 8) {
  for (let i = 0; i < retries; i++) {
    const db = await readDb();
    const f = db.find((x) => x.ref === ref);
    if (f) return f;
    if (i < retries - 1) await new Promise((r) => setTimeout(r, 500));
  }
  return null;
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
    `Délai souhaité : ${fiche.delai_souhaite || "—"} `,
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

app.get("/api/fiches", actionLimiter, async (req, res) => {
  const pass = getAdminPass(req);
  if (!ADMINS.includes(pass.toUpperCase())) {
    return res.status(401).json({ error: "Accès refusé : mot de passe admin requis." });
  }
  const rows = await readDb();
  res.json({ count: rows.length, fiches: rows.slice().reverse() });
});

app.post("/api/fiches", devisLimiter, async (req, res) => {
  const b = req.body || {};
  if (cleanStr(b.website) || cleanStr(b.hp) || cleanStr(b.company)) {
    return res.status(201).json({ ok: true, fiche: { ref: `KF-${Date.now().toString(36).toUpperCase()}` } });
  }
  const nomClient = cleanStr(b.nomClient || b.nom_client, 120);
  const telephone = cleanStr(b.telephone, 40);
  if (!nomClient && !telephone) {
    return res.status(400).json({ error: "Le nom du client ou le téléphone est obligatoire." });
  }
  if (telephone && !isValidPhone(telephone)) {
    return res.status(400).json({ error: "Numéro de téléphone invalide (indicatif requis, ex : +225 07 07 07 07 07)." });
  }
  const email = cleanStr(b.emailClient || b.email_client, 160);
  if (email && !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Adresse email invalide." });
  }
  const typesRaw = Array.isArray(b.typesCourses) ? b.typesCourses : [];
  const typesCourses = typesRaw.map((t) => cleanStr(t, 60)).filter((t) => TYPES_COURSES_ALLOWED.indexOf(t) !== -1);
  const paiement = cleanStr(b.paiement, 80);
  if (paiement && PAIEMENT_METHODES.indexOf(paiement) === -1) {
    return res.status(400).json({ error: "Moyen de paiement invalide." });
  }
  const money = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.min(Math.round(n), 1000000000);
  };

  const fiche = {
    ref: `KF-${Date.now().toString(36).toUpperCase()}`,
    date: new Date().toISOString(),
    nom_client: nomClient,
    telephone,
    email_client: email,
    whatsapp: cleanStr(b.whatsapp, 40) || telephone,
    pays: cleanStr(b.pays, 80) || "Côte d'Ivoire",
    ville: cleanStr(b.ville, 80) || "Abidjan",
    types_courses: typesCourses,
    details_course: cleanStr(b.detailsCourse || b.details_course, MAX_COMMENT),
    delai_souhaite: cleanStr(b.delaiSouhaite || b.delai_souhaite, 120),
    budget_fcfa: money(b.budgetFcfa || b.budget_fcfa),
    prestation_fcfa: money(b.prestationFcfa || b.prestation_fcfa),
    expedition_fcfa: money(b.expeditionFcfa || b.expedition_fcfa),
    total_estime_fcfa: money(b.totalEstimeFcfa || b.total_estime_fcfa),
    avance_fcfa: money(b.avanceFcfa || b.avance_fcfa),
    paiement,
    compagnie_expedition: cleanStr(b.compagnieExpedition || b.compagnie_expedition, 160) || "KALEFLEH s'occupe de tout",
    adresse_livraison: cleanStr(b.adresseLivraison || b.adresse_livraison, 300),
    commentaire: cleanStr(b.commentaire, MAX_COMMENT),
    consent_traitement: Boolean(b.consentTraitement ?? true),
    consent_marketing: Boolean(b.consentMarketing),
    consent_date: new Date().toISOString(),
    statut: "NOUVEAU",
    suivi: [{ date: new Date().toISOString(), auteur: "système", texte: "Demande de devis reçue.", visibilite: "client" }]
  };
  const db = await readDb();
  db.push(fiche);
  try {
    await writeDb(db);
    sendNotification(fiche);
    res.status(201).json({ ok: true, fiche });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Suivi public (sans mot de passe)
app.get("/api/fiches/:ref/statut", async (req, res) => {
  const ref = String(req.params.ref || "").trim().toUpperCase();
  const f = await findFiche(ref);
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

// Message du client (public)
app.post("/api/fiches/:ref/messages", actionLimiter, async (req, res) => {
  const ref = String(req.params.ref || "").trim().toUpperCase();
  if (req.body && req.body.website) return res.status(200).json({ ok: true });
  const texte = cleanStr((req.body && req.body.message) || "", 500);
  if (!texte) return res.status(400).json({ ok: false, error: "Message vide." });
  const f = await findFiche(ref);
  if (!f) return res.status(404).json({ ok: false, error: "Référence introuvable." });
  const db = await readDb();
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

// Déclaration d'avance / paiement (public)
app.post("/api/fiches/:ref/paiement", actionLimiter, async (req, res) => {
  const ref = String(req.params.ref || "").trim().toUpperCase();
  if (req.body && req.body.website) return res.status(200).json({ ok: true });
  const montant = Math.min(Math.round(Number((req.body && req.body.montant) || 0) || 0), 1000000000);
  const methode = cleanStr((req.body && req.body.methode) || "", 80);
  const telephone = cleanStr((req.body && req.body.telephone) || "", 40);
  if (!montant || montant <= 0) {
    return res.status(400).json({ ok: false, error: "Indique un montant valide." });
  }
  if (telephone && !isValidPhone(telephone)) {
    return res.status(400).json({ ok: false, error: "Numéro de téléphone invalide." });
  }
  const f = await findFiche(ref);
  if (!f) return res.status(404).json({ ok: false, error: "Référence introuvable." });
  const db = await readDb();
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

app.patch("/api/fiches/:ref", actionLimiter, async (req, res) => {
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
        // consommé avec note
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

app.delete("/api/fiches/:ref", actionLimiter, async (req, res) => {
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

app.get("/api/export/fiches.csv", actionLimiter, async (req, res) => {
  const pass = getAdminPass(req);
  if (!ADMINS.includes(pass.toUpperCase())) {
    return res.status(401).json({ error: "Accès refusé." });
  }
  const csv = toCsv(await readDb());
  res.header("Content-Type", "text/csv; charset=utf-8");
  res.header("Content-Disposition", 'attachment; filename="kalefleh-fiches-clients.csv"');
  res.send("\uFEFF" + csv);
});

// ---- 404 : toute route non reconnue ----
app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Route introuvable." });
  }
  res.status(404).sendFile(path.join(__dirname, "public", "404.html"));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`KALEFLEH est en ligne sur http://localhost:${PORT}`);
    console.log(`Base de fiches clients : ${BLOB_TOKEN ? "Vercel Blob (persistant)" : DB_FILE}`);
  });
}

module.exports = app;
