// Thin wrappers around the Excel JavaScript API (Office.js). Everything the task pane does to the workbook goes through here.
import { Row } from './data';

export const colLetter = (i: number) => { let s = ''; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
export const addr = (r0: number, c0: number, rows: number, cols: number) => `${colLetter(c0)}${r0 + 1}:${colLetter(c0 + cols - 1)}${r0 + rows}`;

export interface Block { sheet: string; address: string; values: Row[]; rowIndex: number; columnIndex: number; }

/** Write a header + rows table at A1 of the active sheet, styled and auto-fitted. */
export async function writeTable(header: string[], rows: Row[], opts: { numberCols?: number[]; dateCols?: number[] } = {}): Promise<string> {
  return Excel.run(async ctx => {
    const ws = ctx.workbook.worksheets.getActiveWorksheet();
    const used = ws.getUsedRangeOrNullObject(true); used.load('address'); await ctx.sync();
    if (!used.isNullObject) used.clear(Excel.ClearApplyTo.all);
    const all = ws.getRange(addr(0, 0, rows.length + 1, header.length));
    all.values = [header, ...rows];
    const head = ws.getRange(addr(0, 0, 1, header.length));
    head.format.font.bold = true; head.format.fill.color = '#F1EFFC'; head.format.font.color = '#2B2464';
    (opts.numberCols || []).forEach(c => { ws.getRange(addr(1, c, rows.length, 1)).numberFormat = rows.map(() => ['#,##0']); });
    all.format.autofitColumns();
    ws.freezePanes.freezeRows(1);
    all.load('address'); await ctx.sync();
    return all.address.split('!').pop() as string;
  });
}

/** Values of the used range on the active sheet. */
export async function readUsed(): Promise<Block | null> {
  return Excel.run(async ctx => {
    const ws = ctx.workbook.worksheets.getActiveWorksheet();
    const r = ws.getUsedRangeOrNullObject(true); r.load('address,values,rowIndex,columnIndex'); ws.load('name'); await ctx.sync();
    if (r.isNullObject) return null;
    return { sheet: ws.name, address: r.address.split('!').pop() as string, values: r.values as Row[], rowIndex: r.rowIndex, columnIndex: r.columnIndex };
  });
}

/** Replace the used range with new values (used after clean-up), clearing rows that are no longer needed. */
export async function replaceUsed(before: Block, values: Row[]): Promise<void> {
  await Excel.run(async ctx => {
    const ws = ctx.workbook.worksheets.getActiveWorksheet();
    const cols = before.values[0].length, extra = before.values.length - values.length;
    if (extra > 0) ws.getRange(addr(before.rowIndex + values.length, before.columnIndex, extra, cols)).delete(Excel.DeleteShiftDirection.up);
    ws.getRange(addr(before.rowIndex, before.columnIndex, values.length, cols)).values = values;
    await ctx.sync();
  });
}

export async function writeColumn(colIndex: number, header: string, formulas: string[], numberFormat = '#,##0'): Promise<void> {
  await Excel.run(async ctx => {
    const ws = ctx.workbook.worksheets.getActiveWorksheet();
    const h = ws.getRange(addr(0, colIndex, 1, 1)); h.values = [[header]]; h.format.font.bold = true; h.format.fill.color = '#F1EFFC'; h.format.font.color = '#2B2464';
    const body = ws.getRange(addr(1, colIndex, formulas.length, 1));
    body.formulas = formulas.map(f => [f]); body.numberFormat = formulas.map(() => [numberFormat]);
    ws.getRange(addr(0, colIndex, formulas.length + 1, 1)).format.autofitColumns();
    await ctx.sync();
  });
}

export async function writeCell(formula: string): Promise<string> {
  return Excel.run(async ctx => {
    const r = ctx.workbook.getSelectedRange(); r.load('address'); await ctx.sync();
    const first = r.getCell(0, 0); first.formulas = [[formula]]; first.load('address'); await ctx.sync();
    return first.address.split('!').pop() as string;
  });
}

export async function readSelection(): Promise<Block> {
  return Excel.run(async ctx => {
    const r = ctx.workbook.getSelectedRange(); r.load('address,values,rowIndex,columnIndex'); const ws = r.worksheet; ws.load('name'); await ctx.sync();
    return { sheet: ws.name, address: r.address.split('!').pop() as string, values: r.values as Row[], rowIndex: r.rowIndex, columnIndex: r.columnIndex };
  });
}

export async function selectRange(address: string): Promise<void> {
  await Excel.run(async ctx => { ctx.workbook.worksheets.getActiveWorksheet().getRange(address).select(); await ctx.sync(); });
}

/** Call cb whenever the user selects different cells. Returns an unsubscribe function. */
export async function onSelectionChanged(cb: () => void): Promise<() => void> {
  let handler: OfficeExtension.EventHandlerResult<Excel.SelectionChangedEventArgs> | undefined;
  await Excel.run(async ctx => { handler = ctx.workbook.onSelectionChanged.add(async () => cb()); await ctx.sync(); });
  return () => { if (handler) Excel.run(handler.context, async ctx => { handler!.remove(); await ctx.sync(); }); };
}
