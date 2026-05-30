# Omniworx Factuur App

Mobile-first PWA invoicing and quotation app for **Omniworx** — a Dutch construction and renovation company. Large accessible UI, fully offline, Dutch/Arabic interface, and real-time sync between two phones via a shared workspace code.

---

## What it does

- Create and manage **invoices** (facturen) and **quotations** (offerten)
- Auto-fill service price, BTW rate, and unit from a built-in price list
- Generate **PDF** documents, automatically merged with the terms & conditions (algemene voorwaarden)
- **Share** PDFs directly via WhatsApp or any app (Web Share API), or download
- **Export** all invoices to Excel (one sheet per month + year summary)
- Convert accepted quotes directly into invoices in one tap
- Manage a **client address book**
- Full Dutch and Arabic interface (RTL for Arabic)
- Invoices and quotes can be printed in **Dutch, English, or Arabic** per document
- Works completely **offline** — all data stored on the device
- **Sync in real time** between two phones (e.g. iPhone + Samsung) using a shared workspace code

---

## How sync works — APK phone ↔ iPhone (or any two devices)

All data is stored locally on the device by default. When you create a workspace and share the 9-character code, both devices see the same invoices, quotes, and clients in real time.

### Step 1 — Create the workspace on one phone

1. Open the app → tap **Instellingen** (the gear icon in the bottom navigation)
2. Scroll to **Sync & samenwerking**
3. Tap **Maak werkruimte aan** (Create workspace)
4. The app generates a code like `OWX-A3K9Z2` and uploads all existing data to the cloud
5. Tap **Kopieer code** and send it to the other phone via WhatsApp

### Step 2 — Join on the second phone

1. Open the app on the second phone → **Instellingen** → **Sync & samenwerking**
2. Tap **Deelnemen** (Join)
3. Enter the code received from step 1 (e.g. `OWX-A3K9Z2`) → tap **Verbinden**
4. Both phones now share the same data and sync within seconds of any change

### After connecting

- Any invoice or quote created on one phone appears on the other almost instantly
- Works offline too: changes are saved locally first and synced when internet returns
- To disconnect: tap **Verbreken** in Settings — your local data stays on the device

---

## Install on Android / Samsung — APK

The app builds as a real Android APK via GitHub Actions. Every push to the main branch triggers a build automatically.

### Download the APK

1. Go to the GitHub repository → **Actions** tab
2. Click the latest **Build Android APK** run
3. Scroll to **Artifacts** at the bottom → download **omniworx-factuur-debug**
4. Unzip — you get `app-debug.apk`

### Install on the Samsung phone

1. Transfer `app-debug.apk` to the phone (WhatsApp to yourself, Google Drive, USB cable — any method)
2. Open the APK file on the phone
3. If Android asks: **Instellingen → Onbekende apps → toestaan** (allow installing from this source)
4. Tap **Installeren** — done

The app appears on the home screen as **Omniworx Factuur** with the full icon.

### Update the app

When the code changes and a new APK is built: download the new APK, install it over the old one — your data is preserved.

### iPhone — PWA via Safari (no cost)

No App Store needed. On iPhone:

1. Open **Safari** → go to the app URL
2. Tap the **Share button** (box with arrow, bottom of Safari)
3. Tap **Zet op beginscherm** → **Toevoegen**
4. The app icon appears on the home screen and runs full-screen

This is a PWA, not a native app, but for this use case (invoicing, sharing PDFs) it works exactly the same.

---

## Pages and navigation

| Route | Page | What it does |
|---|---|---|
| `/` | Dashboard | Daily greeting, unpaid/overdue stats, last 5 invoices, quick-create buttons |
| `/facturen` | Factuurlijst | All invoices with filter tabs (alle / onbetaald / achterstallig / betaald), grouped by month |
| `/facturen/nieuw` | Nieuwe factuur | Create a new invoice |
| `/facturen/:id` | Factuurdetail | View invoice preview, share as PDF, mark paid/unpaid, edit, delete |
| `/facturen/:id/bewerken` | Factuur bewerken | Edit an existing invoice |
| `/offerten` | Offertenlijst | All quotes with filter tabs (alle / in behandeling / geaccepteerd / afgewezen) |
| `/offerten/nieuw` | Nieuwe offerte | Create a new quotation |
| `/offerten/:id` | Offertedetail | View quote, share PDF, accept/reject, convert to invoice |
| `/offerten/:id/bewerken` | Offerte bewerken | Edit a quotation |
| `/klanten` | Klanten | Client address book (add, edit, delete, search) |
| `/instellingen` | Instellingen | Language, PIN, due-day defaults, sync, company info |

---

## Invoice and quote form

- **Client** — pick from the address book or enter a name and address manually
- **Date** — defaults to today
- **Vervaldatum / Geldig tot** — defaults to today + 14 days (configurable per invoice, or change the default in Settings)
- **Documenttaal** — the language of the printed document: NL / EN / AR (independent of the UI language)
- **Regelitems** (line items) — add as many rows as needed, each with:
  - Service picker (27 pre-defined construction services)
  - Auto-fills the unit, price, and BTW rate from the price list on selection — all editable afterwards
  - Quantity + unit (uur / m² / m / m³ / stuk / dag)
  - Unit price (€)
  - Market price hint under the price field: e.g. *Marktprijs: €22 – €45 / m²*
  - BTW rate selector: 0% / 9% / 21%
  - Contextual BTW-9% warnings (see below)
  - Live line total per row
- **Totaaloverzicht** — subtotaal, BTW per rate, grand total
- **Opmerkingen** — free-text notes field

---

## Services and prices

| Service | BTW | Eenheid | Standaardprijs | Marktbereik |
|---|---|---|---|---|
| Renovatie | 21% | uur | €65 | €50 – €95 |
| Schilderwerk | 9% | m² | €28 | €18 – €45 |
| Stukadoorwerk | 9% | m² | €32 | €22 – €55 |
| Laminaat / Parket | 21% | m² | €14 | €10 – €25 |
| Tegelzetten | 21% | m² | €40 | €30 – €65 |
| Loodgieterwerk | 21% | uur | €75 | €60 – €110 |
| Elektra | 21% | uur | €80 | €65 – €115 |
| Behangen | 9% | m² | €18 | €12 – €32 |
| Isoleren | 9% | m² | €22 | €15 – €40 |
| Metselwerk | 21% | m² | €55 | €40 – €85 |
| Dakwerk | 21% | m² | €85 | €60 – €130 |
| Kozijnen | 21% | stuk | €350 | €250 – €600 |
| CV-installatie | 21% | stuk | €1200 | €900 – €2000 |
| Ventilatie | 21% | stuk | €450 | €300 – €750 |
| Schoonmaakwerk | 9% | uur | €25 | €20 – €35 |
| Sloopwerk | 21% | m² | €30 | €20 – €50 |
| Timmerwerk | 21% | uur | €60 | €45 – €90 |
| Tuinonderhoud | 21% | uur | €45 | €35 – €65 |
| Bouwvoorbereiding | 21% | dag | €400 | €280 – €600 |
| Fundering | 21% | m² | €120 | €80 – €200 |
| Raamwerk | 21% | m² | €65 | €45 – €100 |
| Zonnepanelen | 0% | stuk | €800 | €600 – €1200 |
| Overig (vrije tekst) | 21% | uur | — | — |

All prices and BTW rates are editable. The price list auto-fills the most common value as a starting point.

### BTW-9% warnings

The app shows a yellow warning when 9% is selected for services that have conditions under Dutch tax law (Tabel I, post b-7 Wet OB 1968):

- **Schilderwerk, Stukadoorwerk, Behangen, Isoleren**: 9% is only valid for homes older than 2 years
- **Schoonmaakwerk**: 9% is only valid for cleaning private homes (no age requirement)

These reminders help avoid incorrect VAT rates without blocking the user.

---

## BTW rules (Dutch VAT)

| Category | Rate | Condition |
|---|---|---|
| Schilderen, stukadoren, behangen, isoleren, laminaat/parket/tapijt/PVC vloer leggen | 9% | Woning ouder dan 2 jaar |
| Schoonmaakwerk | 9% | Particuliere woning (geen leeftijdseis) |
| Zonnepanelen op of bij woning | 0% | — |
| Tegelzetten, metselwerk, dakdekken, kozijnen, CV, ventilatie, overige bouw | 21% | — |

**Let op:** Tegelzetten valt niet onder de 9%-regeling — zelfs niet in oudere woningen.

---

## Invoice and quote numbering

- Invoices: `2026-001`, `2026-002`, … — resets to `001` at the start of each year
- Quotes: `OFF-2026-001`, `OFF-2026-002`, …
- Numbers are derived from the highest existing number — no separate counter stored. If you delete invoice `2026-003`, the next invoice gets `2026-003` again.

---

## PDF and sharing

When you tap **Delen** (Share) on an invoice or quote:

1. The HTML preview is converted to a high-resolution A4 PDF
2. The company's **algemene voorwaarden** (terms & conditions, `public/algemene-voorwaarden.pdf`) are automatically appended
3. The native share sheet opens — pick WhatsApp, email, save to Files, etc.
4. If the browser does not support native sharing (desktop), the PDF downloads automatically

PDF filename format: `Factuur-2026-001.pdf` / `Offerte-OFF-2026-001.pdf`

---

## Excel export

On the invoice list page, tap the Excel button (top right). The download contains:
- One sheet per month with all invoices and a totals row
- A **Samenvatting** (summary) sheet with monthly totals and a grand total for the year
- File name: `Omniworx-Facturen-2026.xlsx`

---

## PIN security

- On first launch you are prompted to set a 4-digit PIN
- The PIN is stored as a SHA-256 hash — the PIN itself is never saved
- Required every time the app is opened
- To change: Settings → **Wijzig PIN**
- To remove: Settings → **Verwijder PIN**
- If you forget the PIN: Settings → **PIN vergeten** — this clears all local data

---

## Languages

| Language | App UI | Invoice / Quote document |
|---|---|---|
| Nederlands | ✅ | ✅ |
| العربية (RTL) | ✅ | ✅ |
| English | ❌ (UI only in NL/AR) | ✅ |

The **UI language** (Dutch or Arabic) is set once in Settings and applies to all buttons, menus, and labels. The **document language** is set per invoice/quote, so you can have a Dutch app interface but send an English invoice to a foreign client.

When Arabic is selected, the entire app layout switches to right-to-left (`dir="rtl"` on `<html>`).

---

## Data storage

All data lives locally in `localStorage`:

| Key | Contents |
|---|---|
| `omniworx_invoices` | All invoices |
| `omniworx_quotes` | All quotes |
| `omniworx_clients` | Client address book |
| `omniworx_settings` | Language, PIN hash, due-day defaults |
| `omniworx_workspace_id` | Active workspace code (empty if not connected) |

When a workspace is active, data is also stored in **Firebase Firestore** under:

```
/workspaces/{workspaceId}/invoices/{id}
/workspaces/{workspaceId}/quotes/{id}
/workspaces/{workspaceId}/clients/{id}
```

Firestore uses IndexedDB-based offline persistence, so synced data is available offline on both phones.

---

## Company information (in every invoice)

```
Omniworx
Isidoor Opsomerstraat 7
5702VD Helmond
KVK: 85285064
BTW-ID: NL004083540B58
IBAN: NL40INGB0675253160
```

To change these details: edit `src/components/InvoicePreview/InvoicePreview.jsx` and `src/components/QuotePreview/QuotePreview.jsx`.

---

## Tech stack

| Purpose | Library |
|---|---|
| Framework | React 19 + Vite 8 |
| Routing | react-router-dom v7 |
| Styling | Tailwind CSS 3 |
| Translations | react-i18next + i18next |
| PDF generation | html2pdf.js + pdf-lib |
| Excel export | xlsx |
| Cloud sync | Firebase Firestore v12 |
| PWA / service worker | vite-plugin-pwa + Workbox |
| Native Android wrapper | Capacitor 8 |

---

## Development

```bash
# Install dependencies
npm install

# Start dev server with hot reload
npm run dev          # → http://localhost:5173

# Production build
npm run build

# Preview the production build
npm run preview

# Lint
npm run lint
```

### Android (Capacitor)

```bash
# Build web assets + open Android Studio
npm run android:studio

# Build web assets + sync only (no Android Studio)
npm run android:sync

# Build web + export APK
npm run android:build

# Open existing android/ project in Android Studio (no rebuild)
npm run android:open
```

Requires Android Studio and the Android SDK. On first run, Gradle downloads dependencies — this can take a few minutes.

---

## Firebase / Firestore

The Firebase project is `omniworxdb`. Config is in `src/firebase.js`. The workspace code acts as the shared secret — anyone with the code can read and write that workspace's data.

Firestore security rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /workspaces/{workspaceId}/{document=**} {
      allow read, write: if true;
    }
  }
}
```

To update rules: Firebase Console → Firestore → Rules.

---

## Project structure

```
src/
  components/
    InvoiceForm/         InvoiceForm.jsx, LineItemRow.jsx
    InvoicePreview/      InvoicePreview.jsx (HTML → PDF)
    QuotePreview/        QuotePreview.jsx
    layout/              BottomNav.jsx, PageHeader.jsx
    UI/                  BigButton, BigInput, BigSelect, PinLock,
                         StatusBadge, ConfirmDialog, EmptyState, Toast
  contexts/
    WorkspaceContext.jsx  Provides workspaceId across the app
  pages/
    Dashboard, InvoiceList, NewInvoice, InvoiceDetail, EditInvoice
    Quotes, NewQuote, QuoteDetail, EditQuote
    Clients, Settings
  hooks/
    useSyncedCollection  Core dual-mode hook: localStorage ↔ Firestore
    useInvoices          CRUD + auto-numbering + overdue detection
    useQuotes            CRUD + auto-expiry + status transitions
    useClients           CRUD
    useWorkspace         Create/join/leave workspace, sync status
    useSettings          Language, PIN hash, day defaults
    useLocalStorage      Generic localStorage hook
    useToast             Toast notification context
    useOnlineStatus      Online/offline event listener
  utils/
    btwCalc.js           Subtotal, BTW per rate, grand total
    invoiceNumber.js     YYYY-NNN auto-numbering
    quoteNumber.js       OFF-YYYY-NNN auto-numbering
    pdf.js               html2pdf.js wrapper + AV merge
    share.js             Web Share API with download fallback
    excelExport.js       xlsx multi-sheet export
    pinHash.js           SHA-256 via Web Crypto API
  constants/
    services.js          27 services with prices, units, BTW rates
  locales/
    nl.json              Dutch UI + invoice/quote labels
    ar.json              Arabic UI + invoice/quote labels (RTL)
    en.json              English invoice/quote labels only
  firebase.js            Firebase app + Firestore init
  i18n.js                i18next init (NL default, AR RTL)
  App.jsx                Router + PinLock + WorkspaceProvider
public/
  algemene-voorwaarden.pdf    Appended to every shared PDF
  icon-192.png / icon-512.png PWA icons
  logo-*.webp / logo-*.jpg    Company logos
```

---

## Accessibility

Designed for a tech-unfamiliar user on a large phone:

- All interactive elements: minimum 56 px height
- Base font size 18 px (`text-lg` minimum throughout)
- Arabic UI: full RTL layout via `dir="rtl"` on `<html>`
- Viewport allows pinch-zoom up to 5× (`maximum-scale=5`)
- WCAG AA colour contrast on all text and badges
- Bottom navigation shows icon + text label (never icon alone)

---

## Verification (last run: 2026-05-30)

All 11 automated checks pass against the live dev server:

| Check | Result |
|---|---|
| PIN lock screen on first load | ✅ |
| Dashboard loads after unlock | ✅ |
| `/facturen/nieuw` shows invoice form, not invoice detail | ✅ |
| Service auto-fill activates on selection | ✅ |
| New quote form loads | ✅ |
| Clients page loads | ✅ |
| Sync section visible in Settings | ✅ |
| Create / Join workspace buttons present | ✅ |
| BTW / Subtotaal / Totaal visible in invoice form | ✅ |
| Bad invoice ID handled gracefully without crash | ✅ |
| No JavaScript errors in console | ✅ |

Firebase connection errors in headless test environments are expected (no network access) and do not affect local-only operation.
