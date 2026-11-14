// Data clean-up rules. Pure functions over a 2D array (header row + data rows), so they are easy to test.
import { Row, col } from './data';

export type IssueKind = 'duplicates' | 'spaces' | 'names' | 'phones' | 'emails';
export interface Issue { kind: IssueKind; title: string; hint: string; cells: [number, number][]; rows: number[]; }

const titleCase = (s: string) => s.toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (_, a, c) => a + c.toUpperCase());
/** Only names typed all in lower or upper case are fixed, so "Daan de Vries" or "McKenzie" stay as they are. */
const badCase = (s: string) => /\p{L}/u.test(s) && (s === s.toLowerCase() || s === s.toUpperCase());
const squeeze = (s: string) => s.replace(/\s+/g, ' ').trim();
export function formatPhone(p: string): string {
  const d = p.replace(/\D/g, '');
  if (p.trim().startsWith('+') && d[0] !== '1') return squeeze(p);
  if (d.length === 10) return `+1 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length === 11 && d[0] === '1') return `+1 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  return p.startsWith('+') ? squeeze(p) : '+' + d;
}

export function scan(values: Row[]): Issue[] {
  const H = values[0] || [], rows = values.slice(1);
  const iCon = H.indexOf('Contact'), iMail = H.indexOf('Email'), iPh = H.indexOf('Phone'), iId = H.indexOf('ID');
  const out: Record<IssueKind, Issue> = {
    duplicates: { kind: 'duplicates', title: 'Duplicate rows', hint: 'Same deal ID appears more than once', cells: [], rows: [] },
    spaces: { kind: 'spaces', title: 'Extra spaces', hint: 'Leading, trailing or double spaces', cells: [], rows: [] },
    names: { kind: 'names', title: 'Name capitalisation', hint: 'e.g. “ethan brooks” → “Ethan Brooks”', cells: [], rows: [] },
    phones: { kind: 'phones', title: 'Phone formats', hint: 'Mixed formats → +1\u00a0(415)\u00a0555\u20110132', cells: [], rows: [] },
    emails: { kind: 'emails', title: 'Email case', hint: 'Upper-case letters in addresses', cells: [], rows: [] }
  };
  const seen = new Set<string>();
  rows.forEach((r, i) => {
    const R = i + 1;
    const key = iId >= 0 ? String(r[iId]).trim() : r.join('|');
    if (seen.has(key)) { out.duplicates.rows.push(R); return; }
    seen.add(key);
    r.forEach((v, c) => { if (typeof v === 'string' && v !== squeeze(v)) out.spaces.cells.push([R, c]); });
    if (iCon >= 0) { const v = squeeze(String(r[iCon])); if (v && badCase(v)) out.names.cells.push([R, iCon]); }
    if (iPh >= 0) { const v = String(r[iPh]); if (v && v !== formatPhone(v)) out.phones.cells.push([R, iPh]); }
    if (iMail >= 0) { const v = String(r[iMail]); if (v !== v.toLowerCase()) out.emails.cells.push([R, iMail]); }
  });
  return Object.values(out).filter(x => x.cells.length || x.rows.length);
}

export const issueCount = (x: Issue) => x.cells.length + x.rows.length;

/** Returns the fixed values (same shape minus removed rows) and the row indexes that were removed. */
export function fix(values: Row[], kinds: Set<IssueKind>): { values: Row[]; removed: number[]; changed: [number, number][] } {
  const issues = scan(values).filter(x => kinds.has(x.kind));
  const H = values[0], next = values.map(r => [...r]);
  const changed: [number, number][] = [];
  const iCon = H.indexOf('Contact'), iPh = H.indexOf('Phone'), iMail = H.indexOf('Email');
  for (const x of issues) for (const [r, c] of x.cells) {
    const v = String(next[r][c]);
    const nv = x.kind === 'spaces' ? squeeze(v) : x.kind === 'names' && c === iCon ? titleCase(squeeze(v)) : x.kind === 'phones' && c === iPh ? formatPhone(v) : x.kind === 'emails' && c === iMail ? v.toLowerCase() : v;
    if (nv !== next[r][c]) { next[r][c] = nv; changed.push([r, c]); }
  }
  const removed = issues.filter(x => x.kind === 'duplicates').flatMap(x => x.rows).sort((a, b) => a - b);
  return { values: next.filter((_, i) => !removed.includes(i)), removed, changed };
}

export const _test = { titleCase, squeeze, col };
