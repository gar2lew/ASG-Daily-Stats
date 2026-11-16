# Rep identity and timezones Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reps pick their name from a shared list held in the weekly spreadsheet, add their name and state on first use, and the DRAPS date and weekday follow the rep's timezone.

**Architecture:** Pure helpers in `lib/reps.js` (validation, state to timezone, local date). A sheet store in `lib/reps-store.js` reads and appends a `Reps` tab through an injected Sheets client. A route in `api/reps.js` exposes `GET` and `POST`, both behind the existing passcode. `index.html` swaps the free-text rep field for a dropdown fed by `GET /api/reps`, adds a first-use form, and dates records in the selected rep's timezone.

**Tech Stack:** Node 24 ESM, `googleapis` (already installed), built-in `node:test` (no new dependency), vanilla HTML/JS in `index.html`.

**Spec:** `docs/superpowers/specs/16-11-2026-rep-identity-timezone-design.md`

## Global Constraints

- The `COLUMNS` order in `lib/draps.js` must not change. Existing `DRAPS Log` rows depend on it.
- Passcode header is `x-draps-passcode`, checked by `checkPasscode()` in `lib/draps.js`. Both new methods must use it.
- Sheet tab name is exactly `Reps`. Header row is exactly: `Name`, `State`, `Timezone`, `Active`, `Added`.
- Valid states are exactly: `NSW`, `ACT`, `VIC`, `QLD`, `SA`, `WA`, `TAS`, `NT`.
- Timezones are exactly: NSW and ACT `Australia/Sydney`; VIC `Australia/Melbourne`; QLD `Australia/Brisbane`; SA `Australia/Adelaide`; WA `Australia/Perth`; TAS `Australia/Hobart`; NT `Australia/Darwin`.
- Rep names: trimmed, at most 40 characters, not empty. Matching is case-insensitive.
- Dates are `DD/MM/YYYY`. Weekday is the English long name, for example `Monday`.
- Do not commit `.env` values, the passcode or service account JSON.

## Review Focus

1. Same name typed with different case or extra spaces creates a duplicate rep → `reps.test.js` normalisation test and `reps-store.test.js` dedupe test.
2. Empty, whitespace-only or 41-character name is accepted → `reps.test.js` validation tests.
3. Lowercase or padded state (`qld `) is rejected even though it is unambiguous → `reps.test.js` state test (accepted as `QLD`).
4. Near midnight, the date differs between Perth and Brisbane, and the app uses the device clock instead of the rep's zone → `reps.test.js` date test with a fixed instant.
5. `Reps` tab missing, empty, or containing blank and inactive rows → `reps-store.test.js` tests.

---

### Task 1: Pure helpers (`lib/reps.js`)

**Files:**
- Create: `lib/reps.js`
- Test: `test/reps.test.js`

**Interfaces:**
- Produces: `STATE_TIMEZONES` (object, state code to IANA name, exactly as in Global Constraints); `normaliseRepName(input) -> { ok: true, name } | { ok: false, error }`; `validateRepInput({ name, state }) -> { ok: true, name, state, timezone } | { ok: false, error }`; `localDateParts(timezone, instant = new Date()) -> { date: 'DD/MM/YYYY', day: 'Monday' }`.

- [ ] **Step 1: Write failing tests** in `test/reps.test.js`, using `node:test` and `node:assert/strict`. Cover: trim and collapse internal whitespace (`'  Joe   Smith '` becomes `'Joe Smith'`); empty and whitespace-only names rejected; 41-character name rejected and 40 accepted; `validateRepInput({ name: 'Jaide', state: 'qld ' })` returns `state: 'QLD'`, `timezone: 'Australia/Brisbane'`; `state: 'XX'` rejected; `localDateParts('Australia/Perth', new Date('2026-11-16T16:30:00Z'))` returns `{ date: '17/11/2026', day: 'Tuesday' }` (00:30 Perth on 17 Nov) while `localDateParts('Australia/Brisbane', same instant)` returns `{ date: '17/11/2026', day: 'Tuesday' }` (02:30 Brisbane); and an instant at `2026-11-16T13:30:00Z` returns `16/11/2026`, `Monday` in Perth (21:30) and `16/11/2026` in Brisbane (23:30).

- [ ] **Step 2: Run and confirm failure**

Run: `node --test test/reps.test.js`
Expected: FAIL, module `../lib/reps.js` not found.

- [ ] **Step 3: Implement `lib/reps.js`** with the exports listed above. Use `Intl.DateTimeFormat('en-AU', { timeZone, year, month: '2-digit', day: '2-digit', weekday: 'long' })` with `formatToParts` for the date and weekday. Reject a `state` not in `STATE_TIMEZONES` after uppercasing and trimming. Errors are plain sentences, for example `Rep name is required` and `State must be one of NSW, ACT, VIC, QLD, SA, WA, TAS, NT`.

- [ ] **Step 4: Run and confirm pass**

Run: `node --test test/reps.test.js`
Expected: all tests pass, exit code 0.

- [ ] **Step 5: Commit**

```bash
git add lib/reps.js test/reps.test.js
git commit -m "feat: add rep name, state and local date helpers"
```

---

### Task 2: Sheet store (`lib/reps-store.js`)

**Files:**
- Create: `lib/reps-store.js`
- Test: `test/reps-store.test.js`

**Interfaces:**
- Consumes: `validateRepInput` and `STATE_TIMEZONES` from Task 1.
- Produces: `REPS_TAB = 'Reps'`; `listReps(sheets, spreadsheetId) -> [{ name, state, timezone, active, added }]` (active reps only, sorted by name, blank rows skipped); `addRep(sheets, spreadsheetId, input, today) -> { rep, created }` where `today` is a `DD/MM/YYYY` string.

- [ ] **Step 1: Write failing tests** using a fake Sheets client: an object with `spreadsheets.get`, `spreadsheets.batchUpdate`, `spreadsheets.values.get` and `spreadsheets.values.append`, each recording calls. Cover: `listReps` ignores rows with `Active` set to `FALSE` and blank names; `addRep` on an existing name in different case (`'JOE smith'` against `'Joe Smith'`) returns `{ created: false }` and appends nothing; a new name appends one row `[name, state, timezone, 'TRUE', today]`; when the spreadsheet has no `Reps` tab, `addRep` calls `batchUpdate` with `addSheet` and writes the header row first.

- [ ] **Step 2: Run and confirm failure**

Run: `node --test test/reps-store.test.js`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `lib/reps-store.js`**, following the `ensureTab` pattern in `api/publish.js`. Read `'Reps'!A:E`. Treat the first row as the header and skip it. Compare names with `toLowerCase()` after trimming. Append with `valueInputOption: 'USER_ENTERED'`, matching `api/publish.js`. Do not overwrite or delete rows.

- [ ] **Step 4: Run and confirm pass**

Run: `node --test test/reps-store.test.js`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/reps-store.js test/reps-store.test.js
git commit -m "feat: add Reps tab store with case-insensitive dedupe"
```

---

### Task 3: Routes (`api/reps.js`)

**Files:**
- Create: `lib/sheets.js` (builds the googleapis Sheets client from `GOOGLE_SERVICE_ACCOUNT_JSON`, the same way `api/publish.js` does)
- Create: `api/reps.js`
- Test: `test/reps-api.test.js`

**Interfaces:**
- Consumes: `checkPasscode`, `assertEnv` from `lib/draps.js`; `listReps`, `addRep` from Task 2; `validateRepInput` from Task 1.
- Produces: `handleReps(req, res, deps = { getSheets, spreadsheetId: () => process.env.SHEET_ID, today: () => localDateParts('Australia/Perth').date })` exported from `api/reps.js`, plus the default export `(req, res) => handleReps(req, res)`.

- [ ] **Step 1: Write failing tests** with a fake `res` (records `status` and `json`) and injected `deps`. Cover: missing passcode returns 401 and never calls the store; `GET` returns 200 with `{ ok: true, reps }`; `POST` with a valid body returns 200 and `{ created: true }` for a new name, `{ created: false }` for a duplicate; `POST` with an invalid state returns 400 and does not touch the store; another method (`PUT`) returns 405.

- [ ] **Step 2: Run and confirm failure**

Run: `node --test test/reps-api.test.js`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `lib/sheets.js` and `api/reps.js`.** Call `checkPasscode(req)` before anything else, as `api/publish.js` does. For `POST`, read `req.body` and pass it to `validateRepInput`, then `addRep` with `today: deps.today()`. Return the same error shape as the other routes. Log store errors with `console.error` and return 500 with a generic message.

- [ ] **Step 4: Run and confirm pass**

Run: `node --test test/reps-api.test.js`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/sheets.js api/reps.js test/reps-api.test.js
git commit -m "feat: add GET and POST /api/reps behind passcode"
```

---

### Task 4: Web app (`index.html`)

**Files:**
- Modify: `index.html`. The rep field is around the `repName` input, and the request helper is `postJson` (search for `const postJson`). The date helper is around `buildSubject` and the record builder that sets `day` and `date`.

**Interfaces:**
- Consumes: `GET /api/reps` and `POST /api/reps` from Task 3, with the passcode header.
- Produces: the same `byId('repName').value` contract the rest of the page uses. `repName` becomes a `<select>` whose value is the rep's display name.

- [ ] **Step 1: Add a request helper that supports `GET`.** Extend `sendRequest` to accept a method. Reuse the existing passcode prompt and 401 retry in `postJson` for both methods.

- [ ] **Step 2: Replace the rep input.** Keep the `id="repName"` so the existing reads still work. Populate options from `GET /api/reps` on load. If the device has a stored name in `localStorage` (key `drapsRepName`, read in try/catch) that is still active, preselect it. Add an "Add my name" button. It opens a small inline form with name and state (a `<select>` of the eight states). Submitting calls `POST /api/reps`, then adds the option and selects it. Store the chosen name in `localStorage` with try/catch.

- [ ] **Step 3: Date from the rep's timezone.** Replace the fixed `Australia/Perth` formatter with one that uses the selected rep's `timezone`, taken from the list returned by the API. Use the `DD/MM/YYYY` and long weekday format. If no rep is selected, disable both buttons, as the current code does for an empty name.

- [ ] **Step 4: Syntax check the inline script**

Run: extract the `<script>` block from `index.html` to a scratch file, then `node --check` it. Also run `npm run check`.
Expected: both exit 0.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: rep dropdown with first-use add and rep-timezone dates"
```

---

### Task 5: Docs, tests script and verification

**Files:**
- Modify: `package.json` (add `"test": "node --test"` to `scripts`)
- Modify: `README.md` (add the `Reps` tab and the rep endpoints)

- [ ] **Step 1: Add the `test` script and run the full suite**

Run: `npm test`
Expected: all tests from Tasks 1 to 3 pass, exit code 0.

- [ ] **Step 2: Run the check script**

Run: `npm run check`
Expected: exit code 0.

- [ ] **Step 3: Update README** with the `Reps` tab layout and a line that the first rep added appears in the dropdown.

- [ ] **Step 4: Manual check after deployment** (cannot be automated here): with a test spreadsheet, add a rep, confirm the row, reload from a second browser and confirm the name appears, publish one record and confirm `DRAPS Log` gets the rep's timezone date.

- [ ] **Step 5: Commit**

```bash
git add package.json README.md
git commit -m "docs: document Reps tab and add test script"
```

---

## Self-review notes

- Spec coverage: Reps tab (Task 2), state to timezone (Task 1), API (Task 3), first use and dropdown (Task 4), date from rep timezone (Tasks 1 and 4), matching rules (Task 2), docs (Task 5).
- Known limit kept from the spec: renaming a rep leaves old `DRAPS Log` rows unmatched. Not solved here.
- Concurrent first-use adds of the same name can still race. Accepted for this part, as the spec's Ross-edit path covers cleanup.
