<#
.SYNOPSIS
Downloads external resources (CSS, JS) linked via CDN in an HTML file
and updates the HTML to use local paths.

.DESCRIPTION
This script takes an HTML file as input, parses it to find links to external
resources hosted on CDNs (like CSS files in <link> tags and JavaScript files
in <script src> or ES module imports). It downloads these resources into a
'libs' subdirectory (created relative to the HTML file) and modifies the
original HTML file to reference these local copies instead of the CDN URLs.
The script attempts to include library names and versions in the downloaded filenames.

.PARAMETER HtmlFilePath
The path to the HTML file to process.

.EXAMPLE
.\offlinify.ps1 -HtmlFilePath "C:\path\to\your\index.html"

.EXAMPLE
.\offlinify.ps1 .\index.html

.NOTES
Author: Gemini
Date:   2024-03-08
- Requires PowerShell 5.1 or later for Invoke-WebRequest features.
- The URL parsing logic attempts common CDN patterns but might not cover all cases.
- Ensure you have internet connectivity to download the resources.
- The script modifies the input HTML file in place. Consider backing it up first.
#>
param(
    [Parameter(Mandatory=$true, Position=0)]
    [string]$HtmlFilePath
)

# Validate input file path
if (-not (Test-Path -Path $HtmlFilePath -PathType Leaf)) {
    Write-Error "HTML file not found at path: $HtmlFilePath"
    exit 1
}

# Resolve to full path and get directory
$HtmlFile = Get-Item -Path $HtmlFilePath
$HtmlDirectory = $HtmlFile.DirectoryName
$LibsDirectory = Join-Path -Path $HtmlDirectory -ChildPath "libs"

# Create libs directory if it doesn't exist
if (-not (Test-Path -Path $LibsDirectory -PathType Container)) {
    Write-Host "Creating directory: $LibsDirectory"
    New-Item -Path $LibsDirectory -ItemType Directory -Force | Out-Null
}

Write-Host "Processing HTML file: $($HtmlFile.FullName)"
Write-Host "Using library directory: $LibsDirectory"

# Read HTML content
$HtmlContent = Get-Content -Path $HtmlFile.FullName -Raw

# --- Helper Function to Download and Replace ---
function Download-And-Replace {
    param(
        [string]$Url,
        [ref]$ContentRef,
        [string]$LibsDir,
        [string]$RelativeLibsPath = "libs/" # Default relative path for most tags
    )

    Write-Host "Found URL: $Url"
    $LocalFileName = $null
    $LocalFilePath = $null

    try {
        $Uri = [System.Uri]$Url

        # Attempt to parse URL for name, version, and filename
        $FileName = [System.IO.Path]::GetFileName($Uri.AbsolutePath)
        $Version = $null
        $LibName = $null

        # Common CDN patterns (add more as needed)
        if ($Uri.Host -like '*cdnjs.cloudflare.com*') {
            # Example: /ajax/libs/font-awesome/6.5.1/css/all.min.css
            if ($Uri.AbsolutePath -match '/ajax/libs/(?<name>[^/]+)/(?<version>\d+\.\d+\.\d+)/(?<path>.*)') {
                $LibName = $matches.name
                $Version = $matches.version
                $FileName = $matches.path.Replace('/','-') # Make path part safe for filename
            }
        } elseif ($Uri.Host -like '*cdn.jsdelivr.net*') {
             # Example: /npm/uuid@11.1.0/+esm
             # Example: /npm/package@version/file.js
            if ($Uri.AbsolutePath -match '/npm/(?<name>[^/@]+)@(?<version>\d+\.\d+(\.\d+)?)/(?<path>.*)') {
                $LibName = $matches.name
                $Version = $matches.version
                $FileName = $matches.path.TrimStart('/').Replace('/','-')
                 if ([string]::IsNullOrEmpty($FileName) -or $FileName -eq "+esm") { # Handle cases like /+esm
                    $FileName = "$($LibName).js" # Default to libname.js
                 }
            }
        } elseif ($Uri.Host -like '*unpkg.com*') {
            # Example: /react@17.0.2/umd/react.production.min.js
            if ($Uri.AbsolutePath -match '/(?<name>[^/@]+)@(?<version>\d+\.\d+\.\d+)/(?<path>.*)') {
                $LibName = $matches.name
                $Version = $matches.version
                $FileName = $matches.path.Replace('/','-')
            }
        }

        # Fallback if no pattern matched or components missing
        if ([string]::IsNullOrEmpty($FileName)) {
            $FileName = [System.IO.Path]::GetFileName($Uri.AbsolutePath)
            if ([string]::IsNullOrEmpty($FileName)) {
                 $FileName = ($Uri.Host + $Uri.AbsolutePath) -replace '[^a-zA-Z0-9.-]', '_' # Sanitize a filename from URL
                 Write-Warning "Could not determine a clean filename for '$Url'. Using sanitized name: $FileName"
            }
        }
         if ([string]::IsNullOrEmpty($Version)) {
             # Try to find any x.y.z pattern in the path as a fallback version
             if ($Uri.AbsolutePath -match '(\d+\.\d+\.\d+)') {
                $Version = $matches[1]
             }
         }

        # Construct local filename: name-version-filename.ext or name-version.ext or filename
        if (-not [string]::IsNullOrEmpty($LibName) -and -not [string]::IsNullOrEmpty($Version)) {
            $LocalFileName = "$($LibName)-$($Version)-$($FileName)"
        } elseif (-not [string]::IsNullOrEmpty($Version)) {
             $LocalFileName = "$(($FileName -split '\.')[0])-$($Version).$(($FileName -split '\.')[-1])" # Insert version before extension
        } else {
            $LocalFileName = $FileName
        }

        # Sanitize final filename
        $LocalFileName = $LocalFileName -replace '[\\/:*?"<>|]+','-' # Remove invalid chars

        $LocalFilePath = Join-Path -Path $LibsDir -ChildPath $LocalFileName

        Write-Host "Attempting download:"
        Write-Host "  From: $Url"
        Write-Host "  To:   $LocalFilePath"

        # Download the file
        Invoke-WebRequest -Uri $Url -OutFile $LocalFilePath -UseBasicParsing #-SkipCertificateCheck # Add SkipCertificateCheck if needed for HTTPS issues
        Write-Host "  Download successful."

        # Replace URL in content
        $LocalRelativePath = $RelativeLibsPath + $LocalFileName
        $ContentRef.Value = $ContentRef.Value -replace ([regex]::Escape($Url)), $LocalRelativePath
        Write-Host "  Replaced URL in HTML with: $LocalRelativePath"
        return $true

    } catch {
        Write-Error "Failed to process URL '$Url': $($_.Exception.Message)"
        # Optionally remove partially downloaded file if it exists and failed
        if ($LocalFilePath -and (Test-Path $LocalFilePath)) {
            # Remove-Item $LocalFilePath -Force
        }
         return $false
    }
}

# --- Process <link href="..."> ---
$LinkRegex = '(?i)<link.*?href\s*=\s*["''](https?://.*?)["'']'
$Matches = [regex]::Matches($HtmlContent, $LinkRegex)
Write-Host ("Found {0} potential <link> tags with external http(s) URLs." -f $Matches.Count)

foreach ($Match in $Matches) {
    $Url = $Match.Groups[1].Value
    Download-And-Replace -Url $Url -ContentRef ([ref]$HtmlContent) -LibsDir $LibsDirectory #-RelativeLibsPath "libs/" (default)
}

# --- Process <script src="..."> ---
$ScriptRegex = '(?i)<script.*?src\s*=\s*["''](https?://.*?)["'']'
$Matches = [regex]::Matches($HtmlContent, $ScriptRegex)
Write-Host ("Found {0} potential <script> tags with external http(s) src URLs." -f $Matches.Count)

foreach ($Match in $Matches) {
    $Url = $Match.Groups[1].Value
    Download-And-Replace -Url $Url -ContentRef ([ref]$HtmlContent) -LibsDir $LibsDirectory #-RelativeLibsPath "libs/" (default)
}


# --- Process ES Module imports: import ... from '...' ---
# This is more complex as it can be nested in script tags
$ModuleImportRegex = '(?i)(import\s+.*?from\s+)(["''])(https?://.*?)\2'
$Matches = [regex]::Matches($HtmlContent, $ModuleImportRegex)
Write-Host ("Found {0} potential module imports with external http(s) URLs." -f $Matches.Count)

foreach ($Match in $Matches) {
    $FullImportStatement = $Match.Groups[0].Value
    $ImportPrefix = $Match.Groups[1].Value # "import ... from "
    $Quote = $Match.Groups[2].Value        # ' or "
    $Url = $Match.Groups[3].Value          # The URL

    # For module imports, the relative path often needs './'
    # Download-And-Replace returns $true on success
    if (Download-And-Replace -Url $Url -ContentRef ([ref]$HtmlContent) -LibsDir $LibsDirectory -RelativeLibsPath "./libs/") {
         # The replacement inside Download-And-Replace handles the URL part,
         # but it uses a simple string replace. For safety, we ensure the original full import statement is targeted
         # This replacement is slightly redundant if the simple one worked, but safer if URL appears elsewhere.
         # $LocalRelativePath constructed inside Download-And-Replace needs to be reconstructed here or returned,
         # For now, let's assume the simple replace in the function is sufficient for typical HTML files.
         # A more robust approach would involve passing the replacement path back from the function.
         Write-Host "  Note: Module import path updated."
    }
}


# --- Write updated content back to file ---
Write-Host "Saving updated HTML file..."
# Use UTF8 encoding without BOM for web compatibility
$Utf8NoBomEncoding = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllLines($HtmlFile.FullName, ($HtmlContent -split '\r?\n'), $Utf8NoBomEncoding)

Write-Host "Processing complete for $($HtmlFile.FullName)."
Write-Host "Local libraries saved in: $LibsDirectory" 