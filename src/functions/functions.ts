// Custom functions available in any cell as =GRIDLINE.<NAME>(…). Metadata lives in functions.json.
import { DEMO_DEALS, PRICES, fxRate } from '../lib/data';

/**
 * Exchange rate between two currencies.
 * @customfunction FX
 * @param from Currency code, e.g. "USD"
 * @param to Currency code, e.g. "EUR"
 * @returns Rate from → to
 */
export function fx(from: string, to: string): number {
  try { return fxRate(from, to); } catch (e) { throw new CustomFunctions.Error(CustomFunctions.ErrorCode.invalidValue, (e as Error).message); }
}

/**
 * List price of a product by SKU.
 * @customfunction PRICE
 * @param sku Product SKU, e.g. "GL-TEAM"
 * @param qty Optional quantity (default 1)
 */
export function price(sku: string, qty?: number): number {
  const p = PRICES[String(sku).trim().toUpperCase()];
  if (!p) throw new CustomFunctions.Error(CustomFunctions.ErrorCode.notAvailable, `No SKU ${sku}`);
  return p.price * (qty ?? 1);
}

/**
 * One field of a CRM deal, live from the CRM.
 * @customfunction DEAL
 * @param id Deal ID, e.g. "D-1042"
 * @param field stage | amount | company | contact | close
 */
export function deal(id: string, field: string): string | number {
  const d = DEMO_DEALS.find(x => x.id === String(id).trim());
  const f = String(field).toLowerCase() as keyof typeof d;
  if (!d || !(f in d)) throw new CustomFunctions.Error(CustomFunctions.ErrorCode.notAvailable);
  return (d as unknown as Record<string, string | number>)[f];
}

// Registered in the shared runtime (see manifest.xml). Skipped when the page is opened outside Excel.
if (typeof CustomFunctions !== 'undefined') {
  CustomFunctions.associate('FX', fx);
  CustomFunctions.associate('PRICE', price);
  CustomFunctions.associate('DEAL', deal);
}
