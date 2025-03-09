# Create a temporary file for the new apps list
$tempFile = [System.IO.Path]::GetTempFileName()

# Generate the list of apps
Get-ChildItem -Directory | Where-Object { 
    $_.Name -ne ".git" -and (Test-Path (Join-Path $_.FullName "index.html"))
} | ForEach-Object {
    $dir = $_.Name
    $indexPath = Join-Path $_.FullName "index.html"
    
    # Extract title from index.html and trim whitespace
    $title = (Select-String -Path $indexPath -Pattern "<title>(.*?)</title>" | 
             ForEach-Object { $_.Matches.Groups[1].Value.Trim() })
    if (-not $title) {
        $title = $dir
    }
    
    "                <li><a href=`"/$dir`">$title</a></li>"
} | Out-File -FilePath $tempFile -Encoding UTF8

# Replace content between <ol> and </ol>
$content = Get-Content "index.html" -Raw
$content -replace "(?s)(<ol>).*?(</ol>)", "`$1`n$(Get-Content $tempFile -Raw)`$2" |
    Out-File -FilePath "index.html" -Encoding UTF8 -NoNewline

# Clean up
Remove-Item $tempFile 