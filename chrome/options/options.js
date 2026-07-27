// Ekosee options page

const defaultLang = document.getElementById("defaultLang");
const saveBtn     = document.getElementById("saveBtn");
const saveResult  = document.getElementById("saveResult");

// Load saved settings
chrome.storage.sync.get(["defaultLang"], ({ defaultLang: lang }) => {
  if (lang) defaultLang.value = lang;
});

// Save settings
saveBtn.addEventListener("click", async () => {
  const lang = defaultLang.value;
  await chrome.storage.sync.set({ defaultLang: lang });

  saveResult.classList.remove("hidden");
  saveBtn.textContent = "Saved ✓";
  setTimeout(() => {
    saveResult.classList.add("hidden");
    saveBtn.textContent = "Save Settings";
  }, 2500);
});
