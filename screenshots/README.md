# Ekosee screenshots

Product screenshots for Mac (Safari) and PC (Chrome). Generated from `screenshots/demo/demo.html`.

## API health

Checked against local `GET /api/ekosee/health`:

```json
{"status":"ok","service":"ekosee","engine":"google-translate","timestamp":"2026-07-27T18:54:25.585Z"}
```

## Mac (Safari) — 4

| File | Scene |
|------|--------|
| `mac/mac-01-landing.png` | Landing / Download for Mac |
| `mac/mac-02-safari-extensions.png` | Safari Extensions enabled |
| `mac/mac-03-language-picker.png` | Translate pill + language picker |
| `mac/mac-04-translated.png` | Page translated to English |

## PC (Chrome) — 4

| File | Scene |
|------|--------|
| `pc/pc-01-landing.png` | Landing / Download for Chrome |
| `pc/pc-02-chrome-extensions.png` | chrome://extensions with Ekosee on |
| `pc/pc-03-language-picker.png` | Translate pill + language picker |
| `pc/pc-04-translated.png` | Page translated to English |

## Regenerate

```bash
# terminal 1 — API (optional for health file)
node scripts/dev-api.cjs

# terminal 2 — demo pages
python3 -m http.server 8790 --directory screenshots/demo

# terminal 3 — capture
node scripts/capture-screenshots.mjs
```
