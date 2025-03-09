# Check if Ruby is installed
if (-not (Get-Command ruby -ErrorAction SilentlyContinue)) {
    Write-Error "Ruby is not installed. Please install Ruby from https://rubyinstaller.org/"
    exit 1
}

# Check if Bundler is installed
if (-not (Get-Command bundle -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Bundler..."
    gem install bundler
}

# Clean up runtime directory
Write-Host "Cleaning up runtime directory..."
Remove-Item -Path "runtime" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".jekyll-metadata" -Force -ErrorAction SilentlyContinue

# Create necessary directories
Write-Host "Creating runtime directories..."
New-Item -ItemType Directory -Force -Path "runtime/_site"
New-Item -ItemType Directory -Force -Path "runtime/.jekyll-cache"

# Create symbolic link for metadata file
Write-Host "Setting up metadata file location..."
cmd /c "mklink .jekyll-metadata runtime\.jekyll-metadata" 2>$null
if (-not $?) {
    Write-Host "Symbolic link creation failed, falling back to normal file location"
}

# Install dependencies
Write-Host "Installing project dependencies..."
bundle install

# Start Jekyll server with enhanced live reload settings
Write-Host "Starting Jekyll server..."
$env:JEKYLL_ENV = "development"
bundle exec jekyll serve `
    --livereload `
    --force_polling `
    --incremental false `
    --destination runtime/_site `
    --watch `
    --open-url `
    --port 4000 `
    --livereload-port 35729 