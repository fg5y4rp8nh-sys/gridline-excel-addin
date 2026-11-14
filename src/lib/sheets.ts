// Everything the sidebar does to the spreadsheet goes through here. Each call runs a function in Code.gs.
import { Row } from './data';
import { call } from './gas';

export const colLetter = (i: number) => { let s = ''; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
export const addr = (r0: number, c0: number, rows: number, cols: number) => `${colLetter(c0)}${r0 + 1}:${colLetter(c0 + cols - 1)}${r0 + rows}`;

export interface Block { sheet: string; address: string; values: Row[]; rowIndex: number; columnIndex: number; }

/** Write a header + rows table at A1 of the active sheet, styled and auto-sized. Returns the A1 address. */
export const writeTable = (header: string[], rows: Row[], opts: { numberCols?: number[]; dateCols?: number[] } = {}) =>
  call<string>('writeTable', header, rows, opts);

/** Values of the data range on the active sheet (dates come back as yyyy-mm-dd). */
export const readUsed = () => call<Block | null>('readUsed');

/** Replace the data range with new values, clearing rows that are no longer needed. */
export const replaceUsed = (before: Block, values: Row[]) => call<void>('replaceUsed', before, values);

export const writeColumn = (colIndex: number, header: string, formulas: string[], numberFormat = '#,##0') =>
  call<void>('writeColumn', colIndex, header, formulas, numberFormat);

export const writeCell = (formula: string) => call<string>('writeCell', formula);
export const readSelection = () => call<Block>('readSelection');
export const selectRange = (a1: string) => call<void>('selectRange', a1);

/**
 * Sheets has no selection-changed event for sidebars, so we poll a cheap "state key"
 * (active range + edit counter) and call cb when it changes.
 */
export async function onSelectionChanged(cb: () => void, every = 900): Promise<() => void> {
  let last = '', alive = true, busy = false;
  const tick = async () => {
    if (!alive || busy || document.hidden) return;
    busy = true;
    try { const k = await call<string>('stateKey'); if (k !== last) { last = k; cb(); } } catch { /* ignore */ }
    busy = false;
  };
  tick(); const t = window.setInterval(tick, every);
  return () => { alive = false; window.clearInterval(t); };
}
