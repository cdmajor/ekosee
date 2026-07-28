// Ekosee options page

const subActive   = document.getElementById("subActive");
const subInactive = document.getElementById("subInactive");
const subLoading  = document.getElementById("subLoading");
const buyBtn      = document.getElementById("buyBtn");
const buyStatus   = document.getElementById("buyStatus");
const defaultLangEl = document.getElementById("defaultLang");
const saveBtn     = document.getElementById("saveBtn");
const saveResult  = document.getElementById("saveResult");

// ─── Subscription status ──────────────────────────────────────────────────────

chrome.runtime.sendMessage({ type: "GET_STATUS" }, (res) => {
  subLoading.style.display = "none";
  if (res?.subscriptionActive) {
    subActive.classList.remove("hidden");
  } else {
    subInactive.classList.remove("hidden");
  }
});

buyBtn?.addEventListener("click", () => {
  buyBtn.disabled = true;
  buyBtn.textContent = "Opening checkout…";
  chrome.runtime.sendMessage({ type: "START_CHECKOUT" }, (res) => {
    if (res?.ok) {
      buyStatus.textContent = "Checkout opened. Come back here after payment — it activates automatically.";
      buyStatus.style.color = "#818cf8";
      buyStatus.classList.remove("hidden");
      buyBtn.textContent = "Waiting for payment…";
    } else {
      buyBtn.disabled = false;
      buyBtn.textContent = "Buy Now — $9.99";
      buyStatus.textContent = res?.error || "Could not start checkout. Try again.";
      buyStatus.style.color = "#f87171";
      buyStatus.classList.remove("hidden");
    }
  });
});

// ─── Language settings ────────────────────────────────────────────────────────

chrome.storage.sync.get(["defaultLang"], ({ defaultLang }) => {
  if (defaultLang) defaultLangEl.value = defaultLang;
});

saveBtn.addEventListener("click", async () => {
  await chrome.storage.sync.set({ defaultLang: defaultLangEl.value });
  saveResult.classList.remove("hidden");
  saveBtn.textContent = "Saved ✓";
  setTimeout(() => {
    saveResult.classList.add("hidden");
    saveBtn.textContent = "Save Settings";
  }, 2500);
});
