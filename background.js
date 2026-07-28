// Ekosee — background service worker
const API_BASE   = "https://gulliversoftwaretech.com/api";
const BATCH_SIZE = 40;
const GULLIVER_FREE = false; // Set true in admin-free build

// ─── Subscription state ───────────────────────────────────────────────────────

let subscriptionActive = GULLIVER_FREE;

// Restore on startup
if (GULLIVER_FREE) {
  subscriptionActive = true;
} else {
  chrome.storage.local.get(["ekosee_membership_id"], async ({ ekosee_membership_id }) => {
    if (ekosee_membership_id) {
      const sub = await verifyMembership(ekosee_membership_id);
      subscriptionActive = sub.active;
    }
  });
}

async function verifyMembership(membershipId) {
  try {
    const res = await fetch(`${API_BASE}/ekosee/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ membership_id: membershipId }),
    });
    if (!res.ok) return { active: false };
    return await res.json();
  } catch {
    return { active: false };
  }
}

async function startCheckout() {
  const res = await fetch(`${API_BASE}/ekosee/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Checkout failed (${res.status})`);
  }
  const data = await res.json();
  if (!data.purchase_url) throw new Error("No checkout URL returned.");
  chrome.tabs.create({ url: data.purchase_url });
  return data.purchase_url;
}

// Auto-activate after Whop checkout redirect
// (calls storage directly — service workers can't receive their own sendMessage)
chrome.webNavigation.onCompleted.addListener(
  async (details) => {
    try {
      const url = new URL(details.url);
      const membershipId = url.searchParams.get("membership_id");
      if (!membershipId) return;
      const sub = await verifyMembership(membershipId);
      if (sub.active) {
        await chrome.storage.local.set({ ekosee_membership_id: membershipId });
        subscriptionActive = true;
        chrome.tabs.remove(details.tabId);
        chrome.runtime.sendMessage({ type: "SUBSCRIPTION_ACTIVATED" }).catch(() => {});
      }
    } catch { /* ignore */ }
  },
  { url: [{ pathContains: "/ekosee-activate" }] }
);

// ─── Message handling ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {

  if (message.type === "TRANSLATE_BATCH") {
    if (!GULLIVER_FREE && !subscriptionActive) {
      sendResponse({ ok: false, unlicensed: true });
      return false;
    }
    translateBatch(message.texts, message.targetLanguage)
      .then((translations) => sendResponse({ ok: true, translations }))
      .catch((err)         => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  if (message.type === "DETECT_LANGUAGE") {
    if (!GULLIVER_FREE && !subscriptionActive) {
      sendResponse({ ok: false, unlicensed: true });
      return false;
    }
    detectLanguage(message.sample)
      .then((language) => sendResponse({ ok: true, language }))
      .catch((err)     => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  if (message.type === "GET_STATUS") {
    sendResponse({ subscriptionActive: GULLIVER_FREE || subscriptionActive });
    return false;
  }

  if (message.type === "START_CHECKOUT") {
    startCheckout()
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  if (message.type === "SUBSCRIPTION_ACTIVATED") {
    subscriptionActive = true;
    return false;
  }
});

// ─── Translation helpers ──────────────────────────────────────────────────────

async function translateBatch(texts, targetLanguage) {
  const results = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const chunk = texts.slice(i, i + BATCH_SIZE);
    const translated = await callTranslateAPI(chunk, targetLanguage);
    results.push(...translated);
  }
  return results;
}

async function getMembershipId() {
  if (GULLIVER_FREE) return "free";
  const { ekosee_membership_id } = await chrome.storage.local.get(["ekosee_membership_id"]);
  return ekosee_membership_id ?? "";
}

async function callTranslateAPI(texts, targetLanguage) {
  const membershipId = await getMembershipId();
  const res = await fetch(`${API_BASE}/ekosee/translate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(membershipId ? { "Authorization": `Bearer ${membershipId}` } : {}),
    },
    body: JSON.stringify({ texts, targetLanguage }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Server error ${res.status}`);
  }
  const data = await res.json();
  if (!Array.isArray(data.translations)) throw new Error("Unexpected response format.");
  return data.translations;
}

async function detectLanguage(sample) {
  const membershipId = await getMembershipId();
  const res = await fetch(`${API_BASE}/ekosee/detect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(membershipId ? { "Authorization": `Bearer ${membershipId}` } : {}),
    },
    body: JSON.stringify({ sample }),
  });
  if (!res.ok) throw new Error(`Server error ${res.status}`);
  const data = await res.json();
  return data.language ?? "Unknown";
}
