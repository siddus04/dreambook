/**
 * Everyday analogy (illustrate + analogy) tests (run: node analogy_illustration_test.js)
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
const SR = sandbox.DreamBookScenarioRegistry;
let passed = 0;
let failed = 0;

function assert(cond, msg) {
    if (cond) { passed++; return; }
    failed++;
    console.error('FAIL:', msg);
}

const sourceText = `The nucleus stores genetic information in chromatin. The nucleolus assembles ribosomal RNA (rRNA).
The cytoplasm includes cytosol where enzymes work. Ribosomes translate messenger RNA (mRNA) into polypeptide chains.`;

const factoryAnalogy = `ANALOGY TITLE:
A Cell Factory

THE ANALOGY:
Think of the cell as a factory. The nucleus is the secure control room where master instructions (DNA) are stored, surrounded by a wall with guarded gates (nuclear pores). The nucleolus is a workshop that builds parts for protein-making machines. The cytoplasm and cytosol form the factory floor where daily work happens. Ribosomes are assembly machines that read messenger RNA (mRNA) instructions to build protein chains.

CONCEPT MAPPING:
Nucleus → Control room → Stores genetic instructions securely
Nuclear pores → Guarded gates → Control what enters and leaves
Nucleolus → Workshop → Builds ribosome parts including rRNA
Cytoplasm/cytosol → Factory floor → Active space for metabolic work
Ribosomes → Assembly machines → Translate mRNA into proteins
mRNA → Messenger instructions → Carries protein-building code to ribosomes

WHERE THE ANALOGY BREAKS DOWN:
- A factory has fixed rooms; a cell is fluid and organelles move.
- Ribosomes are molecular machines, not literal workers.

ONE-LINE TAKEAWAY:
Information flows from the nucleus to ribosomes in the cytoplasm where mRNA guides protein assembly.`;

const badRrnaBlueprint = `ANALOGY TITLE:
Secure Room

THE ANALOGY:
The nucleus is a secure room. The nucleolus creates rRNA blueprints that ribosomes use to build proteins from the passage.

CONCEPT MAPPING:
Nucleus → Secure room → Stores DNA
Nucleolus → Desk → Creates rRNA blueprints for proteins
Ribosomes → Workers → Build protein chains
Cytoplasm → Rest of house → Where work happens

WHERE THE ANALOGY BREAKS DOWN:
- Cells are not houses.

ONE-LINE TAKEAWAY:
The nucleus controls the cell.`;

// parseAnalogyIllustrationContent
const parsed = MF.parseAnalogyIllustrationContent(factoryAnalogy);
assert(parsed.title.includes('Factory'), 'parse title');
assert(parsed.analogy.includes('nucleus'), 'parse analogy');
assert(parsed.mapping.includes('Nucleolus'), 'parse mapping');
assert(parsed.breaksDown.includes('fluid'), 'parse breaks down');
assert(parsed.takeaway.includes('mRNA'), 'parse takeaway');

// validation — good factory-style output
const good = MF.validateWidgetOutput('illustrate', 'analogy', 'content', factoryAnalogy, '', {
    illustrateStyle: 'analogy',
    sourceText
});
assert(good.ok, 'factory-style 2.6 analogy valid');

// validation — rRNA as protein blueprint fails when mRNA in source
const bad = MF.validateWidgetOutput('illustrate', 'analogy', 'content', badRrnaBlueprint, '', {
    illustrateStyle: 'analogy',
    sourceText
});
assert(!bad.ok, 'rRNA-as-blueprint fails when source mentions mRNA translation');

// validation — missing structure fails
const incomplete = MF.validateWidgetOutput('illustrate', 'analogy', 'content', 'Think of a factory with a nucleus.', '', {
    illustrateStyle: 'analogy',
    sourceText
});
assert(!incomplete.ok, 'unstructured analogy fails');

// scenario registry — analogy skips bulk assignment
const analogyFinding = {
    findingId: 'a1',
    scanId: 'scan_illustrate',
    rationale: 'Use a factory analogy for nucleus and ribosomes.',
    payload: { illustrateStyle: 'analogy', formatId: 'analogy' }
};
SR.assignBulkScenarioDomains([analogyFinding]);
assert(!analogyFinding.scenarioAssignment, 'analogy gets no scenarioAssignment in bulk');
assert(!SR.formatNeedsScenarioDomain('illustrate', 'analogy', 'analogy', null), 'formatNeedsScenarioDomain false for analogy');

// variety block — dynamic domains, no SCENARIO (required)
const variety = MF.buildWidgetVarietyBlock({
    illustrateStyle: 'analogy',
    formatId: 'analogy',
    usedDomains: ['factory production floor'],
    usedHooks: []
});
assert(!variety.includes('SCENARIO (required)'), 'analogy variety has no scenario assignment');
assert(variety.includes('Choose an analogy domain'), 'analogy variety has dynamic instruction');
assert(variety.includes('Do NOT reuse these scenario settings'), 'analogy variety includes used domains');

// prompt includes structured markers
const prompt = MF.buildIllustrateUserPrompt('analogy', sourceText, {
    bookTitle: 'Bio',
    gradeLevel: 'Class 9-10',
    illustrateStyle: 'analogy',
    formatId: 'analogy',
    usedDomains: [],
    usedHooks: []
});
assert(prompt.includes('THE ANALOGY:'), 'prompt has THE ANALOGY marker');
assert(prompt.includes('CONCEPT MAPPING:'), 'prompt has CONCEPT MAPPING marker');
assert(!prompt.includes('SCENARIO (required)'), 'prompt has no scenario assignment');

// compare/contrast band validation
const compareSource = `Prokaryotes lack a membrane-bound nucleus and have 70S ribosomes in the nucleoid.
Eukaryotes have a membrane-bound nucleus, membrane-bound organelles, and 80S ribosomes.`;

const eukOnlyAnalogy = `ANALOGY TITLE:
School Cells

THE ANALOGY:
A eukaryotic cell is like a school with specialized rooms. The nucleus is the principal office. Organelles are classrooms.

CONCEPT MAPPING:
Nucleus → Principal office → Stores decisions
Organelles → Classrooms → Specialized work areas
80S ribosomes → Workstations → Build proteins
Membrane-bound nucleus → Locked records room → Protects DNA

WHERE THE ANALOGY BREAKS DOWN:
- Schools are not cells.

ONE-LINE TAKEAWAY:
Eukaryotic cells use specialized organelles like rooms in a school.`;

const dualSideAnalogy = `ANALOGY TITLE:
Workshop vs Building

THE ANALOGY:
A prokaryotic cell is like a one-room workshop with DNA on an open instruction board (nucleoid) and 70S ribosomes as small workstations.
A eukaryotic cell is like a compartmentalized building with a membrane-bound nucleus and 80S ribosomes on dedicated production lines including the rough endoplasmic reticulum.

CONCEPT MAPPING:
Prokaryote → One-room workshop → No membrane-bound nucleus
Nucleoid → Open instruction board → DNA region without a membrane
70S ribosomes → Small workstations → Prokaryotic protein synthesis
Eukaryote → Compartmentalized building → Membrane-bound organelles
Membrane-bound nucleus → Records room → Houses linear chromosomes
80S ribosomes → Production line stations → Eukaryotic protein synthesis

WHERE THE ANALOGY BREAKS DOWN:
- Buildings do not divide like cells.

ONE-LINE TAKEAWAY:
Prokaryotes are open workspaces while eukaryotes use compartmentalized buildings.`;

const compareCtx = { illustrateStyle: 'analogy', sourceText: compareSource, bandPromptProfile: 'compare_contrast' };
const eukOnlyFail = MF.validateWidgetOutput('illustrate', 'analogy', 'content', eukOnlyAnalogy, '', compareCtx);
assert(!eukOnlyFail.ok, 'eukaryote-only analogy fails compare_contrast band');

const dualPass = MF.validateWidgetOutput('illustrate', 'analogy', 'content', dualSideAnalogy, '', compareCtx);
assert(dualPass.ok, 'dual-side prokaryote/eukaryote analogy passes compare_contrast band');

const compareVariety = MF.buildWidgetVarietyBlock({
    illustrateStyle: 'analogy',
    formatId: 'analogy',
    bandPromptProfile: 'compare_contrast',
    usedDomains: [],
    usedHooks: []
});
assert(compareVariety.includes('COMPARE/CONTRAST BAND'), 'compare variety block includes dual-side rule');

// author hint — mandatory domain directive in prompt
const cricketPrompt = MF.buildIllustrateUserPrompt('analogy', sourceText, {
    bookTitle: 'Bio',
    gradeLevel: 'Class 9-10',
    illustrateStyle: 'analogy',
    formatId: 'analogy',
    authorNote: 'cricket analogy',
    usedDomains: [],
    usedHooks: []
});
assert(cricketPrompt.includes('AUTHOR DOMAIN (MANDATORY)'), 'cricket hint adds mandatory domain directive');
assert(cricketPrompt.includes('cricket'), 'cricket hint names cricket in directive');
assert(!cricketPrompt.includes('vary settings across the chapter'), 'cricket hint omits generic vary-settings instruction');

const cricketVariety = MF.buildWidgetVarietyBlock({
    illustrateStyle: 'analogy',
    formatId: 'analogy',
    authorNote: 'cricket analogy',
    usedDomains: ['office open-plan'],
    usedHooks: []
});
assert(!cricketVariety.includes('Choose an analogy domain'), 'author-note variety skips domain picker');

// validation — office analogy fails when author requested cricket
const officeAnalogy = `ANALOGY TITLE:
Open-Plan Office

THE ANALOGY:
Think of the cell as an open-plan office. The nucleus is the executive suite behind glass walls. The nucleolus is the supply desk assembling ribosome parts. Ribosomes are workstations on the open floor where messenger RNA (mRNA) instructions are read to build proteins.

CONCEPT MAPPING:
Nucleus → Executive suite → Stores master plans
Nucleolus → Supply desk → Assembles ribosome parts including rRNA
Cytoplasm → Open floor → Workspace for daily activity
Ribosomes → Workstations → Translate mRNA into proteins
mRNA → Email instructions → Carries protein-building code

WHERE THE ANALOGY BREAKS DOWN:
- Offices do not divide like cells.

ONE-LINE TAKEAWAY:
Information flows from the nucleus to ribosomes where mRNA guides protein assembly.`;

const cricketCtx = { illustrateStyle: 'analogy', sourceText, authorNote: 'cricket analogy' };
const officeFail = MF.validateWidgetOutput('illustrate', 'analogy', 'content', officeAnalogy, '', cricketCtx);
assert(!officeFail.ok, 'office analogy fails when author requested cricket');

const cricketAnalogy = factoryAnalogy.replace(/factory/gi, 'cricket pitch').replace(/Factory/g, 'Cricket Pitch');
const cricketPass = MF.validateWidgetOutput('illustrate', 'analogy', 'content', cricketAnalogy, '', cricketCtx);
assert(cricketPass.ok, 'cricket-domain analogy passes when author requested cricket');

console.log(`\nAnalogy illustration tests: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
