# Ekosee — Browser Extension

Translate any web page into your language, powered by OpenAI GPT-4o mini.

## Install in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select this `extension/` folder

## Install in Safari (macOS)

Requires Xcode (free from the Mac App Store).

1. Open Terminal and run:
   ```
   xcrun safari-web-extension-converter /path/to/extension
   ```
2. Xcode opens with a generated project — click **Run** to build and install
3. In Safari → Settings → Extensions, enable **Ekosee**
4. Click **Allow on Every Website** when prompted

## Setup

1. Click the Ekosee icon in your browser toolbar
2. Click the ⚙ Settings button
3. Paste your OpenAI API key (get one at platform.openai.com/api-keys)
4. Click **Test key** to verify, then **Save Settings**

## Usage

1. Open any web page in a foreign language
2. Click the Ekosee toolbar icon
3. Select your target language
4. Click **Translate Page**
5. Click **Restore Original** to revert

## Translation model

Ekosee uses `gpt-4o-mini` — fast, accurate, and inexpensive (~$0.001 per typical page).
Your API key is stored locally in your browser and never sent anywhere except OpenAI.

## Privacy

- Your API key lives in `chrome.storage.sync` (encrypted, browser-managed)
- Page text is sent directly from your browser to OpenAI — no Ekosee servers involved
- No analytics, no tracking, no accounts required
