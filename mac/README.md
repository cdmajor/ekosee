# Ekosee for Mac (Safari)

Safari on macOS needs a small wrapper app around the WebExtension. Apple’s converter builds that for you.

## Requirements

- macOS with Safari 15.4+
- [Xcode](https://apps.apple.com/app/xcode/id497799835) (free from the Mac App Store)

## Convert & install

1. Download and unzip `ekosee-mac.zip` (or clone this repo)
2. In Terminal:

```bash
# from the unzipped ekosee-mac folder:
chmod +x convert-for-safari.sh && ./convert-for-safari.sh

# or from a full repo checkout:
chmod +x mac/convert-for-safari.sh && ./mac/convert-for-safari.sh
```

3. Xcode opens with an **Ekosee** macOS app — click **Run** (▶)
4. Safari → **Settings** → **Extensions** → enable **Ekosee**
5. Allow access on every website when prompted

### Manual convert (same result)

```bash
xcrun safari-web-extension-converter /path/to/extension \
  --app-name "Ekosee" \
  --bundle-identifier "com.ekosee.safari" \
  --macos-only \
  --force
```

No API key. No account. Same Google Translate engine as the Chrome build.

## Usage

Same as Chrome: use the in-page **Translate** pill on any site.
