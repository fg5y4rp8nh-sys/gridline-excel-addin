// Small key/value store for the sidebar. Values live in the document's properties on the server
// (so the import snapshot travels with the spreadsheet) and are cached in memory for instant reads.
import { call } from './gas';

let cache: Record<string, string> = {};

export async function loadStore() { cache = (await call<Record<string, string>>('storeGetAll')) || {}; }

export const store = {
  get(key: string): string | null { return key in cache ? cache[key] : null; },
  set(key: string, value: string) { if (cache[key] === value) return; cache[key] = value; call('storeSet', key, value).catch(() => { /* retried on next write */ }); }
};
