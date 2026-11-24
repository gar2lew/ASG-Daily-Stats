import { test } from 'node:test';
import assert from 'node:assert/strict';
import { APPROVAL_COLUMNS, approvalRow, loggedAtBrisbane } from '../lib/approval.js';
import { PIPELINES, pipelineKey, validateRecord, columnLetter } from '../lib/draps.js';

// Headers as they appear in row 5 of "Rep DRAPS - For Approval" in the weekly sheet.
const SHEET_HEADERS = [
  'Logged At', 'Day', 'Rep', 'Door Qs', 'FC Apps', 'FC Presented', 'FR Booked', 'Finance Apps',
  'Finance Presented', 'Sales Booked', 'Property Booked', 'Property Presented', 'Properties Sold',
  'SMSF Booked', 'SMSF Presented', 'SMSF Sold', 'Super Booked', 'Super Presented', 'Super Sales',
  'Contract Booked', 'Contract Presented', 'Contracts Signed', 'RE-FI Booked', 'RE-FI Presented', 'RE-FIs Done',
];

test('approval columns match the weekly sheet headers in order (A to Y)', () => {
  assert.deepEqual(APPROVAL_COLUMNS.map(([h]) => h), SHEET_HEADERS);
  assert.equal(columnLetter(APPROVAL_COLUMNS.length), 'Y');
});

test('every mapped key is a real DRAPS record key or a blank', () => {
  const keys = new Set(PIPELINES.flatMap(c => c.fields.map(([f]) => pipelineKey(c.key, f))));
  keys.add('dValue'); keys.add('date'); keys.add('rep'); keys.add('loggedAt');
  for (const [, key] of APPROVAL_COLUMNS) {
    if (key !== null) assert.ok(keys.has(key), `unknown key ${key}`);
  }
});

test('approvalRow puts the record values in the right columns and leaves Super and RE-FI blank', () => {
  const checked = validateRecord({
    date: '24/11/2026', day: 'Tuesday', rep: 'Mitchell', dValue: '7',
    [pipelineKey('fcPipe', 'appointments')]: '3',
    [pipelineKey('fcPipe', 'sold')]: '1',
    [pipelineKey('contract', 'sold')]: '2',
  });
  assert.ok(checked.ok);
  const row = approvalRow(checked.record, '24/11/2026 13:30');
  const byHeader = Object.fromEntries(SHEET_HEADERS.map((h, i) => [h, row[i]]));
  assert.equal(byHeader['Logged At'], '24/11/2026 13:30');
  assert.equal(byHeader['Day'], '24/11/2026');
  assert.equal(byHeader['Rep'], 'Mitchell');
  assert.equal(byHeader['Door Qs'], 7);
  assert.equal(byHeader['FC Apps'], 3);
  assert.equal(byHeader['FR Booked'], 1);
  assert.equal(byHeader['Contracts Signed'], 2);
  assert.equal(byHeader['Super Booked'], '');
  assert.equal(byHeader['RE-FIs Done'], '');
});

test('loggedAtBrisbane formats DD/MM/YYYY HH:mm in Brisbane time', () => {
  // 2026-11-24 00:00 UTC is 10:00 on 24/11/2026 in Brisbane (UTC+10, no daylight saving).
  assert.equal(loggedAtBrisbane(new Date('2026-11-24T00:00:00Z')), '24/11/2026 10:00');
});
