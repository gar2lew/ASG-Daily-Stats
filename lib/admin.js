// Admin PIN check for the rep admin panel. The PIN lives in the ADMIN_PIN env var, never in the page.
import { createHash, timingSafeEqual } from 'node:crypto';

export const PIN_PATTERN = /^\d{4}$/;
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_MS = 15 * 60 * 1000;

// Wrong attempts per client. Each serverless instance keeps its own count, so this slows
// guessing but does not stop it completely. A 4-digit PIN relies on this limit.
const failures = new Map(); // client key -> { count, lockedUntil }

export function clientKey(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

// Returns { ok } or { ok: false, status, error }. Each request must send the PIN in x-admin-pin.
export function checkAdminPin(req, { now = Date.now(), expected = process.env.ADMIN_PIN } = {}) {
  if (!expected || !PIN_PATTERN.test(expected)) {
    return { ok: false, status: 500, error: 'ADMIN_PIN must be set to a 4-digit number' };
  }

  const key = clientKey(req);
  const state = failures.get(key);
  if (state && state.lockedUntil > now) {
    return { ok: false, status: 429, error: 'Too many wrong PIN attempts. Try again in 15 minutes.' };
  }

  const given = req.headers['x-admin-pin'];
  const matches = typeof given === 'string' && PIN_PATTERN.test(given) && timingSafeEqual(
    createHash('sha256').update(given).digest(),
    createHash('sha256').update(expected).digest(),
  );
  if (matches) {
    failures.delete(key);
    return { ok: true };
  }

  const count = (state?.count || 0) + 1;
  if (count >= MAX_FAILED_ATTEMPTS) {
    failures.set(key, { count: 0, lockedUntil: now + LOCK_MS });
  } else {
    failures.set(key, { count, lockedUntil: 0 });
  }
  return { ok: false, status: 401, error: 'Incorrect PIN' };
}
