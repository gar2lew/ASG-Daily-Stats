// Shared definitions for the DRAPS API routes.
import { createHash, timingSafeEqual } from 'node:crypto';

export const SHEET_TAB = 'DRAPS Log';

// Column order in the spreadsheet: [header, key in the record sent from index.html]
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
];

const NUMERIC_KEYS = [
  'dValue', 'rValue', 'aValue', 'pValue', 'sValue',
  'leadCalls', 'firstConsultCalls', 'financeRunCalls', 'coffeeRunCalls',
  'fcCalls', 'fcSpoke', 'fcBooked', 'recCalls', 'recSpoke', 'recBooked',
  'totalCalls', 'totalSpoke', 'totalBooked',
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
