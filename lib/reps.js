// Rep names, states and timezones for the DRAPS rep list.

export const STATE_TIMEZONES = {
  NSW: 'Australia/Sydney',
  ACT: 'Australia/Sydney',
  VIC: 'Australia/Melbourne',
  QLD: 'Australia/Brisbane',
  SA: 'Australia/Adelaide',
  WA: 'Australia/Perth',
  TAS: 'Australia/Hobart',
  NT: 'Australia/Darwin',
};

export const MAX_NAME_LENGTH = 40;

export function normaliseRepName(input) {
  const name = typeof input === 'string' ? input.trim().replace(/\s+/g, ' ') : '';
  if (!name) return { ok: false, error: 'Rep name is required' };
  if (name.length > MAX_NAME_LENGTH) return { ok: false, error: `Rep name must be ${MAX_NAME_LENGTH} characters or fewer` };
  return { ok: true, name };
}

export function validateRepInput({ name, state } = {}) {
  const named = normaliseRepName(name);
  if (!named.ok) return named;
  const code = typeof state === 'string' ? state.trim().toUpperCase() : '';
  if (!Object.hasOwn(STATE_TIMEZONES, code)) {
    return { ok: false, error: `State must be one of ${Object.keys(STATE_TIMEZONES).join(', ')}` };
  }
  return { ok: true, name: named.name, state: code, timezone: STATE_TIMEZONES[code] };
}

// Calendar date and weekday as seen in the given timezone at the given instant.
export function localDateParts(timezone, instant = new Date()) {
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: timezone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    weekday: 'long',
  }).formatToParts(instant);
  const get = type => parts.find(p => p.type === type).value;
  return { date: `${get('day')}/${get('month')}/${get('year')}`, day: get('weekday') };
}
