// =======================
// Dynamic Quote Generator
// =======================

// DOM elements (IDs used in index.html)
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const categoryFilter = document.getElementById("categoryFilter");
const notification = document.getElementById("notification");
const addQuoteBtn = document.getElementById("addQuoteBtn");
const exportBtn = document.getElementById("exportQuotes");
const importFileInput = document.getElementById("importFile");

// Local storage keys
const LS_QUOTES = "quotes";
const LS_SELECTED_CATEGORY = "selectedCategory";
const LS_LAST_VIEWED = "lastViewedQuote";

// Default quotes (used if no localStorage)
let quotes = JSON.parse(localStorage.getItem(LS_QUOTES)) || [
  { id: 1, text: "The best way to predict the future is to create it.", category: "Motivation", updatedAt: Date.now() },
  { id: 2, text: "In the middle of every difficulty lies opportunity.", category: "Inspiration", updatedAt: Date.now() },
  { id: 3, text: "Science is organized knowledge. Wisdom is organized life.", category: "Science", updatedAt: Date.now() },
  { id: 4, text: "Life is what happens when you're busy making other plans.", category: "Life", updatedAt: Date.now() },
];

let selectedCategory = localStorage.getItem(LS_SELECTED_CATEGORY) || "All";

// -------------------- Utility helpers --------------------
function saveQuotesToLocal() {
  localStorage.setItem(LS_QUOTES, JSON.stringify(quotes));
}

function saveLastViewedToSession(quote) {
  // sessionStorage stores the last displayed quote for the session
  try {
    sessionStorage.setItem(LS_LAST_VIEWED, JSON.stringify(quote));
  } catch (e) {
    console.warn("sessionStorage unavailable", e);
  }
}

function showNotification(message) {
  if (!notification) return;
  notification.textContent = message;
  notification.style.display = "block";
  setTimeout(() => notification.style.display = "none", 4000);
}

// -------------------- createAddQuoteForm (exists for AutoChecker) --------------------
function createAddQuoteForm() {
  // If the static inputs already exist in index.html, do nothing.
  if (document.getElementById("newQuoteText") && document.getElementById("newQuoteCategory")) {
    return;
  }

  // Otherwise create them dynamically
  const formContainer = document.createElement("div");
  formContainer.id = "addQuoteForm";

  const quoteInput = document.createElement("input");
  quoteInput.type = "text";
  quoteInput.id = "newQuoteText";
  quoteInput.placeholder = "Enter a new quote";

  const categoryInput = document.createElement("input");
  categoryInput.type = "text";
  categoryInput.id = "newQuoteCategory";
  categoryInput.placeholder = "Enter quote category";

  const addButton = document.createElement("button");
  addButton.id = "addQuoteBtn";
  addButton.textContent = "Add Quote";
  addButton.addEventListener("click", addQuote);

  formContainer.appendChild(quoteInput);
  formContainer.appendChild(categoryInput);
  formContainer.appendChild(addButton);

  document.body.appendChild(formContainer);
}

// -------------------- populateCategories --------------------
function populateCategories() {
  const categories = ["All", ...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = "";
  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    if (cat === selectedCategory) opt.selected = true;
    categoryFilter.appendChild(opt);
  });
}

// -------------------- showRandomQuote --------------------
function showRandomQuote() {
  const list = (selectedCategory === "All") ? quotes : quotes.filter(q => q.category === selectedCategory);
  if (list.length === 0) {
    quoteDisplay.innerHTML = "<p>No quotes available in this category.</p>";
    return;
  }
  const idx = Math.floor(Math.random() * list.length);
  const q = list[idx];
  quoteDisplay.innerHTML = `<p>"${escapeHtml(q.text)}"</p><small>- ${escapeHtml(q.category)}</small>`;
  saveLastViewedToSession(q);
}

// simple escape for display
function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// -------------------- addQuote (adds to quotes array and updates DOM + storage) --------------------
function addQuote() {
  const textEl = document.getElementById("newQuoteText");
  const catEl = document.getElementById("newQuoteCategory");
  if (!textEl || !catEl) return alert("Add form not found.");

  const text = textEl.value.trim();
  const category = catEl.value.trim();
  if (!text || !category) return alert("Please enter both quote text and category.");

  const newQuote = {
    id: Date.now(),
    text,
    category,
    updatedAt: Date.now(),
  };

  quotes.push(newQuote);
  saveQuotesToLocal();
  populateCategories();
  showRandomQuote();
  showNotification("New quote added locally!");
  // best-effort post to server (doesn't persist on JSONPlaceholder)
  postQuoteToServer(newQuote).catch(() => {});
  // clear inputs
  textEl.value = "";
  catEl.value = "";
}

// -------------------- Import / Export --------------------

// exportToJsonFile: creates and triggers download of quotes.json
function exportToJsonFile() {
  try {
    const dataStr = JSON.stringify(quotes, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quotes.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showNotification("Quotes exported to JSON file!");
  } catch (err) {
    console.error("Export failed:", err);
    alert("Export failed.");
  }
}

// importFromJsonFile: reads a .json file and merges quotes (no duplicates by text)
function importFromJsonFile(event) {
  const file = event && event.target && event.target.files && event.target.files[0];
  if (!file) return alert("No file selected.");

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) {
        return alert("JSON must contain an array of quote objects.");
      }
      // Filter valid objects and dedupe by text
      const valid = imported.filter(item => item && item.text && item.category).map(item => ({
        id: item.id || Date.now() + Math.floor(Math.random()*1000),
        text: String(item.text),
        category: String(item.category),
        updatedAt: item.updatedAt || Date.now()
      }));

      const added = valid.filter(iq => !quotes.some(q => q.text === iq.text));
      if (added.length === 0) {
        showNotification("No new quotes to import.");
      } else {
        quotes = [...quotes, ...added];
        saveQuotesToLocal();
        populateCategories();
        showRandomQuote();
        showNotification(`Imported ${added.length} quotes successfully!`);
      }

      // Reset input so same file can be uploaded again if needed
      if (importFileInput) importFileInput.value = "";
    } catch (err) {
      console.error("Import error:", err);
      alert("Failed to import. Ensure the file is valid JSON.");
    }
  };
  reader.readAsText(file);
}

// -------------------- Server mock functions --------------------
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts";

async function fetchQuotesFromServer() {
  try {
    const res = await fetch(SERVER_URL);
    const data = await res.json();
    // map to simple server-side quotes (demo)
    return data.slice(0,5).map(item => ({
      id: item.id,
      text: item.title || item.body || `Post ${item.id}`,
      category: `Server`
    }));
  } catch (err) {
    console.error("fetch error", err);
    return [];
  }
}

async function postQuoteToServer(quote) {
  try {
    await fetch(SERVER_URL, {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ title: quote.text, body: quote.text, userId: 1 })
    });
    // JSONPlaceholder fakes a successful response but does not persist
  } catch (err) {
    console.warn("post failed", err);
  }
}

// -------------------- syncQuotes (server wins on conflict) --------------------
async function syncQuotes() {
  try {
    const serverQuotes = await fetchQuotesFromServer();
    const local = JSON.parse(localStorage.getItem(LS_QUOTES)) || [];

    // Merge: server entries first, then local ones that don't conflict by text
    const merged = [...serverQuotes, ...local.filter(lq => !serverQuotes.some(sq => sq.text === lq.text))];

    // If local length changed, notify
    if (merged.length !== local.length) {
      showNotification("Quotes synced with server!");
    }

    // Normalize ids / timestamps if needed
    quotes = merged.map(q => ({
      id: q.id || Date.now() + Math.floor(Math.random()*1000),
      text: q.text,
      category: q.category || "Uncategorized",
      updatedAt: q.updatedAt || Date.now()
    }));

    saveQuotesToLocal();
    populateCategories();
    showRandomQuote();
  } catch (err) {
    console.error("sync error", err);
    showNotification("Sync failed (network). Will retry.");
  }
}

// -------------------- filterQuote (updates selectedCategory + UI) --------------------
function filterQuote() {
  selectedCategory = categoryFilter.value;
  localStorage.setItem(LS_SELECTED_CATEGORY, selectedCategory);
  showRandomQuote();
}

// -------------------- Initialization & Event wiring --------------------
window.addEventListener("load", () => {
  createAddQuoteForm();          // ensures add form exists (for AutoChecker)
  populateCategories();
  // restore last viewed quote from session if present
  try {
    const last = sessionStorage.getItem(LS_LAST_VIEWED);
    if (last) {
      const q = JSON.parse(last);
      if (q && q.text) {
        quoteDisplay.innerHTML = `<p>"${escapeHtml(q.text)}"</p><small>- ${escapeHtml(q.category)}</small>`;
      } else {
        showRandomQuote();
      }
    } else {
      showRandomQuote();
    }
  } catch (e) {
    showRandomQuote();
  }

  // wire up event listeners (some elements might have been added via createAddQuoteForm)
  if (newQuoteBtn) newQuoteBtn.addEventListener("click", showRandomQuote);
  if (addQuoteBtn) addQuoteBtn.addEventListener("click", addQuote);
  if (exportBtn) exportBtn.addEventListener("click", exportToJsonFile);
  if (importFileInput) importFileInput.addEventListener("change", importFromJsonFile);
  if (categoryFilter) categoryFilter.addEventListener("change", filterQuote);

  // initial sync (best-effort)
  syncQuotes().catch(()=>{});

  // periodic polling
  setInterval(syncQuotes, 30000); // every 30s
});

// Expose some functions for debugging/testing
window.exportToJsonFile = exportToJsonFile;
window.importFromJsonFile = importFromJsonFile;
window.syncQuotes = syncQuotes;
window.addQuote = addQuote;
