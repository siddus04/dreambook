/**
 * Band source passage extraction tests (run: node band_source_passage_test.js)
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
load('scenario_registry.js');

const EB = sandbox.DreamBookEnhancementBands;
const SR = sandbox.DreamBookScenarioRegistry;
let passed = 0;
let failed = 0;

function assert(cond, msg) {
    if (cond) { passed++; return; }
    failed++;
    console.error('FAIL:', msg);
}

const band23Text = `## 2.3 Types of Cells: Prokaryotic and Eukaryotic

A fundamental taxonomic division exists at the cellular level, categorizing all biological life into two primary cellular architectures: prokaryotic and eukaryotic.

### 2.3.1 Prokaryotic Cell Architecture

Prokaryotes lack a membrane-bound nucleus. Genetic material is in the nucleoid. Ribosomes in prokaryotes are 70S.

### 2.3.2 Eukaryotic Complexity

Eukaryotes possess a membrane-bound nucleus and membrane-bound organelles. Eukaryotic ribosomes are 80S and occur in the cytosol and rough endoplasmic reticulum.`;

const fullBand = SR.extractBandTeachingPassage(band23Text, 2800);
assert(fullBand.includes('nucleoid'), 'full band includes nucleoid from 2.3.1');
assert(fullBand.includes('70S'), 'full band includes 70S');
assert(fullBand.includes('80S'), 'full band includes 80S from 2.3.2');
assert(fullBand.includes('prokaryotic') && fullBand.includes('eukaryotic'), 'full band includes both architectures');

const legacyExcerpt = SR.extractTeachingExcerpt(band23Text, 900);
assert(legacyExcerpt.includes('fundamental taxonomic division'), 'legacy excerpt is intro paragraph');
assert(!legacyExcerpt.includes('nucleoid'), 'legacy excerpt skips later subsections');

assert(EB.WIDGET_SOURCE_PASSAGE_MODE === 'band_full', 'default mode is band_full');

const diag = {
    core_concept: 'Students must distinguish prokaryotic and eukaryotic cell architecture.',
    enhancement_opportunity: 'Compare and contrast the two cellular architectures across subsections.'
};
assert(EB.inferBandPromptProfile(diag, band23Text) === 'compare_contrast', '§2.3 band → compare_contrast profile');

const band25Text = `## 2.5 The Plasma Membrane and the Glycocalyx

The boundary of every eukaryotic and prokaryotic cell is delineated by the plasma membrane. This semi-permeable boundary is best described by the fluid mosaic model. Structurally, it is composed of an amphipathic phospholipid bilayer interspersed with integral membrane proteins, peripheral membrane proteins, cholesterol molecules (in animal cells), and complex carbohydrates.

The outer leaflet of the plasma membrane often features a glycocalyx—a carbohydrate-enriched coating that facilitates cell-cell recognition, adhesion, and protection against mechanical stress. Additionally, localized regions of the membrane, termed lipid rafts, concentrate sphingolipids and cholesterol to serve as highly organized platforms for signal transduction.`;

const band25Full = SR.extractBandTeachingPassage(band25Text, 2800);
assert(band25Full.includes('phospholipid bilayer'), '§2.5 full band includes intro paragraph');
assert(band25Full.includes('glycocalyx'), '§2.5 full band includes glycocalyx paragraph');
assert(band25Full.includes('lipid rafts'), '§2.5 full band includes lipid rafts');
assert(!SR.isCleanTeachingExcerpt(band25Full), 'multi-paragraph band fails single-paragraph clean check');
assert(SR.isUsableBandTeachingPassage(band25Full), 'multi-paragraph band passes usable band check');

const band25Legacy = SR.extractTeachingExcerpt(band25Text, 900);
assert(band25Legacy.includes('phospholipid bilayer'), 'legacy excerpt is first paragraph only');
assert(!band25Legacy.includes('glycocalyx'), 'legacy excerpt skips glycocalyx paragraph');

console.log(`band_source_passage_test: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
