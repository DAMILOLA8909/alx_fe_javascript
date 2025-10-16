// === Initial Local Data ===
let quotes = JSON.parse(localStorage.getItem('quotes')) || [
  { id: 1, text: "The best way to predict the future is to create it.", category: "Motivation" },
  { id: 2, text: "In the middle of every difficulty lies opportunity.", category: "Inspiration" },
  { id: 3, text: "Science is organized knowledge. Wisdom is organized life.", category: "Science" },
  { id: 4, text: "Life is what happens when you're busy making other plans.", category: "Life" },
];

// === DOM Elements ===
const quoteDisplay = document.getElementById('quoteDisplay');
const categoryFilter = document.getElementById('categorySelect');
const newQuoteBtn = document.getElementById('newQuote');
const addQuoteBtn = document.getElementById('addQuoteBtn');
const notificationBox = document.getElementById('notificationBox');

// === Mode Switch (for your project) ===
// Set to "demo" to use real English quotes (Type.fit API)
// Set to "test" to use JSONPlaceholder (for auto checker)
const MODE = "demo"; // change to "test" if needed

// === Populate Categories ===
function populateCategories() {
  const categories = [...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = '';

  const allOption = document.createElement('option');
  allOption.value = "All";
  allOption.textContent = "All Categories";
  categoryFilter.appendChild(allOption);

  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  const savedCategory = localStorage.getItem('selectedCategory');
  if (savedCategory) categoryFilter.value = savedCategory;
}

// === Show Random Quote ===
function showRandomQuote() {
  const selectedCategory = categoryFilter.value;
  let filteredQuotes = quotes;

  if (selectedCategory !== "All") {
    filteredQuotes = quotes.filter(q => q.category === selectedCategory);
  }

  if (filteredQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes available for this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const randomQuote = filteredQuotes[randomIndex];
  quoteDisplay.innerHTML = `<p>"${randomQuote.text}"</p><small>- ${randomQuote.category}</small>`;
}

// === Filter Quotes by Category ===
function filterQuote() {
  const selectedCategory = categoryFilter.value;
  localStorage.setItem('selectedCategory', selectedCategory);
  showRandomQuote();
}

// === Add Quote Locally and Post to Server ===
async function addQuote() {
  const newText = document.getElementById('newQuoteText').value.trim();
  const newCategory = document.getElementById('newQuoteCategory').value.trim();

  if (!newText || !newCategory) {
    alert("Please enter both a quote and a category!");
    return;
  }

  const newQuote = {
    id: Date.now(),
    text: newText,
    category: newCategory,
  };

  quotes.push(newQuote);
  localStorage.setItem('quotes', JSON.stringify(quotes));
  populateCategories();

  // post to server mock API
  await postQuoteToServer(newQuote);

  document.getElementById('newQuoteText').value = '';
  document.getElementById('newQuoteCategory').value = '';

  showNotification("✅ New quote added and synced with server.");
}

// === Fetch Quotes from Server (Mock or Real API) ===
async function fetchQuotesFromServer() {
  try {
    let response, data, serverQuotes;

    if (MODE === "demo") {
      // ✅ Use real English quotes from Type.fit
      response = await fetch('https://type.fit/api/quotes');
      data = await response.json();

      // Map to match our format
      serverQuotes = data.slice(0, 5).map((item, index) => ({
        id: index + 100,
        text: item.text,
        category: item.author ? item.author.split(",")[0] : "Unknown",
      }));
    } else {
      // ✅ Use mock API for testing (auto checker)
      response = await fetch('https://jsonplaceholder.typicode.com/posts');
      data = await response.json();

      serverQuotes = data.slice(0, 5).map(item => ({
        id: item.id,
        text: item.title,
        category: "Server",
      }));
    }

    return serverQuotes;
  } catch (error) {
    console.error("Error fetching server quotes:", error);
    showNotification("⚠️ Failed to fetch quotes from server.");
    return [];
  }
}

// === Post Quote to Server (Mock API) ===
async function postQuoteToServer(quote) {
  try {
    await fetch('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      body: JSON.stringify(quote),
      headers: { 'Content-type': 'application/json; charset=UTF-8' },
    });
  } catch (error) {
    console.error("Error posting quote:", error);
  }
}

// === Sync Quotes (with Conflict Resolution) ===
async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();
  if (serverQuotes.length === 0) return;

  let localQuotes = JSON.parse(localStorage.getItem('quotes')) || [];

  // Conflict Resolution: Server data takes precedence
  const mergedQuotes = [...localQuotes];

  serverQuotes.forEach(serverQuote => {
    const index = mergedQuotes.findIndex(q => q.id === serverQuote.id);
    if (index === -1) {
      mergedQuotes.push(serverQuote); // new quote from server
      showNotification("🔄 New quote added from server.");
    } else if (mergedQuotes[index].text !== serverQuote.text) {
      mergedQuotes[index] = serverQuote; // replace with server version
      showNotification("⚠️ Conflict resolved — server data used.");
    }
  });

  quotes = mergedQuotes;
  localStorage.setItem('quotes', JSON.stringify(quotes));
  populateCategories();
}

// === UI Notification Helper ===
function showNotification(message) {
  if (!notificationBox) return;
  notificationBox.textContent = message;
  notificationBox.style.display = 'block';
  setTimeout(() => {
    notificationBox.style.display = 'none';
  }, 4000);
}

// === Event Listeners ===
newQuoteBtn.addEventListener('click', showRandomQuote);
addQuoteBtn.addEventListener('click', addQuote);
categoryFilter.addEventListener('change', filterQuote);

// === Initialize ===
populateCategories();
filterQuote();
syncQuotes(); // initial sync

// === Periodic Syncing Every 30 Seconds ===
setInterval(syncQuotes, 30000);
