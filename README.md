# Static Web Apps

Collection of static web applications hosted at [apps.sanjaysingh.net](https://apps.sanjaysingh.net).

## How It Works

- Put your static web app in a directory with an `index.html`
- Register the app in `apps.js` so it appears in the home page search
- The home page is a search box — type keywords (title, synonyms, related terms) to find and open an app

## Adding an App

1. Create app directory and add files:
   ```bash
   mkdir my-app
   cd my-app
   # Add your index.html and other files
   ```

2. Add an entry to the `window.APPS` array in `apps.js`:
   ```javascript
   {
     title: 'My App',
     url: '/my-app',
     keywords: ['my app', 'synonym', 'related term']
   },
   ```

   Use many `keywords` so users can find the app by different words (e.g. `uppercase`, `lowercase`, and `case` for a text casing tool).

3. Commit:
   ```bash
   git add .
   git commit -m "Add new app"
   ```

Your app will be available at `apps.sanjaysingh.net/my-app` and discoverable from the home page search.

For apps hosted outside this repo, set `url` to the full URL (e.g. `https://example.com`).

## Local Setup

1. Clone and setup:
   ```bash
   git clone https://github.com/sanjaysingh/staticsites.git
   cd staticsites
   ```

2. Test locally:
   - Open in VS Code
   - Install "Live Server" extension
   - Click "Go Live" in the bottom right
   - Site will open in your default browser

Alternatively, use Python's built-in server:
```bash
python -m http.server 8080
```

## Structure

```
.
├── index.html          # Home page search UI
├── home.js             # Client-side search logic
├── apps.js             # App titles, URLs, and search keywords (window.APPS)
├── app1/               # Your first app
│   └── index.html
├── app2/               # Another app
│   └── index.html
└── ...
```

## Notes

- Each app needs an `index.html` with a `<title>` (for the app itself; the home page uses `apps.js`)
- On deploy, CI replaces `__BUILD_ID__` in `index.html` script URLs with the git commit SHA so browsers fetch fresh `apps.js` and `home.js`
- Works on Windows, Linux, and macOS

## Making Apps Work Offline

A PowerShell script `offlineify.ps1` is included to help make HTML applications work offline by:

1. Finding external resources (CSS, JS) loaded from CDNs
2. Downloading them to a local `libs` folder
3. Updating HTML to reference local copies
4. Downloading secondary resources like fonts referenced in CSS files
5. Cleaning up integrity and crossorigin attributes

### Usage

```powershell
# Basic usage
.\offlineify.ps1 -HtmlFilePath path\to\your\index.html

# For example, to make the UUID generator work offline
.\offlineify.ps1 -HtmlFilePath .\uuid\index.html
```

### Features

- Downloads JS and CSS files from CDN links
- Preserves version numbers in filenames where possible
- Processes CSS files to find and download referenced fonts, images, etc.
- Creates a clean HTML with minimal attributes for offline use
- Works with ES6 module imports

This tool is especially useful when you need to ensure apps work without internet connectivity.
