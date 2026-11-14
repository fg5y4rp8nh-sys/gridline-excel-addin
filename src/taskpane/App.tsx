import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { COLUMNS, DEMO_DEALS, Row, STAGES, SYNCED, dealToRow, col } from '../lib/data';
import { Change, Settings, fetchDeals, loadSettings, pushChanges, saveSettings, testConnection } from '../lib/api';
import { Block, colLetter, onSelectionChanged, readSelection, readUsed, replaceUsed, selectRange, writeCell, writeColumn, writeTable } from '../lib/excel';
import { Issue, IssueKind, fix, issueCount, scan } from '../lib/clean';
import { download, invoicePdf, money } from '../lib/pdf';
import { Btn, Card, Chip, Empty, Icon } from './ui';

type Tab = 'import' | 'clean' | 'formulas' | 'export' | 'sync';
const TABS: [Tab, string, JSX.Element][] = [['import', 'Import', Icon.import], ['clean', 'Clean', Icon.clean], ['formulas', 'Formulas', Icon.fx], ['export', 'Invoice', Icon.pdf], ['sync', 'Sync', Icon.sync]];
const SNAP_KEY = 'gridline-snapshot';
type Snapshot = Record<string, Record<string, string | number>>;

export default function App() {
  const [tab, setTab] = useState<Tab>(() => { const t = ((window as unknown as { __GRIDLINE_TAB?: Tab }).__GRIDLINE_TAB ?? new URLSearchParams(location.search).get('tab')) as Tab | null; return t && TABS.some(x => x[0] === t) ? t : 'import'; });
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [crm, setCrm] = useState('Connecting…');
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState<{ text: string; undo?: () => void } | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot>(() => { try { return JSON.parse(localStorage.getItem(SNAP_KEY) || '{}'); } catch { return {}; } });
  const [changes, setChanges] = useState<Change[]>([]);
  const toastT = useRef<number>();

  const say = useCallback((text: string, undo?: () => void) => {
    setToast({ text, undo }); window.clearTimeout(toastT.current); toastT.current = window.setTimeout(() => setToast(null), 3600);
  }, []);
  useEffect(() => { const h = (e: Event) => setTab((e as CustomEvent<Tab>).detail); window.addEventListener('gridline:open', h); return () => window.removeEventListener('gridline:open', h); }, []);
  useEffect(() => { testConnection(settings).then(setCrm).catch(e => setCrm('Offline · ' + e.message)); }, [settings]);
  useEffect(() => { try { localStorage.setItem(SNAP_KEY, JSON.stringify(snapshot)); } catch { /* ignore */ } }, [snapshot]);

  /** Compare the sheet with what came from the CRM, field by field. */
  const diff = useCallback(async () => {
    const b = await readUsed(); if (!b || !Object.keys(snapshot).length) return setChanges([]);
    const H = b.values[0].map(String), iId = H.indexOf('ID'), out: Change[] = [];
    b.values.slice(1).forEach(r => {
      const s = snapshot[String(r[iId])]; if (!s) return;
      SYNCED.forEach(f => { const i = H.indexOf(f); if (i >= 0 && String(r[i]) !== String(s[f])) out.push({ id: String(r[iId]), field: f, from: s[f], to: r[i] }); });
    });
    setChanges(out);
  }, [snapshot]);
  useEffect(() => { let off: (() => void) | undefined; onSelectionChanged(() => diff()).then(f => (off = f)); return () => off && off(); }, [diff]);

  return (
    <div className="gl">
      <header className="gl-h">
        <div className="logo"><span className="mark">{Icon.cell}</span><div><b>Gridline</b><span className={`conn${crm.startsWith('Offline') ? ' off' : ''}`}><i />{crm}</span></div></div>
        <button className="ibtn" aria-label="Settings" onClick={() => setShowSettings(true)}>{Icon.gear}</button>
      </header>
      <nav className="gl-tabs" role="tablist">
        {TABS.map(([id, label, ic]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} data-tab={id} onClick={() => { setTab(id); setToast(null); if (id === 'sync') diff(); }}>
            {ic}<span>{label}</span>{id === 'sync' && changes.length > 0 && <em>{changes.length}</em>}
          </button>
        ))}
      </nav>
      <main className="gl-b" key={tab}>
        {tab === 'import' && <ImportPanel settings={settings} say={say} onImported={snap => { setSnapshot(snap); setChanges([]); }} />}
        {tab === 'clean' && <CleanPanel say={say} />}
        {tab === 'formulas' && <FormulasPanel say={say} />}
        {tab === 'export' && <InvoicePanel say={say} />}
        {tab === 'sync' && <SyncPanel settings={settings} changes={changes} say={say} onPushed={() => {
          setSnapshot(s => { const n = { ...s }; changes.forEach(c => { n[c.id] = { ...n[c.id], [c.field]: c.to }; }); return n; }); setChanges([]);
        }} />}
      </main>
      {toast && <div className="gl-toast" role="status"><span className="ok">{Icon.check}</span><span>{toast.text}</span>{toast.undo && <button onClick={() => { toast.undo!(); setToast(null); }}>Undo</button>}</div>}
      {showSettings && <SettingsSheet value={settings} onClose={() => setShowSettings(false)} onSave={s => { saveSettings(s); setSettings(s); setShowSettings(false); say('Settings saved'); }} />}
    </div>
  );
}

/* ---------------- Import ---------------- */
function ImportPanel({ settings, say, onImported }: { settings: Settings; say: (t: string) => void; onImported: (s: Snapshot) => void }) {
  const [stages, setStages] = useState<string[]>(['Qualified', 'Proposal', 'Negotiation', 'Won']);
  const [owner, setOwner] = useState('Everyone');
  const [cols, setCols] = useState<string[]>([...COLUMNS]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ n: number; address: string; ms: number } | null>(null);
  const count = DEMO_DEALS.filter(d => stages.includes(d.stage) && (owner === 'Everyone' || d.owner === owner)).length;
  const toggle = <T,>(arr: T[], v: T) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];

  async function run() {
    setBusy(true); const t0 = performance.now();
    try {
      const deals = await fetchDeals(settings, { stages, owner });
      const keep = COLUMNS.map((c, i) => [c, i] as const).filter(([c]) => cols.includes(c));
      const rows = deals.map(d => { const r = dealToRow(d); return keep.map(([, i]) => r[i]); });
      const header = keep.map(([c]) => c);
      const address = await writeTable(header, rows, { numberCols: [header.indexOf('Amount')].filter(i => i >= 0) });
      const snap: Snapshot = {}; deals.forEach(d => { snap[d.id] = { Stage: d.stage, Amount: d.amount, 'Close date': d.close }; });
      onImported(snap);
      setDone({ n: deals.length, address, ms: performance.now() - t0 });
      say(`${deals.length} deals imported`);
    } catch (e) { say('Import failed — ' + (e as Error).message); }
    setBusy(false);
  }
  return <>
    {done && <div className="result"><span className="ok">{Icon.check}</span><div><b>{done.n} deals in {done.address}</b><span>Header styled, amounts formatted, columns auto-fitted · {(done.ms / 1000).toFixed(1)}s</span></div></div>}
    <Card title="Deals" sub={`From ${settings.demo ? 'Demo CRM' : new URL(settings.baseUrl).host}`}>
      <div className="lbl">Stage</div>
      <div className="chips">{STAGES.map(s => <Chip key={s} on={stages.includes(s)} onClick={() => setStages(toggle(stages, s))}>{s}</Chip>)}</div>
      <div className="lbl">Owner</div>
      <div className="seg">{['Everyone', 'Sam', 'Mia', 'Leo'].map(o => <button key={o} className={owner === o ? 'on' : ''} onClick={() => setOwner(o)}>{o}</button>)}</div>
    </Card>
    <Card title="Columns" sub={`${cols.length} of ${COLUMNS.length}`}>
      <div className="chips">{COLUMNS.map(c => <Chip key={c} on={cols.includes(c)} onClick={() => c !== 'ID' && setCols(toggle(cols, c))}>{c}</Chip>)}</div>
    </Card>
    <Btn onClick={run} busy={busy} disabled={!count || !stages.length}>{busy ? 'Fetching from CRM…' : <>{Icon.import}{done ? 'Refresh' : 'Import'} {count} deals</>}</Btn>
  </>;
}

/* ---------------- Clean ---------------- */
function CleanPanel({ say }: { say: (t: string, undo?: () => void) => void }) {
  const [block, setBlock] = useState<Block | null>(null);
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [off, setOff] = useState<Set<IssueKind>>(new Set());
  const [busy, setBusy] = useState(false);
  const rescan = useCallback(async () => { const b = await readUsed(); setBlock(b); setIssues(b ? scan(b.values) : []); }, []);
  useEffect(() => { rescan(); }, [rescan]);
  const on = issues ? issues.filter(x => !off.has(x.kind)) : [];
  const total = on.reduce((s, x) => s + issueCount(x), 0);

  async function apply() {
    if (!block) return; setBusy(true);
    const res = fix(block.values, new Set(on.map(x => x.kind)));
    await replaceUsed(block, res.values);
    const before = block;
    say(`Fixed ${total} issues · ${res.removed.length} duplicate row${res.removed.length === 1 ? '' : 's'} removed`, async () => { await replaceUsed({ ...before, values: res.values }, before.values); rescan(); });
    setBusy(false); rescan();
  }
  if (!issues) return <Empty icon={Icon.clean} title="Scanning…" text="Checking the used range on this sheet." />;
  if (!block) return <Empty icon={Icon.cell} title="This sheet is empty" text="Import deals first, or open a sheet with data." />;
  return <>
    <Card title={issues.length ? `${issues.reduce((s, x) => s + issueCount(x), 0)} issues found` : 'All clean'} sub={`${block.sheet}!${block.address} · ${block.values.length - 1} rows`} right={<button className="link" onClick={rescan}>Rescan</button>}>
      {issues.length ? <ul className="issues">{issues.map(x => (
        <li key={x.kind} className={off.has(x.kind) ? 'skip' : ''}>
          <button className={`tick${off.has(x.kind) ? '' : ' on'}`} aria-label={`Fix ${x.title}`} onClick={() => { const n = new Set(off); n.has(x.kind) ? n.delete(x.kind) : n.add(x.kind); setOff(n); }}>{Icon.check}</button>
          <div><b>{x.title}</b><span>{x.hint}</span></div><em>{issueCount(x)}</em>
        </li>))}</ul>
        : <Empty icon={Icon.check} title="Nothing to fix" text="No duplicates, stray spaces or messy formats." />}
    </Card>
    {issues.length > 0 && <Btn onClick={apply} busy={busy} disabled={!total}>{Icon.clean}Fix {total} issues</Btn>}
  </>;
}

/* ---------------- Formulas ---------------- */
const FUNCS = [
  { name: 'FX', sig: '=GRIDLINE.FX(from, to)', text: 'Live exchange rate between two currencies.', ex: '=GRIDLINE.FX("USD","EUR")' },
  { name: 'PRICE', sig: '=GRIDLINE.PRICE(sku, [qty])', text: 'List price from your product catalogue.', ex: '=GRIDLINE.PRICE("GL-TEAM",3)' },
  { name: 'DEAL', sig: '=GRIDLINE.DEAL(id, field)', text: 'Any field of a CRM deal, always up to date.', ex: '=GRIDLINE.DEAL("D-1048","stage")' }
];
function FormulasPanel({ say }: { say: (t: string) => void }) {
  const [busy, setBusy] = useState(false);
  async function addEur() {
    const b = await readUsed(); if (!b) return say('Import deals first');
    const H = b.values[0].map(String), a = H.indexOf('Amount'), c = H.indexOf('Currency');
    if (a < 0 || c < 0) return say('Needs Amount and Currency columns');
    setBusy(true);
    const at = H.indexOf('Amount (EUR)') >= 0 ? H.indexOf('Amount (EUR)') : H.length;
    const f = b.values.slice(1).map((_, i) => `=${colLetter(a)}${i + 2}*GRIDLINE.FX(${colLetter(c)}${i + 2},"EUR")`);
    await writeColumn(at, 'Amount (EUR)', f);
    await selectRange(`${colLetter(at)}2:${colLetter(at)}${f.length + 1}`);
    setBusy(false); say(`Amount (EUR) added to column ${colLetter(at)}`);
  }
  return <>
    <Card title="Quick action" sub="Convert every deal to one currency">
      <div className="qa"><code>=H2*GRIDLINE.FX(I2,"EUR")</code><span>filled down for each row</span></div>
      <Btn onClick={addEur} busy={busy}>{Icon.plus}Add “Amount (EUR)” column</Btn>
    </Card>
    <div className="lbl pad">Custom functions</div>
    {FUNCS.map(f => <Card key={f.name}>
      <div className="fn"><code>{f.sig}</code><p>{f.text}</p><div className="fn-ex"><code>{f.ex}</code><button className="link" data-fn={f.name} onClick={async () => { const a = await writeCell(f.ex); say(`Inserted in ${a}`); }}>Insert</button></div></div>
    </Card>)}
  </>;
}

/* ---------------- Invoice ---------------- */
function InvoicePanel({ say }: { say: (t: string) => void }) {
  const [sel, setSel] = useState<{ rows: Row[]; H: string[]; address: string } | null>(null);
  const [due, setDue] = useState(14);
  const [n, setN] = useState(() => Number(localStorage.getItem('gridline-inv') || 49));
  const load = useCallback(async () => {
    const [s, u] = await Promise.all([readSelection(), readUsed()]);
    if (!u) return setSel(null);
    const H = u.values[0].map(String), from = Math.max(s.rowIndex, 1), to = s.rowIndex + s.values.length;
    setSel({ rows: u.values.slice(from, to).filter(r => r[0] !== ''), H, address: s.address });
  }, []);
  useEffect(() => { load(); let off: (() => void) | undefined; onSelectionChanged(load).then(f => (off = f)); return () => off && off(); }, [load]);
  const lines = useMemo(() => {
    if (!sel) return [];
    const i = (c: string) => sel.H.indexOf(c);
    return sel.rows.map(r => ({ ref: String(r[i('ID')]), text: String(r[i('Deal')]), amount: Number(r[i('Amount')]) || 0, company: String(r[i('Company')]).trim(), contact: String(r[i('Contact')]), email: String(r[i('Email')]), currency: String(r[i('Currency')]) }));
  }, [sel]);
  if (!sel || !lines.length) return <Empty icon={Icon.cell} title="Select some deal rows" text="Pick one or more rows in the sheet — they become lines on the invoice." />;
  const first = lines[0], companies = new Set(lines.map(l => l.company)), total = lines.reduce((s, l) => s + l.amount, 0), num = `INV-${String(n).padStart(4, '0')}`;
  async function make() {
    const blob = invoicePdf({ number: num, seller: 'Mason & Reid Studio', sellerLines: ['214 Pearl Street, Brooklyn, NY 11201', 'billing@masonreid.studio'], client: first.company, contact: first.contact, email: first.email, currency: first.currency, lines, issued: new Date(), dueDays: due });
    if (!(window as unknown as { __REC?: boolean }).__REC) download(blob, `${num}.pdf`);
    localStorage.setItem('gridline-inv', String(n + 1)); setN(n + 1); say(`${num}.pdf downloaded · ${money(total, first.currency)}`);
  }
  return <>
    <Card title={first.company} sub={`${lines.length} line${lines.length > 1 ? 's' : ''} from ${sel.address}`} right={<span className="pill">{num}</span>}>
      {companies.size > 1 && <p className="warn">Rows from {companies.size} companies — the invoice goes to {first.company}.</p>}
      <ul className="lines">{lines.map((l, i) => <li key={i}><span className="mono">{l.ref}</span><b>{l.text}</b><em>{money(l.amount, first.currency)}</em></li>)}</ul>
      <div className="tot"><span>Total</span><b>{money(total, first.currency)}</b></div>
    </Card>
    <Card title="Payment terms">
      <div className="seg">{[7, 14, 30].map(d => <button key={d} className={due === d ? 'on' : ''} onClick={() => setDue(d)}>Net {d}</button>)}</div>
    </Card>
    <Btn onClick={make}>{Icon.pdf}Download invoice PDF</Btn>
  </>;
}

/* ---------------- Sync ---------------- */
function SyncPanel({ settings, changes, say, onPushed }: { settings: Settings; changes: Change[]; say: (t: string) => void; onPushed: () => void }) {
  const [busy, setBusy] = useState(false);
  if (!changes.length) return <Empty icon={Icon.sync} title="Everything is in sync" text="Edit Stage, Amount or Close date in the sheet and the changes show up here." />;
  const fmt = (f: string, v: string | number) => f === 'Amount' ? Number(v).toLocaleString('en-US') : String(v);
  return <>
    <Card title={`${changes.length} change${changes.length > 1 ? 's' : ''} to push`} sub="Edited in the sheet since the last import">
      <ul className="chg">{changes.map((c, i) => <li key={i}><span className="mono">{c.id}</span><div><b>{c.field}</b><span><s>{fmt(c.field, c.from)}</s>{Icon.arrow}<ins>{fmt(c.field, c.to)}</ins></span></div></li>)}</ul>
    </Card>
    <Btn busy={busy} onClick={async () => { setBusy(true); const n = await pushChanges(settings, changes); setBusy(false); onPushed(); say(`${n} change${n > 1 ? 's' : ''} saved to ${settings.demo ? 'Demo CRM' : 'your CRM'}`); }}>{busy ? 'Saving to CRM…' : <>{Icon.sync}Push to CRM</>}</Btn>
  </>;
}

/* ---------------- Settings ---------------- */
function SettingsSheet({ value, onClose, onSave }: { value: Settings; onClose: () => void; onSave: (s: Settings) => void }) {
  const [s, setS] = useState(value);
  const [test, setTest] = useState('');
  return <div className="sheet" role="dialog" aria-label="Settings">
    <div className="sheet-c">
      <div className="card-h"><div><h3>Connection</h3><p>Where Gridline reads and writes deals</p></div><button className="ibtn" onClick={onClose} aria-label="Close">{Icon.x}</button></div>
      <label className="row"><span>Use Demo CRM</span><button className={`sw${s.demo ? ' on' : ''}`} role="switch" aria-checked={s.demo} onClick={() => setS({ ...s, demo: !s.demo })}><i /></button></label>
      <label className="fld"><span>API base URL</span><input value={s.baseUrl} disabled={s.demo} onChange={e => setS({ ...s, baseUrl: e.target.value })} /></label>
      <label className="fld"><span>API key</span><input type="password" value={s.apiKey} disabled={s.demo} placeholder="sk_live_…" onChange={e => setS({ ...s, apiKey: e.target.value })} /></label>
      {test && <p className="note">{test}</p>}
      <div className="two"><Btn kind="ghost" onClick={async () => { setTest('Testing…'); try { setTest('Connected to ' + await testConnection(s)); } catch (e) { setTest('Failed: ' + (e as Error).message); } }}>Test</Btn><Btn onClick={() => onSave(s)}>Save</Btn></div>
    </div>
  </div>;
}

export const __cols = { col };
