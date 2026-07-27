const express = require("express");
const app = express();
app.use(express.json());

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

app.use("/api/ekosee", (req, res, next) => {
  if (req.method === "OPTIONS") {
    cors(res);
    return res.sendStatus(204);
  }
  next();
});

app.get("/api/ekosee/health", (_req, res) => {
  cors(res);
  res.json({
    status: "ok",
    service: "ekosee",
    engine: "google-translate",
    timestamp: new Date().toISOString(),
  });
});

const GOOGLE = "https://translate.googleapis.com/translate_a/single";

app.post("/api/ekosee/translate", async (req, res) => {
  cors(res);
  try {
    const { texts, targetLanguage } = req.body || {};
    if (!Array.isArray(texts) || !targetLanguage) {
      return res.status(400).json({ error: "texts and targetLanguage required" });
    }
    const tlMap = { English: "en", Spanish: "es", French: "fr", German: "de", Japanese: "ja" };
    const tl = tlMap[targetLanguage] || targetLanguage;
    const translations = [];
    for (const text of texts) {
      const body = new URLSearchParams({ client: "gtx", sl: "auto", tl, dt: "t", q: text });
      const r = await fetch(GOOGLE, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body,
      });
      if (!r.ok) throw new Error(`Google Translate error ${r.status}`);
      const data = await r.json();
      translations.push(data[0].map((p) => p[0] || "").join(""));
    }
    res.json({ translations });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const port = process.env.PORT || 8787;
app.listen(port, "127.0.0.1", () => {
  console.log(`Ekosee API listening on http://127.0.0.1:${port}`);
});
