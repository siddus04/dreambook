/**
 * Section heading match helpers — band-key-aware scoring for anchor resolution.
 */
(function (global) {
    'use strict';

    function extractSectionNumberPrefix(heading) {
        const m = String(heading || '').trim().match(/^(\d+(?:\.\d+)*)/);
        return m ? m[1] : null;
    }

    function getExtractBandKey() {
        return global.DreamBookEnhancementBands?.extractBandKey || null;
    }

    function sectionBandKeysCompatible(query, candidate) {
        const extractBandKey = getExtractBandKey();
        if (!extractBandKey) return true;
        const qPrefix = extractSectionNumberPrefix(query);
        const cPrefix = extractSectionNumberPrefix(candidate);
        if (!qPrefix || !cPrefix) return true;
        const qBand = extractBandKey(query);
        const cBand = extractBandKey(candidate);
        if (!qBand || !cBand) return true;
        return qBand === cBand;
    }

    function scoreHeadingMatch(text, heading) {
        const t = (text || '').toLowerCase();
        const h = (heading || '').toLowerCase();
        const numMatch = h.match(/^(\d+(?:\.\d+)*)/);
        if (numMatch) {
            const escaped = numMatch[1].replace(/\./g, '\\.');
            if (new RegExp(`\\b${escaped}\\b`).test(t)) return 100;
        }
        const titleOnly = h.replace(/^\d+(?:\.\d+)*\s*[-–—:.]?\s*/, '').trim();
        if (!titleOnly || !t.trim()) return 0;
        if (t.includes(titleOnly) || titleOnly.includes(t.trim())) {
            if (sectionBandKeysCompatible(text, heading)) return 100;
        }
        const titleWords = titleOnly.split(/\s+/).filter(w => w.length > 2);
        if (!titleWords.length) return 0;
        const matched = titleWords.filter(w => t.includes(w)).length;
        const ratio = matched / titleWords.length;
        return ratio * 70 + (matched >= 2 ? 30 : 0);
    }

    function blockIdInBand(blockId, bandId, outlineMeta, bandsApi) {
        if (!blockId || !bandId || !outlineMeta || !bandsApi?.buildMajorSectionBands) return false;
        const excludedSet = global.DreamBookEnhancements?.buildExcludedSectionSet
            ? global.DreamBookEnhancements.buildExcludedSectionSet(outlineMeta.sectionHeadings || [], [])
            : new Set();
        const bands = bandsApi.buildMajorSectionBands(outlineMeta, excludedSet);
        const band = bands.find(b => String(b.bandId) === String(bandId));
        if (!band) return false;
        if (band.blockIds?.has?.(blockId)) return true;
        return (band.blocks || []).some(b => b.blockId === blockId);
    }

    global.DreamBookSectionMatching = {
        extractSectionNumberPrefix,
        sectionBandKeysCompatible,
        scoreHeadingMatch,
        blockIdInBand
    };
})(typeof window !== 'undefined' ? window : globalThis);
