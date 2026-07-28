// Ekosee — content script
// Injects a floating camel pill in the bottom-right corner of every page.
// Clicking it opens an in-page language picker; selecting a language translates the whole page.

(() => {
  if (document.getElementById("ekosee-host")) return; // already injected

  // ─── Constants ─────────────────────────────────────────────────────────────

  const SKIP_TAGS = new Set([
    "SCRIPT","STYLE","NOSCRIPT","IFRAME","CANVAS","SVG",
    "MATH","HEAD","META","LINK","CODE","PRE","KBD","SAMP",
    "VAR","INPUT","TEXTAREA","SELECT","BUTTON",
  ]);
  const MIN_LEN = 3;
  const MAX_BATCH_CHARS = 8000;

  const LANGUAGES = [
    "Afrikaans","Albanian","Amharic","Arabic","Armenian","Azerbaijani","Basque",
    "Belarusian","Bengali","Bosnian","Bulgarian","Catalan","Chinese (Simplified)",
    "Chinese (Traditional)","Croatian","Czech","Danish","Dutch","English",
    "Estonian","Finnish","French","Galician","Georgian","German","Greek",
    "Gujarati","Haitian Creole","Hausa","Hebrew","Hindi","Hungarian","Icelandic",
    "Igbo","Indonesian","Irish","Italian","Japanese","Javanese","Kannada",
    "Kazakh","Khmer","Korean","Kurdish","Kyrgyz","Lao","Latvian","Lithuanian",
    "Luxembourgish","Macedonian","Malagasy","Malay","Malayalam","Maltese","Maori",
    "Marathi","Mongolian","Myanmar (Burmese)","Nepali","Norwegian","Pashto",
    "Persian","Polish","Portuguese","Punjabi","Romanian","Russian","Samoan",
    "Serbian","Shona","Sindhi","Sinhala","Slovak","Slovenian","Somali",
    "Spanish","Sundanese","Swahili","Swedish","Tajik","Tamil","Telugu","Thai",
    "Turkish","Ukrainian","Urdu","Uzbek","Vietnamese","Welsh","Xhosa",
    "Yiddish","Yoruba","Zulu",
  ];

  // ─── State ──────────────────────────────────────────────────────────────────

  let panelOpen    = false;
  let isTranslating = false;
  let translatedLang = null;

  // ─── Shadow DOM host ────────────────────────────────────────────────────────

  const host = document.createElement("div");
  host.id = "ekosee-host";
  host.style.cssText = "all: initial; position: fixed; bottom: 0; right: 0; z-index: 2147483647; display: block;";
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :host { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; }

    /* ── Pill ── */
    #pill {
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 0 18px;
      height: 42px;
      border-radius: 999px;
      background: #C19A6B;
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.01em;
      cursor: pointer;
      border: none;
      outline: none;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25), 0 1px 4px rgba(0,0,0,0.15);
      transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.2s ease;
      user-select: none;
      white-space: nowrap;
    }
    #pill:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(0,0,0,0.3); }
    #pill:active { transform: translateY(0); }
    #pill.translating { background: #A07E55; cursor: default; }
    #pill.translated { background: #7B8F6A; gap: 0; padding: 0 6px 0 16px; }
    #pill.translated .pill-restore {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      margin-left: 6px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      transition: background 0.15s;
      cursor: pointer;
      flex-shrink: 0;
    }
    #pill.translated .pill-restore:hover { background: rgba(255,255,255,0.35); }
    #pill .pill-globe { font-size: 15px; line-height: 1; }
    #pill .pill-label { line-height: 1; }

    /* Spinner */
    .spinner {
      width: 14px; height: 14px;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      flex-shrink: 0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Panel ── */
    #panel {
      position: fixed;
      bottom: 78px;
      right: 24px;
      width: 240px;
      background: #1C1C1E;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 16px;
      box-shadow: 0 16px 48px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      flex-direction: column;
      gap: 12px;
      transform-origin: bottom right;
      animation: pop-in 0.18s cubic-bezier(0.34,1.56,0.64,1) both;
    }
    @keyframes pop-in {
      from { opacity: 0; transform: scale(0.85) translateY(6px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    #panel.closing {
      animation: pop-out 0.14s ease forwards;
    }
    @keyframes pop-out {
      to { opacity: 0; transform: scale(0.88) translateY(4px); }
    }

    #panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    #panel-title {
      font-size: 13px;
      font-weight: 700;
      color: #fff;
      letter-spacing: 0.02em;
    }
    #panel-close {
      width: 24px; height: 24px;
      border-radius: 50%;
      background: rgba(255,255,255,0.08);
      border: none;
      color: rgba(255,255,255,0.5);
      font-size: 14px;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s, color 0.15s;
    }
    #panel-close:hover { background: rgba(255,255,255,0.16); color: #fff; }

    .panel-label {
      font-size: 11px;
      font-weight: 600;
      color: rgba(255,255,255,0.4);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .select-wrap {
      position: relative;
    }
    #lang-select {
      width: 100%;
      padding: 9px 32px 9px 12px;
      border-radius: 10px;
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.1);
      color: #fff;
      font-size: 13px;
      font-family: inherit;
      appearance: none;
      -webkit-appearance: none;
      cursor: pointer;
      outline: none;
      transition: border-color 0.15s;
    }
    #lang-select:focus { border-color: #C19A6B; }
    #lang-select option { background: #1C1C1E; color: #fff; }
    .select-arrow {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      color: rgba(255,255,255,0.4);
    }

    #translate-btn {
      width: 100%;
      padding: 10px;
      border-radius: 10px;
      background: #C19A6B;
      border: none;
      color: #fff;
      font-size: 13px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      transition: background 0.15s, transform 0.1s;
      letter-spacing: 0.02em;
    }
    #translate-btn:hover { background: #A8855B; }
    #translate-btn:active { transform: scale(0.98); }
  `;
  shadow.appendChild(style);

  // ─── Pill element ───────────────────────────────────────────────────────────

  const pill = document.createElement("button");
  pill.id = "pill";
  pill.innerHTML = `<span class="pill-globe">🌐</span><span class="pill-label">Translate</span>`;
  shadow.appendChild(pill);

  // ─── Panel element ──────────────────────────────────────────────────────────

  let panel = null;

  function buildPanel() {
    panel = document.createElement("div");
    panel.id = "panel";
    panel.innerHTML = `
      <div id="panel-header">
        <span id="panel-title">Translate page</span>
        <button id="panel-close" aria-label="Close">✕</button>
      </div>
      <div>
        <div class="panel-label" style="margin-bottom:6px">Translate to</div>
        <div class="select-wrap">
          <select id="lang-select">
            ${LANGUAGES.map(l => `<option value="${l}"${l === "English" ? " selected" : ""}>${l}</option>`).join("")}
          </select>
          <svg class="select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>
      <button id="translate-btn">Translate</button>
    `;
    shadow.appendChild(panel);

    // Restore saved language
    chrome.storage.sync.get(["defaultLang"], ({ defaultLang }) => {
      if (defaultLang) {
        const sel = panel.querySelector("#lang-select");
        if (sel) sel.value = defaultLang;
      }
    });

    panel.querySelector("#panel-close").addEventListener("click", closePanel);
    panel.querySelector("#translate-btn").addEventListener("click", () => {
      const lang = panel.querySelector("#lang-select").value;
      chrome.storage.sync.set({ defaultLang: lang });
      closePanel();
      startTranslation(lang);
    });
  }

  function openPanel() {
    if (panelOpen || isTranslating || translatedLang) return;
    panelOpen = true;
    buildPanel();
  }

  function closePanel() {
    if (!panel) return;
    panel.classList.add("closing");
    setTimeout(() => {
      panel?.remove();
      panel = null;
      panelOpen = false;
    }, 140);
  }

  // ─── Pill click handling ────────────────────────────────────────────────────

  pill.addEventListener("click", (e) => {
    if (isTranslating) return;

    if (translatedLang) {
      // clicking the label portion restores; clicking the X button is handled separately
      if (!e.target.closest(".pill-restore")) restorePage();
      return;
    }

    if (panelOpen) {
      closePanel();
    } else {
      openPanel();
    }
  });

  // Close panel when clicking outside
  document.addEventListener("click", (e) => {
    if (!panelOpen) return;
    if (host.contains(e.target)) return;
    closePanel();
  }, { capture: true });

  // ─── Pill state helpers ─────────────────────────────────────────────────────

  function setPillDefault() {
    pill.className = "";
    pill.innerHTML = `<span class="pill-globe">🌐</span><span class="pill-label">Translate</span>`;
    pill.disabled = false;
  }

  function setPillTranslating(pct) {
    pill.className = "translating";
    pill.innerHTML = `<div class="spinner"></div><span class="pill-label">Translating${pct > 0 ? ` ${pct}%` : "…"}</span>`;
    pill.disabled = true;
  }

  function setPillTranslated(lang) {
    pill.className = "translated";
    pill.innerHTML = `
      <span class="pill-label">✓ ${lang}</span>
      <span class="pill-restore" title="Restore original" aria-label="Restore">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
        </svg>
      </span>
    `;
    pill.disabled = false;
    pill.querySelector(".pill-restore").addEventListener("click", (e) => {
      e.stopPropagation();
      restorePage();
    });
  }

  // ─── DOM walking ────────────────────────────────────────────────────────────

  function collectTextNodes(root) {
    const walker = document.createTreeWalker(
      root ?? document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
          if (parent.closest("script,style,noscript,iframe")) return NodeFilter.FILTER_REJECT;
          if (parent.isContentEditable) return NodeFilter.FILTER_REJECT;
          const text = node.textContent.trim();
          if (text.length < MIN_LEN) return NodeFilter.FILTER_SKIP;
          if (/^[\d\s\W]+$/.test(text)) return NodeFilter.FILTER_SKIP;
          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);
    return nodes;
  }

  // ─── Translation ────────────────────────────────────────────────────────────

  async function startTranslation(lang) {
    isTranslating = true;
    setPillTranslating(0);

    try {
      const textNodes = collectTextNodes();
      if (textNodes.length === 0) { setPillDefault(); isTranslating = false; return; }

      for (const node of textNodes) {
        if (!node.__ekoseeOriginal) node.__ekoseeOriginal = node.textContent;
      }

      const batches = [];
      let current = [], currentChars = 0;
      for (const node of textNodes) {
        const text = node.textContent.trim();
        if (currentChars + text.length > MAX_BATCH_CHARS && current.length > 0) {
          batches.push(current); current = []; currentChars = 0;
        }
        current.push(node); currentChars += text.length;
      }
      if (current.length > 0) batches.push(current);

      let done = 0;
      for (const batch of batches) {
        const texts = batch.map(n => n.textContent.trim());
        const pct = Math.round((done / textNodes.length) * 100);
        setPillTranslating(pct);

        const res = await chrome.runtime.sendMessage({
          type: "TRANSLATE_BATCH",
          texts,
          targetLanguage: lang,
        });
        if (!res.ok) throw new Error(res.unlicensed ? "Subscription required — click to upgrade." : (res.error || "Translation failed"));

        for (let i = 0; i < batch.length; i++) {
          const node = batch[i];
          const translated = res.translations[i];
          if (translated && translated !== texts[i]) {
            const leading  = node.textContent.match(/^\s*/)?.[0] ?? "";
            const trailing = node.textContent.match(/\s*$/)?.[0] ?? "";
            node.textContent = leading + translated + trailing;
            node.__ekoseeTranslated = true;
          }
        }
        done += batch.length;
      }

      translatedLang = lang;
      setPillTranslated(lang);
    } catch (err) {
      const label = (err && err.message) ? err.message : "Failed — retry";
      pill.className = "";
      pill.innerHTML = `<span class="pill-globe">⚠</span><span class="pill-label">${label}</span>`;
      pill.disabled = false;
      setTimeout(setPillDefault, 5000);
    } finally {
      isTranslating = false;
    }
  }

  function restorePage() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.__ekoseeOriginal) {
        node.textContent = node.__ekoseeOriginal;
        delete node.__ekoseeTranslated;
      }
    }
    translatedLang = null;
    setPillDefault();
  }

  // ─── Message bridge (for toolbar popup, if used) ────────────────────────────

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "GET_STATUS") {
      sendResponse({ isTranslating, currentLanguage: translatedLang });
    }
    if (message.type === "RESTORE_PAGE") {
      restorePage();
      sendResponse({ ok: true });
    }
  });
})();
