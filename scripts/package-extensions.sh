#!/usr/bin/env bash
# Build separate Chrome and Safari packages + downloadable zips.
# Run from repo root: ./scripts/package-extensions.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/extension"
CHROME_OUT="$ROOT/chrome"
SAFARI_OUT="$ROOT/safari"
DL="$ROOT/downloads"

if [[ ! -f "$SRC/manifest.json" ]]; then
  echo "Missing $SRC/manifest.json"
  exit 1
fi

copy_extension_files() {
  local dest="$1"
  mkdir -p "$dest/popup" "$dest/options" "$dest/icons"
  cp "$SRC/manifest.json" "$dest/"
  cp "$SRC/background.js" "$dest/"
  cp "$SRC/content.js" "$dest/"
  cp "$SRC/popup/"* "$dest/popup/"
  cp "$SRC/options/"* "$dest/options/"
  cp "$SRC/icons/"* "$dest/icons/"
}

echo "→ Building Chrome package at chrome/"
# Preserve chrome README after copy
copy_extension_files "$CHROME_OUT"
cat > "$CHROME_OUT/README.md" << 'EOF'
# Ekosee for Chrome

Standalone Chrome package. **No API key required.**

## Download (Replit / GitHub)

1. After pulling this repo (or opening it on Replit), download **`downloads/ekosee-chrome.zip`**
2. Or download / copy this entire **`chrome/`** folder

## Install

1. Unzip `ekosee-chrome.zip` if needed
2. Open Chrome → `chrome://extensions`
3. Enable **Developer mode** (top-right)
4. Click **Load unpacked**
5. Select this `chrome` folder (the one that contains `manifest.json`)

## Usage

Open any page → tap the **Translate** pill (bottom-right) → choose a language.

Powered by Google Translate. No account. No API key.
EOF

echo "→ Building Safari package at safari/"
copy_extension_files "$SAFARI_OUT"

# Safari-friendly manifest note (still MV3 WebExtension; converter wraps it)
python3 - <<'PY'
import json
from pathlib import Path
p = Path("/workspace/safari/manifest.json")
data = json.loads(p.read_text())
data["name"] = "Ekosee"
data["description"] = "Translate any web page with Google Translate — Safari / Mac. No account or API key."
# Help Safari Web Extension converter / App Store tooling identify the target
data["browser_specific_settings"] = {
    "safari": {
        "strict_min_version": "15.4"
    }
}
p.write_text(json.dumps(data, indent=2) + "\n")
PY

cat > "$SAFARI_OUT/convert-for-safari.sh" << 'EOF'
#!/usr/bin/env bash
# Convert this Safari WebExtension folder into a macOS Safari app via Xcode.
# Run on a Mac with Xcode installed, from inside this safari/ folder (or unzipped ekosee-safari).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
EXT="$ROOT"
OUT="$ROOT/safari-build"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "This script must run on macOS (found $(uname -s))."
  exit 1
fi

if ! command -v xcrun >/dev/null 2>&1; then
  echo "Xcode command-line tools not found. Install Xcode from the Mac App Store, then re-run."
  exit 1
fi

if [[ ! -f "$EXT/manifest.json" ]]; then
  echo "Missing manifest.json next to this script."
  exit 1
fi

mkdir -p "$OUT"
rm -rf "$OUT"/*

echo "Converting WebExtension → Safari macOS app…"
xcrun safari-web-extension-converter "$EXT" \
  --project-location "$OUT" \
  --app-name "Ekosee" \
  --bundle-identifier "com.ekosee.safari" \
  --macos-only \
  --force

echo
echo "Done. Opening the Xcode project…"
shopt -s nullglob
projects=("$OUT"/*.xcodeproj)
if [[ ${#projects[@]} -gt 0 ]]; then
  open "${projects[0]}"
else
  open "$OUT"
fi

echo
echo "Next:"
echo "  1. In Xcode, click Run (▶)"
echo "  2. Safari → Settings → Extensions → enable Ekosee"
echo "  3. Allow on every website when prompted"
EOF
chmod +x "$SAFARI_OUT/convert-for-safari.sh"

cat > "$SAFARI_OUT/README.md" << 'EOF'
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
EOF

echo "→ Building downloadable zips in downloads/"
mkdir -p "$DL"
rm -f "$DL/ekosee-chrome.zip" "$DL/ekosee-safari.zip"

# Zip contents so unzip creates ekosee-chrome/ and ekosee-safari/ folders
(
  cd "$ROOT"
  # Chrome zip: folder named ekosee-chrome containing extension files at top level
  rm -rf /tmp/ekosee-chrome-pack /tmp/ekosee-safari-pack
  mkdir -p /tmp/ekosee-chrome-pack/ekosee-chrome /tmp/ekosee-safari-pack/ekosee-safari
  cp -R "$CHROME_OUT"/. /tmp/ekosee-chrome-pack/ekosee-chrome/
  cp -R "$SAFARI_OUT"/. /tmp/ekosee-safari-pack/ekosee-safari/
  # Don't ship safari-build artifacts if present
  rm -rf /tmp/ekosee-safari-pack/ekosee-safari/safari-build
  (cd /tmp/ekosee-chrome-pack && zip -r -q "$DL/ekosee-chrome.zip" ekosee-chrome)
  (cd /tmp/ekosee-safari-pack && zip -r -q "$DL/ekosee-safari.zip" ekosee-safari)
)

cat > "$DL/README.md" << 'EOF'
# Downloads

Separate install packages for Chrome and Safari. Download each zip on its own after pulling from GitHub (or from the Replit file tree).

| File | Platform | What to do |
|------|----------|------------|
| **`ekosee-chrome.zip`** | Chrome (Windows / Mac / Linux) | Unzip → Chrome → `chrome://extensions` → Load unpacked → select `ekosee-chrome` |
| **`ekosee-safari.zip`** | Safari on Mac | Unzip on a Mac → run `./convert-for-safari.sh` → enable in Safari Settings → Extensions |

These zips are rebuilt by:

```bash
./scripts/package-extensions.sh
```

Source folders (also downloadable as directories):

- `chrome/` — same contents as `ekosee-chrome.zip`
- `safari/` — same contents as `ekosee-safari.zip`
EOF

echo
echo "Done."
ls -la "$CHROME_OUT" | head
ls -la "$SAFARI_OUT" | head
ls -la "$DL"
