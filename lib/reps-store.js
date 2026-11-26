// Reads and appends the Reps tab in the weekly reporting spreadsheet.
import { validateRepInput, STATE_TIMEZONES } from './reps.js';

export const REPS_TAB = 'Reps';
const RANGE = `'${REPS_TAB}'!A:Z`;
const HEADER = ['Name', 'State', 'Timezone', 'Active', 'Added', 'Tiers'];

async function tabExists(sheets, spreadsheetId) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties.title' });
  return meta.data.sheets.some(s => s.properties.title === REPS_TAB);
}

async function createTab(sheets, spreadsheetId) {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [{ addSheet: { properties: { title: REPS_TAB } } }] },
  });
}

async function readRows(sheets, spreadsheetId) {
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: RANGE });
  return res.data.values || [];
}

// Active unless the Active cell says FALSE. Blank Active counts as active.
// The timezone is always derived from State, so a hand-edited Timezone cell cannot override it.
function toRep(row) {
  const state = (row[1] || '').trim().toUpperCase();
  return {
    name: (row[0] || '').trim(),
    state,
    timezone: STATE_TIMEZONES[state] || '',
    active: (row[3] || '').trim().toUpperCase() !== 'FALSE',
    added: (row[4] || '').trim(),
    tiers: (row[5] || '').split(',').map(tier => tier.trim()).filter(Boolean),
  };
}

export async function listReps(sheets, spreadsheetId) {
  if (!(await tabExists(sheets, spreadsheetId))) return [];
  const rows = await readRows(sheets, spreadsheetId);
  return rows
    .slice(1) // first row is the header
    .filter(row => (row[0] || '').trim())
    .map(toRep)
    .filter(rep => rep.active && rep.timezone)
    .sort((a, b) => a.name.localeCompare(b.name));
}

// input is the raw { name, state } from the request. Returns { created, rep }.
// A name matching an existing row (any case, active or not) is never appended again.
export async function addRep(sheets, spreadsheetId, input, today) {
  const checked = validateRepInput(input);
  if (!checked.ok) throw new Error(checked.error);

  if (!(await tabExists(sheets, spreadsheetId))) await createTab(sheets, spreadsheetId);

  let rows = await readRows(sheets, spreadsheetId);
  if (rows.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${REPS_TAB}'!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [HEADER] },
    });
    rows = [HEADER];
  }

  const key = checked.name.toLowerCase();
  const match = rows.slice(1).find(row => (row[0] || '').trim().toLowerCase() === key);
  if (match) return { created: false, rep: toRep(match) };

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: RANGE,
    valueInputOption: 'RAW', // RAW: stores =formulas, TRUE and dates as text
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [[checked.name, checked.state, checked.timezone, 'TRUE', today, '']] },
  });
  return {
    created: true,
    rep: { name: checked.name, state: checked.state, timezone: checked.timezone, active: true, added: today },
  };
}

// Every row for the admin panel, removed reps included. row is the sheet row number.
export async function listAllReps(sheets, spreadsheetId) {
  if (!(await tabExists(sheets, spreadsheetId))) return [];
  const rows = await readRows(sheets, spreadsheetId);
  return rows
    .slice(1)
    .map((row, i) => ({ row: i + 2, ...toRep(row) }))
    .filter(rep => rep.name)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function httpError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

// Name, State and Timezone for one row. Refuses a name already used by another row.
export async function saveRep(sheets, spreadsheetId, { row, name, state, tiers }) {
  const checked = validateRepInput({ name, state });
  if (!checked.ok) throw httpError(checked.error, 400);

  const rows = await readRows(sheets, spreadsheetId);
  const current = rows[row - 1];
  if (!current || !(current[0] || '').trim()) throw httpError('That rep was not found', 404);

  const key = checked.name.toLowerCase();
  const clash = rows.slice(1).some((r, i) => i + 2 !== row && (r[0] || '').trim().toLowerCase() === key);
  if (clash) throw httpError('Another rep already has that name', 409);

  const active = (current[3] || '').trim().toUpperCase() !== 'FALSE';
  const existingTiers = (current[5] || '').split(',').map(tier => tier.trim()).filter(Boolean);
  const savedTiers = Array.isArray(tiers)
    ? [...new Set(tiers.filter(tier => typeof tier === 'string' && /^[A-Z0-9-]{1,12}$/.test(tier)))].join(', ')
    : existingTiers.join(', ');
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${REPS_TAB}'!A${row}:F${row}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[checked.name, checked.state, checked.timezone, active ? 'TRUE' : 'FALSE', current[4] || '', savedTiers]] },
  });
  return { row, name: checked.name, state: checked.state, timezone: checked.timezone, active, tiers: savedTiers ? savedTiers.split(', ') : [] };
}

export async function saveRepTiers(sheets, spreadsheetId, { row, tiers }) {
  const rows = await readRows(sheets, spreadsheetId);
  const current = rows[row - 1];
  if (!current || !(current[0] || '').trim()) throw httpError('That rep was not found', 404);
  if (!Array.isArray(tiers) || tiers.some(tier => typeof tier !== 'string' || !/^[A-Z0-9-]{1,12}$/.test(tier))) {
    throw httpError('Choose valid rep tiers', 400);
  }
  const value = [...new Set(tiers)].join(', ');
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${REPS_TAB}'!F${row}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[value]] },
  });
  return { ...toRep(current), row, tiers: value ? value.split(', ') : [] };
}

// Shows (active true) or hides (active false) a rep. The row and its history stay on the sheet.
export async function setRepActive(sheets, spreadsheetId, { row, active }) {
  const rows = await readRows(sheets, spreadsheetId);
  const current = rows[row - 1];
  if (!current || !(current[0] || '').trim()) throw httpError('That rep was not found', 404);

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${REPS_TAB}'!D${row}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[active ? 'TRUE' : 'FALSE']] },
  });
  return { ...toRep(current), row, active };
}
