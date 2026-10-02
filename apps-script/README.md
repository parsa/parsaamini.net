# Contact backend

`Code.gs` receives contact messages and appends them to a private Google Sheet.
The website's `contact_endpoint` setting contains the web app URL.

## Setup

1. Create a standalone project at <https://script.google.com/home> and copy
   `Code.gs` into it.
2. Enable the manifest in Project Settings and copy `appsscript.json`.
3. Run `setup()` and authorize Sheets access. The execution log provides the
   spreadsheet URL. Its ID is stored in Script Properties; subsequent setup runs
   keep the existing spreadsheet.
4. Deploy as a web app with **Execute as: Me** and **Who has access: Anyone**.
   Keep the spreadsheet private. Visitors can submit messages without signing in;
   the handler runs with the owner's Sheets permission.
5. Set the deployment's `/exec` URL as `contact_endpoint` in `_config.yml`.
6. Send a test message from the Contact page and check that it appears in the Sheet.

To update the backend, copy the revised code into the project and update the
existing deployment to a new version, keeping its URL.

## Submissions

Rows contain receipt time, submission ID, name, optional contact handle, and
message. The server validates fields and stores formula-like input as text.
A lock serializes writes, and submission IDs prevent duplicate rows on retries.
The form reports success only after receiving an acknowledgement with the
matching ID. Network errors retain the message for retry in the same page session.

A honeypot and a global limit of 60 new messages per hour reduce basic spam.
Apps Script execution quotas also apply. Monitor submissions and executions;
the global limit can be exhausted by unwanted traffic.

## Tests

From the repository root, run `node scripts/test-contact.cjs` to check validation,
retry handling, formula escaping, rate limits, and write failures.
