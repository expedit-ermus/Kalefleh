const { chromium } = require("playwright");
const BASE = process.argv[2] || "http://localhost:4035";

const logs = [];
let fails = 0;
const ok = (b, l) => { logs.push((b ? "ok" : "ECHEC") + " :: " + l); if (!b) fails++; };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  /* ---------- A. Pré-remplissage devis par URL ---------- */
  await page.goto(BASE + "/index.html?type=V%C3%AAtements,Perruques&budget=100000&pays=France&ville=Paris#devis", { waitUntil: "networkidle" });
  const pref = await page.evaluate(() => ({
    vet: document.querySelector('input[name="typesCourses"][value="Vêtements"]').checked,
    cos: document.querySelector('input[name="typesCourses"][value="Cosmétiques"]').checked,
    perr: document.querySelector('input[name="typesCourses"][value="Perruques"]').checked,
    custom: document.querySelector('input[name="budgetQuick"][value="custom"]').checked,
    budget: document.getElementById("budgetFcfa").value,
    pays: document.getElementById("pays").value,
    ville: document.getElementById("ville").value,
    totalVisible: !document.getElementById("liveTotal").hidden,
    tTotal: document.getElementById("tTotal").textContent
  }));
  ok(pref.vet && !pref.cos && pref.perr, "types pré-coches (Vêtements+Perruques)");
  ok(pref.custom && pref.budget === "100000", "budget custom = 100000");
  ok(pref.pays === "France" && pref.ville === "Paris", "pays/ville pré-remplis");
  ok(pref.totalVisible, "total live visible (" + pref.tTotal + ")");
  await page.waitForTimeout(1000);
  const devisTop = await page.evaluate(() => Math.abs(document.getElementById("devis").getBoundingClientRect().top));
  ok(devisTop < 600, "scrollé au formulaire (#devis, top=" + Math.round(devisTop) + "px)");

  /* ---------- B. Page Payer / avance ---------- */
  // Créer une fiche de test
  const created = await page.evaluate(() => fetch("/api/fiches", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nomClient: "Tata Pay Test", telephone: "+2250102030405", typesCourses: ["Alimentaire"], budgetFcfa: 50000, prestationFcfa: 15000, totalEstimeFcfa: 65000 })
  }).then((r) => r.json()));
  const ref = created.fiche.ref;
  ok(Boolean(ref), "fiche créée (" + ref + ")");

  await page.goto(BASE + "/payer.html", { waitUntil: "networkidle" });

  // réf invalide
  await page.fill("#payRef", "PAS-BON");
  await page.fill("#payMontant", "20000");
  await page.click('#payForm button[type="submit"]');
  await page.waitForFunction(() => document.getElementById("payStatus").textContent.includes("Référence invalide"));
  ok(true, "ref invalide rejetée");

  // honeypot → faux succès, pas d'appel
  await page.fill("#payRef", ref);
  await page.fill("#payWebsite", "http://botte");
  await page.click('#payForm button[type="submit"]');
  await page.waitForFunction(() => document.getElementById("payStatus").textContent.includes("Avance déclarée"));
  await page.waitForTimeout(400);
  const suiviAfterHp = await page.evaluate((r) => fetch("/api/fiches/" + r + "/statut").then((x) => x.json()).then((d) => d.suivi), ref);
  ok(!suiviAfterHp.some((e) => /Avance déclarée/.test(e.texte)), "honeypot : aucune trace de paiement");

  // déclaration valide MTN MoMo
  await page.fill("#payWebsite", "");
  await page.fill("#payRef", ref);
  await page.fill("#payMontant", "30000");
  await page.check('input[name="methode"][value="MTN MoMo"]');
  await page.fill("#payTel", "+2250707070707");
  await page.click('#payForm button[type="submit"]');
  await page.waitForSelector("#payOk", { state: "visible", timeout: 8000 });
  const okRef = (await page.textContent("#okRef")).trim();
  const okResume = (await page.textContent("#okResume")).trim();
  const waHidden = await page.evaluate(() => document.getElementById("okWa").getAttribute("style") || "");
  ok(okRef === ref, "réf OK affichée (" + okRef + ")");
  ok(/30\s*000/.test(okResume) && /MTN MoMo/.test(okResume), "résumé avance correct (" + okResume + ")");

  const suiviPay = await page.evaluate((r) => fetch("/api/fiches/" + r + "/statut").then((x) => x.json()).then((d) => d.suivi), ref);
  const payEntry = suiviPay.find((e) => /Avance déclarée/.test(e.texte));
  ok(Boolean(payEntry), "entrée avance ajoutée au suivi public");
  ok(/30.000/.test(payEntry.texte) && /MTN MoMo/.test(payEntry.texte), "entrée contient montant + méthode");

  // suppression de la fiche de test via API admin
  const del = await page.evaluate((r) => fetch("/api/fiches/" + r + "?pass=KADJA", { method: "DELETE" }).then((x) => x.status), ref);
  ok(del === 200, "fiche de test supprimée");

  console.log("ref=" + ref);
  logs.forEach((l) => console.log(l));
  console.log(fails ? "RESULT: " + fails + " ECHEC(s)" : "RESULT: ALL OK");
  await browser.close();
  process.exit(fails ? 1 : 0);
})().catch(async (e) => { console.error("ECHEC:", e.message); logs.forEach((l) => console.log(l)); process.exit(1); });