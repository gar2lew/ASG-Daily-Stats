import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { get } from 'node:http';
import { networkInterfaces } from 'node:os';
import { fileURLToPath } from 'node:url';

const SERVER = fileURLToPath(new URL('./e2e-server.mjs', import.meta.url));
const PORT = 4999;

const lanAddresses = () =>
  Object.values(networkInterfaces()).flat().filter(i => i.family === 'IPv4' && !i.internal).map(i => i.address);

const tryGet = (host) => new Promise(resolve => {
  const req = get({ host, port: PORT, path: '/', timeout: 1500 }, res => { res.resume(); resolve('reachable'); });
  req.on('error', err => resolve(err.code));
  req.on('timeout', () => { req.destroy(); resolve('timeout'); });
});

test('direct run serves loopback only, not the local network', async t => {
  const child = spawn(process.execPath, [SERVER], { env: { ...process.env, PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    await new Promise((resolve, reject) => {
      child.stdout.on('data', d => { if (String(d).includes('e2e server on')) resolve(); });
      child.on('exit', code => reject(new Error(`server exited ${code}`)));
      setTimeout(() => reject(new Error('server did not start')), 5000);
    });
    assert.equal(await tryGet('127.0.0.1'), 'reachable');
    const lan = lanAddresses();
    if (lan.length === 0) { t.skip('no LAN IPv4 address to test against'); return; }
    for (const host of lan) {
      assert.notEqual(await tryGet(host), 'reachable', `reachable on ${host}`);
    }
  } finally {
    child.kill();
  }
});
