#!/usr/bin/env node
/**
 * Capture 4 Mac + 4 PC product screenshots on foreign websites.
 *
 * Prerequisites:
 *   python3 -m http.server 8790 --directory screenshots/demo
 *   Chrome available (CHROME_PATH or google-chrome-stable)
 *   puppeteer-core installed
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

// platform, scene key, output filename
const shots = [
  ["mac", "mac1", "mac-01-lemonde-fr.png"],
  ["mac", "mac2", "mac-02-asahi-jp.png"],
  ["mac", "mac3", "mac-03-spiegel-de.png"],
  ["mac", "mac4", "mac-04-elpais-es.png"],
  ["pc", "pc1", "pc-01-corriere-it.png"],
  ["pc", "pc2", "pc-02-folha-pt.png"],
  ["pc", "pc3", "pc-03-bbc-arabic.png"],
  ["pc", "pc4", "pc-04-chosun-ko.png"],
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
