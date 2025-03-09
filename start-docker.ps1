# Check if Docker is running
if (-not (Get-Process -Name "Docker Desktop" -ErrorAction SilentlyContinue)) {
    Write-Error "Docker Desktop is not running. Please start Docker Desktop first."
    exit 1
}

Write-Host "Cleaning up old containers and build cache..."
docker-compose down
docker-compose rm -f
Remove-Item -Path "runtime" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Starting Jekyll site in Docker..."
docker-compose build --no-cache
docker-compose up --force-recreate 