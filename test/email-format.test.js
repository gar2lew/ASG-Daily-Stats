import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildEmailHtml } from '../lib/email-format.js';

const SUBJECT = 'DRAPS - Gary - Thursday - 19/11/2026';
const BODY = `GARRY\n\nD-3\nR-1\nA-1\nP-1\nS-1\nNote - Testing notes\n\nCalls\nLead Calls - 4\nFirst Consult Calls - 2\n\nFollow Up FC's - 1\nSpoke To - 2\nBooked - 1\n\nProperty Sale\nReferrals - 3\nAppointments - 2`;

test('formats a DRAPS email into a clear, Outlook-friendly report', () => {
  const html = buildEmailHtml(SUBJECT, BODY);

  assert.match(html, /Daily DRAPS/i);
  assert.match(html, /GARRY/);
  assert.match(html, /Calls/);
  assert.match(html, /Follow Up FC&#39;s|Follow Up FC's/);
  assert.match(html, /Property Sale/);
  assert.match(html, /Lead Calls/);
  assert.match(html, /Testing notes/);
  assert.match(html, /role="presentation"/);
});

test('escapes subject and report text before adding HTML markup', () => {
  const html = buildEmailHtml('<img src=x onerror=alert(1)>', 'Rep <script>alert(1)</script>\n\nCalls\nNote - <b>unsafe</b>');

  assert.doesNotMatch(html, /<script|<img src=x|<b>unsafe<\/b>/i);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /&lt;img src=x/);
  assert.match(html, /&lt;b&gt;unsafe&lt;\/b&gt;/);
});
