// Reads and appends the Reps tab in the weekly reporting spreadsheet.
import { validateRepInput } from './reps.js';

export const REPS_TAB = 'Reps';
const RANGE = `'${REPS_TAB}'!A:E`;
const HEADER = ['Name', 'State', 'Timezone', 'Active', 'Added'];

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
function toRep(row) {
  return {
    name: (row[0] || '').trim(),
    state: (row[1] || '').trim(),
    timezone: (row[2] || '').trim(),
    active: (row[3] || '').trim().toUpperCase() !== 'FALSE',
    added: (row[4] || '').trim(),
  };
}

export async function listReps(sheets, spreadsheetId) {
  if (!(await tabExists(sheets, spreadsheetId))) return [];
  const rows = await readRows(sheets, spreadsheetId);
  return rows
    .slice(1) // first row is the header
    .filter(row => (row[0] || '').trim())
    .map(toRep)
    .filter(rep => rep.active)
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
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [[checked.name, checked.state, checked.timezone, 'TRUE', today]] },
  });
  return {
    created: true,
    rep: { name: checked.name, state: checked.state, timezone: checked.timezone, active: true, added: today },
  };
}
