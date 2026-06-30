/**
 * Opposing-view (compare_models) tests (run: node opposing_view_test.js)
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
load('module_formats.js');
load('scenario_registry.js');

const MF = sandbox.DreamBookModuleFormats;
const SR = sandbox.DreamBookScenarioRegistry;
let passed = 0;
let failed = 0;

function assert(cond, msg) {
    if (cond) { passed++; return; }
    failed++;
    console.error('FAIL:', msg);
}

function widgetUsesQuestionLadder(type, ladder) {
    if (!ladder?.length) return false;
    if (type === 'debate') return ladder.length >= 3;
    return ladder.length >= 3 && (type === 'socratic' || type === 'explain');
}

const priyaSamContentNoQuestions = `THE CLAIM:
Priya argues that prokaryotic cells are like an open kitchen — less organized because they lack a nucleus and membrane-bound organelles.

COUNTER-VIEW:
Sam pushes back: compartmentalization in eukaryotes enables parallel processes, but prokaryotes still localize work with a nucleoid region and 70S ribosomes for protein synthesis.

AUTHOR NOTE:
Misconception: prokaryotes are just "less organized" without functional structure
Evidence to use: nucleoid, 70S ribosomes, nucleus, 80S ribosomes, organelles`;

const sourceText = 'Prokaryotes lack a membrane-bound nucleus and have 70S ribosomes. Eukaryotes have a nucleus and 80S ribosomes on organelles.';

assert(Array.isArray(MF.DEBATE_LADDER_LABELS) && MF.DEBATE_LADDER_LABELS.length === 3, 'DEBATE_LADDER_LABELS exported with 3 labels');

const good = MF.validateWidgetOutput('opposing-view', 'compare_models', 'content', priyaSamContentNoQuestions, '', { sourceText });
assert(good.ok, 'claim/counter content valid');

const canonicalOpening = MF.buildDebateQuestionLadder()[0];
const goodOpening = MF.validateWidgetOutput(
    'opposing-view', 'compare_models', 'opening', priyaSamContentNoQuestions,
    canonicalOpening,
    { sourceText }
);
assert(goodOpening.ok, 'canonical opening valid');

const debateLadder = MF.buildDebateQuestionLadder();
assert(widgetUsesQuestionLadder('debate', debateLadder) === true, 'debate ladder needs 3 prompts');
assert(widgetUsesQuestionLadder('debate', debateLadder.slice(0, 2)) === false, 'debate rejects 2 prompts');
assert(debateLadder[0].includes('too broad'), 'generic debate opening tests the claim');

const cellLadder = MF.buildDebateQuestionLadder(priyaSamContentNoQuestions);
assert(cellLadder[0].includes('all cells'), 'cell debate opening adapts to the cell claim');
assert(cellLadder[1].includes('genetic instructions'), 'cell debate step 2 asks for mechanism');

console.log(`\nOpposing-view tests: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
