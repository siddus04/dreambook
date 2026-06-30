/**
 * Student chat intent tests (run: node student_chat_intent_test.js)
 */
'use strict';

const STUDENT_CHAT_CHIP_INTENTS = {
    'Explain this simply': 'simplify',
    'Summarize this': 'summarize',
    'Give me an example': 'example',
    'Why is this important?': 'why_important'
};

function detectStudentChatIntent(message, explicitIntent) {
    if (explicitIntent && explicitIntent !== 'general') return explicitIntent;
    const m = String(message || '').trim();
    const chipIntent = STUDENT_CHAT_CHIP_INTENTS[m];
    if (chipIntent) return chipIntent;
    const lower = m.toLowerCase();
    if (/^(summarize|tl;dr)|main idea|in short|brief summary/.test(lower)) return 'summarize';
    if (/^give me an example|^example\b|an analogy|real.?world example/.test(lower)) return 'example';
    if (/why is this important|why does this matter|so what\b|why should i care/.test(lower)) return 'why_important';
    if (/too complex|too complicated|too hard|don't understand|do not understand|confus|simpler|simple terms|explain simply|eli5|over my head|lost me|makes no sense|can't follow|cannot follow|help me understand/i.test(lower)) {
        return 'simplify';
    }
    return 'general';
}

function detectSaveChatToNotesIntent(message) {
    const lower = String(message || '').trim().toLowerCase();
    if (!lower) return false;
    if (/add (this|that|it) to (my )?notes|save (this|that|it) to (my )?notes|put (this|that|it) in (my )?notes/.test(lower)) return true;
    if (/add to notes so i remember|save to notes so i remember|remember this (for me )?in (my )?notes/.test(lower)) return true;
    if (/^(please )?(save|add).{0,40}notes.{0,30}(remember|so i remember)/.test(lower)) return true;
    if (/help me remember (this|that|it)|make a note (of|about) (this|that|our conversation)/.test(lower)) return true;
    if (/^add (this|that) to my notes/.test(lower)) return true;
    return false;
}

let passed = 0;
let failed = 0;

function assert(cond, msg) {
    if (cond) { passed++; return; }
    failed++;
    console.error('FAIL:', msg);
}

assert(detectStudentChatIntent('Explain this simply') === 'simplify', 'chip simplify');
assert(detectStudentChatIntent('Summarize this') === 'summarize', 'chip summarize');
assert(detectStudentChatIntent('Give me an example') === 'example', 'chip example');
assert(detectStudentChatIntent('Why is this important?') === 'why_important', 'chip why');
assert(detectStudentChatIntent('this is too complex for me to understand') === 'simplify', 'vague too complex');
assert(detectStudentChatIntent('what are cristae?') === 'general', 'specific question');
assert(detectStudentChatIntent('tell me the main idea') === 'summarize', 'main idea phrase');
assert(detectStudentChatIntent('foo', 'example') === 'example', 'explicit intent');

assert(detectSaveChatToNotesIntent('add this to my notes so I remember'), 'add to notes phrase');
assert(detectSaveChatToNotesIntent('save this to notes'), 'save to notes');
assert(detectSaveChatToNotesIntent('help me remember this'), 'help me remember');
assert(!detectSaveChatToNotesIntent('what are prokaryotes?'), 'general question not save intent');

/**
 * Mirror of sendCopilotMessage student non-widget guard (editor.html).
 * Returns 'block' | 'widget' | 'student_send' | 'not_student_path'.
 */
function resolveStudentCopilotSendRoute(ctx) {
    const {
        copilotMode,
        activeWidgetChat,
        pendingCopilotQuote,
        learningAssistantEnabled,
        message
    } = ctx;

    if (copilotMode !== 'student') return 'not_student_path';
    if (!String(message || '').trim()) return 'block';

    if (learningAssistantEnabled && detectSaveChatToNotesIntent(message)) {
        return 'save_to_notes';
    }

    if (activeWidgetChat) {
        if (!learningAssistantEnabled) return 'block';
        return 'widget';
    }

    if (!learningAssistantEnabled) return 'block';
    return 'student_send';
}

function hasSummarizableChat(sessionLog, widgetHistory, lastCompleted, studentChatHistory) {
    if ((sessionLog || []).some(m => m.role === 'assistant')) return true;
    if ((widgetHistory || []).some(m => m.role === 'assistant')) return true;
    if ((lastCompleted?.history || []).some(m => m.role === 'assistant')) return true;
    return (studentChatHistory || []).some(m => m.role === 'assistant');
}

function buildTranscriptForNotes(entries, options = {}) {
    const { excludeSaveRequest = true } = options;
    let rows = [...entries];
    if (excludeSaveRequest && rows.length && rows[rows.length - 1].role === 'user'
        && detectSaveChatToNotesIntent(rows[rows.length - 1].content)) {
        rows = rows.slice(0, -1);
    }
    return rows.map(m => `${m.role === 'user' ? 'Student' : 'Assistant'}: ${m.content}`).join('\n');
}

function shouldBlockStudentNonWidgetSend(ctx) {
    return resolveStudentCopilotSendRoute(ctx) === 'block';
}

assert(
    resolveStudentCopilotSendRoute({
        copilotMode: 'student',
        activeWidgetChat: null,
        pendingCopilotQuote: null,
        learningAssistantEnabled: true,
        message: 'What are prokaryotes?'
    }) === 'student_send',
    'freeform student send when LA on and no quote'
);
assert(
    !shouldBlockStudentNonWidgetSend({
        copilotMode: 'student',
        activeWidgetChat: null,
        pendingCopilotQuote: null,
        learningAssistantEnabled: true,
        message: 'What are prokaryotes?'
    }),
    'freeform should not early-return when LA on'
);
assert(
    shouldBlockStudentNonWidgetSend({
        copilotMode: 'student',
        activeWidgetChat: null,
        pendingCopilotQuote: null,
        learningAssistantEnabled: false,
        message: 'What are prokaryotes?'
    }),
    'freeform blocked when LA off'
);
assert(
    resolveStudentCopilotSendRoute({
        copilotMode: 'student',
        activeWidgetChat: { widgetId: 'w1' },
        pendingCopilotQuote: null,
        learningAssistantEnabled: true,
        message: 'My idea is…'
    }) === 'widget',
    'widget chat route unchanged'
);
assert(
    resolveStudentCopilotSendRoute({
        copilotMode: 'student',
        activeWidgetChat: { widgetId: 'w1' },
        pendingCopilotQuote: null,
        learningAssistantEnabled: true,
        message: 'add this to my notes'
    }) === 'save_to_notes',
    'save intent intercepts before widget send'
);
assert(
    hasSummarizableChat([], [{ role: 'assistant', content: 'Good thinking' }], null, []),
    'widget-only history is summarizable'
);
assert(
    !hasSummarizableChat([], [{ role: 'user', content: 'hello' }], null, []),
    'user-only widget history not summarizable'
);
const widgetTranscript = buildTranscriptForNotes([
    { role: 'assistant', content: 'Why is the claim too broad?' },
    { role: 'user', content: 'prokaryotes have a nucleus' },
    { role: 'assistant', content: 'Try nucleoid instead' },
    { role: 'user', content: 'add this to my notes' }
]);
assert(widgetTranscript.includes('nucleoid'), 'transcript includes ladder dialogue');
assert(!widgetTranscript.includes('add this to my notes'), 'transcript excludes save request');
assert(
    resolveStudentCopilotSendRoute({
        copilotMode: 'student',
        activeWidgetChat: null,
        pendingCopilotQuote: 'Mitochondria are the powerhouse of the cell.',
        learningAssistantEnabled: true,
        message: 'Explain this simply'
    }) === 'student_send',
    'quoted passage still routes to student send'
);

console.log(`\nStudent chat intent tests: ${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
