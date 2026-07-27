# Ekosee — AI Browser Translation Extension

Translate any webpage into 90+ languages with one click. **No API key required** — powered by Google Translate.

## How It Works

- A camel-colored pill auto-injects into every page via a content script
- Clicking the pill opens an in-page language picker
- Translation is batched and sent to Google Translate from the extension (no user API key)
- The original text is preserved so users can restore the page at any time

## Repo Structure

```
ekosee/
├── extension/          # Shared WebExtension (Chrome MV3 / Safari source)
│   ├── manifest.json
│   ├── background.js   # Service worker — Google Translate (no API key)
│   ├── content.js      # Injects pill + picker, walks/replaces DOM text
│   ├── popup/          # Toolbar popup
│   ├── options/        # Default language preference
│   └── icons/
├── chrome/             # Chrome install notes
├── mac/                # Mac/Safari convert script + install notes
├── landing/            # React + Vite landing (Chrome & Mac downloads)
│   └── src/
└── server/
    └── routes.ts       # Optional Express routes (also Google Translate, no OpenAI key)
```

## Setup

### Chrome

See `chrome/README.md`, or load `extension/` unpacked at `chrome://extensions`.

### Mac (Safari)

See `mac/README.md`. On a Mac with Xcode:

```bash
./mac/convert-for-safari.sh
```

### Landing Page

```bash
cd landing
npm install
npm run dev
```

The landing page offers **Download for Chrome** and **Download for Mac** zips. Chrome zip is load-unpacked ready; Mac zip includes `convert-for-safari.sh`.

### Optional server routes

`server/routes.ts` mirrors the extension’s Google Translate calls if you want a hosted API. No OpenAI / Cloud Translation API key is required.

```ts
import { ekoseeRouter } from './routes';
router.use('/api', ekoseeRouter);
```

## API Endpoints (optional server)

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/ekosee/health` | — | `{ status: "ok", service: "ekosee", engine: "google-translate", timestamp }` |
| POST | `/api/ekosee/translate` | `{ texts: string[], targetLanguage: string }` | `{ translations: string[] }` |
| POST | `/api/ekosee/detect` | `{ sample: string }` | `{ language: string }` |

## Key Design Decisions

- **Google Translate, no key** — the extension talks to `translate.googleapis.com` directly from the background worker.
- **Chrome + Mac packages** — separate download paths and docs; Mac uses Apple’s Safari Web Extension converter.
- **Shadow DOM pill** — avoids CSS conflicts with host pages.
- **Batch translation** — DOM text nodes are collected and translated with bounded concurrency.
- **Restore** — originals live on each text node as `__ekoseeOriginal`.
