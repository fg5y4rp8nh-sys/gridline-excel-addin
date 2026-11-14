/**
 * Gridline for Google Sheets — server side (Apps Script).
 * Menu, sidebar, every read/write on the spreadsheet, custom functions, PDF to Drive and the CRM proxy.
 * GL (data + clean-up rules) is the same TypeScript code the sidebar uses, bundled into lib.gs.
 */

const HEAD_BG = '#F1EFFC', HEAD_FG = '#2B2464';

/* ---------- Menu & sidebar ---------- */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Gridline')
    .addItem('Open Gridline', 'openGridline')
    .addSeparator()
    .addItem('Import deals', 'openImport')
    .addItem('Clean sheet', 'openClean')
    .addItem('Functions', 'openFormulas')
    .addItem('Quick clean', 'quickClean')
    .addSeparator()
    .addItem('Invoice PDF', 'openInvoice')
    .addItem('Push to CRM', 'openSync')
    .addToUi();
}
function onInstall() { onOpen(); }

function showSidebar_(tab) {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar').getContent()
    .replace('<!--TAB-->', '<script>window.__GRIDLINE_TAB=' + JSON.stringify(tab) + '</script>');
  SpreadsheetApp.getUi().showSidebar(HtmlService.createHtmlOutput(html).setTitle('Gridline'));
}
function openGridline() { showSidebar_('import'); }
function openImport() { showSidebar_('import'); }
function openClean() { showSidebar_('clean'); }
function openFormulas() { showSidebar_('formulas'); }
function openInvoice() { showSidebar_('export'); }
function openSync() { showSidebar_('sync'); }

/** "Quick clean": fixes every issue on the sheet without opening the sidebar. */
function quickClean() {
  const b = readUsed();
  if (!b) return SpreadsheetApp.getActive().toast('This sheet is empty', 'Gridline');
  const issues = GL.scan(b.values);
  const total = issues.reduce((s, x) => s + GL.issueCount(x), 0);
  if (!total) return SpreadsheetApp.getActive().toast('Nothing to fix', 'Gridline');
  const res = GL.fix(b.values, new Set(['duplicates', 'spaces', 'names', 'phones', 'emails']));
  replaceUsed(b, res.values);
  SpreadsheetApp.getActive().toast('Fixed ' + total + ' issues', 'Gridline');
}

/* ---------- Sheet operations (called from the sidebar) ---------- */

function norm_(rows) {
  const tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
  return rows.map(r => r.map(v => v instanceof Date ? Utilities.formatDate(v, tz, 'yyyy-MM-dd') : v));
}
/**
 * setFormula() parses formulas in the spreadsheet's locale. Locales with a decimal comma (ru, de, fr…)
 * separate arguments with ";" — so we swap the separators outside of string literals.
 */
function localFormula_(f) {
  const loc = SpreadsheetApp.getActive().getSpreadsheetLocale();
  if (/^(en|ja|zh|ko|he|th|hi|ms|fil|ga|cy)/.test(loc)) return f;
  return f.replace(/("[^"]*")|,/g, (m, str) => str || ';');
}
function styleHeader_(range) { range.setFontWeight('bold').setBackground(HEAD_BG).setFontColor(HEAD_FG); }

function writeTable(header, rows, opts) {
  const sh = SpreadsheetApp.getActiveSheet();
  sh.clear(); sh.setFrozenRows(0);
  const n = rows.length, m = header.length;
  const iAmt = header.indexOf('Amount'), iDate = header.indexOf('Close date');
  if (n) {
    // Text columns stay text (phones like 415.555.0198 must not turn into numbers or dates)
    header.forEach((h, c) => {
      const col = sh.getRange(2, c + 1, n, 1);
      col.setNumberFormat(c === iAmt ? '#,##0' : c === iDate ? 'yyyy-mm-dd' : '@');
    });
  }
  const all = sh.getRange(1, 1, n + 1, m);
  all.setValues([header].concat(rows)).setVerticalAlignment('middle');
  styleHeader_(sh.getRange(1, 1, 1, m));
  if (iAmt >= 0) sh.getRange(1, iAmt + 1, n + 1, 1).setHorizontalAlignment('right');
  sh.setFrozenRows(1);
  // Width from the longest value (autoResizeColumns under-sizes on first render)
  header.forEach((h, c) => {
    const longest = [h].concat(rows.map(r => String(r[c] == null ? '' : r[c]))).reduce((a, v) => Math.max(a, v.length), 0);
    sh.setColumnWidth(c + 1, Math.min(Math.max(Math.round(longest * 6.7) + 22, 60), 260));
  });
  return all.getA1Notation();
}

function readUsed() {
  const sh = SpreadsheetApp.getActiveSheet();
  const r = sh.getDataRange();
  if (r.getNumRows() === 1 && r.getNumColumns() === 1 && r.getValue() === '') return null;
  return { sheet: sh.getName(), address: r.getA1Notation(), values: norm_(r.getValues()), rowIndex: r.getRow() - 1, columnIndex: r.getColumn() - 1 };
}

function replaceUsed(before, values) {
  const sh = SpreadsheetApp.getActiveSheet();
  const cols = before.values[0].length, extra = before.values.length - values.length;
  if (extra > 0) sh.deleteRows(before.rowIndex + values.length + 1, extra);
  sh.getRange(before.rowIndex + 1, before.columnIndex + 1, values.length, cols).setValues(values);
}

function writeColumn(colIndex, header, formulas, numberFormat) {
  const sh = SpreadsheetApp.getActiveSheet();
  styleHeader_(sh.getRange(1, colIndex + 1).setValue(header));
  const body = sh.getRange(2, colIndex + 1, formulas.length, 1);
  body.setFormulas(formulas.map(f => [localFormula_(f)])).setNumberFormat(numberFormat || '#,##0').setHorizontalAlignment('right');
  sh.getRange(1, colIndex + 1).setHorizontalAlignment('right');
  sh.setColumnWidth(colIndex + 1, Math.max(Math.round(header.length * 7.4) + 30, 110));
}

function writeCell(formula) {
  const cell = SpreadsheetApp.getActiveRange().getCell(1, 1);
  cell.setFormula(localFormula_(formula));
  return cell.getA1Notation();
}

function readSelection() {
  const sh = SpreadsheetApp.getActiveSheet(), r = SpreadsheetApp.getActiveRange();
  const last = Math.min(r.getLastColumn(), Math.max(sh.getLastColumn(), 1));
  const width = Math.max(last - r.getColumn() + 1, 1);
  const vals = sh.getRange(r.getRow(), r.getColumn(), r.getNumRows(), width).getValues();
  return { sheet: sh.getName(), address: r.getA1Notation(), values: norm_(vals), rowIndex: r.getRow() - 1, columnIndex: r.getColumn() - 1 };
}

function selectRange(a1) { SpreadsheetApp.getActiveSheet().getRange(a1).activate(); }

/** Cheap fingerprint the sidebar polls: selection + a counter bumped by onEdit. */
function stateKey() {
  const r = SpreadsheetApp.getActiveRange();
  return r.getSheet().getName() + '!' + r.getA1Notation() + '#' + (PropertiesService.getDocumentProperties().getProperty('gl.edits') || 0);
}
function onEdit() {
  const p = PropertiesService.getDocumentProperties();
  p.setProperty('gl.edits', String(Number(p.getProperty('gl.edits') || 0) + 1));
}

/* ---------- Storage, PDF, CRM ---------- */

function storeGetAll() {
  const all = PropertiesService.getDocumentProperties().getProperties(), out = {};
  Object.keys(all).forEach(k => { if (k.indexOf('gridline-') === 0) out[k] = all[k]; });
  return out;
}
function storeSet(key, value) { PropertiesService.getDocumentProperties().setProperty(key, value); }

/** Saves an invoice PDF into "Gridline invoices" in the user's Drive and returns its URL. */
function savePdf(name, b64) {
  const it = DriveApp.getFoldersByName('Gridline invoices');
  const folder = it.hasNext() ? it.next() : DriveApp.createFolder('Gridline invoices');
  const file = folder.createFile(Utilities.newBlob(Utilities.base64Decode(b64), 'application/pdf', name));
  return file.getUrl();
}

/** Server-side CRM call, so the API key never reaches the browser. */
function crmFetch(baseUrl, apiKey, path, method, body) {
  const res = UrlFetchApp.fetch(String(baseUrl).replace(/\/$/, '') + path, {
    method: (method || 'GET').toLowerCase(), contentType: 'application/json', payload: body || undefined,
    headers: { Authorization: 'Bearer ' + apiKey }, muteHttpExceptions: true
  });
  const code = res.getResponseCode();
  if (code >= 300) throw new Error('CRM responded ' + code);
  return JSON.parse(res.getContentText() || 'null');
}

/* ---------- Custom functions ---------- */

const each_ = (v, f) => Array.isArray(v) ? v.map(r => Array.isArray(r) ? r.map(f) : f(r)) : f(v);

/**
 * Exchange rate between two currencies.
 * @param {"USD"} from Currency code, or a range of codes
 * @param {"EUR"} to Currency code
 * @return The rate from → to
 * @customfunction
 */
function GRIDLINE_FX(from, to) { return each_(from, f => GL.fxRate(f, to)); }

/**
 * List price of a product by SKU.
 * @param {"GL-TEAM"} sku Product SKU
 * @param {3} qty Optional quantity (default 1)
 * @return Price
 * @customfunction
 */
function GRIDLINE_PRICE(sku, qty) {
  return each_(sku, s => {
    const p = GL.PRICES[String(s).trim().toUpperCase()];
    if (!p) throw new Error('No SKU ' + s);
    return p.price * (qty || 1);
  });
}

/**
 * One field of a CRM deal.
 * @param {"D-1048"} id Deal ID
 * @param {"stage"} field stage | amount | company | contact | close
 * @return The value from the CRM
 * @customfunction
 */
function GRIDLINE_DEAL(id, field) {
  return each_(id, i => {
    const d = GL.DEMO_DEALS.find(x => x.id === String(i).trim());
    const f = String(field).toLowerCase();
    if (!d || !(f in d)) throw new Error('Not found');
    return d[f];
  });
}
