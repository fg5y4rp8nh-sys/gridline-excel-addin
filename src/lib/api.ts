// CRM API client. Point it at your own REST API in Settings, or keep "Demo CRM" to try the add-in.
import { DEMO_DEALS, Deal } from './data';
import { call } from './gas';
import { store } from './store';

export interface Settings { baseUrl: string; apiKey: string; demo: boolean; }
export interface DealQuery { stages: string[]; owner: string; }
export interface Change { id: string; field: string; from: string | number; to: string | number; }

const KEY = 'gridline-settings';
export const loadSettings = (): Settings => {
  try { const s = JSON.parse(store.get(KEY) || 'null'); if (s) return s; } catch { /* ignore */ }
  return { baseUrl: 'https://api.your-crm.com/v1', apiKey: '', demo: true };
};
export const saveSettings = (s: Settings) => { try { store.set(KEY, JSON.stringify(s)); } catch { /* ignore */ } };

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

/** Real CRM calls go through Code.gs (UrlFetchApp), so the API key never reaches the browser and CORS is not an issue. */
async function http<T>(s: Settings, path: string, init?: { method?: string; body?: string }): Promise<T> {
  return call<T>('crmFetch', s.baseUrl, s.apiKey, path, init?.method || 'GET', init?.body || null);
}

/** GET /deals?stage=…&owner=… → Deal[] */
export async function fetchDeals(s: Settings, q: DealQuery): Promise<Deal[]> {
  if (s.demo) {
    await wait(650);
    return DEMO_DEALS.filter(d => q.stages.includes(d.stage) && (q.owner === 'Everyone' || d.owner === q.owner));
  }
  const p = new URLSearchParams({ stage: q.stages.join(','), owner: q.owner });
  return http<Deal[]>(s, `/deals?${p}`);
}

/** PATCH /deals/:id with the changed fields */
export async function pushChanges(s: Settings, changes: Change[]): Promise<number> {
  if (s.demo) { await wait(700); return changes.length; }
  const byId = new Map<string, Record<string, unknown>>();
  changes.forEach(c => byId.set(c.id, { ...(byId.get(c.id) || {}), [c.field]: c.to }));
  await Promise.all([...byId].map(([id, body]) => http(s, `/deals/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(body) })));
  return changes.length;
}

export async function testConnection(s: Settings): Promise<string> {
  if (s.demo) { await wait(400); return 'Demo CRM'; }
  const me = await http<{ workspace?: string }>(s, '/me');
  return me.workspace || new URL(s.baseUrl).host;
}
