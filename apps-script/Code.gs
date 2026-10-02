/** Contact form -> private Google Sheet. No credentials belong in the Jekyll site. */
const HEADERS = ['Received at', 'Submission ID', 'Name', 'Contact method and handle', 'Message'];
const MAX_PER_HOUR = 60;

// Run once from the Apps Script editor as the account that will own the sheet.
function setup() {
  const properties = PropertiesService.getScriptProperties();
  if (properties.getProperty('SPREADSHEET_ID')) {
    console.log('Already configured. Spreadsheet ID: ' + properties.getProperty('SPREADSHEET_ID'));
    return;
  }
  const spreadsheet = SpreadsheetApp.create('parsaamini.net — Contact messages');
  const sheet = spreadsheet.getSheets()[0];
  sheet.setName('Messages');
  sheet.appendRow(HEADERS);
  sheet.setFrozenRows(1);
  sheet.getRange('C:E').setNumberFormat('@');
  properties.setProperty('SPREADSHEET_ID', spreadsheet.getId());
  console.log('Contact sheet: ' + spreadsheet.getUrl());
}

function doPost(event) {
  return ContentService.createTextOutput(JSON.stringify(receive(event)))
    .setMimeType(ContentService.MimeType.JSON);
}

function receive(event) {
  let locked = false;
  const lock = LockService.getScriptLock();
  try {
    if (!event || !event.postData || event.postData.length > 20000) {
      return {ok: false, error: 'Invalid submission.'};
    }
    const params = event.parameters || {};
    const value = key => Array.isArray(params[key]) && params[key].length === 1 ? params[key][0] : '';
    const id = value('submission_id');
    const name = value('name').trim();
    const contact = value('contact').trim();
    const message = value('message').trim();
    if (!/^[a-f0-9]{32}$/.test(id) || !name || name.length > 120 || contact.length > 200 || !message || message.length > 5000 || value('website')) {
      return {ok: false, error: 'Please check your name and message and try again.'};
    }
    if (!lock.tryLock(10000)) return {ok: false, error: 'The form is busy. Please try again shortly.'};
    locked = true;
    const properties = PropertiesService.getScriptProperties();
    const spreadsheetId = properties.getProperty('SPREADSHEET_ID');
    if (!spreadsheetId) return {ok: false, error: 'The contact form is temporarily unavailable.'};
    const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName('Messages');
    if (!sheet || sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0].join('\n') !== HEADERS.join('\n')) {
      return {ok: false, error: 'The contact form is temporarily unavailable.'};
    }
    // Persistent IDs allow safe retries even after a cache expiry or lost response.
    if (sheet.getLastRow() > 1 && sheet.getRange(2, 2, sheet.getLastRow() - 1, 1)
        .createTextFinder(id).matchEntireCell(true).findNext()) {
      return {ok: true, id: id};
    }
    const now = Date.now();
    const stored = properties.getProperty('RATE_WINDOW');
    let rate = stored ? JSON.parse(stored) : {start: now, count: 0};
    if (now - rate.start >= 3600000) rate = {start: now, count: 0};
    if (rate.count >= MAX_PER_HOUR) return {ok: false, error: 'The form has received too many messages. Please try again later.'};
    // Prefix formula-like values even in text-formatted cells; retain the message as text.
    const text = value => /^[=+\-@]/.test(value) ? "'" + value : value;
    const row = sheet.getLastRow() + 1;
    sheet.getRange(row, 3, 1, 3).setNumberFormat('@');
    sheet.getRange(row, 1, 1, HEADERS.length).setValues([[new Date(now), id, text(name), text(contact), text(message)]]);
    SpreadsheetApp.flush();
    rate.count += 1;
    properties.setProperty('RATE_WINDOW', JSON.stringify(rate));
    return {ok: true, id: id};
  } catch (error) {
    // Do not log names, contact handles, or messages.
    console.error('Contact submission failed.');
    return {ok: false, error: 'We could not confirm delivery. Please try again.'};
  } finally {
    if (locked) lock.releaseLock();
  }
}
