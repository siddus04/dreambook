/**
 * Real-World Application (illustrate + news) tests (run: node real_world_application_test.js)
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

const ecmSource = `The extracellular matrix (ECM) is a meshwork of glycoproteins such as collagen and fibronectin.
Animal cells secrete these into the intercellular space. Integrins connect cells to the ECM.
Tight junctions, desmosomes, and gap junctions link neighboring cells in different tissues.`;

const goodStructured = `TITLE:
Tiny bubbles against cancer's stiff wall

STUDENT VIEW:
Researchers are testing ultrasound-activated bubbles to soften the stiff extracellular matrix around some tumors. When collagen packs the space between cells too tightly, it can block immune cells and medicines from reaching diseased tissue. Loosening that matrix barrier may help treatments penetrate deeper.

THINK ABOUT IT:
If the space around cells becomes too stiff or dense, how could that change what happens inside a tissue?

AUTHOR NOTE:
Concept illustrated: Extracellular matrix stiffness affects tissue permeability
Passage terms used: extracellular matrix, collagen, intercellular space
Not covered: tight junctions, desmosomes, gap junctions
Why this example was chosen: Shows ECM structure has real medical consequences
Verification status: unverified — confirm before publish`;

const badAbstract = `TITLE:
Ultrasound nanobubbles in oncology

STUDENT VIEW:
Researchers at a university demonstrated that ultrasound-activated nanobubbles can effectively soften the collagen-rich extracellular matrix surrounding tumors, facilitating enhanced penetration of therapeutic molecules.

THINK ABOUT IT:
What is science?

AUTHOR NOTE:
Concept illustrated: ECM
Passage terms used: ECM
Not covered:
Why this example was chosen: Research
Verification status: verified`;

const badMeta = `TITLE:
ECM news

STUDENT VIEW:
This connects to the textbook because the passage says the extracellular matrix includes collagen and fibronectin in the intercellular space.

THINK ABOUT IT:
What does the passage say?

AUTHOR NOTE:
Concept illustrated: ECM
Passage terms used: extracellular matrix, collagen
Not covered: tight junctions, desmosomes, gap junctions
Why this example was chosen: test
Verification status: unverified`;

const legacyPlain = `In 2024 WHO reported improvements in understanding collagen-rich extracellular matrix barriers around tumors and how softening them may help treatments reach diseased tissue.`;

// parseNewsApplicationContent
const parsed = MF.parseNewsApplicationContent(goodStructured);
assert(parsed.title.includes('bubbles'), 'parses TITLE');
assert(parsed.studentView.includes('extracellular matrix'), 'parses STUDENT VIEW');
assert(parsed.thinkAboutIt.includes('stiff'), 'parses THINK ABOUT IT');
assert(parsed.notCovered.includes('junctions'), 'parses not covered');
assert(parsed.structured, 'marks structured');

const legacyParsed = MF.parseNewsApplicationContent(legacyPlain);
assert(!legacyParsed.structured, 'legacy plain text not structured');
assert(legacyParsed.studentView.includes('collagen'), 'legacy maps body to studentView');

// validation — good ECM passes
const goodValid = MF.validateWidgetOutput('illustrate', 'news', 'content', goodStructured, '', {
    illustrateStyle: 'news',
    sourceText: ecmSource
});
assert(goodValid.ok, 'good ECM application validates');

// abstract tone fails
const abstractValid = MF.validateWidgetOutput('illustrate', 'news', 'content', badAbstract, '', {
    illustrateStyle: 'news',
    sourceText: ecmSource
});
assert(!abstractValid.ok, 'research abstract tone fails');

// meta-language fails
const metaValid = MF.validateWidgetOutput('illustrate', 'news', 'content', badMeta, '', {
    illustrateStyle: 'news',
    sourceText: ecmSource
});
assert(!metaValid.ok, 'meta-language fails');

// legacy plain text passes without required year in structured form
const legacyValid = MF.validateWidgetOutput('illustrate', 'news', 'content', legacyPlain, '', {
    illustrateStyle: 'news',
    sourceText: ecmSource
});
assert(legacyValid.ok, 'legacy plain news validates without structured fields');

// invented date when excerpt lacks year
const datedView = goodStructured.replace(
    'Researchers are testing',
    'In 2025 researchers are testing'
);
const dateValid = MF.validateWidgetOutput('illustrate', 'news', 'content', datedView, '', {
    illustrateStyle: 'news',
    sourceText: ecmSource,
    newsExcerpt: 'Researchers are testing ultrasound bubbles for tumor ECM (Source: Science Daily)'
});
assert(!dateValid.ok, 'invented date fails when not in excerpt');

// labels
assert(EN.ILLUSTRATE_STYLES.news.label === 'Real-World Application', 'label renamed');
assert(!SR.formatNeedsScenarioDomain('illustrate', 'news', 'news', null), 'news skips scenario domain');

console.log(`\nReal-World Application tests: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
