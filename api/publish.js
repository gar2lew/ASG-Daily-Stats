import { COLUMNS, SHEET_TAB, validateRecord, assertEnv, checkPasscode, missingHeaders, columnLetter } from '../lib/draps.js';
import { getSheetsClient } from '../lib/sheets.js';
import { APPROVAL_TAB, APPROVAL_FIRST_ROW, APPROVAL_COLUMNS, approvalRow, loggedAtBrisbane } from '../lib/approval.js';

// POST /api/publish  { record }   header: x-draps-passcode
// 1. Updates the approval tab of the weekly report (WEEKLY_SHEET_ID): one row per rep per date.
//    Republishing the same date and rep updates that row. Notes columns to the right are left alone.
// 2. Keeps the DRAPS Log tab (SHEET_ID) up to date as before.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const auth = checkPasscode(req);
  if (!auth.ok) return res.status(auth.status).json({ ok: false, error: auth.error });

  try {
    assertEnv(['GOOGLE_SERVICE_ACCOUNT_JSON', 'SHEET_ID', 'WEEKLY_SHEET_ID']);

    const checked = validateRecord(req.body?.record);
    if (!checked.ok) return res.status(400).json(checked);
    const { record } = checked;

    const sheets = getSheetsClient();
    const approvalMode = await publishApproval(sheets, process.env.WEEKLY_SHEET_ID, record);
    const logMode = await publishLog(sheets, process.env.SHEET_ID, record);

    return res.status(200).json({ ok: true, mode: approvalMode, log: logMode });
  } catch (error) {
    console.error('publish failed', error);
    return res.status(500).json({ ok: false, error: 'Could not write to the spreadsheet. Check the server logs.' });
  }
}

// Writes the rep's row on the approval tab. Returns 'added' or 'updated'.
async function publishApproval(sheets, spreadsheetId, record) {
  const tab = `'${APPROVAL_TAB}'`;
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tab}!B${APPROVAL_FIRST_ROW}:C1000`,
  });
  const rows = existing.data.values || [];

  const same = rows.findIndex(r => (r[0] || '').trim() === record.date && (r[1] || '').trim() === record.rep);
  let index = same;
  let mode = 'updated';
  if (same < 0) {
    mode = 'added';
    const blank = rows.findIndex(r => !(r[0] || '').trim() && !(r[1] || '').trim());
    index = blank >= 0 ? blank : rows.length;
  }

  const rowNumber = APPROVAL_FIRST_ROW + index;
  const last = APPROVAL_COLUMNS.length;
  const lastLetter = columnLetter(last);
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${tab}!A${rowNumber}:${lastLetter}${rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: { values: [approvalRow(record, loggedAtBrisbane())] },
  });
  return mode;
}

// Writes the DRAPS Log row. Returns 'added' or 'updated'.
async function publishLog(sheets, spreadsheetId, record) {
  await ensureTab(sheets, spreadsheetId);

  const row = COLUMNS.map(([, key]) => record[key] ?? '');
  const range = `'${SHEET_TAB}'!A:A`;
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${SHEET_TAB}'!A:C`,
  });

  const rows = existing.data.values || [];
  if (rows.length > 0) await extendHeader(sheets, spreadsheetId);
  const index = rows.findIndex((r, i) => i > 0 && r[0] === record.date && (r[2] || '').trim() === record.rep);

  if (index > 0) {
    const rowNumber = index + 1;
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${SHEET_TAB}'!A${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row] },
    });
    return 'updated';
  }

  if (rows.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${SHEET_TAB}'!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [COLUMNS.map(([header]) => header)] },
    });
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] },
  });
  return 'added';
}

// Adds header cells for columns added since the tab was created. Existing headers are left alone.
async function extendHeader(sheets, spreadsheetId) {
  const header = await sheets.spreadsheets.values.get({ spreadsheetId, range: `'${SHEET_TAB}'!1:1` });
  const missing = missingHeaders(header.data.values?.[0]);
  if (!missing) return;
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${SHEET_TAB}'!${missing.startColumn}1`,
    valueInputOption: 'RAW',
    requestBody: { values: [missing.headers] },
  });
}

// Creates the DRAPS Log tab if the spreadsheet does not have it yet.
async function ensureTab(sheets, spreadsheetId) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties.title' });
  const exists = meta.data.sheets.some(s => s.properties.title === SHEET_TAB);
  if (exists) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [{ addSheet: { properties: { title: SHEET_TAB } } }] },
  });
}

