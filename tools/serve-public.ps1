param(
    [string]$Root = "public",
    [int]$Port = 8080
)

$ErrorActionPreference = "Stop"
$rootPath = (Resolve-Path $Root).Path
$listener = [Net.HttpListener]::new()
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
$listener.Start()
Write-Host "Serving $rootPath at http://127.0.0.1:$Port/"

$mime = @{
    ".html" = "text/html; charset=utf-8"
    ".css" = "text/css; charset=utf-8"
    ".js" = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png" = "image/png"
    ".jpg" = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif" = "image/gif"
    ".webp" = "image/webp"
    ".svg" = "image/svg+xml"
    ".ico" = "image/x-icon"
    ".woff" = "font/woff"
    ".woff2" = "font/woff2"
    ".ttf" = "font/ttf"
    ".eot" = "application/vnd.ms-fontobject"
}

while ($listener.IsListening) {
    $context = $listener.GetContext()
    try {
        $requestPath = [Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart("/"))
        if ([string]::IsNullOrWhiteSpace($requestPath)) { $requestPath = "index.html" }
        $filePath = Join-Path $rootPath ($requestPath -replace '/', [IO.Path]::DirectorySeparatorChar)
        if ((Test-Path $filePath -PathType Container)) {
            $filePath = Join-Path $filePath "index.html"
        }
        $fullPath = [IO.Path]::GetFullPath($filePath)
        if (-not $fullPath.StartsWith($rootPath, [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path $fullPath -PathType Leaf)) {
            $context.Response.StatusCode = 404
            $bytes = [Text.Encoding]::UTF8.GetBytes("404")
        } else {
            $context.Response.StatusCode = 200
            $ext = [IO.Path]::GetExtension($fullPath).ToLowerInvariant()
            $context.Response.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { "application/octet-stream" }
            $bytes = [IO.File]::ReadAllBytes($fullPath)
        }
        $context.Response.ContentLength64 = $bytes.Length
        $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } catch {
        $context.Response.StatusCode = 500
    } finally {
        $context.Response.OutputStream.Close()
    }
}
