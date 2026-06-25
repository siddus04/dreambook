/**
 * Section anchor / heading match tests (run: node section_anchor_test.js)
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
load('section_matching.js');

const SM = sandbox.DreamBookSectionMatching;
const EB = sandbox.DreamBookEnhancementBands;

let passed = 0;
let failed = 0;

function assert(cond, msg) {
    if (cond) { passed++; return; }
    failed++;
    console.error('FAIL:', msg);
}

const q213 = '2.13.1 Cellular Respiration (Mitochondria)';
const h271 = '2.7.1 Mitochondria';
const h2131 = '2.13.1 Cellular Respiration (Mitochondria)';
const h213 = '2.13 Energy Production: Cellular Respiration and Photosynthesis';

assert(SM.scoreHeadingMatch(q213, h271) !== 100, '2.13.1 query must not score 100 against 2.7.1 Mitochondria');
assert(SM.scoreHeadingMatch(q213, h2131) === 100, 'exact 2.13.1 heading scores 100');
assert(SM.sectionBandKeysCompatible(h213, h2131), '2.13 major and 2.13.1 share band key');
assert(SM.sectionBandKeysCompatible(q213, h271) === false, '2.13.1 and 2.7.1 band keys incompatible');
assert(SM.scoreHeadingMatch(h2131, h213) === 100, '2.13.1 query matches 2.13 parent heading via numeric prefix');

const morphText = 'Mitochondria are double-membraned organelles characterized by an outer membrane and a highly folded inner membrane forming cristae. '.repeat(2);
const respText = 'Mitochondria are fundamentally responsible for cellular respiration—the aerobic breakdown of organic molecules to produce ATP. '.repeat(2);
const photoText = 'In plant cells and certain protists, chloroplasts carry out photosynthesis—the conversion of light energy into chemical energy stored in glucose. '.repeat(2);

const collisionOutline = {
    sectionHeadings: [
        '2.7 Organelles and Their Structures',
        '2.7.1 Mitochondria',
        '2.13 Energy Production: Cellular Respiration and Photosynthesis',
        '2.13.1 Cellular Respiration (Mitochondria)',
        '2.13.2 Photosynthesis (Chloroplasts)'
    ],
    sections: [
        { heading: '2.7 Organelles and Their Structures', blocks: [{ blockId: 'b7intro', text: 'Within the aqueous matrix of the cytoplasm, eukaryotic cells possess specialized organelles. '.repeat(5), isHeading: false }] },
        { heading: '2.7.1 Mitochondria', blocks: [{ blockId: 'fm56', text: morphText, isHeading: false, sectionHeading: '2.7.1 Mitochondria' }] },
        { heading: '2.13 Energy Production: Cellular Respiration and Photosynthesis', blocks: [{ blockId: 'b13h', text: 'Energy production overview. '.repeat(5), isHeading: true }] },
        { heading: '2.13.1 Cellular Respiration (Mitochondria)', blocks: [{ blockId: 'b13resp', text: respText, isHeading: false, sectionHeading: '2.13.1 Cellular Respiration (Mitochondria)' }] },
        { heading: '2.13.2 Photosynthesis (Chloroplasts)', blocks: [{ blockId: 'b13photo', text: photoText, isHeading: false, sectionHeading: '2.13.2 Photosynthesis (Chloroplasts)' }] }
    ],
    blockIndex: {
        fm56: { blockId: 'fm56', sectionHeading: '2.7.1 Mitochondria' },
        b13resp: { blockId: 'b13resp', sectionHeading: '2.13.1 Cellular Respiration (Mitochondria)' },
        b13photo: { blockId: 'b13photo', sectionHeading: '2.13.2 Photosynthesis (Chloroplasts)' }
    }
};

const bands = EB.buildMajorSectionBands(collisionOutline, new Set());
const band13 = bands.find(b => b.bandId === '2.13');
const band7 = bands.find(b => b.bandId === '2.7');
assert(band13, 'band 2.13 exists');
assert(band7, 'band 2.7 exists');
assert(!band13.blocks.some(b => b.blockId === 'fm56'), 'band 2.13 must not include 2.7.1 fm56 block');
assert(band7.blocks.some(b => b.blockId === 'fm56'), 'band 2.7 includes fm56');

const pollutedBand13 = {
    bandId: '2.13',
    label: '2.13 Energy Production: Cellular Respiration and Photosynthesis',
    blocks: [
        { blockId: 'b13resp', text: respText, sectionHeading: '2.13.1 Cellular Respiration (Mitochondria)' },
        { blockId: 'fm56', text: morphText, sectionHeading: '2.7.1 Mitochondria' }
    ]
};
const menu = EB.buildBandCandidateMenu(pollutedBand13);
assert(!menu.some(c => c.blockId === 'fm56'), 'candidate menu must exclude cross-band fm56');
assert(menu.some(c => c.blockId === 'b13resp'), 'candidate menu keeps in-band b13resp');

assert(SM.blockIdInBand('fm56', '2.7', collisionOutline, EB), 'fm56 in band 2.7');
assert(!SM.blockIdInBand('fm56', '2.13', collisionOutline, EB), 'fm56 not in band 2.13');
assert(SM.blockIdInBand('b13photo', '2.13', collisionOutline, EB), 'b13photo in band 2.13');

console.log(`\nsection_anchor_test: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
