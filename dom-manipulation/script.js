// -------------------- Initial Setup --------------------
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const categoryFilter = document.getElementById("categoryFilter");
const notification = document.getElementById("notification");

let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Life is what happens when you’re busy making other plans.", category: "Life" },
  { text: "Do not let what you cannot do interfere with what you can do.", category: "Inspiration" }
];

let selectedCategory = localStorage.getItem("selectedCategory") || "All";

// -------------------- Populate Category Filter --------------------
function populateCategories() {
  const categories = ["All", ...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = "";
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    if (cat === selectedCategory) option.selected = true;
    categoryFilter.appendChild(option);
  });
}

// -------------------- Show Random Quote --------------------
function showRandomQuote() {
  const filteredQuotes = selectedCategory === "All"
    ? quotes
    : quotes.filter(q => q.category === selectedCategory);
  if (filteredQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes available in this category.";
    return;
  }
  const randomQuote = filteredQuotes[Math.floor(Math.random() * filteredQuotes.length)];
  quoteDisplay.textContent = `"${randomQuote.text}" — ${randomQuote.category}`;
}

// -------------------- Add Quote --------------------
function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();
  if (!text || !category) return alert("Please enter both quote text and category.");

  const newQuote = { text, category };
  quotes.push(newQuote);
  localStorage.setItem("quotes", JSON.stringify(quotes));
  populateCategories();
  showNotification("New quote added locally!");
  postQuoteToServer(newQuote);
}

// -------------------- Filter Quotes --------------------
function filterQuote() {
  selectedCategory = categoryFilter.value;
  localStorage.setItem("selectedCategory", selectedCategory);
  showRandomQuote();
}

// -------------------- Server Simulation --------------------
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts";

// Fetch quotes from mock server
async function fetchQuotesFromServer() {
  try {
    const response = await fetch(SERVER_URL);
    const data = await response.json();
    // Simulate server response
    const serverQuotes = data.slice(0, 5).map(item => ({
      text: item.title,
      category: "Server"
    }));
    return serverQuotes;
  } catch (error) {
    console.error("Error fetching server data:", error);
    return [];
  }
}

// Post new quotes to mock server
async function postQuoteToServer(quote) {
  try {
    await fetch(SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quote)
    });
    console.log("Quote posted to server:", quote);
  } catch (error) {
    console.error("Error posting quote:", error);
  }
}

// -------------------- Sync Quotes --------------------
async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();
  const localQuotes = JSON.parse(localStorage.getItem("quotes")) || [];

  // Conflict resolution: Server takes precedence
  const mergedQuotes = [...serverQuotes, ...localQuotes.filter(
    lq => !serverQuotes.some(sq => sq.text === lq.text)
  )];

  // Detect updates or conflicts
  if (mergedQuotes.length !== localQuotes.length) {
    showNotification("Quotes synced with server!");
  }

  quotes = mergedQuotes;
  localStorage.setItem("quotes", JSON.stringify(quotes));
  populateCategories();
  showRandomQuote();
}

// -------------------- UI Notification --------------------
function showNotification(message) {
  notification.textContent = message;
  notification.style.display = "block";
  setTimeout(() => (notification.style.display = "none"), 4000);
}

// -------------------- Initialize App --------------------
window.addEventListener("load", () => {
  populateCategories();
  showRandomQuote();
  syncQuotes();
  setInterval(syncQuotes, 15000); // Periodic sync every 15 seconds
});

newQuoteBtn.addEventListener("click", showRandomQuote);
categoryFilter.addEventListener("change", filterQuote);
