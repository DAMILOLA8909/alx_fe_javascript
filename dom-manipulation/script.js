// Initial array of quote objects
let quotes = [
  { text: "The best way to predict the future is to create it.", category: "Motivation" },
  { text: "In the middle of every difficulty lies opportunity.", category: "Inspiration" },
  { text: "Science is organized knowledge. Wisdom is organized life.", category: "Science" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
];

// DOM Elements
const quoteDisplay = document.getElementById('quoteDisplay');
const categorySelect = document.getElementById('categorySelect');
const newQuoteBtn = document.getElementById('newQuote');
const addQuoteBtn = document.getElementById('addQuoteBtn');

// ✅ Initialize dropdown and display
function initializeCategories() {
  const categories = [...new Set(quotes.map(q => q.category))];
  categorySelect.innerHTML = '';
  
  // Create an "All" option
  const allOption = document.createElement('option');
  allOption.value = "All";
  allOption.textContent = "All Categories";
  categorySelect.appendChild(allOption);

  // Create options for each category
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
}

// ✅ Function to show a random quote
function showRandomQuote() {
  const selectedCategory = categorySelect.value;
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

// ✅ Function to add a new quote dynamically
function addQuote() {
  const newText = document.getElementById('newQuoteText').value.trim();
  const newCategory = document.getElementById('newQuoteCategory').value.trim();

  if (!newText || !newCategory) {
    alert("Please enter both a quote and a category!");
    return;
  }

  // Add new quote to array
  quotes.push({ text: newText, category: newCategory });

  // Update category dropdown
  initializeCategories();

  // Clear input fields
  document.getElementById('newQuoteText').value = '';
  document.getElementById('newQuoteCategory').value = '';

  alert("New quote added successfully!");
}

// ✅ Event Listeners
newQuoteBtn.addEventListener('click', showRandomQuote);
addQuoteBtn.addEventListener('click', addQuote);

// Initialize on load
initializeCategories();
showRandomQuote();
