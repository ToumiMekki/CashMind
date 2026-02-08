# CashMind APK Build Script for PowerShell
# Run these commands one by one in PowerShell

# Step 1: Navigate to the mobile directory
cd c:\dev\cash_simulation\mobile

# Step 2: Clean previous builds (optional but recommended)
cd android
.\gradlew.bat clean

# Step 3: Build the release APK
.\gradlew.bat assembleRelease -x lint -x lintVitalRelease

# Step 4: After build completes, check if APK was created
# The APK will be located at:
# c:\dev\cash_simulation\mobile\android\app\build\outputs\apk\release\app-release.apk

# Step 5: Verify the APK exists
Test-Path "c:\dev\cash_simulation\mobile\android\app\build\outputs\apk\release\app-release.apk"

# Step 6: Get APK file info
Get-Item "c:\dev\cash_simulation\mobile\android\app\build\outputs\apk\release\app-release.apk" | Select-Object FullName, Length, LastWriteTime

# Alternative: If you want to copy the APK to an easier location
# Copy-Item "c:\dev\cash_simulation\mobile\android\app\build\outputs\apk\release\app-release.apk" -Destination "c:\dev\cash_simulation\CashMind-release.apk"
