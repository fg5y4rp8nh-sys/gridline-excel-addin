// Demo host: a neutral spreadsheet window that runs the real Gridline task pane against the mock API.
import { WB, letter, parse, fmtAddr } from './mock';

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T;
const COLS = 13, ROWS = 80, DEF_W = 92, ROW_H = 26;
const svg = (d: string) => `<svg class="ic" viewBox="0 0 24 24"><path d="${d}"/></svg>`;
const IC = {
  pane: svg('M4 4h16v16H4zM14 4v16'), imp: svg('M12 4v11M7 10l5 5 5-5M5 20h14'), clean: svg('M4 20l6-6M14 4l6 6-8 8H8v-4z'),
  fx: svg('M8 20c3 0 3-16 6-16M6 10h7M14 12l6 6M20 12l-6 6'), sync: svg('M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5'),
  pdf: svg('M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20zM14 3.5V8h4'), grid: svg('M4 4h16v16H4zM4 10h16M4 15h16M10 4v16'), x: svg('M6 6l12 12M18 6 6 18'),
  bolt: svg('M13 3 5 13.5h6L10 21l8-10.5h-6z'), undo: svg('M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3'), bold: svg('M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z'), sum: svg('M17 5H7l6 7-6 7h10')
};

export function buildHost(onOpenPane: (tab?: string) => void) {
  document.body.innerHTML = `
  <div class="win">
    <div class="tb"><div class="tb-l"><span class="app">${IC.grid}</span><b>Q4 Pipeline.xlsx</b><span class="saved">Saved</span></div><div class="tb-m"><span class="search">Search</span></div><div class="tb-r"><span class="av">SM</span></div></div>
    <div class="rtabs">${['File', 'Home', 'Insert', 'Formulas', 'Data', 'Review', 'View'].map(t => `<span>${t}</span>`).join('')}<span class="on">Gridline</span></div>
    <div class="ribbon">
      <div class="grp"><button class="rb big" data-open="import">${IC.pane}<span>Open<br>Gridline</span></button></div>
      <div class="grp"><button class="rb" data-open="import">${IC.imp}<span>Import deals</span></button><button class="rb" data-open="clean">${IC.clean}<span>Clean sheet</span></button><button class="rb" data-open="formulas">${IC.fx}<span>Functions</span></button><button class="rb" data-quick>${IC.bolt}<span>Quick clean</span></button><i>Data</i></div>
      <div class="grp"><button class="rb" data-open="export">${IC.pdf}<span>Invoice PDF</span></button><button class="rb" data-open="sync">${IC.sync}<span>Push to CRM</span></button><i>CRM</i></div>
    </div>
    <div class="fbar"><div class="nb" id="nb">A1</div><span class="fx">fx</span><div class="fv" id="fv"></div></div>
    <div class="body">
      <div class="grid-wrap"><div class="grid" id="grid"></div></div>
      <aside class="pane" id="pane"><div class="pane-h"><b>Gridline</b><button class="px" id="paneX" aria-label="Close">${IC.x}</button></div><div class="pane-b" id="root"></div></aside>
    </div>
    <div class="tabs"><span class="st on">Pipeline</span><span class="st">Accounts</span><span class="plus">+</span></div>
    <div class="status"><span id="stL">Ready</span><span id="stR"></span></div>
  </div>`;
  document.querySelectorAll<HTMLElement>('[data-open]').forEach(b => b.addEventListener('click', () => onOpenPane(b.dataset.open)));
  $('#paneX').addEventListener('click', () => document.body.classList.remove('pane-on'));
  render(); WB.onRender.push(render); WB.onSelect.push(paintSel);
  const g = $('#grid');
  let drag: [number, number] | null = null;
  g.addEventListener('mousedown', e => { const c = (e.target as HTMLElement).closest<HTMLElement>('[data-rc]'); if (!c) return; const [r, cc] = c.dataset.rc!.split(',').map(Number); drag = [r, cc]; WB.select(r, cc); });
  g.addEventListener('mouseover', e => { if (!drag) return; const c = (e.target as HTMLElement).closest<HTMLElement>('[data-rc]'); if (!c) return; const [r, cc] = c.dataset.rc!.split(',').map(Number); WB.sel = [Math.min(drag[0], r), Math.min(drag[1], cc), Math.max(drag[0], r), Math.max(drag[1], cc)]; paintSel(); });
  addEventListener('mouseup', () => { if (drag) { drag = null; WB.select(...WB.sel); } });
  g.addEventListener('mousedown', e => { const h = (e.target as HTMLElement).closest<HTMLElement>('[data-row]'); if (h) { const r = +h.dataset.row!; WB.select(r, 0, r, lastCol()); } });
}

const lastCol = () => (WB.used() || [0, 0, 0, 9])[3];
const w = (c: number) => WB.sheet.widths[c] || DEF_W;
function show(r: number, c: number) {
  const d = WB.get(r, c); if (!d) return '';
  const v = WB.value(r, c);
  if (typeof v === 'number') return d.nf === '#,##0' ? Math.round(v).toLocaleString('en-US') : d.nf === '0.00' ? v.toFixed(2) : String(v);
  return String(v);
}
function render() {
  const g = $('#grid'); const cols = Math.max(COLS, lastCol() + 2);
  const tmpl = `44px ${Array.from({ length: cols }, (_, c) => w(c) + 'px').join(' ')}`;
  let h = `<div class="row hd" style="grid-template-columns:${tmpl}"><div class="corner"></div>${Array.from({ length: cols }, (_, c) => `<div class="ch" data-col="${c}">${letter(c)}</div>`).join('')}</div>`;
  for (let r = 0; r < ROWS; r++) {
    h += `<div class="row${WB.sheet.frozen && r === WB.sheet.frozen - 1 ? ' frz' : ''}" style="grid-template-columns:${tmpl}"><div class="rh" data-row="${r}">${r + 1}</div>`;
    for (let c = 0; c < cols; c++) {
      const d = WB.get(r, c), v = d ? WB.value(r, c) : '', key = r + ',' + c, fl = WB.changed.get(key);
      const st = d ? `${d.bold ? 'font-weight:600;' : ''}${d.fill ? `background:${d.fill};` : ''}${d.color ? `color:${d.color};` : ''}${fl !== undefined ? `animation-delay:${Math.min(fl, 400) * 4}ms;` : ''}` : '';
      h += `<div class="c${typeof v === 'number' ? ' n' : ''}${fl !== undefined ? ' fl' : ''}${v === '#VALUE!' ? ' err' : ''}" data-rc="${key}" data-cell="${letter(c)}${r + 1}" style="${st}">${esc(show(r, c))}</div>`;
    }
    h += '</div>';
  }
  g.innerHTML = h + '<div class="selbox" id="selbox"></div>';
  WB.changed.clear();
  paintSel();
}
const esc = (s: string) => s.replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]!));
function paintSel() {
  const [r0, c0, r1, c1] = WB.sel, box = $('#selbox'); if (!box) return;
  let x = 44; for (let c = 0; c < c0; c++) x += w(c);
  let wd = 0; for (let c = c0; c <= c1; c++) wd += w(c);
  box.style.cssText = `left:${x - 1}px;top:${ROW_H * (r0 + 1) - 1}px;width:${wd + 1}px;height:${ROW_H * (r1 - r0 + 1) + 1}px`;
  box.classList.toggle('multi', r0 !== r1 || c0 !== c1);
  document.querySelectorAll('.ch.on,.rh.on').forEach(e => e.classList.remove('on'));
  for (let c = c0; c <= c1; c++) document.querySelector(`.ch[data-col="${c}"]`)?.classList.add('on');
  for (let r = r0; r <= r1; r++) document.querySelector(`.rh[data-row="${r}"]`)?.classList.add('on');
  $('#nb').textContent = fmtAddr(r0, c0, r0 === r1 && c0 === c1 ? r0 : r1, c1);
  const d = WB.get(r0, c0); $('#fv').textContent = d ? (d.f || show(r0, c0)) : '';
  const nums: number[] = []; for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) { const v = WB.value(r, c); if (typeof v === 'number' && WB.get(r, c)?.v !== '' || WB.get(r, c)?.f) { if (typeof v === 'number') nums.push(v); } }
  const cnt = (() => { let n = 0; for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (WB.value(r, c) !== '') n++; return n; })();
  $('#stR').innerHTML = cnt > 1 ? `${nums.length ? `<span>Average: ${fmt(nums.reduce((a, b) => a + b, 0) / nums.length)}</span>` : ''}<span>Count: ${cnt}</span>${nums.length ? `<span>Sum: ${fmt(nums.reduce((a, b) => a + b, 0))}</span>` : ''}` : '';
}
const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2 });

/** Type a value into a cell like a person would (used by the demo recording). */
export function typeInto(address: string, text: string, ms = 600) {
  const [r, c] = parse(address); WB.select(r, c);
  const cell = document.querySelector<HTMLElement>(`[data-cell="${address}"]`)!; const fv = $('#fv');
  cell.classList.add('editing'); let i = 0; const steps = Math.max(1, text.length);
  return new Promise<void>(res => {
    const tick = () => {
      i++; const s = text.slice(0, i); cell.textContent = s; fv.textContent = s;
      if (i < steps) setTimeout(tick, ms / steps); else setTimeout(() => {
        cell.classList.remove('editing');
        const num = Number(text.replace(/,/g, ''));
        WB.set(r, c, text.startsWith('=') ? { f: text, v: '' } : { v: text !== '' && !isNaN(num) ? num : text });
        WB.render(); WB.select(Math.min(r + 1, ROWS - 1), c); res();
      }, 140);
    };
    tick();
  });
}
