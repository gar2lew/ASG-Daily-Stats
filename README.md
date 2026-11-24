# ASG Daily Stats

Vercel-hosted DRAPS daily stats app: `index.html` plus two serverless routes.

- `index.html`: the daily tally UI, with **Publish Results** and **Send to Management**.
- `api/publish.js`: writes one row per rep per day to the approval tab **Rep DRAPS - For Approval** in the weekly report sheet (`WEEKLY_SHEET_ID`). It also keeps the `DRAPS Log` tab in the DRAPS sheet (`SHEET_ID`) up to date. Republishing the same date and rep updates that row.
- `lib/approval.js`: maps DRAPS fields to the approval tab columns. Super and RE-FI are not in DRAPS, so they are left blank for Daily Entry.
- `api/email.js`: sends the WhatsApp-format report to the management recipients, subject `DRAPS - Rep Name - Day - DD/MM/YYYY` (Perth time).
- `lib/draps.js`: shared column order and input validation.

## Environment variables (Vercel project settings)

| Name | Value |
| --- | --- |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Full JSON key of a Google service account |
| `SHEET_ID` | ID of the DRAPS spreadsheet (holds `DRAPS Log` and `Reps`) |
| `WEEKLY_SHEET_ID` | ID of the weekly report spreadsheet (holds `Rep DRAPS - For Approval`) |
| `GMAIL_USER` | Gmail address that sends the email |
| `GMAIL_APP_PASSWORD` | Gmail app password (requires 2-Step Verification) |
| `MANAGEMENT_RECIPIENTS` | Comma-separated list of management email addresses |
| `ADMIN_PIN` | 4-digit PIN for the Admin button on the page. Only the owner should know it. Wrong PINs lock that device out for 15 minutes after 5 tries. |
| `DRAPS_PASSCODE` | Passcode the page asks for once per device. Both API routes reject requests without it. |

Share both spreadsheets with the service account's email address as Editor.

## Local check

    npm install
    npm run check

## Rep list

Reps are kept on a `Reps` tab in the same spreadsheet as `DRAPS Log`, with columns `Name`, `State`, `Timezone`, `Active`, `Added`.

- A rep picks their name from the dropdown. If they are not listed, they choose **Add my name** and pick their state. The name is added straight away.
- `State` sets the rep's timezone (for example QLD → `Australia/Brisbane`, WA → `Australia/Perth`). Each day's date and weekday come from that timezone.
- Ross can edit this tab directly. Set `Active` to `FALSE` to hide a rep from the dropdown; their old rows are kept.
- `GET /api/reps` and `POST /api/reps` both need the `x-draps-passcode` header.

## Tests

    npm test

## Gate screen

The page opens on a gate screen titled **Daily DRAPS Input**. The rep chooses their name (or adds it), then presses **Start** to open the tally. **Change rep** returns to the gate without clearing any figures. The date on the tally follows the chosen rep's timezone.

To check the gate locally without the Google env vars, run `node test/e2e-server.mjs` and open `http://localhost:4173`. This server stubs `/api/reps`, `/api/publish` and `/api/email`. It is for testing only and is not deployed.

## Rep admin

The **Admin** button in the page header asks for `ADMIN_PIN` each time it is opened. From the panel you can rename a rep, change their state, add a rep, or remove a rep. Removing a rep only hides them from the gate; their row and past figures stay on the sheet, and **Restore** shows them again.

Renaming a rep does not change names already written to the DRAPS Log or the weekly sheets, so past figures under the old name stay as they were.

The lockout is kept in memory on each server instance, so it slows guessing but does not stop it completely.

## Staff portal

`portal.html` is a static hub page with the same look as the daily gate. It lists internal apps so staff do not have to hunt for links. To add or change an app, edit the `APPS` array near the bottom of `portal.html` (each entry needs `name`, `description` and an `https://` or `/` `url`). The page has no API calls and no passcode; each linked app keeps its own sign-in. `test/portal.test.js` checks the list.
