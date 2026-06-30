/**
 * Reading level validation tests (run: node reading_level_test.js)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const editorHtml = fs.readFileSync(path.join(__dirname, 'editor.html'), 'utf8');
const coreJs = fs.readFileSync(path.join(__dirname, 'reading_level_core.js'), 'utf8');

const chapterMarkerStart = 'function countReadingLevelPreserveMarkers(markdown) {';
const chapterMarkerEnd = 'async function simplifyFullChapterMarkdownViaAPI(markdown, level, clarifierTerms, styleOptions) {';
const chapterStart = editorHtml.indexOf(chapterMarkerStart);
const chapterEnd = editorHtml.indexOf(chapterMarkerEnd);
if (chapterStart < 0 || chapterEnd < 0) throw new Error('Could not locate chapter reading level helper block in editor.html');

const mergeMarkerStart = 'function splitMarkdownOnPreserveMarkers(markdown) {';
const mergeMarkerEnd = 'function polishedMarkdownToEditorHTML(markdown) {';
const mergeStart = editorHtml.indexOf(mergeMarkerStart);
const mergeEnd = editorHtml.indexOf(mergeMarkerEnd);
if (mergeStart < 0 || mergeEnd < 0) throw new Error('Could not locate merge helper block in editor.html');

const chunkMarkerStart = 'async function simplifyFullChapterMarkdownViaAPI(markdown, level, clarifierTerms, styleOptions) {';
const chunkMarkerEnd = 'function renderReadingLevelMarkdownIntoPolishedPane(polishedEl, markdown, originalMarkdown) {';
const chunkStart = editorHtml.indexOf(chunkMarkerStart);
const chunkEnd = editorHtml.indexOf(chunkMarkerEnd);
if (chunkStart < 0 || chunkEnd < 0) throw new Error('Could not locate chunk simplification helper block in editor.html');

function createMockElement(tag) {
    const el = {
        tagName: String(tag || 'div').toUpperCase(),
        nodeType: 1,
        innerHTML: '',
        classList: { add() {}, remove() {} },
        closest: () => null,
        querySelectorAll(sel) {
            if (sel !== ':scope > li') return [];
            const items = [];
            const re = /<li[^>]*>([\s\S]*?)<\/li>/gi;
            let match;
            while ((match = re.exec(this.innerHTML))) {
                items.push(createMockElement('li'));
                items[items.length - 1].innerHTML = match[1];
                items[items.length - 1].innerText = match[1].replace(/<[^>]+>/g, '');
            }
            return items;
        }
    };
    Object.defineProperty(el, 'innerText', {
        get() { return el.innerHTML.replace(/<[^>]+>/g, ''); }
    });
    Object.defineProperty(el, 'children', {
        get() {
            const items = [];
            const re = /<(h1|h2|h3|h4|p|ul|ol|li)[^>]*>([\s\S]*?)<\/\1>/gi;
            let match;
            while ((match = re.exec(el.innerHTML))) {
                const child = createMockElement(match[1]);
                child.innerHTML = match[2];
                items.push(child);
            }
            return items;
        }
    });
    return el;
}

const editorMock = createMockElement('div');
editorMock.innerHTML = '<h1>2.1 Cytology</h1><p>Cells form the basis of all living things and this paragraph has enough words to validate properly here.</p><p>Scientists study cells carefully and this paragraph has enough words to validate properly here.</p>';

const sandbox = {
    console,
    String,
    Array,
    Object,
    RegExp,
    Math,
    parseInt,
    JSON,
    Node: { ELEMENT_NODE: 1 },
    appState: { gradeLevel: 'Class 9-10' },
    document: {
        getElementById: (id) => (id === 'editor' ? editorMock : createMockElement('div')),
        createElement: (tag) => createMockElement(tag)
    },
    beautifyState: { preservedBlocks: new Map() },
    polishedMarkdownToEditorHTML: (markdown) => {
        const splitRe = /<!--\s*PRESERVE_BLOCK_\d+\s*-->/g;
        const parts = (markdown || '').split(splitRe);
        const markers = (markdown || '').match(/<!--\s*PRESERVE_BLOCK_\d+\s*-->/g) || [];
        let html = '';
        const usedKeys = new Set();
        parts.forEach((part, i) => {
            const chunk = part.trim();
            if (chunk) {
                chunk.split(/\n\n+/).forEach(block => {
                    const line = block.trim();
                    if (!line) return;
                    if (line.startsWith('# ')) html += `<h1>${line.slice(2).split('\n')[0]}</h1>`;
                    else if (line.startsWith('- ')) html += `<ul><li>${line.slice(2)}</li></ul>`;
                    else html += `<p>${line.replace(/\n/g, ' ')}</p>`;
                });
            }
            if (markers[i]) {
                const key = markers[i].replace(/^<!--\s*|\s*-->$/g, '');
                html += sandbox.beautifyState.preservedBlocks.get(key) || '';
                usedKeys.add(key);
            }
        });
        for (const [key, blockHtml] of sandbox.beautifyState.preservedBlocks.entries()) {
            if (!usedKeys.has(key)) html += blockHtml;
        }
        return html || '<p><br></p>';
    },
    isExerciseSectionHeading: () => false,
    isStudentExercisePrompt: () => false,
    isFigurePlaceholderBlock: () => false,
    isReadingLevelPreservedBlock: (el) => {
        const tag = el?.tagName?.toLowerCase();
        return ['h1', 'h2', 'h3', 'h4'].includes(tag);
    },
    getJargonGradeBaselines: (gradeLevel) => {
        const level = (gradeLevel || 'Class 9-10').toLowerCase();
        if (/class\s*(6|7|8)|6-8|middle/.test(level)) {
            return 'cell, DNA, energy, plant, animal, bacteria, water, food, growth, organism';
        }
        if (/class\s*(9|10)|9-10/.test(level)) {
            return 'cell, nucleus, DNA, membrane, protein, energy, mitochondria, plant, animal, bacteria, enzyme, organism, gene';
        }
        if (/class\s*(11|12)|11-12/.test(level)) {
            return 'cell, DNA, RNA, protein, membrane, ATP, enzyme, nucleus, gene, organism, energy';
        }
        return 'cell, DNA, organism, energy, protein, membrane, enzyme';
    },
    getGradeContext: () => 'Grade context.'
};

vm.runInNewContext(coreJs, sandbox, { filename: 'reading_level_core.js' });

const gradeTargetStart = editorHtml.indexOf('function getReadingLevelTargetForGrade() {');
const gradeTargetEnd = editorHtml.indexOf('function extractSectionNumberFromHeading(heading) {');
if (gradeTargetStart >= 0 && gradeTargetEnd > gradeTargetStart) {
    vm.runInNewContext(editorHtml.slice(gradeTargetStart, gradeTargetEnd), sandbox, { filename: 'grade_target.js' });
}

vm.runInNewContext(editorHtml.slice(chapterStart, chapterEnd), sandbox, { filename: 'reading_level_chapter_helpers.js' });
vm.runInNewContext(editorHtml.slice(mergeStart, mergeEnd), sandbox, { filename: 'merge_helpers.js' });
vm.runInNewContext(editorHtml.slice(chunkStart, chunkEnd), sandbox, { filename: 'chunk_helpers.js' });

const {
    validateReadingLevelOutput,
    extractReadingLevelProtectedTerms,
    isReadingLevelGlossaryListItem,
    getReadingLevelWordCountBounds,
    getDefaultReadingLevelStyleOptions,
    normalizeReadingLevelStyleOptions,
    getReadingLevelTargetForGrade,
    getReadingLevelTargetLabel,
    countReadingLevelPreserveMarkers,
    countMarkdownHeadingsByLevel,
    splitReadingLevelMarkdownBlocks,
    validateReadingLevelChapterOutput,
    readingLevelRequiresClarifiers,
    extractReadingLevelClarifierCandidatesHeuristic,
    hasInlineClarifierForTerm,
    hasVisualMetaphorForTerm,
    hasPictureWordPictureForTerm,
    readingLevelIsParaphraseOnly,
    getReadingLevelTemperature,
    getReadingLevelEngagementRules,
    getReadingLevelSimplifySystemPrompt,
    getFriendlyToneRules,
    getPlayfulToneRules,
    detectReadingLevelParagraphOpenerStyle,
    readingLevelHasParagraphVisualMetaphor,
    readingLevelHasMixedVisualThemes,
    readingLevelTermAppearsBold,
    readingLevelWouldExceedCommandOpenerQuota,
    getReadingLevelVisualGoldFewShot,
    extractReadingLevelFrictionPhraseCandidates,
    readingLevelHasStackedFrictionPhrases,
    getReadingLevelFrictionPhraseRules,
    isReadingLevelTheoryListItem,
    getReadingLevelTheoryListEngagementRules,
    getReadingLevelValidationBounds,
    readingLevelCountSentences,
    buildReadingLevelUserPrompt,
    getReadingLevelPromptForLevel,
    splitMarkdownOnPreserveMarkers,
    mergeChapterMarkdownWithPreserveStructure,
    simplifyWholeChapterMarkdownByChunks
} = sandbox;

let passed = 0;
let failed = 0;

function assert(cond, msg) {
    if (cond) { passed++; return; }
    failed++;
    console.error('FAIL:', msg);
}

const sourcePara = 'In 1665, the English scientist Robert Hooke used a primitive compound microscope to observe the desiccated structures of cork, coining the term "cell" due to their resemblance to monastic quarters.';

const badHighSchool = 'In 1665, scientist Robert Hook compound microscope to at dried cork structures. He them "cells" because they looked like in monastery.';

const badList = 'All living things up one or more.';

const goodHighSchool = 'In 1665, the English scientist Robert Hooke used a compound microscope to look at dried cork structures, coining the term "cells" because they looked like small rooms in a monastery.';

const badValidation = validateReadingLevelOutput(sourcePara, badHighSchool, {
    protectedTerms: extractReadingLevelProtectedTerms(sourcePara),
    level: 'high-school'
});
assert(badValidation.ok === false, 'bad high-school sample should fail validation');

const listValidation = validateReadingLevelOutput(
    'All living organisms consist of one or more cells.',
    badList,
    { isListItem: true, protectedTerms: ['cells'], level: 'high-school' }
);
assert(listValidation.ok === false, 'broken list item should fail validation');

const goodValidation = validateReadingLevelOutput(sourcePara, goodHighSchool, {
    protectedTerms: extractReadingLevelProtectedTerms(sourcePara),
    level: 'high-school'
});
assert(goodValidation.ok === true, `good sample should pass: ${goodValidation.reasons.join(', ')}`);

assert(getReadingLevelWordCountBounds('elementary').max === 1.20, 'elementary max bound tight');
assert(getReadingLevelWordCountBounds('high-school').max === 1.20, 'high-school max bound tight');
assert(getReadingLevelWordCountBounds('high-school', { length: 'balanced' }).max === 1.35, 'high-school balanced max');
assert(getReadingLevelWordCountBounds('high-school', { length: 'roomy' }).max === 1.50, 'high-school roomy max');
assert(getReadingLevelWordCountBounds('high-school', { termHelp: 'visual', length: 'balanced' }).max === 1.60, 'visual balanced max bump');
assert(getReadingLevelWordCountBounds('high-school', { termHelp: 'visual', length: 'tight' }).max === 1.35, 'visual tight max bump');
assert(getReadingLevelWordCountBounds('undergraduate').min === 0.85, 'undergraduate min bound');

assert(getReadingLevelTemperature({ tone: 'textbook' }) === 0.2, 'textbook temperature');
assert(getReadingLevelTemperature({ tone: 'friendly' }) === 0.5, 'friendly temperature');
assert(getReadingLevelTemperature({ tone: 'playful' }) === 0.65, 'playful temperature');

const visualRules = getReadingLevelEngagementRules({ termHelp: 'visual', tone: 'textbook', length: 'balanced' }, 'high-school');
assert(/coherent metaphor|Vivid Analogies/i.test(visualRules), 'visual rules mention sustained metaphor');
assert(/MEMORY HOOKS/i.test(visualRules), 'visual rules mention memory hooks');
assert(/Do not jump themes mid-paragraph/i.test(visualRules), 'visual rules ban mixed themes');
assert(/science first|RHYTHM/i.test(visualRules), 'visual rules mention science-first rhythm');
assert(/OPENER VARIETY|command openers/i.test(visualRules), 'visual rules ban command openers');
assert(/GOOD pattern/i.test(visualRules), 'visual rules include gold example');
assert(/GOLD STANDARD EXAMPLE/i.test(visualRules), 'visual rules include full few-shot exemplar');
assert(/BOLD STUDY TERMS/i.test(visualRules), 'visual rules require bold study terms');
assert(/20% of paragraphs/i.test(visualRules), 'visual rules include opener quota');
assert(!/prefer openers like "Think of/i.test(visualRules), 'visual rules do not prefer Imagine openers');

const goldFewShot = getReadingLevelVisualGoldFewShot();
assert(/security fortress/i.test(goldFewShot), 'few-shot uses fortress theme');
assert(/\*\*P\*\*rotective/i.test(goldFewShot), 'few-shot includes acronym mnemonic format');

const friendlyRules = getFriendlyToneRules();
assert(!/Imagine if/i.test(friendlyRules), 'friendly rules do not encourage Imagine openers');

const playfulRules = getPlayfulToneRules();
assert(/memorable or witty phrase/i.test(playfulRules), 'playful rules require memorable touches');
assert(/stand-up jokes/i.test(playfulRules), 'playful rules distinguish humor from jokes');
assert(/dry, understated wit/i.test(playfulRules), 'playful rules include dry wit');
assert(/Great!|Exciting!|Let's explore/i.test(playfulRules), 'playful rules ban cheerleading');
assert(/failure-mode color/i.test(playfulRules), 'playful rules include failure-mode color');
assert(playfulRules !== friendlyRules, 'playful rules differ from friendly');

assert(normalizeReadingLevelStyleOptions({ length: 'expansive' }, 'high-school').length === 'roomy', 'legacy expansive maps to roomy');
assert(getReadingLevelWordCountBounds('high-school', { termHelp: 'visual', length: 'roomy' }).max === 1.75, 'visual roomy max bump');

assert(!/include the domains/i.test(getReadingLevelVisualGoldFewShot()), 'gold few-shot no longer uses include the domains');
assert(/Prokaryotes include \*\*Bacteria\*\*/i.test(getReadingLevelVisualGoldFewShot()), 'gold few-shot uses simplified domain phrasing');

const frictionSource = 'Prokaryotes include the domains Bacteria and Archaea and are characterized by the absence of a membrane-bound nucleus.';
const frictionCandidates = extractReadingLevelFrictionPhraseCandidates(frictionSource);
assert(frictionCandidates.includes('include the domains'), 'friction heuristic detects include the domains');
assert(frictionCandidates.includes('membrane-bound'), 'friction heuristic detects membrane-bound');
assert(readingLevelHasStackedFrictionPhrases('Prokaryotes include the domains Bacteria and Archaea.') === true, 'stacked friction: include the domains');
assert(readingLevelHasStackedFrictionPhrases('Cells lack a membrane-bound nucleus and membrane-bound organelles.') === true, 'stacked friction: repeated membrane-bound');
assert(/membrane-bound/i.test(getReadingLevelFrictionPhraseRules()), 'friction rules mention membrane-bound unpacking');

const frictionValidation = validateReadingLevelOutput(
    frictionSource,
    'Prokaryotes include the domains Bacteria and Archaea in every textbook chapter.',
    { level: 'high-school', protectedTerms: [] }
);
assert(frictionValidation.reasons.includes('stacked friction phrasing'), 'stacked friction phrasing fails validation');

const cellTheoryTenet = 'The cell is the fundamental unit of structure, function, and organization in all organisms.';
const bloatedTenet = 'The cell is the fundamental unit of structure, function, and organization in all organisms. You can picture it as the basic building block, much like a Foundation Brick, forming the base of life. Just as bricks support a building, cells provide the essential framework for living things. As units of function, cells perform necessary tasks to keep organisms alive, much like workers in a factory handle specific jobs to keep production running smoothly. Lastly, cells contribute to the overall organization of an organism, ensuring all parts are arranged and coordinated effectively, similar to a well-organized team working together to achieve a common goal.';
const visualPlayfulRoomy = { termHelp: 'visual', tone: 'playful', length: 'roomy' };

assert(isReadingLevelTheoryListItem(cellTheoryTenet, true) === true, 'cell theory tenet is theory list item');
assert(isReadingLevelTheoryListItem('**Nucleus:** stores DNA', true) === false, 'glossary item is not theory list item');
assert(isReadingLevelTheoryListItem(cellTheoryTenet, false) === false, 'paragraph is not theory list item');

const theoryEngagement = getReadingLevelTheoryListEngagementRules(visualPlayfulRoomy);
assert(/ONE sentence only/i.test(theoryEngagement), 'theory engagement requires one sentence');
assert(!/GOLD STANDARD EXAMPLE/i.test(theoryEngagement), 'theory engagement excludes gold few-shot');
assert(/Do NOT unpack/i.test(theoryEngagement), 'theory engagement bans unpacking enumerated ideas');

const theorySystemPrompt = getReadingLevelSimplifySystemPrompt({ isTheoryListItem: true, level: 'high-school', styleOptions: visualPlayfulRoomy });
assert(!/GOLD STANDARD EXAMPLE/i.test(theorySystemPrompt), 'theory system prompt excludes gold few-shot');
assert(/principle\/theory bullet/i.test(theorySystemPrompt), 'theory system prompt labels bullet type');

assert(getReadingLevelValidationBounds('high-school', visualPlayfulRoomy, { isTheoryListItem: true }).max === 1.30, 'theory list max length cap');

const bloatedTenetValidation = validateReadingLevelOutput(cellTheoryTenet, bloatedTenet, {
    level: 'high-school',
    isListItem: true,
    styleOptions: visualPlayfulRoomy,
    protectedTerms: extractReadingLevelProtectedTerms(cellTheoryTenet)
});
assert(bloatedTenetValidation.reasons.includes('too long'), `bloated tenet fails too long: ${bloatedTenetValidation.reasons.join(', ')}`);
assert(bloatedTenetValidation.reasons.includes('theory list item too many sentences'), 'bloated tenet fails sentence count');

const goodTenet = 'The cell is the basic unit of structure, function, and organization in all organisms.';
const goodTenetValidation = validateReadingLevelOutput(cellTheoryTenet, goodTenet, {
    level: 'high-school',
    isListItem: true,
    styleOptions: visualPlayfulRoomy,
    protectedTerms: extractReadingLevelProtectedTerms(cellTheoryTenet)
});
assert(goodTenetValidation.ok === true, `compact tenet should pass: ${goodTenetValidation.reasons.join(', ')}`);

assert(readingLevelCountSentences('One claim. Another claim. A third claim.') === 3, 'sentence counter');

assert(readingLevelHasParagraphVisualMetaphor(
    'Every cell is defined by its plasma membrane, which you can picture as a busy city border. Proteins act as security gates.'
) === true, 'embedded visual metaphor detected without Imagine');

assert(detectReadingLevelParagraphOpenerStyle('Imagine the plasma membrane like a border.') === 'command', 'command opener detected');
assert(detectReadingLevelParagraphOpenerStyle('Every cell is defined by its plasma membrane.') === 'factual', 'factual opener detected');
assert(detectReadingLevelParagraphOpenerStyle('The membrane functions exactly like a city border.') === 'embedded', 'embedded opener detected');

const rotationPrompt = buildReadingLevelUserPrompt(
    getReadingLevelPromptForLevel('high-school', { sourceText: 'test', styleOptions: { termHelp: 'visual', tone: 'textbook', length: 'balanced' } }),
    'Source text here.',
    [],
    ['plasma membrane'],
    { termHelp: 'visual', tone: 'textbook', length: 'balanced' },
    { priorOpenerStyle: 'command' }
);
assert(/Previous paragraph used a command opener/i.test(rotationPrompt), 'rotation hint appended when prior opener was command');

const repeatedOpenerValidation = validateReadingLevelOutput(
    'The plasma membrane defines every cell and separates interior from exterior environment with selective permeability.',
    'Imagine the plasma membrane like a busy city border with gates and checkpoints throughout.',
    { level: 'high-school', styleOptions: { termHelp: 'visual', tone: 'textbook', length: 'balanced' }, priorOpenerStyle: 'command' }
);
assert(repeatedOpenerValidation.reasons.includes('repeated command opener'), 'repeated command opener fails validation');

assert(hasPictureWordPictureForTerm('The wall contains peptidoglycan, like a rigid mesh jacket.', 'peptidoglycan') === true, 'picture word-picture detected');

assert(hasVisualMetaphorForTerm(
    'The cell wall contains peptidoglycan (a sugar-protein complex).',
    'peptidoglycan',
    'The cell wall contains peptidoglycan.'
) === false, 'dry parenthetical fails visual metaphor check');

assert(hasVisualMetaphorForTerm(
    'Think of the cell wall as armor where peptidoglycan forms a rigid mesh jacket.',
    'peptidoglycan',
    'The cell wall contains peptidoglycan.'
) === true, 'visual studio metaphor detected');

assert(hasVisualMetaphorForTerm(
    'The peptidoglycan cell wall (think PG wall) acts as a brick fence in the fortress envelope.',
    'peptidoglycan',
    'The cell wall contains peptidoglycan.'
) === true, 'visual memory hook detected');

assert(hasVisualMetaphorForTerm(
    'The **peptidoglycan cell wall** *(think: **P**rotective **G**rid)* acts as a brick fence in the fortress envelope.',
    'peptidoglycan',
    'The cell wall contains peptidoglycan.'
) === true, 'acronym mnemonic hook detected');

assert(readingLevelTermAppearsBold('The **peptidoglycan cell wall** is rigid.', 'peptidoglycan') === true, 'bold study term detected');
assert(readingLevelTermAppearsBold('The peptidoglycan cell wall is rigid.', 'peptidoglycan') === false, 'unbolded study term fails');

const boldValidation = validateReadingLevelOutput(
    'The cell wall contains peptidoglycan and plasmids carry extra DNA.',
    'The cell wall contains peptidoglycan and plasmids carry extra DNA.',
    { level: 'high-school', styleOptions: { termHelp: 'visual', tone: 'textbook', length: 'balanced' }, clarifierTerms: ['peptidoglycan'] }
);
assert(boldValidation.reasons.some(r => r.includes('missing bold on study term')), 'missing bold fails validation');

const standardVisualOpts = { termHelp: 'visual', tone: 'textbook', length: 'balanced' };
assert(readingLevelWouldExceedCommandOpenerQuota({ command: 1, total: 4 }) === true, 'standard visual quota exceeded at 2/5');
assert(readingLevelWouldExceedCommandOpenerQuota({ command: 0, total: 3 }) === false, 'quota not enforced for small samples');

const quotaPrompt = buildReadingLevelUserPrompt(
    getReadingLevelPromptForLevel('high-school', { sourceText: 'test', styleOptions: { termHelp: 'visual', tone: 'textbook', length: 'balanced' } }),
    'Source text here.',
    [],
    ['plasmid'],
    { termHelp: 'visual', tone: 'textbook', length: 'balanced' },
    { openerStats: { command: 1, total: 4 } }
);
assert(/Chapter opener note/i.test(quotaPrompt), 'quota hint appended when command ratio high');

const quotaValidation = validateReadingLevelOutput(
    'Prokaryotes lack a nucleus and store DNA in the nucleoid region with plasmids nearby.',
    'Imagine prokaryotes as tiny rooms without walls where DNA floats freely in the nucleoid.',
    { level: 'high-school', styleOptions: standardVisualOpts, openerStats: { command: 1, total: 4 } }
);
assert(quotaValidation.reasons.includes('command opener quota exceeded'), 'command opener quota fails validation');

assert(readingLevelHasMixedVisualThemes(
    'The nucleoid is like an office desk, plasmids are flash drives, the wall is brick, the capsule is a ninja, and ribosomes are factory workers.'
) === true, 'mixed metaphor themes detected');

const mixedThemeValidation = validateReadingLevelOutput(
    'Prokaryotes, including bacteria and archaea, lack a membrane-bound nucleus. Their genetic material sits in the nucleoid region. They often carry extra DNA in plasmids. The envelope includes a plasma membrane, peptidoglycan cell wall, and sometimes a polysaccharide capsule. Ribosomes are 70S and scattered in the cytoplasm.',
    'The nucleoid is like an office desk, plasmids are flash drives, the peptidoglycan wall is brick, the capsule is a ninja, and ribosomes are factory workers scattered everywhere.',
    { level: 'high-school', styleOptions: { termHelp: 'visual', tone: 'playful', length: 'balanced' }, clarifierTerms: ['peptidoglycan', 'plasmid'] }
);
assert(mixedThemeValidation.reasons.includes('mixed metaphor themes'), `mixed metaphor themes fail validation: ${mixedThemeValidation.reasons.join(', ')}`);

const clampedUndergrad = normalizeReadingLevelStyleOptions({ termHelp: 'picture', tone: 'playful', length: 'roomy' }, 'undergraduate');
assert(clampedUndergrad.termHelp === 'visual', 'undergraduate clamps picture to visual');
assert(clampedUndergrad.tone === 'friendly', 'undergraduate clamps playful to friendly');

const shortValidation = validateReadingLevelOutput(
    sourcePara,
    'In 1665, Robert Hooke saw cork cells.',
    { level: 'high-school', protectedTerms: [] }
);
assert(shortValidation.reasons.includes('too short'), 'much shorter text should fail too short');

const longValidation = validateReadingLevelOutput(
    sourcePara,
    sourcePara + ' ' + sourcePara + ' ' + sourcePara,
    { level: 'high-school', protectedTerms: extractReadingLevelProtectedTerms(sourcePara) }
);
assert(longValidation.reasons.includes('too long'), '3x length should fail too long for high-school');

sandbox.appState.gradeLevel = 'Class 11-12';
assert(getReadingLevelTargetForGrade() === 'advanced-high-school', 'Class 11-12 maps to advanced-high-school');
sandbox.appState.gradeLevel = 'Undergrad Advanced';
assert(getReadingLevelTargetForGrade() === 'undergraduate', 'Undergrad Advanced maps to undergraduate');
sandbox.appState.gradeLevel = 'Undergrad Intro';
assert(getReadingLevelTargetForGrade() === 'undergraduate', 'Undergrad Intro maps to undergraduate');
assert(getReadingLevelTargetLabel('advanced-high-school').includes('AP'), 'advanced-high-school label');

assert(isReadingLevelGlossaryListItem('**Nucleus:** stores DNA') === true, 'glossary list detected');
assert(isReadingLevelGlossaryListItem('All living organisms consist of one or more cells.') === false, 'theory list not glossary');

const artifactValidation = validateReadingLevelOutput(
    'A cell needs structure and function.',
    'A cell needs dofunction** structure and the it needs energy.',
    { protectedTerms: [] }
);
assert(artifactValidation.ok === false, 'emphasis and pronoun artifacts should fail validation');

const splitPartial = splitReadingLevelMarkdownBlocks('# Title\n\nFirst paragraph still streaming', false);
assert(splitPartial.complete === '# Title', 'split should defer incomplete trailing block');
assert(splitPartial.pending.includes('First paragraph'), 'split should keep pending fragment');

const splitFinal = splitReadingLevelMarkdownBlocks('# Title\n\nDone paragraph.', true);
assert(splitFinal.complete.includes('Done paragraph'), 'split final should include all blocks');

assert(countReadingLevelPreserveMarkers('<!-- PRESERVE_BLOCK_0 -->\n\nText') === 1, 'preserve marker count');
assert(countMarkdownHeadingsByLevel('# H1\n\n## H2\n\nText').h1 === 1, 'heading count h1');
assert(countMarkdownHeadingsByLevel('# H1\n\n## H2\n\nText').h2 === 1, 'heading count h2');

const originalChapter = `# 2.1 Cytology

Cells form the basis of all living things and this paragraph has enough words to validate properly here.

<!-- PRESERVE_BLOCK_0 -->

Scientists study cells carefully and this paragraph has enough words to validate properly here.`;

const badChapter = `# 2.1 Cytology

Cells form the dofunction** basis and the it needs energy in this broken paragraph here.

Scientists study cells carefully and this paragraph has enough words to validate properly here.`;

const chapterValidation = validateReadingLevelChapterOutput(originalChapter, badChapter, { originalChildCount: 3 });
assert(chapterValidation.ok === false, `bad chapter should fail validation: ${chapterValidation.reasons.join('; ')}`);
assert(chapterValidation.reasons.some(r => r.includes('preserve marker')), 'bad chapter should fail preserve marker check');

const badProseChapter = `# 2.1 Cytology

Cells form the dofunction** basis and the it needs energy in this broken paragraph here.

<!-- PRESERVE_BLOCK_0 -->

Scientists study cells carefully and this paragraph has enough words to validate properly here.`;

const badProseValidation = validateReadingLevelOutput(
    'Cells form the basis of all living things and this paragraph has enough words to validate properly here.',
    'Cells form the dofunction** basis and the it needs energy in this broken paragraph here.',
    { protectedTerms: extractReadingLevelProtectedTerms('Cells form the basis of all living things and this paragraph has enough words to validate properly here.') }
);
assert(badProseValidation.ok === false, 'bad prose in chapter should fail block validation');

const goodChapter = `# 2.1 Cytology

Cells form the basis of all living things and this paragraph has enough words to validate properly here.

<!-- PRESERVE_BLOCK_0 -->

Scientists study cells carefully and this paragraph has enough words to validate properly here.`;

const goodChapterValidation = validateReadingLevelChapterOutput(originalChapter, goodChapter, { originalChildCount: 3, level: 'high-school' });
assert(goodChapterValidation.ok === true, `good chapter should pass: ${goodChapterValidation.reasons.join('; ')}`);

const prokaryoteSource = 'Prokaryotic cells lack a membrane-bound nucleus. Instead, their DNA is concentrated in a region called the nucleoid. Many prokaryotes also contain small, extrachromosomal DNA molecules called plasmids. The cell wall of most bacteria contains peptidoglycan. Some bacteria are engulfed by host cells through phagocytosis.';

const paraphraseOnly = 'Prokaryotic cells lack a membrane-bound nucleus. Instead, their DNA is concentrated in a region known as the nucleoid. Many prokaryotes also contain small, extrachromosomal DNA molecules known as plasmids. The cell wall of most bacteria contains peptidoglycan. Some bacteria are engulfed by host cells through phagocytosis.';

const clarifierTerms = ['nucleoid', 'plasmid', 'peptidoglycan', 'phagocytosis'];

const paraphraseValidation = validateReadingLevelOutput(prokaryoteSource, paraphraseOnly, {
    level: 'high-school',
    protectedTerms: extractReadingLevelProtectedTerms(prokaryoteSource),
    clarifierTerms
});
assert(paraphraseValidation.ok === false, 'paraphrase-only HS output without clarifiers should fail');
assert(
    paraphraseValidation.reasons.some(r => r.includes('missing clarifier') || r.includes('insufficient clarity change')),
    `paraphrase-only should fail clarifier checks: ${paraphraseValidation.reasons.join(', ')}`
);

const appositiveOutput = 'Prokaryotic cells lack a membrane-bound nucleus. Instead, their DNA is concentrated in the nucleoid, an irregular DNA region without a membrane. Many prokaryotes also contain small, extrachromosomal DNA molecules called plasmids, tiny rings of extra DNA. The cell wall of most bacteria contains peptidoglycan, a rigid mesh-like layer.';

const appositiveValidation = validateReadingLevelOutput(prokaryoteSource, appositiveOutput, {
    level: 'high-school',
    protectedTerms: [],
    clarifierTerms: ['nucleoid', 'plasmid', 'peptidoglycan']
});
assert(appositiveValidation.ok === true, `appositive clarifiers should pass: ${appositiveValidation.reasons.join(', ')}`);

const plainGlossOutput = 'Prokaryotic cells lack a membrane-bound nucleus. Instead, their DNA is concentrated in a region called the nucleoid. Many prokaryotes also contain small, extrachromosomal DNA molecules called plasmids. The cell wall of most bacteria contains peptidoglycan. Some bacteria are swallowed whole by host cells during infection.';

const plainGlossValidation = validateReadingLevelOutput(prokaryoteSource, plainGlossOutput, {
    level: 'high-school',
    protectedTerms: extractReadingLevelProtectedTerms(prokaryoteSource),
    clarifierTerms: ['phagocytosis']
});
assert(plainGlossValidation.ok === true, `plain gloss replacement should pass: ${plainGlossValidation.reasons.join(', ')}`);

const undergradParaphraseValidation = validateReadingLevelOutput(prokaryoteSource, prokaryoteSource, {
    level: 'undergraduate',
    protectedTerms: extractReadingLevelProtectedTerms(prokaryoteSource),
    clarifierTerms
});
assert(undergradParaphraseValidation.ok === true, `undergraduate should skip clarifier checks: ${undergradParaphraseValidation.reasons.join(', ')}`);

assert(readingLevelRequiresClarifiers('high-school') === true, 'high-school requires clarifiers');
assert(readingLevelRequiresClarifiers('undergraduate') === false, 'undergraduate skips clarifiers');

assert(hasInlineClarifierForTerm(
    'DNA is in the nucleoid, an irregular DNA region without a membrane.',
    'nucleoid',
    prokaryoteSource
) === true, 'appositive pattern B detected');

assert(hasInlineClarifierForTerm(
    'The cell wall contains peptidoglycan, like a rigid mesh jacket.',
    'peptidoglycan',
    prokaryoteSource,
    { termHelp: 'picture' }
) === true, 'picture inline simile detected');

assert(hasInlineClarifierForTerm(
    'Think of the cell wall as armor where peptidoglycan forms a rigid mesh jacket.',
    'peptidoglycan',
    prokaryoteSource,
    { termHelp: 'visual' }
) === true, 'visual metaphor mapping detected');

assert(hasInlineClarifierForTerm(
    'The cell has a coat like a sticky shell around it.',
    'capsule',
    'The capsule protects the cell.',
    { termHelp: 'picture' }
) === false, 'simile without term mention does not count');

assert(readingLevelIsParaphraseOnly(prokaryoteSource, paraphraseOnly, clarifierTerms, getDefaultReadingLevelStyleOptions()) === true, 'paraphrase-only detector');

const heuristicTerms = extractReadingLevelClarifierCandidatesHeuristic(prokaryoteSource, 'high-school');
assert(heuristicTerms.includes('nucleoid') || heuristicTerms.includes('plasmid'), `heuristic should seed key terms: ${heuristicTerms.join(', ')}`);

const friendlyLongSource = prokaryoteSource + ' ' + prokaryoteSource;
const friendlyFailValidation = validateReadingLevelOutput(friendlyLongSource, paraphraseOnly + ' ' + paraphraseOnly, {
    level: 'high-school',
    styleOptions: { termHelp: 'plain', tone: 'friendly', length: 'balanced' },
    protectedTerms: extractReadingLevelProtectedTerms(friendlyLongSource),
    clarifierTerms: ['nucleoid', 'plasmid', 'peptidoglycan', 'phagocytosis']
});
assert(
    friendlyFailValidation.reasons.some(r => r.includes('second person')),
    `friendly long passage should flag missing you/your: ${friendlyFailValidation.reasons.join(', ')}`
);

const originalWithFigure = `# 2.3 Cells

Intro paragraph with enough words to represent section content here.

<!-- PRESERVE_BLOCK_0 -->

Follow-up paragraph with enough words to represent section content here.`;

const simplifiedNoMarkers = `# 2.3 Cells

Intro paragraph simplified with enough words to represent section content here.

Follow-up paragraph simplified with enough words to represent section content here.`;

const mergedNoMarkers = mergeChapterMarkdownWithPreserveStructure(originalWithFigure, simplifiedNoMarkers);
assert(mergedNoMarkers.includes('<!-- PRESERVE_BLOCK_0 -->'), 'merge should restore missing marker');
const markerPos = mergedNoMarkers.indexOf('<!-- PRESERVE_BLOCK_0 -->');
const followPos = mergedNoMarkers.indexOf('Follow-up paragraph simplified');
assert(markerPos > 0 && markerPos < followPos, 'marker should stay between prose segments');

sandbox.beautifyState.chapterBlockTemplate = [
    { type: 'prose', markdown: '# 2.3 Cells' },
    { type: 'prose', markdown: 'Intro paragraph with enough words to represent section content here.' },
    { type: 'preserve', key: 'PRESERVE_BLOCK_0' },
    { type: 'prose', markdown: 'Follow-up paragraph with enough words to represent section content here.' }
];
const templateMerged = mergeChapterMarkdownWithPreserveStructure(originalWithFigure, simplifiedNoMarkers);
const templateMarkerPos = templateMerged.indexOf('<!-- PRESERVE_BLOCK_0 -->');
const templateIntroPos = templateMerged.indexOf('Intro paragraph simplified');
const templateFollowPos = templateMerged.indexOf('Follow-up paragraph simplified');
assert(templateMarkerPos > templateIntroPos && templateMarkerPos < templateFollowPos, 'template merge keeps figure between matched prose slots');
sandbox.beautifyState.chapterBlockTemplate = [];

const simplifiedMarkersAtEnd = `# 2.3 Cells

Intro paragraph simplified with enough words to represent section content here.

Follow-up paragraph simplified with enough words to represent section content here.

<!-- PRESERVE_BLOCK_0 -->`;

const mergedFromEnd = mergeChapterMarkdownWithPreserveStructure(originalWithFigure, simplifiedMarkersAtEnd);
const endMarkerPos = mergedFromEnd.indexOf('<!-- PRESERVE_BLOCK_0 -->');
assert(endMarkerPos > 0 && endMarkerPos < mergedFromEnd.indexOf('Follow-up paragraph simplified'), 'merge should move marker from end to original slot');

sandbox.beautifyState.preservedBlocks.set('PRESERVE_BLOCK_0', '<div data-test="figure">FIGURE</div>');
const renderedHtml = sandbox.polishedMarkdownToEditorHTML(mergedNoMarkers);
const figurePos = renderedHtml.indexOf('data-test="figure"');
const followHtmlPos = renderedHtml.indexOf('Follow-up paragraph simplified');
assert(figurePos > 0 && figurePos < followHtmlPos, 'rendered figure should appear before trailing prose, not at end');

const chapterWithBoundaryFigure = `# 2.2 Cell Theory

Cell theory paragraph with enough words to represent the earlier section properly here.

<!-- PRESERVE_BLOCK_0 -->

# 2.3 Types of Cells

Types of cells paragraph with enough words to represent the later section properly here.`;

const boundarySegments = splitMarkdownOnPreserveMarkers(chapterWithBoundaryFigure);
assert(boundarySegments.length === 3, 'boundary figure chapter should split into prose-marker-prose');
assert(boundarySegments[0].text.includes('# 2.2 Cell Theory'), 'first chunk keeps earlier section');
assert(boundarySegments[2].text.includes('# 2.3 Types of Cells'), 'second chunk keeps later section');

const simplifyCalls = [];
sandbox.simplifyFullChapterMarkdownViaAPI = async (markdown) => {
    simplifyCalls.push(markdown.trim());
    return markdown.replace('paragraph with enough words to represent', 'simplified paragraph with enough words to represent');
};
sandbox.sanitizeProposalMarkdown = (text) => text;

(async () => {
    const chunkedResult = await simplifyWholeChapterMarkdownByChunks(chapterWithBoundaryFigure, 'high-school', {});
    assert(simplifyCalls.length === 2, 'chunk simplifier should call API once per prose chunk around figure boundary');
    const chunkMarkerPos = chunkedResult.indexOf('<!-- PRESERVE_BLOCK_0 -->');
    const beforePos = chunkedResult.indexOf('# 2.2 Cell Theory');
    const afterPos = chunkedResult.indexOf('# 2.3 Types of Cells');
    assert(beforePos >= 0 && beforePos < chunkMarkerPos, 'earlier section should stay before figure marker after chunk simplify');
    assert(afterPos > chunkMarkerPos, 'later section should stay after figure marker after chunk simplify');

    console.log(`\nReading level tests: ${passed} passed, ${failed} failed`);
    process.exit(failed ? 1 : 0);
})().catch(err => {
    console.error(err);
    process.exit(1);
});
