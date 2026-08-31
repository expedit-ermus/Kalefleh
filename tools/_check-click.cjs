const { chromium } = require("playwright");
const BASE = process.argv[2] || "http://localhost:4050";

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 375, height: 700 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const logs = [];
  await page.goto(BASE + "/", { waitUntil: "networkidle" });

  // Scroller vers le formulaire puis vers bas pour que le dernier champ/dans la barre sticky
  await page.evaluate(() => document.getElementById("devis").scrollIntoView());
  await page.waitForTimeout(400);
  await page.evaluate(() => window.scrollBy(0, window.innerHeight * 1.1));
  await page.waitForTimeout(400);

  const diag = await page.evaluate(() => {
    const bar = document.querySelector(".sticky-cta");
    const br = bar.getBoundingClientRect();
    const targets = ["#paiement", "#delaiSouhaite", "#compagnieExpedition", "#adresseLivraison", "#commentaire", ".btn-submit"];
    const hits = targets.map((s) => {
      const el = document.querySelector(s);
      if (!el) return { s, missing: true };
      const r = el.getBoundingClientRect();
      const overlap = r.bottom > br.top && r.bottom < br.bottom + 2 && r.top < br.bottom;
      return { s, overlap, top: Math.round(r.top), bottom: Math.round(r.bottom), barTop: Math.round(br.top) };
    });
    return { barTop: Math.round(br.top), barHeight: Math.round(br.height), hits };
  });
  logs.push("sticky bar top=" + diag.barTop + " h=" + diag.barHeight);
  diag.hits.forEach((h) => logs.push(JSON.stringify(h)));

  // Force-click une radio chip alors qu'elle est potentiellement derrière la barre
  const before = await page.evaluate(() => document.querySelector('input[name="budgetQuick"][value="100000"]').checked);
  await page.locator('input[name="budgetQuick"][value="100000"]').click({ force: true });
  const after = await page.evaluate(() => document.querySelector('input[name="budgetQuick"][value="100000"]').checked);
  logs.push("chip 100000 force-click => checked " + before + " -> " + after);

  // Status d'un clic normal Playwright (actionable)
  try {
    await page.locator('input[name="budgetQuick"][value="200000"]').click();
    const c = await page.evaluate(() => document.querySelector('input[name="budgetQuick"][value="200000"]').checked);
    logs.push("chip 200000 normal click => checked=" + c);
  } catch (e) {
    logs.push("chip 200000 normal click => ERREUR actionnable: " + e.message.split("\n")[0]);
  }

  logs.forEach((l) => console.log(l));
  await page.screenshot({ path: "C:\\Users\\Lenovo\\AppData\\Local\\Temp\\opencode\\shot-mobile-sticky.png" });
  await browser.close();
})().catch((e) => { console.error("ECHEC:", e.message); process.exit(1); });