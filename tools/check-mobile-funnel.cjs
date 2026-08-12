const { chromium } = require("playwright");
const BASE = process.argv[2] || "http://localhost:4016";

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  let pageErr = "";
  page.on("pageerror", (e) => { pageErr = e.message; });
  const logs = [];

  // 1) Page d'accueil mobile : navbar repliée + sticky CTA visible
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  const navState = await page.evaluate(() => ({
    hiddenLinks: Array.from(document.querySelectorAll(".navbar-links a")).filter((a) => !a.classList.contains("btn-nav")).map((a) => getComputedStyle(a).display),
    btnNavVisible: getComputedStyle(document.querySelector(".navbar-links .btn-nav")).display,
    stickyVisible: getComputedStyle(document.querySelector(".sticky-cta")).display
  }));
  logs.push("nav: links hidden=" + navState.hiddenLinks.every((d) => d === "none") + ", btn-nav=" + navState.btnNavVisible + ", sticky=" + navState.stickyVisible);

  // 2) Remplir + soumettre le devis
  await page.click("#devis");
  await page.fill("#nomClient", "Aya Mobile Test");
  await page.fill("#telephone", "+2250707070707");
  await page.fill("#emailClient", "aya@test.com");
  await page.fill("#pays", "France");
  await page.fill("#ville", "Paris");
  await page.check('input[name="typesCourses"][value="Perruques"]');
  await page.check('input[name="typesCourses"][value="Alimentaire"]');
  await page.check('input[name="budgetQuick"][value="100000"]');
  await page.selectOption("#delaiSouhaite", "Cette semaine");
  await page.fill("#adresseLivraison", "Paris 15e");
  await page.click('button[type="submit"]');
  await page.waitForSelector("#formStatus.ok", { timeout: 10000 });
  const status = await page.textContent("#formStatus");
  logs.push("submit: " + status.trim());
  const suiviLink = await page.getAttribute("#suiviLink", "href");
  const suiviVisible = await page.isVisible("#suiviLink");
  logs.push("suiviLink: visible=" + suiviVisible + " href=" + suiviLink);

  // 3) Suivi depuis le lien + message client
  const ref = suiviLink.split("=")[1];
  await page.goto(BASE + "/suivi.html?ref=" + ref, { waitUntil: "networkidle" });
  await page.waitForSelector("#resultBox:not([hidden])", { timeout: 8000 });
  const rStatut = await page.textContent("#rStatut");
  logs.push("suivi: statut=" + rStatut.trim());
  await page.fill("#cMsg", "Bonjour, possible d'ajouter un sac à main ?");
  await page.click("#btnMsg");
  await page.waitForTimeout(2500);
  const msgState = await page.evaluate(() => {
    const el = document.getElementById("msgStatus");
    return el ? { cls: el.className, txt: el.textContent } : null;
  });
  logs.push("msg state après 2.5s: " + JSON.stringify(msgState));
  logs.push("pageErr: " + (pageErr || "aucun"));
  const lastEntry = await page.evaluate(() => document.querySelector("#rSuiviList .suivi-entry:first-child .suivi-head").textContent.trim());
  logs.push("timeline head: " + lastEntry);

  logs.forEach((l) => console.log(l));
  await page.screenshot({ path: "C:\\Users\\Lenovo\\AppData\\Local\\Temp\\opencode\\shot-mobile-funnel.png", fullPage: false });
  await browser.close();
})().catch((e) => { console.error("ECHEC:", e.message); process.exit(1); });