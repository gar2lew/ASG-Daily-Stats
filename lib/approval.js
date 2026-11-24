// Publishes today's figures straight into the weekly report's approval tab.
// The tab's header row is row 5 and data starts on row 6. Columns A to Y match the
// headers in the weekly spreadsheet. Super and RE-FI are not in DRAPS, so they are
// left blank for Hannah to enter on Daily Entry.
import { pipelineKey } from './draps.js';

export const APPROVAL_TAB = 'Rep DRAPS - For Approval';
export const APPROVAL_FIRST_ROW = 6;

// [header on the approval tab, key in the record (null = blank)]
export const APPROVAL_COLUMNS = [
  ['Logged At', 'loggedAt'],
  ['Day', 'date'],
  ['Rep', 'rep'],
  ['Door Qs', 'dValue'],
  ['FC Apps', pipelineKey('fcPipe', 'appointments')],
  ['FC Presented', pipelineKey('fcPipe', 'presented')],
  ['FR Booked', pipelineKey('fcPipe', 'sold')],
  ['Finance Apps', pipelineKey('financePipe', 'appointments')],
  ['Finance Presented', pipelineKey('financePipe', 'presented')],
  ['Sales Booked', pipelineKey('financePipe', 'sold')],
  ['Property Booked', pipelineKey('property', 'appointments')],
  ['Property Presented', pipelineKey('property', 'presented')],
  ['Properties Sold', pipelineKey('property', 'sold')],
  ['SMSF Booked', pipelineKey('smsf', 'appointments')],
  ['SMSF Presented', pipelineKey('smsf', 'presented')],
  ['SMSF Sold', pipelineKey('smsf', 'sold')],
  ['Super Booked', null],
  ['Super Presented', null],
  ['Super Sales', null],
  ['Contract Booked', pipelineKey('contract', 'booked')],
  ['Contract Presented', pipelineKey('contract', 'presented')],
  ['Contracts Signed', pipelineKey('contract', 'sold')],
  ['RE-FI Booked', null],
  ['RE-FI Presented', null],
  ['RE-FIs Done', null],
];

// Brisbane time, DD/MM/YYYY HH:mm, for the Logged At column.
export function loggedAtBrisbane(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-AU', {
      timeZone: 'Australia/Brisbane', day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(now).map(p => [p.type, p.value])
  );
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`;
}

// One approval row from a validated record. Values are in the order of APPROVAL_COLUMNS.
export function approvalRow(record, loggedAt) {
  return APPROVAL_COLUMNS.map(([, key]) => {
    if (key === null) return '';
    if (key === 'loggedAt') return loggedAt;
    return record[key] ?? '';
  });
}
