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
assert(MF.DEBATE_LADDER_LABELS[2] === 'Bigger idea', 'debate step 3 label emphasizes bigger idea');
assert(MF.buildDebateQuestionLadder().length === 3, 'buildDebateQuestionLadder returns 3 prompts');
assert(MF.buildDebateQuestionLadder()[0].includes('too broad'), 'generic step 1 prompt tests overgeneralization');
assert(MF.buildDebateQuestionLadder()[1].includes('still work'), 'generic step 2 prompt asks for exception plus mechanism');
assert(MF.buildDebateQuestionLadder()[2].includes('bigger idea'), 'step 3 prompt asks for bigger idea');

const cellDebateProfile = MF.buildDebateRubricProfile(`THE CLAIM:
One student says every cell needs a nucleus because it controls cell activities.

COUNTER-VIEW:
Another student points to prokaryotic cells like bacteria, which lack a nucleus but still store genetic material in a nucleoid.

AUTHOR NOTE:
Misconception: every cell needs a nucleus
Evidence to use: prokaryotic cells, nucleoid, nucleus`);
assert(cellDebateProfile.kind === 'cell_nucleus', 'cell debate profile detected');
assert(MF.buildDebateStepSpec(2, cellDebateProfile).goal.includes('prokaryotic cells'), 'cell step spec includes counterexample goal');
const parsedDebateTurn = MF.parseDebateTurnEvaluation('```json\n{"student_state":"memory_lapse","step_complete":false,"coach_move":"hint","coach_reply":"Think about bacteria. What kind of cell lacks a nucleus?","advance_to_step":null,"state_delta":{"asked_for_help":true}}\n```');
assert(parsedDebateTurn && parsedDebateTurn.student_state === 'memory_lapse', 'parseDebateTurnEvaluation reads structured JSON');
assert(parsedDebateTurn.coach_reply.includes('bacteria'), 'parseDebateTurnEvaluation keeps coach reply');

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

const visiblePartialCorrect = MF.buildDebateCoachVisibleReply(
    { feedback: 'Yes — the claim is too broad.', is_correct: true, should_advance: false, nudge_question: 'If the claim is too broad, what part of it still holds for some cells?' },
    ''
);
assert(visiblePartialCorrect === 'If the claim is too broad, what part of it still holds for some cells?', 'partial correct reply prefers open-ended question only');

const step1 = MF.evaluateDebateStepAnswer(1, 'The nucleus controls cell activities');
assert(step1.should_advance === true, 'step 1 good-enough advances');

const step1weak = MF.evaluateDebateStepAnswer(1, 'nothing is fair, every cell does not need a nucleus');
assert(step1weak.should_advance === false, 'step 1 weak rejection does not advance');
assert(step1weak.is_correct === true, 'step 1 weak rejection is treated as a valid broad diagnosis');
assert(step1weak.feedback && step1weak.feedback.includes('too broad'), 'step 1 weak rejection gets accurate feedback');
assert(step1weak.nudge_question && step1weak.nudge_question.includes('what part of it still holds'), 'step 1 weak rejection gets open-ended nudge');

const step1broad = MF.evaluateDebateStepAnswer(1, 'I think it is too broad');
assert(step1broad.should_advance === false, 'step 1 broad diagnosis alone does not advance');
assert(step1broad.feedback && step1broad.feedback.includes('too broad'), 'step 1 broad diagnosis gets direct feedback');
assert(step1broad.nudge_question && step1broad.nudge_question.includes('what part of it still holds'), 'step 1 broad diagnosis gets open-ended follow-up');

const step1wrongCellType = MF.evaluateDebateStepAnswer(1, 'Some cells must have a nucleus for controlling cell activities and those are prokaryotic cells');
assert(step1wrongCellType.should_advance === false, 'step 1 wrong cell type does not advance');
assert(step1wrongCellType.feedback && step1wrongCellType.feedback.includes('prokaryotic cells do not have a nucleus'), 'step 1 wrong cell type gets correction');
assert(step1wrongCellType.nudge_question && step1wrongCellType.nudge_question.includes('fit instead'), 'step 1 wrong cell type gets redirect question');

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

const step2wrongType = MF.evaluateDebateStepAnswer(2, 'Eukaryotic cells do not have a nucleus');
assert(step2wrongType.should_advance === false, 'step 2 wrong cell type does not advance');
assert(step2wrongType.feedback && step2wrongType.feedback.includes('not the counterexample'), 'step 2 wrong cell type gets correction');
assert(step2wrongType.nudge_question && step2wrongType.nudge_question.includes('lacks a nucleus instead'), 'step 2 wrong cell type gets redirect');

const step2bareWrongType = MF.evaluateDebateStepAnswer(2, 'Eukaryotic cells');
assert(step2bareWrongType.should_advance === false, 'step 2 bare wrong cell type does not advance');
assert(step2bareWrongType.feedback && step2bareWrongType.feedback.includes('not the counterexample'), 'step 2 bare wrong cell type gets correction');
assert(step2bareWrongType.nudge_question && step2bareWrongType.nudge_question.includes('lacks a nucleus instead'), 'step 2 bare wrong cell type gets redirect');

const step2wrongTypeRepeated = MF.evaluateDebateStepAnswer(
    2,
    'Eukaryotic cells do not have a nucleus',
    { ...MF.createDebateSocraticState(2, cellDebateProfile), followups_in_current_step: 1 }
);
assert(step2wrongTypeRepeated.nudge_question && step2wrongTypeRepeated.nudge_question.includes('bacteria'), 'step 2 repeated wrong type gets stronger hint');

const step2bareWrongTypeRepeated = MF.evaluateDebateStepAnswer(
    2,
    'I thinkEukaryotic cells',
    { ...MF.createDebateSocraticState(2, cellDebateProfile), followups_in_current_step: 1 }
);
assert(step2bareWrongTypeRepeated.nudge_question && step2bareWrongTypeRepeated.nudge_question.includes('bacteria'), 'step 2 repeated bare wrong type gets stronger hint');

const step3partial = MF.evaluateDebateStepAnswer(3, 'all cells do not need a nucleus');
assert(step3partial.should_advance === false, 'step 3 partial repair blocked');
assert(step3partial.nudge_question && step3partial.nudge_question.includes('bigger idea'), 'step 3 asks for bigger idea');

const step3structure = MF.evaluateDebateStepAnswer(
    3,
    'not all cells have the same structural organisation some cells may have a nucleus some may not',
    MF.updateDebateSocraticState(MF.createDebateSocraticState(3, cellDebateProfile), 2, { should_advance: true, known_concepts: { prokaryotes_lack_nucleus: true, nucleoid_or_dna: true } }, 'in the nucleoid')
);
assert(step3structure.should_advance === true, 'step 3 accepts same-structure takeaway');

const step3principle = MF.evaluateDebateStepAnswer(
    3,
    'It shows that cells can still do the same basic job even if they organize genetic instructions in different ways.',
    MF.updateDebateSocraticState(MF.createDebateSocraticState(3), 2, { should_advance: true, known_concepts: { prokaryotes_lack_nucleus: true, nucleoid_or_dna: true } }, 'in the nucleoid')
);
assert(step3principle.should_advance === true, 'step 3 principle answer advances');

const step3full = MF.evaluateDebateStepAnswer(3, 'Eukaryotic cells use a nucleus to organize genetic material, but prokaryotic cells use DNA in a nucleoid, so not all cells need a nucleus.');
assert(step3full.should_advance === true, 'step 3 full repair advances');

const step3transcript = MF.evaluateDebateStepAnswer(
    3,
    'Eukaryotic cells have a nucleus to control activities, but prokaryotic cells do not so a nucleus is not essneital for controlling cell activities.',
    MF.updateDebateSocraticState(MF.createDebateSocraticState(3, cellDebateProfile), 2, { should_advance: true, known_concepts: { prokaryotes_lack_nucleus: true, nucleoid_or_dna: true } }, 'in the nucleoid')
);
assert(step3transcript.should_advance === true, 'step 3 transcript repair advances');

const genericState = MF.createDebateSocraticState(1, MF.buildDebateRubricProfile(`THE CLAIM:
All renewable energy sources work equally well everywhere.

COUNTER-VIEW:
Solar power is less reliable in regions with long dark winters, so energy choices depend on location and storage.

AUTHOR NOTE:
Misconception: one energy source is always best
Evidence to use: solar power, dark winters, storage`));
const genericStep1 = MF.evaluateDebateStepAnswer(1, 'That seems too broad because solar power depends on where you are and how much sunlight you get.', genericState);
assert(genericStep1.should_advance === true, 'generic step 1 advances on overgeneralization reasoning');
const genericStep2 = MF.evaluateDebateStepAnswer(2, 'Places with long dark winters challenge the claim because solar panels get much less sunlight there.', {
    ...genericState,
    rubric_profile: genericState.rubric_profile
});
assert(genericStep2.should_advance === true, 'generic step 2 advances on exception plus mechanism');
const genericStep3 = MF.evaluateDebateStepAnswer(3, 'It shows the better rule is that energy choices depend on context, so one option is not automatically best everywhere.', genericState);
assert(genericStep3.should_advance === true, 'generic step 3 advances on revised rule');

const visibleLongCoach = MF.buildDebateCoachVisibleReply(
    { feedback: '', should_advance: false, nudge_question: 'You have the example. What bigger idea does it show about how cells work?' },
    'That\'s a strong revision. Eukaryotic cells have a nucleus to manage activities, but prokaryotic cells manage without one. How would you rewrite the claim?'
);
assert(!visibleLongCoach.includes('strong revision'), 'long coach fallback dropped when nudge present');
assert(visibleLongCoach.includes('bigger idea'), 'nudge-only reply on incomplete step 3');

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

const mergedPartialClientWins = MF.mergeDebateStepEvaluations(
    { should_advance: false, feedback: 'Close. What does the nucleus contain or organize?', nudge_question: 'What does the nucleus contain or organize that helps the cell control activities?' },
    {
        is_correct: true,
        is_complete_for_current_step: false,
        should_advance: false,
        feedback: 'Yes — the claim is too broad.',
        nudge_question: 'If the claim is too broad, what part of it still holds for some cells?'
    }
);
assert(mergedPartialClientWins.feedback.includes('too broad'), 'client partial feedback preferred over weaker coach framing');
assert(mergedPartialClientWins.nudge_question.includes('what part of it still holds'), 'client partial nudge preserved');

const debateInstruction = MF.buildDebateRubricCoachInstruction({ step: 2, weakTries: 0, followupsInStep: 1 });
assert(debateInstruction.includes('MESSAGE OWNERSHIP'), 'coach instruction has ownership rules');
assert(debateInstruction.includes('nudge_question'), 'coach instruction uses new schema');
assert(!debateInstruction.includes('Mechanism'), 'no separate mechanism step');
assert(debateInstruction.includes('Step 3 Bigger idea'), 'coach instruction frames final step as bigger idea');

assert(MF.resolveDebateActiveStep({ 1: true, 2: true, 3: true }) === null, 'resolveDebateActiveStep done at 3');

const debatePolicy = MF.getWidgetChatPolicy('debate', 'opposing-view');
assert(debatePolicy.minTurns === 3, 'debate minTurns is 3');

const footer = MF.getDebateStepFooterCopy(2, 'needs_nudge', 1);
assert(footer.includes('Step 2 of 3'), 'footer shows 3 steps');

console.log(`\nWidget coaching tests: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
