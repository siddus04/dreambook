/**
 * Widget retry helper tests (run: node widget_retry_test.js)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const dir = __dirname;
const sandbox = { console, Date, Math, String, Array, Object, Set, RegExp, parseInt, parseFloat, JSON };
sandbox.global = sandbox;
sandbox.window = sandbox;
sandbox.globalThis = sandbox;

function load(file) {
    vm.runInNewContext(fs.readFileSync(path.join(dir, file), 'utf8'), sandbox, { filename: file });
}

load('module_formats.js');

const MF = sandbox.DreamBookModuleFormats;
let passed = 0;
let failed = 0;

function assert(cond, msg) {
    if (cond) { passed++; return; }
    failed++;
    console.error('FAIL:', msg);
}

assert(MF.isWidgetGateCleared({ status: 'completed' }) === true, 'completed implies gate cleared');
assert(MF.isWidgetGateCleared({ status: 'skipped' }) === true, 'skipped implies gate cleared');
assert(MF.isWidgetGateCleared({ status: 'engaged', gateCleared: true }) === true, 'explicit gateCleared');
assert(MF.isWidgetGateCleared({ status: 'engaged' }) === false, 'engaged without gate not cleared');
assert(MF.isWidgetGateCleared(null) === false, 'null record');

assert(MF.isReadingGateBlocking('pending', { status: 'pending' }) === true, 'pending blocks gate');
assert(MF.isReadingGateBlocking('engaged', { status: 'engaged' }) === true, 'engaged blocks gate');
assert(MF.isReadingGateBlocking('engaged', { status: 'engaged', gateCleared: true }) === false, 'retry engaged does not block');
assert(MF.isReadingGateBlocking('pending', { status: 'completed' }) === false, 'completed does not block');

const reset = MF.buildRetryResetRecord({
    type: 'socratic',
    status: 'completed',
    messageCount: 5,
    stepMessages: { 1: 1, 2: 1, 3: 1 },
    socraticStep: 3,
    viewedAt: 123,
    gateCleared: true
});
assert(reset.status === 'pending', 'retry resets status');
assert(reset.messageCount === 0, 'retry clears message count');
assert(reset.gateCleared === true, 'retry preserves gateCleared');
assert(reset.viewedAt === 123, 'retry preserves viewedAt');
assert(reset.stepMessages === undefined, 'retry drops stepMessages');

const resetRecall = MF.buildRetryResetRecord({
    type: 'recall',
    status: 'completed',
    recallResult: { format: 'mcq', selectedIndex: 1, isCorrect: true }
});
assert(resetRecall.recallResult === undefined, 'retry drops recallResult');

console.log(`\nWidget retry tests: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
