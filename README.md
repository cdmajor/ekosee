# Ekosee — Browser Extension

Translate any web page into 90+ languages with one click. Translation runs server-side — no API key, no setup, no accounts required beyond a Gulliver subscription.

## Install in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select this `extension/` folder

## Get a subscription

1. Click the Ekosee icon in your toolbar
2. Click **Buy Now** to open Whop checkout ($9.99 one-time)
3. Complete payment — the tab closes automatically and Ekosee activates
4. You're done — no membership ID entry needed

## Usage

1. Visit any page in a foreign language
2. A camel-colored pill appears in the bottom-right corner — click it
3. Select your target language and click **Translate**
4. The page text swaps in place instantly without reloading
5. Click **×** on the pill to restore the original

## How it works

- Translation runs on Gulliver's servers using GPT-4o mini
- Your Whop membership is verified server-side on every request
- No text or browsing data is stored — requests are stateless
- Your membership ID is stored locally in `chrome.storage.local`

## Privacy

- No analytics, no tracking
- Page text is sent to Gulliver's API for translation, then discarded
- Membership ID lives only in local browser storage
