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
