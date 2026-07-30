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
const ageGateModal = document.getElementById("ageGateModal");
const ageYesBtn = document.getElementById("ageYesBtn");
const ageNoBtn = document.getElementById("ageNoBtn");
const adultFilterBtn = document.getElementById("adultFilterBtn");
const categoryFilter = document.getElementById("categoryFilter");

// This keeps the last set of results so we can re-sort them
// without having to call the API again every time
let currentBooks = [];

// Which category filter is currently active: "all", "kids", "teen", or "adult"
let currentCategory = "all";

// --- Rate limiting ---
// Nothing stops someone from mashing the search button as fast as they
// can, which would fire a ton of requests at Open Library in a few
// seconds. That's not great - it wastes bandwidth and could get your
// IP throttled by their API. To stop that, we track the last time a
// search actually ran and just ignore clicks/enters that come in too
// soon after it.
const SEARCH_COOLDOWN_MS = 1000; // don't allow more than 1 search per second
let lastSearchTime = 0;

function canSearchNow() {
  const now = Date.now();
  if (now - lastSearchTime < SEARCH_COOLDOWN_MS) {
    return false;
  }
  lastSearchTime = now;
  return true;
}

// Run a search when the button is clicked
searchBtn.addEventListener("click", () => {
  if (canSearchNow()) {
    searchBooks();
  } else {
    showStatus("Slow down a little! Wait a second before searching again.");
  }
});

// Also let people just press Enter instead of clicking the button
searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    if (canSearchNow()) {
      searchBooks();
    } else {
      showStatus("Slow down a little! Wait a second before searching again.");
    }
  }
});

// Re-sort and redraw results whenever the dropdown changes
sortSelect.addEventListener("change", () => {
  applyFiltersAndRender();
});

// --- Age gate ---
// This is a simple, self-reported check - it's not real age
// verification (there's no way to actually verify that in a static
// site with no backend). All it does is decide whether the "Adult"
// filter button is clickable. Someone could just refresh and pick
// "Yes" anyway, but that's fine here since there's no actual mature
// content behind it - it's really just a UX pattern to practice.
ageYesBtn.addEventListener("click", () => {
  ageGateModal.classList.add("hidden");
});

ageNoBtn.addEventListener("click", () => {
  ageGateModal.classList.add("hidden");
  adultFilterBtn.disabled = true;
  adultFilterBtn.title = "You said you're under 18, so this filter is turned off.";
});

// --- Category filter buttons ---
categoryFilter.addEventListener("click", (event) => {
  const clickedBtn = event.target.closest(".category-btn");
  if (!clickedBtn || clickedBtn.disabled) {
    return;
  }

  // Update which button looks "active"
  document.querySelectorAll(".category-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  clickedBtn.classList.add("active");

  currentCategory = clickedBtn.dataset.category;
  applyFiltersAndRender();
});

// Works out whether a book counts as "kids", "teen", or "adult" based
// on the subject tags Open Library gives us. Not every book has
// subjects, so anything we can't confidently tag just falls into
// "adult" as a general default.
function categorizeBook(book) {
  if (!book.subject || book.subject.length === 0) {
    return "adult";
  }

  // Lowercase everything so "Juvenile Fiction" and "juvenile fiction"
  // both match
  const subjects = book.subject.map((s) => s.toLowerCase());

  const isKids = subjects.some((s) =>
    s.includes("juvenile") || s.includes("picture book") || s.includes("children")
  );
  if (isKids) return "kids";

  const isTeen = subjects.some((s) => s.includes("young adult"));
  if (isTeen) return "teen";

  return "adult";
}

// Filters currentBooks down to the active category, then sorts and
// renders whatever's left. This is the one function both the sort
// dropdown and the category buttons call, so they always work
// together instead of undoing each other.
function applyFiltersAndRender() {
  let filtered = currentBooks;

  if (currentCategory !== "all") {
    filtered = currentBooks.filter((book) => categorizeBook(book) === currentCategory);
  }

  const sorted = sortBooks(filtered, sortSelect.value);
  renderBooks(sorted);

  if (currentBooks.length > 0 && filtered.length === 0) {
    showStatus("No books in this category for that search. Try a different filter.");
  } else {
    hideStatus();
  }
}

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
  // spaces and special characters in the search don't break the URL.
  // We ask for the "subject" field specifically since that's what we
  // use to sort books into Kids/Teen/Adult further down.
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&fields=title,author_name,first_publish_year,cover_i,subject&limit=24`;

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

    // Reset back to "All" on a fresh search so results from the new
    // search aren't hidden by a filter picked during the last search
    currentCategory = "all";
    document.querySelectorAll(".category-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    document.querySelector('.category-btn[data-category="all"]').classList.add("active");

    applyFiltersAndRender();

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

    // Building the card with createElement + textContent instead of
    // innerHTML here. Book titles/authors come from Open Library, and
    // even though it's unlikely, if any of that text ever contained
    // something like "<script>", innerHTML would actually run it as
    // real HTML. textContent just displays it as plain text no matter
    // what's in it, so there's nothing to exploit.
    const img = document.createElement("img");
    img.src = coverUrl;
    img.alt = `${title} cover`;

    const titleEl = document.createElement("h3");
    titleEl.textContent = title;

    const authorEl = document.createElement("p");
    authorEl.textContent = author;

    const yearEl = document.createElement("p");
    yearEl.textContent = year;

    card.appendChild(img);
    card.appendChild(titleEl);
    card.appendChild(authorEl);
    card.appendChild(yearEl);

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
