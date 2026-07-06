param(
    [string]$StartUrl = "https://www.cowinsupply.com/",
    [string]$OutputDir = "public",
    [int]$MaxPages = 500
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$root = (Resolve-Path ".").Path
$outRoot = Join-Path $root $OutputDir
$rawRoot = Join-Path $root ".sync-raw"
$assetRoot = Join-Path $outRoot "_assets"
$userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36"
$start = [Uri]$StartUrl
$allowedHosts = @("cowinsupply.com", "www.cowinsupply.com")

New-Item -ItemType Directory -Force -Path $outRoot, $rawRoot, $assetRoot | Out-Null

function Normalize-Url([string]$Url, [Uri]$Base) {
    if ([string]::IsNullOrWhiteSpace($Url)) { return $null }
    $u = $Url.Trim()
    for ($i = 0; $i -lt 5; $i++) {
        $decoded = [Net.WebUtility]::HtmlDecode($u)
        if ($decoded -eq $u) { break }
        $u = $decoded
    }
    if ($u -match '^(?i)(javascript:|mailto:|tel:|whatsapp:|#)') { return $null }
    if ($u.StartsWith("//")) { $u = "https:$u" }
    try {
        $uri = [Uri]::new($Base, $u)
        $builder = [UriBuilder]::new($uri)
        $builder.Fragment = ""
        return $builder.Uri.AbsoluteUri
    } catch {
        return $null
    }
}

function Is-Asset-Url([string]$Url) {
    try {
        $uri = [Uri]$Url
        $path = $uri.AbsolutePath.ToLowerInvariant()
        if ($path -match '\.(jpg|jpeg|png|gif|webp|svg|ico|css|js|woff|woff2|ttf|eot|pdf|mp4|webm|json)(/|$)') { return $true }
        if ($uri.Host.ToLowerInvariant() -match '(^|\.)fuwucms\.com$') { return $true }
        return $false
    } catch {
        return $false
    }
}

function Is-Internal-Page([string]$Url) {
    try {
        $uri = [Uri]$Url
        if ($allowedHosts -notcontains $uri.Host.ToLowerInvariant()) { return $false }
        $path = $uri.AbsolutePath.ToLowerInvariant()
        if ($path -match '\.(jpg|jpeg|png|gif|webp|svg|ico|css|js|woff|woff2|ttf|eot|pdf|zip|rar|mp4|webm|avi|mov)$') { return $false }
        return $true
    } catch {
        return $false
    }
}

function Get-Short-Hash([string]$Text) {
    $sha = [Security.Cryptography.SHA1]::Create()
    $bytes = [Text.Encoding]::UTF8.GetBytes($Text)
    $hash = -join ($sha.ComputeHash($bytes) | ForEach-Object { $_.ToString("x2") })
    return $hash.Substring(0, 10)
}

function Sanitize-Segment([string]$Segment) {
    $safe = $Segment -replace '[<>:"/\\|?*]', '-'
    $safe = $safe -replace '\s+', ' '
    $safe = $safe.Trim()
    if ([string]::IsNullOrWhiteSpace($safe)) { return "index" }
    if ($safe.Length -gt 70) {
        return "$($safe.Substring(0, 50).Trim())-$(Get-Short-Hash $safe)"
    }
    return $safe
}

function Normalize-Local-Path([string]$Path) {
    $segments = @()
    foreach ($segment in ($Path -split '/')) {
        if (-not [string]::IsNullOrWhiteSpace($segment)) {
            $segments += (Sanitize-Segment $segment)
        }
    }
    return ($segments -join [IO.Path]::DirectorySeparatorChar)
}

function Get-Page-Path([string]$Url) {
    $uri = [Uri]$Url
    $path = Normalize-Local-Path ([Uri]::UnescapeDataString($uri.AbsolutePath.TrimStart("/")))
    $querySuffix = ""
    if (-not [string]::IsNullOrWhiteSpace($uri.Query)) {
        $querySuffix = "-q$(Get-Short-Hash $uri.Query)"
    }
    if ([string]::IsNullOrWhiteSpace($path)) {
        return Join-Path $outRoot "index$querySuffix.html"
    }
    if ($path.EndsWith("/")) {
        return Join-Path $outRoot (Join-Path $path "index$querySuffix.html")
    }
    $ext = [IO.Path]::GetExtension($path)
    if ([string]::IsNullOrWhiteSpace($ext)) {
        return Join-Path $outRoot (Join-Path $path "index$querySuffix.html")
    }
    if ($querySuffix) {
        $dir = Split-Path $path -Parent
        $name = [IO.Path]::GetFileNameWithoutExtension($path)
        $ext = [IO.Path]::GetExtension($path)
        return Join-Path $outRoot (Join-Path $dir "$name$querySuffix$ext")
    }
    return Join-Path $outRoot $path
}

function Get-Raw-Page-Path([string]$Url) {
    $local = Get-Page-Path $Url
    $rel = Get-Relative-FilePath $outRoot $local
    return Join-Path $rawRoot $rel
}

function Get-Relative-FilePath([string]$FromDir, [string]$ToPath) {
    $fromFull = [IO.Path]::GetFullPath($FromDir)
    $toFull = [IO.Path]::GetFullPath($ToPath)
    if (-not $fromFull.EndsWith([IO.Path]::DirectorySeparatorChar)) {
        $fromFull += [IO.Path]::DirectorySeparatorChar
    }
    $fromUri = [Uri]$fromFull
    $toUri = [Uri]$toFull
    $rel = [Uri]::UnescapeDataString($fromUri.MakeRelativeUri($toUri).ToString())
    return ($rel -replace '/', [IO.Path]::DirectorySeparatorChar)
}

function Get-Asset-Path([string]$Url) {
    $uri = [Uri]$Url
    $path = [Uri]::UnescapeDataString($uri.AbsolutePath.TrimStart("/"))
    if ([string]::IsNullOrWhiteSpace($path) -or $path.EndsWith("/")) { $path = $path + "index" }
    if (-not [string]::IsNullOrWhiteSpace($uri.Query)) {
        $hash = Get-Short-Hash $uri.Query
        $dir = Split-Path $path -Parent
        $name = [IO.Path]::GetFileNameWithoutExtension($path)
        $ext = [IO.Path]::GetExtension($path)
        if ([string]::IsNullOrWhiteSpace($ext)) { $ext = ".bin" }
        $path = Join-Path $dir "$name-$hash$ext"
    }
    return Join-Path (Join-Path $assetRoot $uri.Host.ToLowerInvariant()) $path
}

function Extract-Urls([string]$Text, [Uri]$Base) {
    $urls = [System.Collections.Generic.List[string]]::new()
    $patterns = @(
        '(?i)(?:href|src|data-src|data-original|poster|action)\s*=\s*["'']([^"'']+)["'']',
        '(?i)url\(\s*["'']?([^"''\)]+)["'']?\s*\)'
    )
    foreach ($pattern in $patterns) {
        foreach ($m in [regex]::Matches($Text, $pattern)) {
            $normalized = Normalize-Url $m.Groups[1].Value $Base
            if ($normalized) { $urls.Add($normalized) }
        }
    }
    foreach ($m in [regex]::Matches($Text, '(?i)srcset\s*=\s*["'']([^"'']+)["'']')) {
        foreach ($part in $m.Groups[1].Value.Split(",")) {
            $candidate = $part.Trim().Split(" ")[0]
            $normalized = Normalize-Url $candidate $Base
            if ($normalized) { $urls.Add($normalized) }
        }
    }
    return $urls | Select-Object -Unique
}

function Download-Text([string]$Url) {
    $headers = @{ "User-Agent" = $userAgent; "Accept" = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" }
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 45 -Headers $headers
    return $response.Content
}

function Download-File([string]$Url, [string]$Path) {
    if (Test-Path $Path) { return $true }
    New-Item -ItemType Directory -Force -Path (Split-Path $Path -Parent) | Out-Null
    try {
        Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 60 -Headers @{ "User-Agent" = $userAgent } -OutFile $Path
        return $true
    } catch {
        Write-Warning "Asset failed: $Url :: $($_.Exception.Message)"
        return $false
    }
}

$queue = [System.Collections.Generic.Queue[string]]::new()
$seenPages = [System.Collections.Generic.HashSet[string]]::new()
$assetUrls = [System.Collections.Generic.HashSet[string]]::new()
$pageUrls = [System.Collections.Generic.List[string]]::new()
$queue.Enqueue($start.AbsoluteUri)

while ($queue.Count -gt 0 -and $seenPages.Count -lt $MaxPages) {
    $url = $queue.Dequeue()
    if (-not $seenPages.Add($url)) { continue }
    Write-Host "Page $($seenPages.Count): $url"
    try {
        $content = Download-Text $url
    } catch {
        Write-Warning "Page failed: $url :: $($_.Exception.Message)"
        continue
    }
    $rawPath = Get-Raw-Page-Path $url
    New-Item -ItemType Directory -Force -Path (Split-Path $rawPath -Parent) | Out-Null
    [IO.File]::WriteAllText($rawPath, $content, [Text.UTF8Encoding]::new($false))
    $pageUrls.Add($url)

    foreach ($found in Extract-Urls $content ([Uri]$url)) {
        if (Is-Internal-Page $found) {
            if (-not $seenPages.Contains($found)) { $queue.Enqueue($found) }
        } elseif (Is-Asset-Url $found) {
            [void]$assetUrls.Add($found)
        }
    }
}

$assetMap = @{}
$i = 0
foreach ($asset in ($assetUrls | Sort-Object)) {
    $i++
    $path = Get-Asset-Path $asset
    Write-Host "Asset $i/$($assetUrls.Count): $asset"
    if (Download-File $asset $path) {
        $assetMap[$asset] = $path
        if ($asset -match '\.(css)(\?|$)') {
            $css = [IO.File]::ReadAllText($path)
            foreach ($found in Extract-Urls $css ([Uri]$asset)) {
                if (-not (Is-Internal-Page $found) -and -not $assetMap.ContainsKey($found)) {
                    $nestedPath = Get-Asset-Path $found
                    if (Download-File $found $nestedPath) { $assetMap[$found] = $nestedPath }
                }
            }
        }
    }
}

function To-Relative-WebPath([string]$FromFile, [string]$TargetFile) {
    $rel = Get-Relative-FilePath (Split-Path $FromFile -Parent) $TargetFile
    return ($rel -replace '\\','/')
}

function Replace-Url-Variants([string]$Content, [string]$Url, [string]$Replacement) {
    $escapedReplacement = $Replacement.Replace('$', '$$')
    $boundary = '(?=["''\s>\)])'
    $variants = [System.Collections.Generic.List[string]]::new()
    $variants.Add($Url)
    $variants.Add($Url.Replace("https://", "//"))
    $decodedUrl = [Uri]::UnescapeDataString($Url)
    if ($decodedUrl -ne $Url) {
        $variants.Add($decodedUrl)
        $variants.Add($decodedUrl.Replace("https://", "//"))
    }
    $result = $Content
    foreach ($variant in ($variants | Select-Object -Unique)) {
        $result = [regex]::Replace($result, [regex]::Escape($variant) + $boundary, $escapedReplacement)
    }
    if ($Url.EndsWith("/")) {
        $withoutSlash = $Url.TrimEnd("/")
        $result = [regex]::Replace($result, [regex]::Escape($withoutSlash) + $boundary, $escapedReplacement)
    }
    return $result
}

foreach ($url in $pageUrls) {
    $rawPath = Get-Raw-Page-Path $url
    $localPath = Get-Page-Path $url
    $content = [IO.File]::ReadAllText($rawPath)
    $baseUri = [Uri]$url
    foreach ($found in Extract-Urls $content $baseUri) {
        $replacement = $null
        if (Is-Internal-Page $found) {
            $replacement = To-Relative-WebPath $localPath (Get-Page-Path $found)
        } elseif ($assetMap.ContainsKey($found)) {
            $replacement = To-Relative-WebPath $localPath $assetMap[$found]
        }
        if ($replacement) {
            $content = Replace-Url-Variants $content $found $replacement
        }
    }
    New-Item -ItemType Directory -Force -Path (Split-Path $localPath -Parent) | Out-Null
    [IO.File]::WriteAllText($localPath, $content, [Text.UTF8Encoding]::new($false))
}

foreach ($asset in $assetMap.Keys) {
    $path = $assetMap[$asset]
    if ($path -match '\.css$' -and (Test-Path $path)) {
        $css = [IO.File]::ReadAllText($path)
        foreach ($found in Extract-Urls $css ([Uri]$asset)) {
            if ($assetMap.ContainsKey($found)) {
                $css = $css.Replace($found, (To-Relative-WebPath $path $assetMap[$found]))
                $css = $css.Replace($found.Replace("https://", "//"), (To-Relative-WebPath $path $assetMap[$found]))
            }
        }
        [IO.File]::WriteAllText($path, $css, [Text.UTF8Encoding]::new($false))
    }
}

$summary = [ordered]@{
    startUrl = $StartUrl
    generatedAt = (Get-Date).ToString("s")
    pages = $pageUrls.Count
    assets = $assetMap.Count
    output = $outRoot
}
$summary | ConvertTo-Json | Set-Content -Encoding UTF8 (Join-Path $outRoot "sync-summary.json")
Write-Host "Done. Pages: $($pageUrls.Count). Assets: $($assetMap.Count). Output: $outRoot"
