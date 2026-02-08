# Manual Android install - workaround for "Failed to parse APK" on some devices
# Uses adb install --no-streaming to push full APK before parsing

$ErrorActionPreference = "Stop"
$apkPath = "$PSScriptRoot\..\android\app\build\outputs\apk\debug\app-debug.apk"

if (-not (Test-Path $apkPath)) {
    Write-Host "APK not found. Building first..."
    & "$PSScriptRoot\..\android\gradlew.bat" -p "$PSScriptRoot\..\android" app:assembleDebug
}

if (Test-Path $apkPath) {
    Write-Host "Installing with --no-streaming..."
    adb uninstall com.cashmind 2>$null
    adb install -r -t --no-streaming $apkPath
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Install successful. Start Metro with: npx react-native start"
    }
} else {
    Write-Host "APK not found at $apkPath"
    exit 1
}
