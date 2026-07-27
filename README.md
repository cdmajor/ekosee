# Ekosee — AI Browser Translation Extension

Translate any webpage into 90+ languages with one click. No API key required — translation runs server-side.

## How It Works

- A camel-colored pill (🟫) auto-injects into every page via a content script
- Clicking the pill opens an in-page language picker
- Translation is batched and sent to your API server (OpenAI GPT-4o-mini under the hood)
- The original text is preserved so users can restore the page at any time

## Repo Structure

```
ekosee/
├── extension/          # The browser extension (Chrome MV3 / Safari)
│   ├── manifest.json
│   ├── background.js   # Service worker — calls translation API
│   ├── content.js      # Injects pill + picker, walks/replaces DOM text
│   ├── popup/          # Toolbar popup (minimal — points user to the pill)
│   ├── options/        # Options page (default language preference)
│   └── icons/
├── landing/            # React + Vite landing page with extension download
│   └── src/
│       ├── App.tsx     # Download button zips extension with API URL baked in
│       ├── index.css
│       └── main.tsx
└── server/
    └── routes.ts       # Express routes: GET /ekosee/health, POST /ekosee/translate, POST /ekosee/detect
```

## Setup

### Server

The server routes (`server/routes.ts`) are Express handlers. Mount them in your API server:

```ts
import ekoseeRouter from './routes/ekosee';
router.use(ekoseeRouter);
```

Set these environment variables:
```
AI_INTEGRATIONS_OPENAI_API_KEY=your_openai_key
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1
```

### Landing Page

```bash
cd landing
npm install
npm run dev
```

The download button in `App.tsx` fetches the extension files, replaces the `__API_BASE__` placeholder in `background.js` with `window.location.origin + '/api'`, zips them with JSZip, and saves the zip for the user to load unpacked.

### Extension

1. Download the zip from the landing page (or load `extension/` directly)
2. Open `chrome://extensions` → Enable Developer Mode → Load Unpacked → select the folder
3. For Safari: use Xcode's "Convert Web Extension" tool

## API Endpoints

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/ekosee/health` | — | `{ status: "ok", service: "ekosee", timestamp: string }` |
| POST | `/api/ekosee/translate` | `{ texts: string[], targetLanguage: string }` | `{ translations: string[] }` |
| POST | `/api/ekosee/detect` | `{ sample: string }` | `{ language: string }` |

All endpoints include `Access-Control-Allow-Origin: *` CORS headers so the extension can call them from any tab. Use `/api/ekosee/health` for liveness checks.

## Key Design Decisions

- **`__API_BASE__` placeholder** — `background.js` ships with this literal string. The landing page replaces it with the real server origin at download time, so the extension always calls the server it was downloaded from.
- **Shadow DOM pill** — the pill and picker use Shadow DOM to avoid CSS conflicts with host pages.
- **Batch translation** — DOM text nodes are collected, chunked by character count, and sent in batches of 40 to stay within token limits.
- **Restore** — every replaced text node stores the original in a `__ekoseeOriginal` property, so restore is always available without a network call.
