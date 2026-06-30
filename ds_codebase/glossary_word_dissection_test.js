'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const editorHtml = fs.readFileSync(path.join(__dirname, 'editor.html'), 'utf8');
const markerStart = 'function normalizeJargonWordParts(wordParts) {';
const markerEnd = 'function normalizeJargonPriority(priority) {';
const start = editorHtml.indexOf(markerStart);
const end = editorHtml.indexOf('function dedupeJargonTerms(terms) {');
if (start < 0 || end < 0) throw new Error('Could not locate word dissection helper block in editor.html');

const sandbox = {
    console,
    String,
    Array,
    Object,
    RegExp,
    Math,
    JSON,
    escapeHtml: (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
};

vm.runInNewContext(editorHtml.slice(start, end), sandbox, { filename: 'word_dissection_helpers.js' });

const {
    normalizeJargonWordParts,
    serializeJargonWordParts,
    parseJargonWordParts,
    buildJargonWordDissectionHtml
} = sandbox;

let passed = 0;
let failed = 0;

function assert(cond, msg) {
    if (cond) {
        passed++;
        return;
    }
    failed++;
    console.error('FAIL:', msg);
}

assert(normalizeJargonWordParts([
    { part: 'peptido-', meaning: 'peptide links' },
    { part: 'glycan', meaning: 'sugar chains' }
]).length === 2, 'normalize keeps valid word parts');

assert(normalizeJargonWordParts([
    { part: '  endo- ', meaning: ' inside ' },
    { part: '', meaning: 'skip' },
    { gloss: 'cell movement', part: 'cytosis' }
]).length === 2, 'normalize trims and accepts gloss alias');

assert(serializeJargonWordParts([]) === '', 'empty parts serialize to empty string');

const serialized = serializeJargonWordParts([
    { part: 'peptido-', meaning: 'peptide links' },
    { part: 'glycan', meaning: 'sugar chains' }
]);
assert(serialized.includes('peptido-'), 'serialized JSON includes part text');
assert(parseJargonWordParts(serialized).length === 2, 'round-trip parse works');

assert(buildJargonWordDissectionHtml([]) === '', 'no card for empty parts');
assert(buildJargonWordDissectionHtml([{ part: 'mono-', meaning: 'one' }]) === '', 'no card for single part');
const html = buildJargonWordDissectionHtml([
    { part: 'peptido-', meaning: 'peptide links' },
    { part: 'glycan', meaning: 'sugar chains' }
]);
assert(html.includes('Word dissection'), 'card includes label');
assert(html.includes('peptido-'), 'card includes part chips');
assert(html.includes('sugar chains'), 'card includes meanings');

if (failed) {
    console.error(`\n${failed} word dissection tests failed, ${passed} passed.`);
    process.exit(1);
}
console.log(`${passed} word dissection tests passed.`);
