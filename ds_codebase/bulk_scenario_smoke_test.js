/**
 * Bulk scenario + validation smoke tests (run: node bulk_scenario_smoke_test.js)
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
    const code = fs.readFileSync(path.join(dir, file), 'utf8');
    vm.runInNewContext(code, sandbox, { filename: file });
}

load('enhancement_bands.js');
load('enhancements.js');
load('module_formats.js');
load('scenario_registry.js');

const SR = sandbox.DreamBookScenarioRegistry;
const MF = sandbox.DreamBookModuleFormats;
let passed = 0;
let failed = 0;

function assert(cond, msg) {
    if (cond) { passed++; return; }
    failed++;
    console.error('FAIL:', msg);
}

const findings = [
    {
        findingId: 'a1',
        scanId: 'scan_illustrate',
        rationale: 'Use a city analogy for homeostasis.',
        payload: { illustrateStyle: 'analogy', formatId: 'analogy' }
    },
    {
        findingId: 'a2',
        scanId: 'scan_illustrate',
        rationale: 'Endosymbiotic business merger analogy.',
        payload: { illustrateStyle: 'analogy', formatId: 'analogy' }
    }
];

const bulk = SR.assignBulkScenarioDomains(findings);
assert(bulk.assignments.length === 0, 'analogy findings get no scenario assignments');
assert(!findings[0].scenarioAssignment && !findings[1].scenarioAssignment, 'findings have null scenarioAssignment');

const ctx = {
    sourceText: 'Mitochondria produce ATP through cellular respiration in the matrix.',
    illustrateStyle: 'analogy',
    actionId: 'illustrate',
    formatId: 'analogy',
    skipVariety: false,
    usedDomains: ['city services and infrastructure']
};

const variety = MF.buildWidgetVarietyBlock(ctx);
assert(!variety.includes('SCENARIO (required)'), 'analogy variety uses dynamic domains');
assert(variety.includes('Choose an analogy domain'), 'analogy variety has domain instruction');
assert(!variety.includes('Pop-culture guidance'), 'no pop-culture in variety');

const structuredGood = `ANALOGY TITLE:
City Power

THE ANALOGY:
City power stations (mitochondria) generate cellular energy through respiration in the matrix, while delivery routes move resources across the city.

CONCEPT MAPPING:
Mitochondria → Power stations → Produce ATP through respiration
Matrix → Power plant floor → Site of metabolic reactions
ATP → Electricity → Energy currency for the cell
Respiration → Power generation → Releases usable energy

WHERE THE ANALOGY BREAKS DOWN:
- Cities are not inside cells.

ONE-LINE TAKEAWAY:
Mitochondria generate ATP through cellular respiration.`;

const badCheck = MF.validateWidgetOutput('illustrate', 'analogy', 'content', 'Think of a cricket team.', '', ctx);
assert(!badCheck.ok, 'unstructured analogy fails validation');

const goodCheck = MF.validateWidgetOutput('illustrate', 'analogy', 'content', structuredGood, '', ctx);
assert(goodCheck.ok, 'structured city-aligned output with source terms passes');

const socraticCtx = {
    actionId: 'socratic-question',
    formatId: 'explain_own_words',
    skipVariety: true,
    scenarioAssignment: null
};
const socraticPrompt = MF.buildModuleUserPrompt('socratic-question', 'explain_own_words', 'Cells maintain homeostasis.', { widgetCtx: socraticCtx });
assert(!socraticPrompt.includes('SCENARIO (required)'), 'socratic prompt has no scenario block');
assert(!socraticPrompt.includes('cricket'), 'socratic prompt has no cricket');

const socraticBad = MF.validateWidgetOutput('socratic-question', 'explain_own_words', 'content',
    '1. How is homeostasis like a cricket match?\n2. Why?\n3. What if?', '', socraticCtx);
assert(!socraticBad.ok, 'socratic with cricket fails');

const newsBad = MF.validateWidgetOutput('illustrate', 'news', 'content',
    'In April 2026, MIT researchers reported membrane rigidity changes, much like how a city border adapts to control movement.', '', {
        illustrateStyle: 'news'
    });
assert(!newsBad.ok, 'news with much like how metaphor fails');

console.log(`\nBulk scenario smoke tests: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
