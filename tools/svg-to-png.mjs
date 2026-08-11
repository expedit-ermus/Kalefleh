import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, "..", "public");

const jobs = [
  ["affiche-carre.svg", "affiche-carre.png", 1080, 1080],
  ["affiche-story.svg", "affiche-story.png", 1080, 1920],
  ["carrousel/slide-1.svg", "carrousel/slide-1.png", 1080, 1080],
  ["carrousel/slide-2.svg", "carrousel/slide-2.png", 1080, 1080],
  ["carrousel/slide-3.svg", "carrousel/slide-3.png", 1080, 1080],
  ["carrousel/slide-4.svg", "carrousel/slide-4.png", 1080, 1080],
  ["carrousel/slide-5.svg", "carrousel/slide-5.png", 1080, 1080],
  ["carrousel/slide-6.svg", "carrousel/slide-6.png", 1080, 1080],
];

const browser = await chromium.launch();
for (const [src, out, w, h] of jobs) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const html = `<!DOCTYPE html><html><head>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  </head><body style="margin:0;padding:0">${fs.readFileSync(path.join(PUBLIC, src), "utf8")}</body></html>`;
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const main = page.locator("svg");
  await main.screenshot({ path: path.join(PUBLIC, out), type: "png" });
  await page.close();
  console.log("ok", out);
}
await browser.close();