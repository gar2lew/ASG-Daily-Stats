# DRAPS Daily Stats: handover for Claude Code

## Goal

Turn the single-page daily stats app (`index.html`, hosted on Vercel from `gar2lew/ASG-Daily-Stats`) into a full web app with a backend. It has two end-of-day buttons:

1. **Publish Results**: writes the day's DRAPS figures as one row to a `DRAPS Log` tab in a Google Sheet. The sheet will later be linked to the main weekly-report spreadsheet used by the Operations Manager.
2. **Send to Management**: emails the WhatsApp-format report to preset recipients. Subject: `DRAPS - Rep Name - Day - DD/MM/YYYY`, using Perth date and weekday.

## Current state: nothing is pushed yet

- The repo on GitHub is unchanged. The latest commit is `9543f51 fix: correctly split calls into activity categories`.
- All changes exist only as a patch file: **`draps-full-app.patch`** (sent to the user from the earlier chat). Start by applying it.
- The patch touches `index.html`, `README.md`, `package.json`, `package-lock.json`, `.gitignore`, `api/publish.js`, `api/email.js` and `lib/draps.js`.
- It also deletes `apps-script/` (created in an earlier step, then removed). If that folder exists in the repo, delete it.
- The earlier `draps-end-of-day-buttons.patch` is obsolete. Don't apply it.

Apply it from the repo root:

```
git checkout -b feature/end-of-day-backend
git apply draps-full-app.patch
npm install
npm run check
```

## Architecture

- **Front end**: `index.html`, one static file with inline CSS and JS. No build step.
- **Backend**: Vercel serverless functions in `/api`, Node ESM (`"type": "module"`, Node 18+).
  - `api/publish.js` (POST `{ record }`): uses the `googleapis` package and a Google service account. It validates the record, then:
    - Creates the `DRAPS Log` tab if missing.
    - Searches column A (date) and column C (rep). If the same date and rep exist, it updates that row. Otherwise it appends.
    - Writes the header row if the sheet is empty.
  - `api/email.js` (POST `{ subject, body }`): uses `nodemailer` with Gmail SMTP and an app password. It checks the subject against a regex and limits body length to 10,000 characters.
- **Shared**: `lib/draps.js` holds the column order (`COLUMNS`), `validateRecord()` and `assertEnv()`. Keep `COLUMNS` in step with the sheet headers.

The front end calls `/api/publish` and `/api/email` with JSON. There are no secrets in the page.

## Environment variables (Vercel project settings)

| Name | Purpose |
| --- | --- |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Full JSON key of a Google service account. Keep it secret. |
| `SHEET_ID` | The ID in the spreadsheet URL `/d/<SHEET_ID>/edit`. |
| `GMAIL_USER` | The Gmail address that sends the email. |
| `GMAIL_APP_PASSWORD` | Gmail app password. Requires 2-Step Verification. |
| `MANAGEMENT_RECIPIENTS` | Comma-separated management email addresses. |

The spreadsheet must be shared with the service account's email address as Editor.

## Decisions already made (from the user)

- Scope: "full app with backend" (not a front-end-only change, and not an Apps Script backend).
- Storage: Google Sheets via a service account.
- Email: Gmail SMTP with an app password.

## Known gaps and risks to resolve

1. **The API routes have no authentication.** Anyone who finds `/api/publish` or `/api/email` can write rows or send email to management. This is the most important open item. Options: a shared secret header checked in both routes (set via env var, never in `index.html`), or Vercel deployment protection. Recommend adding one before going live.
2. **Nothing has been run live.** Only syntax and import checks passed. Test with a sample record against a test sheet, and send one email to a test address. Check the subject and the Perth date.
3. **Subject format.** The user's spec was `DRAPS -Rep Name - Day - DD/MM/YYYY`. The code uses `DRAPS - Rep - Day - date`, with a space after the dash. Confirm with the user.
4. **"Day" means weekday name** (for example `Monday`). Confirm this is what they want.
5. **Front-end scope beyond the backend was not defined.** The user chose "full app with backend" but did not list extra UI features such as history, past-day view or export. Ask before building those.
6. **Gmail limits.** An app password on a personal account is quick but capped on volume. Resend or Microsoft Graph can replace it by changing only `api/email.js`.
7. **Publish does not validate the rep name against any list**, and there is no lock against concurrent writes. Two devices publishing the same rep and date at the same moment could create duplicate rows.
8. **The publish route trusts the row index** from a read it just did, so a sheet edited between the read and the update could be overwritten at the wrong row. Low risk for one user, but worth knowing.

## Things to avoid

- Don't commit `GOOGLE_SERVICE_ACCOUNT_JSON` or the Gmail app password. Keep them in Vercel env vars only.
- Don't put recipients or tokens back into `index.html`.
- Don't change the `COLUMNS` order without also changing the sheet headers. Existing rows would no longer line up.
- `node_modules/` is in `.gitignore`.

## Suggested next steps for Claude Code

1. Apply the patch, run `npm install` and `npm run check`, and commit on a feature branch.
2. Add the shared-secret check (or confirm Vercel protection) to both routes, and make the front end send it from an env-injected value or a session cookie, not a literal in the HTML.
3. Confirm the subject and weekday wording with the user, then adjust `SUBJECT_PATTERN` in `api/email.js` and the subject builder in `index.html` if needed.
4. Ask the user what extra front-end features they want (see gap 5). Don't guess.
5. Open a PR, and have the user set the five env vars in Vercel and run one test publish and one test email before merging.
6. Later: link `DRAPS Log` to the main weekly-report spreadsheet (IMPORTRANGE or a query). This was deliberately left until the app works.

## Context for the user

- The user is in Perth (UTC+8). Dates use DD/MM/YYYY.
- The rep name is required for both buttons.
- The "Output" panel is the WhatsApp text, and "Send to Management" sends that same text.
