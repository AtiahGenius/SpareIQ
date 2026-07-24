# Changelog

All notable changes to SpareIQ are documented in this file.

The format is loosely based on [Keep a Changelog](https://keepachangelog.com/).

---

## [1.0.0] — Rebrand & Polish Release

### Changed
- Renamed the product from "MotoReceipt AI" to **SpareIQ** across the app (title, sidebar wordmark, login screen, footer credit, onboarding tour, default shop profile name).

### Added
- Toast notifications now have **success / warning / error / info** variants with distinct colors and icons.
- Barcode-style graphic printed on every sales receipt.
- Click-to-zoom lightbox for receipt photos (both in the receipt viewer and the upload review screen).
- **Sortable columns** on the Inventory and Audit Log tables (in addition to existing pagination).
- **Keyboard shortcuts**: `/` focuses global search, `Esc` closes any open modal/dialog/menu.
- **Inline field validation** (red outline + focus) on the Add Employee and Add Inventory forms, replacing toast-only error messages.
- Basic accessibility pass: alt text on all images, aria-labels on icon-only buttons, `role="dialog"` on modals, visible focus outlines for keyboard navigation.
- Branded version footer ("SpareIQ v1.0 · Built by ResolveX") on the login screen and sidebar.

## [0.4.0] — UX & Trust Polish

### Added
- **Shop Profile** settings (name, address, phone, logo) reflected on printed sales receipts and report letterheads.
- Custom **confirm modal** replacing the browser's native `confirm()` dialog for deletions.
- **5-second Undo** toast after deleting a receipt or inventory item.
- **Onboarding tour** — a short guided walkthrough shown once per role on first login each session, replayable from Settings.
- **Pagination** for the Receipts grid, Inventory table, and Audit Log.
- Dedicated **print stylesheet** so printing a receipt/report no longer includes the sidebar/top bar chrome.

## [0.3.0] — RBAC Bug Fixes

### Fixed
- Sidebar navigation links were invisible after login due to a CSS specificity bug (`el.style.display=""` was being overridden by a more specific stylesheet rule). Role-based visibility now uses an explicit `role-hidden` class instead.
- Sidebar was completely inaccessible on narrow/mobile viewports with no way to reopen it — added a hamburger menu toggle with a slide-in drawer and backdrop.

### Changed
- Cashiers can no longer set their own PIN/password — only administrators can assign or reset employee credentials, from the Employees page.
- Added a manual **"Add Item"** flow to Inventory so admins can enter a product by hand (in addition to CSV import); it feeds the same list used by POS and OCR matching.
- Removed a duplicate "New Receipt" button that was appearing in the top bar on every page — Upload Receipt now has a single, clear entry point (sidebar nav + Dashboard quick action).

## [0.2.0] — Sales & Inventory Management (Module 2)

### Added
- **Role-Based Access Control**: Administrator and Sales User (Cashier) roles with a professional login screen (Employee ID + password) and auto-generated Employee IDs.
- **Session timeout**: automatic logout after 3 minutes of inactivity, with a countdown warning.
- **Point of Sale (POS)** screen: product search/browse, cart with locked selling prices, checkout with discount/tax/payment method/amount paid/balance, automatic stock deduction, and a printable sales receipt.
- **Inventory** expanded with stock, minimum stock, selling price, category, barcode, and status fields; purchase receipts now automatically restock matched inventory items.
- **Employees** module: leaderboard, account management, password reset, enable/disable.
- Role-specific **dashboards** (full admin view vs. simplified cashier view showing only their own sales).
- **Audit Log** capturing logins, sales, price changes, deletions, employee actions, receipt uploads, and backups.
- **Profit Report** and **Stock Report** added to Reports.

## [0.1.0] — Initial Release (Module 1)

### Added
- Receipt capture (drag-and-drop / file upload) with a simulated image-processing pipeline and real on-device OCR via Tesseract.js.
- Rule-based structured field extraction (supplier, invoice number, date, amounts) with low-confidence fields flagged for manual review.
- Fuzzy matching of OCR line items against an inventory master list.
- Dashboard with stat cards, monthly spending / top suppliers / top products charts, and recent receipts.
- Inventory module with CSV import.
- Suppliers module with per-supplier purchase history.
- Global smart search across receipts, suppliers, products, amounts, and dates.
- Reports (monthly, supplier, most-purchased-items) with CSV export and print/PDF.
- **AI Insights**: a rule-based assistant answering plain-language questions about purchases.
- Duplicate receipt detection (same supplier + invoice number).
- Light/dark mode.

---

[1.0.0]: #
[0.4.0]: #
[0.3.0]: #
[0.2.0]: #
[0.1.0]: #
