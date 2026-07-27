import { useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

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

type Platform = "chrome" | "mac";

async function fetchText(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.text();
}

async function fetchBlob(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.blob();
}

async function downloadExtension(platform: Platform) {
  const zip = new JSZip();
  const folderName = platform === "chrome" ? "ekosee-chrome" : "ekosee-mac";
  const folder = zip.folder(folderName)!;
  const extFolder = folder.folder("extension")!;
  const base = `${window.location.origin}/ekosee/extension/`;

  await Promise.all(
    EXTENSION_FILES.map(async (file) => {
      if (file.endsWith(".js") || file.endsWith(".json") || file.endsWith(".html") || file.endsWith(".css") || file.endsWith(".md")) {
        extFolder.file(file, await fetchText(base + file));
      } else {
        extFolder.file(file, await fetchBlob(base + file));
      }
    })
  );

  if (platform === "chrome") {
    folder.file(
      "README.md",
      await fetchText(`${window.location.origin}/ekosee/chrome/README.md`).catch(() =>
        [
          "# Ekosee for Chrome",
          "",
          "1. Open chrome://extensions",
          "2. Enable Developer mode",
          "3. Load unpacked → select the extension/ folder",
          "",
          "No API key required. Powered by Google Translate.",
        ].join("\n")
      )
    );
  } else {
    const macBase = `${window.location.origin}/ekosee/mac/`;
    folder.file(
      "README.md",
      await fetchText(`${macBase}README.md`).catch(() =>
        [
          "# Ekosee for Mac (Safari)",
          "",
          "Requires Xcode. Run ./convert-for-safari.sh then enable Ekosee in Safari → Settings → Extensions.",
          "",
          "No API key required. Powered by Google Translate.",
        ].join("\n")
      )
    );
    folder.file(
      "convert-for-safari.sh",
      await fetchText(`${macBase}convert-for-safari.sh`).catch(() =>
        [
          "#!/usr/bin/env bash",
          "set -euo pipefail",
          'ROOT="$(cd "$(dirname "$0")" && pwd)"',
          'xcrun safari-web-extension-converter "$ROOT/extension" --app-name "Ekosee" --bundle-identifier "com.ekosee.safari" --macos-only --force',
        ].join("\n")
      )
    );
  }

  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `${folderName}.zip`);
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
    title: "No account or API key",
    body: "Install and go. Translation uses Google Translate — nothing to configure beyond your language.",
  },
  {
    icon: "↩",
    title: "Restore anytime",
    body: "One tap on the pill restores the page to its original language instantly.",
  },
  {
    icon: "🍎",
    title: "Chrome & Mac",
    body: "Dedicated Chrome and Mac (Safari) packages — same translator, install path for each platform.",
  },
];

const CHROME_STEPS = [
  { n: "1", text: "Download ekosee-chrome.zip and unzip it." },
  { n: "2", text: "Open Chrome and go to chrome://extensions" },
  { n: "3", text: "Enable Developer mode (top-right toggle)." },
  { n: "4", text: "Click Load unpacked and select the extension folder inside ekosee-chrome." },
  { n: "5", text: "Visit any page — look for the Translate pill in the bottom-right corner." },
];

const SAFARI_STEPS = [
  { n: "1", text: "Install Xcode from the Mac App Store (free)." },
  { n: "2", text: "Download ekosee-mac.zip and unzip it." },
  {
    n: "3",
    text: "In Terminal, run: chmod +x convert-for-safari.sh && ./convert-for-safari.sh",
  },
  { n: "4", text: "Click Run in Xcode to build and install the app." },
  {
    n: "5",
    text: "In Safari → Settings → Extensions, enable Ekosee and allow access to all websites.",
  },
  {
    n: "6",
    text: "Visit any page — look for the Translate pill in the bottom-right corner.",
  },
];

function DownloadButton({
  platform,
  downloading,
  onClick,
  label,
}: {
  platform: Platform;
  downloading: Platform | null;
  onClick: (p: Platform) => void;
  label: string;
}) {
  const busy = downloading === platform;
  return (
    <button
      onClick={() => onClick(platform)}
      disabled={downloading !== null}
      className="flex items-center gap-2.5 rounded-xl px-7 py-4 text-base font-bold text-white transition-opacity disabled:opacity-60"
      style={{
        background:
          platform === "chrome"
            ? "linear-gradient(135deg,#10B981,#059669)"
            : "linear-gradient(135deg,#64748B,#334155)",
        boxShadow:
          platform === "chrome"
            ? "0 8px 28px rgba(16,185,129,0.35)"
            : "0 8px 28px rgba(51,65,85,0.45)",
      }}
    >
      {busy ? (
        <>
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Preparing…
        </>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          {label}
        </>
      )}
    </button>
  );
}

export default function App() {
  const [downloading, setDownloading] = useState<Platform | null>(null);

  const handleDownload = async (platform: Platform) => {
    setDownloading(platform);
    try {
      await downloadExtension(platform);
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#060D1B" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <img
            src="/ekosee/extension/icons/icon32.png"
            alt="Ekosee"
            className="w-7 h-7 rounded-md"
          />
          <span
            className="text-lg font-bold tracking-tight"
            style={{
              background: "linear-gradient(135deg,#10B981,#6366F1)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Ekosee
          </span>
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
          Chrome · Mac Safari · Google Translate · No API Key
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1.08] mb-6">
          Read any page{" "}
          <span className="shimmer">in your language</span>
        </h1>

        <p className="text-lg text-slate-400 max-w-xl mx-auto leading-relaxed mb-10">
          Ekosee translates entire web pages with one click using Google Translate — no account or API key required.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <DownloadButton
            platform="chrome"
            downloading={downloading}
            onClick={handleDownload}
            label="Download for Chrome"
          />
          <DownloadButton
            platform="mac"
            downloading={downloading}
            onClick={handleDownload}
            label="Download for Mac"
          />
        </div>
        <a
          href="#install"
          className="inline-block mt-5 text-sm font-semibold text-slate-400 hover:text-white transition-colors underline underline-offset-4"
        >
          Installation instructions →
        </a>

        {/* In-page pill + picker mockup */}
        <div className="mt-16 float">
          <div
            className="rounded-2xl border mx-auto overflow-hidden relative"
            style={{ background: "#0F172A", borderColor: "rgba(255,255,255,0.08)", maxWidth: 380, minHeight: 220 }}
          >
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

            <div className="p-5 space-y-2.5">
              <div className="h-3 rounded bg-slate-700/60 w-3/4" />
              <div className="h-2.5 rounded bg-slate-700/40 w-full" />
              <div className="h-2.5 rounded bg-slate-700/40 w-5/6" />
              <div className="h-2.5 rounded bg-slate-700/40 w-4/5" />
              <div className="h-2.5 rounded bg-slate-700/30 w-full mt-4" />
              <div className="h-2.5 rounded bg-slate-700/30 w-3/4" />
            </div>

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
        <h2 className="text-3xl font-bold text-center mb-12 tracking-tight">
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
              <h3 className="font-bold text-base mb-1.5">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Install */}
      <section id="install" className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-4 tracking-tight">Install Ekosee</h2>
        <p className="text-center text-slate-400 mb-12 text-sm">
          Pick your platform. Chrome loads unpacked; Mac builds a Safari extension with Xcode.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                <div className="font-bold">Chrome</div>
                <div className="text-xs text-slate-500">Windows · macOS · Linux</div>
              </div>
            </div>
            <ol className="space-y-4 mb-6">
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
            <DownloadButton
              platform="chrome"
              downloading={downloading}
              onClick={handleDownload}
              label="Download for Chrome"
            />
          </div>

          <div
            className="rounded-2xl p-7 border"
            style={{ background: "#0F172A", borderColor: "rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: "rgba(100,116,139,0.2)", border: "1px solid rgba(148,163,184,0.35)" }}
              >
                🍎
              </div>
              <div>
                <div className="font-bold">Mac (Safari)</div>
                <div className="text-xs text-slate-500">macOS · requires Xcode</div>
              </div>
            </div>
            <ol className="space-y-4 mb-6">
              {SAFARI_STEPS.map((s) => (
                <li key={s.n} className="flex gap-3">
                  <span
                    className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5"
                    style={{ background: "rgba(148,163,184,0.15)", color: "#94A3B8" }}
                  >
                    {s.n}
                  </span>
                  <span className="text-sm text-slate-300 leading-relaxed">{s.text}</span>
                </li>
              ))}
            </ol>
            <DownloadButton
              platform="mac"
              downloading={downloading}
              onClick={handleDownload}
              label="Download for Mac"
            />
          </div>
        </div>

        <p className="text-xs text-slate-500 mt-10 text-center">
          No account · No API key · Powered by Google Translate
        </p>
      </section>

      <footer
        className="border-t py-8 px-6 text-center text-xs text-slate-600"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <img src="/ekosee/extension/icons/icon16.png" alt="" className="w-4 h-4 rounded opacity-60" />
          <span className="font-semibold text-slate-500">Ekosee</span>
        </div>
        <p>No account · No API key · Chrome &amp; Mac Safari</p>
      </footer>
    </div>
  );
}
