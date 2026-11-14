// A small in-browser stand-in for the Excel JavaScript API, used only by the demo page.
// It implements just the calls Gridline makes, on top of a simple cell model rendered by host.ts.
/* eslint-disable @typescript-eslint/no-explicit-any */

export interface CellData { v: string | number; f?: string; bold?: boolean; fill?: string; color?: string; nf?: string; }
export interface Sheet { name: string; cells: Map<string, CellData>; widths: Record<number, number>; frozen: number; }
type Listener = () => void;

const K = (r: number, c: number) => r + ',' + c;
export const letter = (i: number) => { let s = ''; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
const colIdx = (s: string) => s.split('').reduce((a, ch) => a * 26 + ch.charCodeAt(0) - 64, 0) - 1;
export function parse(a: string): [number, number, number, number] {
  a = a.split('!').pop()!.replace(/\$/g, '');
  const [p, q = p] = a.split(':');
  const one = (x: string): [number, number] => { const m = x.match(/^([A-Z]*)(\d*)$/)!; return [m[2] ? +m[2] - 1 : -1, m[1] ? colIdx(m[1]) : -1]; };
  let [r0, c0] = one(p), [r1, c1] = one(q);
  if (c0 < 0) { c0 = 0; c1 = 25; } if (r0 < 0) { r0 = 0; r1 = 999; }
  return [Math.min(r0, r1), Math.min(c0, c1), Math.max(r0, r1), Math.max(c0, c1)];
}
export const fmtAddr = (r0: number, c0: number, r1: number, c1: number) => r0 === r1 && c0 === c1 ? `${letter(c0)}${r0 + 1}` : `${letter(c0)}${r0 + 1}:${letter(c1)}${r1 + 1}`;

export const FN: Record<string, (...a: any[]) => any> = {};

export const WB = {
  sheet: { name: 'Pipeline', cells: new Map(), widths: {}, frozen: 0 } as Sheet,
  sel: [0, 0, 0, 0] as [number, number, number, number],
  changed: new Map<string, number>(),          // cell key → flash order (for the host animation)
  removedRows: 0,
  onRender: [] as Listener[],
  onSelect: [] as Listener[],
  render() { this.onRender.forEach(f => f()); },
  get(r: number, c: number) { return this.sheet.cells.get(K(r, c)); },
  set(r: number, c: number, d: Partial<CellData> | null, flash = true) {
    const key = K(r, c);
    if (d === null) { this.sheet.cells.delete(key); return; }
    const cur = this.sheet.cells.get(key) || { v: '' };
    this.sheet.cells.set(key, { ...cur, ...d });
    if (flash && ('v' in d || 'f' in d)) this.changed.set(key, this.changed.size);
  },
  used(): [number, number, number, number] | null {
    let r0 = 1e9, c0 = 1e9, r1 = -1, c1 = -1;
    this.sheet.cells.forEach((d, k) => { if (d.v === '' && !d.f) return; const [r, c] = k.split(',').map(Number); r0 = Math.min(r0, r); c0 = Math.min(c0, c); r1 = Math.max(r1, r); c1 = Math.max(c1, c); });
    return r1 < 0 ? null : [r0, c0, r1, c1];
  },
  value(r: number, c: number): string | number { const d = this.get(r, c); if (!d) return ''; return d.f ? evalFormula(d.f) : d.v; },
  select(r0: number, c0: number, r1 = r0, c1 = c0) { this.sel = [r0, c0, r1, c1]; this.onSelect.forEach(f => f()); }
};

/** Tiny formula evaluator: cell references, numbers, + - * / and GRIDLINE.<NAME>(…) calls. */
export function evalFormula(f: string): string | number {
  try {
    let s = f.replace(/^=/, '');
    const arg = (a: string) => { a = a.trim(); if (/^".*"$/.test(a)) return a.slice(1, -1); if (/^[A-Z]+\d+$/.test(a)) { const [r, c] = parse(a); return WB.value(r, c); } return Number(a); };
    let guard = 0;
    while (/GRIDLINE\.[A-Z]+\(/.test(s) && guard++ < 20) {
      s = s.replace(/GRIDLINE\.([A-Z]+)\(([^()]*)\)/, (_, name, args) => {
        const parts = args.match(/("[^"]*"|[^,]+)/g) || [];
        const out = FN[name](...parts.map(arg));
        return typeof out === 'number' ? String(out) : JSON.stringify(out);
      });
    }
    if (/^"[^"]*"$/.test(s.trim())) return JSON.parse(s.trim());
    s = s.replace(/\b([A-Z]+\d+)\b/g, m => { const v = arg(m); return typeof v === 'number' ? String(v) : JSON.stringify(v); });
    if (/^".*"$/.test(s.trim())) return JSON.parse(s.trim());
    if (!/^[\d.+\-*/() eE]+$/.test(s)) return '#VALUE!';
    const n = Function('return (' + s + ')')();
    return typeof n === 'number' && isFinite(n) ? Math.round(n * 1e6) / 1e6 : '#VALUE!';
  } catch { return '#VALUE!'; }
}

class Range {
  constructor(public r0: number, public c0: number, public r1: number, public c1: number) { }
  isNullObject = false;
  load() { return this; }
  get address() { return `${WB.sheet.name}!${fmtAddr(this.r0, this.c0, this.r1, this.c1)}`; }
  get rowIndex() { return this.r0; } get columnIndex() { return this.c0; }
  get rowCount() { return this.r1 - this.r0 + 1; } get columnCount() { return this.c1 - this.c0 + 1; }
  get worksheet() { return { name: WB.sheet.name, load() { return this; } }; }
  private each(fn: (r: number, c: number, i: number, j: number) => void) { for (let r = this.r0; r <= this.r1; r++) for (let c = this.c0; c <= this.c1; c++) fn(r, c, r - this.r0, c - this.c0); }
  get values() { const out: any[][] = []; for (let r = this.r0; r <= this.r1; r++) { const row = []; for (let c = this.c0; c <= this.c1; c++) row.push(WB.value(r, c)); out.push(row); } return out; }
  set values(v: any[][]) { this.each((r, c, i, j) => WB.set(r, c, { v: v[i]?.[j] ?? '', f: undefined })); }
  set formulas(v: any[][]) { this.each((r, c, i, j) => { const x = v[i]?.[j]; WB.set(r, c, typeof x === 'string' && x.startsWith('=') ? { f: x, v: '' } : { v: x, f: undefined }); }); }
  set numberFormat(v: any[][]) { this.each((r, c, i, j) => WB.set(r, c, { nf: v[i]?.[j] }, false)); }
  get format() {
    const self = this;
    return {
      font: { set bold(b: boolean) { self.each((r, c) => WB.set(r, c, { bold: b }, false)); }, set color(x: string) { self.each((r, c) => WB.set(r, c, { color: x }, false)); } },
      fill: { set color(x: string) { self.each((r, c) => WB.set(r, c, { fill: x }, false)); } },
      autofitColumns() {
        for (let c = self.c0; c <= self.c1; c++) {
          let w = 52; for (let r = 0; r <= Math.min(self.r1, 300); r++) { const d = WB.get(r, c); if (!d) continue; const v = d.f ? WB.value(r, c) : d.v; const t = typeof v === 'number' && d.nf ? Math.round(v).toLocaleString('en-US') : String(v); w = Math.max(w, t.length * (d.bold ? 7.0 : 6.4) + 18); }
          WB.sheet.widths[c] = Math.min(Math.round(w), 280);
        }
      }
    };
  }
  clear() { this.each((r, c) => WB.set(r, c, null)); }
  delete() {
    const n = this.rowCount; WB.removedRows += n;
    const next = new Map<string, CellData>();
    WB.sheet.cells.forEach((d, k) => { const [r, c] = k.split(',').map(Number); if (c < this.c0 || c > this.c1 || r < this.r0) next.set(k, d); else if (r > this.r1) next.set(K(r - n, c), d); });
    WB.sheet.cells = next;
  }
  getCell(i: number, j: number) { return new Range(this.r0 + i, this.c0 + j, this.r0 + i, this.c0 + j); }
  select() { WB.select(this.r0, this.c0, this.r1, this.c1); }
}

const worksheet = {
  get name() { return WB.sheet.name; }, load() { return this; },
  getRange(a: string) { return new Range(...parse(a)); },
  getUsedRange() { const u = WB.used() || [0, 0, 0, 0]; return new Range(...u); },
  getUsedRangeOrNullObject() { const u = WB.used(); if (!u) { const r = new Range(0, 0, 0, 0); r.isNullObject = true; return r; } return new Range(...u); },
  freezePanes: { freezeRows(n: number) { WB.sheet.frozen = n; } }
};
const workbook = {
  worksheets: { getActiveWorksheet: () => worksheet },
  getSelectedRange: () => new Range(...WB.sel),
  onSelectionChanged: { add(h: () => void) { WB.onSelect.push(h); return { context: ctx, remove() { WB.onSelect = WB.onSelect.filter(x => x !== h); } }; } }
};
const ctx = { workbook, sync: () => new Promise<void>(res => setTimeout(() => { WB.render(); res(); }, 30)) };

export function install() {
  const w = window as any;
  w.__GRIDLINE_HOST = true;
  w.Excel = {
    run: (a: any, b?: any) => (typeof a === 'function' ? a : b)(ctx),
    ClearApplyTo: { all: 'All' }, DeleteShiftDirection: { up: 'Up' }
  };
  w.OfficeExtension = {};
  w.Office = { onReady: (cb?: (i: any) => void) => { const i = { host: 'Excel', platform: 'OfficeOnline' }; cb && setTimeout(() => cb(i)); return Promise.resolve(i); }, HostType: { Excel: 'Excel' }, actions: { associate() { } } };
  class CFError extends Error { constructor(public code: string, msg?: string) { super(msg || code); } }
  w.CustomFunctions = { associate: (id: string, fn: any) => { FN[id] = fn; }, Error: CFError, ErrorCode: { invalidValue: '#VALUE!', notAvailable: '#N/A' } };
}
