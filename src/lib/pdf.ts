import { call } from './gas';
// Builds an invoice PDF in the browser with jsPDF (MIT). Layout is plain and easy to restyle.
import { jsPDF } from 'jspdf';

export interface InvoiceLine { ref: string; text: string; amount: number; }
export interface Invoice { number: string; seller: string; sellerLines: string[]; client: string; contact: string; email: string; currency: string; lines: InvoiceLine[]; issued: Date; dueDays: number; }

export const money = (v: number, cur: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency: cur || 'USD' }).format(v);
const fd = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export function invoicePdf(inv: Invoice): Blob {
  const p = new jsPDF({ unit: 'pt', format: 'a4' }), W = 595.28, L = 56, R = W - 56;
  const ink = () => p.setTextColor(26, 24, 40), mute = () => p.setTextColor(118, 116, 132);
  const total = inv.lines.reduce((s, l) => s + l.amount, 0), due = new Date(inv.issued.getTime() + inv.dueDays * 864e5);
  p.setFillColor(110, 86, 207); p.rect(0, 0, W, 6, 'F');
  let y = 66;
  p.setFont('helvetica', 'bold'); p.setFontSize(15); ink(); p.text(inv.seller, L, y);
  p.setFontSize(22); p.text('Invoice', R, y, { align: 'right' });
  p.setFont('helvetica', 'normal'); p.setFontSize(9); mute();
  inv.sellerLines.forEach((s, i) => p.text(s, L, y + 16 + i * 12));
  p.setFontSize(10); p.text(inv.number, R, y + 18, { align: 'right' });
  y += 70; p.setDrawColor(228, 226, 236); p.line(L, y, R, y); y += 22;
  const c = [L, L + 230, L + 360];
  p.setFontSize(8); mute(); ['BILL TO', 'ISSUED', 'DUE'].forEach((t, i) => p.text(t, c[i], y));
  p.setFontSize(10.5); ink(); p.setFont('helvetica', 'bold');
  p.text(inv.client, c[0], y + 16); p.text(fd(inv.issued), c[1], y + 16); p.text(fd(due), c[2], y + 16);
  p.setFont('helvetica', 'normal'); p.setFontSize(9); mute(); p.text(inv.contact, c[0], y + 29); p.text(inv.email, c[0], y + 41);
  y += 62; p.line(L, y, R, y); y += 26;
  p.setFontSize(8); mute(); p.text('REF', L, y); p.text('DESCRIPTION', L + 70, y); p.text('AMOUNT', R, y, { align: 'right' });
  y += 8; p.setFontSize(10);
  inv.lines.forEach(l => {
    if (y > 740) { p.addPage(); y = 60; }
    p.line(L, y, R, y); ink(); p.text(l.ref, L, y + 18); p.text(p.splitTextToSize(l.text, 300), L + 70, y + 18); p.text(money(l.amount, inv.currency), R, y + 18, { align: 'right' }); y += 30;
  });
  p.line(L, y, R, y); y += 26;
  p.setFont('helvetica', 'bold'); p.setFontSize(13); ink(); p.text('Total', R - 170, y); p.text(money(total, inv.currency), R, y, { align: 'right' });
  p.setFont('helvetica', 'normal'); p.setFontSize(8.5); mute(); p.text('Generated in Google Sheets with Gridline', L, 800);
  return p.output('blob');
}

/** Save the PDF to the "Gridline invoices" folder in the user's Google Drive. Returns the file URL. */
export async function saveToDrive(blob: Blob, name: string): Promise<string> {
  const b64 = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(blob); });
  return call<string>('savePdf', name, b64);
}
