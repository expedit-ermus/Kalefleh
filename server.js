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

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

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
    `Client : ${fiche.nom_client} (${fiche.telephone})`,
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

function toCsv(rows) {
  const headers = [
    "ref", "date", "nom_client", "telephone", "whatsapp", "pays", "ville",
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

app.get("/api/fiches", async (req, res) => {
  const pass = req.query.pass || "";
  if (!ADMINS.includes(pass.toUpperCase())) {
    return res.status(401).json({ error: "Accès refusé : mot de passe admin requis." });
  }
  const rows = await readDb();
  res.json({ count: rows.length, fiches: rows.slice().reverse() });
});

app.post("/api/fiches", async (req, res) => {
  const b = req.body || {};
  const nomClient = String(b.nomClient || b.nom_client || "").trim();
  const telephone = String(b.telephone || "").trim();
  if (!nomClient && !telephone) {
    return res.status(400).json({ error: "Le nom du client ou le téléphone est obligatoire." });
  }
  const fiche = {
    ref: `KF-${Date.now().toString(36).toUpperCase()}`,
    date: new Date().toISOString(),
    nom_client: nomClient,
    telephone,
    whatsapp: String(b.whatsapp || telephone || "").trim(),
    pays: String(b.pays || "Côte d'Ivoire").trim(),
    ville: String(b.ville || "Abidjan").trim(),
    types_courses: Array.isArray(b.typesCourses) ? b.typesCourses : [],
    details_course: String(b.detailsCourse || "").trim(),
    delai_souhaite: String(b.delaiSouhaite || "").trim(),
    budget_fcfa: Number(b.budgetFcfa) || 0,
    prestation_fcfa: Number(b.prestationFcfa) || 0,
    expedition_fcfa: Number(b.expeditionFcfa) || 0,
    total_estime_fcfa: Number(b.totalEstimeFcfa) || 0,
    avance_fcfa: Number(b.avanceFcfa) || 0,
    paiement: String(b.paiement || "").trim(),
    compagnie_expedition: String(b.compagnieExpedition || "KALEFLEH s'occupe de tout").trim(),
    adresse_livraison: String(b.adresseLivraison || "").trim(),
    commentaire: String(b.commentaire || "").trim(),
    statut: "NOUVEAU"
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
    avance_fcfa: f.avance_fcfa
  });
});

app.patch("/api/fiches/:ref", async (req, res) => {
  const pass = (req.query.pass || req.body.pass || "").toString().toUpperCase();
  if (!ADMINS.includes(pass)) return res.status(401).json({ error: "Accès refusé." });
  const db = await readDb();
  const idx = db.findIndex((f) => f.ref === req.params.ref);
  if (idx === -1) return res.status(404).json({ error: "Fiche introuvable." });
  db[idx] = { ...db[idx], ...req.body, ref: db[idx].ref, date: db[idx].date };
  try {
    await writeDb(db);
    res.json({ ok: true, fiche: db[idx] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.delete("/api/fiches/:ref", async (req, res) => {
  const pass = (req.query.pass || req.body.pass || "").toString().toUpperCase();
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

app.get("/api/export/fiches.csv", async (req, res) => {
  const pass = req.query.pass || "";
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