// Ekosee — background service worker
// Translates via Google Translate (no API key required).

const GOOGLE_TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single";
const CONCURRENCY = 6;

/** Display name → Google Translate language code */
const LANG_CODES = {
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

const CODE_TO_NAME = Object.fromEntries(
  Object.entries(LANG_CODES).map(([name, code]) => [code, name])
);

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "TRANSLATE_BATCH") {
    translateBatch(message.texts, message.targetLanguage)
      .then((translations) => sendResponse({ ok: true, translations }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  if (message.type === "DETECT_LANGUAGE") {
    detectLanguage(message.sample)
      .then((language) => sendResponse({ ok: true, language }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }
});

function resolveLangCode(targetLanguage) {
  if (LANG_CODES[targetLanguage]) return LANG_CODES[targetLanguage];
  const lower = String(targetLanguage || "").toLowerCase();
  const byName = Object.entries(LANG_CODES).find(([name]) => name.toLowerCase() === lower);
  if (byName) return byName[1];
  // Already a code?
  if (/^[a-z]{2}(-[A-Z]{2})?$/.test(targetLanguage)) return targetLanguage;
  throw new Error(`Unsupported language: ${targetLanguage}`);
}

async function translateBatch(texts, targetLanguage) {
  const tl = resolveLangCode(targetLanguage);
  return mapPool(texts, CONCURRENCY, (text) => translateOne(text, tl));
}

async function translateOne(text, tl) {
  if (!text || !text.trim()) return text;

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

  const data = await res.json();
  // Response: [[["translated","original",...], ...], null, "src"]
  if (!Array.isArray(data?.[0])) throw new Error("Unexpected translation response.");
  return data[0].map((part) => part?.[0] ?? "").join("");
}

async function detectLanguage(sample) {
  const body = new URLSearchParams({
    client: "gtx",
    sl: "auto",
    tl: "en",
    dt: "t",
    q: String(sample || "").slice(0, 300),
  });

  const res = await fetch(GOOGLE_TRANSLATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body,
  });

  if (!res.ok) throw new Error(`Google Translate error ${res.status}`);
  const data = await res.json();
  const code = data?.[2] || data?.[8]?.[0]?.[0] || "und";
  return CODE_TO_NAME[code] || CODE_TO_NAME[code.split("-")[0]] || code || "Unknown";
}

async function mapPool(items, concurrency, fn) {
  const results = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}
