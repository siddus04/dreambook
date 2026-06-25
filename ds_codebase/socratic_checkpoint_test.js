/**
 * Socratic checkpoint overhaul tests (run: node socratic_checkpoint_test.js)
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

const MF = sandbox.DreamBookModuleFormats;
const EN = sandbox.DreamBookEnhancements;
const SR = sandbox.DreamBookScenarioRegistry;
let passed = 0;
let failed = 0;

function assert(cond, msg) {
    if (cond) { passed++; return; }
    failed++;
    console.error('FAIL:', msg);
}

const organelleSource = `The endoplasmic reticulum (ER) synthesizes proteins and lipids. Transport vesicles bud from the ER and deliver cargo to the Golgi apparatus.
The Golgi modifies, sorts, and packages molecules for secretion or use within the cell. Mitochondria generate ATP through cellular respiration.`;

const goodStructured = `TITLE:
Do organelles work alone?

HOOK:
Many students think each organelle works independently because each has a specialized structure.

QUESTIONS:
1. According to the passage, what does the Golgi receive from the endoplasmic reticulum via transport vesicles?
2. What would happen to Golgi processing if the ER stopped producing transport vesicles?
3. What does this show about whether specialized organelles can work in isolation?

AUTHOR NOTE:
Misconception: organelles work independently because they look specialized
Evidence used: ER transport vesicles delivering cargo to the Golgi
Takeaway: specialization requires coordination, not independence`;

const badChloroplastEssay = `TITLE:
How do organelles cooperate?

HOOK:
Students often memorize organelle names without seeing how they connect.

QUESTIONS:
1. How do chloroplasts and mitochondria work together in a plant cell?
2. Why is energy transfer important between them?
3. What does this show about cellular cooperation?

AUTHOR NOTE:
Misconception: organelles are unrelated parts
Evidence used: energy exchange
Takeaway: cells need coordinated organelles`;

const legacyThreeQ = `1. What role does the ER play in protein synthesis?
2. Why do transport vesicles matter for the Golgi?
3. What principle about organelle interdependence can you state in your own words?`;

const scenarioFormat = `SCENARIO: A student claims the Golgi can package proteins without any input from the ER.
1. What does the passage say the Golgi receives from the ER?
2. If vesicle transport stopped, what would the Golgi lack?
3. What does this imply about organelle dependence?

AUTHOR NOTE:
Misconception: Golgi works alone
Evidence used: ER to Golgi vesicle transport
Takeaway: organelles depend on each other's outputs`;

// parseSocraticStructuredContent
const goodParsed = MF.parseSocraticStructuredContent(goodStructured);
assert(goodParsed.title.includes('organelles work alone'), 'parses TITLE');
assert(goodParsed.hook.includes('independently'), 'parses HOOK');
assert(goodParsed.questions.length === 3, 'parses 3 questions');
assert(goodParsed.misconception.includes('independently'), 'parses misconception from author note');
assert(goodParsed.structured, 'marks structured content');

const scenarioParsed = MF.parseSocraticStructuredContent(scenarioFormat);
assert(scenarioParsed.hook.includes('Golgi'), 'SCENARIO maps to hook');
assert(scenarioParsed.questions.length === 3, 'scenario format keeps 3 questions');

// parseSocraticContent delegation
const enGood = EN.parseSocraticContent(goodStructured);
assert(enGood.title.includes('organelles'), 'enhancements parseSocraticContent title');
assert(enGood.scenarioHook.includes('independently'), 'enhancements maps hook to scenarioHook');
assert(enGood.questions.length === 3, 'enhancements 3 questions');

const enLegacy = EN.parseSocraticContent(legacyThreeQ);
assert(enLegacy.questions.length === 3, 'legacy 3Q fallback');
assert(!enLegacy.title, 'legacy has no title');

// validation — good ER-Golgi passes
const goodValid = MF.validateWidgetOutput('socratic-question', 'explain_own_words', 'content', goodStructured, '', {
    actionId: 'socratic-question',
    sourceText: organelleSource
});
assert(goodValid.ok, 'good ER-Golgi checkpoint validates');

// validation — weak chloroplast essay fails passage grounding or Q1 essay
const badValid = MF.validateWidgetOutput('socratic-question', 'explain_own_words', 'content', badChloroplastEssay, '', {
    actionId: 'socratic-question',
    sourceText: organelleSource
});
assert(!badValid.ok, 'chloroplast/mitochondria without ER-Golgi evidence fails');

// hook must not repeat Q1
const hookRepeat = goodStructured.replace(
    '1. According to the passage',
    '1. Many students think each organelle works independently because each has a specialized structure?'
);
const repeatValid = MF.validateWidgetOutput('socratic-question', 'explain_own_words', 'content', hookRepeat, '', {
    actionId: 'socratic-question',
    sourceText: organelleSource
});
assert(!repeatValid.ok, 'hook repeating Q1 fails');

// scenario-first opening must match hook
const openingOk = MF.validateWidgetOutput('socratic-question', 'explain_own_words', 'opening', goodStructured,
    'Many students think each organelle works independently because each has a specialized structure.', {
    actionId: 'socratic-question'
});
assert(openingOk.ok, 'opening equals hook passes');

// formatUsesScenarioFirst for explain_own_words
const fmt = MF.resolveFormat('socratic-question', 'explain_own_words');
assert(MF.formatUsesScenarioFirst(fmt), 'explain_own_words is scenario-first');
assert(!SR.formatForbidsScenarioHooks('socratic-question', 'explain_own_words', null, fmt), 'explain_own_words allows hooks');

// ladder labels exported
assert(MF.SOCRATIC_LADDER_LABELS.join(',') === 'Evidence,Consequence,Takeaway', 'ladder labels');

// what_if — repetitive rigid cytoskeleton ladder fails
const cytoskeletonRepeat = `SCENARIO: In a research lab, a scientist observes cells moving under a microscope, noting how the cytoskeleton changes shape as the cells migrate.
1. What if the cytoskeleton in these cells suddenly became rigid and couldn't change shape?
2. What if this rigidity affected the cell's ability to transport materials internally?
3. What if all cells in the body had a rigid cytoskeleton, impacting overall bodily functions?

AUTHOR NOTE:
Misconception: cytoskeleton is static
Evidence used: cytoskeleton, transport, locomotion
Takeaway: dynamic cytoskeleton enables shape and movement.`;

const cytSource = 'The cytoskeleton provides structural scaffolding, mediates intracellular transport, and drives cellular locomotion.';
const cytBad = MF.validateWidgetOutput('socratic-question', 'what_if', 'content', cytoskeletonRepeat, '', {
    actionId: 'socratic-question',
    sourceText: cytSource
});
assert(!cytBad.ok, 'repetitive what_if cytoskeleton ladder fails validation');

// what_if — good lab-tech ladder still passes
const labWhatIf = `SCENARIO: A lab tech notices bacterial colonies growing on a nutrient agar plate without a defined nucleus visible under the microscope.
1. What does the absence of a membrane-bound nucleus tell you about these cells?
2. Why might the 70S ribosomes matter for protein synthesis here?
3. What would change if these cells suddenly gained a nuclear envelope?`;
const labOk = MF.validateWidgetOutput('socratic-question', 'what_if', 'content', labWhatIf, '', {
    actionId: 'socratic-question',
    sourceText: 'Prokaryotic cells lack a membrane-bound nucleus. They have 70S ribosomes for protein synthesis.'
});
assert(labOk.ok, 'distinct what_if lab-tech ladder passes');

console.log(`\nSocratic checkpoint tests: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
