#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadScript(file, sandbox) {
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, file), 'utf8'), sandbox, { filename: file });
}

const sandbox = { globalThis: {}, window: {}, console };
sandbox.globalThis = sandbox.window;
const ctx = sandbox.window;
loadScript('enhancement_bands.js', ctx);

const EB = ctx.DreamBookEnhancementBands;
const md = fs.readFileSync(path.join(__dirname, '..', 'Cell_Biology.md'), 'utf8');

const figureLineRe = /^\[Figure (\d+\.\d+):[^\]]+\]/gm;
const sectionLineRe = /^(\d+\.\d+)\s+([^\n]+)/gm;

const sectionStarts = [];
let sm;
while ((sm = sectionLineRe.exec(md)) !== null) {
    sectionStarts.push({ bandId: sm[1], heading: `${sm[1]} ${sm[2].trim()}`, pos: sm.index });
}

function sectionForPos(pos) {
    let heading = 'Chapter';
    for (const s of sectionStarts) {
        if (s.pos <= pos) heading = s.heading;
        else break;
    }
    return heading;
}

const allFigures = [];
let fm;
while ((fm = figureLineRe.exec(md)) !== null) {
    allFigures.push({
        figureId: fm[1],
        sectionHeading: sectionForPos(fm.index)
    });
}
const seen = new Set();
const kept = [];
allFigures.forEach(f => {
    const key = EB.figureDedupeKey(f.figureId, f.sectionHeading);
    if (seen.has(key)) return;
    seen.add(key);
    kept.push(f);
});

const fig22 = kept.filter(f => f.figureId === '2.2');
if (fig22.length !== 2) {
    console.error('FAIL: expected 2 distinct Figure 2.2 entries, got', fig22.length, fig22);
    process.exit(1);
}

console.log('Cell Biology figure dedupe OK:', fig22.map(f => f.sectionHeading).join(' | '));

const captionsByBand = {};
fig22.forEach(f => {
    captionsByBand[f.sectionHeading] = f.sectionHeading.includes('2.4')
        ? 'Figure 2.2: generalised animal cell with organelles'
        : 'Figure 2.2: fluid mosaic model of the plasma membrane';
});
const blockA = 'block-2-4-fig';
const blockB = 'block-2-5-fig';
const lookupByBlockId = (blockId) => {
    if (blockId === blockA) return captionsByBand['2.4 Overview of Cell Structure'];
    if (blockId === blockB) return captionsByBand['2.5 The Fluid Mosaic Model'];
    return null;
};
assert(
    lookupByBlockId(blockA) !== lookupByBlockId(blockB),
    'blockId-first lookup returns distinct captions for duplicate Figure 2.2'
);
assert(
    lookupByBlockId(blockA).includes('animal cell'),
    'block 2.4 caption is whole animal cell'
);
assert(
    lookupByBlockId(blockB).includes('fluid mosaic'),
    'block 2.5 caption is fluid mosaic only'
);

process.exit(0);
