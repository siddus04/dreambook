/**
 * Scenario registry tests (run: node scenario_registry_test.js)
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

function mockFinding(overrides) {
    return {
        findingId: overrides.findingId || ('f-' + Math.random().toString(36).slice(2, 8)),
        rationale: overrides.rationale || '',
        title: overrides.title || '',
        scanId: overrides.scanId || 'scan_socratic',
        payload: overrides.payload || { widgetActionId: 'socratic-question', formatId: 'explain_own_words' },
        suggestedScenarioId: overrides.suggestedScenarioId || ''
    };
}

// Cell Biology-like bulk mix (14 widgets)
const bulkFindings = [
    mockFinding({ findingId: 'f1', scanId: 'scan_counter', payload: { widgetActionId: 'opposing-view', formatId: 'steel_man' }, rationale: 'Debate on prokaryotic versus eukaryotic cells.' }),
    mockFinding({ findingId: 'f2', scanId: 'scan_simulation', payload: { simulationType: 'phet' } }),
    mockFinding({ findingId: 'f3', scanId: 'scan_illustrate', payload: { illustrateStyle: 'news', formatId: 'news' }, rationale: 'Real news about ribosomes.' }),
    mockFinding({ findingId: 'f4', scanId: 'scan_socratic', payload: { widgetActionId: 'socratic-question', formatId: 'explain_own_words' }, rationale: 'Socratic on organelles.' }),
    mockFinding({ findingId: 'f5', scanId: 'scan_illustrate', payload: { illustrateStyle: 'analogy', formatId: 'analogy' }, rationale: 'Use a city analogy to explain cell processes.' }),
    mockFinding({ findingId: 'f6', scanId: 'scan_case_study', payload: { widgetActionId: 'mini-case-study', formatId: 'scenario_roleplay' }, rationale: 'Case study on ECM and junctions.' }),
    mockFinding({ findingId: 'f7', scanId: 'scan_illustrate', payload: { illustrateStyle: 'analogy', formatId: 'analogy' }, rationale: 'Compare endosymbiotic theory to a business partnership merging.' }),
    mockFinding({ findingId: 'f8', scanId: 'scan_socratic', payload: { widgetActionId: 'socratic-question', formatId: 'explain_own_words' }, rationale: 'Transport mechanisms dialogue.' }),
    mockFinding({ findingId: 'f9', scanId: 'scan_illustrate', payload: { illustrateStyle: 'analogy', formatId: 'analogy' }, rationale: 'Power plant and solar farm energy cycle.' }),
    mockFinding({ findingId: 'f10', scanId: 'scan_explain_peer', payload: { widgetActionId: 'explain-to-peer', formatId: 'teach_sam' }, rationale: 'Explain protein synthesis to Sam.' }),
    mockFinding({ findingId: 'f11', scanId: 'scan_case_study', payload: { widgetActionId: 'mini-case-study', formatId: 'scenario_roleplay' }, rationale: 'Kitchen prep line detoxification case study.' }),
    mockFinding({ findingId: 'f12', scanId: 'scan_socratic', payload: { widgetActionId: 'socratic-question', formatId: 'explain_own_words' }, rationale: 'Apoptosis discussion.' }),
    mockFinding({ findingId: 'f13', scanId: 'scan_illustrate', payload: { illustrateStyle: 'analogy', formatId: 'analogy' }, rationale: 'House analogy for plant and animal cells.' }),
    mockFinding({ findingId: 'f14', scanId: 'scan_illustrate', payload: { illustrateStyle: 'analogy', formatId: 'analogy' }, rationale: 'Factory analogy for nucleus and ribosomes.' })
];

const bulkResult = SR.assignBulkScenarioDomains(bulkFindings);
const assignedIds = bulkResult.assignments.map(a => a.assignment?.id).filter(Boolean);
const uniqueIds = new Set(assignedIds);
assert(assignedIds.length >= 2, 'bulk assigns scenarios to domain-needing widgets');
assert(uniqueIds.size === assignedIds.length, 'bulk assignment IDs are unique');

const counterFinding = bulkFindings.find(f => f.findingId === 'f1');
assert(!counterFinding.scenarioAssignment, 'opposing-view counter gets no scenario assignment');

const cityFinding = bulkFindings.find(f => f.findingId === 'f5');
assert(!cityFinding.scenarioAssignment, 'analogy illustrate gets no scenario assignment');

const businessFinding = bulkFindings.find(f => f.findingId === 'f7');
assert(!businessFinding.scenarioAssignment, 'analogy business rationale gets no scenario assignment');

const caseFinding = bulkFindings.find(f => f.findingId === 'f6');
assert(caseFinding.scenarioAssignment?.id, 'case study still gets scenario assignment');

const socraticFinding = bulkFindings.find(f => f.findingId === 'f4');
assert(!socraticFinding.scenarioAssignment, 'socratic explain_own_words gets no scenario assignment');

const newsFinding = bulkFindings.find(f => f.findingId === 'f3');
assert(!newsFinding.scenarioAssignment, 'news illustrate gets no scenario assignment');

// Parallel simulation — assign independently should still be unique when sequential
const parallelFindings = Array.from({ length: 10 }, (_, i) => mockFinding({
    findingId: 'p' + i,
    scanId: 'scan_illustrate',
    payload: { illustrateStyle: 'analogy', formatId: 'analogy' },
    rationale: 'Analogy for concept ' + i
}));
const parallelResult = SR.assignBulkScenarioDomains(parallelFindings);
const pIds = parallelResult.assignments.map(a => a.assignment?.id).filter(Boolean);
assert(pIds.length === 0, 'analogy bulk assigns no scenario domains');

// Directive shape
const directive = SR.buildScenarioDirective({
    id: 'urban_services',
    label: 'city services and infrastructure',
    examples: 'water treatment',
    forbiddenLabels: ['cricket match strategy']
}, ['factory production floor']);
assert(directive.includes('SCENARIO (required):'), 'directive has SCENARIO');
assert(directive.includes('FORBIDDEN THIS CHAPTER:'), 'directive has FORBIDDEN');
assert(!directive.includes('Pop-culture'), 'directive has no pop-culture wording');

// Output violation
const urbanAssignment = SR.getCatalogById('urban_services');
const assignmentObj = { id: 'urban_services', label: urbanAssignment.label, keywords: urbanAssignment.keywords };
const cricketViolation = SR.outputViolatesScenarioAssignment(
    'Imagine a cricket team where players represent organelles.',
    assignmentObj,
    [{ id: 'cricket_match', label: 'cricket match strategy', keywords: ['cricket'] }]
);
assert(cricketViolation.violated, 'cricket text violates urban assignment');

// Socratic no-hook
assert(SR.socraticExplainOwnWordsViolates('Imagine a cricket match.'), 'socratic hook detect');
assert(!SR.socraticExplainOwnWordsViolates('What role does ATP play in cellular work?'), 'plain socratic ok');

// Teaching prose filter
assert(!SR.isTeachingProseParagraph('## 2.10 The Extracellular Matrix and Cellular Junctions'), 'heading rejected');
assert(!SR.isTeachingProseParagraph('[Figure 2.2: A cross-sectional diagram illustrating the fluid mosaic model]'), 'figure caption rejected');
assert(!SR.isTeachingProseParagraph('Microtubules: Hollow cylindrical structures composed of tubulin dimers'), 'glossary label rejected');
assert(SR.isTeachingProseParagraph('Animal cells secrete a complex meshwork of glycoproteins such as collagen and fibronectin into the intercellular space.'), 'prose accepted');

const bandText = '## 2.10 The Extracellular Matrix and Cellular Junctions\n\nAnimal cells secrete a complex meshwork of glycoproteins such as collagen and fibronectin into the intercellular space, forming the ECM.';
const excerpt = SR.extractTeachingExcerpt(bandText);
assert(excerpt.includes('glycoproteins'), 'extractTeachingExcerpt skips heading for prose');
assert(!excerpt.startsWith('##'), 'extractTeachingExcerpt not heading-only');

// resolvePreferredScenarioId — goal over sports
const goalFinding = {
    rationale: 'Use a cricket analogy for endosymbiosis.',
    displayPassage: 'target Goal: Use a business partnership or merger analogy for endosymbiotic theory.\n\nMitochondria possess circular DNA.'
};
assert(SR.resolvePreferredScenarioId(goalFinding) === 'business_merger', 'goal text beats cricket rationale');

// buildAuthorIntentLine — no anti-sports suffix for training room
const trainingSlot = SR.getCatalogById('training_room');
const trainingIntent = SR.buildAuthorIntentLine('', trainingSlot, '');
assert(trainingIntent.includes('sports training room'), 'training room intent uses label');
assert(!trainingIntent.includes('Do not substitute sports'), 'training room intent omits anti-sports suffix');

// buildAssignmentFromSlot export
assert(typeof SR.buildAssignmentFromSlot === 'function', 'buildAssignmentFromSlot exported');

// formatNeedsScenarioDomain
assert(!SR.formatNeedsScenarioDomain('illustrate', 'analogy', 'analogy', null), 'illustrate analogy skips scenario');
assert(!SR.formatNeedsScenarioDomain('illustrate', 'news', 'news', null), 'news skips scenario');
assert(!SR.formatNeedsScenarioDomain('socratic-question', 'explain_own_words', null, MF.resolveFormat('socratic-question', 'explain_own_words')), 'explain_own_words skips');
assert(!SR.formatNeedsScenarioDomain('opposing-view', 'compare_models', null, MF.resolveFormat('opposing-view', 'compare_models')), 'opposing-view skips scenario');
assert(SR.formatNeedsScenarioDomain('mini-case-study', 'scenario_roleplay', null, MF.resolveFormat('mini-case-study', 'scenario_roleplay')), 'case study needs scenario');

// Seeded existingUsedIds avoids collision with confirmed chapter widgets
const seededFindings = [
    mockFinding({
        findingId: 'seed1',
        scanId: 'scan_case_study',
        payload: { widgetActionId: 'mini-case-study', formatId: 'scenario_roleplay' },
        rationale: 'Case study on lysosome dysfunction in a clinical lab setting.'
    }),
    mockFinding({
        findingId: 'seed2',
        scanId: 'scan_case_study',
        payload: { widgetActionId: 'mini-case-study', formatId: 'scenario_roleplay' },
        rationale: 'Case study on signal transduction in a research clinic.'
    })
];
const seededResult = SR.assignBulkScenarioDomains(seededFindings, { existingUsedIds: ['architecture_homes'] });
const seedIds = seededResult.assignments.map(a => a.assignment?.id).filter(Boolean);
assert(seedIds.length === 2, 'seeded bulk assigns both case studies');
assert(!seedIds.includes('architecture_homes'), 'seeded bulk avoids architecture_homes already used in chapter');
assert(new Set(seedIds).size === seedIds.length, 'seeded assignments remain unique');

const mysteryOnly = [
    mockFinding({
        findingId: 'mc1',
        scanId: 'scan_socratic',
        payload: { widgetActionId: 'socratic-question', formatId: 'mystery_clinic' },
        rationale: 'Mystery clinic on organelle dysfunction in muscle samples.'
    })
];
SR.assignBulkScenarioDomains(mysteryOnly);
assert(mysteryOnly[0].scenarioAssignment?.id !== 'training_room', 'mystery_clinic socratic avoids training_room scenario');

console.log(`\nScenario registry tests: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
