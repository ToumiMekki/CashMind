# CashMind sound assets

Sounds are played via **expo-av** and loaded from this folder (Metro bundles them). Short (50–300ms), low-volume, financial-tone effects. Replace these placeholders with premium assets for production.

## Files

- `transaction_success.wav` — Pay/Receive confirmed (soft digital click)
- `transaction_error.wav` — Invalid amount, missing category, QR error (muted tick)
- `amount_tap.wav` — Optional keypad tap
- `category_selected.wav` — Category chosen (selection tick)
- `qr_scan_success.wav` — QR scanned and data loaded (subtle beep)
- `photo_attached.wav` — Receipt/invoice image attached (shutter lite)
- `analytics_loaded.wav` — Stats screen opened (soft data pulse)

## Regenerating placeholders

```bash
node mobile/scripts/createPlaceholderSound.js
```
