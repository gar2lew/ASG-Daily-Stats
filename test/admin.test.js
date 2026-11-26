import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkAdminPin, MAX_FAILED_ATTEMPTS, LOCK_MS } from '../lib/admin.js';
import { saveRep, setRepActive, listAllReps, REPS_TAB } from '../lib/reps-store.js';
import { handleAdmin } from '../api/admin.js';

const HEADER = ['Name', 'State', 'Timezone', 'Active', 'Added', 'Tiers'];

function fakeSheets(values) {
  const calls = { update: [] };
  return {
    calls,
    spreadsheets: {
      get: async () => ({ data: { sheets: [{ properties: { title: REPS_TAB } }] } }),
      values: {
        get: async () => ({ data: { values } }),
        update: async req => { calls.update.push(req); return {}; },
      },
    },
  };
}

function fakeRes() {
  return {
    statusCode: 200, body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

const req = (pin, extra = {}) => ({ headers: { 'x-admin-pin': pin, 'x-forwarded-for': '10.0.0.1' }, ...extra });

test('checkAdminPin refuses when ADMIN_PIN is not a 4-digit number', () => {
  assert.equal(checkAdminPin(req('1234'), { expected: undefined }).status, 500);
  assert.equal(checkAdminPin(req('1234'), { expected: '12' }).status, 500);
});

test('checkAdminPin accepts the right PIN and rejects a wrong one', () => {
  const now = Date.now();
  assert.equal(checkAdminPin(req('4821'), { expected: '4821', now }).ok, true);
  assert.equal(checkAdminPin(req('0000'), { expected: '4821', now: now + 1 }).status, 401);
});

test('checkAdminPin locks the client after repeated wrong PINs, then allows again', () => {
  const start = 1_000_000;
  const ip = { headers: { 'x-admin-pin': '0000', 'x-forwarded-for': '10.9.9.9' } };
  for (let i = 0; i < MAX_FAILED_ATTEMPTS; i++) {
    checkAdminPin(ip, { expected: '4821', now: start });
  }
  const locked = checkAdminPin({ headers: { 'x-admin-pin': '4821', 'x-forwarded-for': '10.9.9.9' } }, { expected: '4821', now: start + 1 });
  assert.equal(locked.status, 429);
  const after = checkAdminPin({ headers: { 'x-admin-pin': '4821', 'x-forwarded-for': '10.9.9.9' } }, { expected: '4821', now: start + LOCK_MS + 1 });
  assert.equal(after.ok, true);
});

test('listAllReps includes removed reps with their sheet row numbers', async () => {
  const sheets = fakeSheets([HEADER, ['Jaide', 'WA', 'Australia/Perth', 'TRUE', ''], ['Old Rep', 'NSW', 'Australia/Sydney', 'FALSE', '']]);
  const reps = await listAllReps(sheets, 'id');
  assert.deepEqual(reps.map(r => [r.name, r.row, r.active]), [['Jaide', 2, true], ['Old Rep', 3, false]]);
});

test('saveRep renames a row in place and keeps its active flag', async () => {
  const sheets = fakeSheets([HEADER, ['Jaide', 'WA', 'Australia/Perth', 'TRUE', '16/11/2026', 'FC']]);
  const rep = await saveRep(sheets, 'id', { row: 2, name: 'Jaide Lee', state: 'qld', tiers: ['FC', 'PS'] });
  assert.equal(rep.timezone, 'Australia/Brisbane');
  assert.deepEqual(sheets.calls.update[0].requestBody.values, [['Jaide Lee', 'QLD', 'Australia/Brisbane', 'TRUE', '16/11/2026', 'FC, PS']]);
  assert.equal(sheets.calls.update[0].range, `'${REPS_TAB}'!A2:F2`);
});

test('saveRep refuses a name another row already uses', async () => {
  const sheets = fakeSheets([HEADER, ['Jaide', 'WA', 'Australia/Perth', 'TRUE', ''], ['Mia', 'VIC', 'Australia/Melbourne', 'TRUE', '']]);
  await assert.rejects(saveRep(sheets, 'id', { row: 3, name: 'jaide', state: 'VIC' }), { status: 409 });
  assert.equal(sheets.calls.update.length, 0);
});

test('setRepActive only changes the Active cell', async () => {
  const sheets = fakeSheets([HEADER, ['Mia', 'VIC', 'Australia/Melbourne', 'TRUE', '']]);
  await setRepActive(sheets, 'id', { row: 2, active: false });
  assert.equal(sheets.calls.update[0].range, `'${REPS_TAB}'!D2`);
  assert.deepEqual(sheets.calls.update[0].requestBody.values, [['FALSE']]);
});

test('handleAdmin returns 401 without the right PIN and does not touch the sheet', async () => {
  const res = fakeRes();
  let touched = false;
  await handleAdmin({ method: 'GET', headers: {} }, res, {
    checkPin: () => ({ ok: false, status: 401, error: 'Incorrect PIN' }),
    getSheets: () => { touched = true; return {}; },
    spreadsheetId: () => 'id',
    store: {},
  });
  assert.equal(res.statusCode, 401);
  assert.equal(touched, false);
});

test('handleAdmin remove hides a rep and restore shows it again', async () => {
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON = '{}';
  process.env.SHEET_ID = 'id';
  const values = [HEADER, ['Mia', 'VIC', 'Australia/Melbourne', 'TRUE', '']];
  const sheets = fakeSheets(values);
  const deps = { checkPin: () => ({ ok: true }), getSheets: () => sheets, spreadsheetId: () => 'id', store: { listAllReps, saveRep, setRepActive, addRep: async () => ({}) }, today: () => '24/11/2026' };
  const res = fakeRes();
  await handleAdmin({ method: 'POST', headers: {}, body: { action: 'remove', row: 2 } }, res, deps);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.rep.active, false);
  assert.equal(sheets.calls.update.at(-1).requestBody.values[0][0], 'FALSE');
});
