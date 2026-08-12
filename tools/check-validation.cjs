const { chromium } = require("playwright");
const BASE = process.argv[2] || "http://localhost:4022";

const logs = [];
let fails = 0;
const ok = (b, l) => { logs.push((b ? "ok" : "ECHEC") + " :: " + l); if (!b) fails++; };
const SUB = '#devisForm button[type="submit"]';

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const count = () => page.evaluate(() => fetch("/api/fiches?pass=KADJA").then((r) => r.json()).then((d) => d.count));

  await page.goto(BASE + "/", { waitUntil: "networkidle" });

  // 1) nom ET tél vides
  await page.click(SUB);
  await page.waitForFunction(() => document.getElementById("formStatus").textContent.length > 0);
  let msg = (await page.textContent("#formStatus")).trim();
  ok(msg.includes("nom et votre téléphone"), "message: champs vides (" + msg + ")");

  // 2) tél invalide
  await page.fill("#nomClient", "Binta Test");
  await page.fill("#telephone", "070707");
  await page.click(SUB);
  await page.waitForFunction(() => document.getElementById("formStatus").textContent.includes("Numéro de téléphone"));
  msg = (await page.textContent("#formStatus")).trim();
  ok(true, "message: tél invalide (" + msg.slice(0, 60) + ")");

  // 3) aucun type coché
  await page.fill("#telephone", "+2250707070707");
  await page.click(SUB);
  await page.waitForFunction(() => document.getElementById("formStatus").textContent.includes("au moins un type"));
  msg = (await page.textContent("#formStatus")).trim();
  ok(true, "message: aucune course (" + msg.slice(0, 60) + ")");

  // 4) honeypot rempli → "succès" factice, AUCUNE fiche créée
  const before = await count();
  await page.fill("#website", "http://spam-bot");
  await page.click(SUB);
  await page.waitForFunction(() => document.getElementById("formStatus").textContent.includes("Demande reçue"));
  await page.waitForTimeout(600);
  const afterHp = await count();
  ok(before === afterHp, "honeypot piégé sans création de fiche (count avant/après = " + before + "/" + afterHp + ")");

  // 5) envoi valide + lien suivi
  await page.fill("#website", "");
  await page.fill("#nomClient", "Binta Test");
  await page.fill("#telephone", "+2250707070707");
  await page.check('input[name="typesCourses"][value="Perruques"]');
  await page.check('input[name="budgetQuick"][value="100000"]');
  await page.fill("#emailClient", "binta@test.com");
  await page.fill("#pays", "France");
  await page.fill("#ville", "Lyon");
  await page.selectOption("#delaiSouhaite", "Sous 2 semaines");
  await page.fill("#adresseLivraison", "Lyon 3e");
  await page.click(SUB);
  await page.waitForSelector("#formStatus.ok", { timeout: 8000 });
  const ref = ((await page.textContent("#formStatus")).match(/KF-[A-Z0-9]+/) || [])[0];
  const linkVisible = await page.isVisible("#suiviLink");
  const after = await count();
  ok(Boolean(ref) && after === before + 1, "envoi valide créé la fiche (" + ref + ", count=" + after + ")");
  ok(linkVisible, "lien de suivi affiché après envoi");

  console.log("ref=" + ref);
  logs.forEach((l) => console.log(l));
  console.log(fails ? "RESULT: " + fails + " ECHEC(s)" : "RESULT: ALL OK");
  await browser.close();
  process.exit(fails ? 1 : 0);
})().catch(async (e) => { console.error("ECHEC:", e.message); logs.forEach((l) => console.log(l)); process.exit(1); });