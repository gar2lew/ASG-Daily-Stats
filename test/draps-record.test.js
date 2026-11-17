import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { COLUMNS, PIPELINES, pipelineKey, validateRecord, columnLetter, missingHeaders } from '../lib/draps.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const html = await readFile(path.join(here, '..', 'index.html'), 'utf8');

const LEGACY_HEADERS = [
  'Date', 'Day', 'Rep', 'D Label', 'D', 'R Label', 'R', 'A Label', 'A', 'P Label', 'P', 'S Label', 'S',
  'Lead Calls', 'First Consult Calls', 'Finance Run Calls', 'Coffee Run Calls', 'Total Calls',
  "Follow Up FC's", 'FC Spoke To', 'FC Booked', 'FC Note', 'Recruitment', 'Rec Spoke To', 'Rec Booked',
  'Total Spoke To', 'Total Booked', 'Book Rate',
];

test('existing sheet columns keep their order and letters', () => {
  assert.deepEqual(COLUMNS.slice(0, LEGACY_HEADERS.length).map(([h]) => h), LEGACY_HEADERS);
});

test('pipeline columns are appended after Book Rate with unique headers and keys', () => {
  const extra = COLUMNS.slice(LEGACY_HEADERS.length);
  assert.equal(extra.length, PIPELINES.reduce((n, c) => n + c.fields.length, 0));
  assert.equal(new Set(COLUMNS.map(([h]) => h)).size, COLUMNS.length);
  assert.equal(new Set(COLUMNS.map(([, k]) => k)).size, COLUMNS.length);
  assert.equal(extra[0][0], 'Property Sale - SMSF - Referrals');
});

test('browser pipeline list in index.html matches the server definition', () => {
  const match = html.match(/const PIPELINES = (\[[\s\S]*?\]);/);
  assert.ok(match, 'index.html must define const PIPELINES');
  const browser = Function(`return ${match[1]}`)();
  assert.deepEqual(browser, PIPELINES);
});

test('validateRecord keeps pipeline values as non-negative integers', () => {
  const input = {
    date: '17/11/2026', day: 'Tuesday', rep: 'Garry',
    [pipelineKey('smsf', 'referrals')]: '4',
    [pipelineKey('recPipe', 'interviewed')]: -3,
    [pipelineKey('property', 'ra')]: 99999,
  };
  const { ok, record } = validateRecord(input);
  assert.equal(ok, true);
  assert.equal(record[pipelineKey('smsf', 'referrals')], 4);
  assert.equal(record[pipelineKey('recPipe', 'interviewed')], 0);
  assert.equal(record[pipelineKey('property', 'ra')], 9999);
  assert.equal(record[pipelineKey('contract', 'sold')], 0);
});

test('columnLetter handles single and double letters', () => {
  assert.equal(columnLetter(1), 'A');
  assert.equal(columnLetter(26), 'Z');
  assert.equal(columnLetter(27), 'AA');
  assert.equal(columnLetter(52), 'AZ');
});

test('missingHeaders extends a legacy header row from the first new column', () => {
  const missing = missingHeaders(LEGACY_HEADERS);
  assert.equal(missing.startColumn, columnLetter(LEGACY_HEADERS.length + 1));
  assert.equal(missing.startColumn, 'AC');
  assert.equal(missing.headers.length, COLUMNS.length - LEGACY_HEADERS.length);
  assert.equal(missing.headers[0], 'Property Sale - SMSF - Referrals');
});

test('missingHeaders returns null when the header is complete or missing', () => {
  assert.equal(missingHeaders(COLUMNS.map(([h]) => h)), null);
  assert.equal(missingHeaders(undefined).startColumn, 'A');
});
