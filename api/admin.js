import { assertEnv } from '../lib/draps.js';
import { checkAdminPin } from '../lib/admin.js';
import { validateRepInput, localDateParts } from '../lib/reps.js';
import { listAllReps, addRep, saveRep, setRepActive, saveRepTiers } from '../lib/reps-store.js';
import { getSheetsClient } from '../lib/sheets.js';

const defaultDeps = {
  getSheets: getSheetsClient,
  spreadsheetId: () => process.env.SHEET_ID,
  today: () => localDateParts('Australia/Brisbane').date,
  checkPin: checkAdminPin,
  store: { listAllReps, addRep, saveRep, setRepActive, saveRepTiers },
};

const publicRep = rep => ({ row: rep.row, name: rep.name, state: rep.state, timezone: rep.timezone, active: rep.active, tiers: rep.tiers || [] });

// Every request sends the admin PIN in the x-admin-pin header.
// GET  /api/admin                          -> { ok, reps: [{ row, name, state, timezone, active }] }
// POST /api/admin { action, ... }          -> { ok, rep }
//   action 'add'     { name, state }        adds a rep, or shows a removed rep again with the new details
//   action 'update'  { row, name, state }   renames a rep or changes their state
//   action 'remove'  { row }                hides a rep from the gate (the row and its history stay)
//   action 'restore' { row }                shows a removed rep again
export async function handleAdmin(req, res, deps = defaultDeps) {
  const pin = deps.checkPin(req);
  if (!pin.ok) return res.status(pin.status).json({ ok: false, error: pin.error });

  try {
    assertEnv(['GOOGLE_SERVICE_ACCOUNT_JSON', 'SHEET_ID']);
    const sheets = deps.getSheets();
    const id = deps.spreadsheetId();

    if (req.method === 'GET') {
      const reps = await deps.store.listAllReps(sheets, id);
      return res.status(200).json({ ok: true, reps: reps.map(publicRep) });
    }

    if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

    const body = req.body || {};
    const row = Number.parseInt(body.row, 10);
    const needsRow = () => {
      if (!Number.isInteger(row) || row < 2) throw Object.assign(new Error('Choose a rep first'), { status: 400 });
    };

    if (body.action === 'add') {
      const checked = validateRepInput(body);
      if (!checked.ok) return res.status(400).json({ ok: false, error: checked.error });

      const existing = (await deps.store.listAllReps(sheets, id))
        .find(rep => rep.name.toLowerCase() === checked.name.toLowerCase());
      if (existing) {
        await deps.store.saveRep(sheets, id, { row: existing.row, name: checked.name, state: checked.state });
        const rep = await deps.store.setRepActive(sheets, id, { row: existing.row, active: true });
        return res.status(200).json({ ok: true, rep: publicRep(rep) });
      }
      const result = await deps.store.addRep(sheets, id, body, deps.today());
      return res.status(200).json({ ok: true, rep: publicRep({ ...result.rep, row: null, active: true }) });
    }

    if (body.action === 'update') {
      needsRow();
      const rep = await deps.store.saveRep(sheets, id, { row, name: body.name, state: body.state, tiers: body.tiers });
      return res.status(200).json({ ok: true, rep: publicRep(rep) });
    }

    if (body.action === 'tiers') {
      needsRow();
      const rep = await deps.store.saveRepTiers(sheets, id, { row, tiers: body.tiers });
      return res.status(200).json({ ok: true, rep: publicRep(rep) });
    }

    if (body.action === 'remove' || body.action === 'restore') {
      needsRow();
      const rep = await deps.store.setRepActive(sheets, id, { row, active: body.action === 'restore' });
      return res.status(200).json({ ok: true, rep: publicRep(rep) });
    }

    return res.status(400).json({ ok: false, error: 'Unknown action' });
  } catch (error) {
    if (error.status && error.status < 500) return res.status(error.status).json({ ok: false, error: error.message });
    console.error('admin failed', error);
    return res.status(500).json({ ok: false, error: 'Could not update the rep list. Check the server logs.' });
  }
}

export default function handler(req, res) {
  return handleAdmin(req, res);
}
