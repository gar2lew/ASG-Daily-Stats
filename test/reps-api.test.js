import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleReps } from '../api/reps.js';

process.env.DRAPS_PASSCODE = 'test-pass-123';
process.env.GOOGLE_SERVICE_ACCOUNT_JSON = '{}'; // route requires it; the test injects the client
process.env.SHEET_ID = 'sheet-id';
const GOOD = { 'x-draps-passcode': 'test-pass-123' };
const SHEETS = { fake: true };

const mkRes = () => {
  const r = {};
  r.status = c => { r.code = c; return r; };
  r.json = b => { r.body = b; return r; };
  return r;
};

function deps(store) {
  const calls = { listReps: 0, addRep: [] };
  return {
    calls,
    deps: {
      getSheets: () => SHEETS,
      spreadsheetId: () => 'sheet-id',
      today: () => '16/11/2026',
      store: {
        listReps: async (sheets, id) => { calls.listReps++; return store.list ?? []; },
        addRep: async (sheets, id, input, today) => { calls.addRep.push({ input, today }); return store.add; },
      },
    },
  };
}

test('POST with a null or missing body returns 400, not 500', async () => {
  for (const body of [null, undefined]) {
    const d = deps({ list: [] });
    const res = mkRes();
    await handleReps({ method: 'POST', headers: GOOD, body }, res, d.deps);
    assert.equal(res.code, 400);
    assert.equal(d.calls.addRep.length, 0);
  }
});

test('missing passcode is rejected before the store is touched', async () => {
  const d = deps({ list: [] });
  const res = mkRes();
  await handleReps({ method: 'GET', headers: {} }, res, d.deps);
  assert.equal(res.code, 401);
  assert.equal(d.calls.listReps, 0);
});

test('GET returns active reps as name, state and timezone', async () => {
  const d = deps({ list: [{ name: 'Jaide', state: 'WA', timezone: 'Australia/Perth', active: true, added: '16/11/2026' }] });
  const res = mkRes();
  await handleReps({ method: 'GET', headers: GOOD }, res, d.deps);
  assert.equal(res.code, 200);
  assert.deepEqual(res.body, { ok: true, reps: [{ name: 'Jaide', state: 'WA', timezone: 'Australia/Perth' }] });
});

test('POST adds a new rep and returns created true', async () => {
  const d = deps({ add: { created: true, rep: { name: 'Joe Smith', state: 'QLD', timezone: 'Australia/Brisbane', active: true, added: '16/11/2026' } } });
  const res = mkRes();
  await handleReps({ method: 'POST', headers: GOOD, body: { name: '  Joe Smith ', state: 'qld' } }, res, d.deps);
  assert.equal(res.code, 200);
  assert.equal(res.body.created, true);
  assert.equal(res.body.rep.timezone, 'Australia/Brisbane');
  assert.equal(d.calls.addRep[0].today, '16/11/2026');
});

test('POST with a duplicate active name returns created false', async () => {
  const d = deps({ add: { created: false, rep: { name: 'Joe Smith', state: 'QLD', timezone: 'Australia/Brisbane', active: true, added: '' } } });
  const res = mkRes();
  await handleReps({ method: 'POST', headers: GOOD, body: { name: 'JOE smith', state: 'QLD' } }, res, d.deps);
  assert.equal(res.code, 200);
  assert.equal(res.body.created, false);
});

test('POST matching an inactive rep is refused, not selected', async () => {
  const d = deps({ add: { created: false, rep: { name: 'Old Rep', state: 'NSW', timezone: 'Australia/Sydney', active: false, added: '' } } });
  const res = mkRes();
  await handleReps({ method: 'POST', headers: GOOD, body: { name: 'Old Rep', state: 'NSW' } }, res, d.deps);
  assert.equal(res.code, 409);
  assert.equal(res.body.ok, false);
});

test('POST with an invalid state returns 400 and does not touch the store', async () => {
  const d = deps({});
  const res = mkRes();
  await handleReps({ method: 'POST', headers: GOOD, body: { name: 'Joe', state: 'XX' } }, res, d.deps);
  assert.equal(res.code, 400);
  assert.equal(d.calls.addRep.length, 0);
});

test('other methods return 405', async () => {
  const d = deps({});
  const res = mkRes();
  await handleReps({ method: 'PUT', headers: GOOD }, res, d.deps);
  assert.equal(res.code, 405);
});
