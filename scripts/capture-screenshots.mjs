#!/usr/bin/env node
/**
 * Capture 4 Mac + 4 PC product screenshots.
 *
 * Prerequisites:
 *   python3 -m http.server 8790 --directory screenshots/demo
 *   Chrome/Chromium available as google-chrome-stable (or set CHROME_PATH)
 *   npm install puppeteer-core  (or global)
 */
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const CHROME =
  process.env.CHROME_PATH ||
  ["/usr/bin/google-chrome-stable", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) =>
    fs.existsSync(p)
  );

if (!CHROME) {
  console.error("No Chrome binary found. Set CHROME_PATH.");
  process.exit(1);
}

const BASE = process.env.DEMO_URL || "http://127.0.0.1:8790/demo.html";
const OUT = process.env.SHOT_OUT || path.join(root, "screenshots");
const ARTIFACTS = process.env.ARTIFACT_OUT || "/opt/cursor/artifacts/screenshots";

fs.mkdirSync(path.join(OUT, "mac"), { recursive: true });
fs.mkdirSync(path.join(OUT, "pc"), { recursive: true });
fs.mkdirSync(ARTIFACTS, { recursive: true });

const shots = [
  ["mac", "landing", "mac-01-landing.png"],
  ["mac", "install", "mac-02-safari-extensions.png"],
  ["mac", "picker", "mac-03-language-picker.png"],
  ["mac", "translated", "mac-04-translated.png"],
  ["pc", "landing", "pc-01-landing.png"],
  ["pc", "install", "pc-02-chrome-extensions.png"],
  ["pc", "picker", "pc-03-language-picker.png"],
  ["pc", "translated", "pc-04-translated.png"],
];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--hide-scrollbars",
    `--user-data-dir=/tmp/chrome-shot-profile-${Date.now()}`,
  ],
  defaultViewport: { width: 1280, height: 900, deviceScaleFactor: 1 },
});

try {
  for (const [platform, scene, file] of shots) {
    const page = await browser.newPage();
    const url = `${BASE}?platform=${platform}&scene=${scene}`;
    console.log("capturing", file, url);
    await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 250));
    const dest = path.join(OUT, platform, file);
    await page.screenshot({ path: dest, type: "png", fullPage: false });
    fs.copyFileSync(dest, path.join(ARTIFACTS, file));
    console.log("wrote", dest, fs.statSync(dest).size);
    await page.close();
  }
} finally {
  await browser.close();
}

console.log("done");
