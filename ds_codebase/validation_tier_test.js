#!/usr/bin/env node
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
load('enhancements.js');
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

const trainingRoomAssignment = {
    id: 'training_room',
    label: 'Training room',
    keywords: ['training room', 'physio', 'team']
};

const mysteryContent = [
    'TITLE: Mystery in the training room',
    'HOOK: The physio team in the training room notices swollen mitochondria in muscle biopsies after intense workouts.',
    'QUESTIONS:',
    '1. Which specific organelle process in the passage explains why ATP production might change after intense workouts?',
    '2. How would you test whether cellular respiration rates changed in those cells?',
    '3. What would you tell the physio team about organelle response to exercise demand?',
    'AUTHOR NOTE:',
    'Misconception: students think mitochondria only shrink during exercise.',
    'Evidence used: passage on ATP and cellular respiration.',
    'Takeaway: mitochondria adapt to energy demand.'
].join('\n');

const socraticResult = MF.validateWidgetOutput(
    'socratic-question',
    'mystery_clinic',
    'content',
    mysteryContent,
    '',
    { scenarioAssignment: trainingRoomAssignment, sourceText: 'mitochondria ATP cellular respiration muscle biopsies' }
);
assert(socraticResult.ok === true, 'mystery_clinic + training_room passes when scenario-first exempt');

const explainPeerContent = [
    'TITLE: Explain membranes to Sam',
    'SAM SAYS: I think the storage room wall is like a cell membrane — nothing gets through.',
    'TASK: Help Sam see what is partly correct about membranes.',
    'QUESTIONS:',
    '1. What part of Sam\'s idea matches selective permeability?',
    '2. What evidence from the passage shows transport across membranes?',
    '3. Name one example from the passage (e.g. mitochondria or membrane).',
    'AUTHOR NOTE:',
    'Misconception: membranes block everything.',
    'Evidence used: selective permeability and transport.',
    'Required passage example: plasma membrane.',
    'Takeaway: membranes control what enters and leaves.'
].join('\n');

const explainResult = MF.validateWidgetOutput(
    'explain-to-peer',
    'teach_sam',
    'content',
    explainPeerContent,
    '',
    {
        scenarioAssignment: trainingRoomAssignment,
        sourceText: 'plasma membrane selective permeability mitochondria transport'
    }
);
assert(explainResult.ok === true, 'explain_peer with storage room in SAM SAYS still passes');

const caseBody = 'A city hospital lab receives muscle biopsies from athletes in a training room after intense workouts. '
    + 'Physiologists notice mitochondria appear swollen under the microscope and ask students to connect ATP production '
    + 'to cellular respiration. Students must explain how organelles respond to energy demand using evidence on '
    + 'mitochondria, membranes, and homeostasis from the passage about muscle cells and respiration energy pathways.';
const caseWithNote = `${caseBody}\nAUTHOR NOTE: Misconception — students think mitochondria shrink during exercise.`;

const caseResult = MF.validateWidgetOutput(
    'mini-case-study',
    'scenario_roleplay',
    'content',
    caseWithNote,
    '',
    {
        scenarioAssignment: trainingRoomAssignment,
        scenarioDirectiveInjected: true,
        sourceText: 'mitochondria ATP cellular respiration muscle'
    }
);
assert(caseResult.ok === true, 'case study 145 words with AUTHOR NOTE soft-passes word count');

const crossSlot = SR.outputViolatesScenarioAssignment(
    'The team in the lab compares cell membranes.',
    trainingRoomAssignment,
    [{ id: 'clinic_lab' }],
    {}
);
assert(crossSlot.violated && crossSlot.soft, 'generic cross-slot keyword "lab" is soft violation');

const sportsCross = SR.outputViolatesScenarioAssignment(
    'Imagine a cricket match where players debate mitochondria.',
    trainingRoomAssignment,
    [],
    {}
);
assert(sportsCross.violated && !sportsCross.soft, 'FOREIGN_SPORTS remains hard violation');

const mysteryFindings = [{
    findingId: 'f-mc',
    scanId: 'scan_socratic',
    payload: { widgetActionId: 'socratic-question', formatId: 'mystery_clinic' },
    rationale: 'Mystery clinic socratic on mitochondria in muscle biopsies.'
}];
SR.assignBulkScenarioDomains(mysteryFindings);
assert(mysteryFindings[0].scenarioAssignment?.id !== 'training_room', 'training_room excluded from mystery_clinic socratic picks');

const urbanServicesAssignment = {
    id: 'urban_services',
    label: 'city services and infrastructure',
    keywords: ['city', 'urban', 'infrastructure', 'water treatment']
};

const eli5Content = 'Cell junctions are like doors between rooms. Tight junctions seal gaps so nothing leaks between cells, which is important for tissues that need barriers.';
const eli5Result = MF.validateWidgetOutput(
    'explain-to-peer',
    'explain_like_im_five',
    'content',
    eli5Content,
    '',
    { sourceText: 'tight junctions desmosomes gap junctions cellular junctions' }
);
assert(eli5Result.ok === true, 'explain_like_im_five allows comparative "is like" phrasing');

const whatIfUrbanContent = [
    'SCENARIO: A city water treatment plant adjusts pressure when membrane pumps fail at the intake facility.',
    'QUESTIONS:',
    '1. Why is it wrong to say all substances cross the plasma membrane freely?',
    '2. What happens to osmosis when solute concentration outside the membrane shifts?',
    '3. Why does active transport require ATP when the city grid restores ion balance?',
    'AUTHOR NOTE:',
    'Misconception: all substances cross membranes freely.',
    'Evidence used: passive transport, osmosis, active transport, ATP.',
    'Takeaway: membranes regulate what enters and leaves.'
].join('\n');

const whatIfUrbanResult = MF.validateWidgetOutput(
    'socratic-question',
    'what_if',
    'content',
    whatIfUrbanContent,
    '',
    {
        scenarioAssignment: urbanServicesAssignment,
        sourceText: 'passive transport osmosis active transport ATP membrane selective permeability'
    }
);
assert(whatIfUrbanResult.ok === true, 'what_if + urban_services city scenario passes without Imagine');

const whatIfImagineContent = whatIfUrbanContent.replace(
    'SCENARIO: A city water treatment',
    'SCENARIO: Imagine a city water treatment'
);
const whatIfImagineResult = MF.validateWidgetOutput(
    'socratic-question',
    'what_if',
    'content',
    whatIfImagineContent,
    '',
    {
        scenarioAssignment: urbanServicesAssignment,
        sourceText: 'passive transport osmosis active transport ATP membrane selective permeability'
    }
);
assert(whatIfImagineResult.ok === true, 'what_if + urban_services passes when SCENARIO leads with Imagine (sanitized at insert)');

const sanitized = MF.sanitizeSocraticHook('Imagine a city water grid under stress.');
assert(sanitized === 'a city water grid under stress.', 'sanitizeSocraticHook strips leading Imagine');

const teachSamOpeningResult = MF.validateWidgetOutput(
    'explain-to-peer',
    'teach_sam',
    'opening',
    explainPeerContent,
    'Explain to Sam how ribosomes make proteins using the nucleus and cytoplasm.',
    { sourceText: 'plasma membrane selective permeability mitochondria transport' }
);
assert(teachSamOpeningResult.ok === true, 'teach_sam opening paraphrase returns ok with warning');
assert(!!teachSamOpeningResult.warning, 'teach_sam opening paraphrase includes warning');

const sportsWhatIf = MF.validateWidgetOutput(
    'socratic-question',
    'what_if',
    'content',
    'SCENARIO: During a cricket match students debate membrane transport.\n1. What is diffusion?\n2. What is osmosis?\n3. Why ATP?',
    '',
    {
        scenarioAssignment: urbanServicesAssignment,
        sourceText: 'diffusion osmosis ATP membrane transport'
    }
);
assert(sportsWhatIf.ok === false, 'sports in assigned what_if still hard-fails narrow check');

console.log(`validation_tier_test: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
