/**
 * Currency check review tool tests (run: node currency_check_test.js)
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

load('currency_check.js');

const CC = sandbox.DreamBookCurrencyCheck;
let passed = 0;
let failed = 0;

function assert(cond, msg) {
    if (cond) { passed++; return; }
    failed++;
    console.error('FAIL:', msg);
}

const sampleJson = `{
  "findings": [
    {
      "sectionHeading": "2.3 Eukaryotic cells",
      "anchorQuote": "All cells contain a nucleus that controls activities.",
      "title": "Outdated generalization",
      "stalenessReason": "Prokaryotes lack a membrane-bound nucleus; textbooks now emphasize nucleoid regions.",
      "lastKnownGoodYear": 2016,
      "severity": "outdated",
      "references": [
        { "title": "Prokaryotic cell organization", "authors": "Dillon R.", "year": 2023, "url": "https://example.org/p/paper" }
      ]
    }
  ]
}`;

const parsed = CC.parseCurrencyCheckResponse(sampleJson);
assert(parsed.length === 1, 'parse one finding');
assert(parsed[0].capability === 'currency_flag', 'capability currency_flag');
assert(parsed[0].severity === 'outdated', 'severity outdated');
assert(parsed[0].references.length === 1, 'one reference');
assert(parsed[0].references[0].citationLine.includes('Dillon'), 'reference citation line');

const valid = CC.validateCurrencyFinding(parsed[0]);
assert(valid.ok, 'valid finding passes');

const bad = CC.validateCurrencyFinding({ capability: 'currency_flag', severity: 'optional' });
assert(!bad.ok, 'missing anchor fails');

assert(CC.getSeverityLabel('update_soon') === 'Update soon', 'severity label');
assert(CC.CURRENCY_SEVERITY_LABELS.outdated === 'Outdated', 'labels exported');

const mock = CC.buildMockCurrencyFindings(['Section A', 'Section B', 'Section C'], {
    getSectionAnchorQuote: (h) => `Quote for ${h}`,
    getSectionDisplayPassage: (h) => `Passage for ${h}`
});
assert(mock.length === 3, 'mock returns 3 findings');
assert(mock.every(f => f.references?.length >= 1), 'mock findings have references');

assert(CC.normalizeSeverity('OUTDATED') === 'outdated', 'normalize severity');

console.log(`\nCurrency check tests: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
