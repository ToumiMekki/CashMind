# CashMind Mobile

Production-ready React Native app that replicates the CashMind cash simulation wallet with offline-first SQLite, full UI/UX parity, and RTL support.

## Tech Stack

- **React Native** 0.74+
- **TypeScript** (strict)
- **React Navigation** v6 (native-stack + bottom-tabs)
- **Zustand** (state)
- **SQLite** (react-native-sqlite-storage)
- **react-native-reanimated** + **react-native-gesture-handler**
- **lucide-react-native** (icons)
- **i18n-js** (i18n)
- **@react-native-clipboard/clipboard**
- **react-native-share** (export)
- **react-native-safe-area-context**
- **react-native-linear-gradient**

## Setup

```bash
cd mobile
npm install
npx pod-install   # iOS only
```

## Run

```bash
npm run start
# In another terminal:
npm run ios
# or
npm run android
```

## Architecture

- **database/** – SQLite schema, init, migrations
- **repositories/** – settings, wallet, transactions
- **stores/** – Zustand (useAppStore)
- **screens/** – Onboarding, Wallet, Ledger, Statistics, Settings, overlays
- **components/** – UI (PressableScale, AppContainer), DailyChart
- **navigation/** – RootNavigator, MainTabs (overlays as full-screen replacement)
- **theme/** – colors, spacing, radius
- **i18n/** – ar, fr, en locales
- **utils/** – format, transactionId

## Database (SQLite)

- **settings** – id, language, hasOnboarded
- **wallet** – id, balance
- **transactions** – id, amount, type, timestamp, balanceBefore, balanceAfter, receiver, sender, category  
Indexes: timestamp, type.

## Flows

1. **Onboarding** – once; then main app.
2. **Main tabs** – Wallet, Ledger, Statistics, Settings.
3. **Overlays** (full-screen): Quick Payment, QR Scan, Receive Cash, Transaction Details. Triggered from store; same entry/exit behavior as web.

## RTL

- Language `ar` uses RTL; layout and chevrons flip. Font: Tajawal (optional; add to project for full parity).

## Export / Reset

- **Export**: JSON (transactions, balance, exportDate, version) via Share.
- **Reset**: confirmation modal; clears SQLite and store.
