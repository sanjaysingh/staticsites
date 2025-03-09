#!/bin/bash

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Docker is not running. Please start Docker first."
    exit 1
fi

echo "Cleaning up old containers and build cache..."
docker-compose down
docker-compose rm -f
rm -rf runtime/

echo "Starting Jekyll site in Docker..."
docker-compose build --no-cache
docker-compose up --force-recreate 