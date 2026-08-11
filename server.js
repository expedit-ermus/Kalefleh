const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "fiche-clients.json");
const ADMINS = ["ALJABIR", "KADJA", "ADMIN"];

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, "[]");

function readDb() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function toCsv(rows) {
  const headers = [
    "ref", "date", "nom_client", "telephone", "whatsapp", "pays", "ville",
    "types_courses", "details_course", "budget_fcfa", "prestation_fcfa",
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

app.get("/api/fiches", (req, res) => {
  const pass = req.query.pass || "";
  if (!ADMINS.includes(pass.toUpperCase())) {
    return res.status(401).json({ error: "Accès refusé : mot de passe admin requis." });
  }
  const rows = readDb();
  res.json({ count: rows.length, fiches: rows.slice().reverse() });
});

app.post("/api/fiches", (req, res) => {
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
  const db = readDb();
  db.push(fiche);
  writeDb(db);
  res.status(201).json({ ok: true, fiche });
});

app.patch("/api/fiches/:ref", (req, res) => {
  const pass = (req.query.pass || req.body.pass || "").toString().toUpperCase();
  if (!ADMINS.includes(pass)) return res.status(401).json({ error: "Accès refusé." });
  const db = readDb();
  const idx = db.findIndex((f) => f.ref === req.params.ref);
  if (idx === -1) return res.status(404).json({ error: "Fiche introuvable." });
  db[idx] = { ...db[idx], ...req.body, ref: db[idx].ref, date: db[idx].date };
  writeDb(db);
  res.json({ ok: true, fiche: db[idx] });
});

app.get("/api/export/fiches.csv", (req, res) => {
  const pass = req.query.pass || "";
  if (!ADMINS.includes(pass.toUpperCase())) {
    return res.status(401).json({ error: "Accès refusé." });
  }
  const csv = toCsv(readDb());
  res.header("Content-Type", "text/csv; charset=utf-8");
  res.header("Content-Disposition", 'attachment; filename="kalefleh-fiches-clients.csv"');
  res.send("\uFEFF" + csv);
});

app.listen(PORT, () => {
  console.log(`KALEFLEH est en ligne sur http://localhost:${PORT}`);
  console.log(`Base de fiches clients : ${DB_FILE}`);
});