# CashMind App — Full Functionality & UI/UX Design Documentation

This document describes all functionality, screens, data flows, and the complete UI/UX design system of the **CashMind** app so you can replicate the same design elsewhere.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Data Model & State](#3-data-model--state)
4. [App Flow & Navigation](#4-app-flow--navigation)
5. [Screen-by-Screen Functionality](#5-screen-by-screen-functionality)
6. [UI/UX Design System](#6-uiux-design-system)
7. [Component Design Patterns](#7-component-design-patterns)
8. [Animations & Motion](#8-animations--motion)
9. [Accessibility & RTL](#9-accessibility--rtl)
10. [Design Replication Checklist](#10-design-replication-checklist)

---

## 1. Project Overview

**CashMind** is a **mobile-first cash simulation / digital wallet** prototype. It is **not a bank**; it simulates managing digital money with a “real cash” feel. Key principles:

- **Offline-first**: No internet required; all data is local.
- **Local storage**: Balance and transactions persist in `localStorage`.
- **Multi-language**: Arabic (ar), French (fr), English (en) with full RTL support for Arabic.
- **Currency**: Algerian Dinar (DZD) — displayed as دج (ar), DA (fr), DZD (en).

Original design: [Figma – CashMind App Design](https://www.figma.com/design/ixf0w6xgYFPTlL2vr7IUkr/CashMind-App-Design).

---

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 + TypeScript |
| Build | Vite 6 |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Animations | Motion (Framer Motion) |
| Charts | Recharts |
| Fonts | Inter (LTR), Tajawal (RTL/Arabic) |

---

## 3. Data Model & State

### 3.1 Core Types

```ts
type Language = 'ar' | 'fr' | 'en';

interface Transaction {
  id: string;           // e.g. "txn_1738166400000_abc12def"
  amount: number;
  type: 'send' | 'receive';
  timestamp: number;    // Unix ms
  balanceBefore: number;
  balanceAfter: number;
  receiver?: string;   // for send
  sender?: string;     // for receive
  category?: string;
}
```

### 3.2 App-Level State (in `App.tsx`)

| State | Type | Purpose |
|-------|------|---------|
| `hasOnboarded` | boolean | Show onboarding vs main app |
| `activeTab` | 'wallet' \| 'ledger' \| 'stats' \| 'settings' | Bottom nav selection |
| `language` | Language | UI language + locale for numbers/dates |
| `balance` | number | Current wallet balance |
| `transactions` | Transaction[] | Full transaction history (newest first) |
| `showPayment` | boolean | Quick Payment overlay visible |
| `showQRScan` | boolean | QR Scan overlay visible |
| `showReceive` | boolean | Receive Cash overlay visible |
| `selectedTransaction` | Transaction \| null | Transaction details sheet |

### 3.3 Persistence (localStorage)

| Key | Content |
|-----|---------|
| `cashmind_onboarded` | `"true"` when user completes onboarding |
| `cashmind_language` | `"ar"` \| `"fr"` \| `"en"` |
| `cashmind_balance` | string number |
| `cashmind_transactions` | JSON array of `Transaction` |

- **On load**: Read all four keys and hydrate state.
- **On change**: When `hasOnboarded` is true, persist `balance` and `transactions` whenever they change.

---

## 4. App Flow & Navigation

### 4.1 First-Time vs Returning User

1. **First time**: `hasOnboarded === false` → full-screen **Onboarding**.
2. **On “Get Started”**: Set `cashmind_onboarded = true`, set `hasOnboarded = true` → main app.

### 4.2 Main App Layout

- **Shell**: Max width **430px**, centered; background **#F8F6F3**; `dir` set from `language` (rtl for Arabic).
- **Content area**: Scrollable; renders one of: **Home (Wallet)**, **Ledger**, **Statistics**, **Settings** based on `activeTab`.
- **Bottom navigation**: Fixed bar with 4 items — Wallet, Ledger, Stats, Settings. Active tab uses **#2D5F4F** (and fill for Wallet icon).

### 4.3 Overlays (Full-Screen Replacements)

When one of these is true, the main shell is not rendered; the overlay is shown instead:

1. **Quick Payment** (`showPayment`) → Pay flow → on confirm: add send transaction, close.
2. **QR Scan** (`showQRScan`) → Scan flow → on confirm: add send transaction, close.
3. **Receive Cash** (`showReceive`) → Receive flow → on confirm: add receive transaction, close.
4. **Transaction Details** (`selectedTransaction !== null`) → Detail sheet → on close: set `selectedTransaction = null`.

So at any time the user sees **either** the main app **or** one of these four overlays.

---

## 5. Screen-by-Screen Functionality

### 5.1 Onboarding (`Onboarding.tsx`)

**Purpose**: Introduce the app and set expectations (not a bank, local, private).

**Layout**:
- Full-screen gradient: **#2D5F4F** → **#1E4538** (top to bottom).
- Centered content; padding; RTL/LTR from `language`.

**Content**:
- **Logo**: 80×80 container, **#D4AF37** background, rounded-3xl, 💰 emoji.
- **Title**: “CashMind” (4xl, white, bold).
- **Subtitle**: One line (e.g. “Your personal digital wallet”) in **#B8D4C8**.
- **Features**: 3 rows, each:
  - Icon in 48×48 circle, **#D4AF37** bg, icon color **#2D5F4F** (Shield, Smartphone, Lock).
  - Text in white (e.g. “This is NOT a bank”, “Everything is offline & private”, “Simulate digital money with real cash”).
  - Row: `bg-white/10 backdrop-blur-sm rounded-2xl p-5`.
- **Privacy**: One line in a subtle box (white/5, border white/10): “No internet • No servers • No banks” in **#B8D4C8**.
- **CTA**: Full-width button: **#D4AF37** bg, **#2D5F4F** text, “Get Started” (or translated), rounded-2xl, bold, `active:scale-95`.

**Behavior**: On button click → `onComplete()` → app marks onboarded and shows main app.

---

### 5.2 Home / Wallet (`Home.tsx`)

**Purpose**: Show balance, today’s spending, quick actions (Pay, Scan QR, Receive), and recent transactions.

**Layout**: `min-h-full px-5 py-6 pb-20` on **#F8F6F3**.

**Header**:
- Left: “CashMind” (2xl, bold, **#2D2D2D**).
- Right: Two pills:
  - “Offline” with WifiOff icon, **#2D5F4F**/10 bg, **#2D5F4F** text.
  - “Local” with Database icon, same style.

**Balance card** (motion.div):
- Gradient **#2D5F4F** → **#1E4538**, rounded-3xl, p-6, shadow-lg.
- Label “Balance” in **#B8D4C8**.
- Big number: balance, locale (ar-DZ / fr-DZ), white, 5xl, tabular-nums; small currency label in **#B8D4C8**.
- “Today’s Spending”: inner block white/10, backdrop-blur, rounded-xl; label **#B8D4C8**, value white; only **send** transactions from today.

**Quick actions** (grid 3 cols, gap-3):
- **Pay**: White card, rounded-2xl, icon circle **#2D5F4F**, Send icon white → opens Quick Payment.
- **Scan QR**: Icon circle **#D4AF37**, QrCode icon **#2D5F4F** → opens QR Scan.
- **Receive**: Icon circle **#2D5F4F**, Download icon white → opens Receive Cash.
- All: `active:scale-95`, shadow-sm.

**Recent transactions** (last 5):
- Section title: “Recent Transactions” (sm, medium, gray-500).
- If none: empty state — white card, centered, 💸 emoji, “No transactions yet” in gray-400.
- If any: list of cards (white, rounded-xl, p-4):
  - Left: Icon (Send=red, Download=green) in circle, then title (receiver/sender or “Sent”/“Received”) and time (locale time).
  - Right: amount with “-” or “+”, red/green, tabular-nums.
  - Staggered motion: `initial={{ x: -20, opacity: 0 }}`, `animate={{ x: 0, opacity: 1 }}`.

---

### 5.3 Quick Payment (`QuickPayment.tsx`)

**Purpose**: Enter amount and receiver, confirm → create **send** transaction.

**Flow**:
1. Form: available balance (in **#2D5F4F**/5 card), amount input, preset buttons (100, 500, 1000, 5000), receiver name.
2. If amount > balance → red error box “Insufficient balance”.
3. Confirm enabled only if: amount > 0, amount ≤ balance, receiver non-empty.
4. On Confirm → confirmation modal (amount + receiver) → user confirms → success full-screen (green **#2D5F4F**, checkmark, “Operation successful”) → after 1.5s `onConfirm(amount, receiver)` and overlay closes.

**Layout**:
- Container: max-w-[430px], **#F8F6F3**, full height.
- Header: white, border-b, title “Quick Payment”, X to close.
- Body: balance card, amount input (rounded-2xl, border-2, focus **#2D5F4F**), presets grid 4 cols, receiver input.
- Footer: sticky confirm button (full-width, **#2D5F4F** when valid, gray when disabled, rounded-2xl).

**Modals**:
- Confirm: overlay black/50, centered card white rounded-3xl; summary (amount, “To”, receiver); Cancel / Confirm.
- Success: full-screen **#2D5F4F**, big white circle with checkmark, title + “Operation recorded”.

---

### 5.4 QR Scan (`QRScan.tsx`)

**Purpose**: Simulate scanning a QR code to pay; on “scan” → show amount + receiver and confirm → create **send** transaction.

**Layout**:
- Full screen dark: **#1E1E1E**.
- Header: absolute, black/50 backdrop-blur, white title “Scan QR”, X to close.

**Scan area**:
- 256×256 frame with **#D4AF37** corner brackets (4 corners, 4px border).
- Animated scanning line (gold, horizontal, moving up-down) when not scanned.
- Center: either “tap to scan” button (simulate) or, after tap, gold circle with Check icon.
- Text: “Place code in frame” / “Code scanned” + “Simulation: Tap to scan”.

**After scan** (sheet from bottom):
- White rounded-t-3xl, drag handle (gray bar).
- Gray-50 card: amount (3xl **#2D5F4F**), receiver name.
- Cancel (gray-100) / Confirm (**#2D5F4F**).
- On confirm → success screen (same as Quick Payment) → `onConfirm(scanData.amount, scanData.receiver)`.

**Simulation**: Tap in frame sets `scanned = true` and uses fixed `scanData` (e.g. 500, “محمد علي”).

---

### 5.5 Receive Cash (`ReceiveCash.tsx`)

**Purpose**: Enter amount to receive → optionally “Generate QR” to show a receive QR screen → confirm → create **receive** transaction (sender “نقدي” or equivalent).

**Flow**:
1. Main view: “Today’s total” (green-50 card) for sum of today’s **receive** transactions; amount input; presets (100, 500, 1000, 5000); merchant-style icon (gradient **#2D5F4F** → **#1E4538**, 🏪).
2. Buttons: “Generate QR” (**#D4AF37**, **#2D5F4F** text) and “Confirm Receipt” (**#2D5F4F**).
3. If user taps “Generate QR”: same screen layout but center = “Show this code to sender” + mock QR (gradient box with amount + 💰 + currency). Then “Confirm Receipt” at bottom.
4. On confirm (from either view): success screen (**#2D5F4F**, checkmark) → `onConfirm(amount)` → overlay closes.

**Layout**: Same shell as Quick Payment (header, **#F8F6F3**, footer with buttons). RTL/LTR from `language`.

---

### 5.6 Ledger (`Ledger.tsx`)

**Purpose**: Immutable, chronological list of all transactions, grouped by date; tap → open Transaction Details.

**Layout**: **#F8F6F3**, px-5 py-6 pb-20.

**Header**: Title “Ledger” (or translated), subtitle “Immutable record” (or translated).

**Empty state**: White rounded-3xl, centered, 📋 emoji, “No transactions yet” + short description.

**List**:
- Group by date label: “Today”, “Yesterday”, or short date (e.g. “Jan 15”).
- Date row: label (sm, gray-500) + horizontal line.
- Each transaction: white card, rounded-2xl, p-4, shadow-sm, hover:shadow-md.
  - Left: Send/Receive icon (red/green circle), then:
    - Receiver/sender or “Sent”/“Received”.
    - Time (locale).
    - Balance before → after (small, with arrow).
  - Right: ±amount (red/green, bold), currency, ChevronRight (flipped for RTL).
  - Bottom: “ID:” + transaction `id` (mono, truncate).
- Staggered motion per card: `opacity` and `y` with delay by index.

**Behavior**: `onClick` → `onTransactionClick(tx)` → App sets `selectedTransaction = tx`.

---

### 5.7 Transaction Details (`TransactionDetails.tsx`)

**Purpose**: Show full details of one transaction in a bottom sheet; copy transaction ID.

**Layout**:
- Backdrop: full screen, black/50, click to close.
- Sheet: white, rounded-t-3xl, max-h-[90vh], overflow-auto; spring animate from bottom.

**Header**: Sticky, “Transaction Details” (or translated), X.

**Content**:
- **Amount card**: Gradient red (send) or green (receive), rounded-3xl, icon in white/20 circle, type label, big ±amount, currency.
- **Details** (gray-50 blocks, rounded-2xl, p-4):
  - Type: Sent / Received.
  - To (receiver) or From (sender) if present.
  - Date (long format) and Time (with seconds).
  - Balance before / Balance after (primary green card tint **#2D5F4F**/5, border **#2D5F4F**/20).
  - Transaction ID with “Copy” button (copied state shows checkmark + “Copied” for 2s).
- **Close**: Full-width **#2D5F4F** button, “Close”.

**Behavior**: Copy uses `navigator.clipboard.writeText(transaction.id)`. Close → `onClose()` → `selectedTransaction = null`.

---

### 5.8 Statistics (`Statistics.tsx`)

**Purpose**: Current balance, total spent/received, daily spending chart (last 7 days), and extra stats.

**Layout**: **#F8F6F3**, px-5 py-6 pb-20.

**Empty state**: If no transactions, title “Statistics” + one card: 📊, “No data yet”, “Start using CashMind to see your stats”.

**When there is data**:
- **Current balance**: Same gradient card as Home (**#2D5F4F** → **#1E4538**), “Current Balance”, big number + currency.
- **Two cards** (grid 2 cols):
  - Total spent: red icon, “Total Spent”, red bold amount, count of send transactions.
  - Total received: green icon, “Total Received”, green bold amount, count of receive transactions.
- **Daily spending** (white card, rounded-3xl):
  - Title “Daily Spending”, “Last 7 days” with calendar icon, “Daily average: X DZD”.
  - Recharts BarChart: last 7 days, one bar per day; bar color **#EF4444** if above average else **#2D5F4F**; rounded top; axis style (no axis line, gray ticks).
- **Two more cards**:
  - Largest transaction (gold tint **#D4AF37**/10, border **#D4AF37**/30).
  - Total transaction count (green tint **#2D5F4F**/10, border **#2D5F4F**/30).

---

### 5.9 Settings (`Settings.tsx`)

**Purpose**: Language switcher, export data, reset data, privacy info, app version.

**Layout**: **#F8F6F3**, px-5 py-6 pb-20.

**Sections**:
1. **Language**: Globe icon + “Language”. White card, 3 buttons (ar/fr/en); active **#2D5F4F** bg + white text, others gray.
2. **Data**:
   - “Export Data”: white row, Download icon **#2D5F4F**/10 circle → download JSON (transactions + exportDate + version). Toast “Exported successfully” (green pill, bottom, 2s).
   - “Reset Data”: red icon, red text → opens confirm modal.
3. **Privacy & Security**: Gradient card (**#2D5F4F** → **#1E4538**), 3 rows:
   - Offline mode (WifiOff), “Everything works without internet”.
   - Local storage (Database), “Data saved only on your phone”.
   - No servers (Shield), “No data is sent anywhere”.
   - Rows: white/20 circle icon, white title, **#B8D4C8** description.
4. **App info**: White card, 💰 in **#D4AF37** square, “CashMind”, “Version 1.0.0”.

**Reset modal**: Overlay black/50, white rounded-3xl, AlertTriangle in red-50 circle, title “Reset all data?”, warning text, Cancel (gray-100) / Confirm (red-500). On confirm → `onResetData()` (clear balance + transactions + localStorage keys) and close modal.

---

## 6. UI/UX Design System

### 6.1 Color Palette

Use these exact values to match the design.

| Role | Hex | Usage |
|------|-----|--------|
| **Primary** | `#2D5F4F` | Main brand, buttons, active nav, links, key accents |
| **Primary dark** | `#1E4538` | Gradient end, dark accent |
| **Primary tint** | `#B8D4C8` | Labels on dark cards, secondary text on green |
| **Accent / Gold** | `#D4AF37` | QR, Scan, accent buttons, highlights |
| **Background** | `#F8F6F3` | Page background (warm off-white) |
| **Surface** | `#FFFFFF` | Cards, inputs, headers |
| **Text primary** | `#2D2D2D` | Headings, body |
| **Text secondary** | `gray-500`, `gray-600` | Labels, hints |
| **Text muted** | `gray-400` | Timestamps, empty states |
| **Send / Out** | `red-50`, `red-500`, `red-600` | Sent transactions, errors |
| **Receive / In** | `green-50`, `green-500`, `green-600` | Received transactions, success |
| **Dark overlay** | `#1E1E1E` | QR scanner full screen |
| **Overlay** | `black/50` (`rgba(0,0,0,0.5)`) | Modals, sheets |

**CSS variables** (from globals):

- `--background: #F8F6F3`
- `--foreground: #2D2D2D`
- `--primary: #2D5F4F`
- `--accent: #D4AF37`
- `--card: #ffffff`

### 6.2 Typography

- **Fonts**:
  - LTR: **Inter** (400, 500, 600, 700).
  - RTL (Arabic): **Tajawal** (400, 500, 700).
- **Scale**: Use Tailwind text sizes: xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl.
- **Weights**: normal (400), medium (500), bold (700).
- **Numbers**: Always use `tabular-nums` (and optionally `font-feature-settings: 'tnum'`) for amounts and IDs.
- **Locale**: Format numbers/dates with `ar-DZ` or `fr-DZ` based on `language`.

### 6.3 Spacing & Sizing

- **Container**: `max-w-[430px]` for mobile frame; center with `mx-auto`.
- **Page padding**: `px-5 py-6`, bottom `pb-20` to clear nav.
- **Card padding**: p-4, p-5, or p-6 depending on density.
- **Gaps**: gap-1, gap-2, gap-3, gap-4, gap-6; space-y-2, space-y-4, space-y-6 for stacks.
- **Bottom nav**: `safe-area-bottom` (e.g. `padding-bottom: max(0.75rem, env(safe-area-inset-bottom))`).

### 6.4 Border Radius

- **Small**: rounded-lg (~10px).
- **Medium**: rounded-xl, rounded-2xl (16px–1rem).
- **Large**: rounded-3xl (1.5rem) for main cards and modals.
- **Pills**: rounded-full for badges and icon circles.

### 6.5 Shadows

- **Card**: `shadow-sm`.
- **Elevated**: `shadow-md` on hover.
- **Modal / emphasis**: `shadow-lg`, `shadow-xl`.

### 6.6 Gradients

- **Primary**: `from-[#2D5F4F] to-[#1E4538]` (bottom-right).
- **Onboarding**: same colors, direction `to bottom`.
- **Transaction type**: send `from-red-500 to-red-600`, receive `from-green-500 to-green-600`.

### 6.7 Buttons

- **Primary**: bg **#2D5F4F**, white text, rounded-2xl, bold, py-4; `active:scale-95`.
- **Accent**: bg **#D4AF37**, text **#2D5F4F**, same radius and padding.
- **Secondary**: bg gray-100, text gray-600, same radius.
- **Destructive**: bg red-500, white text.
- **Disabled**: bg gray-200, text gray-400, cursor-not-allowed.

### 6.8 Inputs

- **Style**: bg white, border-2 gray-200, rounded-2xl, px-4 py-3 or py-4; focus border **#2D5F4F**, outline none.
- **Currency**: Small label or suffix (دج / DA / DZD) in gray-400; position respects RTL (e.g. left/right swap for Arabic).
- **Number**: No spinners (hide via CSS).

### 6.9 Cards

- **Default**: White bg, rounded-2xl or rounded-3xl, shadow-sm, padding 4–6.
- **On dark**: white/10 or white/20, backdrop-blur-sm.
- **Tinted**: e.g. **#2D5F4F**/5 or **#D4AF37**/10 with matching border for highlights.

---

## 7. Component Design Patterns

- **Headers**: White strip, border-b gray-200, title (xl bold **#2D2D2D**), trailing X (gray, hover bg gray-100, rounded-full).
- **Section titles**: text-sm font-medium gray-500, mb-2 or mb-3.
- **Empty states**: Centered card, large emoji or icon in gray-100 circle, title (lg bold), short description (sm gray-400).
- **Lists**: White cards per item, rounded-2xl, p-4; optional ChevronRight (flip for RTL).
- **Modals**: Overlay black/50, centered or bottom sheet; content white, rounded-3xl; two actions often in grid cols-2 (Cancel left, Confirm right).
- **Success screens**: Full-screen **#2D5F4F**, big white circle with checkmark (Motion scale-in), white title, **#B8D4C8** subtitle.
- **Toasts**: Fixed bottom above nav, pill (e.g. rounded-full), **#2D5F4F** bg, white text, icon + message; auto-dismiss ~2s.

---

## 8. Animations & Motion

- **Library**: Motion (Framer Motion).
- **Page/block enter**: `initial={{ opacity: 0, y: 20 }}` (or scale 0.95), `animate={{ opacity: 1, y: 0 }}`.
- **Balance**: `key={balance}` so number change can animate (e.g. scale 1.1 → 1).
- **Lists**: Stagger children with `transition={{ delay: index * 0.05 }}`.
- **Sheets**: `initial={{ y: '100%' }}`, `animate={{ y: 0 }}`, `transition={{ type: 'spring', damping: 30 }}`.
- **Modals**: Backdrop fade; content scale 0.9 → 1; exit reverse.
- **Success checkmark**: `initial={{ scale: 0 }}`, `animate={{ scale: 1 }}`, `transition={{ type: 'spring', duration: 0.5 }}`.
- **QR scan**: Scanning line `animate={{ y: [0, 240, 0] }}`, repeat; frame subtle scale pulse when not scanned.
- **Buttons**: `active:scale-95` for tap feedback.
- **Exit**: Use `AnimatePresence` and `exit` for overlays and toasts.

---

## 9. Accessibility & RTL

- **Direction**: Root or main container gets `dir={language === 'ar' ? 'rtl' : 'ltr'}` so layout and text flip.
- **Chevrons**: For RTL, apply `rotate-180` to ChevronRight so it points correctly.
- **Inputs**: Currency and labels positioned with logical (start/end) or explicit left/right swap for Arabic.
- **Fonts**: Tajawal for RTL for better Arabic rendering.
- **Locale**: All `toLocaleString`, `toLocaleDateString`, `toLocaleTimeString` use `ar-DZ` or `fr-DZ` from `language`.
- **Touch**: Buttons and cards have sufficient padding and `active` states; safe-area for notched devices.

---

## 10. Design Replication Checklist

To replicate this design in another app or platform:

1. **Colors**: Implement the palette (primary **#2D5F4F**, accent **#D4AF37**, background **#F8F6F3**, surfaces white, red/green for send/receive).
2. **Typography**: Inter + Tajawal; tabular numbers for money; use correct locale for numbers and dates.
3. **Layout**: 430px max width, centered; bottom nav with safe-area; content padding and pb for nav.
4. **Cards**: White, rounded-2xl/3xl, shadow-sm; same padding and gap patterns.
5. **Gradients**: Use the same primary and transaction-type gradients.
6. **Buttons**: Same primary/accent/secondary/destructive styles and active scale.
7. **Inputs**: Rounded-2xl, border-2, focus primary; no number spinners; RTL-aware currency placement.
8. **Overlays**: Same modal/sheet behavior and success full-screen (green + checkmark).
9. **Motion**: Enter/exit, stagger lists, sheet spring, success scale; AnimatePresence where needed.
10. **RTL**: dir, font, chevrons, and any start/end positioning for Arabic.
11. **Copy**: Transaction ID copy and “Copied” feedback.
12. **Persistence**: Same localStorage keys and JSON shape if you need parity.

This document plus the codebase (and optional Figma link) are enough to rebuild or port the CashMind functionality and UI/UX design elsewhere while keeping the same look and behavior.
