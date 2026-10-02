const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('apps-script/Code.gs', 'utf8');
let rows, properties, released, busy, failWrite;
const range = (row, col, height, width) => ({
  setNumberFormat() { return this; },
  getValues() { return [rows[row - 1].slice(col - 1, col - 1 + width)]; },
  setValues(values) { if (failWrite) throw Error('write failed'); rows[row - 1] = values[0]; },
  createTextFinder(id) { return {matchEntireCell() { return this; }, findNext() { return rows.slice(1).some(r => r[1] === id) ? {} : null; }}; }
});
const sheet = { getRange: range, getLastRow: () => rows.length };
const context = vm.createContext({
  console: {error() {}},
  PropertiesService: {getScriptProperties: () => ({getProperty: key => properties[key], setProperty: (key, value) => properties[key] = value})},
  LockService: {getScriptLock: () => ({tryLock: () => !busy, releaseLock: () => released++})},
  SpreadsheetApp: {openById: () => ({getSheetByName: () => sheet}), flush() {}},
});
vm.runInContext(source, context);
function reset() { rows = [['Received at', 'Submission ID', 'Name', 'Contact method and handle', 'Message']]; properties = {SPREADSHEET_ID: 'test'}; released = 0; busy = false; failWrite = false; }
function event(overrides = {}) { return {postData: {length: 100}, parameters: {submission_id: ['a'.repeat(32)], name: ['Example'], contact: ['example@example.invalid'], message: ['Hello'], website: [''], ...overrides}}; }
reset();
assert.equal(context.receive(event()).ok, true);
assert.equal(rows.length, 2);
assert.equal(released, 1);
assert.equal(context.receive(event()).ok, true);
assert.equal(rows.length, 2, 'retry must not append');
assert.equal(context.receive(event({submission_id: ['b'.repeat(32)], message: ['=SUM(A1)']})).ok, true);
assert.equal(rows[2][4], "'=SUM(A1)");
for (const overrides of [{name: ['']}, {name: ['x'.repeat(121)]}, {message: ['x'.repeat(5001)]}, {website: ['bot']}, {submission_id: ['bad']}, {name: ['a', 'b']}]) {
  assert.equal(context.receive(event(overrides)).ok, false);
}
reset(); properties.RATE_WINDOW = JSON.stringify({start: Date.now(), count: 60});
assert.equal(context.receive(event()).ok, false);
assert.equal(rows.length, 1);
reset(); busy = true; assert.equal(context.receive(event()).ok, false); assert.equal(released, 0);
reset(); failWrite = true; assert.equal(context.receive(event()).ok, false); assert.equal(rows.length, 1); assert.equal(released, 1);
reset(); properties = {}; assert.equal(context.receive(event()).ok, false);
console.log('Apps Script validation, formula handling, duplicate retry, rate cap, lock, and write failure tests passed.');
