# Omniworx Factuur App

Mobile-first PWA invoicing app for Omniworx — a one-person Dutch construction & renovation company. Built for a tech-illiterate user on a Samsung Android phone: large tap targets, big text, offline-first, share invoices via WhatsApp.

---

## Features

- **Invoices** — Create, edit, mark paid/unpaid, delete with confirm guard
- **Quotes** — Create, accept, reject (with confirm), convert to invoice
- **Clients** — Full CRUD with searchable list
- **PDF generation** — Invoice rendered as styled HTML → PDF via html2pdf.js
- **WhatsApp sharing** — Web Share API; falls back to direct download
- **Excel export** — Export invoice list via xlsx
- **Multilingual UI** — Dutch & Arabic (RTL) with a toggle in Settings
- **Multilingual invoices** — Invoice documents in Dutch, English, or Arabic per invoice
- **BTW calculation** — Dutch VAT at 0%, 9%, or 21% per line item with per-rate breakdown
- **PIN lock** — SHA-256 hashed 4-digit PIN; "Forgot PIN" resets all data with warning
- **Offline / PWA** — Service worker caches app shell; installable on Android home screen
- **Offline indicator** — Banner shown when device has no internet connection
- **Auto invoice numbering** — `YYYY-NNN` format, resets each year
- **Input validation** — Required field errors, date order validation, confirm dialogs on destructive actions
- **Success toasts** — Feedback after every save, update, or delete action

---

## Tech Stack

| Purpose | Library |
|---|---|
| Framework | React 19 + Vite 8 |
| Styling | TailwindCSS 3 |
| Routing | react-router-dom v7 |
| Translations | react-i18next + i18next |
| PDF | html2pdf.js |
| Excel | xlsx |
| Sharing | Web Share API |
| Offline / PWA | vite-plugin-pwa + Workbox |
| Storage | localStorage (custom hooks) |
| Native wrapper | Capacitor (Android) |
| Tests | Playwright (headless Chromium) |

---

## Getting Started

```bash
npm install
npm run dev        # dev server on http://localhost:5173
npm run build      # production build
npm run preview    # preview production build
```

### Android (Capacitor)

```bash
npm run android:build   # build + sync + build APK
npm run android:open    # open in Android Studio
```

---

## Project Structure

```
src/
  components/
    InvoiceForm/     # InvoiceForm, LineItemRow
    InvoicePreview/  # Rendered invoice document (HTML → PDF)
    layout/          # BottomNav, PageHeader
    UI/              # BigButton, BigInput, BigSelect, PinLock,
                     # StatusBadge, ConfirmDialog, Toast, EmptyState
  pages/
    Dashboard        # Stats + recent invoices + quick actions
    InvoiceList      # Filterable invoice list
    NewInvoice       # Invoice creation form
    InvoiceDetail    # View + share + mark paid + edit + delete
    EditInvoice      # Edit existing invoice
    Quotes           # Filterable quote list
    NewQuote         # Quote creation form
    QuoteDetail      # View + accept + reject + convert + delete
    EditQuote        # Edit existing quote
    Clients          # CRUD client list
    Settings         # Language, PIN, defaults
  hooks/
    useInvoices      # CRUD + auto-numbering
    useQuotes        # CRUD + status transitions
    useClients       # CRUD
    useSettings      # Language, PIN hash, defaults
    useLocalStorage  # Generic localStorage hook with error events
    useToast         # Toast notification system
    useOnlineStatus  # Online/offline detection
  locales/
    nl.json          # Dutch UI + invoice labels
    ar.json          # Arabic UI + invoice labels
    en.json          # English invoice labels
  utils/
    btwCalc          # VAT calculation (subtotal, per-rate groups, grand total)
    invoiceNumber    # YYYY-NNN auto-numbering with year reset
    pinHash          # SHA-256 via Web Crypto API
    pdf              # html2pdf.js wrapper
    share            # Web Share API with download fallback
```

---

## Pre-defined Services

### Hoofddiensten

| NL | EN | AR | BTW |
|---|---|---|---|
| Renovatie | Renovation | أعمال التجديد | 21% |
| Schilderwerk | Painting | أعمال الدهانات | 9% |
| Stukadoorwerk | Plastering | أعمال الجبس والليّاسة | 9% |
| Laminaat / Parket leggen | Laminate / Parquet Flooring | تركيب الباركيه والألواح الخشبية | 9% |
| Tegelzetten | Tile Installation | تركيب البلاط والسيراميك | 21% |
| Loodgieterwerk | Plumbing Services | أعمال السباكة | 21% |
| Elektra | Electrical Work | أعمال الكهرباء | 21% |

### Overige diensten

| NL | EN | AR | BTW |
|---|---|---|---|
| Behangen | Wallpapering | تركيب ورق الجدران | 9% |
| Isolatiewerk | Insulation Work | أعمال العزل الحراري | 9% |
| Schoonmaakwerk | Cleaning Services | خدمات التنظيف | 9% |
| Sloopwerk | Demolition | أعمال الهدم | 21% |
| Timmerwerk | Carpentry | النجارة | 21% |
| Tuinonderhoud | Landscaping | تنسيق الحدائق | 21% |
| Bouwvoorbereiding | Site Preparation | تحضير الموقع | 21% |
| Fundering | Foundation Work | أعمال الأساسات | 21% |
| Raamwerk | Framing | الهيكل الإنشائي | 21% |
| Anders (vrije tekst) | Other (custom) | أخرى (نص حر) | 21% |

**BTW 9% rules** (Tabel I, post b-7 Wet OB 1968, Belastingdienst):
- Schilderen, stukadoren, behangen, isoleren en laminaat/parket leggen in woningen **ouder dan 2 jaar** → 9%
- Schoonmaakwerk in woningen → 9% (**geen leeftijdseis**)
- Tegelzetten valt niet onder het verlaagde tarief → 21%
- Als hoofdaannemer die werk uitbesteedt: splits werkzaamheden op 9%- en 21%-regels in offerte en factuur

---

## Accessibility

Designed for a tech-illiterate user on a large Android phone:

- All interactive elements: minimum 56px height
- Base font size: 18px (`text-lg` minimum throughout)
- Arabic UI: full RTL layout (`dir="rtl"` on `<html>`)
- Viewport allows zoom up to 5× (`maximum-scale=5`)
- WCAG AA colour contrast on all text

---

## Company Details (hardcoded in invoice)

| Field | Value |
|---|---|
| Name | Omniworx |
| Address | Isidoor Opsomerstraat 7, 5702VD Helmond |
| KVK | 85285064 |
| BTW-ID | NL004083540B58 |
| IBAN | NL40INGB0675253160 |

---

## Testing

End-to-end Playwright test suite covering all 12 feature areas (56 checks):

```bash
# Start dev server first
npm run dev &

# Run tests (requires Playwright Chromium)
node test-all.js
```

Covers: PIN setup / wrong PIN / forgot PIN, dashboard empty + data states, clients CRUD, invoice create/edit/pay/delete, invoice list filters, quote create/accept/convert/reject/delete, settings PIN change + Arabic RTL toggle.
