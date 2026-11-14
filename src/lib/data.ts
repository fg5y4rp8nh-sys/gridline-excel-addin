// Shared types, sample CRM data and reference tables used by the add-in and the custom functions.

export type Cell = string | number;
export type Row = Cell[];

export const COLUMNS = ['ID', 'Deal', 'Company', 'Contact', 'Email', 'Phone', 'Stage', 'Amount', 'Currency', 'Close date'] as const;
export type Column = typeof COLUMNS[number];
export const col = (name: Column) => COLUMNS.indexOf(name);
/** Fields that can be edited in the sheet and pushed back to the CRM */
export const SYNCED: Column[] = ['Stage', 'Amount', 'Close date'];
export const STAGES = ['Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'] as const;

export interface Deal {
  id: string; name: string; company: string; contact: string; email: string; phone: string;
  stage: string; amount: number; currency: string; close: string; owner: string;
}

export const dealToRow = (d: Deal): Row => [d.id, d.name, d.company, d.contact, d.email, d.phone, d.stage, d.amount, d.currency, d.close];

/* Demo CRM. The data is deliberately a little messy (extra spaces, lower-case names,
   mixed phone formats and duplicate records) so the Clean tab has something to fix. */
export const DEMO_DEALS: Deal[] = [
  { id: 'D-1042', name: 'Annual licence renewal', company: 'Northwind Traders', contact: 'Olivia Chen', email: 'olivia@northwind.co', phone: '(415) 555-0132', stage: 'Negotiation', amount: 18400, currency: 'USD', close: '2026-11-28', owner: 'Sam' },
  { id: 'D-1043', name: 'Onboarding package', company: ' Harbor & Co ', contact: 'ethan brooks', email: 'ethan@harborco.com', phone: '415.555.0198', stage: 'Proposal', amount: 6200, currency: 'USD', close: '2026-12-05', owner: 'Sam' },
  { id: 'D-1044', name: 'Team plan — 40 seats', company: 'Lumen Dental', contact: 'Grace Whitfield', email: 'grace@lumendental.com', phone: '+1 512 555 0144', stage: 'Qualified', amount: 9600, currency: 'USD', close: '2026-12-12', owner: 'Mia' },
  { id: 'D-1045', name: 'EU expansion', company: 'Fable Books', contact: 'Noah Bennett', email: 'noah@fablebooks.co', phone: '(206) 555-0111', stage: 'Proposal', amount: 14200, currency: 'EUR', close: '2026-12-18', owner: 'Mia' },
  { id: 'D-1046', name: 'Support add-on', company: 'Tidewater Hotels', contact: 'AVA THOMPSON', email: 'ava.t@tidewater.com', phone: '843 555 0170', stage: 'Won', amount: 3600, currency: 'USD', close: '2026-11-08', owner: 'Sam' },
  { id: 'D-1047', name: 'Data migration', company: 'Copper Kettle', contact: 'Ruby Coleman', email: 'ruby@copperkettle.co', phone: '(912) 555-0108', stage: 'Negotiation', amount: 7800, currency: 'USD', close: '2026-11-30', owner: 'Leo' },
  { id: 'D-1048', name: 'Enterprise pilot', company: 'Orbit Legal', contact: 'Chloe Martin', email: 'chloe@orbitlegal.com', phone: '617.555.0163', stage: 'Qualified', amount: 22000, currency: 'USD', close: '2027-01-15', owner: 'Leo' },
  { id: 'D-1049', name: 'Compliance pack', company: 'Orbit Legal', contact: 'Chloe Martin', email: 'chloe@orbitlegal.com', phone: '617.555.0163', stage: 'Proposal', amount: 5200, currency: 'USD', close: '2026-12-22', owner: 'Leo' },
  { id: 'D-1050', name: 'UK rollout', company: 'Kestrel Studio', contact: 'james  carter', email: 'james@kestrel.studio', phone: '+44 20 7946 0112', stage: 'Proposal', amount: 11500, currency: 'GBP', close: '2026-12-20', owner: 'Sam' },
  { id: 'D-1051', name: 'Analytics module', company: 'Northline Fitness', contact: 'Lily Nguyen', email: 'lily@northlinefit.com', phone: '305-555-0150', stage: 'Negotiation', amount: 8400, currency: 'USD', close: '2026-12-02', owner: 'Leo' },
  { id: 'D-1042', name: 'Annual licence renewal', company: 'Northwind Traders', contact: 'Olivia Chen', email: 'olivia@northwind.co', phone: '(415) 555-0132', stage: 'Negotiation', amount: 18400, currency: 'USD', close: '2026-11-28', owner: 'Sam' },
  { id: 'D-1052', name: 'Multi-site licence', company: 'Bluepeak Clinics ', contact: 'Daniel Ortiz', email: 'daniel@bluepeak.health', phone: '(303) 555-0186', stage: 'Qualified', amount: 31000, currency: 'USD', close: '2027-01-30', owner: 'Mia' },
  { id: 'D-1053', name: 'Renewal + 10 seats', company: 'Harbor & Co', contact: 'Ethan Brooks', email: 'ethan@harborco.com', phone: '415.555.0198', stage: 'Proposal', amount: 6200, currency: 'USD', close: '2026-12-05', owner: 'Sam' },
  { id: 'D-1054', name: 'Training days', company: 'Saltmarsh Foods', contact: 'Hannah Lee', email: 'hannah@saltmarsh.com', phone: '(207) 555-0139', stage: 'Lost', amount: 4300, currency: 'USD', close: '2026-10-29', owner: 'Leo' },
  { id: 'D-1055', name: 'Benelux partnership', company: 'Vandal Design', contact: 'Sophie Janssen', email: 'sophie@vandal.nl', phone: '+31 20 555 0190', stage: 'Negotiation', amount: 16800, currency: 'EUR', close: '2026-12-10', owner: 'Mia' },
  { id: 'D-1056', name: 'Self-serve upgrade', company: 'Pinecone Labs', contact: 'zoe adams', email: 'zoe@pineconelabs.io', phone: '415 555 0175', stage: 'Won', amount: 2400, currency: 'USD', close: '2026-11-11', owner: 'Sam' },
  { id: 'D-1057', name: 'Starter plan', company: 'Wildflower Florist', contact: 'Mia Russo', email: 'mia@wildflower.com', phone: '(619) 555-0127', stage: 'Won', amount: 1900, currency: 'USD', close: '2026-11-04', owner: 'Mia' },
  { id: 'D-1058', name: 'Retail POS bundle', company: 'Copper Kettle', contact: 'Ruby Coleman', email: 'ruby.c@copperkettle.co', phone: '(912) 555-0108', stage: 'Qualified', amount: 12600, currency: 'USD', close: '2027-01-08', owner: 'Leo' },
  { id: 'D-1056', name: 'Self-serve upgrade', company: 'Pinecone Labs', contact: 'zoe adams', email: 'zoe@pineconelabs.io', phone: '415 555 0175', stage: 'Won', amount: 2400, currency: 'USD', close: '2026-11-11', owner: 'Sam' },
  { id: 'D-1059', name: 'Nordic launch', company: 'Fjell Outdoor', contact: 'Erik Lund', email: 'erik@fjell.no', phone: '+47 22 55 01 44', stage: 'Negotiation', amount: 19500, currency: 'EUR', close: '2026-12-15', owner: 'Mia' },
  { id: 'D-1060', name: 'Upgrade to Business', company: 'Velvet Studio', contact: 'Freya Clarke', email: 'freya@velvetstudio.co.uk', phone: '+44 20 7946 0484', stage: 'Proposal', amount: 3800, currency: 'GBP', close: '2026-12-10', owner: 'Mia' },
  { id: 'D-1061', name: 'Multi-site licence', company: 'Northstar Clinics', contact: 'Emma Roy', email: 'emma@northstarclinics.ca', phone: '(416) 555-0163', stage: 'Won', amount: 35400, currency: 'CAD', close: '2026-10-17', owner: 'Leo' },
  { id: 'D-1062', name: 'Priority support', company: 'Northstar Clinics', contact: 'emma roy', email: 'emma@northstarclinics.ca', phone: '(416) 555-0163', stage: 'Won', amount: 4000, currency: 'CAD', close: '2026-10-04', owner: 'Leo' },
  { id: 'D-1063', name: 'Upgrade to Business', company: 'Oakline Furniture', contact: 'Diana Park', email: 'diana@oakline.com', phone: '808.555.0150', stage: 'Negotiation', amount: 6600, currency: 'USD', close: '2026-12-04', owner: 'Mia' },
  { id: 'D-1064', name: 'Upgrade to Business', company: 'Redwood Logistics', contact: 'Tyler Grant', email: 'tyler@redwoodlog.com', phone: '312.555.0148', stage: 'Negotiation', amount: 8800, currency: 'USD', close: '2026-12-03', owner: 'Sam' },
  { id: 'D-1065', name: 'Analytics module', company: ' Atlas Freight', contact: 'Marcus Reid', email: 'marcus@atlasfreight.com', phone: '415.555.0175', stage: 'Qualified', amount: 4900, currency: 'USD', close: '2027-02-19', owner: 'Leo' },
  { id: 'D-1066', name: 'Team plan — 25 seats', company: 'Quill & Ink', contact: 'Amelia Hughes', email: 'amelia@quillandink.co.uk', phone: '+44 20 7946 0929', stage: 'Qualified', amount: 5700, currency: 'GBP', close: '2027-02-14', owner: 'Mia' },
  { id: 'D-1067', name: 'Team plan — 60 seats', company: 'Kraftwerk Systems', contact: 'Lukas Weber', email: 'lukas@kraftwerk-sys.de', phone: '+49 30 5550 1115', stage: 'Qualified', amount: 15900, currency: 'EUR', close: '2027-02-24', owner: 'Mia' },
  { id: 'D-1068', name: 'Priority support', company: 'Halcyon Spa', contact: 'Isabel Moreno', email: 'isabel@halcyonspa.co', phone: '(737) 555-0133', stage: 'Lost', amount: 1300, currency: 'USD', close: '2026-10-12', owner: 'Mia' },
  { id: 'D-1069', name: 'Starter plan', company: 'Velvet Studio', contact: 'Freya Clarke', email: 'FREYA@VELVETSTUDIO.CO.UK', phone: '+44 20 7946 0484', stage: 'Won', amount: 1500, currency: 'GBP', close: '2026-11-09', owner: 'Mia' },
  { id: 'D-1070', name: 'Annual licence', company: 'Riverbend Schools', contact: 'Laura Mitchell', email: 'laura@riverbend.edu', phone: '312 555 0147', stage: 'Negotiation', amount: 11500, currency: 'USD', close: '2026-11-28', owner: 'Leo' },
  { id: 'D-1071', name: 'Team plan — 60 seats', company: 'Maple Ridge Realty', contact: 'Liam Tremblay', email: 'liam@mapleridge.ca', phone: '(416) 555-0134', stage: 'Proposal', amount: 23700, currency: 'CAD', close: '2027-01-20', owner: 'Sam' },
  { id: 'D-1072', name: 'Priority support', company: 'Tandem Bikes', contact: 'Daan de Vries', email: 'daan@tandembikes.nl', phone: '+31 20 555 0112', stage: 'Proposal', amount: 2400, currency: 'EUR', close: '2026-12-08', owner: 'Leo' },
  { id: 'D-1073', name: 'Annual licence', company: 'Ironclad Security', contact: 'Victor Hale', email: 'victor@ironcladsec.com', phone: '(312) 555-0173', stage: 'Negotiation', amount: 25400, currency: 'USD', close: '2026-11-20', owner: 'Sam' },
  { id: 'D-1074', name: 'Team plan — 60 seats', company: 'Greenleaf Grocers', contact: 'PRIYA SHAH', email: 'priya@greenleafgrocers.com', phone: '919 555 0175', stage: 'Qualified', amount: 17300, currency: 'USD', close: '2027-01-12', owner: 'Mia' },
  { id: 'D-1075', name: 'Pilot — 3 months', company: 'Helios Solar', contact: 'Jonas Fischer', email: 'jonas@heliossolar.de', phone: '+49 30 5550 1171', stage: 'Lost', amount: 4200, currency: 'EUR', close: '2026-10-05', owner: 'Mia' },
  { id: 'D-1076', name: 'Starter plan', company: 'Cascade Analytics', contact: 'Ben Foster', email: 'ben@cascadeanalytics.io', phone: '(617) 555-0180', stage: 'Negotiation', amount: 2100, currency: 'USD', close: '2026-12-22', owner: 'Sam' },
  { id: 'D-1072', name: 'Priority support', company: 'Tandem Bikes', contact: 'Daan de Vries', email: 'daan@tandembikes.nl', phone: '+31 20 555 0112', stage: 'Proposal', amount: 2400, currency: 'EUR', close: '2026-12-08', owner: 'Leo' },
  { id: 'D-1077', name: 'Annual licence', company: 'Redwood Logistics', contact: 'Tyler Grant', email: 'tyler@redwoodlog.com', phone: '312.555.0148', stage: 'Negotiation', amount: 19200, currency: 'USD', close: '2026-12-04', owner: 'Sam' },
  { id: 'D-1078', name: 'Onboarding package', company: 'Bluebird Bakery', contact: 'Nora Quinn', email: 'nora@bluebirdbakery.com', phone: '720-555-0168', stage: 'Won', amount: 3500, currency: 'USD', close: '2026-09-30', owner: 'Sam' },
  { id: 'D-1079', name: 'Upgrade to Business', company: 'Marlow Estates', contact: 'Oliver  Bennett', email: 'oliver@marlowestates.co.uk', phone: '+44 20 7946 0709', stage: 'Lost', amount: 5000, currency: 'GBP', close: '2026-10-19', owner: 'Mia' },
  { id: 'D-1080', name: 'Renewal + 15 seats', company: 'Southern Cross Media', contact: 'Chloe Nguyen', email: 'chloe@southerncross.com.au', phone: '+61 2 5550 1705', stage: 'Won', amount: 10100, currency: 'AUD', close: '2026-10-30', owner: 'Sam' },
  { id: 'D-1081', name: 'Renewal + 15 seats', company: 'Riverbend Schools', contact: 'Laura Mitchell', email: 'laura@riverbend.edu', phone: '312 555 0147', stage: 'Won', amount: 6800, currency: 'USD', close: '2026-10-21', owner: 'Leo' },
  { id: 'D-1082', name: 'Starter plan', company: 'Brightwater Dental', contact: 'Megan Walsh', email: 'megan@brightwaterdental.com', phone: '737 555 0167', stage: 'Lost', amount: 2200, currency: 'USD', close: '2026-10-22', owner: 'Sam' },
  { id: 'D-1083', name: 'Custom integration', company: ' Brennan Clinics', contact: 'Aoife Byrne', email: 'aoife@brennanclinics.ie', phone: '+353 1 555 0193', stage: 'Proposal', amount: 17900, currency: 'EUR', close: '2027-01-21', owner: 'Sam' },
  { id: 'D-1084', name: 'Upgrade to Business', company: 'Tandem Bikes', contact: 'Daan de Vries', email: 'daan@tandembikes.nl', phone: '+31 20 555 0112', stage: 'Proposal', amount: 5500, currency: 'EUR', close: '2026-12-17', owner: 'Leo' },
  { id: 'D-1085', name: 'Priority support', company: 'Granite Capital', contact: 'Henry Lowe', email: 'henry@granitecap.com', phone: '212.555.0137', stage: 'Proposal', amount: 3200, currency: 'USD', close: '2027-01-18', owner: 'Sam' },
  { id: 'D-1086', name: 'Multi-site licence', company: 'Pioneer Health', contact: 'Samuel Ortiz', email: 'samuel@pioneerhealth.com', phone: '312 555 0123', stage: 'Qualified', amount: 23500, currency: 'USD', close: '2027-02-27', owner: 'Sam' },
  { id: 'D-1087', name: 'Starter plan', company: 'Helios Solar', contact: 'jonas fischer', email: 'jonas@heliossolar.de', phone: '+49 30 5550 1171', stage: 'Proposal', amount: 1900, currency: 'EUR', close: '2027-01-16', owner: 'Mia' },
  { id: 'D-1088', name: 'Custom integration', company: 'Halcyon Spa', contact: 'Isabel Moreno', email: 'isabel@halcyonspa.co', phone: '(737) 555-0133', stage: 'Proposal', amount: 18700, currency: 'USD', close: '2026-12-06', owner: 'Mia' },
  { id: 'D-1089', name: 'Starter plan', company: 'Kraftwerk Systems', contact: 'Lukas Weber', email: 'lukas@kraftwerk-sys.de', phone: '+49 30 5550 1115', stage: 'Won', amount: 1200, currency: 'EUR', close: '2026-10-25', owner: 'Mia' },
  { id: 'D-1090', name: 'Training days', company: 'Summit Legal', contact: 'Rachel Kim', email: 'rachel@summitlegal.com', phone: '617.555.0135', stage: 'Negotiation', amount: 3100, currency: 'USD', close: '2026-11-28', owner: 'Leo' },
  { id: 'D-1091', name: 'Analytics module', company: 'Pioneer Health', contact: 'Samuel Ortiz', email: 'samuel@pioneerhealth.com', phone: '312 555 0123', stage: 'Qualified', amount: 8500, currency: 'USD', close: '2027-02-01', owner: 'Sam' },
  { id: 'D-1092', name: 'SSO + audit log', company: 'Granite Capital', contact: 'Henry Lowe', email: 'henry@granitecap.com', phone: '212.555.0137', stage: 'Lost', amount: 3800, currency: 'USD', close: '2026-11-04', owner: 'Sam' },
  { id: 'D-1093', name: 'API access', company: 'Brightwater Dental', contact: 'Megan Walsh', email: 'MEGAN@BRIGHTWATERDENTAL.COM', phone: '737 555 0167', stage: 'Negotiation', amount: 4500, currency: 'USD', close: '2026-12-02', owner: 'Sam' },
  { id: 'D-1094', name: 'Onboarding package', company: 'Oakline Furniture', contact: 'Diana Park', email: 'diana@oakline.com', phone: '808.555.0150', stage: 'Proposal', amount: 3400, currency: 'USD', close: '2027-01-21', owner: 'Mia' },
  { id: 'D-1095', name: 'Multi-site licence', company: 'Summit Legal', contact: 'Rachel Kim', email: 'rachel@summitlegal.com', phone: '617.555.0135', stage: 'Qualified', amount: 41400, currency: 'USD', close: '2027-01-26', owner: 'Leo' },
  { id: 'D-1090', name: 'Training days', company: 'Summit Legal', contact: 'Rachel Kim', email: 'rachel@summitlegal.com', phone: '617.555.0135', stage: 'Negotiation', amount: 3100, currency: 'USD', close: '2026-11-28', owner: 'Leo' },
  { id: 'D-1096', name: 'Renewal + 15 seats', company: 'Ironclad Security', contact: 'Victor Hale', email: 'victor@ironcladsec.com', phone: '(312) 555-0173', stage: 'Lost', amount: 11100, currency: 'USD', close: '2026-10-10', owner: 'Sam' },
  { id: 'D-1097', name: 'Data migration', company: 'Maison Clément', contact: 'Camille Laurent', email: 'camille@maisonclement.fr', phone: '+33 1 55 50 01 77', stage: 'Won', amount: 5400, currency: 'EUR', close: '2026-10-28', owner: 'Sam' },
  { id: 'D-1098', name: 'Team plan — 25 seats ', company: 'Greenleaf Grocers', contact: 'Priya Shah', email: 'priya@greenleafgrocers.com', phone: '919 555 0175', stage: 'Lost', amount: 7200, currency: 'USD', close: '2026-10-18', owner: 'Mia' },
  { id: 'D-1099', name: 'Team plan — 60 seats', company: 'Marlow Estates', contact: 'Oliver Bennett', email: 'oliver@marlowestates.co.uk', phone: '+44 20 7946 0709', stage: 'Proposal', amount: 13700, currency: 'GBP', close: '2026-12-28', owner: 'Mia' },
  { id: 'D-1100', name: 'SSO + audit log', company: 'Maison Clément', contact: 'Camille Laurent', email: 'camille@maisonclement.fr', phone: '+33 1 55 50 01 77', stage: 'Lost', amount: 6400, currency: 'EUR', close: '2026-10-13', owner: 'Sam' },
  { id: 'D-1101', name: 'Analytics module', company: 'Bluebird Bakery', contact: 'Nora Quinn', email: 'nora@bluebirdbakery.com', phone: '720-555-0168', stage: 'Qualified', amount: 6500, currency: 'USD', close: '2027-01-13', owner: 'Sam' }
];

/* Reference tables for the custom functions (a real build fetches these from your API). */
export const FX_USD: Record<string, number> = { USD: 1, EUR: 0.92, GBP: 0.79, CAD: 1.37, AUD: 1.53 };
export const PRICES: Record<string, { name: string; price: number }> = {
  'GL-SEAT': { name: 'Seat licence / month', price: 24 },
  'GL-TEAM': { name: 'Team plan / month', price: 240 },
  'GL-ONB': { name: 'Onboarding package', price: 1500 },
  'GL-SUP': { name: 'Priority support / year', price: 1200 },
  'GL-MIG': { name: 'Data migration', price: 2600 }
};
export const fxRate = (from: string, to: string) => {
  const a = FX_USD[String(from).trim().toUpperCase()], b = FX_USD[String(to).trim().toUpperCase()];
  if (!a || !b) throw new Error(`Unknown currency ${!a ? from : to}`);
  return Math.round(b / a * 1e6) / 1e6;
};
