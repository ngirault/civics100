# Civics 100

Static study app for the **USCIS 2008 civics test (100 questions)**.

## Included

- Official 100-question USCIS 2008 question set
- Correct handling of questions requiring two or three responses
- Easy answer set plus other USCIS-accepted answers
- Memory hooks and short context/history notes
- Learn, test, and browse-all modes
- Utah current/local answers and congressional-district selector
- Progress saved in the browser with `localStorage`
- Responsive layout for phone and desktop
- Dataset kept separate so the newer 128-question set can be added later

## Important

Some civics-test answers change because of elections and appointments. Verify current
officeholders again shortly before the naturalization interview.

## Run locally

No build step is required. You can open `index.html` directly, or run:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## GitHub Pages

1. Push these files to a GitHub repository.
2. Open **Settings → Pages** in the repository.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Select `main` and `/ (root)`.
5. Save.

Your URL will look like:

`https://YOUR-USERNAME.github.io/civics100/`

## Structure

```text
civics100/
├── index.html
├── styles.css
├── script.js
├── data/
│   └── questions.js
└── README.md
```
