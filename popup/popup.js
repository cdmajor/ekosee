// Ekosee popup

const gateSection = document.getElementById("gateSection");
const mainSection = document.getElementById("mainSection");
const buyBtn      = document.getElementById("buyBtn");
const gateStatus  = document.getElementById("gateStatus");
const statusRow   = document.getElementById("statusRow");
const statusDot   = document.getElementById("statusDot");
const statusText  = document.getElementById("statusText");
const restoreBtn  = document.getElementById("restoreBtn");
const settingsBtn = document.getElementById("settingsBtn");

// ─── Init ─────────────────────────────────────────────────────────────────────

chrome.runtime.sendMessage({ type: "GET_STATUS" }, (res) => {
  if (chrome.runtime.lastError || !res) { showGate(); return; }
  if (res.subscriptionActive) { showMain(); checkPageStatus(); }
  else { showGate(); }
});

// Auto-activate if checkout completes while popup is open
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "SUBSCRIPTION_ACTIVATED") { showMain(); checkPageStatus(); }
});

// ─── Gate ─────────────────────────────────────────────────────────────────────

function showGate() {
  gateSection.classList.remove("hidden");
  mainSection.classList.add("hidden");
}

function showMain() {
  gateSection.classList.add("hidden");
  mainSection.classList.remove("hidden");
}

buyBtn.addEventListener("click", () => {
  buyBtn.disabled = true;
  buyBtn.textContent = "Opening…";
  chrome.runtime.sendMessage({ type: "START_CHECKOUT" }, (res) => {
    if (res?.ok) {
      window.close();
    } else {
      buyBtn.disabled = false;
      buyBtn.textContent = "Buy Now";
      gateStatus.textContent = res?.error || "Could not start checkout. Try again.";
      gateStatus.classList.remove("hidden");
    }
  });
});

// ─── Page status ──────────────────────────────────────────────────────────────

async function checkPageStatus() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  try {
    const res = await chrome.tabs.sendMessage(tab.id, { type: "GET_STATUS" });
    if (res?.isTranslating) {
      showStatus("busy", "Translating…");
    } else if (res?.currentLanguage) {
      showStatus("done", `Translated to ${res.currentLanguage}`);
      restoreBtn.classList.remove("hidden");
    }
  } catch { /* content script not yet active */ }
}

function showStatus(type, text) {
  statusRow.classList.remove("hidden");
  statusText.textContent = text;
  statusDot.className = "dot dot--" + type;
}

restoreBtn.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  await chrome.tabs.sendMessage(tab.id, { type: "RESTORE_PAGE" });
  restoreBtn.classList.add("hidden");
  statusRow.classList.add("hidden");
});

settingsBtn.addEventListener("click", () => chrome.runtime.openOptionsPage());
