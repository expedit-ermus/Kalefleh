const { chromium } = require("playwright");
const fs = require("fs");
const BASE = process.argv[2] || "http://localhost:4020";

const ok = (b, l) => (b ? "ok" : "ECHEC") + " :: " + l;
const logs = [];
let fails = 0;

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const dialogs = [];
  page.on("dialog", (d) => { dialogs.push(d.message()); d.accept(); });
  page.on("pageerror", (e) => logs.push("pageerror: " + e.message));
  const check = (cond, label) => { logs.push(ok(cond, label)); if (!cond) fails++; };

  // 1) Connexion refusée
  await page.goto(BASE + "/admin.html", { waitUntil: "networkidle" });
  await page.fill("#passInput", "MOTDEPASSE");
  await page.click("#btnLogin");
  await page.waitForFunction(() => document.getElementById("loginMsg").textContent.length > 0);
  check(/incorrect/.test(await page.textContent("#loginMsg")), "login refusé (mauvais mot de passe)");

  // 2) Connexion admin
  await page.fill("#passInput", "KADJA");
  await page.click("#btnLogin");
  await page.waitForSelector("#panelBox", { state: "visible", timeout: 8000 });
  check(true, "login admin OK");

  // 3) Créer une fiche
  await page.click("#btnNew");
  await page.fill("#nNom", "Awa Admin Test");
  await page.fill("#nTel", "+2250102030405");
  await page.fill("#nBudget", "120000");
  await page.fill("#nAvance", "30000");
  await page.fill("#nPrestation", "15000");
  await page.check('.nTypes[value="Perruques"]');
  await page.selectOption("#nPaiement", "Wave");
  await page.selectOption("#nDelai", "Cette semaine");
  await page.fill("#nAdresse", "Abidjan Cocody");
  await page.click("#btnNewSave");
  await page.waitForFunction(() => (document.getElementById("newMsg").className || "").indexOf("ok") !== -1, null, { timeout: 8000 });
  const newMsg = await page.textContent("#newMsg");
  const ref = (newMsg.match(/KF-[A-Z0-9]+/) || [])[0];
  check(Boolean(ref), "nouvelle fiche créée (" + (ref || newMsg) + ")");
  await page.waitForSelector('.fiche-card .ref', { timeout: 8000 });

  // 4) Bascule statut
  const cardSel = '.fiche-card .ref >> text=' + ref;
  const card = page.locator('.fiche-card').filter({ hasText: ref });

  async function dumpCard(label) {
    const st = await page.evaluate((r) => {
      const c = Array.from(document.querySelectorAll(".fiche-card")).find((x) => x.textContent.includes(r));
      if (!c) return "CARTE ABSENTE";
      const s = c.querySelector(".badge");
      return {
        badge: s ? s.textContent.trim() : "?",
        suiviBadges: Array.from(c.querySelectorAll(".suivi-badge")).map((b) => { const t = b.textContent.trim(); const cls = b.className; return (cls.indexOf("vis-client") !== -1 ? "client" : cls.indexOf("vis-inte") !== -1 ? "interne" : "?") + ":" + t; }),
        notes: Array.from(c.querySelectorAll(".suivi-text")).map((x) => x.textContent.trim())
      };
    }, ref);
    logs.push("DÉBUG [" + label + "]: " + JSON.stringify(st));
  }

  // 4) Bascule statut
  await card.locator("select[data-ref]").selectOption("EN COURS");
  try {
    await page.waitForFunction((r) => {
      const c = Array.from(document.querySelectorAll(".fiche-card")).find((x) => x.textContent.includes(r));
      return c && c.querySelector(".badge") && c.querySelector(".badge").textContent.trim() === "EN COURS";
    }, ref, { timeout: 8000 });
    check(true, "statut → EN COURS (badge mis à jour)");
  } catch (e) { await dumpCard("statut"); throw e; }

  // 5) Note INTERNE (non visible client)
  try {
    await card.locator('[data-action="hist"]').click();
    await card.locator(".n-note").fill("Appel passé, client ok pour avance.");
    await card.locator('[data-action="note"]').click();
    await page.waitForFunction((r) => {
      const c = Array.from(document.querySelectorAll(".fiche-card")).find((x) => x.textContent.includes(r));
      return c && c.querySelector(".suivi-list .suivi-entry .suivi-badge.vis-inte");
    }, ref, { timeout: 8000 });
    check(true, "note interne ajoutée (visible=interne)");
  } catch (e) { await dumpCard("note interne"); throw e; }

  // 6) Note PUBLIQUE
  try {
    await card.locator('[data-action="hist"]').click();
    await card.locator(".n-note").fill("Vos courses sont en préparation 🔄");
    await card.locator(".n-public").check();
    await card.locator('[data-action="note"]').click();
    await page.waitForFunction((r) => {
      const c = Array.from(document.querySelectorAll(".fiche-card")).find((x) => x.textContent.includes(r));
      return c && c.querySelector(".suivi-list .suivi-entry .suivi-badge.vis-client");
    }, ref, { timeout: 8000 });
    check(true, "note publique ajoutée (visible=client)");
  } catch (e) { await dumpCard("note publique"); throw e; }

  // 7) Vérif endpoint public /statut : NE voit PAS l'interne
  const pub = await page.evaluate(async (r) => {
    const res = await fetch("/api/fiches/" + r + "/statut");
    return res.json();
  }, ref);
  const isInClient = pub.suivi.some((e) => /Appel passé/.test(e.texte));
  const isPubClient = {
    statut: pub.statut,
    entry: pub.suivi.map((e) => e.texte)
  };
  check(pub.statut === "EN COURS", "client voit EN COURS via /statut");
  check(!isInClient, "client NE voit PAS la note interne");
  check(pub.suivi.some((e) => /préparation/.test(e.texte)), "client VOIT la note publique");
  logs.push("client suivi visible: " + JSON.stringify(isPubClient));

  // 8) Edition avance via le formulaire
  await card.locator('[data-action="edit"]').click();
  await card.locator(".e-avance").fill("45000");
  await card.locator(".fiche-edit .btn-save").click();
  await page.waitForFunction((r) => {
    const c = Array.from(document.querySelectorAll(".fiche-card")).find((x) => x.textContent.includes(r));
    return c && /45\s*000\s*FCFA/.test(c.textContent);
  }, ref, { timeout: 8000 });
  check(true, "avance éditée → 45 000 FCFA affiché");

  // 9) Filtre recherche + validation serveur (401 sans pass)
  await page.fill("#searchInput", ref);
  await page.waitForFunction((r) => {
    const cards = document.querySelectorAll("#fiches .fiche-card");
    return cards.length === 1 && cards[0].textContent.includes(r);
  }, ref, { timeout: 5000 });
  check(true, "recherche filtre sur la fiche");
  await page.fill("#searchInput", "");
  const unauth = await page.evaluate(() => fetch("/api/fiches?pass=WRONG").then((r) => r.status));
  check(unauth === 401, "API list = 401 sans bon pass");

  // 10) Export CSV
  const dlP = page.waitForEvent("download", { timeout: 8000 });
  await page.click("#btnExport");
  const dl = await dlP;
  const dlPath = await dl.path();
  const csv = fs.readFileSync(dlPath, "utf8");
  check(csv.includes(ref) && csv.includes("Awa Admin Test"), "export CSV contient la fiche");

  // 11) Suppression (dialog confirm accepté)
  await card.locator('[data-action="delete"]').click();
  await page.waitForFunction((r) => {
    return !Array.from(document.querySelectorAll("#fiches .fiche-card")).some((x) => x.textContent.includes(r));
  }, ref, { timeout: 8000 });
  check(true, "fiche supprimée (confirm=" + dialogs.length + ")" + (dialogs.length ? " → «" + dialogs[dialogs.length - 1].slice(0, 30) + "…»" : ""));

  console.log("ref=" + ref);
  logs.forEach((l) => console.log(l));
  console.log(fails ? "RESULT: " + fails + " ECHEC(s)" : "RESULT: ALL OK");
  await browser.close();
  process.exit(fails ? 1 : 0);
})().catch(async (e) => {
  console.error("ECHEC:", e.message);
  logs.forEach((l) => console.log(l));
  process.exit(1);
});