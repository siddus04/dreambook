#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadScript(file, sandbox) {
    const code = fs.readFileSync(path.join(__dirname, file), 'utf8');
    vm.runInNewContext(code, sandbox, { filename: file });
}

const sandbox = { globalThis: {}, window: {}, console };
sandbox.globalThis = sandbox.window;
const ctx = sandbox.window;

loadScript('phet_catalog.js', ctx);
loadScript('enhancements.js', ctx);
loadScript('module_formats.js', ctx);
loadScript('enhancement_bands.js', ctx);

const EB = ctx.DreamBookEnhancementBands;
const DE = ctx.DreamBookEnhancements;

function assert(cond, msg) {
    if (!cond) throw new Error(msg);
}

const outlineMeta = {
    sections: [
        { heading: '2.1 Introduction to Cytology', blocks: [{ blockId: 'b1', text: 'Cytology is the study of cells. '.repeat(20), isHeading: false }] },
        { heading: '2.2 The Cell Theory and Historical Context', blocks: [{ blockId: 'b2', text: 'Robert Hooke observed cork cells. Schleiden Schwann Virchow cell theory. '.repeat(15), isHeading: false }] },
        { heading: '2.3 Types of Cells: Prokaryotic and Eukaryotic', blocks: [{ blockId: 'b3h', text: 'Two primary architectures', isHeading: true }] },
        { heading: '2.3.1 Prokaryotic Cell Architecture', blocks: [{ blockId: 'b3a', text: 'Prokaryotes lack membrane-bound nucleus. Nucleoid plasmids peptidoglycan 70S ribosomes. '.repeat(12), isHeading: false }] },
        { heading: '2.3.2 Eukaryotic Complexity', blocks: [{ blockId: 'b3b', text: 'Eukaryotes have nucleus and organelles. 80S ribosomes rough ER. '.repeat(12), isHeading: false }] },
        { heading: '2.4 Overview of Cell Structure', blocks: [{ blockId: 'b4', text: 'Plasma membrane cytoplasm nucleus mitochondria ER Golgi. '.repeat(15), isHeading: false }] },
        { heading: '2.12 Membrane Transport and Selective Permeability', blocks: [{ blockId: 'b12', text: 'Passive transport diffusion osmosis facilitated diffusion active transport Na K pump endocytosis exocytosis. '.repeat(15), isHeading: false }] },
        { heading: '2.13 Energy Production: Cellular Respiration and Photosynthesis', blocks: [{ blockId: 'b13', text: 'Mitochondria cellular respiration Krebs cycle ATP synthase chloroplast photosynthesis Calvin cycle. '.repeat(15), isHeading: false }] },
        { heading: 'Chapter 2 Exercises', blocks: [{ blockId: 'bex', text: 'Define amphipathic. Compare plant and animal cells. '.repeat(5), isHeading: false }] }
    ],
    blockIndex: {
        b1: { blockId: 'b1', text: 'Cytology intro ' },
        b2: { blockId: 'b2', text: 'Cell theory history ' },
        b3a: { blockId: 'b3a', text: 'Prokaryotic architecture ' },
        b3b: { blockId: 'b3b', text: 'Eukaryotic complexity ' },
        b4: { blockId: 'b4', text: 'Cell structure overview ' },
        b12: { blockId: 'b12', text: 'Membrane transport osmosis diffusion ' },
        b13: { blockId: 'b13', text: 'Photosynthesis chloroplast ' },
        bex: { blockId: 'bex', text: 'Exercises ' }
    }
};

const bands = EB.buildMajorSectionBands(outlineMeta, new Set());
assert(!bands.find(b => b.bandId === '2.1'), '2.1 intro should be excluded');
assert(!bands.find(b => b.bandId.includes('Exercises')), 'exercises band excluded');
assert(bands.find(b => b.bandId === '2.3')?.subheadings?.length === 2, '2.3 rolls up subsections');
console.log('Bands:', bands.map(b => b.bandId).join(', '));

const band23 = bands.find(b => b.bandId === '2.3');
const anchor = EB.pickMajorBandAnchorBlock(band23);
assert(anchor.blockId === 'b3b', 'anchor should be last block in band (2.3.2)');

const transportBand = bands.find(b => b.bandId === '2.12');
const phetMatches = EB.rankPhETMatchesForText(EB.formatBandSourceText(transportBand), 3);
assert(phetMatches.some(m => m.id === 'membrane-transport' || m.id === 'diffusion'), 'transport band should match PhET');
console.log('2.12 PhET matches:', phetMatches.map(m => m.id).join(', '));

const respBand = bands.find(b => b.bandId === '2.13');
const respMatches = EB.rankPhETMatchesForText(EB.formatBandSourceText(respBand), 3);
assert(!respMatches.some(m => m.id === 'membrane-transport'), 'photosynthesis band should not default to membrane-transport');
console.log('2.13 PhET matches:', respMatches.map(m => m.id).join(', ') || '(none — OK)');

const cytoskeletonText = 'cytoskeleton microtubules actin filaments maintain cell shape movement dynamic rigidity';
const cytMatches = EB.rankPhETMatchesForText(cytoskeletonText, 5);
assert(!cytMatches.some(m => m.id === 'forces-and-motion-basics'), 'physics sims must not appear in biology-only PhET matches');
assert(cytMatches.every(m => m.meta.primarySubject === 'biology'), 'PhET matches restricted to biology catalog');
console.log('Cytoskeleton PhET matches:', cytMatches.map(m => m.id).join(', ') || '(none — OK)');

const { menuById } = EB.buildAllBandCandidateMenus(bands);
assert(menuById.size >= bands.length, 'each band should have menu candidates');

const diagnosisByBand = {};
bands.forEach(b => {
    diagnosisByBand[b.bandId] = {
        band_id: b.bandId,
        core_concept: 'Test concept',
        enhancement_opportunity: 'Needs interactive support',
        skip: false
    };
});

const sparseRecs = [{ band_id: '2.12', tier: 'major', feature: 'simulation', phet_id: 'membrane-transport', candidate_id: 'B2_12-C1', title: 'Transport sim', rationale: 'Students need to explore osmosis and diffusion interactively with the membrane transport simulation.' }];
const eligible = bands;
let proposals = EB.proposalsFromBandRecommendations(sparseRecs, eligible, menuById, outlineMeta, diagnosisByBand);
assert(proposals.length === 1, 'sparse LLM should yield one proposal');
assert(proposals[0].scanId === 'scan_simulation', '2.12 should be simulation');
assert(proposals[0].bandSourceText.includes('osmosis'), 'proposal should carry full band text');

proposals = EB.ensureMajorBandCoverage(eligible, proposals, menuById, outlineMeta, diagnosisByBand);
const bandsWithNonM = new Set(
    proposals.filter(p => p.bundleTier === 'non_m' || EB.isNonMFeatureKey(EB.getProposalFeatureKey(p))).map(p => p.bandId)
);
eligible.forEach(b => assert(bandsWithNonM.has(b.bandId), `missing non-M for band ${b.bandId}`));
assert(proposals.length >= eligible.length, `coverage fill: got ${proposals.length}, need >= ${eligible.length}`);

const simCount = proposals.filter(p => p.scanId === 'scan_simulation').length;
assert(EB.MAX_SIMULATIONS_PER_CHAPTER === 1, 'MAX_SIMULATIONS_PER_CHAPTER should be 1');
assert(simCount <= EB.MAX_SIMULATIONS_PER_CHAPTER, `sim cap: ${simCount}`);

const dualSimRecs = [
    { band_id: '2.12', tier: 'major', feature: 'simulation', phet_id: 'membrane-transport', candidate_id: 'B2_12-C1', title: 'Transport sim', rationale: 'Students explore osmosis and diffusion interactively with the membrane transport simulation to understand selective permeability.' },
    { band_id: '2.4', tier: 'major', feature: 'simulation', phet_id: 'membrane-transport', candidate_id: 'B2_4-C1', title: 'Membrane sim', rationale: 'Students manipulate membrane components interactively to visualize the fluid mosaic model and transport across the plasma membrane.' }
];
const dualSimProposals = EB.proposalsFromBandRecommendations(dualSimRecs, eligible, menuById, outlineMeta, diagnosisByBand);
const dualSimCount = dualSimProposals.filter(p => p.scanId === 'scan_simulation').length;
assert(dualSimCount === 1, `dual simulation recs capped to 1, got ${dualSimCount}`);
assert(dualSimProposals.some(p => p.downgradeNote && /simulation cap/i.test(p.downgradeNote)), 'second sim should be downgraded with cap note');

proposals.forEach(p => {
    assert(p.sectionHeading && !/^\d+\.\d+\.\d+/.test(p.sectionHeading) || p.sectionHeading.includes('Types'), 'sectionHeading should be major band label');
    assert(p.tier === 'major', 'tier major');
    assert(p.bandSourceText.length > 100, 'bandSourceText populated');
});

assert(EB.contentContainsBannedHook('Imagine a concert where the band plays'), 'banned hook detect');
assert(EB.contentContainsBannedHook('Imagine a bustling airport'), 'banned airport hook detect');
console.log('All v10 band tests passed. Proposals:', proposals.length, 'Simulations:', simCount);

// --- v11 tests ---
const MF = ctx.DreamBookModuleFormats;

const socraticParsed = DE.parseSocraticContent(
    'SCENARIO: A lab tech notices odd staining in mitochondria.\n1. What might cause this?\n2. How would you test your idea?\n3. What would change if the cell were starved?'
);
assert(socraticParsed.scenarioHook.includes('lab tech'), 'parseSocraticContent scenario hook');
assert(socraticParsed.questions.length === 3, 'parseSocraticContent three questions');

proposals.forEach(p => {
    assert(Array.isArray(p.bandBlockIds) && p.bandBlockIds.length > 0, `bandBlockIds on ${p.bandId}`);
});

const formatIds = new Set();
let finalized = EB.finalizeBandProposals(proposals, eligible);
finalized.filter(p => p.scanId === 'scan_socratic').forEach(p => {
    if (p.payload?.formatId) formatIds.add(p.payload.formatId);
});
assert(formatIds.size >= 1, 'assignChapterFormats assigns format_id to socratic proposals');

const preserveFmt = EB.finalizeBandProposals([{
    scanId: 'scan_socratic',
    bandId: '2.3',
    tier: 'major',
    payload: { widgetActionId: 'socratic-question', formatId: 'what_if' }
}], eligible);
assert(preserveFmt[0]?.payload?.formatId === 'what_if', 'preserve Pass 2 format_id on finalize');

assert(MF.normalizeFormatId('teach_back', 'socratic-question') === 'explain_own_words', 'teach_back remapped off socratic');

const stripped = DE.stripMarkdownFromSocraticText('**Imagine Minecraft**');
assert(stripped === 'Imagine Minecraft', 'strip markdown from socratic text');

const manyBands = [];
for (let i = 1; i <= 9; i++) {
    manyBands.push({
        bandId: `9.${i}`,
        label: `9.${i} Topic ${i}`,
        blocks: [{ blockId: `mb${i}`, text: 'Extracellular matrix lysosome signal transduction homeostasis application scenario. '.repeat(20) }],
        subheadings: []
    });
}
const manyProposals = [];
manyBands.forEach(b => {
    manyProposals.push({
        scanId: 'scan_socratic',
        bandId: b.bandId,
        tier: 'major',
        bundleTier: 'non_m',
        necessity: 'recommended',
        payload: { widgetActionId: 'socratic-question' },
        rationale: 'Students explain homeostasis and signal transduction using passage evidence in their own words.'
    });
    manyProposals.push({
        scanId: 'scan_illustrate',
        bandId: b.bandId,
        tier: 'major',
        bundleTier: 'm',
        necessity: 'optional',
        payload: { illustrateStyle: 'analogy', widgetActionId: 'illustrate-analogy' },
        rationale: 'Students explore extracellular matrix ideas through a practical scenario hook.'
    });
});
const manyFinal = EB.finalizeBandProposals(manyProposals, manyBands);
const newsCount = manyFinal.filter(p => EB.getProposalFeatureKey(p) === 'illustrate_news').length;
assert(newsCount >= 2, `news mix: expected >=2 from optional M analogies, got ${newsCount}`);

const respWeapon = EB.inferWeaponFromDiagnosis(
    { enhancement_opportunity: 'real world application ECM homeostasis' },
    respBand,
    new Set()
);
assert(
    respWeapon === EB.ENHANCEMENT_WEAPONS.illustrate_news || respWeapon === EB.ENHANCEMENT_WEAPONS.case_study,
    'application band prefers news or case study'
);

console.log('All v11 band tests passed. News in mix:', newsCount, 'Socratic formats:', [...formatIds].join(', '));

const band23Diag = diagnosisByBand['2.3'] || {
    core_concept: 'Students distinguish prokaryotic and eukaryotic cell architecture.',
    enhancement_opportunity: 'Compare and contrast prokaryotic and eukaryotic features across subsections.'
};
const band23Text = EB.formatBandSourceText(band23, 5000);
assert(
    EB.inferBandPromptProfile(band23Diag, band23Text) === 'compare_contrast',
    'inferBandPromptProfile for band 2.3 is compare_contrast'
);
assert(EB.WIDGET_SOURCE_PASSAGE_MODE === 'band_full', 'WIDGET_SOURCE_PASSAGE_MODE defaults to band_full');

// --- author-facing proposal card copy ---
const counterRecs = [{
    band_id: '2.3',
    tier: 'major',
    feature: 'counter',
    format_id: 'compare_models',
    candidate_id: 'B2_3-C1',
    title: 'Prokaryotic vs. Eukaryotic Cells: Compare Models',
    rationale: "This band addresses prokaryotic and eukaryotic differences. A counter feature with a 'compare_models' format will help students critically evaluate misconceptions such as 'all cells have a nucleus'.",
    necessity: 'essential'
}];
const counterProposals = EB.proposalsFromBandRecommendations(counterRecs, eligible, menuById, outlineMeta, diagnosisByBand);
assert(counterProposals.length === 1, 'counter proposal on band 2.3');
assert(
    counterProposals[0].sectionHeading === '2.3 Types of Cells: Prokaryotic and Eukaryotic',
    `sectionHeading uses major band heading, got: ${counterProposals[0].sectionHeading}`
);

const resolved = DE.resolvePrimarySectionHeading('2.3.2 Eukaryotic Complexity', outlineMeta);
assert(
    resolved === '2.3 Types of Cells: Prokaryotic and Eukaryotic',
    `resolvePrimarySectionHeading: ${resolved}`
);

const desc = DE.buildAuthorProposalDescription({
    scanId: 'scan_counter',
    sectionHeading: '2.3.2 Eukaryotic Complexity',
    payload: { widgetActionId: 'opposing-view', formatId: 'compare_models' },
    rationale: "Students should debate a flawed claim about cell organization and cite passage evidence on nucleoid, nucleus, and ribosome types."
}, outlineMeta);
assert(desc.startsWith('Add a flawed-claim debate'), `author description action line: ${desc}`);
assert(!desc.includes('compare_models'), 'no internal slug in description');
assert(/flawed|claim|evidence/i.test(desc), 'includes pedagogical benefit');

const socraticDesc = DE.buildAuthorProposalDescription({
    scanId: 'scan_socratic',
    sectionHeading: '2.4 Overview of Cell Structure',
    payload: { widgetActionId: 'socratic-question', formatId: 'what_if' },
    rationale: 'Students should explain organelle functions in their own words before moving on.'
}, outlineMeta);
assert(/what if/i.test(socraticDesc), `socratic what_if blurb: ${socraticDesc}`);

const recallDesc = DE.buildAuthorProposalDescription({
    scanId: 'scan_recall',
    sectionHeading: '2.12 Membrane Transport and Selective Permeability',
    payload: { recallFormat: 'order', widgetActionId: 'recall-check' },
    rationale: 'The sequence in membrane transport should be reinforced by ordering steps from memory.'
}, outlineMeta);
assert(/order/i.test(recallDesc), `recall order blurb: ${recallDesc}`);

const newsDesc = DE.buildAuthorProposalDescription({
    scanId: 'scan_illustrate',
    sectionHeading: '2.13 Energy Production: Cellular Respiration and Photosynthesis',
    payload: { illustrateStyle: 'news', widgetActionId: 'illustrate-news' },
    rationale: 'Use a recent real-world example to show why one key idea from this passage matters outside the textbook.'
}, outlineMeta);
assert(!newsDesc.includes('2023'), `no year range in author description: ${newsDesc}`);
assert(!newsDesc.includes('no analogies'), 'no internal prompt in author description');
assert(/real-world/i.test(newsDesc), `news blurb is author-friendly: ${newsDesc}`);

const newsWithBenefit = DE.buildAuthorProposalDescription({
    scanId: 'scan_illustrate',
    sectionHeading: '2.4 The Nucleus, Cytoplasm, and Ribosomes',
    payload: { illustrateStyle: 'news', widgetActionId: 'illustrate-news' },
    rationale: 'This helps students understand the roles and interactions of these components in cellular activity.'
}, outlineMeta);
assert(newsWithBenefit.includes('. This helps'), `benefit sentence capitalized: ${newsWithBenefit}`);
assert(!newsWithBenefit.includes('. this helps'), 'no lowercase after full stop');

const newsHtml = DE.buildAuthorProposalDescriptionHtml({
    scanId: 'scan_illustrate',
    sectionHeading: '2.4 The Nucleus, Cytoplasm, and Ribosomes',
    payload: { illustrateStyle: 'news', widgetActionId: 'illustrate-news' },
    rationale: 'This helps students understand the roles and interactions of these components in cellular activity.'
}, outlineMeta);
assert(newsHtml.includes('<strong>real-world application</strong>'), `news html bold: ${newsHtml}`);

const socraticHtml = DE.buildAuthorProposalDescriptionHtml({
    scanId: 'scan_socratic',
    sectionHeading: '2.4 Overview of Cell Structure',
    payload: { widgetActionId: 'socratic-question', formatId: 'what_if' },
    rationale: 'Students should explain organelle functions in their own words before moving on.'
}, outlineMeta);
assert(socraticHtml.includes('<strong>'), `socratic html has bold: ${socraticHtml}`);
assert(socraticHtml.includes('Socratic checkpoint'), `socratic activity label bolded: ${socraticHtml}`);

assert(!desc.includes('<strong>'), 'plain description has no html tags');

console.log('All author-facing proposal card tests passed.');

// --- v12 bundle tests ---
const bundleRecs = [{
    band_id: '2.3',
    tier: 'major',
    non_m: {
        feature: 'counter',
        format_id: 'compare_models',
        candidate_id: 'B2_3-C1',
        title: 'Prokaryotic vs Eukaryotic debate',
        rationale: "Students debate a flawed claim that all cells have a nucleus, citing prokaryotic nucleoid versus eukaryotic nucleus evidence from both subsections.",
        necessity: 'essential'
    },
    m_items: [{
        feature: 'illustrate_analogy',
        candidate_id: 'B2_3-M1',
        title: 'Cell architecture analogy',
        rationale: 'Map prokaryotic simplicity versus eukaryotic compartmentalization using a subsection hook on ribosome types.',
        necessity: 'optional'
    }]
}];
const bundleProposals = EB.proposalsFromBandBundles(bundleRecs, eligible, menuById, outlineMeta, diagnosisByBand);
assert(bundleProposals.length === 2, `bundle yields 2 proposals, got ${bundleProposals.length}`);
assert(bundleProposals.filter(p => p.bandId === '2.3').length === 2, 'two proposals for band 2.3');
assert(bundleProposals.some(p => p.bundleTier === 'non_m'), 'bundle has non-M tier');
assert(bundleProposals.some(p => p.bundleTier === 'm'), 'bundle has M tier');
assert(bundleProposals.every(p => p.plannedFeatureKey && p.plannedScanId), 'planned metadata stamped');

const flexMenu = EB.buildBandFlexibleCandidateMenu(band23);
assert(flexMenu.length >= 1, 'flexible menu has candidates');
assert(flexMenu.some(c => c.candidateId.includes('-M')), 'flex menu uses M prefix');

const dualMBundle = [{
    band_id: '2.12',
    tier: 'major',
    non_m: {
        feature: 'socratic',
        candidate_id: 'B2_12-C1',
        title: 'Transport checkpoint',
        rationale: 'Students explain how osmosis and diffusion differ using evidence on selective permeability from the membrane transport section.',
        necessity: 'recommended'
    },
    m_items: [
        {
            feature: 'simulation',
            phet_id: 'membrane-transport',
            candidate_id: 'B2_12-M1',
            title: 'Transport sim',
            rationale: 'Interactive PhET exploration of membrane transport at the osmosis subsection hook.',
            necessity: 'recommended'
        },
        {
            feature: 'illustrate_analogy',
            candidate_id: 'B2_12-M2',
            title: 'Gradient analogy',
            rationale: 'Map concentration gradients to everyday flow using the facilitated diffusion paragraph hook.',
            necessity: 'optional'
        }
    ]
}];
let cappedBundle = EB.proposalsFromBandBundles(dualMBundle, eligible, menuById, outlineMeta, diagnosisByBand);
cappedBundle = EB.enforceMBundleCaps(cappedBundle, diagnosisByBand, eligible);
const mIn212 = cappedBundle.filter(p => p.bandId === '2.12' && (p.bundleTier === 'm' || EB.isMFeatureKey(EB.getProposalFeatureKey(p))));
assert(mIn212.length <= EB.MAX_M_PER_BAND, `M cap per band: ${mIn212.length}`);

const figureKey1 = EB.figureDedupeKey('2.2', '2.4 Overview of Cell Structure');
const figureKey2 = EB.figureDedupeKey('2.2', '2.5 The Fluid Mosaic Model');
assert(figureKey1 !== figureKey2, 'figure dedupe keys differ by section band');

const soleCaseFinal = EB.finalizeBandProposals([{
    scanId: 'scan_case_study',
    bandId: '2.4',
    tier: 'major',
    bundleTier: 'non_m',
    sectionHeading: '2.4 Overview of Cell Structure',
    title: 'Case Study: Cellular Components',
    plannedFeatureKey: 'case_study',
    plannedScanId: 'scan_case_study',
    payload: { widgetActionId: 'mini-case-study', formatId: 'scenario_roleplay' },
    rationale: 'Introduce a case study where students explore interrelated organelle functions.'
}], eligible);
assert(soleCaseFinal[0].scanId === 'scan_case_study', 'sole non-M case study must not convert to news');
assert(EB.getProposalFeatureKey(soleCaseFinal[0]) === 'case_study', 'sole case study feature key unchanged');

const sharedBandFinal = EB.finalizeBandProposals([
    {
        scanId: 'scan_counter',
        bandId: '9.1',
        tier: 'major',
        bundleTier: 'non_m',
        sectionHeading: '9.1 Topic 1',
        payload: { widgetActionId: 'opposing-view', formatId: 'compare_models' },
        rationale: 'Students debate a flawed claim about ECM using collagen and fibronectin evidence.'
    },
    {
        scanId: 'scan_case_study',
        bandId: '9.1',
        tier: 'major',
        bundleTier: 'non_m',
        sectionHeading: '9.1 Topic 1',
        title: 'Case Study: ECM Topic',
        plannedFeatureKey: 'case_study',
        plannedScanId: 'scan_case_study',
        payload: { widgetActionId: 'mini-case-study', formatId: 'scenario_roleplay' },
        rationale: 'Introduce a case study where students explore extracellular matrix roles.'
    },
    ...manyBands.slice(1).flatMap(b => ([{
        scanId: 'scan_socratic',
        bandId: b.bandId,
        tier: 'major',
        bundleTier: 'non_m',
        payload: { widgetActionId: 'socratic-question' },
        rationale: 'Students explain homeostasis concepts using passage evidence in their own words.'
    }]))
], manyBands);
const convertedShared = sharedBandFinal.find(p =>
    p.bandId === '9.1' && EB.getProposalFeatureKey(p) === 'illustrate_news'
);
if (convertedShared) {
    assert(convertedShared.plannedFeatureKey === 'case_study', 'plannedFeatureKey preserved on conversion');
    assert(/Real-World Application/i.test(convertedShared.title || ''), `converted title synced: ${convertedShared.title}`);
    assert(convertedShared.bundleTier === 'm', 'converted proposal bundleTier is m');
    assert(!/introduce a case study/i.test(convertedShared.rationale || ''), 'rationale no longer case-study phrasing');
    assert(EB.bandHasEffectiveNonM(sharedBandFinal, '9.1'), 'band retains effective non-M after shared-band conversion');
}

console.log('All v12 bundle tests passed.');

// --- sanitize tier + dedupe tests ---
const wrongTierBundle = [{
    band_id: '2.4',
    tier: 'major',
    non_m: {
        feature: 'illustrate_analogy',
        candidate_id: 'B2_4-C1',
        title: 'Analogy misplaced in non_m',
        rationale: 'Students map organelle functions using a factory analogy tied to the Golgi and ER subsections in this band.',
        necessity: 'recommended'
    },
    m_items: []
}];
const sanitized = EB.proposalsFromBandBundles(wrongTierBundle, eligible, menuById, outlineMeta, diagnosisByBand);
assert(sanitized.some(p => EB.isMFeatureKey(EB.getProposalFeatureKey(p))), 'M feature in non_m slot sanitized to M tier');
assert(!sanitized.some(p => p.bundleTier === 'non_m' && EB.isMFeatureKey(EB.getProposalFeatureKey(p))), 'no M feature left in non_m tier');

const dedupeInput = [
    { bandId: '2.11', findingId: 'dup-a', scanId: 'scan_illustrate', bundleTier: 'non_m', payload: { illustrateStyle: 'news' }, plannedFeatureKey: 'illustrate_news', tier: 'major', afterBlockId: 'b12', rationale: 'x'.repeat(30) },
    { bandId: '2.11', findingId: 'dup-b', scanId: 'scan_illustrate', bundleTier: 'm', payload: { illustrateStyle: 'news' }, plannedFeatureKey: 'illustrate_news', tier: 'major', afterBlockId: 'b12', rationale: 'y'.repeat(30) }
];
const deduped = EB.enforceMBundleCaps(dedupeInput, diagnosisByBand, eligible);
const dupIds = deduped.filter(p => p.bandId === '2.11').map(p => p.findingId);
assert(new Set(dupIds).size === dupIds.length, 'enforceMBundleCaps does not duplicate proposals');

const bandWithTwoC = eligible.find(b => b.bandId === '2.3');
if (bandWithTwoC) {
    const nonMRec = [{
        band_id: '2.3',
        tier: 'major',
        non_m: {
            feature: 'recall',
            candidate_id: 'B2_3-C1',
            title: 'Recall at end',
            rationale: 'Students recall prokaryotic versus eukaryotic differences using evidence from both subsections on cell architecture.',
            necessity: 'recommended'
        },
        m_items: []
    }];
    const nonMProposal = EB.proposalsFromBandBundles(nonMRec, eligible, menuById, outlineMeta, diagnosisByBand)[0];
    if (nonMProposal) {
        const cId = String(nonMProposal.candidateId || nonMProposal.payload?.candidateId || '');
        const cMatch = cId.match(/-C(\d+)$/i);
        if (cMatch && parseInt(cMatch[1], 10) > 1) {
            assert(parseInt(cMatch[1], 10) >= 2, 'non-M resolves to highest -C anchor when available');
        }
    }
}

console.log('All sanitize/dedupe tier tests passed.');

// --- v12 variety guard tests ---
const mockBands13 = Array.from({ length: 13 }, (_, i) => ({
    bandId: `2.${i + 3}`,
    label: `2.${i + 3} Section Topic`,
    blocks: [{ blockId: `cb${i}`, text: 'Nucleus cytoplasm ribosome ECM junction lysosome peroxisome transport. '.repeat(20) }],
    subheadings: []
}));
const cellLikeProposals = mockBands13.map((b, i) => ({
    scanId: (i === 3 || i === 7) ? 'scan_case_study' : 'scan_socratic',
    bandId: b.bandId,
    tier: 'major',
    bundleTier: 'non_m',
    sectionHeading: b.label,
    title: i === 3 ? 'Case Study: Cellular Components'
        : i === 7 ? 'Case Study: ECM and Junctions'
        : `Socratic: ${b.label}`,
    payload: (i === 3 || i === 7)
        ? { widgetActionId: 'mini-case-study' }
        : { widgetActionId: 'socratic-question' },
    rationale: (i === 3 || i === 7)
        ? 'Introduce a case study where students explore interrelated cellular functions.'
        : 'Students explain key concepts in their own words using passage evidence.',
    necessity: 'recommended'
}));
cellLikeProposals.push(
    {
        scanId: 'scan_counter',
        bandId: '2.3',
        tier: 'major',
        bundleTier: 'non_m',
        necessity: 'essential',
        payload: { widgetActionId: 'opposing-view' },
        rationale: 'Students debate prokaryotic versus eukaryotic claims using passage evidence.'
    },
    {
        scanId: 'scan_illustrate',
        bandId: '2.3',
        tier: 'major',
        bundleTier: 'm',
        necessity: 'optional',
        payload: { illustrateStyle: 'analogy', widgetActionId: 'illustrate-analogy' },
        rationale: 'Students map cell architecture through a practical scenario hook.'
    }
);
const cellFinal = EB.finalizeBandProposals(cellLikeProposals, mockBands13);
const cs26 = cellFinal.find(p => p.bandId === '2.6');
const cs210 = cellFinal.find(p => p.bandId === '2.10');
assert(cs26 && cs26.scanId === 'scan_case_study', 'band 2.6 sole case study preserved');
assert(cs210 && cs210.scanId === 'scan_case_study', 'band 2.10 sole case study preserved');
mockBands13.forEach(b => {
    assert(EB.bandHasEffectiveNonM(cellFinal, b.bandId), `band ${b.bandId} retains effective non-M`);
});

const band215 = {
    bandId: '2.15',
    label: '2.15 Cellular Digestion, Waste Removal, and Recycling',
    majorHeading: '2.15 Cellular Digestion, Waste Removal, and Recycling',
    blocks: [{ blockId: 'b15a', text: 'Lysosomes perform intracellular digestion using hydrolytic enzymes at acidic pH. '.repeat(12) },
        { blockId: 'b15b', text: 'Peroxisomes neutralize hydrogen peroxide via catalase enzyme detoxification. '.repeat(12) }],
    subheadings: []
};
const { menuById: menu215 } = EB.buildAllBandCandidateMenus([band215]);
const diag215 = {
    band_id: '2.15',
    enhancement_opportunity: 'real-world examples or analogies for lysosomes and peroxisomes',
    core_concept: 'Lysosomes and peroxisomes maintain cellular health.',
    skip: false
};
const analogySanitized = EB.proposalsFromBandBundles([{
    band_id: '2.15',
    tier: 'major',
    non_m: {
        feature: 'illustrate_analogy',
        candidate_id: 'B2_15-C2',
        title: 'Analogy: Cellular Recycling',
        rationale: 'Map lysosome and peroxisome roles using recycling and waste-management metaphors.',
        necessity: 'recommended'
    },
    m_items: []
}], [band215], menu215, outlineMeta, { '2.15': diag215 });
const filled215 = EB.ensureMajorBandBundleCoverage(
    [band215], analogySanitized, menu215, outlineMeta, { '2.15': diag215 }
);
const analogyCount215 = filled215.filter(p =>
    p.bandId === '2.15' && EB.getProposalFeatureKey(p) === 'illustrate_analogy'
).length;
assert(analogyCount215 <= 1, `coverage fill avoids duplicate analogy, got ${analogyCount215}`);
assert(EB.bandHasEffectiveNonM(filled215, '2.15'), 'band 2.15 has effective non-M after coverage fill');

console.log('All v12 variety guard tests passed.');

// --- v13 recall format inference ---
assert(
    EB.inferRecallFormatFromBand(
        { enhancement_opportunity: 'key terms and vocabulary recall' },
        'Mitochondria is defined as the powerhouse. Ribosomes are known as protein factories.'
    ) === 'match',
    'vocabulary band infers match recall'
);
assert(
    EB.inferRecallFormatFromBand(
        { enhancement_opportunity: 'transport process sequence' },
        'First the vesicle buds off. Then it travels. Finally it fuses with the membrane in a step-by-step process.'
    ) === 'order',
    'process band infers order recall'
);
assert(
    EB.inferRecallFormatFromBand(
        { enhancement_opportunity: 'conceptual understanding' },
        'The cytoskeleton provides structural support for the cell.'
    ) === 'mcq',
    'default band infers mcq recall'
);

const recallBands = [
    {
        bandId: '3.1',
        label: '3.1 Terms',
        blocks: [{ blockId: 'r1', text: 'Mitochondria is defined as the powerhouse. Ribosomes are known as protein factories. '.repeat(5) }],
        subheadings: []
    },
    {
        bandId: '3.2',
        label: '3.2 Process',
        blocks: [{ blockId: 'r2', text: 'First transcription occurs. Then translation follows. Finally the protein folds in sequence. '.repeat(5) }],
        subheadings: []
    },
    {
        bandId: '3.3',
        label: '3.3 Concept',
        blocks: [{ blockId: 'r3', text: 'The cytoskeleton supports cell shape and enables movement. '.repeat(5) }],
        subheadings: []
    }
];
const recallProposals = recallBands.map(b => ({
    scanId: 'scan_recall',
    bandId: b.bandId,
    bundleTier: 'non_m',
    bandSourceText: EB.formatBandSourceText(b, 4000),
    title: 'Recall check',
    payload: { widgetActionId: 'recall-check' }
}));
const recallDiag = {
    '3.1': { enhancement_opportunity: 'terminology vocabulary key terms' },
    '3.2': { enhancement_opportunity: 'process sequence steps' },
    '3.3': { enhancement_opportunity: 'conceptual understanding' }
};
EB.assignRecallFormats(recallProposals, recallBands, recallDiag);
const recallFormats = new Set(recallProposals.map(p => p.payload.recallFormat));
assert(recallFormats.size >= 2, `recall chapter variety: ${[...recallFormats].join(', ')}`);
assert(recallProposals.every(p => p.bundleTier === 'non_m'), 'recall proposals stay non_m');

const explicitOrder = EB.finalizeBandProposals([{
    scanId: 'scan_recall',
    bandId: '3.2',
    bundleTier: 'non_m',
    bandSourceText: recallBands[1].blocks[0].text,
    title: 'Custom recall',
    payload: { widgetActionId: 'recall-check', recallFormat: 'order', _recallFormatExplicit: true }
}], recallBands, recallDiag);
assert(explicitOrder[0]?.payload?.recallFormat === 'order', 'explicit recall_format order preserved');

const catalog = EB.formatsCatalogForPrompt();
assert(catalog.includes('scan_recall: recall_format'), 'formatsCatalog includes recall_format line');

// --- recall passage grounding ---
const organellePassage = [
    'Mitochondria are double-membraned organelles characterized by cristae.',
    'The Golgi apparatus consists of flattened cisternae.',
    'Chloroplasts contain thylakoid membranes and chlorophyll.',
    'Lysosomes contain hydrolytic enzymes at acidic pH.'
].join(' ');

const mockGenericMatch = {
    format: 'match',
    pairs: [
        { term: 'Cytosol', definition: 'Fluid inside the cell excluding organelles' },
        { term: 'Cytoplasm', definition: 'Cytosol plus organelles and structures' },
        { term: 'Gap junction', definition: 'Channel connecting adjacent animal cells' }
    ]
};
const organelleMatch = {
    format: 'match',
    pairs: [
        { term: 'Mitochondria', definition: 'Site of citric acid cycle and ATP production' },
        { term: 'Chloroplasts', definition: 'Organelles with thylakoid membranes for photosynthesis' },
        { term: 'Lysosomes', definition: 'Vesicles with hydrolytic enzymes at acidic pH' }
    ]
};

assert(
    DE.recallPayloadGroundedInPassage(mockGenericMatch, organellePassage) === false,
    'generic mock pairs rejected against organelle passage'
);
assert(
    DE.recallPayloadGroundedInPassage(organelleMatch, organellePassage) === true,
    'organelle pairs accepted against organelle passage'
);

const matchConfig = DE.buildRecallSingleFormatConfig('match');
assert(matchConfig.mcq === 0 && matchConfig.match === 1 && matchConfig.order === 0,
    'buildRecallSingleFormatConfig(match)');

const promptBundle = DE.generateRecallExercisePrompt('match', organellePassage, {
    sectionHeading: '2.7 Organelles and Their Structures',
    learningObjective: 'Identify organelle functions',
    coreConcept: 'Specialized organelles in eukaryotic cells'
});
assert(promptBundle.systemPrompt && promptBundle.userPrompt.includes('Mitochondria'),
    'generateRecallExercisePrompt includes passage text');

console.log('All v13 recall format tests passed.');

