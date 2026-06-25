/**
 * Explain-to-Peer (teach_sam) tests (run: node explain_to_peer_test.js)
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

const homeostasisSource = `Cells must obtain and use energy, take in raw materials, remove waste, synthesize molecules, grow, respond to stimuli, and maintain internal balance (homeostasis).
A cell without mitochondria cannot efficiently produce ATP; a cell without a nucleus cannot regulate gene expression; a cell without a functional membrane cannot control what enters or exits.`;

const goodStructured = `TITLE:
Sam's "Trash Only" Theory

SAM SAYS:
A cell stays healthy as long as it removes waste. It is basically like taking out the trash at home.

TASK:
Explain to Sam why that idea is incomplete, using simple language and at least one example from the passage.

QUESTIONS:
1. What is partly correct about Sam's idea that cells need to remove waste?
2. What important cell jobs does Sam's explanation leave out?
3. How would you explain homeostasis to Sam using mitochondria making ATP as one example?

AUTHOR NOTE:
Misconception: Reducing homeostasis to waste removal only
Evidence used: homeostasis, waste, energy, mitochondria, ATP
Required passage example: mitochondria producing ATP
Takeaway: Homeostasis requires many coordinated life processes, not just waste removal.`;

const badCorrectionInSam = `TITLE:
Sam's theory

SAM SAYS:
Sam thinks cells only need to remove waste. However, this is incorrect because cells also need to use energy efficiently to maintain homeostasis.

TASK:
Explain to Sam.

QUESTIONS:
1. What is partly correct?
2. What is missing?
3. Give an example?

AUTHOR NOTE:
Misconception: waste only
Evidence used: homeostasis, waste
Required passage example: mitochondria
Takeaway: Many processes matter.`;

const badMeta = `TITLE:
Sam

SAM SAYS:
Cells only remove waste to stay alive.

TASK:
This connects to the textbook because the passage says homeostasis matters.

QUESTIONS:
1. What does the passage say about waste?
2. What else?
3. Example?

AUTHOR NOTE:
Misconception: waste
Evidence used: homeostasis
Required passage example: mitochondria
Takeaway: test.`;

const legacyPlain = `Sam thinks cells only need to remove waste to stay healthy, like taking out the trash.`;

// parse
const parsed = MF.parseExplainPeerContent(goodStructured);
assert(parsed.title.includes('Trash'), 'parses TITLE');
assert(parsed.samSays.includes('waste'), 'parses SAM SAYS');
assert(parsed.task.includes('Explain to Sam'), 'parses TASK');
assert(parsed.questions.length === 3, 'parses 3 QUESTIONS');
assert(parsed.requiredExample.includes('mitochondria'), 'parses required example');
assert(parsed.structured, 'marks structured');

const legacyParsed = MF.parseExplainPeerContent(legacyPlain);
assert(!legacyParsed.structured, 'legacy not structured');

// validation good
const goodValid = MF.validateWidgetOutput('explain-to-peer', 'teach_sam', 'content', goodStructured, '', {
    sourceText: homeostasisSource
});
assert(goodValid.ok, 'good teach_sam validates');

// correction in SAM SAYS fails
const badValid = MF.validateWidgetOutput('explain-to-peer', 'teach_sam', 'content', badCorrectionInSam, '', {
    sourceText: homeostasisSource
});
assert(!badValid.ok, 'correction in SAM SAYS fails');

// meta fails
const metaValid = MF.validateWidgetOutput('explain-to-peer', 'teach_sam', 'content', badMeta, '', {
    sourceText: homeostasisSource
});
assert(!metaValid.ok, 'meta-language fails');

// legacy plain passes
const legacyValid = MF.validateWidgetOutput('explain-to-peer', 'teach_sam', 'content', legacyPlain, '', {
    sourceText: homeostasisSource
});
assert(legacyValid.ok, 'legacy plain brief validates');

// enhancements wrapper
const wrapped = EN.parseExplainPeerContent(goodStructured);
assert(wrapped.scenarioHook.includes('waste'), 'enhancements parseExplainPeerContent');
assert(wrapped.questions.length === 3, 'wrapper questions');

// prompt must not instruct giving correction in brief
const fmt = MF.resolveFormat('explain-to-peer', 'teach_sam');
assert(!fmt.contentPrompt.includes("why it's wrong"), 'prompt does not say why Sam is wrong');

// labels
assert(MF.EXPLAIN_PEER_LADDER_LABELS[0] === 'Partly correct', 'ladder labels');
assert(!SR.formatNeedsScenarioDomain('explain-to-peer', 'teach_sam', null, fmt), 'explain skips scenario');

const duplicateQ3 = `TITLE:
Understanding the Cell's Boundary

SAM SAYS:
The plasma membrane is just a solid wall that keeps everything in the cell from leaking out.

TASK:
Explain to Sam how the plasma membrane is more than just a solid wall.

QUESTIONS:
1. What is partly correct about Sam's idea of the plasma membrane being a boundary?
2. What important roles or features of the plasma membrane does Sam leave out?
3. What is partly correct about Sam's idea of the plasma membrane being a boundary?

AUTHOR NOTE:
Misconception: membrane is only a solid wall
Evidence used: plasma membrane, phospholipid bilayer, selective permeability
Required passage example: phospholipid bilayer
Takeaway: The membrane regulates traffic, not just containment.`;

const dupValid = MF.validateWidgetOutput('explain-to-peer', 'teach_sam', 'content', duplicateQ3, '', {
    sourceText: 'The plasma membrane is a semi-permeable phospholipid bilayer with integral proteins enabling selective permeability.'
});
assert(!dupValid.ok, 'duplicate Q1 and Q3 fails validation');

const markdownQ = MF.parseExplainPeerContent(`QUESTIONS:
1. **What is partly correct about Sam's idea?**
2. What does Sam leave out?
3. How does the nucleolus contribute to ribosome assembly?`);
assert(markdownQ.questions[0] === "What is partly correct about Sam's idea?", 'strips markdown and number prefix from questions');
assert(MF.cleanLadderQuestionText('1. **What is partly correct?**') === 'What is partly correct?', 'cleanLadderQuestionText strips markers');

// whiteboard_steps structured parse + validate
const whiteboardGood = `SETUP:
Endosymbiosis explains how mitochondria and chloroplasts arose when one cell engulfed another. Students must track engulfment, membrane retention, and gene transfer to see why these organelles resemble free-living bacteria.

STUDENT TASK:
On a whiteboard, order the stages of endosymbiosis and label which membrane traces back to the host versus the engulfed cell.

AUTHOR NOTE:
Misconception: organelles appeared fully formed without a sequence of events
Evidence used: endosymbiosis, mitochondria, chloroplasts, engulfment
Takeaway: organelles evolved through a stepwise engulfment process`;

const wbParsed = MF.parseExplainPeerWhiteboardContent(whiteboardGood);
assert(wbParsed.structured && wbParsed.setup.includes('Endosymbiosis'), 'whiteboard parses SETUP');
assert(wbParsed.task.includes('whiteboard'), 'whiteboard parses STUDENT TASK');
const wbOk = MF.validateWidgetOutput('explain-to-peer', 'whiteboard_steps', 'content', whiteboardGood, '', {
    sourceText: 'Endosymbiosis theory proposes mitochondria and chloroplasts arose from engulfed prokaryotes with double membranes.'
});
assert(wbOk.ok, 'structured whiteboard validates');

const wbDrift = MF.validateWidgetOutput('explain-to-peer', 'whiteboard_steps', 'content',
    '**Most Important Concept:** Endosymbiosis\nContext for Younger Students: fish eating bacteria', '', {
        sourceText: 'Endosymbiosis mitochondria chloroplasts engulfment'
    });
assert(!wbDrift.ok, 'whiteboard rejects markdown-header drift');

const wbOpeningRepeat = MF.validateWidgetOutput('explain-to-peer', 'whiteboard_steps', 'opening',
    whiteboardGood,
    'Endosymbiosis explains how mitochondria and chloroplasts arose when one cell engulfed another.',
    {});
assert(!wbOpeningRepeat.ok, 'whiteboard opening must not repeat SETUP');

const whiteboardTaskAlias = `SETUP:
Draw the protein pathway starting at the nucleus.

TASK:
Walk a peer through transcription, translation, and secretion in order.`;

const wbAliasParsed = MF.parseExplainPeerWhiteboardContent(whiteboardTaskAlias);
assert(wbAliasParsed.structured && wbAliasParsed.setup.includes('nucleus'), 'whiteboard TASK alias parses SETUP');
assert(wbAliasParsed.task.includes('transcription'), 'whiteboard TASK alias parses task');

const caseCached = MF.parseCaseStudyCachedContent(`ACTIVITY HOOK:
You're on the research team — what symptoms would you predict?

A patient shows low ATP during exercise. Which organelles would you check first?`);
assert(caseCached.activityHook.includes('research team'), 'case study parses ACTIVITY HOOK');
assert(caseCached.body.includes('patient shows'), 'case study body excludes hook');
assert(!caseCached.body.includes('ACTIVITY HOOK'), 'case study body has no hook header');

// explain_like_im_five structured parse + validate
const eli5Good = `CORE IDEA:
The plasma membrane controls what enters and leaves the cell through selective permeability.

CONTEXT:
Think of a gate that lets some delivery trucks through but blocks others. The membrane uses proteins and a phospholipid bilayer to decide which molecules cross.

AUTHOR NOTE:
Misconception: membrane is a static solid wall
Evidence used: plasma membrane, selective permeability, phospholipid bilayer
Takeaway: the membrane actively regulates traffic`;

const eli5Parsed = MF.parseExplainPeerEli5Content(eli5Good);
assert(eli5Parsed.structured && eli5Parsed.coreIdea.includes('plasma membrane'), 'ELI5 parses CORE IDEA');
assert(eli5Parsed.context.includes('gate'), 'ELI5 parses CONTEXT');
const eli5Ok = MF.validateWidgetOutput('explain-to-peer', 'explain_like_im_five', 'content', eli5Good, '', {
    sourceText: 'The plasma membrane is a phospholipid bilayer with selective permeability.'
});
assert(eli5Ok.ok, 'structured ELI5 validates');

const eli5OpeningRepeat = MF.validateWidgetOutput('explain-to-peer', 'explain_like_im_five', 'opening',
    eli5Good,
    'Think of a gate that lets some delivery trucks through but blocks others.',
    {});
assert(!eli5OpeningRepeat.ok, 'ELI5 opening must not repeat CONTEXT');

const explainPeerImagine = MF.validateWidgetOutput('explain-to-peer', 'explain_like_im_five', 'content',
    'Imagine lysosomes as garbage trucks that eat old cell parts.', '', {});
assert(!explainPeerImagine.ok, 'explain_like_im_five unstructured Imagine fails');

// socratic what_if — concept overlap for city/static misconception case
const plasmaWhatIf = `SCENARIO: A city planner treats every road as permanently fixed, never adding lanes when traffic grows.
1. What if traffic on those fixed roads doubled but the planner still refused any lane changes?
2. How would treating the plasma membrane as fixed and unchanging affect what crosses into the cell?
3. What principle from the passage shows membranes are dynamic, not static?

AUTHOR NOTE:
Misconception: plasma membrane is a static structure
Evidence used: plasma membrane, phospholipid bilayer, fluid mosaic, selective permeability
Takeaway: membranes remodel and regulate traffic dynamically`;

const plasmaParsed = MF.parseSocraticStructuredContent(plasmaWhatIf);
assert(plasmaParsed.questions.length === 3, 'what_if parses 3 questions');
const plasmaValid = MF.validateWidgetOutput('socratic-question', 'what_if', 'content', plasmaWhatIf, '', {
    sourceText: 'The plasma membrane is a fluid mosaic of phospholipids and proteins with selective permeability.'
});
assert(plasmaValid.ok, 'what_if city/static passes concept-overlap misconception check');

const allWhatIfQs = plasmaWhatIf.replace(
    '2. How would treating the plasma membrane as fixed and unchanging affect what crosses into the cell?',
    '2. What if the membrane stayed completely rigid forever?'
).replace(
    '3. What principle from the passage shows membranes are dynamic, not static?',
    '3. What if every crossing stayed blocked?'
);
const allWhatIfBad = MF.validateWidgetOutput('socratic-question', 'what_if', 'content', allWhatIfQs, '', {
    sourceText: 'The plasma membrane is a fluid mosaic of phospholipids and proteins with selective permeability.'
});
assert(!allWhatIfBad.ok, 'all-what-if ladder fails validation');

console.log(`\nExplain-to-Peer tests: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
