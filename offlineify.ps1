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
    $OriginalUri = $null # Store the original URI

    try {
        $OriginalUri = [System.Uri]$Url

        # Attempt to parse URL for name, version, and filename
        $FileName = [System.IO.Path]::GetFileName($OriginalUri.AbsolutePath)
        $Version = $null
        $LibName = $null

        # Common CDN patterns (add more as needed)
        if ($OriginalUri.Host -like '*cdnjs.cloudflare.com*') {
            # Example: /ajax/libs/font-awesome/6.5.1/css/all.min.css
            if ($OriginalUri.AbsolutePath -match '/ajax/libs/(?<name>[^/]+)/(?<version>\d+\.\d+\.\d+)/(?<path>.*)') {
                $LibName = $matches.name
                $Version = $matches.version
                $FileName = $matches.path.Replace('/','-') # Make path part safe for filename
            }
        } elseif ($OriginalUri.Host -like '*cdn.jsdelivr.net*') {
             # Example: /npm/uuid@11.1.0/+esm
             # Example: /npm/package@version/file.js
            if ($OriginalUri.AbsolutePath -match '/npm/(?<name>[^/@]+)@(?<version>\d+\.\d+(\.\d+)?)/(?<path>.*)') {
                $LibName = $matches.name
                $Version = $matches.version
                $FileName = $matches.path.TrimStart('/').Replace('/','-')
                 if ([string]::IsNullOrEmpty($FileName) -or $FileName -eq "+esm") { # Handle cases like /+esm
                    $FileName = "$($LibName).js" # Default to libname.js
                 }
            }
        } elseif ($OriginalUri.Host -like '*unpkg.com*') {
            # Example: /react@17.0.2/umd/react.production.min.js
            if ($OriginalUri.AbsolutePath -match '/(?<name>[^/@]+)@(?<version>\d+\.\d+\.\d+)/(?<path>.*)') {
                $LibName = $matches.name
                $Version = $matches.version
                $FileName = $matches.path.Replace('/','-')
            }
        }

        # Fallback if no pattern matched or components missing
        if ([string]::IsNullOrEmpty($FileName)) {
            $FileName = [System.IO.Path]::GetFileName($OriginalUri.AbsolutePath)
            if ([string]::IsNullOrEmpty($FileName)) {
                 $FileName = ($OriginalUri.Host + $OriginalUri.AbsolutePath) -replace '[^a-zA-Z0-9.-]', '_' # Sanitize a filename from URL
                 Write-Warning "Could not determine a clean filename for '$Url'. Using sanitized name: $FileName"
            }
        }
         if ([string]::IsNullOrEmpty($Version)) {
             # Try to find any x.y.z pattern in the path as a fallback version
             if ($OriginalUri.AbsolutePath -match '(\d+\.\d+\.\d+)') {
                $Version = $matches[1]
             }
         }

        # Construct local filename: name-version-filename.ext or name-version.ext or filename
        if (-not [string]::IsNullOrEmpty($LibName) -and -not [string]::IsNullOrEmpty($Version)) {
            $LocalFileName = "$($LibName)-$($Version)-$($FileName)"
        } elseif (-not [string]::IsNullOrEmpty($Version)) {
             # Try to insert version before extension, handle potential no-extension cases
            $NamePart = [System.IO.Path]::GetFileNameWithoutExtension($FileName)
            $ExtPart = [System.IO.Path]::GetExtension($FileName) # Includes the dot
            $LocalFileName = "${NamePart}-${Version}${ExtPart}"
        } else {
            $LocalFileName = $FileName
        }

        # Sanitize final filename
        $LocalFileName = $LocalFileName -replace '[\\/:*?"<>|]+','-' # Remove invalid chars

        $LocalFilePath = Join-Path -Path $LibsDir -ChildPath $LocalFileName

        Write-Host "Attempting download:"
        Write-Host "  From: $Url"
        Write-Host "  To:   $LocalFilePath"

        # Download the file temporarily to memory or a temp file first to check content type
        $Response = Invoke-WebRequest -Uri $Url -UseBasicParsing #-SkipCertificateCheck

        # Determine if it's CSS
        $IsCss = $false
        if ($Response.ContentType -like '*css*' -or $LocalFileName -like '*.css') {
            $IsCss = $true
        }

        # Get content (as text for CSS processing)
        $FileContent = $Response.Content

        if ($IsCss) {
            Write-Host "  Downloaded file appears to be CSS. Processing for relative resources..."
            # Process CSS content for relative URLs and update $FileContent
            $FileContent = Process-CssContent -CssContent $FileContent -BaseUrl $OriginalUri -LibsDirectory $LibsDir
        }

        # Save the (potentially modified) content to the final local file path
        # Use UTF8 encoding without BOM for web compatibility
        $Utf8NoBomEncoding = New-Object System.Text.UTF8Encoding($false)
        [System.IO.File]::WriteAllText($LocalFilePath, $FileContent, $Utf8NoBomEncoding)
        Write-Host "  Save successful: $LocalFilePath"

        # Replace URL in HTML content
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

# --- Helper Function to Process CSS Content ---
function Process-CssContent {
    param(
        [string]$CssContent,
        [System.Uri]$BaseUrl, # The original URL of the CSS file
        [string]$LibsDirectory # The root 'libs' directory path
    )

    # Regex to find url(...) patterns with relative paths
    # It specifically avoids paths starting with /, http, https, data:
    # Use .+? for non-greedy match for the path itself, allows more characters.
    $UrlRegex = 'url\(\s*(["\''])?(?!/|https?:|data:)(.+?)\1?\s*\)' # Adjusted Regex
    $UpdatedCssContent = $CssContent

    # Find all matches
    $Matches = [regex]::Matches($CssContent, $UrlRegex)
    if ($Matches.Count -gt 0) {
        Write-Host ("  Found {0} potential relative URLs in CSS." -f $Matches.Count)
    } else {
        Write-Host "  No relative URLs found in CSS matching the pattern."
        # DEBUG: Show a snippet of the CSS content if no matches found
        # Write-Host ("    CSS Content Snippet: " + ($CssContent | Select-String -Pattern 'url\(' | Select -First 5) -join "`n    ")
    }

    foreach ($Match in $Matches) {
        $OriginalFullMatch = $Match.Groups[0].Value # e.g., url('../webfonts/fa-solid-900.woff2') or url("..webfonts/fa-solid-900.woff2")
        # Group 1 is the optional quote, Group 2 is the path
        $RelativePath = $Match.Groups[2].Value      # e.g., ../webfonts/fa-solid-900.woff2

        Write-Host "    Processing relative CSS path: '$RelativePath' (Full match: '$OriginalFullMatch')"

        try {
            # 1. Resolve the absolute URL of the resource
            $ResourceAbsoluteUri = [System.Uri]::new($BaseUrl, $RelativePath)
            $ResourceUrl = $ResourceAbsoluteUri.AbsoluteUri
            Write-Host "      Resolved resource URL: '$ResourceUrl'"

            # 2. Determine the local path for the resource
            # We'll try to preserve the relative structure within libs
            $SubDir = ($RelativePath -split '[\/]+') | Where-Object { $_ -ne '..' -and $_ -ne '.' } | Select-Object -First 1
            if (-not $SubDir -or $SubDir -notin ('fonts', 'webfonts', 'images', 'img', 'assets')) {
                 $SubDir = ($RelativePath -split '[\/]+') | Where-Object { $_ -ne '..' -and $_ -ne '.' } | Select-Object -First 1
                 if (-not $SubDir) { $SubDir = "assets" } # Ultimate fallback
                 Write-Host "      Subdirectory determined as: '$SubDir' (using fallback logic)" 
            } else {
                Write-Host "      Subdirectory determined as: '$SubDir' (using predefined list)"
            }

            $ResourceFileName = [System.IO.Path]::GetFileName($ResourceAbsoluteUri.AbsolutePath)
            if ([string]::IsNullOrEmpty($ResourceFileName)) {
                Write-Warning "      Could not determine filename from path '$($ResourceAbsoluteUri.AbsolutePath)'. Skipping resource."
                continue # Skip to next match
            }

            $ResourceSubDir = Join-Path -Path $LibsDirectory -ChildPath $SubDir
            $ResourceLocalFullPath = Join-Path -Path $ResourceSubDir -ChildPath $ResourceFileName
            Write-Host "      Calculated local full path: '$ResourceLocalFullPath'"

            # Create the subdirectory if it doesn't exist
            if (-not (Test-Path -Path $ResourceSubDir -PathType Container)) {
                Write-Host "      Creating subdirectory: '$ResourceSubDir'"
                try {
                    New-Item -Path $ResourceSubDir -ItemType Directory -Force -ErrorAction Stop | Out-Null
                } catch {
                    Write-Error "      Failed to create subdirectory '$ResourceSubDir': $($_.Exception.Message)"
                    continue # Skip to next match
                }
            }

            # 3. Download the resource (if not already downloaded)
            if (-not (Test-Path $ResourceLocalFullPath)) {
                Write-Host "      Attempting download: '$ResourceUrl' -> '$ResourceLocalFullPath'"
                try {
                    Invoke-WebRequest -Uri $ResourceUrl -OutFile $ResourceLocalFullPath -UseBasicParsing -ErrorAction Stop
                    Write-Host "        Download successful."
                } catch {
                    Write-Warning "      Download FAILED for '$ResourceUrl': $($_.Exception.Message)"
                    # Optional: Delete partially downloaded file?
                    # if (Test-Path $ResourceLocalFullPath) { Remove-Item $ResourceLocalFullPath -Force }
                    continue # Skip trying to update CSS for this failed download
                }
            } else {
                 Write-Host "      Resource already downloaded: '$ResourceLocalFullPath'"
            }

            # 4. Calculate the new relative path for the CSS file
            $NewRelativePathForCss = (Split-Path $ResourceLocalFullPath -Parent | Split-Path -Leaf) + "/" + (Split-Path $ResourceLocalFullPath -Leaf)
            $NewRelativePathForCss = $NewRelativePathForCss.Replace('\','/') # Ensure forward slashes
            Write-Host "      Calculated new relative path for CSS: '$NewRelativePathForCss'"

            # 5. Replace in CSS Content
            $EscapedOriginalPath = [Regex]::Escape($RelativePath)
            # Construct replacement string, trying to preserve original quoting style if possible
            $QuoteChar = $Match.Groups[1].Value
            $ReplacementString = "url($QuoteChar$($NewRelativePathForCss)$QuoteChar)" # Use original quote char

            Write-Host "      Attempting to replace '$OriginalFullMatch' with '$ReplacementString'"

            # Use a more specific replace targeting the full original match
            $TempUpdatedCssContent = $UpdatedCssContent -replace ([Regex]::Escape($OriginalFullMatch)), $ReplacementString

            if ($TempUpdatedCssContent -ne $UpdatedCssContent) {
                Write-Host "        Replacement successful."
                $UpdatedCssContent = $TempUpdatedCssContent
            } else {
                Write-Warning "        Replacement seemed to FAIL. String '$OriginalFullMatch' not found or identical to replacement?"
            }

        } catch {
             Write-Warning "    ERROR processing relative path '$RelativePath': $($_.Exception.Message)"
        }
    }

    return $UpdatedCssContent
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

# --- Clean up attributes in modified tags ---
Write-Host "Cleaning attributes from modified <link> and <script> tags..."

# Clean <link> tags pointing to local libs (assuming rel="stylesheet")
# Matches <link ... href="libs/..." ... > and keeps only rel and href
$CleanedLinkCount = 0
$HtmlContent = [regex]::Replace($HtmlContent, '(?i)(<link\s+)([^>]*?href\s*=\s*(["']))(libs/[^\3>]+)(\3[^>]*?>)', {
    param($Match)
    $HrefValue = $Match.Groups[4].Value
    $CleanedLinkCount++
    # Construct the cleaned tag. Assumes rel=stylesheet is desired.
    '<link rel="stylesheet" href="{0}">' -f $HrefValue
})
Write-Host "  Cleaned attributes from $CleanedLinkCount modified <link> tag(s)."

# Clean <script> tags pointing to local libs
# Matches <script ... src="libs/..." ... ></script> and keeps only src and optionally type
$CleanedScriptCount = 0
$HtmlContent = [regex]::Replace($HtmlContent, '(?is)(<script\s+)([^>]*?src\s*=\s*(["']))(libs/[^\3>]+)(\3[^>]*?>)(.*?)</script>', {
    param($Match)
    $AttributesBefore = $Match.Groups[2].Value
    $SrcValue = $Match.Groups[4].Value
    $AttributesAfter = $Match.Groups[5].Value
    $ScriptContent = $Match.Groups[6].Value # Keep inner content if any, though unlikely for src tags
    
    $CleanedScriptCount++
    
    # Check if a type attribute exists in the original attributes
    $TypeAttr = $null
    if (($AttributesBefore + $AttributesAfter) -match '(?i)type\s*=\s*(["'])([^\1>]+)\1') {
        $TypeAttr = 'type="{0}"' -f $Matches[2]
    }
    
    # Construct the cleaned tag
    if ($TypeAttr) {
        '<script {0} src="{1}">{2}</script>' -f $TypeAttr, $SrcValue, $ScriptContent
    } else {
        '<script src="{0}">{1}</script>' -f $SrcValue, $ScriptContent
    }
})
Write-Host "  Cleaned attributes from $CleanedScriptCount modified <script> tag(s)."


# --- Write updated content back to file ---
Write-Host "Saving updated HTML file..."
# Use UTF8 encoding without BOM for web compatibility
$Utf8NoBomEncoding = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllLines($HtmlFile.FullName, ($HtmlContent -split '\r?\n'), $Utf8NoBomEncoding)

Write-Host "Processing complete for $($HtmlFile.FullName)."
Write-Host "Local libraries saved in: $LibsDirectory" 