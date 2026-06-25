/**
 * Figure image aspect heuristics (run: node figure_image_aspect_test.js)
 * Mirrors logic in editor.html — keep in sync when changing infer/resolve helpers.
 */
'use strict';

const FIGURE_IMAGE_SIZES = {
    portrait: '1024x1536',
    landscape: '1536x1024',
    square: '1024x1024'
};

function normalizeAspectHint(raw) {
    const s = String(raw || '').trim().toLowerCase();
    if (!s) return null;
    if (s === 'portrait' || s === 'vertical' || s === 'tall') return 'portrait';
    if (s === 'landscape' || s === 'horizontal' || s === 'wide') return 'landscape';
    if (s === 'square' || s === '1:1') return 'square';
    return null;
}

function inferAspectHintFromCaption(caption) {
    const s = String(caption || '').toLowerCase();
    if (/comparativ|differences between|versus|\bvs\b|side.?by.?side|timeline|pathway diagram|process flow|left.*right|two types/.test(s)) {
        return 'landscape';
    }
    if (/microscope|equipment|apparatus|instrument|vertical|tall|stacked|early microscope|hooke|telescope|apparatus diagram/.test(s)) {
        return 'portrait';
    }
    if (/cross.?section|membrane|bilayer|layer diagram|single cell|organelle/.test(s)) {
        return 'portrait';
    }
    return 'square';
}

function resolveFigureImageSize(aspectHint, figureCaption) {
    const normalized = normalizeAspectHint(aspectHint);
    if (normalized && FIGURE_IMAGE_SIZES[normalized]) return FIGURE_IMAGE_SIZES[normalized];
    const inferred = inferAspectHintFromCaption(figureCaption);
    return FIGURE_IMAGE_SIZES[inferred] || FIGURE_IMAGE_SIZES.square;
}

let passed = 0;
let failed = 0;

function assert(cond, msg) {
    if (cond) { passed++; return; }
    failed++;
    console.error('FAIL:', msg);
}

assert(inferAspectHintFromCaption('Figure 2.1: Hooke early microscope') === 'portrait', '2.1 microscope → portrait');
assert(inferAspectHintFromCaption('Comparative line drawing illustrating differences between plant and animal cell') === 'landscape', '2.3 comparative → landscape');
assert(resolveFigureImageSize('landscape', 'Figure 2.3: x') === '1536x1024', 'landscape size');
assert(resolveFigureImageSize(null, 'Figure 2.1: Hooke early microscope') === '1024x1536', 'fallback portrait size');
assert(resolveFigureImageSize('invalid', 'generic diagram') === '1024x1024', 'unknown hint → square');
assert(normalizeAspectHint('vertical') === 'portrait', 'vertical alias');

console.log(`figure_image_aspect_test: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
