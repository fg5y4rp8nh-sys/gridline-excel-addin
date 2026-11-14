# Gridline for Google Sheets

A Google Sheets add-on (Apps Script + React sidebar) that connects a spreadsheet to a CRM. It adds a **Gridline** menu and a sidebar with five tabs:

- **Import.** Pulls deals from the CRM into the active sheet. You can filter by stage and owner and choose the columns. The header is styled, amounts are formatted, and column widths are set from the content.
- **Clean.** Finds duplicate rows, stray spaces, names in all lower or upper case, mixed phone formats and upper-case emails. It fixes them in one click, with Undo. The **Quick clean** menu item does the same without opening the sidebar.
- **Formulas.** Custom functions you can use in any cell:
  - `=GRIDLINE_FX(from, to)` returns an exchange rate.
  - `=GRIDLINE_PRICE(sku, [qty])` returns a price from the catalogue.
  - `=GRIDLINE_DEAL(id, field)` returns a field of a deal.

  Each function also accepts ranges. A one-click action adds an "Amount (EUR)" column.
- **Invoice.** Select deal rows to build a PDF invoice. It is generated in the browser with jsPDF and saved to the **Gridline invoices** folder in Google Drive.
- **Sync.** Gridline keeps a snapshot of what came from the CRM. If you edit Stage, Amount or Close date in the sheet, those changes are listed in the sidebar, and **Push to CRM** sends them back.

## Project layout

| Path | What it is |
|------|------------|
| `server/Code.js` | Apps Script: menu, sidebar, every read and write on the sheet, custom functions, saving PDFs to Drive, CRM proxy (`UrlFetchApp`) |
| `server/lib-entry.ts` | Bundles the shared TypeScript rules (`src/lib/data.ts`, `src/lib/clean.ts`) into `lib.gs`, so the server and the sidebar use the same code |
| `server/Sidebar.template.html` | Sidebar shell. React, ReactDOM and jsPDF load from a CDN, and the app is inlined |
| `src/sidebar/` | React sidebar (`App.tsx`, `ui.tsx`, `sidebar.css`) |
| `src/lib/sheets.ts` | Promise wrappers around `google.script.run`, plus selection polling (Sheets has no selection event for sidebars) |
| `src/lib/store.ts` | Settings and import snapshot, stored in Document Properties so they travel with the spreadsheet |
| `src/lib/api.ts` | CRM client. Demo CRM built in; real calls go through `crmFetch` on the server, so the API key never reaches the browser |
| `apps-script/` | Build output, ready to push: `Code.gs`, `lib.gs`, `Sidebar.html`, `appsscript.json` |

## Build and deploy

```bash
npm install
npm run build          # → apps-script/ (dist/)
npx clasp login
npx clasp create --type sheets --title "Gridline" --rootDir dist   # or set scriptId in .clasp.json
npm run push           # build + clasp push
```

Open the spreadsheet and reload it. The **Gridline** menu appears. The first run asks for permissions:
- the current spreadsheet;
- creating files in Drive, for invoices;
- external requests, for the CRM.

Without clasp, you can also do it by hand: open **Extensions → Apps Script** in a sheet and create `Code.gs`, `lib.gs` and `Sidebar.html` with the contents of `apps-script/`.

## Connect your CRM

Sidebar → ⚙ → turn off **Use Demo CRM** → enter the API base URL and key. Expected endpoints:
- `GET /me`
- `GET /deals?stage=…&owner=…`
- `PATCH /deals/:id`

Adjust the paths and the field mapping in `src/lib/api.ts` for HubSpot, Pipedrive, Salesforce or your own backend.

## Publish

To share it inside a Google Workspace domain, or publicly, deploy it as an Editor Add-on: Apps Script → **Deploy → New deployment → Add-on**. Then configure the Google Workspace Marketplace SDK listing. `appsscript.json` already lists the minimal OAuth scopes.

## Licence

See `LICENSE.txt`.
