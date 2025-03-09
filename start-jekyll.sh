#!/bin/bash

# Check if Ruby is installed
if ! command -v ruby &> /dev/null; then
    echo "Ruby is not installed. Please install Ruby first."
    exit 1
fi

# Check if Bundler is installed
if ! command -v bundle &> /dev/null; then
    echo "Installing Bundler..."
    gem install bundler
fi

# Clean up runtime directory
echo "Cleaning up runtime directory..."
rm -rf runtime
rm -f .jekyll-metadata

# Create necessary directories
echo "Creating runtime directories..."
mkdir -p runtime/_site
mkdir -p runtime/.jekyll-cache

# Install dependencies
echo "Installing project dependencies..."
bundle install

# Start Jekyll server with enhanced live reload settings
echo "Starting Jekyll server..."
export JEKYLL_ENV=development
bundle exec jekyll serve \
    --livereload \
    --force_polling \
    --incremental false \
    --destination runtime/_site \
    --watch \
    --open-url \
    --port 4000 \
    --livereload-port 35729 