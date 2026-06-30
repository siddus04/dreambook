/**
 * Voice input session tests (run: node voice_input_test.js)
 */
'use strict';

function shouldRestartVoiceOnEnd(voiceUserStopped, voiceListening) {
    return !voiceUserStopped && voiceListening;
}

function shouldStopVoiceOnSend() {
    return true;
}

function shouldShowStudentSuggestionChips(ctx) {
    const {
        readingViewActive,
        copilotMode,
        pendingCopilotQuote,
        activeWidgetChat,
        learningAssistantEnabled,
        studentChatHistory
    } = ctx;
    const showInReading = !!readingViewActive && copilotMode === 'student';
    const hasQuote = !!pendingCopilotQuote;
    const idle = !activeWidgetChat && learningAssistantEnabled;
    const hasUserMessages = (studentChatHistory || []).some(m => m.role === 'user');
    const showQuote = showInReading && hasQuote && !hasUserMessages;
    const showGeneral = showInReading && !hasQuote && idle && !hasUserMessages;
    return { showQuote, showGeneral, showLabel: showQuote || showGeneral };
}

let passed = 0;
let failed = 0;

function assert(cond, msg) {
    if (cond) { passed++; return; }
    failed++;
    console.error('FAIL:', msg);
}

assert(shouldRestartVoiceOnEnd(false, true), 'auto-restart when user has not stopped');
assert(!shouldRestartVoiceOnEnd(true, true), 'no restart after explicit stop');
assert(!shouldRestartVoiceOnEnd(false, false), 'no restart when session inactive');
assert(shouldStopVoiceOnSend(), 'send always stops voice');

const idleChips = shouldShowStudentSuggestionChips({
    readingViewActive: true,
    copilotMode: 'student',
    pendingCopilotQuote: null,
    activeWidgetChat: null,
    learningAssistantEnabled: true,
    studentChatHistory: []
});
assert(idleChips.showGeneral && idleChips.showLabel, 'general chips when idle');
assert(!idleChips.showQuote, 'no quote chips without selection');

const afterSend = shouldShowStudentSuggestionChips({
    readingViewActive: true,
    copilotMode: 'student',
    pendingCopilotQuote: null,
    activeWidgetChat: null,
    learningAssistantEnabled: true,
    studentChatHistory: [{ role: 'user', content: 'hello' }]
});
assert(!afterSend.showGeneral && !afterSend.showQuote && !afterSend.showLabel, 'chips hidden after first user message');

const quoteChips = shouldShowStudentSuggestionChips({
    readingViewActive: true,
    copilotMode: 'student',
    pendingCopilotQuote: 'Mitochondria',
    activeWidgetChat: null,
    learningAssistantEnabled: true,
    studentChatHistory: []
});
assert(quoteChips.showQuote && quoteChips.showLabel, 'quote chips when passage selected');

console.log(`\nVoice input tests: ${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
