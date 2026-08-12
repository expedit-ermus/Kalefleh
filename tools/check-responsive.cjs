const { chromium } = require("playwright");
const BASE = process.argv[2] || "http://localhost:4015";
const WIDTHS = [320, 360, 375, 768, 1280];
const PAGES = [
  { name: "index", url: BASE + "/" },
  { name: "suivi", url: BASE + "/suivi.html" },
  { name: "admin", url: BASE + "/admin.html" },
  { name: "niche-vet", url: BASE + "/niche-vetements.html" },
  { name: "niche-cosm", url: BASE + "/niche-cosmetiques.html" },
  { name: "niche-perr", url: BASE + "/niche-perruques.html" },
  { name: "niche-ali", url: BASE + "/niche-alimentaire.html" },
  { name: "tarifs", url: BASE + "/tarifs.html" },
  { name: "faq", url: BASE + "/faq.html" },
  { name: "livraison", url: BASE + "/livraison.html" },
  { name: "payer", url: BASE + "/payer.html" },
  { name: "contact", url: BASE + "/contact.html" },
  { name: "cgv", url: BASE + "/cgv.html" },
  { name: "mentions", url: BASE + "/mentions-legales.html" }
];

(async () => {
  const browser = await chromium.launch();
  let failures = 0;
  for (const width of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width, height: 800 } });
    for (const pg of PAGES) {
      const page = await ctx.newPage();
      await page.goto(pg.url, { waitUntil: "networkidle", timeout: 30000 });
      const r = await page.evaluate(() => {
        const doc = document.documentElement;
        const body = document.body;
        const overflow = Math.max(doc.scrollWidth, body.scrollWidth) - window.innerWidth;
        const wideEls = Array.from(document.querySelectorAll("*")).filter((el) => {
          const w = el.getBoundingClientRect().right;
          return w > window.innerWidth + 2 && !el.closest(".hp-field") && getComputedStyle(el).display !== "none";
        }).slice(0, 5).map((el) => el.tagName + "." + (el.className && typeof el.className === "string" ? el.className.split(" ")[0] : ""));
        return {
          scrollW: doc.scrollWidth,
          innerW: window.innerWidth,
          overflow,
          wideEls,
          hasSticky: !!document.querySelector(".sticky-cta"),
          navVisible: !!document.querySelector(".navbar-links") && getComputedStyle(document.querySelector(".navbar-links")).display !== "none"
        };
      });
      const status = r.overflow > 2 ? "OVERFLOW " + r.overflow : "ok";
      if (r.overflow > 2) failures++;
      console.log(`${pg.name}\t${width}px\tscroll=${r.scrollW}\tinner=${r.innerW}\tâ†’ ${status}\twideEls=${r.wideEls.join(",") || "-"}`);
      const shot = `C:\\Users\\Lenovo\\AppData\\Local\\Temp\\opencode\\shot-${pg.name}-${width}.png`;
      await page.screenshot({ path: shot, fullPage: false });
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
  console.log(failures ? `RESULT: ${failures} overflow(s)` : "RESULT: NO HORIZONTAL OVERFLOW");
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error("SCRIPTERR", e.message); process.exit(2); });
