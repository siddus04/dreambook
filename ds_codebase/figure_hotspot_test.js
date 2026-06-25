/**
 * Figure hotspot helper smoke test (run: node figure_hotspot_test.js)
 * Tests normalizeFigureHotspotParts via inline copy — editor helpers are browser-only.
 */
'use strict';

function normalizeFigureHotspotParts(raw) {
    const list = raw?.parts || raw?.hotspots || [];
    if (!Array.isArray(list)) return [];
    return list
        .filter(p => p && String(p.label || '').trim())
        .slice(0, 10)
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
assert(parts[0].id === 'stage', 'id slug');
assert(parts[0].w === 30, 'preserves width');

console.log(`\nFigure hotspot tests: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
