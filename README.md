# Static Web Apps

Collection of static web applications hosted at [static.sanjaysingh.net](https://static.sanjaysingh.net).

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

Your app will appear at `static.sanjaysingh.net/my-app`

## Local Setup

1. Clone and setup:
   ```bash
   git clone https://github.com/sanjaybv/staticsites.git
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