import { assertEnv, checkPasscode } from '../lib/draps.js';
import { validateRepInput, localDateParts } from '../lib/reps.js';
import { listReps, addRep } from '../lib/reps-store.js';
import { getSheetsClient } from '../lib/sheets.js';

const defaultDeps = {
  getSheets: getSheetsClient,
  spreadsheetId: () => process.env.SHEET_ID,
  // Added dates use the weekly sheet's own timezone; a rep's day is set by their own timezone on publish.
  today: () => localDateParts('Australia/Brisbane').date,
  store: { listReps, addRep },
};

const publicRep = rep => ({ name: rep.name, state: rep.state, timezone: rep.timezone });

// GET /api/reps                       -> { ok, reps: [{ name, state, timezone }] }
// POST /api/reps { name, state }      -> { ok, created, rep }
// Both need the x-draps-passcode header.
export async function handleReps(req, res, deps = defaultDeps) {
  const auth = checkPasscode(req);
  if (!auth.ok) return res.status(auth.status).json({ ok: false, error: auth.error });

  try {
    assertEnv(['GOOGLE_SERVICE_ACCOUNT_JSON', 'SHEET_ID']);
    const sheets = deps.getSheets();
    const id = deps.spreadsheetId();

    if (req.method === 'GET') {
      const reps = await deps.store.listReps(sheets, id);
      return res.status(200).json({ ok: true, reps: reps.map(publicRep) });
    }

    if (req.method === 'POST') {
      const checked = validateRepInput(req.body);
      if (!checked.ok) return res.status(400).json({ ok: false, error: checked.error });

      const result = await deps.store.addRep(sheets, id, req.body, deps.today());
      if (!result.created && !result.rep.active) {
        return res.status(409).json({ ok: false, error: 'That name is on the list but inactive. Ask Ross to reactivate it.' });
      }
      return res.status(200).json({ ok: true, created: result.created, rep: publicRep(result.rep) });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('reps failed', error);
    return res.status(500).json({ ok: false, error: 'Could not reach the rep list. Check the server logs.' });
  }
}

export default function handler(req, res) {
  return handleReps(req, res);
}
