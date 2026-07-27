# Ekosee screenshots

Product screenshots of Ekosee translating **foreign websites**, with the full site address visible in the browser bar.

## Mac (Safari) — 4

| File | Site | Address shown |
|------|------|----------------|
| `mac/mac-01-lemonde-fr.png` | Le Monde (French) | `https://www.lemonde.fr/international/article/sommet-europeen-bruxelles` |
| `mac/mac-02-asahi-jp.png` | Asahi Shimbun (Japanese) | `https://www.asahi.com/articles/economy-summit-tokyo-2026.html` |
| `mac/mac-03-spiegel-de.png` | DER SPIEGEL (German) | `https://www.spiegel.de/politik/deutschland/bundestag-energiegesetz.html` |
| `mac/mac-04-elpais-es.png` | El País (Spanish → English) | `https://elpais.com/internacional/cumbre-clima-madrid.html` |

## PC (Chrome) — 4

| File | Site | Address shown |
|------|------|----------------|
| `pc/pc-01-corriere-it.png` | Corriere della Sera (Italian) | `https://www.corriere.it/esteri/vertice-ue-roma.shtml` |
| `pc/pc-02-folha-pt.png` | Folha de S.Paulo (Portuguese) | `https://www1.folha.uol.com.br/mundo/cupula-amazonia-brasilia.shtml` |
| `pc/pc-03-bbc-arabic.png` | BBC News Arabic | `https://www.bbc.com/arabic/articles/middle-east-summit-cairo` |
| `pc/pc-04-chosun-ko.png` | Chosun Ilbo (Korean → English) | `https://www.chosun.com/international/asia/seoul-summit-2026/` |

## API health

See `api-health.json` (`GET /api/ekosee/health` → `status: "ok"`, `engine: "google-translate"`).

## Regenerate

```bash
npm install
python3 -m http.server 8790 --directory screenshots/demo
# other terminal:
node scripts/capture-screenshots.mjs
```
