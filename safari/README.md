# Ekosee for Safari (Mac)

Standalone Safari / macOS package. **No API key required.**

## Download (Replit / GitHub)

1. After pulling this repo (or opening it on Replit), download **`downloads/ekosee-safari.zip`**
2. Or download / copy this entire **`safari/`** folder

## Install (macOS + Xcode)

1. Unzip `ekosee-safari.zip` on your Mac
2. In Terminal:

```bash
cd /path/to/safari   # or the unzipped ekosee-safari folder
chmod +x convert-for-safari.sh
./convert-for-safari.sh
```

3. In Xcode, click **Run** (▶)
4. Safari → **Settings** → **Extensions** → enable **Ekosee**
5. Allow access on every website when prompted

### Manual convert

```bash
xcrun safari-web-extension-converter /path/to/safari \
  --app-name "Ekosee" \
  --bundle-identifier "com.ekosee.safari" \
  --macos-only \
  --force
```

## Usage

Same as Chrome: tap the **Translate** pill on any page.

Powered by Google Translate. No account. No API key.
