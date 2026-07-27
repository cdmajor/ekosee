# Ekosee — Browser Translation Extension

Translate any webpage into 90+ languages with one click. **No API key required** — powered by Google Translate.

## Download (separate packages)

After pulling from GitHub (or opening the project on Replit), download **one zip at a time**:

| Package | Path | Install |
|---------|------|---------|
| **Chrome** | [`downloads/ekosee-chrome.zip`](downloads/ekosee-chrome.zip) | Unzip → Load unpacked in Chrome |
| **Safari (Mac)** | [`downloads/ekosee-safari.zip`](downloads/ekosee-safari.zip) | Unzip on a Mac → run `convert-for-safari.sh` |

Unpacked folders (same contents, also downloadable as directories):

- [`chrome/`](chrome/) — Chrome extension (`manifest.json` at the root)
- [`safari/`](safari/) — Safari extension + converter script

Rebuild packages anytime:

```bash
./scripts/package-extensions.sh
```

## How It Works

- A camel-colored pill auto-injects into every page
- Clicking it opens an in-page language picker
- Translation uses Google Translate from the extension (no user API key)
- Original text is preserved so you can restore anytime

## Repo Structure

```
ekosee/
├── downloads/
│   ├── ekosee-chrome.zip   # ← download this for Chrome
│   └── ekosee-safari.zip   # ← download this for Safari/Mac
├── chrome/                 # Chrome package (load this folder unpacked)
├── safari/                 # Safari package + convert-for-safari.sh
├── extension/              # Shared source (used to build chrome/ + safari/)
├── landing/                # Landing page with separate download buttons
├── screenshots/
├── scripts/
│   └── package-extensions.sh
└── server/
```

## Setup

### Chrome

1. Download `downloads/ekosee-chrome.zip` (or use the `chrome/` folder)
2. Chrome → `chrome://extensions` → Developer mode → **Load unpacked**
3. Select the `ekosee-chrome` / `chrome` folder

### Safari (Mac)

1. Download `downloads/ekosee-safari.zip` onto a Mac
2. Unzip, then:

```bash
cd ekosee-safari
chmod +x convert-for-safari.sh
./convert-for-safari.sh
```

3. Run in Xcode → enable Ekosee in Safari → Settings → Extensions

### Landing page

```bash
cd landing
npm install
npm run dev
```

### Optional server routes

`server/routes.ts` mirrors Google Translate calls if you want a hosted API. No OpenAI key required.

## API Endpoints (optional server)

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/ekosee/health` | — | `{ status, service, engine, timestamp }` |
| POST | `/api/ekosee/translate` | `{ texts, targetLanguage }` | `{ translations }` |
| POST | `/api/ekosee/detect` | `{ sample }` | `{ language }` |
