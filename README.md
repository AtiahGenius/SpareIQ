# SpareIQ

**AI-powered Receipt Management, Point of Sale & Inventory Intelligence for motorcycle spare parts retailers.**

Built by **ResolveX**.

> Take a photo → Save → Everything else happens automatically.

SpareIQ replaces the shoebox of paper receipts with a single app: snap a supplier receipt and it's read, categorized, and matched against inventory automatically. On the sales side, it doubles as a point-of-sale system with role-based access for owners and cashiers, live profit tracking, and low-stock alerts.

---

## Status

This is a **front-end prototype**: a single self-contained HTML file with no backend. It's built to demonstrate the full product experience end-to-end (UI, workflows, role permissions, OCR, POS, reporting) before investing in the production backend. See [Known Limitations](#known-limitations) below and the full [Product Documentation](docs/PRODUCT_DOCUMENTATION.md) for details.

## Quick Start

No build step, no dependencies to install.

1. Clone the repo:
   ```bash
   git clone https://github.com/<your-org>/spareiq.git
   cd spareiq
   ```
2. Open `index.html` directly in a modern browser (Chrome, Edge, Firefox, Safari) — double-click it, or run a tiny local server so fonts/scripts load cleanly:
   ```bash
   python3 -m http.server 8080
   # then visit http://localhost:8080
   ```
3. Sign in with a demo account:

   | Employee ID | Password | Role |
   |---|---|---|
   | `EMP0001` | `admin123` | Administrator |
   | `EMP0002` | `cashier123` | Sales User (Cashier) |
   | `EMP0003` | `cashier123` | Sales User — pre-disabled, for testing blocked logins |

### Want a live demo link?
Enable **GitHub Pages** for this repo (Settings → Pages → Deploy from branch → `main` → `/root`) and it will serve `index.html` automatically.

## Features

- 📷 Receipt capture with on-device OCR and automatic field extraction
- 🧰 Inventory with fuzzy OCR-to-catalog matching, CSV import, and manual entry
- 🛒 Full POS checkout flow with locked pricing and automatic stock deduction
- 👤 Role-based access control (Administrator vs. Sales User/Cashier)
- 📊 Dashboards, profit/stock/supplier reports, and an employee leaderboard
- 🤖 A rule-based "AI Insights" assistant for plain-language questions about your data
- 🧾 Audit log of every sensitive action
- 🌓 Light/dark mode, onboarding tour, keyboard shortcuts, and shop branding on printed receipts

Full feature-by-feature breakdown: **[docs/PRODUCT_DOCUMENTATION.md](docs/PRODUCT_DOCUMENTATION.md)**

## Tech Stack

| Concern | Technology |
|---|---|
| UI | Vanilla HTML / CSS / JavaScript (no framework, no build step) |
| Charts | [Chart.js](https://www.chartjs.org/) |
| CSV import/export | [PapaParse](https://www.papaparse.com/) |
| On-device OCR | [Tesseract.js](https://tesseract.projectnaptha.com/) |
| Fonts | Space Grotesk, Inter, JetBrains Mono |
| Data storage | In-memory JS state only — see limitations below |

## Project Structure

```
spareiq/
├── index.html                    # the entire application
├── docs/
│   └── PRODUCT_DOCUMENTATION.md  # full feature & architecture reference
├── .github/                      # issue/PR templates
├── CONTRIBUTING.md
├── CHANGELOG.md
├── CODE_OF_CONDUCT.md
└── LICENSE
```

## Known Limitations

- **No persistence** — all data lives in memory for the current browser tab; refreshing resets everything to seed data.
- **No real backend** — no database, no encryption at rest, no actual cloud backup (Google Drive button is simulated).
- **AI Insights is rule-based**, not a general LLM — it matches a fixed set of question patterns.
- **OCR is best-effort** — every extracted field stays editable, and low-confidence fields are flagged rather than trusted blindly.

See [docs/PRODUCT_DOCUMENTATION.md](docs/PRODUCT_DOCUMENTATION.md#10-known-limitations) for the complete list, and the [Roadmap](docs/PRODUCT_DOCUMENTATION.md#11-roadmap) for what a production backend (Electron + SQLite + real Google Drive sync) would add.

## Contributing

New to the project? Start with **[CONTRIBUTING.md](CONTRIBUTING.md)** — it covers local setup, code conventions for the single-file architecture, the manual test checklist, and how we branch and review PRs.

## Changelog

See **[CHANGELOG.md](CHANGELOG.md)** for release history.

## License

Proprietary — © ResolveX. See **[LICENSE](LICENSE)**.
