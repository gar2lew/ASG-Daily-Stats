import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listReps, addRep, REPS_TAB } from '../lib/reps-store.js';

const HEADER = ['Name', 'State', 'Timezone', 'Active', 'Added'];

function fakeSheets({ tabs = [REPS_TAB], values } = {}) {
  const calls = { batchUpdate: [], update: [], append: [] };
  let current = values;
  return {
    calls,
    spreadsheets: {
      get: async () => ({ data: { sheets: tabs.map(title => ({ properties: { title } })) } }),
      batchUpdate: async req => { calls.batchUpdate.push(req); tabs.push(REPS_TAB); return {}; },
      values: {
        get: async () => ({ data: { values: current } }),
        update: async req => { calls.update.push(req); return {}; },
        append: async req => { calls.append.push(req); current = (current || []).concat(req.requestBody.values); return {}; },
      },
    },
  };
}

const JOE = { name: 'Joe Smith', state: 'QLD', timezone: 'Australia/Brisbane' };

test('listReps returns active reps sorted, skipping blanks and inactive rows', async () => {
  const sheets = fakeSheets({
    values: [
      HEADER,
      ['Jaide', 'WA', 'Australia/Perth', 'TRUE', '16/11/2026'],
      ['', '', '', '', ''],
      ['Old Rep', 'NSW', 'Australia/Sydney', 'FALSE', '01/01/2026'],
      ['Joe Smith', 'QLD', 'Australia/Brisbane', 'TRUE', '16/11/2026'],
    ],
  });
  const reps = await listReps(sheets, 'sheet-id');
  assert.deepEqual(reps.map(r => r.name), ['Jaide', 'Joe Smith']);
  assert.equal(reps[0].timezone, 'Australia/Perth');
});

test('listReps returns an empty list when the tab has no data', async () => {
  assert.deepEqual(await listReps(fakeSheets({ values: undefined }), 'sheet-id'), []);
});

test('addRep appends a new rep as a row', async () => {
  const sheets = fakeSheets({ values: [HEADER] });
  const result = await addRep(sheets, 'sheet-id', JOE, '16/11/2026');
  assert.equal(result.created, true);
  assert.deepEqual(result.rep, { name: 'Joe Smith', state: 'QLD', timezone: 'Australia/Brisbane', active: true, added: '16/11/2026' });
  assert.deepEqual(sheets.calls.append[0].requestBody.values, [['Joe Smith', 'QLD', 'Australia/Brisbane', 'TRUE', '16/11/2026']]);
});

test('addRep does not duplicate a name differing only in case', async () => {
  const sheets = fakeSheets({ values: [HEADER, ['Joe Smith', 'QLD', 'Australia/Brisbane', 'TRUE', '16/11/2026']] });
  const result = await addRep(sheets, 'sheet-id', { ...JOE, name: 'JOE smith' }, '16/11/2026');
  assert.equal(result.created, false);
  assert.equal(result.rep.name, 'Joe Smith');
  assert.equal(sheets.calls.append.length, 0);
});

test('addRep creates a missing Reps tab and writes the header first', async () => {
  const sheets = fakeSheets({ tabs: ['DRAPS Log'], values: undefined });
  await addRep(sheets, 'sheet-id', JOE, '16/11/2026');
  assert.equal(sheets.calls.batchUpdate.length, 1);
  assert.equal(sheets.calls.batchUpdate[0].requestBody.requests[0].addSheet.properties.title, REPS_TAB);
  assert.deepEqual(sheets.calls.update[0].requestBody.values, [HEADER]);
  assert.equal(sheets.calls.append.length, 1);
});
