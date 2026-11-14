// Demo entry: installs the mock Office API, builds the spreadsheet window and mounts the real task pane.
import './install';
import '../src/functions/functions';
import './host.css';
import { buildHost, typeInto } from './host';
import { WB, parse } from './mock';
import { mount } from '../src/taskpane/main';
import { readUsed, replaceUsed } from '../src/lib/excel';
import { fix, scan, issueCount, IssueKind } from '../src/lib/clean';

declare const SOUNDS: Record<string, string> | undefined;
const REC = !!(window as unknown as { __REC?: boolean }).__REC;

/* ---- soft UI sounds for the demo ---- */
const SFX = (() => {
  let ctx: AudioContext | null = null; const bufs: Record<string, AudioBuffer> = {}; let last = -1e9;
  (window as unknown as { __sfx: unknown[] }).__sfx = [];
  const init = () => {
    if (ctx || REC || typeof SOUNDS === 'undefined') return; ctx = new AudioContext();
    Object.keys(SOUNDS).forEach(k => { const b = atob(SOUNDS![k]), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); ctx!.decodeAudioData(u.buffer).then(x => (bufs[k] = x)).catch(() => { }); });
  };
  addEventListener('pointerdown', init, { once: true, capture: true });
  const play = (n: string, v = 1) => {
    last = performance.now();
    if (REC) { (window as unknown as { __sfx: unknown[]; __vt: number }).__sfx.push([n, (window as unknown as { __vt: number }).__vt || 0, v]); return; }
    if (!ctx || !bufs[n]) return; const s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = bufs[n]; g.gain.value = v; s.connect(g).connect(ctx.destination); s.start();
  };
  return { play, recent: () => performance.now() - last < 40 };
})();

let mounted = false;
function openPane(tab?: string) {
  const was = document.body.classList.contains('pane-on');
  document.body.classList.add('pane-on');
  if (!was) SFX.play('open');
  if (!mounted) { mounted = true; mount(document.getElementById('root')!); }
  if (tab) setTimeout(() => window.dispatchEvent(new CustomEvent('gridline:open', { detail: tab })), mounted ? 0 : 60);
}
buildHost(openPane);
// "Quick clean" ribbon button: same code as src/commands/commands.ts, runs without the pane
document.querySelector('[data-quick]')?.addEventListener('click', async () => {
  const b = await readUsed(); if (!b) return;
  const all = new Set<IssueKind>(['duplicates', 'spaces', 'names', 'phones', 'emails']);
  const n = scan(b.values).reduce((s, x) => s + issueCount(x), 0);
  await replaceUsed(b, fix(b.values, all).values);
  const st = document.getElementById('stL')!; st.textContent = n ? `Gridline fixed ${n} issues` : 'Gridline: nothing to fix'; setTimeout(() => (st.textContent = 'Ready'), 4000);
});

document.addEventListener('click', e => { if (!SFX.recent() && (e.target as HTMLElement).closest('button')) SFX.play('click'); });
document.addEventListener('mousedown', e => { if ((e.target as HTMLElement).closest('[data-rc],[data-row]')) SFX.play('tick', .5); });
new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if ((n as HTMLElement).classList?.contains('gl-toast')) SFX.play('ding', .7); }))).observe(document.body, { childList: true, subtree: true });

/* ---- helpers for the demo recording ---- */
(window as unknown as Record<string, unknown>).HOST = {
  open: openPane,
  select: (a: string) => { const [r0, c0, r1, c1] = parse(a); WB.select(r0, c0, r1, c1); SFX.play('tick', .5); },
  type: (a: string, t: string, ms?: number) => { SFX.play('tick', .5); return typeInto(a, t, ms); },
  wb: WB
};
