import { google } from 'googleapis';
import { COLUMNS, SHEET_TAB, validateRecord, assertEnv, checkPasscode, missingHeaders } from '../lib/draps.js';

// POST /api/publish  { record }   header: x-draps-passcode
// Writes one row per rep per date to the DRAPS Log tab. Republishing the same
// date and rep updates that row instead of adding a duplicate.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const auth = checkPasscode(req);
  if (!auth.ok) return res.status(auth.status).json({ ok: false, error: auth.error });

  try {
    assertEnv(['GOOGLE_SERVICE_ACCOUNT_JSON', 'SHEET_ID']);

    const checked = validateRecord(req.body?.record);
    if (!checked.ok) return res.status(400).json(checked);
    const { record } = checked;

    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SHEET_ID;

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
      return res.status(200).json({ ok: true, mode: 'updated' });
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

    return res.status(200).json({ ok: true, mode: 'added' });
  } catch (error) {
    console.error('publish failed', error);
    return res.status(500).json({ ok: false, error: 'Could not write to the spreadsheet. Check the server logs.' });
  }
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
