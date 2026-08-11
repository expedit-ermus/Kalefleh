import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, "..", "public");

const src = path.join(PUBLIC, "favicon.svg");
const jobs = [
  ["favicon.png", 128],
  ["favicon-32.png", 32],
  ["apple-touch-icon.png", 180],
];

const browser = await chromium.launch();
for (const [out, size] of jobs) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  const html = `<!DOCTYPE html><html><head>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&display=swap" rel="stylesheet" />
  </head><body style="margin:0;padding:0">${fs.readFileSync(src, "utf8")}</body></html>`;
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const main = page.locator("svg");
  await main.screenshot({ path: path.join(PUBLIC, out), type: "png" });
  await page.close();
  console.log("ok", out);
}
await browser.close();