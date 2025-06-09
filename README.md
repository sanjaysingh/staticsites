# Static Web Apps

Collection of static web applications hosted at [apps.sanjaysingh.net](https://apps.sanjaysingh.net).

## How It Works

- Put your static web app in a directory with an `index.html`
- The main index page updates automatically on commit
- Titles are extracted from each app's `<title>` tag

## Adding an App

1. Create app directory and add files:
   ```bash
   mkdir my-app
   cd my-app
   # Add your index.html and other files
   ```

2. Commit:
   ```bash
   git add .
   git commit -m "Add new app"
   ```

Your app will appear at `apps.sanjaysingh.net/my-app`

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
├── index.html          # Auto-updated index
├── app1/              # Your first app
│   └── index.html
├── app2/              # Another app
│   └── index.html
└── ...
```

## Notes

- Each app needs an `index.html` with a `<title>`
- No setup needed - hooks work automatically
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
