# Rep identity and timezones (design)

Status: draft for approval. Part 1 of 3 (rep identity, then the daily import into Week to Date, then Ross's admin screen in the weekly sheet).

## Intent

Reps should pick their name from a shared list and never have to type it again, on any device. Each rep's timezone comes from their record, so a daily DRAPS record is dated in the rep's own timezone, not in one fixed zone. Example: Joe (Brisbane) and Jaide (Perth) each get the date where they work.

## Goals

- A rep types their name and picks their state once, on first use. From then on the name is in the dropdown on every device.
- The rep list is shared, held in the weekly reporting spreadsheet, so Ross can see and edit it.
- A rep's timezone is set by their record, not by the device or browser.
- The DRAPS date and weekday come from the rep's timezone.

## Non-goals

- No passwords or per-rep sign-in. The existing shared passcode still gates the API.
- No approval step for new names. A new name appears in the dropdown at once (decided).
- No change to the email route or its subject format in this part.

## Anti-goals

- A rep should never be able to create a duplicate of an existing name, even by typing it in a different case.
- Changing a rep's record must not rewrite past DRAPS Log rows.

## Current state

- The app asks for a rep name in a free-text field. The date is fixed to Perth (`Australia/Perth`) in `index.html`.
- The sales checklist app (`gar2lew/sales_checklist_ia`) picks staff from a dropdown and remembers the last pick in `localStorage`. Its list is per browser. That does not suit DRAPS, which runs on several devices.

## Design

### Reps tab

A `Reps` tab in the weekly report spreadsheet (same spreadsheet as `DRAPS Log`, id = `SHEET_ID`).

| Column | Meaning |
|---|---|
| Name | Display name as typed on first use. Unique, case-insensitive. |
| State | One of NSW, ACT, VIC, QLD, SA, WA, TAS, NT. |
| Timezone | IANA name derived from State (see below). Stored so the mapping is visible to Ross. |
| Active | TRUE or FALSE. Inactive reps are hidden from the dropdown but keep their history. |
| Added | Date the row was created (DD/MM/YYYY). |

Ross can edit this tab directly. Changing a timezone changes only future dates, never existing `DRAPS Log` rows.

### State to timezone (my call)

| State | Timezone |
|---|---|
| NSW, ACT | Australia/Sydney |
| VIC | Australia/Melbourne |
| QLD | Australia/Brisbane |
| SA | Australia/Adelaide |
| WA | Australia/Perth |
| TAS | Australia/Hobart |
| NT | Australia/Darwin |

Using IANA names means daylight saving is handled by the platform.

### API

Both routes require the existing `x-draps-passcode` header.

- `GET /api/reps` returns active reps as `[{ name, state, timezone }]`, sorted by name.
- `POST /api/reps` with `{ name, state }`:
  - Trims the name and rejects it if it is empty or longer than 40 characters.
  - Rejects a state that is not in the list above.
  - If a case-insensitive match already exists, returns that rep and adds nothing.
  - Otherwise appends a row and returns the new rep.

Writes go through the same service account as `api/publish.js`.

### Web app

- **First use** (no rep saved on this device): the rep sees the dropdown and an "Add my name" option. Choosing it asks for name and state, then saves.
- **Later use**: the rep picks their name from the dropdown. The chosen name is stored in `localStorage` so it is preselected next time. This is only a convenience. The source of truth is the sheet.
- **Date**: today's date and weekday in the selected rep's timezone. This replaces the fixed Perth date in `index.html`.
- The publish record and the email subject both use this date.

### Matching rules for DRAPS Log

`api/publish.js` already matches on date and rep name. Renaming a rep in the `Reps` tab will therefore leave their old rows unmatched. Renames should be treated as new reps, or the old rows should be corrected by hand. This is a known limit, not solved here.

## Approaches considered

1. **Per-browser list, as in the sales app.** Simple, but reps on other devices would not see new names and would create duplicates. Rejected.
2. **Shared list in the weekly sheet, read by the web app (chosen).** Works across devices. Ross can edit it. Needs one read on load and one write on first use.
3. **Shared list in Vercel storage.** Works across devices, but splits the source of truth away from the spreadsheet Ross already uses. Rejected.

## Open items (my calls, can be changed)

- Name matching is exact, ignoring case and surrounding spaces. No fuzzy matching of "Joe" and "Joe Smith".
- A deactivated rep stays visible in old reports.
