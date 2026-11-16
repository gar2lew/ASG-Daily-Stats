import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STATE_TIMEZONES, normaliseRepName, validateRepInput, localDateParts } from '../lib/reps.js';

test('name is trimmed and internal whitespace collapsed', () => {
  assert.deepEqual(normaliseRepName('  Joe   Smith '), { ok: true, name: 'Joe Smith' });
});

test('empty and whitespace-only names are rejected', () => {
  assert.equal(normaliseRepName('').ok, false);
  assert.equal(normaliseRepName('   ').ok, false);
});

test('40 characters accepted, 41 rejected', () => {
  assert.equal(normaliseRepName('a'.repeat(40)).ok, true);
  assert.equal(normaliseRepName('a'.repeat(41)).ok, false);
});

test('state is case-insensitive and padding-tolerant, mapped to timezone', () => {
  assert.deepEqual(validateRepInput({ name: 'Jaide', state: 'qld ' }), {
    ok: true, name: 'Jaide', state: 'QLD', timezone: 'Australia/Brisbane',
  });
});

test('unknown state is rejected', () => {
  assert.equal(validateRepInput({ name: 'Joe', state: 'XX' }).ok, false);
});

test('state timezone map matches the spec exactly', () => {
  assert.deepEqual(STATE_TIMEZONES, {
    NSW: 'Australia/Sydney', ACT: 'Australia/Sydney', VIC: 'Australia/Melbourne',
    QLD: 'Australia/Brisbane', SA: 'Australia/Adelaide', WA: 'Australia/Perth',
    TAS: 'Australia/Hobart', NT: 'Australia/Darwin',
  });
});

test('local date follows the rep timezone, not the device', () => {
  const instant = new Date('2026-11-16T16:30:00Z'); // 00:30 Tue Perth, 02:30 Tue Brisbane
  assert.deepEqual(localDateParts('Australia/Perth', instant), { date: '17/11/2026', day: 'Tuesday' });
  assert.deepEqual(localDateParts('Australia/Brisbane', instant), { date: '17/11/2026', day: 'Tuesday' });
});

test('same instant can be a different day in two timezones', () => {
  const instant = new Date('2026-11-16T13:30:00Z'); // 21:30 Mon Perth, 23:30 Mon Brisbane
  assert.deepEqual(localDateParts('Australia/Perth', instant), { date: '16/11/2026', day: 'Monday' });
  assert.deepEqual(localDateParts('Australia/Brisbane', instant), { date: '16/11/2026', day: 'Monday' });
  const later = new Date('2026-11-16T15:00:00Z'); // 23:00 Mon Perth, 01:00 Tue Brisbane
  assert.equal(localDateParts('Australia/Perth', later).day, 'Monday');
  assert.equal(localDateParts('Australia/Brisbane', later).day, 'Tuesday');
});
