# Android setup – add Gradle wrapper

The `android/` folder is set up, but the **Gradle wrapper** (scripts + JAR) is not in the repo. Add it once using one of the options below, then you can run `npm run android` as usual.

---

## Option 1: Copy from a new React Native project (recommended)

In a **new terminal** (not inside `mobile`):

```bash
cd C:\dev\cash_simulation
npx @react-native-community/cli init CashMindTemp --version 0.74.5 --skip-install
```

Wait until the project is fully created (can take a few minutes).

Then copy the wrapper into your app:

**Windows (PowerShell):**

```powershell
cd C:\dev\cash_simulation
Copy-Item -Path "CashMindTemp\android\gradlew" -Destination "mobile\android\gradlew"
Copy-Item -Path "CashMindTemp\android\gradlew.bat" -Destination "mobile\android\gradlew.bat"
Copy-Item -Path "CashMindTemp\android\gradle\wrapper\gradle-wrapper.jar" -Destination "mobile\android\gradle\wrapper\gradle-wrapper.jar"
```

**Or manually:** copy these from `CashMindTemp\android\` into `mobile\android\`:

- `gradlew`
- `gradlew.bat`
- `gradle\wrapper\gradle-wrapper.jar`

(Optional) Remove the temp project:

```bash
rmdir /s /q CashMindTemp
```

Then run your app:

```bash
cd C:\dev\cash_simulation\mobile
npm run android
```

---

## Option 2: Generate wrapper with Gradle

If you have **Gradle** installed (e.g. `gradle -version` works):

```bash
cd C:\dev\cash_simulation\mobile\android
gradle wrapper --gradle-version 8.7
```

Then from `mobile`:

```bash
cd C:\dev\cash_simulation\mobile
npm run android
```

---

## After setup

- Start Metro (if not already): `npm start`
- In another terminal: `npm run android`

You should see the CashMind app on your Android device or emulator.

---

## QR scanner (Vision Camera)

The **Scan QR** screen uses `react-native-vision-camera` for the camera. If you see *"Camera module not found"* or *"CameraModule of undefined"*:

1. Ensure `VisionCamera_enableCodeScanner=true` in `android/gradle.properties`.
2. Clean and rebuild:
   ```bash
   cd mobile/android
   ./gradlew clean
   # On Windows: gradlew.bat clean
   cd ..
   npm run android
   ```
3. If the native module is still not linked, the app falls back to **Simulate scan** so you can test the QR receive flow without the camera.

---

## react-native-gesture-handler patch (RN 0.74)

The app uses **patch-package** to fix a build error with `react-native-gesture-handler` on React Native 0.74: the library’s Android “paper” interfaces extend `ViewManagerWithGeneratedInterface`, which doesn’t exist in RN 0.74. The patch in `patches/react-native-gesture-handler+2.30.0.patch` changes those interfaces to extend `BaseViewManagerInterface` instead.

- The patch is applied automatically after `npm install` (via the `postinstall` script).
- If you upgrade `react-native-gesture-handler` to a different version, the patch may not apply; then either keep the version at `2.30.0` or re-apply the same fix and run `npx patch-package react-native-gesture-handler` to regenerate the patch.
