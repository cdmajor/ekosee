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
