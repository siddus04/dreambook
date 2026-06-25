#!/usr/bin/env node
'use strict';

/**
 * Bulk image apply must not copy the review-panel textarea prompt into every finding.
 */

let passed = 0;
let failed = 0;

function assert(cond, msg) {
    if (cond) { passed++; return; }
    failed++;
    console.error('FAIL:', msg);
}

function shouldSyncPromptFromUI(options) {
    return !options?.bulk;
}

function applyPromptSyncRule(finding, uiPrompt, options) {
    if (shouldSyncPromptFromUI(options) && uiPrompt) {
        finding.payload.imagePrompt = uiPrompt;
    }
    return finding.payload.imagePrompt;
}

const findingA = {
    findingId: 'rf-fig-a',
    payload: {
        imagePrompt: 'FIGURE_SCOPE: Figure 2.1 — Hooke microscope apparatus',
        figureCaption: 'Figure 2.1: Hooke microscope apparatus'
    }
};
const findingB = {
    findingId: 'rf-fig-b',
    payload: {
        imagePrompt: 'FIGURE_SCOPE: Figure 2.2 — generalised animal cell with organelles',
        figureCaption: 'Figure 2.2: generalised animal cell with organelles'
    }
};

const uiPrompt = findingA.payload.imagePrompt;

applyPromptSyncRule(findingB, uiPrompt, { bulk: true });
assert(
    findingB.payload.imagePrompt === 'FIGURE_SCOPE: Figure 2.2 — generalised animal cell with organelles',
    'bulk apply must keep finding B stored prompt when panel shows finding A'
);

applyPromptSyncRule(findingB, uiPrompt, { bulk: false });
assert(
    findingB.payload.imagePrompt === uiPrompt,
    'single apply should sync prompt from review panel textarea'
);

console.log(`figure_bulk_prompt_isolation_test: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
