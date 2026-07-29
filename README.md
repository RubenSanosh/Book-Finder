# Book Finder

A simple web app where you can search for any book and see the cover, author, and publish year. Built using the Open Library API.

## What it does

Type in a book title or author name, hit search, and it pulls real results from Open Library's database. You can also sort results by newest or oldest publish date using the dropdown.

No backend, no database, no API key needed - it's just HTML, CSS, and JavaScript talking directly to a free public API.

## Why I built this

I wanted to practice working with a real API instead of just hardcoded data, and I wanted something visual I could actually show off, not just a console.log project. Book search felt like a good pick because Open Library doesn't require an API key or sign up, so I could focus on learning `fetch()` and building the UI instead of fighting with authentication.

This was my first time using `async/await` for real instead of copy-pasting it, so getting the loading state and error handling to actually work properly took a few tries. I also learned the hard way that not every book in the API has a cover image, which is why there's a fallback placeholder image in the code.

## How to run it

You don't need to install anything, it's just static files.

### Windows

1. Download or clone this repo:
   ```
   git clone https://github.com/yourusername/book-finder.git
   ```
2. Open the `book-finder` folder
3. Double-click `index.html` and it'll open in your browser

That's it. If you want live-reloading while editing, open the folder in VS Code and use the **Live Server** extension instead of opening the file directly.

### Mac/Linux

Same thing - just open `index.html` in your browser, or run a local server if you prefer:
```
python3 -m http.server
```
then go to `http://localhost:8000` in your browser.

## How it works (quick overview)

- `index.html` - the page structure (search bar, dropdown, results area)
- `style.css` - styling, layout, and the card grid for results
- `script.js` - handles the search, calls the Open Library API, and builds the result cards

When you search, the app sends a request to:
```
https://openlibrary.org/search.json?q=YOUR_SEARCH
```
and gets back a list of matching books as JSON. The script then loops through the results and builds a little card for each one with the cover image, title, author, and year.

## Things I'd like to add later

- A loading skeleton instead of just plain text while results load
- Click on a book to see more details (description, other editions, etc.)
- Filter by genre/subject, not just sort by year
- Save favorite books to a list using localStorage

## Project structure

```
book-finder/
  index.html      # page layout
  style.css       # styling
  script.js       # search logic and API calls
  README.md       # this file
```

## Credit

Book data and cover images come from [Open Library](https://openlibrary.org/developers/api), which is a free, open API - no key required.
