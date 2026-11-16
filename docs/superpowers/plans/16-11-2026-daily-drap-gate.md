# Daily DRAPS Input Gate Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put a "Daily DRAPS Input" gate screen before the tally. A rep picks their name (or adds it), presses Start, and only then sees the tally, dated in their timezone.

**Architecture:** The app stays one static `index.html` with an inline script. A gate `<section>` holds the existing rep field (same IDs) and a Start button. A view switch shows either the gate or the tally. The tally has a "Change rep" control that returns to the gate. A small static test server serves the page with a stubbed `/api/reps` so the view logic can be checked in the Browser pane.

**Tech Stack:** Vanilla HTML/CSS/JS in `index.html`; Node 24 for the test server; Browser pane for checks.

**Spec:** `docs/superpowers/specs/16-11-2026-daily-drap-gate-design.md`

## Global Constraints

- Visual tokens for the gate come from the reference: navy `#0a1f3d`, gold `#b8924a`, stone background `#ece6d8`, muted `#9a9384`, border `#d6cfc1`, shadow `0 30px 80px -20px rgba(10,31,61,0.45)`. Serif for the brand title, sans for body.
- The gate applies only to the gate screen. The tally keeps its current styles.
- Keep these element IDs unchanged: `repName`, `repAddBtn`, `repAddForm`, `repNewName`, `repNewState`, `repAddStatus`, `publishBtn`, `emailBtn`, `dateChip`, `actionStatus`, `drapsRepName` (localStorage key).
- Keep `API_REPS = '/api/reps'`, `API_PUBLISH`, `API_EMAIL` and the passcode prompt unchanged.
- Start stays disabled until a rep name that is in the loaded list is selected.
- Do not port the React reference. Restyle the vanilla page only.
- Do not clear any numbers, notes or labels when the rep changes or the gate is reopened.
- Phone width is 375px: 16px side gutter, no horizontal page scroll.

## Review Focus

1. Start enabled with no rep chosen, or with a saved name that is no longer on the list → Start must stay disabled.
2. A saved rep name is inactive or missing when the page loads → gate shows no selection; the tally is not reached.
3. Changing rep or pressing "Change rep" while numbers are typed → numbers and notes are unchanged.
4. `/api/reps` fails on load → the gate shows the error and Start stays disabled.
5. Phone width (375px) → no horizontal scroll and the Start button is fully visible.

---

### Task 1: Test server and gate markup

**Files:**
- Create: `test/e2e-server.mjs` (static server for the repo root; `GET /api/reps` returns a fixed list; `POST /api/publish` and `POST /api/email` return `{ ok: true }`; every route ignores the passcode)
- Modify: `index.html` (add `<section id="gate">` before `<header class="topbar">`; move the rep field markup into it; add `#gateStartBtn`; add `#changeRepBtn` in the topbar)

**Interfaces:**
- Produces: the gate `<section id="gate">`, with `#gateStartBtn` (disabled by default) and the moved `#repName` / `#repAddBtn` / `#repAddForm` markup; `#changeRepBtn` in the topbar; a `body[data-view="gate"|"tally"]` attribute that CSS uses to show one view.

- [ ] **Step 1: Write the server**

`test/e2e-server.mjs` uses `node:http` and `node:fs`. Port from `process.env.PORT || 4173`. Serve files relative to the repo root with content types for `.html`, `.js`, `.css`. Fixed rep list:

```json
{ "ok": true, "reps": [
  { "name": "Jaide", "state": "WA", "timezone": "Australia/Perth" },
  { "name": "Joe Smith", "state": "QLD", "timezone": "Australia/Brisbane" }
] }
```

- [ ] **Step 2: Run the server and check it serves the page**

Run: `node test/e2e-server.mjs` in one terminal, then `curl -s http://localhost:4173/api/reps`
Expected: the JSON above.

- [ ] **Step 3: Add the gate markup and view attribute**

Set `<body data-view="gate">`. Put the gate section first. Its left panel is the brand block (title "Daily DRAPS Input", one line of purpose, the reporting day). Its right panel holds the moved rep field and a `#gateStartBtn` labelled "Start", `disabled` by default. Add `<button id="changeRepBtn" type="button" hidden>Change rep</button>` to the topbar.

- [ ] **Step 4: Browser check**

Open `http://localhost:4173` in the Browser pane. Expected: the gate is visible, the tally is hidden, `#gateStartBtn` is disabled, and `#repName` lists Jaide and Joe Smith.

- [ ] **Step 5: Commit**

```bash
git add test/e2e-server.mjs index.html
git commit -m "feat: gate screen markup and local test server"
```

---

### Task 2: View switch and Start behaviour

**Files:**
- Modify: `index.html` (CSS rules keyed on `body[data-view]`; JS: enable Start, Start and Change rep handlers)

**Interfaces:**
- Consumes: `#repName`, `#gateStartBtn`, `#changeRepBtn`, `localStorage` key `drapsRepName`, `repList` (the loaded list, with `name` and `timezone`).
- Produces: `showView('gate' | 'tally')`, which sets `document.body.dataset.view` and the `hidden` state of `#changeRepBtn`.

- [ ] **Step 1: Browser check (failing)**

With the server running, in the Browser pane: select Jaide, check `#gateStartBtn` is still disabled (it isn't wired yet). Expected: FAIL. Record the result in the ledger.

- [ ] **Step 2: Implement**

- `updateStartButton()`: `gateStartBtn.disabled = !repList.some(r => r.name === repName.value)`. Call it from `setRepOptions`, from the `repName` change listener, and after a successful add.
- `showView(view)`: set `document.body.dataset.view`; set `changeRepBtn.hidden = view !== 'tally'`.
- Start click: `showView('tally')`, then `update()`.
- Change rep click: `showView('gate')`, then `updateStartButton()`. Do not touch any tally input.
- On load, call `showView('gate')`. Restore the saved rep only if it is in the list; otherwise show no selection.
- CSS: `body[data-view="gate"] .topbar, body[data-view="gate"] main.app { display:none }`; `body[data-view="tally"] #gate { display:none }`.

- [ ] **Step 3: Browser check (passes)**

Expected in the Browser pane:
- Select Jaide → Start enabled. Press Start → gate hidden, tally visible, Change rep visible.
- Press Change rep → gate visible, Jaide still selected, Start enabled.
- Type `5` in one tally counter, press Change rep, press Start → the `5` is still there.
- Reload with `drapsRepName` set to `Jaide` in localStorage → Jaide preselected on the gate.
- Set `drapsRepName` to `Nobody` and reload → no selection; Start disabled.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: gate Start and Change rep view switch"
```

---

### Task 3: Tally date from the selected rep

**Files:**
- Modify: `index.html` (`dateChip` text is set from the selected rep's timezone when Start is pressed or the rep changes)

**Interfaces:**
- Consumes: `repList`, `repToday()` (already defined; returns `{ date, weekday }` for the selected rep).
- Produces: `updateDateChip()`, which sets `dateChip` to the weekday and date from `repToday()`.

- [ ] **Step 1: Browser check (failing)**

Select Jaide (Perth) and note the `dateChip` text. Select Joe Smith (Brisbane). Expected to fail: the chip does not change, because it is set once from the device clock.

- [ ] **Step 2: Implement**

Replace the one-off `dateChip` text assignment with `updateDateChip()`, which formats `repToday()` as `weekday, DD Mon YYYY`. Call it on load, on rep change and on Start.

- [ ] **Step 3: Browser check (passes)**

Use Perth time vs Brisbane time: with the test server's fixed clock not controllable, check the chip text equals the weekday and date from `repToday()` for each rep (read it in the Browser pane with `javascript_tool`).

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: date chip follows selected rep timezone"
```

---

### Task 4: Phone layout and error state

**Files:**
- Modify: `index.html` (media query for the gate; error text for a failed rep load)

**Interfaces:**
- Consumes: `#gate`, `#gateStartBtn`, `#repAddStatus`.

- [ ] **Step 1: Browser check at 375px (failing first)**

Resize the Browser pane to the mobile preset. Read `document.documentElement.scrollWidth` with `javascript_tool`. Expected to fail if the gate overflows.

- [ ] **Step 2: Implement**

Gate stacks to one column below 768px. Left and right panels get `width:100%`. Keep 16px side gutter. Start button full width with 44px minimum height.

- [ ] **Step 3: Browser check (passes)**

`scrollWidth` equals `clientWidth` at 375px. Start is visible without scrolling horizontally.

- [ ] **Step 4: Error state**

Stop the test server, reload the page. Expected: the gate shows "Could not load rep names", `#gateStartBtn` is disabled, and no tally is reachable. Restart the server.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: gate phone layout and rep load error state"
```

---

### Task 5: Verification and handoff

**Files:**
- Modify: `README.md` (one paragraph on the gate and how to run `test/e2e-server.mjs`)

- [ ] **Step 1: Syntax**

Extract the inline script and run `node --check` on it, then `npm run check` and `npm test`.
Expected: all exit 0; `npm test` reports 23 pass, 0 fail.

- [ ] **Step 2: Full Browser pass**

Repeat the checks from Tasks 2–4 in one pass. Note each result.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: describe the gate screen and local test server"
```

---

## Self-review notes

- Spec coverage: gate layout (Task 1), view switch and Start (Task 2), date from rep timezone (Task 3), phone layout and error state (Task 4), docs (Task 5).
- Review Focus 1–5 each map to a check in Tasks 2, 4 and 5.
- Known limit: the Browser checks use a fixed server clock, so Task 3 compares the chip to `repToday()` rather than to a fixed date.
