# ASG Daily Stats

Vercel-hosted DRAPS daily stats app: `index.html` plus two serverless routes.

- `index.html`: the daily tally UI, with **Publish Results** and **Send to Management**.
- `api/publish.js`: writes one row per rep per day to the `DRAPS Log` tab of a Google Sheet. Republishing the same date and rep updates that row.
- `api/email.js`: sends the WhatsApp-format report to the management recipients, subject `DRAPS - Rep Name - Day - DD/MM/YYYY` (Perth time).
- `lib/draps.js`: shared column order and input validation.

## Environment variables (Vercel project settings)

| Name | Value |
| --- | --- |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Full JSON key of a Google service account |
| `SHEET_ID` | ID from the spreadsheet URL (`/d/<SHEET_ID>/edit`) |
| `GMAIL_USER` | Gmail address that sends the email |
| `GMAIL_APP_PASSWORD` | Gmail app password (requires 2-Step Verification) |
| `MANAGEMENT_RECIPIENTS` | Comma-separated list of management email addresses |
| `DRAPS_PASSCODE` | Passcode the page asks for once per device. Both API routes reject requests without it. |

Share the spreadsheet with the service account's email address as Editor.

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
