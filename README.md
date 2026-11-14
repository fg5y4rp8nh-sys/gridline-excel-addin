# Gridline — Excel add-in

An Office.js add-in for Excel built with React and TypeScript. It connects a spreadsheet to a CRM:

- **Import:** pulls deals from the CRM into the active sheet. You can filter by stage and owner and pick the columns. The header is styled, amounts are formatted, columns are auto-fitted and the first row is frozen.
- **Clean:** finds duplicate rows, stray spaces, lower-case names, mixed phone formats and upper-case emails, then fixes them in one click (with Undo).
- **Custom functions:**
  - `=GRIDLINE.FX(from, to)` returns the exchange rate between two currencies.
  - `=GRIDLINE.PRICE(sku, [qty])` returns the price from the product catalogue.
  - `=GRIDLINE.DEAL(id, field)` returns a field of a CRM deal.

  A quick action fills in an "Amount (EUR)" column for every row.
- **Invoice:** select deal rows in the sheet and get a PDF invoice. It is built in the browser with jsPDF.
- **Sync:** Gridline remembers what came from the CRM. If you edit Stage, Amount or Close date in the sheet, the changes are listed in the pane, and **Push to CRM** sends them back.
- **Ribbon tab "Gridline":** has buttons that open the pane on the right tab, plus **Quick clean**, which runs without opening the pane.

## Project layout

| Path | What it is |
|------|------------|
| `manifest.xml` | Add-in manifest for local development (`https://localhost:3000`): shared runtime, custom ribbon tab, custom functions (namespace `GRIDLINE`) |
| `manifest.pages.xml` | The same manifest pointing at the hosted build on GitHub Pages |
| `src/taskpane/` | React task pane (`App.tsx`, `ui.tsx`, `taskpane.css`) and `taskpane.html`, the single page of the shared runtime (`index.ts` loads the pane, the functions and the commands) |
| `src/functions/` | Custom functions (`functions.ts`) and their metadata (`functions.json`) |
| `src/commands/` | Ribbon commands: open the pane on a given tab, and **Quick clean** that runs without the pane |
| `public/assets/` | Ribbon icons (16/32/80 px) |
| `docs/` | Production build served by GitHub Pages |
| `src/lib/excel.ts` | Every Excel API call in one place (write table, read used range, selection events…) |
| `src/lib/api.ts` | CRM client: `GET /deals`, `PATCH /deals/:id`, `GET /me`, plus a built-in Demo CRM |
| `src/lib/clean.ts` | Clean-up rules as pure functions (easy to unit test) |
| `src/lib/pdf.ts` | Invoice PDF layout |
| `src/lib/data.ts` | Demo data, columns, FX rates and price list |
| `demo/` | A browser-only preview: a neutral spreadsheet window that runs the real task pane on a mock Excel API (`npm run demo`) |

## Try it without building

The build in `docs/` is hosted on GitHub Pages. Download [`manifest.pages.xml`](manifest.pages.xml) and upload it in Excel on the web (Home → Add-ins → More add-ins → My add-ins → Upload my add-in). The **Gridline** tab appears on the ribbon. It runs on the built-in Demo CRM: 64 deals, deliberately messy.

## Architecture

The add-in uses a **shared runtime**. The task pane, the custom functions and the ribbon commands all run in one page (`taskpane.html`), so they share state. For example, a ribbon button opens the pane straight on the right tab (`Office.addin.showAsTaskpane()` plus an event the React app listens to). It needs the SharedRuntime 1.1 requirement set, which Excel on the web, Windows and Mac support.

## Run it in Excel

You need Node 18+ and Excel: Microsoft 365 desktop on Windows or Mac, or Excel on the web. A free Microsoft 365 Developer subscription works.

```bash
npm install
npx office-addin-dev-certs install   # trusted HTTPS certificate for localhost
npm run dev                          # serves https://localhost:3000
```

Then load (sideload) `manifest.xml`:

- **Excel on the web:** Home → Add-ins → More add-ins → My add-ins → Upload my add-in → choose `manifest.xml`.
- **Excel desktop:** run `npm run start`. It uses `office-addin-debugging` to sideload the add-in and open Excel. On Windows you can also use a shared-folder catalog.

The **Gridline** tab appears on the ribbon. Custom functions are available as `=GRIDLINE.` in any cell.

> To use the dev certificate, set `server.https` in `vite.config.ts` to the key and cert that `office-addin-dev-certs` creates (in `~/.office-addin-dev-certs/`).

## Connect your CRM

Open the pane → ⚙ Settings → turn off **Use Demo CRM** → enter the API base URL and key. The client expects:

| Call | Returns |
|------|---------|
| `GET /me` | `{ "workspace": "Acme" }` |
| `GET /deals?stage=Qualified,Won&owner=Everyone` | `Deal[]` (see `src/lib/data.ts`) |
| `PATCH /deals/:id` | body with the changed fields, e.g. `{ "Stage": "Won" }` |

For HubSpot, Pipedrive, Salesforce or your own backend, change the paths and the field mapping in `src/lib/api.ts`. Also add the API host to `<AppDomains>` in `manifest.xml`. Keep real API keys on a backend in production. The task pane runs in the user's browser.

## Deploy

```bash
npm run build      # → dist/ (relative URLs, so it works from any folder)
```

Host `dist/` on any HTTPS static host (GitHub Pages, Vercel, Netlify, Azure Static Web Apps). Replace `https://localhost:3000` in `manifest.xml` with that URL, and generate a new `<Id>` for each client. Then deploy the manifest to users: Microsoft 365 admin center → Settings → Integrated apps → Upload custom apps.

## Requirements

- ExcelApi 1.7, SharedRuntime 1.1, custom functions.
- Excel for Microsoft 365 (Windows, Mac, web) and Excel 2021 and later.

## Licence

See `LICENSE.txt`.
