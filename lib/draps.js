// Shared definitions for the DRAPS API routes.
import { createHash, timingSafeEqual } from 'node:crypto';

export const SHEET_TAB = 'DRAPS Log';

// Pipeline cards on the input page, in the order of "DRAPS Design Draft.docx".
// Each input's record key is pipe_<card>_<field>. index.html keeps the same list;
// test/draps-record.test.js fails if the two drift apart.
export const PIPELINES = [
  { key: 'smsf', title: 'Property Sale - SMSF', fields: [['referrals','Referrals'],['appointments','Appointments'],['presented','Presented'],['sold','Sold (EOI Signed)'],['ra','RA']] },
  { key: 'fcPipe', title: 'First Consult', fields: [['referrals','Referrals'],['appointments','Appointments'],['presented','Presented'],['sold','Sold (FR Booked)'],['ra','RA']] },
  { key: 'contract', title: 'Contract Signed', fields: [['booked','Booked'],['presented','Presented'],['sold','Sold']] },
  { key: 'financePipe', title: 'Finance Run', fields: [['referrals','Referrals'],['appointments','Appointments'],['presented','Presented'],['sold','Sold (Sale Booked)'],['ra','RA']] },
  { key: 'recPipe', title: 'Recruitment', fields: [['calls','Calls Made'],['spokeWith','Spoke With'],['booked','Booked'],['interviewed','Interviewed']] },
  { key: 'property', title: 'Property Sale', fields: [['referrals','Referrals'],['appointments','Appointments'],['presented','Presented'],['sold','Sold (EOI Signed)'],['ra','RA']] },
];

export const pipelineKey = (card, field) => `pipe_${card}_${field}`;

const PIPELINE_COLUMNS = PIPELINES.flatMap(card =>
  card.fields.map(([field, label]) => [`${card.title} - ${label}`, pipelineKey(card.key, field)])
);

// Column order in the spreadsheet: [header, key in the record sent from index.html].
// New columns are only ever appended, so existing sheet columns keep their letters.
export const COLUMNS = [
  ['Date', 'date'],
  ['Day', 'day'],
  ['Rep', 'rep'],
  ['D Label', 'dLabel'], ['D', 'dValue'],
  ['R Label', 'rLabel'], ['R', 'rValue'],
  ['A Label', 'aLabel'], ['A', 'aValue'],
  ['P Label', 'pLabel'], ['P', 'pValue'],
  ['S Label', 'sLabel'], ['S', 'sValue'],
  ['Lead Calls', 'leadCalls'],
  ['First Consult Calls', 'firstConsultCalls'],
  ['Finance Run Calls', 'financeRunCalls'],
  ['Coffee Run Calls', 'coffeeRunCalls'],
  ['Total Calls', 'totalCalls'],
  ["Follow Up FC's", 'fcCalls'],
  ['FC Spoke To', 'fcSpoke'],
  ['FC Booked', 'fcBooked'],
  ['FC Note', 'fcNote'],
  ['Recruitment', 'recCalls'],
  ['Rec Spoke To', 'recSpoke'],
  ['Rec Booked', 'recBooked'],
  ['Total Spoke To', 'totalSpoke'],
  ['Total Booked', 'totalBooked'],
  ['Book Rate', 'bookRate'],
  ...PIPELINE_COLUMNS,
];

// Letters for a 1-based column number: 1 -> A, 26 -> Z, 27 -> AA.
export function columnLetter(n) {
  let s = '';
  for (let x = n; x > 0; x = Math.floor((x - 1) / 26)) {
    s = String.fromCharCode(65 + ((x - 1) % 26)) + s;
  }
  return s;
}

// Given the header row currently in the sheet, returns the headers still missing at the
// end so publish can extend the sheet, or null when the header is already complete.
// Existing headers are never rewritten.
export function missingHeaders(existingHeader) {
  const have = Array.isArray(existingHeader) ? existingHeader.length : 0;
  if (have >= COLUMNS.length) return null;
  return { startColumn: columnLetter(have + 1), headers: COLUMNS.slice(have).map(([header]) => header) };
}

const NUMERIC_KEYS = [
  'dValue', 'rValue', 'aValue', 'pValue', 'sValue',
  'leadCalls', 'firstConsultCalls', 'financeRunCalls', 'coffeeRunCalls',
  'fcCalls', 'fcSpoke', 'fcBooked', 'recCalls', 'recSpoke', 'recBooked',
  'totalCalls', 'totalSpoke', 'totalBooked',
  ...PIPELINE_COLUMNS.map(([, key]) => key),
];

const TEXT_KEYS = ['date', 'day', 'rep', 'dLabel', 'rLabel', 'aLabel', 'pLabel', 'sLabel', 'fcNote', 'bookRate'];

// Validates and normalises a record from the browser. Returns { ok, record, error }.
export function validateRecord(input) {
  if (!input || typeof input !== 'object') return { ok: false, error: 'Missing record' };

  const record = {};
  for (const key of TEXT_KEYS) {
    const value = input[key];
    record[key] = typeof value === 'string' ? value.trim().slice(0, 120) : '';
  }
  for (const key of NUMERIC_KEYS) {
    const value = Number.parseInt(input[key], 10);
    record[key] = Number.isFinite(value) && value >= 0 ? Math.min(value, 9999) : 0;
  }

  if (!record.rep) return { ok: false, error: 'Rep name is required' };
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(record.date)) return { ok: false, error: 'Date must be DD/MM/YYYY' };
  const [day, month, year] = record.date.split('/').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return { ok: false, error: 'Date must be a valid calendar date' };
  }
  return { ok: true, record };
}

// Checks the x-draps-passcode header against the DRAPS_PASSCODE env var.
// Digests are compared so the comparison does not leak the passcode length.
export function checkPasscode(req) {
  const expected = process.env.DRAPS_PASSCODE;
  if (!expected) return { ok: false, status: 500, error: 'DRAPS_PASSCODE is not configured' };

  const given = req.headers['x-draps-passcode'];
  if (typeof given !== 'string' || !given) return { ok: false, status: 401, error: 'Passcode required' };

  const a = createHash('sha256').update(given).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b) ? { ok: true } : { ok: false, status: 401, error: 'Incorrect passcode' };
}

export function assertEnv(names) {
  const missing = names.filter(name => !process.env[name]);
  if (missing.length) throw new Error(`Missing environment variables: ${missing.join(', ')}`);
}
