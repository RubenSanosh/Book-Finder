/*
  script.js
  This handles the actual searching. When someone types a book name
  and hits search, we call the Open Library API and show the results
  as little cards on the page.

  Open Library's search API is free and doesn't need an API key,
  which is why I picked it for this project - one less thing to set up.
*/

// Grab all the elements we need from the page
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const sortSelect = document.getElementById("sortSelect");
const resultsContainer = document.getElementById("results");
const loadingMsg = document.getElementById("loadingMsg");
const statusMsg = document.getElementById("statusMsg");

// This keeps the last set of results so we can re-sort them
// without having to call the API again every time
let currentBooks = [];

// Run a search when the button is clicked
searchBtn.addEventListener("click", searchBooks);

// Also let people just press Enter instead of clicking the button
searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    searchBooks();
  }
});

// Re-sort and redraw results whenever the dropdown changes
sortSelect.addEventListener("change", () => {
  const sorted = sortBooks(currentBooks, sortSelect.value);
  renderBooks(sorted);
});

async function searchBooks() {
  const query = searchInput.value.trim();

  // Don't bother searching if the box is empty
  if (query === "") {
    showStatus("Type something in first!");
    return;
  }

  // Reset messages and show the loading text
  hideStatus();
  resultsContainer.innerHTML = "";
  loadingMsg.classList.remove("hidden");

  // Open Library's search endpoint. encodeURIComponent makes sure
  // spaces and special characters in the search don't break the URL
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=24`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Something went wrong with the request");
    }

    const data = await response.json();

    loadingMsg.classList.add("hidden");

    // The actual list of books is in data.docs
    if (!data.docs || data.docs.length === 0) {
      showStatus("No books found. Try a different search.");
      currentBooks = [];
      return;
    }

    currentBooks = data.docs;

    // Apply whatever sort option is currently selected
    const sorted = sortBooks(currentBooks, sortSelect.value);
    renderBooks(sorted);

  } catch (error) {
    loadingMsg.classList.add("hidden");
    showStatus("Couldn't reach the book database. Check your internet connection and try again.");
    console.error(error);
  }
}

function sortBooks(books, sortType) {
  // We copy the array with [...books] so we don't mess up the
  // original order stored in currentBooks
  const booksCopy = [...books];

  if (sortType === "newest") {
    booksCopy.sort((a, b) => (b.first_publish_year || 0) - (a.first_publish_year || 0));
  } else if (sortType === "oldest") {
    booksCopy.sort((a, b) => (a.first_publish_year || 9999) - (b.first_publish_year || 9999));
  }
  // If sortType is "relevance", we just leave the original API order alone

  return booksCopy;
}

function renderBooks(books) {
  resultsContainer.innerHTML = "";

  books.forEach((book) => {
    const card = document.createElement("div");
    card.className = "book-card";

    // Not every book has a cover, so we fall back to a placeholder
    // Open Library gives us a cover ID we can build an image URL from
    const coverUrl = book.cover_i
      ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
      : "https://via.placeholder.com/160x220?text=No+Cover";

    const title = book.title || "Untitled";
    const author = book.author_name ? book.author_name.join(", ") : "Unknown author";
    const year = book.first_publish_year || "Year unknown";

    card.innerHTML = `
      <img src="${coverUrl}" alt="${title} cover">
      <h3>${title}</h3>
      <p>${author}</p>
      <p>${year}</p>
    `;

    resultsContainer.appendChild(card);
  });
}

function showStatus(message) {
  statusMsg.textContent = message;
  statusMsg.classList.remove("hidden");
}

function hideStatus() {
  statusMsg.classList.add("hidden");
}
