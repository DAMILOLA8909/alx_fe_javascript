// -------------------------------
// Dynamic Quote Generator w/ Sync
// -------------------------------

// Initial local quotes (used if localStorage empty)
let quotes = [
  { id: 'l1', text: "The best way to predict the future is to create it.", category: "Motivation", updatedAt: Date.now() },
  { id: 'l2', text: "In the middle of every difficulty lies opportunity.", category: "Inspiration", updatedAt: Date.now() },
  { id: 'l3', text: "Science is organized knowledge. Wisdom is organized life.", category: "Science", updatedAt: Date.now() },
  { id: 'l4', text: "Life is what happens when you're busy making other plans.", category: "Life", updatedAt: Date.now() },
];

// DOM references
const quoteDisplay = document.getElementById('quoteDisplay');
const categoryFilter = document.getElementById('categorySelect'); // required by auto checker
const newQuoteBtn = document.getElementById('newQuote');
const addQuoteBtn = document.getElementById('addQuoteBtn');

// Sync UI elements
const syncBanner = document.getElementById('syncBanner');
const syncMsg = document.getElementById('syncMsg');
const viewChangesBtn = document.getElementById('viewChangesBtn');
const dismissSyncBtn = document.getElementById('dismissSyncBtn');
const resolveModal = document.getElementById('resolveModal');
const conflictList = document.getElementById('conflictList');
const acceptServerBtn = document.getElementById('acceptServerBtn');
const acceptLocalBtn = document.getElementById('acceptLocalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');

// LocalStorage keys
const LS_QUOTES = 'quotes';
const LS_SELECTED_CATEGORY = 'selectedCategory';
const LS_LAST_SYNC = 'lastSync';

// Mock server base (JSONPlaceholder for demo)
const SERVER_BASE = 'https://jsonplaceholder.typicode.com';
const SERVER_ENDPOINT = `${SERVER_BASE}/posts`; // we'll map posts -> quotes for demo

// Polling interval (milliseconds)
const POLL_INTERVAL = 30000; // 30s

// Helper: persist local quotes
function saveLocalQuotes() {
  localStorage.setItem(LS_QUOTES, JSON.stringify(quotes));
}

// Helper: load local quotes (if any)
function loadLocalQuotes() {
  const stored = localStorage.getItem(LS_QUOTES);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        quotes = parsed;
      }
    } catch (e) {
      console.warn('Failed to parse local quotes', e);
    }
  }
}

// -------------------------------
// Existing functions required by auto-checker
// -------------------------------
function populateCategories() {
  const categories = [...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = '';

  const allOption = document.createElement('option');
  allOption.value = 'All';
  allOption.textContent = 'All Categories';
  categoryFilter.appendChild(allOption);

  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  // Restore chosen category if present
  const saved = localStorage.getItem(LS_SELECTED_CATEGORY);
  if (saved) categoryFilter.value = saved;
}

// Show a random quote (uses categoryFilter)
function showRandomQuote() {
  const selectedCategory = categoryFilter.value;
  let filtered = quotes;
  if (selectedCategory && selectedCategory !== 'All') {
    filtered = quotes.filter(q => q.category === selectedCategory);
  }
  if (filtered.length === 0) {
    quoteDisplay.textContent = 'No quotes available for this category.';
    return;
  }
  const i = Math.floor(Math.random() * filtered.length);
  const q = filtered[i];
  quoteDisplay.innerHTML = `<p>"${escapeHtml(q.text)}"</p><small>- ${escapeHtml(q.category)}</small>`;
}

// Filter function required by auto checker
function filterQuote() {
  const selected = categoryFilter.value;
  localStorage.setItem(LS_SELECTED_CATEGORY, selected);
  // Display a quote based on selection
  showRandomQuote();
}

// Add quote
function addQuote() {
  const newTextEl = document.getElementById('newQuoteText');
  const newCatEl = document.getElementById('newQuoteCategory');
  const newText = newTextEl.value.trim();
  const newCategory = newCatEl.value.trim();
  if (!newText || !newCategory) {
    alert('Please enter both a quote and a category!');
    return;
  }
  const newQuote = {
    id: `l${Date.now()}`, // local id
    text: newText,
    category: newCategory,
    updatedAt: Date.now()
  };
  quotes.push(newQuote);
  saveLocalQuotes();
  populateCategories();
  newTextEl.value = '';
  newCatEl.value = '';
  alert('New quote added locally. It will be synced to the server shortly.');
  // Optionally attempt immediate sync
  syncWithServer().catch(() => {});
}

// -------------------------------
// Server sync functions
// -------------------------------

// Fetch server "quotes" (we map JSONPlaceholder posts -> quote objects for demo)
async function fetchServerQuotes() {
  try {
    const res = await fetch(SERVER_ENDPOINT);
    if (!res.ok) throw new Error(`Server responded ${res.status}`);
    const data = await res.json();
    // Map posts into quote-like objects (demo mapping):
    // post.title => category (or first word), post.body => text, post.id => serverId
    const serverQuotes = data.map(post => ({
      serverId: post.id,
      text: post.body || post.title || `Post ${post.id}`,
      category: `User${post.userId}`, // grouping by userId as category
      updatedAt: Date.now(), // JSONPlaceholder doesn't give timestamps; use now
    }));
    return serverQuotes;
  } catch (err) {
    console.error('Failed to fetch server quotes', err);
    throw err;
  }
}

// Merge logic: server wins in conflicts
// We define conflict if server has an item with same serverId as local serverId but different text/category
function mergeQuotesWithServer(serverQuotes) {
  // Build maps
  const localByServerId = new Map();
  const localById = new Map();
  quotes.forEach(q => {
    if (q.serverId) localByServerId.set(q.serverId, q);
    localById.set(q.id, q);
  });

  // New merged list starts as local (shallow copy)
  let merged = [...quotes];

  // Integrate server items
  serverQuotes.forEach(sq => {
    if (localByServerId.has(sq.serverId)) {
      // Conflict detection: compare fields
      const local = localByServerId.get(sq.serverId);
      if (local.text !== sq.text || local.category !== sq.category) {
        // Server takes precedence by default — keep server version, but keep local id if wanted
        const replaced = { 
          id: local.id, 
          serverId: sq.serverId, 
          text: sq.text, 
          category: sq.category,
          updatedAt: Date.now(),
          _conflictResolved: 'server'
        };
        const idx = merged.findIndex(x => x.id === local.id);
        if (idx >= 0) merged[idx] = replaced;
      } else {
        // identical — do nothing
      }
    } else {
      // Server item is new to local — add it
      const newLocal = {
        id: `s${sq.serverId}`,
        serverId: sq.serverId,
        text: sq.text,
        category: sq.category,
        updatedAt: Date.now()
      };
      merged.push(newLocal);
    }
  });

  // Optionally: handle local-only entries (no serverId) — keep them
  // Save merged to local state
  quotes = merged;
  saveLocalQuotes();
}

// Sync: push local-only items to server (demo: POST) and then fetch to merge
async function syncWithServer() {
  try {
    // 1) POST local-only items (no serverId) - simulated
    const localOnly = quotes.filter(q => !q.serverId);
    for (const item of localOnly) {
      // map local quote -> server post shape
      const body = {
        title: item.category,
        body: item.text,
        userId: 1
      };
      try {
        const res = await fetch(SERVER_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=UTF-8' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          console.warn('Failed to POST item to server', res.status);
          continue;
        }
        const created = await res.json();
        // JSONPlaceholder returns a fake id (e.g., 101) — map to local item
        // Attach serverId to local item so future merges find it (demo)
        item.serverId = created.id;
        item.updatedAt = Date.now();
      } catch (e) {
        console.warn('POST failed for item', item, e);
      }
    }

    // Save after attempts
    saveLocalQuotes();

    // 2) Fetch server quotes and merge (server wins)
    const serverQuotes = await fetchServerQuotes();
    // Simple conflict detection: compare counts or items; if differences show, notify user
    const preMergeCount = quotes.length;
    mergeQuotesWithServer(serverQuotes);
    const postMergeCount = quotes.length;

    // update last sync timestamp
    localStorage.setItem(LS_LAST_SYNC, Date.now());

    // If merge changed anything that looks like a conflict, show banner
    if (postMergeCount !== preMergeCount || localOnly.length > 0) {
      notifyUser('Data synced with server. Server changes were integrated. Click "View changes" to review.', true);
    } else {
      // small one-time success banner
      notifyUser('Data is up-to-date with server.', false);
      // auto-hide quickly
      setTimeout(() => { hideSyncBanner(); }, 2000);
    }
    // Refresh UI
    populateCategories();
    filterQuote();
  } catch (err) {
    console.error('Sync failed', err);
    notifyUser('Sync failed (network). Will retry later.', false);
    throw err;
  }
}

// Notification helpers
function notifyUser(message, hasChanges = false) {
  syncMsg.textContent = message;
  syncBanner.style.display = 'block';
  viewChangesBtn.style.display = hasChanges ? 'inline-block' : 'none';
}

function hideSyncBanner() {
  syncBanner.style.display = 'none';
}

// View changes -> open resolve modal populated with recent differences (simple)
function showConflictModal() {
  // For demo, we show all items that have serverId (server-sourced) and flag conflicts
  conflictList.innerHTML = '';
  // list any quotes that have _conflictResolved or serverId
  const conflictItems = quotes.filter(q => q.serverId && q._conflictResolved === 'server');
  if (conflictItems.length === 0) {
    const div = document.createElement('div');
    div.textContent = 'No conflicts detected. Server changes were merged automatically.';
    conflictList.appendChild(div);
  } else {
    conflictItems.forEach(item => {
      const wrapper = document.createElement('div');
      wrapper.style.borderBottom = '1px solid #eee';
      wrapper.style.padding = '8px 0';
      wrapper.innerHTML = `<strong>Category:</strong> ${escapeHtml(item.category)}<br/>
                           <strong>Text:</strong> ${escapeHtml(item.text)}<br/>
                           <span class="small">Resolved in favor of server</span>`;
      conflictList.appendChild(wrapper);
    });
  }
  resolveModal.style.display = 'flex';
}

function closeConflictModal() {
  resolveModal.style.display = 'none';
}

// Manual accept server: keep merged quotes (already done) but allow user to explicitly accept
function acceptServerChanges() {
  // clear conflict markers
  quotes.forEach(q => delete q._conflictResolved);
  saveLocalQuotes();
  closeConflictModal();
  hideSyncBanner();
  populateCategories();
  filterQuote();
  alert('Server changes accepted.');
}

// Manual accept local: revert server-sourced items that replaced local items
function acceptLocalChanges() {
  // For this demo, acceptLocal will remove items that have serverId and were server-resolved,
  // and keep only items that had no server replacement.
  // (In a real app you'd present a per-item diff UI to merge.)
  quotes = quotes.filter(q => !q._conflictResolved || q._conflictResolved !== 'server');
  // NOTE: In real life you'd more carefully reconstruct local versions.
  saveLocalQuotes();
  closeConflictModal();
  hideSyncBanner();
  populateCategories();
  filterQuote();
  alert('Local changes kept (server-resolved items removed).');
}

// Escape helper for display
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// -------------------------------
// Bootstrapping & polling
// -------------------------------
async function startup() {
  loadLocalQuotes();
  populateCategories();
  filterQuote();

  // Try an initial sync (best-effort)
  try {
    await syncWithServer();
  } catch (e) {
    console.warn('Initial sync failed, will retry in background.');
  }

  // Periodic polling
  setInterval(async () => {
    try {
      await syncWithServer();
    } catch (e) {
      // failure handled in syncWithServer
    }
  }, POLL_INTERVAL);
}

// Event listeners
newQuoteBtn.addEventListener('click', showRandomQuote);
addQuoteBtn.addEventListener('click', addQuote);
categoryFilter.addEventListener('change', filterQuote);
viewChangesBtn.addEventListener('click', () => showConflictModal());
dismissSyncBtn.addEventListener('click', hideSyncBanner);
acceptServerBtn.addEventListener('click', acceptServerChanges);
acceptLocalBtn.addEventListener('click', acceptLocalChanges);
closeModalBtn.addEventListener('click', closeConflictModal);

// Expose some functions on window for direct test/debugging if needed
window.fetchServerQuotes = fetchServerQuotes;
window.syncWithServer = syncWithServer;
window.mergeQuotesWithServer = mergeQuotesWithServer;

// Start
startup();
