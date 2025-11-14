# Audio Generation Environment Setup Wizard
# Encoding: UTF-8

Write-Host "Audio Generation Environment Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
$envFile = ".env"
$envExists = Test-Path $envFile

if ($envExists) {
    Write-Host "WARNING: .env file already exists" -ForegroundColor Yellow
    $append = Read-Host "Do you want to append configuration? (y/n)"
    if ($append -ne "y") {
        Write-Host "Cancelled" -ForegroundColor Red
        exit
    }
    Add-Content -Path $envFile -Value "`n# Audio Configuration ($(Get-Date))"
}
else {
    Write-Host "Creating new .env file" -ForegroundColor Green
    New-Item -Path $envFile -ItemType File | Out-Null
}

# Get AccessKey ID
Write-Host ""
Write-Host "Step 1: Enter Aliyun AccessKey ID:" -ForegroundColor Yellow
Write-Host "   (Get it from: https://ram.console.aliyun.com/manage/ak)" -ForegroundColor Gray
$accessKeyId = Read-Host "   AccessKey ID"

# Get AccessKey Secret
Write-Host ""
Write-Host "Step 2: Enter Aliyun AccessKey Secret:" -ForegroundColor Yellow
$accessKeySecret = Read-Host "   AccessKey Secret" -AsSecureString
$accessKeySecretPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($accessKeySecret)
)

# Get AppKey
Write-Host ""
Write-Host "Step 3: Enter TTS AppKey:" -ForegroundColor Yellow
Write-Host "   (Get it from: https://nls-portal.console.aliyun.com/)" -ForegroundColor Gray
$appKey = Read-Host "   AppKey"

# Write configuration
$config = @"

# Aliyun Credentials
ALIYUN_ACCESS_KEY_ID=$accessKeyId
ALIYUN_ACCESS_KEY_SECRET=$accessKeySecretPlain

# Aliyun TTS AppKey
ALIYUN_TTS_APP_KEY=$appKey
"@

Add-Content -Path $envFile -Value $config

Write-Host ""
Write-Host "Configuration saved to .env file" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "   1. Run: npm run test-aliyun"
Write-Host "   2. Run: npm run add-audio-field"
Write-Host "   3. Run: npm run generate-audio 1"
Write-Host ""

# Ask if want to test immediately
$test = Read-Host "Run test now? (y/n)"
if ($test -eq "y") {
    Write-Host ""
    Write-Host "Testing configuration..." -ForegroundColor Cyan
    npm run test-aliyun
}

