# Ekosee — Browser Extension

Translate any web page with Google Translate. **No API key. No account.**

Works in **Chrome** (any OS) and **Safari on Mac**.

## Install in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select this `extension/` folder

See also `chrome/README.md` in the repo root.

## Install in Safari (macOS)

Requires Xcode (free from the Mac App Store).

```bash
# from the repo root
chmod +x mac/convert-for-safari.sh
./mac/convert-for-safari.sh
```

Then Run in Xcode, and enable **Ekosee** under Safari → Settings → Extensions.

Full steps: `mac/README.md`.

## Setup

None. There is no API key to paste. Optionally set a default language in the extension options (toolbar icon → Settings).

## Usage

1. Open any web page
2. Click the **Translate** pill in the bottom-right corner
3. Choose a language and tap **Translate**
4. Tap restore on the pill to revert

## Translation engine

Ekosee calls Google Translate’s public web endpoint from the extension background worker. No Ekosee server and no Google Cloud API key are required.

## Privacy

- No account, no analytics
- Page text is sent to Google Translate to produce translations
- Default language preference is stored in `chrome.storage.sync` (browser-managed)
