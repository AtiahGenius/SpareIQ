# SpareIQ — Product Documentation

**Version 1.0 · Built by ResolveX**
*AI-powered Receipt Management, Point of Sale & Inventory Intelligence for Motorcycle Spare Parts Retailers*

---

## Table of Contents

1. [Overview](#1-overview)
2. [Who It's For](#2-who-its-for)
3. [Getting Started](#3-getting-started)
4. [User Roles & Permissions](#4-user-roles--permissions)
5. [Feature Guide](#5-feature-guide)
   - 5.1 Dashboard
   - 5.2 Receipts & OCR
   - 5.3 New Sale (POS)
   - 5.4 Inventory
   - 5.5 Suppliers
   - 5.6 Employees
   - 5.7 Reports
   - 5.8 AI Insights
   - 5.9 Audit Log
   - 5.10 Settings & Shop Profile
6. [Smart Search & Duplicate Detection](#6-smart-search--duplicate-detection)
7. [Keyboard Shortcuts](#7-keyboard-shortcuts)
8. [Session, Security & Data Handling](#8-session-security--data-handling)
9. [Technical Architecture](#9-technical-architecture)
10. [Known Limitations](#10-known-limitations)
11. [Roadmap](#11-roadmap)
12. [Data Model Reference](#12-data-model-reference)
13. [Support](#13-support)

---

## 1. Overview

SpareIQ digitizes the day-to-day paperwork of running a motorcycle spare parts shop. The core idea is simple:

> **Take a photo → Save → Everything else happens automatically.**

Instead of manually typing supplier receipts into a spreadsheet, a shop owner photographs the paper receipt. SpareIQ reads it, extracts the supplier, items, quantities and totals, matches those items against the shop's own inventory, and restocks automatically. On the sales side, SpareIQ doubles as a point-of-sale system: cashiers ring up sales, stock is deducted in real time, and the owner can see revenue, profit, and low-stock alerts the moment they open the app.

SpareIQ is built for **non-technical users** — large buttons, plain language, and a workflow that requires the fewest possible taps to get a receipt or a sale recorded.

---

## 2. Who It's For

| Role | Description |
|---|---|
| **Administrator (Shop Owner/Manager)** | Full access: inventory, pricing, receipts, suppliers, employees, reports, audit log, shop branding, and system settings. |
| **Sales User (Cashier)** | Restricted access: can only log in, search products, ring up sales, view *their own* sales history, and print/reprint their own receipts. Cannot see pricing controls, other employees' sales, or supplier/receipt data. |

---

## 3. Getting Started

1. Open `spareiq.html` in any modern browser (Chrome, Edge, Firefox, Safari).
2. You'll land on the **Sign In** screen. Every employee logs in with an **Employee ID** and **password** — there is no self-registration.
3. Demo accounts are pre-loaded so you can explore both roles immediately:

| Employee ID | Password | Role | Status |
|---|---|---|---|
| `EMP0001` | `admin123` | Administrator | Active |
| `EMP0002` | `cashier123` | Sales User | Active |
| `EMP0003` | `cashier123` | Sales User | **Disabled** (demonstrates a blocked login) |

4. On first login, each role sees a short **onboarding tour** (4–5 steps) pointing out where things live. It only appears once per role per session — replay it anytime from **Settings → Take a Tour**.
5. If the browser window is narrow (phone or a small preview pane), tap the **☰ menu icon** in the top-left to open the navigation drawer.

> Because this is a self-contained prototype with no server, **all data resets when the page is refreshed** (see [Section 10](#10-known-limitations)).

---

## 4. User Roles & Permissions

### Administrator can:
- Manage inventory (add manually, edit, delete, import CSV)
- Change cost and selling prices
- Upload and manage supplier receipts
- View all receipts, suppliers, and purchase history
- Create employee accounts, generate Employee IDs, reset passwords, enable/disable accounts
- View all sales — company-wide, by employee, daily/monthly
- View profit reports, stock reports, and the employee leaderboard
- View the full Audit Log
- Configure the Shop Profile (name, address, phone, logo) and app settings
- Run a (simulated) backup

### Sales User (Cashier) can only:
- Log in / log out
- Search products
- Ring up sales via the POS screen
- View **their own** sales for today/this week/this month
- Print or reprint **their own** receipts

Cashiers **cannot**: edit prices, add or delete inventory, view other employees' sales, access supplier/receipt data, set their own password/PIN, or reach any admin-only page (attempting to navigate there redirects back to the dashboard with a warning toast).

Every nav item, button, and settings panel that's role-restricted is tagged and enforced in the interface — a cashier simply never sees the controls they aren't permitted to use.

---

## 5. Feature Guide

### 5.1 Dashboard
The dashboard is role-aware and shows a different view for each role:

- **Administrator dashboard:** Revenue today/this month, profit today/this month, total purchases, inventory value, count of low-stock items, a monthly purchase-spending chart, a top-suppliers chart, a most-purchased-products chart, a low-stock alert table, a top-employees leaderboard preview, quick actions, and the 6 most recent receipts.
- **Cashier dashboard:** Today's sales total and transaction count, items sold today, this week's and this month's revenue generated, and a table of their own recent transactions with a reprint button.

### 5.2 Receipts & OCR
1. Go to **Upload Receipt**, then drag-and-drop or click to choose a photo (JPG/PNG). PDFs are flagged as unsupported for OCR in this prototype and the user is asked to upload a photo instead.
2. A processing pipeline animates through: *Enhancing image → Deskewing → Removing shadows → Increasing contrast → Running OCR → Extracting structured fields.*
3. The photo is passed to an on-device OCR engine (Tesseract.js), and the recognized text is parsed for supplier name, invoice number, date, and monetary amounts using pattern matching.
4. Any field the system isn't confident about is visually flagged (⚠ low confidence) and left open for the user to correct — nothing is ever silently guessed into a saved record without being editable first.
5. Each line item is **fuzzy-matched** against the inventory list (using a similarity/edit-distance comparison), so "Brake rod GN" typed loosely still matches the catalog item `0514000HS01L-01-001 — Brake Rod GN`.
6. Before saving, SpareIQ checks the **same supplier + same invoice number** against existing receipts and warns if it looks like a duplicate — the user can still save it anyway, flagged accordingly.
7. On save: the receipt (with its photo) is stored, and every matched inventory item automatically has its stock quantity increased and its cost price updated — no manual restocking step required.
8. Click any receipt to open the full viewer: original photo (click to zoom), extracted fields, line items, totals, print, export-to-PDF (demo), and delete (with confirmation + a 5-second undo).

### 5.3 New Sale (POS)
1. Search or browse the product grid (search matches name, code, barcode, category, or compatible model).
2. Click a product to add it to the cart. The selling price is locked — only quantity can be adjusted, and it's capped at available stock.
3. Checkout shows subtotal, editable discount/tax, grand total, payment method (Cash / Mobile Money / Bank / Mixed), amount paid, and balance.
4. Completing the sale: deducts stock automatically, records cost price vs. selling price for profit calculation, logs a stock movement entry, and opens a printable, branded sales receipt (with a barcode-style graphic and the shop's own name/logo if configured).
5. Every sale is attributed to the logged-in employee, feeding the leaderboard and profit reports.

### 5.4 Inventory
- Each item tracks: Product Code, Barcode, Name, Description, Category, Compatible Models, Unit, Cost Price, Selling Price, Current Stock, Minimum Stock, Status, and last-updated date.
- **Add Item** — a manual entry form for administrators to add a single product (feeds the same list used by CSV import, POS, and OCR matching).
- **Import CSV** — bulk-load a parts list; unmapped fields fall back to sensible defaults.
- Prices are editable inline; every price change is written to the Audit Log and raises a notification.
- Deleting an item asks for confirmation and offers a 5-second **Undo**.
- The table is **paginated** (8 rows/page) and **sortable** by clicking any column header.
- Rows below minimum stock are highlighted and feed the dashboard's Low Stock Alerts panel.

### 5.5 Suppliers
Each supplier card shows contact details, total amount spent, number of receipts, and number of distinct products purchased, with a shortcut to filter the Receipts view down to that supplier.

### 5.6 Employees *(Admin only)*
- **Leaderboard:** ranks employees by sales count, revenue, and profit generated.
- **Employee table:** Employee ID (auto-generated, e.g. `EMP0004`), name, role, branch, status, date created.
- **Add Employee:** creates a new account with an auto-generated ID and a temporary password.
- **Reset Password:** generates a new temporary password for any employee (cashiers cannot do this themselves — see [Section 8](#8-session-security--data-handling)).
- **Enable/Disable:** administrators can deactivate an account (a disabled account cannot log in); an admin cannot disable their own account.

### 5.7 Reports
Five report types, each exportable as CSV or printable/PDF (via the browser's print dialog) with the shop's branding as a letterhead:
- **Monthly Purchases** — total spend by month
- **Supplier Report** — receipt count and spend per supplier
- **Most Purchased Items** — ranked by quantity bought
- **Profit Report** — quantity sold, revenue, and profit per product from completed sales
- **Stock Report** — current stock vs. minimum stock, flagging LOW STOCK items

### 5.8 AI Insights
A chat-style assistant that answers plain-language questions about receipts and purchases by matching the question against your saved data — for example:
- *"How much did I spend at FU WAN?"*
- *"Show purchases over GHS 500"*
- *"When did I last buy Brake Rod GN?"*
- *"Which supplier sells batteries cheaper?"*

> This is a **rule-based query engine**, not a general-purpose LLM — it recognizes a set of question patterns and answers from the in-memory receipt data. See [Section 10](#10-known-limitations).

### 5.9 Audit Log *(Admin only)*
A running, timestamped record of every meaningful action: logins/logouts, sales completed or cancelled, receipts uploaded or deleted, prices changed, products added/deleted, inventory imported, employees created/disabled, passwords reset, shop profile updates, and backups. Sortable by time or user, and paginated (10 rows/page).

### 5.10 Settings & Shop Profile
- **Appearance:** light/dark mode toggle, available to both roles; replay the onboarding tour.
- **Shop Profile** *(Admin only)*: shop name, address, phone, and logo upload — this branding appears on every printed sales receipt and report.
- **Employee PIN/Password Policy** *(Admin only)*: sets/oversees the app-wide PIN and reinforces that individual employee credentials are assigned via the Employees page, not self-service.
- **Cloud Backup** *(Admin only)*: Google Drive connect button and a "Run Backup Now" simulation.
- **Daily Reminder** *(Admin only)*: toggle for a daily "upload today's receipts" nudge.
- **My Account** *(Cashier only)*: read-only view of the cashier's own Employee ID, name, role, and branch.

---

## 6. Smart Search & Duplicate Detection

The global search bar (top of every screen, admin view) matches receipts by supplier, invoice number, receipt number, date, amount, product name/code, or month name — press **Enter** to jump to filtered results in the Receipts view.

Duplicate detection compares **supplier + invoice number** at the point of saving a new receipt; a match surfaces an inline warning but does not block saving, since legitimate re-orders can share similar details.

---

## 7. Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `/` | Jump focus to the global search box (ignored while typing in a field) |
| `Esc` | Close whatever's open — a modal, the image lightbox, the confirm dialog, the onboarding tour, the notifications dropdown, or the mobile menu |

---

## 8. Session, Security & Data Handling

- **Login:** Employee ID + password, no self-registration. Disabled accounts are rejected with a clear message.
- **Session timeout:** after **3 minutes of inactivity**, the user is automatically logged out and returned to the sign-in screen (mouse movement, clicks, key presses, and touches all reset the timer). A countdown appears in the sidebar during the final 20 seconds.
- **Credential control:** cashiers cannot set or change their own password/PIN — only an administrator can assign or reset one, from the Employees page.
- **Confirm + Undo:** deleting a receipt or an inventory item requires confirmation via a styled dialog, and offers a 5-second **Undo** toast before the change is final.
- **Every sensitive action is logged** to the Audit Log with a timestamp and the responsible user.

---

## 9. Technical Architecture

SpareIQ ships today as a **single self-contained HTML file** — a front-end prototype that runs entirely in the browser with no server or install step. It uses:

| Concern | Technology |
|---|---|
| UI | Vanilla HTML/CSS/JavaScript |
| Charts | Chart.js |
| CSV import/export | PapaParse |
| On-device OCR | Tesseract.js |
| Fonts | Space Grotesk (display), Inter (body), JetBrains Mono (numbers/codes) |
| Data storage | In-memory JavaScript state (no database, no browser storage) |

This matches the "everything happens automatically after the photo" philosophy for demonstration and evaluation purposes, but it is **not yet the production desktop application** described in the original specification (Windows app, encrypted local SQLite database, real `Receipts/YYYY/MM/` file folders, and live Google Drive backup).

---

## 10. Known Limitations

Please read this section before evaluating SpareIQ as a finished product — these are deliberate, disclosed trade-offs of the current prototype, not bugs:

- **No persistence.** All receipts, sales, inventory changes, and audit history live only in memory for the current browser session. Refreshing or closing the page resets everything back to the seeded demo data.
- **No real database.** There is no SQLite (or other) database, no encryption at rest, and no file-system storage of receipt images — photos are held as in-memory data URLs.
- **No live cloud backup.** The Google Drive connection and "Run Backup Now" button are simulated for demonstration; nothing actually uploads anywhere.
- **AI Insights is rule-based, not a general LLM.** It recognizes a fixed set of question patterns (spend-by-supplier, over-an-amount, last-purchased, price-comparison, etc.) rather than reasoning freely over arbitrary questions.
- **OCR accuracy is best-effort.** Handwritten, low-quality, or unusually laid-out receipts may extract few or no fields correctly — this is why every extracted field remains editable and low-confidence fields are flagged rather than silently trusted.
- **No PDF OCR.** Only image files (JPG/PNG) can be processed for OCR in this version; PDF uploads are declined with guidance to use a photo instead.
- **Single browser/session only.** There is no multi-device sync, and the app is not currently packaged as an installable Windows desktop application.

---

## 11. Roadmap

The architecture is intentionally modular so the following can be layered on without a rebuild:

- Electron-based Windows desktop packaging
- Local encrypted SQLite database with real `Receipts/YYYY/MM/` image storage
- Live Google Drive backup and restore, with backup history
- Barcode scanning via camera/hardware scanner
- Multi-branch management and a supplier portal
- Mobile companion app and WhatsApp receipt upload
- Accounting software integration (QuickBooks, Tally, Sage)
- Credit sales & debtor tracking, purchase orders, and supplier payments
- A general-purpose LLM-backed AI assistant in place of the current rule-based query engine

---

## 12. Data Model Reference

**Receipt** — id, receiptNo, invoiceNo, supplier, date, time, currency, items[], subtotal, discount, tax, grandTotal, notes, imageDataUrl, status (verified/duplicate)

**Line Item (Receipt)** — code, name, qty, unitPrice, total

**Inventory Item** — code, barcode, name, description, category, compatible models, unit, cost price, selling price, current stock, minimum stock, status, dateAdded, lastUpdated

**Sale** — id, txnId, receiptNo, date, time, empId, empName, items[], subtotal, discount, tax, grandTotal, amountPaid, balance, paymentMethod

**Line Item (Sale)** — code, name, qty, sellingPrice, costPrice, total, profit

**Employee** — id (EMP0001 format), name, password, role (admin/cashier), status (active/disabled), branch, created date

**Stock Movement** — code, name, type (Purchased/Sold/Manual Add/Opening Stock), change, date, user

**Audit Log Entry** — time, user, action, detail

**Shop Profile** — name, address, phone, logo

---

## 13. Support

SpareIQ is developed and maintained by **ResolveX**. For feedback on this build, use the in-app feedback controls where available, or route questions back through the channel this documentation was delivered with.

*Document version 1.0 — reflects SpareIQ build as of this release.*
