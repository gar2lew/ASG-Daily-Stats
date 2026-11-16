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
