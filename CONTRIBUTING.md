# Contributing to SpareIQ

Thanks for helping build SpareIQ. This doc covers everything a new contributor needs: how the codebase is organized, how to run and test it locally, our conventions, and how to submit changes.

---

## 1. New Team Member Checklist

- [ ] Clone the repo and open `index.html` locally (see [README Quick Start](README.md#quick-start))
- [ ] Log in as `EMP0001` / `admin123` and click through every sidebar section once
- [ ] Log in as `EMP0002` / `cashier123` and confirm the restricted view
- [ ] Read `docs/PRODUCT_DOCUMENTATION.md` in full — it's the source of truth for what's built vs. planned
- [ ] Read [Known Limitations](README.md#known-limitations) so you know what's intentionally stubbed/simulated
- [ ] Skim the file structure in this doc (Section 3) before making your first change

## 2. Local Development

There is no build step or package manager dependency today — the entire app is one HTML file (`index.html`) with inline `<style>` and `<script>` blocks, plus three CDN-hosted libraries (Chart.js, PapaParse, Tesseract.js).

To run it locally:

```bash
python3 -m http.server 8080
# visit http://localhost:8080
```

A local server (rather than opening the file directly via `file://`) avoids CORS quirks with the Google Fonts stylesheet and gives a more accurate picture of how it'll behave when hosted (e.g. via GitHub Pages).

There is no test suite runner in the repo yet. Until one exists, **manually verify the checklist in Section 5 before opening a PR.**

## 3. Codebase Structure (single file)

`index.html` is organized into clearly commented sections — search for these markers (`/* ==== ... ==== */`) to find your way around:

| Section | What lives there |
|---|---|
| `TOKENS` | CSS custom properties (colors, fonts, spacing) — change the look of the whole app from one place |
| `LAYOUT`, `RBAC / LOGIN`, `POS`, etc. | CSS for each area of the UI |
| `STATE` | All in-memory data: `receipts`, `inventory`, `employees`, `sales`, `auditLog`, `notifications`, `shopProfile`, etc. |
| `NAVIGATION` | `showView()` and role-gating logic |
| `LOGIN / RBAC / SESSION` | Auth, session timeout, `applyRoleUI()` |
| `DASHBOARD` | Role-specific dashboard rendering + Chart.js wiring |
| `UPLOAD / OCR PIPELINE` | Tesseract.js integration and field extraction |
| `POS / NEW SALE` | Cart, checkout, sale completion, stock deduction |
| `EMPLOYEES`, `SUPPLIERS`, `INVENTORY` | CRUD for each entity |
| `REPORTS` | CSV export + print-friendly report rendering |
| `AI ASSISTANT` | Rule-based natural-language query matching |
| `ONBOARDING TOUR`, `KEYBOARD SHORTCUTS` | UX polish features |

**When adding a feature:** find the closest matching section and extend it there rather than creating a new pattern. If you're adding a genuinely new area (e.g. a new top-level page), add a new `/* ==== ==== */` section and follow the existing `render<Thing>()` naming convention.

## 4. Conventions

- **No frameworks.** Keep it vanilla JS/CSS/HTML unless the team has explicitly agreed to introduce a build step (see the Roadmap in the product docs for where this is likely to happen — e.g. the eventual Electron rewrite).
- **Colors and fonts always go through CSS variables** (`var(--accent)`, `var(--font-mono)`, etc.), never hardcoded hex values, so dark mode and future re-theming keep working.
- **Every state-changing action that matters to the business should call `logAction(user, action, detail)`** so it shows up in the Audit Log — this includes anything touching prices, stock, accounts, or receipts.
- **Destructive actions need confirm + undo.** Follow the existing pattern in `deleteInventoryItem()` / `deleteReceipt()` (a styled `showConfirm()` dialog, then an `undoToast()` with a restore callback) rather than the browser's native `confirm()`.
- **Role-gated UI uses the `data-role="admin"` / `data-role="admin,cashier"` attribute + the `role-hidden` CSS class**, toggled by `applyRoleUI()`. Don't hide admin-only elements with `style.display` directly — it gets overridden by the stylesheet cascade (this was a real bug we fixed once already).
- **Toasts should carry a type**: `toast(message, "success" | "warning" | "error" | "info")`. Default (no type) is neutral and should be rare.

## 5. Manual Test Checklist (run before every PR)

- [ ] Log in as admin and as cashier — confirm the sidebar shows the correct sections for each
- [ ] Log in with the disabled account (`EMP0003`) and confirm it's rejected
- [ ] Upload a receipt photo, let OCR run, edit a low-confidence field, save it — confirm matched inventory stock increased
- [ ] Complete a POS sale — confirm stock decreased and the sale appears on the cashier's dashboard and the leaderboard
- [ ] Delete an inventory item and a receipt — confirm the Undo toast restores them within 5 seconds
- [ ] Change an inventory price — confirm it appears in the Audit Log and fires a notification
- [ ] Resize the browser to mobile width — confirm the ☰ menu opens/closes the sidebar drawer
- [ ] Toggle dark mode — confirm charts and tables remain readable
- [ ] Print a receipt and a report — confirm only the relevant content prints, not the full app chrome

## 6. Branching & Pull Requests

- `main` is the protected, always-deployable branch.
- Branch naming: `feature/<short-description>`, `fix/<short-description>`, or `docs/<short-description>`.
- Commit messages should follow [Conventional Commits](https://www.conventionalcommits.org/) style where practical: `feat: add barcode rendering to sales receipt`, `fix: nav items hidden after login`, `docs: update roadmap`.
- Every PR should:
  1. Reference the issue it closes (if any)
  2. Include a one-line summary of *why*, not just *what*
  3. Confirm the manual test checklist above was run
- Keep PRs scoped to one feature/fix — this file is one large HTML document, so overlapping PRs touching the same section will conflict easily. Coordinate in the team channel before starting large changes.

## 7. Reporting Bugs / Requesting Features

Please use the issue templates under `.github/ISSUE_TEMPLATE/` rather than a blank issue — they make sure we capture the role (admin/cashier), browser, and repro steps needed to act on it quickly.

---

Questions not answered here? Ask in the team channel, and consider adding the answer back into this file for the next person.
