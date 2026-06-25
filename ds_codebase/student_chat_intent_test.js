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

console.log(`\nStudent chat intent tests: ${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
