# WebP 批量转换脚本
# 用途: 将 PNG/JPG 图片批量转换为 WebP 格式
# 使用: .\convert-to-webp.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  图片 WebP 批量转换工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 cwebp 是否安装
try {
    $cwebpVersion = & cwebp -version 2>&1
    Write-Host "✓ 检测到 cwebp 工具" -ForegroundColor Green
} catch {
    Write-Host "✗ 未检测到 cwebp 工具" -ForegroundColor Red
    Write-Host ""
    Write-Host "请先安装 WebP 工具:" -ForegroundColor Yellow
    Write-Host "  Windows: choco install webp" -ForegroundColor Yellow
    Write-Host "  macOS:   brew install webp" -ForegroundColor Yellow
    Write-Host "  或访问: https://developers.google.com/speed/webp/download" -ForegroundColor Yellow
    exit 1
}

# 设置图片目录
$imagesDir = "$PSScriptRoot\miniprogram\assets\images"

if (-not (Test-Path $imagesDir)) {
    Write-Host "✗ 图片目录不存在: $imagesDir" -ForegroundColor Red
    exit 1
}

Write-Host "图片目录: $imagesDir" -ForegroundColor Cyan
Write-Host ""

# 统计信息
$totalFiles = 0
$convertedFiles = 0
$skippedFiles = 0
$errorFiles = 0
$totalOriginalSize = 0
$totalWebPSize = 0

# 转换 PNG 图片
Write-Host "开始转换 PNG 图片..." -ForegroundColor Yellow
$pngFiles = Get-ChildItem -Path $imagesDir -Filter *.png

foreach ($file in $pngFiles) {
    $totalFiles++
    $webpName = $file.BaseName + ".webp"
    $webpPath = Join-Path $imagesDir $webpName

    # 检查是否已存在 WebP 文件
    if (Test-Path $webpPath) {
        Write-Host "  ⊙ 跳过 (已存在): $($file.Name)" -ForegroundColor Gray
        $skippedFiles++
        continue
    }

    try {
        # 转换为 WebP (质量85%, 适合PNG)
        $result = & cwebp -q 85 -m 6 -alpha_q 100 $file.FullName -o $webpPath 2>&1

        if (Test-Path $webpPath) {
            $originalSize = $file.Length
            $webpSize = (Get-Item $webpPath).Length
            $savings = [math]::Round((1 - $webpSize / $originalSize) * 100, 1)

            $totalOriginalSize += $originalSize
            $totalWebPSize += $webpSize

            Write-Host "  ✓ $($file.Name) → $webpName" -ForegroundColor Green
            Write-Host "    $([math]::Round($originalSize/1KB, 1)) KB → $([math]::Round($webpSize/1KB, 1)) KB (节省 $savings%)" -ForegroundColor Green
            $convertedFiles++
        } else {
            Write-Host "  ✗ 转换失败: $($file.Name)" -ForegroundColor Red
            $errorFiles++
        }
    } catch {
        Write-Host "  ✗ 转换出错: $($file.Name) - $($_.Exception.Message)" -ForegroundColor Red
        $errorFiles++
    }
}

Write-Host ""

# 转换 JPG/JPEG 图片
Write-Host "开始转换 JPG/JPEG 图片..." -ForegroundColor Yellow
$jpgFiles = Get-ChildItem -Path $imagesDir -Filter *.jpg, *.jpeg

foreach ($file in $jpgFiles) {
    $totalFiles++
    $webpName = $file.BaseName + ".webp"
    $webpPath = Join-Path $imagesDir $webpName

    if (Test-Path $webpPath) {
        Write-Host "  ⊙ 跳过 (已存在): $($file.Name)" -ForegroundColor Gray
        $skippedFiles++
        continue
    }

    try {
        # 转换为 WebP (质量80%, 适合JPG)
        $result = & cwebp -q 80 -m 6 $file.FullName -o $webpPath 2>&1

        if (Test-Path $webpPath) {
            $originalSize = $file.Length
            $webpSize = (Get-Item $webpPath).Length
            $savings = [math]::Round((1 - $webpSize / $originalSize) * 100, 1)

            $totalOriginalSize += $originalSize
            $totalWebPSize += $webpSize

            Write-Host "  ✓ $($file.Name) → $webpName" -ForegroundColor Green
            Write-Host "    $([math]::Round($originalSize/1KB, 1)) KB → $([math]::Round($webpSize/1KB, 1)) KB (节省 $savings%)" -ForegroundColor Green
            $convertedFiles++
        } else {
            Write-Host "  ✗ 转换失败: $($file.Name)" -ForegroundColor Red
            $errorFiles++
        }
    } catch {
        Write-Host "  ✗ 转换出错: $($file.Name) - $($_.Exception.Message)" -ForegroundColor Red
        $errorFiles++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  转换完成" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "总文件数: $totalFiles" -ForegroundColor White
Write-Host "成功转换: $convertedFiles" -ForegroundColor Green
Write-Host "已存在跳过: $skippedFiles" -ForegroundColor Yellow
Write-Host "转换失败: $errorFiles" -ForegroundColor Red
Write-Host ""

if ($convertedFiles -gt 0) {
    $totalSavings = [math]::Round((1 - $totalWebPSize / $totalOriginalSize) * 100, 1)
    Write-Host "原始大小: $([math]::Round($totalOriginalSize/1KB, 1)) KB" -ForegroundColor White
    Write-Host "WebP大小: $([math]::Round($totalWebPSize/1KB, 1)) KB" -ForegroundColor Green
    Write-Host "节省空间: $([math]::Round(($totalOriginalSize - $totalWebPSize)/1KB, 1)) KB ($totalSavings%)" -ForegroundColor Green
}

Write-Host ""
Write-Host "提示: 原始图片已保留,可用于兼容性回退" -ForegroundColor Cyan
Write-Host "查看优化指南: IMAGE_OPTIMIZATION_GUIDE.md" -ForegroundColor Cyan
