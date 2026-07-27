import { Router } from "express";

export const ekoseeRouter = Router();

const GOOGLE_TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single";
const CONCURRENCY = 6;

/** Display name → Google Translate language code */
const LANG_CODES: Record<string, string> = {
  Afrikaans: "af",
  Albanian: "sq",
  Amharic: "am",
  Arabic: "ar",
  Armenian: "hy",
  Azerbaijani: "az",
  Basque: "eu",
  Belarusian: "be",
  Bengali: "bn",
  Bosnian: "bs",
  Bulgarian: "bg",
  Catalan: "ca",
  "Chinese (Simplified)": "zh-CN",
  "Chinese (Traditional)": "zh-TW",
  Croatian: "hr",
  Czech: "cs",
  Danish: "da",
  Dutch: "nl",
  English: "en",
  Estonian: "et",
  Finnish: "fi",
  French: "fr",
  Galician: "gl",
  Georgian: "ka",
  German: "de",
  Greek: "el",
  Gujarati: "gu",
  "Haitian Creole": "ht",
  Hausa: "ha",
  Hebrew: "iw",
  Hindi: "hi",
  Hungarian: "hu",
  Icelandic: "is",
  Igbo: "ig",
  Indonesian: "id",
  Irish: "ga",
  Italian: "it",
  Japanese: "ja",
  Javanese: "jv",
  Kannada: "kn",
  Kazakh: "kk",
  Khmer: "km",
  Korean: "ko",
  Kurdish: "ku",
  Kyrgyz: "ky",
  Lao: "lo",
  Latvian: "lv",
  Lithuanian: "lt",
  Luxembourgish: "lb",
  Macedonian: "mk",
  Malagasy: "mg",
  Malay: "ms",
  Malayalam: "ml",
  Maltese: "mt",
  Maori: "mi",
  Marathi: "mr",
  Mongolian: "mn",
  "Myanmar (Burmese)": "my",
  Nepali: "ne",
  Norwegian: "no",
  Pashto: "ps",
  Persian: "fa",
  Polish: "pl",
  Portuguese: "pt",
  Punjabi: "pa",
  Romanian: "ro",
  Russian: "ru",
  Samoan: "sm",
  Serbian: "sr",
  Shona: "sn",
  Sindhi: "sd",
  Sinhala: "si",
  Slovak: "sk",
  Slovenian: "sl",
  Somali: "so",
  Spanish: "es",
  Sundanese: "su",
  Swahili: "sw",
  Swedish: "sv",
  Tagalog: "tl",
  Tajik: "tg",
  Tamil: "ta",
  Telugu: "te",
  Thai: "th",
  Turkish: "tr",
  Ukrainian: "uk",
  Urdu: "ur",
  Uzbek: "uz",
  Vietnamese: "vi",
  Welsh: "cy",
  Xhosa: "xh",
  Yiddish: "yi",
  Yoruba: "yo",
  Zulu: "zu",
};

const CODE_TO_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(LANG_CODES).map(([name, code]) => [code, name])
);

// Allow Chrome/Safari extension origins
function corsHeaders(res: import("express").Response) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

ekoseeRouter.options("/ekosee/translate", (_req, res) => { corsHeaders(res); res.sendStatus(204); });
ekoseeRouter.options("/ekosee/detect",    (_req, res) => { corsHeaders(res); res.sendStatus(204); });
ekoseeRouter.options("/ekosee/health",    (_req, res) => { corsHeaders(res); res.sendStatus(204); });

// GET /api/ekosee/health
ekoseeRouter.get("/ekosee/health", (_req, res) => {
  corsHeaders(res);
  res.json({
    status: "ok",
    service: "ekosee",
    engine: "google-translate",
    timestamp: new Date().toISOString(),
  });
});

function resolveLangCode(targetLanguage: string): string {
  if (LANG_CODES[targetLanguage]) return LANG_CODES[targetLanguage];
  const lower = targetLanguage.toLowerCase();
  const byName = Object.entries(LANG_CODES).find(([name]) => name.toLowerCase() === lower);
  if (byName) return byName[1];
  if (/^[a-z]{2}(-[A-Z]{2})?$/.test(targetLanguage)) return targetLanguage;
  throw new Error(`Unsupported language: ${targetLanguage}`);
}

async function translateOne(text: string, tl: string): Promise<string> {
  if (!text.trim()) return text;

  const body = new URLSearchParams({
    client: "gtx",
    sl: "auto",
    tl,
    dt: "t",
    q: text,
  });

  const res = await fetch(GOOGLE_TRANSLATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body,
  });

  if (!res.ok) throw new Error(`Google Translate error ${res.status}`);

  const data: unknown = await res.json();
  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    throw new Error("Unexpected translation response.");
  }
  return (data[0] as unknown[])
    .map((part) => (Array.isArray(part) && typeof part[0] === "string" ? part[0] : ""))
    .join("");
}

async function mapPool<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  );
  return results;
}

// POST /api/ekosee/translate
ekoseeRouter.post("/ekosee/translate", async (req, res) => {
  const { texts, targetLanguage } = req.body as {
    texts?: string[];
    targetLanguage?: string;
  };

  if (!Array.isArray(texts) || texts.length === 0) {
    return res.status(400).json({ error: "texts must be a non-empty array" });
  }
  if (!targetLanguage || typeof targetLanguage !== "string") {
    return res.status(400).json({ error: "targetLanguage is required" });
  }

  try {
    const tl = resolveLangCode(targetLanguage);
    const translations = await mapPool(texts, CONCURRENCY, (text) => translateOne(text, tl));
    corsHeaders(res);
    res.json({ translations });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Translation failed";
    corsHeaders(res);
    res.status(500).json({ error: message });
  }
});

// POST /api/ekosee/detect
ekoseeRouter.post("/ekosee/detect", async (req, res) => {
  const { sample } = req.body as { sample?: string };
  if (!sample || typeof sample !== "string") {
    return res.status(400).json({ error: "sample is required" });
  }

  try {
    const body = new URLSearchParams({
      client: "gtx",
      sl: "auto",
      tl: "en",
      dt: "t",
      q: sample.slice(0, 300),
    });

    const gRes = await fetch(GOOGLE_TRANSLATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body,
    });

    if (!gRes.ok) throw new Error(`Google Translate error ${gRes.status}`);

    const data: unknown = await gRes.json();
    const code =
      (Array.isArray(data) && typeof data[2] === "string" && data[2]) ||
      "und";
    const language = CODE_TO_NAME[code] || CODE_TO_NAME[code.split("-")[0]] || code || "Unknown";

    corsHeaders(res);
    res.json({ language });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Detection failed";
    corsHeaders(res);
    res.status(500).json({ error: message });
  }
});
