# Static Web Apps Collection

This repository hosts a collection of static web applications, each serving a specific utility function. The site is built with Jekyll and automatically deployed to GitHub Pages.

## Project Structure

```
.
├── _layouts/              # Jekyll layout templates
├── runtime/              # Local development build directory (not in git)
│   ├── _site/           # Local built site
│   └── .jekyll-cache/   # Jekyll cache files
├── index.html            # Main index page listing all apps
├── app1/                # Example app directory
│   └── index.html       # App entry point
├── app2/                # Another app directory
│   └── index.html       # App entry point
├── _config.yml          # Jekyll configuration
├── Gemfile              # Ruby dependencies
└── start scripts        # Various scripts to run the project
```

## Creating a New App

1. Create a new directory for your app:
   ```bash
   mkdir myapp
   ```

2. Create an index.html file in your app directory:
   ```html
   <!DOCTYPE html>
   <html>
   <head>
       <title>My App Name</title>
       <!-- Your app's head content -->
   </head>
   <body>
       <!-- Your app's content -->
   </body>
   </html>
   ```

3. Your app will automatically appear in the main index page if it follows this structure.

## Running Locally

### Prerequisites

- Docker Desktop (recommended)
- OR Ruby + Bundler (alternative approach)

### Recommended: Using Docker (No Ruby Installation Required)

The easiest way to run the project is using Docker, which doesn't require installing Ruby or any dependencies on your system.

Windows:
```powershell
.\start-docker.ps1
```

Unix-like systems:
```bash
./start-docker.sh
```

This will:
- Set up all required dependencies in a container
- Start the development server
- Enable live reload
- Make the site available at http://localhost:4000

### Alternative: Using Ruby (Native)

If you prefer not to use Docker, you can run the project natively:

1. Install Ruby:
   - Windows: Install from [RubyInstaller](https://rubyinstaller.org/)
   - Unix: Use your system's package manager

2. Run the appropriate script:
   
   Windows:
   ```powershell
   .\start-jekyll.ps1
   ```

   Unix-like systems:
   ```bash
   ./start-jekyll.sh
   ```

The site will be available at:
- Main site: http://localhost:4000
- Your app: http://localhost:4000/myapp/

Live reload is enabled in both approaches, so changes will be reflected automatically in your browser.

## Development Notes

- All Jekyll-related temporary files are stored in the `runtime` directory
- The `runtime` directory is ignored by git
- GitHub Pages automatically builds and deploys the site
- No manual deployment is needed - just push your changes

## File Organization

- Each app should be in its own directory
- Each app must have an `index.html` file
- Keep all app assets within the app's directory
- Use relative paths within your app

## Best Practices

1. App Structure:
   - Keep each app self-contained in its directory
   - Use clear, descriptive app directory names
   - Include a proper `<title>` tag for the index listing

2. Assets:
   - Keep app-specific assets in the app's directory
   - Use common assets for shared resources
   - Optimize images and other assets

3. Development:
   - Use Docker for consistent development environment
   - Test locally before pushing
   - Use live reload for faster development
   - Keep apps simple and focused on a single purpose

## Common Issues

1. Docker Issues:
   - Ensure Docker Desktop is running
   - Try stopping and removing containers: `docker-compose down`
   - Clear Docker cache: `docker-compose build --no-cache`

2. Port already in use:
   - Stop any running containers: `docker-compose down`
   - Stop any running Jekyll instances
   - Change the port in docker-compose.yml if needed

3. Live Reload not working:
   - Ensure ports 4000 and 35729 are not blocked by firewall
   - Check if your browser allows WebSocket connections

## License

This project is licensed under the terms specified in the LICENSE file. 