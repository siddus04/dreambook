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

loadScript('phet_catalog.js', ctx);
loadScript('enhancements.js', ctx);
loadScript('module_formats.js', ctx);
loadScript('scenario_registry.js', ctx);
loadScript('enhancement_bands.js', ctx);

const EB = ctx.DreamBookEnhancementBands;
const SR = ctx.DreamBookScenarioRegistry;
const MF = ctx.DreamBookModuleFormats;

function assert(cond, msg) {
    if (!cond) throw new Error(msg);
}

// weaponsCatalogText must not throw when catalog includes none: null
const weaponsText = EB.weaponsCatalogText();
assert(weaponsText.includes('socratic:'), 'weapons catalog includes socratic');
assert(!weaponsText.includes('none:'), 'weapons catalog excludes none entry');

// PhET allowlist tolerates null catalog entries
const origCatalog = { ...ctx.PHET_SIM_CATALOG };
ctx.PHET_SIM_CATALOG = { ...origCatalog, 'broken-null': null };
const band = {
    bandId: '2.12',
    label: 'Membrane transport',
    blocks: [{ text: 'osmosis diffusion membrane transport active transport '.repeat(8) }]
};
let threw = false;
try {
    EB.formatPhETAllowlistForBand(band);
} catch (e) {
    threw = true;
}
assert(!threw, 'formatPhETAllowlistForBand must not throw on null catalog meta');
ctx.PHET_SIM_CATALOG = origCatalog;

// buildAssignmentFromSlot returns null for invalid slot
assert(SR.buildAssignmentFromSlot(null, {}, []) === null, 'null slot returns null assignment');
assert(SR.buildAssignmentFromSlot({ id: 'x' }, {}, []) === null, 'slot without label returns null');

// assignBulkScenarioDomains must not throw on socratic proposals
const outlineMeta = {
    sections: [{
        heading: '2.11 Cell Junctions',
        blocks: [{ blockId: 'b11', text: 'Desmosomes gap junctions tight junctions ECM adhesion '.repeat(15), isHeading: false }]
    }],
    blockIndex: { b11: { blockId: 'b11', text: 'junction text ' } }
};
const bands = EB.buildMajorSectionBands(outlineMeta, new Set());
const { menuById } = EB.buildAllBandCandidateMenus(bands);
const diag = { '2.11': { band_id: '2.11', skip: false, core_concept: 'junctions', enhancement_opportunity: 'students confuse junction types' } };
const recs = [{
    band_id: '2.11',
    tier: 'major',
    non_m: {
        feature: 'socratic',
        format_id: 'mystery_clinic',
        candidate_id: 'B2_11-C1',
        title: 'Junction puzzle',
        rationale: 'Students often mix up desmosomes and gap junctions when explaining tissue adhesion and communication pathways.',
        necessity: 'recommended'
    },
    m_items: []
}];
let proposals = EB.proposalsFromBandRecommendations(recs, bands, menuById, outlineMeta, diag);
proposals = EB.finalizeBandProposals(proposals, bands, diag);
try {
    SR.assignBulkScenarioDomains(proposals, {});
} catch (e) {
    throw new Error('assignBulkScenarioDomains threw: ' + e.message);
}
assert(proposals.every(p => !p.scenarioAssignment || p.scenarioAssignment.label), 'assignments have labels when present');

// validateWidgetOutput must not throw when scenarioAssignment is null in retry path
const v = MF.validateWidgetOutput('mini-case-study', 'scenario_roleplay', 'content', 'word '.repeat(80), '', {
    scenarioAssignment: null
});
assert(v?.ok !== undefined, 'validateWidgetOutput handles null scenarioAssignment');

console.log('null_label_guard_test: all passed');
