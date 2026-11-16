import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const html = await readFile(path.join(here, '..', 'portal.html'), 'utf8');

function listedApps() {
  const match = html.match(/const APPS = (\[[\s\S]*?\]);/);
  assert.ok(match, 'portal.html must define const APPS');
  return Function(`return ${match[1]}`)();
}

test('every portal app has a name and an https or same-site url', () => {
  const apps = listedApps();
  assert.ok(apps.length > 0, 'portal lists at least one app');
  for (const app of apps) {
    assert.ok(app.name && app.name.trim(), `app name required: ${JSON.stringify(app)}`);
    const ok = app.url === '/' || /^https:\/\//.test(app.url);
    assert.ok(ok, `app url must be https or "/": ${app.url}`);
  }
});

test('portal app names are unique', () => {
  const names = listedApps().map(app => app.name.toLowerCase());
  assert.equal(new Set(names).size, names.length);
});

test('portal has no API calls or passcode prompt', () => {
  assert.doesNotMatch(html, /fetch\(|XMLHttpRequest|x-draps-passcode/);
});
