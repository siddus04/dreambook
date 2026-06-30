/**
 * Figure hotspot helper smoke test (run: node figure_hotspot_test.js)
 * Tests helpers via inline copy — editor helpers are browser-only.
 */
'use strict';

const FIGURE_PIN_MAX = 6;
const FIGURE_PIN_LAYOUT_VERSION = 4;
const FIGURE_PIN_GUTTER = 4.5;
const FIGURE_PIN_LANE_MIN_GAP = 10;

function clampFigurePercent(value, min, max) {
    return Math.max(min, Math.min(max, Number(value) || 0));
}

function capFigureLessonParts(parts, max = FIGURE_PIN_MAX) {
    if (!Array.isArray(parts)) return [];
    return parts.slice(0, Math.max(1, max));
}

function extractStructuresFromCaption(caption) {
    const text = String(caption || '').trim();
    if (!text) return [];
    const triggers = [
        /\bshowing\s+(?:the\s+)?(.+?)(?:\.|\]|$)/i,
        /\bdetailing\s+(?:the\s+)?(.+?)(?:\.|\]|$)/i,
        /\billustrating\s+(?:the\s+)?(.+?)(?:\.|\]|$)/i,
        /\bdepicting\s+(?:the\s+)?(.+?)(?:\.|\]|$)/i
    ];
    let listText = '';
    for (const re of triggers) {
        const match = text.match(re);
        if (match?.[1]) {
            listText = match[1];
            break;
        }
    }
    if (!listText) return [];
    return listText
        .split(/\s*,\s*|\s+and\s+/i)
        .map(s => s.replace(/^the\s+/i, '').trim())
        .filter(s => s.length > 2 && s.length < 80);
}

function getFigureBbox(part) {
    const x = Number(part.x) || 0;
    const y = Number(part.y) || 0;
    const w = Number(part.w) || 18;
    const h = Number(part.h) || 14;
    return { x, y, w, h, right: x + w, bottom: y + h };
}

function assignFigurePinSide(anchorX, anchorY) {
    const dx = anchorX - 50;
    const dy = anchorY - 50;
    if (Math.abs(dx) >= Math.abs(dy)) return dx < 0 ? 'left' : 'right';
    return dy < 0 ? 'top' : 'bottom';
}

function spreadLaneAxisValues(items, axisKey, min, max) {
    if (!items.length) return;
    items.sort((a, b) => a[axisKey] - b[axisKey]);
    if (items.length === 1) {
        items[0][axisKey] = clampFigurePercent(items[0][axisKey], min, max);
        return;
    }
    const ideal = items.map(item => clampFigurePercent(item[axisKey], min, max));
    ideal[0] = Math.max(min, ideal[0]);
    for (let i = 1; i < ideal.length; i++) {
        ideal[i] = Math.max(ideal[i], ideal[i - 1] + FIGURE_PIN_LANE_MIN_GAP);
    }
    const overflow = ideal[ideal.length - 1] - max;
    if (overflow > 0) {
        for (let i = 0; i < ideal.length; i++) ideal[i] -= overflow;
    }
    for (let i = ideal.length - 2; i >= 0; i--) {
        if (ideal[i] > ideal[i + 1] - FIGURE_PIN_LANE_MIN_GAP) {
            ideal[i] = ideal[i + 1] - FIGURE_PIN_LANE_MIN_GAP;
        }
    }
    if (ideal[0] < min) {
        const shift = min - ideal[0];
        for (let i = 0; i < ideal.length; i++) ideal[i] += shift;
    }
    items.forEach((item, i) => {
        item[axisKey] = clampFigurePercent(ideal[i], min, max);
    });
}

function layoutFigurePinLanes(parts) {
    const entries = parts.map(part => {
        const bbox = getFigureBbox(part);
        const anchorX = clampFigurePercent(part.target?.x ?? (bbox.x + (bbox.w / 2)), 6, 94);
        const anchorY = clampFigurePercent(part.target?.y ?? (bbox.y + (bbox.h / 2)), 6, 94);
        const pinSide = assignFigurePinSide(anchorX, anchorY);
        return {
            part,
            anchorX,
            anchorY,
            pinSide,
            pinX: pinSide === 'left' ? FIGURE_PIN_GUTTER : (pinSide === 'right' ? (100 - FIGURE_PIN_GUTTER) : anchorX),
            pinY: pinSide === 'top' ? FIGURE_PIN_GUTTER : (pinSide === 'bottom' ? (100 - FIGURE_PIN_GUTTER) : anchorY)
        };
    });
    ['left', 'right', 'top', 'bottom'].forEach(side => {
        const lane = entries.filter(entry => entry.pinSide === side);
        if (!lane.length) return;
        if (side === 'left' || side === 'right') {
            spreadLaneAxisValues(lane, 'pinY', 8, 92);
            lane.forEach(entry => { entry.pinX = side === 'left' ? FIGURE_PIN_GUTTER : (100 - FIGURE_PIN_GUTTER); });
        } else {
            spreadLaneAxisValues(lane, 'pinX', 8, 92);
            lane.forEach(entry => { entry.pinY = side === 'top' ? FIGURE_PIN_GUTTER : (100 - FIGURE_PIN_GUTTER); });
        }
    });
    return entries;
}

function buildElbowCalloutPoints(pinX, pinY, anchorX, anchorY, pinSide) {
    if (pinSide === 'left' || pinSide === 'right') {
        const elbowX = pinX + ((anchorX - pinX) * 0.72);
        return [[pinX, pinY], [elbowX, pinY], [anchorX, anchorY]];
    }
    const elbowY = pinY + ((anchorY - pinY) * 0.72);
    return [[pinX, pinY], [pinX, elbowY], [anchorX, anchorY]];
}

function buildFigurePinLessonData(parts) {
    if (!Array.isArray(parts) || !parts.length) return null;
    const layouts = layoutFigurePinLanes(capFigureLessonParts(parts));
    return {
        mode: 'figure_pin_lesson',
        hotspotVersion: FIGURE_PIN_LAYOUT_VERSION,
        parts: layouts.map(entry => ({
            ...entry.part,
            pin: { x: entry.pinX, y: entry.pinY },
            anchor: { x: entry.anchorX, y: entry.anchorY },
            pinSide: entry.pinSide,
            calloutPoints: buildElbowCalloutPoints(entry.pinX, entry.pinY, entry.anchorX, entry.anchorY, entry.pinSide)
        }))
    };
}

function normalizeFigureHotspotParts(raw) {
    const list = raw?.parts || raw?.hotspots || [];
    if (!Array.isArray(list)) return [];
    return list
        .filter(p => p && String(p.label || '').trim())
        .slice(0, FIGURE_PIN_MAX)
        .map((p, i) => ({
            id: String(p.id || p.label || `part_${i + 1}`).trim().replace(/\s+/g, '_').toLowerCase(),
            label: String(p.label).trim(),
            detail: String(p.detail || p.description || p.text || '').trim(),
            x: Math.max(0, Math.min(95, Number(p.x) || 0)),
            y: Math.max(0, Math.min(95, Number(p.y) || 0)),
            w: Math.max(8, Math.min(100, Number(p.w) || 18)),
            h: Math.max(8, Math.min(100, Number(p.h) || 14))
        }))
        .filter(p => p.detail.length >= 8);
}

let passed = 0;
let failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; return; }
    failed++;
    console.error('FAIL:', msg);
}

const parts = normalizeFigureHotspotParts({
    parts: [
        { label: 'Stage', detail: 'Holds the slide for viewing.', x: 20, y: 50, w: 30, h: 10 },
        { label: 'X', detail: 'short' }
    ]
});
assert(parts.length === 1, 'filters short detail');

const animalCaption = 'Figure 2.1: generalized animal cell showing the plasma membrane, nucleus, cytoplasm, ribosomes, mitochondria, and endoplasmic reticulum';
assert(extractStructuresFromCaption(animalCaption).length >= 5, 'extracts caption structures');

const leftLaneParts = [
    { label: 'ER', detail: 'Internal membrane network.', x: 15, y: 15, w: 20, h: 25 },
    { label: 'Ribosomes', detail: 'Protein builders.', x: 12, y: 28, w: 12, h: 10 },
    { label: 'Cytoplasm', detail: 'Cell interior.', x: 20, y: 55, w: 25, h: 20 }
];
const leftLayouts = layoutFigurePinLanes(leftLaneParts).filter(l => l.pinSide === 'left');
leftLayouts.sort((a, b) => a.pinY - b.pinY);
assert(leftLayouts.length === 3, 'three left-lane pins');
assert(leftLayouts[0].pinX === FIGURE_PIN_GUTTER, 'left lane uses gutter x');
assert(leftLayouts[1].pinY - leftLayouts[0].pinY >= FIGURE_PIN_LANE_MIN_GAP - 0.01, 'left lane pins are spaced');

const lesson = buildFigurePinLessonData([
    { label: 'Mitochondria', detail: 'Energy converter organelle.', x: 55, y: 60, w: 18, h: 12 },
    { label: 'Nucleus', detail: 'Stores genetic material.', x: 42, y: 38, w: 20, h: 18 }
]);
assert(lesson.hotspotVersion === FIGURE_PIN_LAYOUT_VERSION, 'layout version 4');
assert(lesson.parts[0].calloutPoints?.length === 3, 'elbow callout has three points');

console.log(`\nFigure hotspot tests: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
