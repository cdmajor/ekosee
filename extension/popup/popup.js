// Ekosee popup — minimal, since the main UX is the in-page pill.

const statusRow = document.getElementById("statusRow");
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const restoreBtn = document.getElementById("restoreBtn");
const settingsBtn = document.getElementById("settingsBtn");

async function init() {
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
  } catch {
    // Content script not yet active on this page
  }
}

function showStatus(type, text) {
  statusRow.classList.remove("hidden");
  statusText.textContent = text;
  statusDot.className = "dot";
  if (type === "busy") statusDot.classList.add("busy");
}

restoreBtn.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  try { await chrome.tabs.sendMessage(tab.id, { type: "RESTORE_PAGE" }); } catch {}
  restoreBtn.classList.add("hidden");
  statusRow.classList.add("hidden");
});

settingsBtn.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
  window.close();
});

init();
