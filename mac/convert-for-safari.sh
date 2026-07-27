#!/usr/bin/env bash
# Convert the Ekosee WebExtension into a Safari/macOS app via Xcode.
# Works from the repo (./mac/convert-for-safari.sh) or from ekosee-mac.zip root.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Resolve extension path: package root layout vs repo layout
if [[ -f "$SCRIPT_DIR/extension/manifest.json" ]]; then
  ROOT="$SCRIPT_DIR"
  EXT="$SCRIPT_DIR/extension"
  OUT="$SCRIPT_DIR/safari-build"
elif [[ -f "$SCRIPT_DIR/../extension/manifest.json" ]]; then
  ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
  EXT="$ROOT/extension"
  OUT="$SCRIPT_DIR/safari-build"
else
  echo "Could not find extension/manifest.json next to this script."
  exit 1
fi

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "This script must run on macOS (found $(uname -s))."
  echo "See mac/README.md for details."
  exit 1
fi

if ! command -v xcrun >/dev/null 2>&1; then
  echo "Xcode command-line tools not found. Install Xcode from the Mac App Store, then re-run."
  exit 1
fi

mkdir -p "$OUT"
rm -rf "$OUT"/*

echo "Converting WebExtension → Safari macOS app…"
echo "  Extension: $EXT"
echo "  Output:    $OUT"

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
echo "  1. In Xcode, click Run (▶) to build and install Ekosee"
echo "  2. Safari → Settings → Extensions → enable Ekosee"
echo "  3. Allow the extension on every website when prompted"
