import { useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const BASE = import.meta.env.BASE_URL;

const EXTENSION_FILES = [
  "manifest.json",
  "background.js",
  "content.js",
  "popup/popup.html",
  "popup/popup.js",
  "popup/popup.css",
  "options/options.html",
  "options/options.js",
  "options/options.css",
  "icons/icon16.png",
  "icons/icon32.png",
  "icons/icon48.png",
  "icons/icon128.png",
  "README.md",
];

async function downloadExtension() {
  const zip = new JSZip();
  const folder = zip.folder("ekosee-extension")!;
  const base = `${window.location.origin}${BASE}extension/`;
  const apiBase = `${window.location.origin}/api`;

  await Promise.all(
    EXTENSION_FILES.map(async (file) => {
      const res = await fetch(base + file);
      if (file === "background.js") {
        const text = await res.text();
        folder.file(file, text.replace("__API_BASE__", apiBase));
      } else {
        folder.file(file, await res.blob());
      }
    })
  );

  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, "ekosee-extension.zip");
}

const FEATURES = [
  {
    icon: "🌿",
    title: "Always there",
    body: "A subtle pill sits in the corner of every page — tap it whenever you need it, invisible otherwise.",
  },
  {
    icon: "🌐",
    title: "90+ languages",
    body: "From Spanish and Japanese to Swahili, Arabic, and Zulu — translate into any language instantly.",
  },
  {
    icon: "⚡",
    title: "Whole-page translation",
    body: "Every paragraph, heading, and label translates in place without reloading the page.",
  },
  {
    icon: "🔒",
    title: "No account required",
    body: "Just install and go. No sign-up, no API key, no configuration beyond choosing your language.",
  },
  {
    icon: "↩",
    title: "Restore anytime",
    body: "One tap on the pill restores the page to its original language instantly.",
  },
  {
    icon: "🍎",
    title: "Chrome & Safari",
    body: "The same extension works in Chrome on any OS and in Safari on macOS — one download covers both.",
  },
];

const CHROME_STEPS = [
  { n: "1", text: "Click Download below and unzip the file." },
  { n: "2", text: "Open Chrome and go to chrome://extensions" },
  { n: "3", text: "Enable Developer mode (top-right toggle)." },
  { n: "4", text: 'Click Load unpacked and select the ekosee-extension folder.' },
  { n: "5", text: "Visit any page — look for the camel Translate pill in the bottom-right corner." },
];

const SAFARI_STEPS = [
  { n: "1", text: "Install Xcode from the Mac App Store (free)." },
  { n: "2", text: "Download and unzip the extension below." },
  {
    n: "3",
    text: "Run in Terminal: xcrun safari-web-extension-converter /path/to/ekosee-extension",
  },
  { n: "4", text: "Click Run in Xcode to build and install the app." },
  {
    n: "5",
    text: "In Safari → Settings → Extensions, enable Ekosee and allow access to all websites.",
  },
  {
    n: "6",
    text: "Visit any page — look for the camel Translate pill in the bottom-right corner.",
  },
];

export default function App() {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadExtension();
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#060D1B" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <img
            src={`${BASE}logo.png`}
            alt="Ekosee"
            className="h-8 w-auto"
          />
        </div>
        <div className="flex items-center gap-6 text-sm font-medium text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#install" className="hover:text-white transition-colors">Install</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-8 border"
          style={{
            background: "rgba(16,185,129,0.08)",
            borderColor: "rgba(16,185,129,0.25)",
            color: "#10B981",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 inline-block" />
          Chrome · Safari · 90+ Languages · No API Key Needed
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1.08] mb-6 text-white">
          Read any page{" "}
          <span className="shimmer">in your language</span>
        </h1>

        <p className="text-lg text-slate-400 max-w-xl mx-auto leading-relaxed mb-10">
          Ekosee translates entire web pages with one click — powered by AI, no account or API key required.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2.5 rounded-xl px-8 py-4 text-base font-bold text-white transition-opacity disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg,#10B981,#059669)",
              boxShadow: "0 8px 28px rgba(16,185,129,0.35)",
            }}
          >
            {downloading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Preparing…
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download Extension
              </>
            )}
          </button>
          <a
            href="#install"
            className="text-sm font-semibold text-slate-400 hover:text-white transition-colors underline underline-offset-4"
          >
            Installation instructions →
          </a>
        </div>

        {/* In-page pill + picker mockup */}
        <div className="mt-16 float">
          <div
            className="rounded-2xl border mx-auto overflow-hidden relative"
            style={{ background: "#0F172A", borderColor: "rgba(255,255,255,0.08)", maxWidth: 380, minHeight: 220 }}
          >
            {/* Fake browser chrome */}
            <div
              className="flex items-center gap-2 px-4 py-3 border-b"
              style={{ borderColor: "rgba(255,255,255,0.06)", background: "#1E293B" }}
            >
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 rounded-md px-3 py-1 text-xs text-slate-500" style={{ background: "#0F172A" }}>
                lemonde.fr/international
              </div>
            </div>

            {/* Fake page content */}
            <div className="p-5 space-y-2.5">
              <div className="h-3 rounded bg-slate-700/60 w-3/4" />
              <div className="h-2.5 rounded bg-slate-700/40 w-full" />
              <div className="h-2.5 rounded bg-slate-700/40 w-5/6" />
              <div className="h-2.5 rounded bg-slate-700/40 w-4/5" />
              <div className="h-2.5 rounded bg-slate-700/30 w-full mt-4" />
              <div className="h-2.5 rounded bg-slate-700/30 w-3/4" />
            </div>

            {/* Language picker panel */}
            <div
              className="absolute right-4 rounded-2xl border p-4 flex flex-col gap-3"
              style={{
                bottom: 68,
                background: "#1C1C1E",
                borderColor: "rgba(255,255,255,0.1)",
                width: 200,
                boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white tracking-wide">Translate page</span>
                <span className="text-slate-500 text-xs cursor-default">✕</span>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Translate to</div>
                <div
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-white border"
                  style={{ background: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.1)" }}
                >
                  <span>English</span>
                  <span className="text-slate-500">▾</span>
                </div>
              </div>
              <div
                className="text-center py-2 rounded-xl text-xs font-bold text-white"
                style={{ background: "#C19A6B" }}
              >
                Translate
              </div>
            </div>

            {/* Camel pill */}
            <div
              className="absolute right-4 bottom-4 flex items-center gap-2 px-5 rounded-full text-white text-sm font-semibold"
              style={{
                background: "#C19A6B",
                height: 40,
                boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
              }}
            >
              <span style={{ fontSize: 15 }}>🌐</span>
              <span>Translate</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12 tracking-tight text-white">
          Everything you need, nothing you don't
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl p-6 border transition-colors"
              style={{ background: "#0F172A", borderColor: "rgba(255,255,255,0.07)" }}
            >
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-base mb-1.5 text-white">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Install */}
      <section id="install" className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-4 tracking-tight text-white">Install Ekosee</h2>
        <p className="text-center text-slate-400 mb-12 text-sm">
          One download, two browsers. The same extension file works in both Chrome and Safari.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Chrome */}
          <div
            className="rounded-2xl p-7 border"
            style={{ background: "#0F172A", borderColor: "rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}
              >
                🌐
              </div>
              <div>
                <div className="font-bold text-white">Chrome</div>
                <div className="text-xs text-slate-500">Windows · macOS · Linux</div>
              </div>
            </div>
            <ol className="space-y-4">
              {CHROME_STEPS.map((s) => (
                <li key={s.n} className="flex gap-3">
                  <span
                    className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5"
                    style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}
                  >
                    {s.n}
                  </span>
                  <span className="text-sm text-slate-300 leading-relaxed">{s.text}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Safari */}
          <div
            className="rounded-2xl p-7 border"
            style={{ background: "#0F172A", borderColor: "rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)" }}
              >
                🧭
              </div>
              <div>
                <div className="font-bold text-white">Safari</div>
                <div className="text-xs text-slate-500">macOS · requires Xcode</div>
              </div>
            </div>
            <ol className="space-y-4">
              {SAFARI_STEPS.map((s) => (
                <li key={s.n} className="flex gap-3">
                  <span
                    className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5"
                    style={{ background: "rgba(99,102,241,0.15)", color: "#6366F1" }}
                  >
                    {s.n}
                  </span>
                  <span className="text-sm text-slate-300 leading-relaxed">{s.text}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="mt-10 text-center">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2.5 rounded-xl px-10 py-4 text-base font-bold text-white disabled:opacity-60 transition-opacity"
            style={{
              background: "linear-gradient(135deg,#10B981,#059669)",
              boxShadow: "0 8px 28px rgba(16,185,129,0.3)",
            }}
          >
            {downloading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Preparing zip…
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download ekosee-extension.zip
              </>
            )}
          </button>
          <p className="text-xs text-slate-500 mt-3">
            ~40 KB · No account · No API key · Powered by GPT-4o mini
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="border-t py-8 px-6 text-center text-xs text-slate-600"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <img src={`${BASE}logo.png`} alt="Ekosee" className="h-5 w-auto opacity-40" />
        </div>
        <p>No account · No API key · Open WebExtension standard</p>
      </footer>
    </div>
  );
}
