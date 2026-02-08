# Biometric Login Setup

CashMind supports Face ID (iOS) and fingerprint/face (Android) for app lock.

## Android
Required permissions are already in `AndroidManifest.xml`:
- `USE_BIOMETRIC`
- `USE_FINGERPRINT`

## iOS
If you add an iOS target, add to your `Info.plist`:

```xml
<key>NSFaceIDUsageDescription</key>
<string>Use Face ID to quickly unlock CashMind</string>
```

Replace with your preferred Arabic/French text for the Algeria market if needed.

## Security Notes
- No biometric data is ever stored in the app
- PIN is stored as SHA-256 hash only
- Biometric unlock uses the device Keychain/Keystore (Secure Enclave on supported devices)
- App locks when sent to background (if PIN is enabled)
- Max 3 PIN failures before 30-second lockout
