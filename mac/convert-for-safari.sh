#!/usr/bin/env bash
# Deprecated location — Safari package is in ../safari/
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec "$ROOT/safari/convert-for-safari.sh"
