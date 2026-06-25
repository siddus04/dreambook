/**
 * Widget coaching helper tests (run: node widget_coaching_test.js)
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

assert(MF.isDebateLadderConcluded({ 1: true, 2: true, 3: true }) === true, 'debate 3-step complete');
assert(MF.isDebateLadderConcluded({ 1: true, 2: true }) === false, 'debate 3-step incomplete');

assert(Array.isArray(MF.DEBATE_LADDER_LABELS) && MF.DEBATE_LADDER_LABELS.length === 3, 'DEBATE_LADDER_LABELS has 3 items');
assert(MF.buildDebateQuestionLadder().length === 3, 'buildDebateQuestionLadder returns 3 prompts');
assert(MF.buildDebateQuestionLadder()[1].includes('nucleus'), 'step 2 prompt mentions nucleus');

const parsedEval = MF.parseCoachResponse(
    'Right.\n[STEP_EVAL]{"feedback":"Right — that part is true.","should_advance":true,"next_step":"counterexample","nudge_question":null}[/STEP_EVAL]'
);
assert(parsedEval.stepEval && parsedEval.stepEval.should_advance === true, 'parseCoachResponse extracts STEP_EVAL');
assert(parsedEval.stepEval.nudge_question === null, 'advance eval has null nudge');
assert(!parsedEval.text.includes('[STEP_EVAL]'), 'parseCoachResponse strips STEP_EVAL');

const visibleAdvance = MF.buildDebateCoachVisibleReply(
    { feedback: 'Right — that part is true.', should_advance: true, nudge_question: null },
    'fallback'
);
assert(!visibleAdvance.includes('?'), 'advance reply has no question');

const visibleNudge = MF.buildDebateCoachVisibleReply(
    { feedback: 'Close, but name the cell type.', should_advance: false, nudge_question: 'What kind of cell lacks a nucleus?' },
    ''
);
assert(visibleNudge.includes('What kind of cell lacks a nucleus'), 'nudge reply includes one question');

const step1 = MF.evaluateDebateStepAnswer(1, 'The nucleus controls cell activities');
assert(step1.should_advance === true, 'step 1 good-enough advances');

const step2shallow = MF.evaluateDebateStepAnswer(2, 'not all cells need a nucleus');
assert(step2shallow.should_advance === false, 'step 2 bare conclusion blocked');
assert(step2shallow.nudge_question, 'step 2 shallow gets nudge');

const step2partial = MF.evaluateDebateStepAnswer(2, 'prokaryotic cells like bacteria');
assert(step2partial.should_advance === false, 'step 2 prokaryote alone does not advance');
assert(step2partial.nudge_question && step2partial.nudge_question.includes('genetic'), 'step 2 prokaryote nudges nucleoid');

const stateAfterProk = MF.updateDebateSocraticState(
    MF.createDebateSocraticState(2),
    2,
    step2partial,
    'prokaryotic cells like bacteria'
);
const step2complete = MF.evaluateDebateStepAnswer(2, 'in the nucleoid', stateAfterProk);
assert(step2complete.should_advance === true, 'step 2 nucleoid after prokaryote advances');

const step3partial = MF.evaluateDebateStepAnswer(3, 'all cells do not need a nucleus');
assert(step3partial.should_advance === false, 'step 3 partial repair blocked');
assert(step3partial.nudge_question && step3partial.nudge_question.includes('Eukaryotic'), 'step 3 sentence frame');

const step3full = MF.evaluateDebateStepAnswer(3, 'Eukaryotic cells use a nucleus to organize genetic material, but prokaryotic cells use DNA in a nucleoid, so not all cells need a nucleus.');
assert(step3full.should_advance === true, 'step 3 full repair advances');

const mergedOk = MF.mergeDebateStepEvaluations(
    { should_advance: true, feedback: 'Yes.', nudge_question: null },
    { is_complete_for_current_step: true, should_advance: true, feedback: 'Yes.' }
);
assert(mergedOk.should_advance === true, 'coach and client agree');
assert(mergedOk.nudge_question === null, 'merged advance clears nudge');

const mergedClientWins = MF.mergeDebateStepEvaluations(
    { should_advance: false, feedback: 'Correct, the nucleus is crucial.', nudge_question: 'How might this differ?' },
    {
        is_complete_for_current_step: true,
        should_advance: true,
        feedback: 'Right — that part is true for eukaryotic cells because the nucleus helps organize genetic information.'
    }
);
assert(mergedClientWins.should_advance === true, 'client good-enough wins over conservative coach');
assert(mergedClientWins.feedback.includes('Right'), 'client feedback preferred when complete');
assert(mergedClientWins.nudge_question === null, 'advance clears coach nudge');

const debateInstruction = MF.buildDebateRubricCoachInstruction({ step: 2, weakTries: 0, followupsInStep: 1 });
assert(debateInstruction.includes('MESSAGE OWNERSHIP'), 'coach instruction has ownership rules');
assert(debateInstruction.includes('nudge_question'), 'coach instruction uses new schema');
assert(!debateInstruction.includes('Mechanism'), 'no separate mechanism step');

assert(MF.resolveDebateActiveStep({ 1: true, 2: true, 3: true }) === null, 'resolveDebateActiveStep done at 3');

const debatePolicy = MF.getWidgetChatPolicy('debate', 'opposing-view');
assert(debatePolicy.minTurns === 3, 'debate minTurns is 3');

const footer = MF.getDebateStepFooterCopy(2, 'needs_nudge', 1);
assert(footer.includes('Step 2 of 3'), 'footer shows 3 steps');

console.log(`\nWidget coaching tests: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
