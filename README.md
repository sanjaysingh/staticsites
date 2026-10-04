# Apps Index

Search index for the utility web apps at [apps.sanjaysingh.net](https://apps.sanjaysingh.net).

Each app lives in its own repository and is deployed to its own URL. This repository is only the home page: a search box that finds an app and opens it.

## How it works

- `index.html` and `home.js` are the search page. Search matches the title and keywords, and the page keeps a short list of recently opened apps in the browser.
- `apps.js` is the catalog, exposed as `window.APPS`. Each entry has a title, an absolute URL, and search keywords.
- A push to `master` deploys the site with GitHub Pages. The workflow replaces `__BUILD_ID__` in the script URLs with the commit SHA so browsers load a fresh catalog.

## Add an app

Add an entry to `window.APPS` in `apps.js`:

```javascript
{
  title: 'My App',
  url: 'https://example.sanjaysingh.net',
  keywords: ['my app', 'synonym', 'related term']
}
```

Use several keywords so the app can be found by different words. The URL is the app's own site.

## Local setup

```bash
git clone https://github.com/sanjaysingh/apps-index.git
cd apps-index
python -m http.server 8080
```

Open http://localhost:8080.

## Files

- `index.html` — search page
- `home.js` — search, keyboard navigation, and recent apps
- `apps.js` — catalog
- `CNAME` — `apps.sanjaysingh.net`
