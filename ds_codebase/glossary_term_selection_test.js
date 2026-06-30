'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const editorHtml = fs.readFileSync(path.join(__dirname, 'editor.html'), 'utf8');
const markerStart = 'function getJargonGradeBaselines(gradeLevel) {';
const markerEnd = 'async function openJargonModal(options = {}) {';
const start = editorHtml.indexOf(markerStart);
const end = editorHtml.indexOf(markerEnd);
if (start < 0 || end < 0) throw new Error('Could not locate jargon helper block in editor.html');

const sandbox = {
    console,
    String,
    Array,
    Object,
    RegExp,
    Math,
    JSON,
    appState: { gradeLevel: 'Class 9-10' },
    state: { apiKey: null },
    getGradeContext: () => 'Grade context.'
};

vm.runInNewContext(editorHtml.slice(start, end), sandbox, { filename: 'jargon_helpers.js' });

const {
    finalizeJargonTermsForGlossary,
    normalizeJargonConceptKey,
    isJargonTermAlreadyTaughtInPassage,
    getJargonGlossaryCap
} = sandbox;

let passed = 0;
let failed = 0;

function assert(cond, msg) {
    if (cond) {
        passed++;
        return;
    }
    failed++;
    console.error('FAIL:', msg);
}

const contrastPassage = `All biological life is divided into two main cellular types: prokaryotic and eukaryotic.
Prokaryotes, which include Bacteria and Archaea, do not have a membrane-bound nucleus or organelles.
Their genetic material is found in an irregularly shaped area called the nucleoid.
Prokaryotes often have extra DNA in plasmids.
Their cell envelope usually includes a plasma membrane, a rigid peptidoglycan cell wall, and sometimes an external polysaccharide capsule.
Prokaryotic ribosomes are 70S in type and are scattered throughout the cytoplasm.
Eukaryotes, which include protists, fungi, plants, and animals, show significant organizational complexity.
They have a defined, membrane-bound nucleus containing linear chromosomes and a cytoplasm divided by specialized organelles.`;

const candidates = [
    { term: 'prokaryotic', priority: 'high', definition: 'x' },
    { term: 'eukaryotic', priority: 'high', definition: 'x' },
    { term: 'nucleoid', priority: 'high', definition: 'x' },
    { term: 'plasmids', priority: 'medium', definition: 'x' },
    { term: 'plasma membrane', priority: 'medium', definition: 'x' },
    { term: 'organelles', priority: 'medium', definition: 'x' },
    { term: 'linear chromosomes', priority: 'medium', definition: 'x' },
    { term: 'cytoplasm', priority: 'medium', definition: 'x' },
    { term: 'peptidoglycan', priority: 'high', definition: 'x' },
    { term: 'ribosomes', priority: 'medium', definition: 'x' }
];

const selected = finalizeJargonTermsForGlossary(candidates, contrastPassage, { scope: 'chapter', cap: 10 })
    .map(item => item.term.toLowerCase());

assert(!selected.includes('prokaryotic'), 'contrast category term "prokaryotic" should be suppressed');
assert(!selected.includes('eukaryotic'), 'contrast category term "eukaryotic" should be suppressed');
assert(selected.includes('plasma membrane'), '"plasma membrane" should remain as a useful glossary candidate');
assert(selected.includes('organelles'), '"organelles" should remain as a useful glossary candidate');
assert(selected.includes('linear chromosomes'), '"linear chromosomes" should remain as a useful glossary candidate');
assert(selected.includes('cytoplasm'), '"cytoplasm" should remain as a useful glossary candidate');

assert(normalizeJargonConceptKey('Prokaryotes') === normalizeJargonConceptKey('prokaryotic'), 'prokaryote family should normalize to one concept key');
assert(normalizeJargonConceptKey('Ribosomes') === normalizeJargonConceptKey('ribosome'), 'plural glossary variants should normalize to one concept key');
assert(isJargonTermAlreadyTaughtInPassage('eukaryotic', contrastPassage) === true, 'paired contrast category should count as already taught in passage');

const framingEarlier = `# Introduction to Cytology
Cytology is the study of cells.

# Cell Theory
Cell theory explains that all living things are made of cells and that cells come from pre-existing cells.`;

const framingPassage = `Later in the chapter, ideas from cytology and cell theory provide background, but the plasma membrane is described as a selective boundary, and amphipathic phospholipids help form its bilayer.`;

const framingChapter = `${framingEarlier}\n\n# Plasma Membrane\n${framingPassage}`;
const framingHeadings = `Introduction to Cytology\nCell Theory\nPlasma Membrane`;

const framingCandidates = [
    { term: 'cytology', priority: 'high', definition: 'x' },
    { term: 'cell theory', priority: 'high', definition: 'x' },
    { term: 'plasma membrane', priority: 'medium', definition: 'x' },
    { term: 'amphipathic', priority: 'high', definition: 'x' }
];

const framingSelected = finalizeJargonTermsForGlossary(framingCandidates, framingPassage, {
    scope: 'section',
    cap: 10,
    chapterContextText: framingChapter,
    headingText: framingHeadings
})
    .map(item => item.term.toLowerCase());

assert(!framingSelected.includes('cytology'), '"cytology" should be treated as a chapter-framing term, not a priority glossary term');
assert(!framingSelected.includes('cell theory'), '"cell theory" should be treated as a chapter-framing term, not a priority glossary term');
assert(framingSelected.includes('plasma membrane'), '"plasma membrane" should survive framing-term suppression');
assert(framingSelected.includes('amphipathic'), '"amphipathic" should survive framing-term suppression');

const wholeChapterSelection = `${framingEarlier}\n\n${framingPassage}`;
const wholeChapterSelected = finalizeJargonTermsForGlossary(framingCandidates, wholeChapterSelection, {
    scope: 'chapter',
    cap: 10,
    chapterContextText: wholeChapterSelection,
    headingText: framingHeadings
}).map(item => item.term.toLowerCase());

assert(!wholeChapterSelected.includes('cytology'), '"cytology" should stay suppressed for full-chapter glossary generation');
assert(!wholeChapterSelected.includes('cell theory'), '"cell theory" should stay suppressed for full-chapter glossary generation');

assert(getJargonGlossaryCap('chapter', 3500) === 20, 'long chapter gets higher glossary cap');
assert(getJargonGlossaryCap('chapter', 500) === 10, 'short chapter keeps minimum glossary cap');

if (failed) {
    console.error(`\n${failed} glossary tests failed, ${passed} passed.`);
    process.exit(1);
}

console.log(`${passed} glossary tests passed.`);
