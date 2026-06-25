/**
 * Smoke tests for widget prompt refactor (run: node widget_prompt_smoke_test.js)
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

// validateWidgetOutput — socratic scenario-first
const socraticContent = `SCENARIO: A lab tech notices bacterial colonies growing on a nutrient agar plate without a defined nucleus visible under the microscope.
1. What does the absence of a membrane-bound nucleus tell you about these cells?
2. Why might the 70S ribosomes matter for protein synthesis here?
3. What would change if these cells suddenly gained a nuclear envelope?`;

const socraticParsed = EN.parseSocraticContent(socraticContent);
assert(socraticParsed.questions.length === 3, 'parse socratic 3 questions');
assert(socraticParsed.scenarioHook.includes('lab tech'), 'parse socratic scenario');

const socraticOk = MF.validateWidgetOutput('socratic-question', 'what_if', 'content', socraticContent, '', {
    actionId: 'socratic-question',
    sourceText: 'Prokaryotic cells lack a membrane-bound nucleus. They have 70S ribosomes for protein synthesis.'
});
assert(socraticOk.ok, 'socratic scenario-first content valid');

const socraticBad = MF.validateWidgetOutput('socratic-question', 'what_if', 'content', '1. What is a cell?\n2. Why?\n3. How?', '', {});
assert(!socraticBad.ok, 'socratic missing scenario fails');

// explain_own_words structured format
const explainOwnWords = `TITLE:
Do cells need a nucleus?

HOOK:
A student thinks any cell without a visible nucleus must be dead or broken.

QUESTIONS:
1. What does the passage say about prokaryotic cells and their nucleus?
2. How do 70S ribosomes still allow these cells to make proteins?
3. What does this show about defining life by nuclear presence alone?

AUTHOR NOTE:
Misconception: cells without a nucleus are non-functional
Evidence used: prokaryotic cells and 70S ribosomes
Takeaway: function matters more than visible nuclear structure`;

const eowParsed = EN.parseSocraticContent(explainOwnWords);
assert(eowParsed.title.includes('nucleus'), 'explain_own_words parses title');
assert(eowParsed.scenarioHook.includes('student'), 'explain_own_words hook');
const eowOk = MF.validateWidgetOutput('socratic-question', 'explain_own_words', 'content', explainOwnWords, '', {
    actionId: 'socratic-question',
    sourceText: 'Prokaryotic cells lack a membrane-bound nucleus. They have 70S ribosomes for protein synthesis.'
});
assert(eowOk.ok, 'explain_own_words structured content valid');
assert(MF.formatUsesScenarioFirst(MF.resolveFormat('socratic-question', 'explain_own_words')), 'explain_own_words scenario-first');

// illustrate news — structured Real-World Application
const newsStructured = `TITLE:
Water safety in Malawi

STUDENT VIEW:
Health officials reported a cholera outbreak linked to unsafe drinking water in Malawi. Contaminated water can spread disease when communities lack clean supply systems — the same kind of public-health risk students study when learning how organisms interact with their environment.

THINK ABOUT IT:
What would change for a community if its water source became unsafe?

AUTHOR NOTE:
Concept illustrated: Disease spread through environmental conditions
Passage terms used: organisms, environment
Not covered:
Why this example was chosen: Connects textbook ecology to current health news
Verification status: unverified — confirm before publish`;

const newsOk = MF.validateWidgetOutput('illustrate', 'news', 'content', newsStructured, '', {
    illustrateStyle: 'news',
    sourceText: 'Organisms depend on their environment for water and nutrients.'
});
assert(newsOk.ok, 'structured news valid');

const newsLegacy = MF.validateWidgetOutput('illustrate', 'news', 'content', 'WHO reported a cholera outbreak linked to water safety in Malawi.', '', {
    illustrateStyle: 'news',
    sourceText: 'Organisms depend on their environment for water.'
});
assert(newsLegacy.ok, 'legacy plain news valid without required year');

const newsParsed = MF.parseNewsApplicationContent(newsStructured);
assert(newsParsed.structured && newsParsed.title.includes('Malawi'), 'parseNewsApplicationContent structured');

const newsBad = MF.validateWidgetOutput('illustrate', 'news', 'content', 'Imagine a futuristic city where cells are like buildings.', '', { illustrateStyle: 'news' });
assert(!newsBad.ok, 'news imagine fails');

// buildWidgetContextBlock
const ctxBlock = MF.buildWidgetContextBlock({
    bookTitle: 'Biology',
    chapterTitle: 'Cell Structure',
    gradeLevel: 'Class 9-10',
    objectiveLabel: 'Conceptual clarity',
    why: 'Students confuse prokaryotic and eukaryotic features.',
    scenarioAssignment: { authorIntent: 'AUTHOR INTENT: Use kitchen prep sparingly.' },
    authorNote: 'Use kitchen analogy sparingly'
});
assert(ctxBlock.includes('BOOK: Biology'), 'context has book');
assert(ctxBlock.includes('AUTHOR INTENT:'), 'context has author intent');
assert(ctxBlock.includes('WHY (gap):'), 'context has why');

const diagCtxBlock = MF.buildWidgetContextBlock({
    bookTitle: 'Biology',
    gradeLevel: 'Class 9-10',
    bandDiagnosis: {
        core_concept: 'Distinguish prokaryotic and eukaryotic architecture.',
        misconceptions: ['Students think all cells have a nucleus'],
        enhancement_opportunity: 'Compare and contrast both cell types.'
    },
    bandPromptProfile: 'compare_contrast'
});
assert(diagCtxBlock.includes('CORE CONCEPT:'), 'context has core concept from diagnosis');
assert(diagCtxBlock.includes('LIKELY MISCONCEPTIONS:'), 'context has misconceptions');
assert(diagCtxBlock.includes('BAND TYPE: compare_contrast'), 'context has band type');

const compareVariety = MF.buildWidgetVarietyBlock({
    illustrateStyle: 'analogy',
    formatId: 'analogy',
    bandPromptProfile: 'compare_contrast',
    usedDomains: [],
    usedHooks: []
});
assert(compareVariety.includes('COMPARE/CONTRAST BAND'), 'compare contrast variety rule in prompt');

const urbanSlot = SR.getCatalogById('urban_services');
const scenarioAssignment = {
    id: urbanSlot.id,
    label: urbanSlot.label,
    examples: urbanSlot.examples,
    keywords: urbanSlot.keywords,
    forbiddenLabels: [],
    authorIntent: 'AUTHOR INTENT: Use city services analogy.'
};

// buildIllustrateUserPrompt
const userPrompt = MF.buildIllustrateUserPrompt('analogy', 'Prokaryotes lack a nucleus.', {
    bookTitle: 'Bio',
    gradeLevel: 'Class 9-10',
    objectiveLabel: 'Retention',
    scenarioAssignment,
    illustrateStyle: 'analogy',
    actionId: 'illustrate',
    formatId: 'analogy',
    skipVariety: false,
    authorNote: ''
});
assert(userPrompt.includes('TASK:'), 'illustrate user prompt has TASK');
assert(userPrompt.includes('SOURCE PASSAGE:'), 'illustrate user prompt has source');
assert(userPrompt.includes('THE ANALOGY:'), 'illustrate has structured analogy markers');
assert(!userPrompt.includes('SCENARIO (required)'), 'illustrate analogy has no scenario directive');
assert(!userPrompt.includes('Open with an engaging hook'), 'illustrate user prompt omits engagement hook');
assert(!userPrompt.includes('Pop-culture guidance'), 'illustrate has no pop-culture block');

// buildModuleUserPrompt with widgetCtx
const pedagogyPrompt = MF.buildModuleUserPrompt('explain-to-peer', 'teach_sam', 'DNA replication occurs before cell division.', {
    widgetCtx: {
        bookTitle: 'Bio',
        gradeLevel: 'Class 9-10',
        objectiveLabel: 'Conceptual clarity',
        authorNote: '',
        skipVariety: false,
        popCultureEnabled: true,
        reservedDomain: 'music',
        usedPopCulture: ['cricket'],
        usedHooks: [],
        usedDomains: []
    }
});
assert(pedagogyPrompt.includes('EXERCISE:'), 'pedagogy has exercise line');
assert(pedagogyPrompt.includes('Sam'), 'pedagogy task preserved');
assert(!pedagogyPrompt.includes('Open with an engaging hook'), 'pedagogy content prompt omits engagement hook');
assert(!pedagogyPrompt.includes('SCENARIO (required)'), 'explain-to-peer has no scenario block');
assert(!MF.resolveFormat('explain-to-peer', 'teach_sam').contentPrompt.includes("why it's wrong"), 'teach_sam prompt does not give away correction');

const teachSamStructured = `TITLE:
Sam's DNA question

SAM SAYS:
DNA only matters when a cell is about to divide — Sam thinks replication the rest of the time does not matter.

TASK:
Explain to Sam why that idea is incomplete using plain language and one example from the passage.

QUESTIONS:
1. What is partly correct about Sam's idea about division and DNA?
2. What important jobs does Sam leave out?
3. How would you explain DNA replication using one example from the passage?

AUTHOR NOTE:
Misconception: DNA only matters during division
Evidence used: DNA, replication, division
Required passage example: DNA replication before cell division
Takeaway: DNA instructions are used beyond the moment of division.`;

const teachSamParsed = MF.parseExplainPeerContent(teachSamStructured);
assert(teachSamParsed.structured && teachSamParsed.samSays.includes('divide'), 'parseExplainPeerContent structured');
const teachSamOk = MF.validateWidgetOutput('explain-to-peer', 'teach_sam', 'content', teachSamStructured, '', {
    sourceText: 'DNA replication occurs before cell division.'
});
assert(teachSamOk.ok, 'structured teach_sam validates');

const teachSamGood = `TITLE:
Cytoskeleton flexibility

SAM SAYS:
After the microscopy lab, Sam says the cytoskeleton is rigid and never remodels itself.

TASK:
Explain to Sam in plain language how the cytoskeleton actually works.

QUESTIONS:
1. What is partly correct about Sam's idea?
2. What important jobs does Sam leave out?
3. Give one concrete example from the passage.

AUTHOR NOTE:
Misconception: cytoskeleton is static
Evidence used: cytoskeleton, microtubules, remodeling
Required passage example: dynamic rearrangement during cell division
Takeaway: the cytoskeleton is dynamic, not rigid`;

const teachSamGoodOk = MF.validateWidgetOutput('explain-to-peer', 'teach_sam', 'content', teachSamGood, '', {
    sourceText: 'The cytoskeleton includes microtubules that remodel during cell division.'
});
assert(teachSamGoodOk.ok, 'teach_sam literal belief without simile passes');

const teachSamBad = teachSamGood.replace(
    'After the microscopy lab, Sam says the cytoskeleton is rigid and never remodels itself.',
    'Some students think the cytoskeleton is like a rigid skeleton that never changes.'
);
const teachSamBadOk = MF.validateWidgetOutput('explain-to-peer', 'teach_sam', 'content', teachSamBad, '', {
    sourceText: 'The cytoskeleton includes microtubules that remodel during cell division.'
});
assert(!teachSamBadOk.ok, 'teach_sam simile hook fails');
assert(
    /simile|Some students think/i.test(teachSamBadOk.retryNote || ''),
    `teach_sam simile retry note: ${teachSamBadOk.retryNote}`
);

const eowSimileBad = explainOwnWords.replace(
    'A student thinks any cell without a visible nucleus must be dead or broken.',
    'Some students think prokaryotic cells are like broken eukaryotic cells without a nucleus.'
);
const eowSimileBadOk = MF.validateWidgetOutput('socratic-question', 'explain_own_words', 'content', eowSimileBad, '', {
    actionId: 'socratic-question',
    sourceText: 'Prokaryotic cells lack a membrane-bound nucleus. They have 70S ribosomes for protein synthesis.'
});
assert(!eowSimileBadOk.ok, 'explain_own_words simile hook fails');

// socratic explain_own_words — no scenario/cricket
const socraticPrompt = MF.buildModuleUserPrompt('socratic-question', 'explain_own_words', 'ATP powers cellular work.', {
    widgetCtx: {
        bookTitle: 'Bio',
        gradeLevel: 'Class 9-10',
        objectiveLabel: 'Conceptual clarity',
        actionId: 'socratic-question',
        formatId: 'explain_own_words',
        skipVariety: true,
        scenarioAssignment: null
    }
});
assert(!socraticPrompt.includes('SCENARIO (required)'), 'socratic explain_own_words omits scenario');
assert(!socraticPrompt.includes('cricket'), 'socratic explain_own_words omits cricket');

// buildPopCultureDirective — legacy helper still works
const popDirective = MF.buildPopCultureDirective(true, 'cooking', ['cooking', 'cricket']);
assert(popDirective.includes('Use a cooking scenario/domain'), 'pop directive uses domain wording');
assert(!popDirective.includes('Do NOT reuse these domains already used in this chapter: cooking'), 'reserved domain not in avoid list');
assert(popDirective.includes('cricket'), 'other used domains still in avoid list');

// buildIllustrateNewsWebPrompt — EXERCISE/TASK, no pop culture
const newsPrompt = MF.buildIllustrateNewsWebPrompt('Mitochondria produce ATP.', {
    bookTitle: 'Bio',
    gradeLevel: 'Class 9-10',
    objectiveLabel: 'Retention',
    illustrateStyle: 'news',
    popCultureEnabled: true,
    usedPopCulture: ['cricket'],
    skipVariety: false,
    authorNote: ''
});
assert(newsPrompt.includes('EXERCISE:'), 'news web prompt has EXERCISE');
assert(newsPrompt.includes('TASK:'), 'news web prompt has TASK');
assert(!newsPrompt.includes('Pop-culture guidance'), 'news web prompt skips pop culture');
assert(newsPrompt.includes('STRICT: Real news only'), 'news web prompt has strict line');

// validateWidgetOutput — structured analogy content
const structuredAnalogy = `ANALOGY TITLE:
Kitchen Prep

THE ANALOGY:
A prokaryotic cell is like a kitchen prep line without a separate pantry — no nucleus, and ribosomes work like small prep stations along the counter.

CONCEPT MAPPING:
Prokaryote → Open prep line → No membrane-bound nucleus
Nucleus → Pantry room → Missing in prokaryotes
Ribosomes → Prep stations → Make proteins along the counter
70S ribosomes → Small prep tools → Match prokaryotic ribosome size

WHERE THE ANALOGY BREAKS DOWN:
- Kitchens are not cells.

ONE-LINE TAKEAWAY:
Prokaryotes lack a nucleus but still use ribosomes for protein synthesis.`;

const noMechanism = MF.validateWidgetOutput('illustrate', 'analogy', 'content',
    'Think of a kitchen where ingredients mix together in a bowl.', '', {
        illustrateStyle: 'analogy',
        sourceText: 'Prokaryotes lack a membrane-bound nucleus and have 70S ribosomes.'
    });
assert(!noMechanism.ok, 'analogy without source terms fails');

const withMechanism = MF.validateWidgetOutput('illustrate', 'analogy', 'content', structuredAnalogy, '', {
    illustrateStyle: 'analogy',
    sourceText: 'Prokaryotes lack a membrane-bound nucleus and have 70S ribosomes.'
});
assert(withMechanism.ok, 'structured analogy with source terms passes');

// validateWidgetOutput — explain_like_im_five structured format
const eli5Structured = `CORE IDEA:
Lysosomes break down worn-out cell parts using digestive enzymes.

CONTEXT:
Think of lysosomes as the cell's cleanup crew that breaks down old materials so the cell stays healthy.

AUTHOR NOTE:
Misconception: lysosomes are optional extras
Evidence used: lysosomes, enzymes, digestion
Takeaway: lysosomes recycle cellular materials`;

const eli5SmokeOk = MF.validateWidgetOutput('explain-to-peer', 'explain_like_im_five', 'content', eli5Structured, '', {
    sourceText: 'Lysosomes contain digestive enzymes that break down worn-out organelles.'
});
assert(eli5SmokeOk.ok, 'structured explain_like_im_five validates');
const explainPeerImagine = MF.validateWidgetOutput('explain-to-peer', 'explain_like_im_five', 'content',
    'Imagine lysosomes as garbage trucks that eat old cell parts.', '', {});
assert(!explainPeerImagine.ok, 'explain_like_im_five unstructured Imagine fails');

// socratic what_if concept overlap (city scenario vs static membrane misconception)
const cityWhatIf = `SCENARIO: A city treats every road layout as permanent even when traffic patterns shift.
1. What if the city's traffic patterns shifted sharply but no routes could adapt?
2. How would treating the plasma membrane as fixed and unchanging limit what enters the cell?
3. What principle shows membranes are dynamic rather than static?

AUTHOR NOTE:
Misconception: plasma membrane is a static structure
Evidence used: plasma membrane, fluid mosaic, selective permeability
Takeaway: membranes adapt and regulate crossing`;

const cityWhatIfOk = MF.validateWidgetOutput('socratic-question', 'what_if', 'content', cityWhatIf, '', {
    sourceText: 'The plasma membrane is a fluid mosaic with selective permeability.'
});
assert(cityWhatIfOk.ok, 'what_if city/static misconception passes via concept overlap');

// WIDGET_DEFAULT_OBJECTIVES
assert(EN.getDefaultObjectiveTag('opposing-view') === 'critical_thinking', 'default objective counter');
assert(EN.getDefaultObjectiveTag('mini-case-study') === 'application', 'default objective case study');

// opposing-view — compare_models only, dynamic scenario in prompt
const opposingFmt = MF.pickFormatForInsert('opposing-view', []);
assert(opposingFmt?.formatId === 'compare_models', 'opposing pickFormat compare_models');
const opposingSource = 'Prokaryotes lack a membrane-bound nucleus and have 70S ribosomes.';
const opposingPrompt = MF.buildModuleUserPrompt('opposing-view', 'compare_models', opposingSource, {
    widgetCtx: {
        bookTitle: 'Bio',
        gradeLevel: 'Class 9-10',
        objectiveLabel: 'Critical thinking',
        actionId: 'opposing-view',
        formatId: 'compare_models',
        skipVariety: false,
        usedDomains: ['kitchen prep line'],
        usedHooks: []
    }
});
assert(opposingPrompt.includes('THE CLAIM:'), 'opposing prompt has structured markers');
assert(!opposingPrompt.includes('SCENARIO (required)'), 'opposing prompt has no scenario assignment');
assert(opposingPrompt.includes('Do NOT reuse these scenario settings'), 'opposing prompt includes domain variety');

console.log(`\nWidget prompt smoke tests: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
