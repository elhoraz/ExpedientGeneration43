# =========================================================================
# Expedient Generation 43 - Android Launcher & Splash Icon Generator
# =========================================================================

Add-Type -AssemblyName System.Drawing

$sourcePath = "public\icon-512.png"
if (-not (Test-Path $sourcePath)) {
    Write-Error "Source icon not found at: $sourcePath"
    exit 1
}

$fullSourcePath = (Resolve-Path $sourcePath).Path
$sourceImage = [System.Drawing.Image]::FromFile($fullSourcePath)

function Save-ResizedImage {
    param(
        [System.Drawing.Image]$Image,
        [int]$CanvasWidth,
        [int]$CanvasHeight,
        [int]$DrawWidth,
        [int]$DrawHeight,
        [string]$DestPath,
        [System.Drawing.Color]$BackgroundColor = [System.Drawing.Color]::Transparent
    )

    $bitmap = New-Object System.Drawing.Bitmap($CanvasWidth, $CanvasHeight)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.Clear($BackgroundColor)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $offsetX = [int](($CanvasWidth - $DrawWidth) / 2)
    $offsetY = [int](($CanvasHeight - $DrawHeight) / 2)

    $graphics.DrawImage($Image, $offsetX, $offsetY, $DrawWidth, $DrawHeight)
    $graphics.Dispose()

    $destDir = Split-Path -Parent $DestPath
    if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }

    # Save to file
    $bitmap.Save($DestPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bitmap.Dispose()
    Write-Host "Generated: $DestPath ($CanvasWidth x $CanvasHeight)" -ForegroundColor Green
}

$resDir = "android\app\src\main\res"

# 1. Standard / Legacy Icons (ic_launcher.png & ic_launcher_round.png)
$iconSizes = @{
    "mipmap-mdpi"    = 48
    "mipmap-hdpi"    = 72
    "mipmap-xhdpi"   = 96
    "mipmap-xxhdpi"  = 144
    "mipmap-xxxhdpi" = 192
}

foreach ($folder in $iconSizes.Keys) {
    $size = $iconSizes[$folder]
    $legacyPath = Join-Path $resDir "$folder\ic_launcher.png"
    $roundPath = Join-Path $resDir "$folder\ic_launcher_round.png"
    
    Save-ResizedImage -Image $sourceImage -CanvasWidth $size -CanvasHeight $size -DrawWidth $size -DrawHeight $size -DestPath $legacyPath
    Save-ResizedImage -Image $sourceImage -CanvasWidth $size -CanvasHeight $size -DrawWidth $size -DrawHeight $size -DestPath $roundPath
}

# 2. Adaptive Foreground Icons (ic_launcher_foreground.png)
# Android foreground uses 108dp canvas with safe zone approx 66-70% in center
$foregroundSizes = @{
    "mipmap-mdpi"    = @{ Canvas = 108; Draw = 74 }
    "mipmap-hdpi"    = @{ Canvas = 162; Draw = 110 }
    "mipmap-xhdpi"   = @{ Canvas = 216; Draw = 148 }
    "mipmap-xxhdpi"  = @{ Canvas = 324; Draw = 222 }
    "mipmap-xxxhdpi" = @{ Canvas = 432; Draw = 296 }
}

foreach ($folder in $foregroundSizes.Keys) {
    $cSize = $foregroundSizes[$folder].Canvas
    $dSize = $foregroundSizes[$folder].Draw
    $fgPath = Join-Path $resDir "$folder\ic_launcher_foreground.png"
    
    Save-ResizedImage -Image $sourceImage -CanvasWidth $cSize -CanvasHeight $cSize -DrawWidth $dSize -DrawHeight $dSize -DestPath $fgPath
}

# 3. Splash Screen Icons
$splashBg = [System.Drawing.ColorTranslator]::FromHtml("#030504")
$splashTargets = @(
    @{ Path = "drawable\splash.png"; W = 480; H = 800; Draw = 200 }
    @{ Path = "drawable-port-mdpi\splash.png"; W = 320; H = 480; Draw = 160 }
    @{ Path = "drawable-port-hdpi\splash.png"; W = 480; H = 800; Draw = 220 }
    @{ Path = "drawable-port-xhdpi\splash.png"; W = 720; H = 1280; Draw = 320 }
    @{ Path = "drawable-port-xxhdpi\splash.png"; W = 960; H = 1600; Draw = 420 }
    @{ Path = "drawable-port-xxxhdpi\splash.png"; W = 1280; H = 1920; Draw = 520 }
    @{ Path = "drawable-land-mdpi\splash.png"; W = 480; H = 320; Draw = 160 }
    @{ Path = "drawable-land-hdpi\splash.png"; W = 800; H = 480; Draw = 220 }
    @{ Path = "drawable-land-xhdpi\splash.png"; W = 1280; H = 720; Draw = 320 }
    @{ Path = "drawable-land-xxhdpi\splash.png"; W = 1600; H = 960; Draw = 420 }
    @{ Path = "drawable-land-xxxhdpi\splash.png"; W = 1920; H = 1280; Draw = 520 }
)

foreach ($splash in $splashTargets) {
    $dest = Join-Path $resDir $splash.Path
    Save-ResizedImage -Image $sourceImage -CanvasWidth $splash.W -CanvasHeight $splash.H -DrawWidth $splash.Draw -DrawHeight $splash.Draw -DestPath $dest -BackgroundColor $splashBg
}

$sourceImage.Dispose()
Write-Host "`n[SUCCESS] Semua icon launcher dan splash screen Android telah diperbarui menggunakan logo resmi angkatan!" -ForegroundColor Cyan
