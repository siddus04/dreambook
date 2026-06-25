/**
 * Cell Biology Ch2 peer-review demo — curated chapter_enhancements behind ?demoPeerReview=1
 */
(function (global) {
    'use strict';

    const DEMO_FLAG = 'demoPeerReview';
    const DEMO_SESSION_KEY = 'dreambook_demo_peer_review';
    const MIN_CACHE_SPINNER_MS = 1200;
    const CACHE_STAGGER_MS = 800;
    const CACHE_BASE_DELAY_MS = 1200;

    const SCAN_TO_ACTION = {
        scan_socratic: 'socratic-question',
        scan_counter: 'opposing-view',
        scan_case_study: 'mini-case-study',
        scan_explain_peer: 'explain-to-peer',
        scan_recall: 'recall-check'
    };

    const DEMO_PEER_NOTES = {
        headline: 'Strong foundation — reading accessibility and interactive enrichment need attention',
        strength: 'Your chapter shows a coherent arc through cell structure and function with solid conceptual coverage for Class 9–10 readers.',
        gap: 'A peer reader would notice prose that still reads above grade in places; technical terms need plain-language support; key figures would benefit from modern AI illustrations; and major sections lack interactive checkpoints.',
        focus: 'I\'d prioritize simplifying reading level first, then add one retrieval or reasoning checkpoint per major section, refresh all figures, and embed a membrane-transport simulation where students manipulate concentration gradients.',
        suggestedScans: [
            { scanId: 'scan_socratic', reason: 'Confirm understanding at natural pause points.', priority: 'recommended' },
            { scanId: 'scan_counter', reason: 'Challenge debatable claims in comparative sections.', priority: 'optional' },
            { scanId: 'scan_recall', reason: 'Retrieval practice on terms and sequences.', priority: 'recommended' },
            { scanId: 'scan_explain_peer', reason: 'Feynman-style teaching on core mechanisms.', priority: 'recommended' },
            { scanId: 'scan_case_study', reason: 'Apply concepts in realistic scenarios.', priority: 'optional' },
            { scanId: 'scan_simulation', reason: 'Manipulate variables in membrane transport.', priority: 'recommended' }
        ],
        excludedSections: [],
        expanded: true
    };

    /** Curated non-M + one live simulation. Placement via anchorPosition, afterFigureId, or anchorQuote prefix. */
    function buildDemoBandSpecs() {
        return [
            {
                bandId: '2.3',
                scanId: 'scan_counter',
                title: 'Debate: Prokaryotic vs. Eukaryotic',
                sectionPatterns: ['2.3.2', 'eukaryotic complexity'],
                anchorPosition: 'last',
                anchorQuote: 'Eukaryotic ribosomes are 80S in type',
                payload: { widgetActionId: 'opposing-view', formatId: 'compare_models' },
                demoHydrateMode: 'cache',
                rationale: 'Students often assume all cells have a nucleus — a structured debate tests whether they can compare prokaryotic and eukaryotic architecture using passage evidence.',
                demoHydrateContent: `THE CLAIM:
In a peer debate, one student argues that all cells must have a nucleus because it is essential for controlling cell activities. They believe this is why all biological life is categorized into eukaryotic cells, which are more complex and efficient.

COUNTER-VIEW:
The other student counters that prokaryotic cells, like bacteria, do not have a nucleus yet are still classified as biological life. They emphasize that life is divided into prokaryotic and eukaryotic cellular architectures with different levels of compartmentalization.

QUESTIONS:
1. What part of the claim sounds reasonable?
2. What kind of cell challenges the idea that all cells need a nucleus?
3. Rewrite the claim so it becomes scientifically accurate.

AUTHOR NOTE:
Misconception: All cells have a nucleus
Evidence to use: nucleoid, 70S ribosomes, nucleus, 80S ribosomes, membrane-bound organelles`
            },
            {
                bandId: '2.5',
                scanId: 'scan_simulation',
                title: 'Membrane Transport Simulation',
                sectionPatterns: ['2.5', 'plasma membrane'],
                afterFigureId: '2.2',
                payload: { simulationType: 'phet', phetId: 'membrane-transport' },
                demoHydrateMode: 'live',
                rationale: 'Let students manipulate concentration gradients and channel proteins to reinforce passive and active transport mechanisms.',
                demoHydrateContent: null
            },
            {
                bandId: '2.6',
                scanId: 'scan_explain_peer',
                title: 'Explain ribosomes to a peer',
                sectionPatterns: ['2.6.3', 'ribosomes'],
                anchorPosition: 'last',
                anchorQuote: 'Ribosomes help turn messenger RNA (mRNA) into chains of proteins',
                payload: { widgetActionId: 'explain-to-peer', formatId: 'teach_sam' },
                demoHydrateMode: 'cache',
                rationale: 'Ribosomes are central to protein synthesis — Feynman-style teaching solidifies the link between structure and translation.',
                demoHydrateContent: `TITLE:
Sam's "Protein Factory" Confusion

SAM SAYS:
Ribosomes are just tiny dots in the cell. They don't really do much except float around in the cytoplasm.

TASK:
Explain to Sam what ribosomes actually do, where they are found, and why both free and bound ribosomes matter. Use terms from the passage: rRNA, mRNA, rough ER.

QUESTIONS:
1. What is partly correct about Sam thinking ribosomes are just floating dots?
2. What important job does Sam's explanation leave out?
3. How would you explain translation to Sam using one example from the passage?

AUTHOR NOTE:
Misconception: Ribosomes are inert structural dots
Evidence used: rRNA, protein subunits, cytosol, rough ER, mRNA translation
Required passage example: bound vs free ribosomes
Takeaway: Ribosomes are active sites of protein synthesis, not passive particles.`
            },
            {
                bandId: '2.7',
                scanId: 'scan_case_study',
                title: 'Organelle function scenario',
                sectionPatterns: ['2.7.4', 'chloroplast', 'central vacuole'],
                anchorPosition: 'last',
                anchorQuote: 'It holds cell sap, which is a mix of water, ions',
                payload: { widgetActionId: 'mini-case-study', formatId: 'teach_a_peer' },
                demoHydrateMode: 'cache',
                rationale: 'Applying organelle roles to a plant-cell scenario connects structure lists to functional reasoning.',
                demoHydrateContent: `ACTIVITY HOOK:
You're advising the botanist's team — energy capture, turgor, or both?

A botanist notices that a mutant plant line has unusually small chloroplasts and a shrunken central vacuole, yet the cells still survive under low light.

The team must decide whether the primary problem is energy capture, turgor support, or both. Using organelle functions from the passage, what would you tell the lab group to investigate first, and why?

Consider: chloroplast thylakoids, central vacuole tonoplast, and how each supports plant cell identity.`
            },
            {
                bandId: '2.8',
                scanId: 'scan_recall',
                title: 'Cytoskeleton components order',
                sectionPatterns: ['2.8', 'cytoskeleton'],
                anchorPosition: 'last',
                anchorQuote: 'Intermediate Filaments: Mixed, rope-like proteins like keratin',
                payload: { widgetActionId: 'recall-check', recallFormat: 'order' },
                demoHydrateMode: 'cache',
                rationale: 'Students must distinguish microtubules, microfilaments, and intermediate filaments by role and structure.',
                demoHydrateContent: {
                    format: 'order',
                    prompt: 'Order the cytoskeleton components from largest/hollow tracks to rope-like anchors:',
                    steps: [
                        'Microtubules — hollow tubulin cylinders; tracks for motor proteins',
                        'Microfilaments (actin) — solid rods bearing tension',
                        'Intermediate filaments — rope-like proteins anchoring organelles'
                    ]
                }
            },
            {
                bandId: '2.9',
                scanId: 'scan_socratic',
                title: 'What if plant cells had no cell wall?',
                sectionPatterns: ['2.9', 'plant and animal cells'],
                afterFigureId: '2.3',
                payload: { widgetActionId: 'socratic-question', formatId: 'what_if' },
                demoHydrateMode: 'cache',
                rationale: 'Comparing plant and animal cells benefits from consequence-tracing when a defining structure is removed.',
                demoHydrateContent: `SCENARIO:
Imagine you are in a lab examining plant cells under a microscope. You notice their rigid cell walls providing structure and support.

1. What if the plant cells you observed lacked these rigid cell walls?
2. How would the absence of cell walls affect the plant's ability to stand upright?
3. What larger impact might this have on the plant's survival and growth in its environment?`
            },
            {
                bandId: '2.10',
                scanId: 'scan_explain_peer',
                title: 'Teach Sam: ECM and junctions',
                sectionPatterns: ['2.10.2', 'cellular junctions'],
                anchorPosition: 'last',
                anchorQuote: 'Gap Junctions: Protein channels that the insides of nearby cells',
                payload: { widgetActionId: 'explain-to-peer', formatId: 'teach_sam' },
                demoHydrateMode: 'cache',
                rationale: 'ECM and junction types are easy to memorize without understanding — teaching practice forces precise definitions.',
                demoHydrateContent: `TITLE:
Sam's "Glue Only" Theory

SAM SAYS:
Cell junctions just glue cells together like tape. The extracellular matrix is basically leftover goo between cells.

TASK:
Explain to Sam how the ECM supports tissue structure and how tight junctions, desmosomes, and gap junctions differ in function.

QUESTIONS:
1. What is partly correct about Sam's idea that junctions hold cells together?
2. What important communication role does Sam's explanation leave out?
3. How would you explain gap junctions to Sam using one example from the passage?

AUTHOR NOTE:
Misconception: Junctions are only mechanical glue
Evidence used: ECM, collagen, tight junctions, desmosomes, gap junctions, connexons
Required passage example: gap junction signaling
Takeaway: Junctions both connect and communicate; the ECM is an active structural network.`
            },
            {
                bandId: '2.11',
                scanId: 'scan_case_study',
                title: 'Cellular homeostasis scenario',
                sectionPatterns: ['2.11', 'homeostasis', 'life processes'],
                anchorPosition: 'last',
                anchorQuote: 'A cell without a working membrane cannot manage what goes in or out',
                payload: { widgetActionId: 'mini-case-study' },
                demoHydrateMode: 'cache',
                rationale: 'Connecting life processes to organelle failures makes homeostasis concrete for students.',
                demoHydrateContent: `ACTIVITY HOOK:
The doctors ask you — which two life processes failed, and which organelles first?

A patient's muscle biopsy shows cells that cannot maintain stable ATP levels during exercise, even though nutrients are available.

Doctors suspect a problem with energy conversion, membrane transport, or both. Using the six life processes listed in the passage, which two processes are most likely disrupted, and which organelles would you investigate first?

Explain your reasoning using at least one structure–function link from Part One (e.g., mitochondria and ATP, plasma membrane and exchange).`
            },
            {
                bandId: '2.12',
                scanId: 'scan_recall',
                title: 'Membrane transport match',
                sectionPatterns: ['2.12.3', 'vesicular transport'],
                anchorPosition: 'last',
                anchorQuote: 'Exocytosis: When tiny sacs inside a cell join with the cell',
                payload: { widgetActionId: 'recall-check', recallFormat: 'match' },
                demoHydrateMode: 'cache',
                rationale: 'Matching transport types to definitions reinforces passive, active, and vesicular mechanisms.',
                demoHydrateContent: {
                    format: 'match',
                    pairs: [
                        { term: 'Simple diffusion', definition: 'Small nonpolar molecules cross the bilayer without help' },
                        { term: 'Osmosis', definition: 'Net movement of water toward higher solute concentration' },
                        { term: 'Primary active transport', definition: 'Uses ATP to move ions against their gradient' },
                        { term: 'Endocytosis', definition: 'Membrane invagination brings bulk material into the cell' }
                    ]
                }
            },
            {
                bandId: '2.14',
                scanId: 'scan_explain_peer',
                title: 'Protein synthesis whiteboard',
                sectionPatterns: ['2.14', 'protein synthesis'],
                anchorPosition: 'last',
                anchorQuote: 'The smooth ER contributes to this functional network by synthesizing lipids',
                payload: { widgetActionId: 'explain-to-peer', formatId: 'whiteboard_steps' },
                demoHydrateMode: 'cache',
                rationale: 'The endomembrane pathway needs sequential explanation — whiteboard format scaffolds the factory-line mental model.',
                demoHydrateContent: `SETUP:
Draw the protein production pathway on a whiteboard starting at the nucleus.

STUDENT TASK:
Walk a peer through transcription, translation, ER modification, Golgi sorting, and secretion. Name at least four organelles or structures from the passage and place them in order.`
            },
            {
                bandId: '2.15',
                scanId: 'scan_case_study',
                title: 'Lysosomal and peroxisomal disorders',
                sectionPatterns: ['2.15.2', 'peroxisomal'],
                anchorPosition: 'last',
                anchorQuote: 'Peroxisomes neutralize toxic byproducts of metabolism',
                payload: { widgetActionId: 'mini-case-study' },
                demoHydrateMode: 'cache',
                rationale: 'Linking lysosome and peroxisome failures to disease motivates cellular recycling concepts.',
                demoHydrateContent: `ACTIVITY HOOK:
You're on the research team — what cellular symptoms would you predict?

Researchers study a rare metabolic disorder where cells accumulate hydrogen peroxide and damaged lipids. Lysosomal enzymes appear normal, but peroxisomal catalase activity is very low.

What symptoms might you predict at the cellular level? Which passage mechanisms explain why both lysosomes and peroxisomes are needed for different types of cleanup?

Propose one follow-up experiment the team should run to distinguish lysosomal digestion failure from peroxisomal detox failure.`
            },
            {
                bandId: '2.17',
                scanId: 'scan_counter',
                title: 'Endosymbiosis evidence debate',
                sectionPatterns: ['2.17', 'endosymbiotic'],
                anchorPosition: 'last',
                anchorQuote: 'This theory links the structural features of these organelles directly to their functional roles',
                payload: { widgetActionId: 'opposing-view', formatId: 'compare_models' },
                demoHydrateMode: 'cache',
                rationale: 'Endosymbiotic theory evidence is often memorized as a list — debate format requires evaluating claims.',
                demoHydrateContent: `THE CLAIM:
A student claims mitochondria and chloroplasts are just highly folded membrane structures with no special evolutionary history — they are the same as any other organelle.

COUNTER-VIEW:
Another student argues that circular DNA, 70S-like ribosomes, and independent replication support endosymbiotic origin from free-living prokaryotes engulfed by an ancestral eukaryote.

QUESTIONS:
1. What is partly correct about treating mitochondria and chloroplasts as folded membrane structures?
2. What is incorrect or incomplete about saying they have no special evolutionary history?
3. What passage evidence supports endosymbiotic origin, and where does the "just folded membranes" claim break down?

AUTHOR NOTE:
Misconception: Organelles are interchangeable folded membranes
Evidence to use: circular DNA, 70S ribosomes, binary fission, inner membrane composition`
            }
        ];
    }

    function captureDemoPeerReviewFromUrl() {
        try {
            const params = new URLSearchParams(global.location?.search || '');
            if (params.has(DEMO_FLAG) || params.get(DEMO_FLAG) === '1') {
                global.sessionStorage?.setItem(DEMO_SESSION_KEY, '1');
            }
        } catch (e) {
            /* ignore */
        }
    }

    function isDemoPeerReviewEnabled() {
        if (global.DREAMBOOK_FLAGS?.demoPeerReview) return true;
        try {
            if (global.sessionStorage?.getItem(DEMO_SESSION_KEY) === '1') return true;
            const params = new URLSearchParams(global.location?.search || '');
            return params.has(DEMO_FLAG) || params.get(DEMO_FLAG) === '1';
        } catch (e) {
            return false;
        }
    }

    captureDemoPeerReviewFromUrl();

    function demoSleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function getDemoPeerNotes(outlineHeadings) {
        const headings = outlineHeadings || [];
        const enh = global.DreamBookEnhancements;
        const excluded = enh?.mergeExcludedSections
            ? enh.mergeExcludedSections(headings, DEMO_PEER_NOTES.excludedSections || [])
            : (DEMO_PEER_NOTES.excludedSections || []);
        return {
            ...DEMO_PEER_NOTES,
            excludedSections: excluded
        };
    }

    function resolveBand(bands, bandId) {
        return (bands || []).find(b => String(b.bandId) === String(bandId)) || null;
    }

    function assignDemoDelays(specs) {
        let cacheIndex = 0;
        return (specs || []).map(spec => {
            if (spec.demoHydrateMode === 'live') {
                return { ...spec, demoHydrateDelayMs: 0, demoSortPriority: spec.scanId === 'scan_simulation' ? 0 : 1 };
            }
            const delay = CACHE_BASE_DELAY_MS + cacheIndex * CACHE_STAGGER_MS;
            cacheIndex += 1;
            return { ...spec, demoHydrateDelayMs: delay, demoSortPriority: 2 + cacheIndex };
        });
    }

    function buildCuratedChapterEnhancementFindings(outlineMeta, bands, ctx) {
        const makeProposal = global.DreamBookEnhancements?.makeProposal;
        if (!makeProposal) return [];

        const specs = assignDemoDelays(buildDemoBandSpecs());
        const findings = [];
        const bandById = new Map((bands || []).map(b => [String(b.bandId), b]));

        specs.forEach((spec, i) => {
            const sectionHeading = ctx?.resolveDemoSection
                ? ctx.resolveDemoSection(spec.sectionPatterns || [])
                : null;
            if (!sectionHeading) return;

            const anchorQuote = spec.anchorQuote || '';
            let afterBlockId = '';
            let resolvedQuote = anchorQuote;
            if (ctx?.resolveDemoBlockPlacement) {
                const placement = ctx.resolveDemoBlockPlacement(sectionHeading, spec);
                afterBlockId = placement?.afterBlockId || '';
                if (placement?.anchorQuote) resolvedQuote = placement.anchorQuote;
            } else if (ctx?.resolveDemoBlockId) {
                afterBlockId = ctx.resolveDemoBlockId(sectionHeading, anchorQuote);
            }
            if (!afterBlockId && anchorQuote && ctx?.resolveDemoBlockId) {
                afterBlockId = ctx.resolveDemoBlockId(sectionHeading, anchorQuote.slice(0, 40)) || '';
            }
            if (!afterBlockId) {
                console.warn('[demoPeerReview] unresolved anchor', spec.bandId, spec.scanId,
                    spec.afterFigureId || anchorQuote.slice(0, 48) || spec.anchorPosition || '');
                return;
            }

            const band = resolveBand(bands, spec.bandId) || bandById.get(String(spec.bandId));
            const bandBlockIds = (band?.blocks || []).map(b => b.blockId).filter(Boolean);
            const displayPassage = band
                ? (global.DreamBookEnhancementBands?.formatBandSourceText?.(band, 4000) || '')
                : (ctx?.getSectionExcerpt?.(sectionHeading, 600) || '');

            const scanDef = global.DreamBookEnhancements?.ENHANCEMENT_SCAN_TOOLS
                ?.find(t => t.id === spec.scanId);
            const payload = { ...(spec.payload || {}) };
            if (scanDef?.widgetActionId && !payload.widgetActionId && spec.scanId !== 'scan_recall') {
                payload.widgetActionId = scanDef.widgetActionId;
            }
            if (spec.scanId === 'scan_recall' && !payload.widgetActionId) {
                payload.widgetActionId = 'recall-check';
            }

            const proposal = makeProposal({
                scanId: spec.scanId,
                findingId: 'demo-ep-' + spec.bandId + '-' + spec.scanId + '-' + i,
                necessity: 'recommended',
                objectiveTag: 'clarity',
                sectionHeading: band?.majorHeading || sectionHeading,
                afterBlockId,
                anchorQuote: resolvedQuote,
                displayPassage: displayPassage.slice(0, 4000),
                bandSourceText: displayPassage,
                bandBlockIds,
                title: spec.title,
                rationale: spec.rationale || `Demo placement for ${sectionHeading}.`,
                payload,
                bandId: spec.bandId,
                tier: 'major',
                placementNote: `Band ${spec.bandId} (demo curated)`,
                status: 'pending'
            });

            proposal.demoHydrateMode = spec.demoHydrateMode || 'cache';
            proposal.demoHydrateDelayMs = spec.demoHydrateDelayMs || 0;
            proposal.demoHydrateContent = spec.demoHydrateContent;
            proposal.demoSortPriority = spec.demoSortPriority ?? 99;
            findings.push(proposal);
        });

        findings.sort((a, b) => (a.demoSortPriority ?? 99) - (b.demoSortPriority ?? 99));
        return findings;
    }

    async function runStagedDemoAnalysisProgress(run, bands, outlineMeta, ctx) {
        if (run) run.analysisPhase = 'diagnosis';
        await demoSleep(1500);
        if (run) run.analysisPhase = 'recommendation';
        const tickBands = (bands || []).slice(0, 6);
        for (let i = 0; i < tickBands.length; i++) {
            await demoSleep(400);
        }
        await demoSleep(2000);
        return buildCuratedChapterEnhancementFindings(outlineMeta, bands, ctx);
    }

    function buildPedagogyFieldsFromCache(actionId, formatId, contentResult, openingPrompt, helpers) {
        const EN = global.DreamBookEnhancements;
        const MF = global.DreamBookModuleFormats;
        let questionLadder = null;
        let scenarioHook = '';
        let socraticTitle = '';
        let displayContent = contentResult;
        openingPrompt = (openingPrompt || '').trim();

        if (actionId === 'socratic-question' && EN?.parseSocraticContent) {
            const parsed = EN.parseSocraticContent(contentResult);
            scenarioHook = MF?.sanitizeSocraticHook
                ? MF.sanitizeSocraticHook(parsed.scenarioHook || parsed.hook || '')
                : (parsed.scenarioHook || parsed.hook || '');
            questionLadder = parsed.questions || [];
            socraticTitle = parsed.title || '';
            openingPrompt = helpers.resolveSocraticOpening
                ? helpers.resolveSocraticOpening(openingPrompt, questionLadder, scenarioHook)
                : openingPrompt;
        } else if (actionId === 'explain-to-peer' && helpers.applyPedagogyWidgetFields) {
            const peerFields = helpers.applyPedagogyWidgetFields(actionId, formatId, contentResult, openingPrompt);
            if (peerFields) {
                scenarioHook = peerFields.scenarioHook || '';
                questionLadder = peerFields.questionLadder?.length ? peerFields.questionLadder : null;
                socraticTitle = peerFields.socraticTitle || '';
                openingPrompt = peerFields.openingPrompt || openingPrompt;
            }
        } else if (actionId === 'opposing-view' && helpers.applyPedagogyWidgetFields) {
            const debateFields = helpers.applyPedagogyWidgetFields(actionId, formatId, contentResult, openingPrompt);
            if (debateFields) {
                scenarioHook = debateFields.scenarioHook || '';
                questionLadder = debateFields.questionLadder?.length ? debateFields.questionLadder : null;
                socraticTitle = debateFields.socraticTitle || '';
                openingPrompt = debateFields.openingPrompt || openingPrompt;
            } else if (MF?.parseOpposingChallengeContent) {
                const parsed = MF.parseOpposingChallengeContent(contentResult);
                if (parsed.task) openingPrompt = parsed.task;
            }
        } else if (actionId === 'mini-case-study' && MF?.parseCaseStudyCachedContent) {
            const parsed = MF.parseCaseStudyCachedContent(contentResult);
            if (parsed.activityHook) openingPrompt = parsed.activityHook;
            if (parsed.body) displayContent = parsed.body;
        }

        return { questionLadder, scenarioHook, socraticTitle, openingPrompt, displayContent };
    }

    async function applyDemoCachedHydrate(finding, placeholderEl, helpers) {
        if (!finding?.demoHydrateContent || finding.demoHydrateMode !== 'cache') {
            return { ok: false, error: 'no_cache' };
        }
        if (!placeholderEl?.parentNode) {
            return { ok: false, error: 'placeholder_removed' };
        }

        const delay = Math.max(finding.demoHydrateDelayMs || 0, MIN_CACHE_SPINNER_MS);
        await demoSleep(delay);

        if (!placeholderEl?.parentNode) {
            return { ok: false, error: 'placeholder_removed' };
        }

        helpers.updateAuthorWidgetPendingUI?.(placeholderEl, 'generating', finding.rationale);

        const ctx = helpers.resolveInsertContext?.(finding);
        if (!ctx?.ok) return { ok: false, error: ctx?.error || 'context' };

        const { sourceText, resolvedPayload, insertOpts } = ctx;
        const draftAttr = ' data-review-draft="true"';
        const blockId = placeholderEl.id;
        const scanId = finding.scanId;

        if (scanId === 'scan_recall') {
            const content = finding.demoHydrateContent;
            const format = content.format || resolvedPayload.recallFormat || 'mcq';
            const html = helpers.buildRecallCheckBlockHtml(sourceText, format, draftAttr, {
                blockId,
                payload: content,
                findingId: insertOpts.findingId,
                findingRunId: insertOpts.findingRunId
            });
            const insertedEl = helpers.replaceEditorBlockWithHtml(placeholderEl, html);
            if (!insertedEl) return { ok: false, error: 'insert' };
            helpers.renderAuthorRecallBlock?.(insertedEl);
            helpers.markNewAuthorWidget?.(insertedEl, {
                confirmed: false,
                findingId: insertOpts.findingId,
                findingRunId: insertOpts.findingRunId
            });
            return { ok: true, insertedEl };
        }

        const actionId = resolvedPayload.widgetActionId
            || SCAN_TO_ACTION[scanId]
            || scanId;
        const config = helpers.pedagogyWidgetActions?.[actionId];
        if (!config) return { ok: false, error: 'unknown_action' };

        const formatId = resolvedPayload.formatId
            || insertOpts.formatId
            || '';
        const contentResult = typeof finding.demoHydrateContent === 'string'
            ? finding.demoHydrateContent
            : String(finding.demoHydrateContent || '');

        const fields = buildPedagogyFieldsFromCache(
            actionId,
            formatId,
            contentResult,
            insertOpts.openingPrompt || '',
            helpers
        );

        const goalBundle = helpers.buildAuthorWidgetGoalBundle
            ? helpers.buildAuthorWidgetGoalBundle(actionId, formatId, sourceText, insertOpts, fields.displayContent || contentResult)
            : { goal: finding.title || '', authorNote: '' };

        const hintText = global.DreamBookModuleFormats?.buildHintText
            ? global.DreamBookModuleFormats.buildHintText(actionId, formatId, sourceText)
            : '';

        const html = helpers.buildPedagogyAuthorBlockHtml({
            blockId,
            type: config.type,
            goal: goalBundle.goal,
            authorNote: goalBundle.authorNote || '',
            openingPrompt: fields.openingPrompt,
            difficulty: 'moderate',
            maxTurns: helpers.defaultWidgetMaxTurns || 3,
            actionId,
            generatedContent: fields.displayContent || contentResult,
            sourcePassage: sourceText,
            questionLadder: fields.questionLadder,
            scenarioHook: fields.scenarioHook,
            socraticTitle: fields.socraticTitle,
            formatId,
            hintText,
            isDraft: true,
            findingId: insertOpts.findingId || '',
            findingRunId: insertOpts.findingRunId || '',
            expandBody: true
        });

        const insertedEl = helpers.replaceEditorBlockWithHtml(placeholderEl, html);
        if (!insertedEl) return { ok: false, error: 'insert' };
        insertedEl.id = blockId;
        helpers.markNewAuthorWidget?.(insertedEl, {
            confirmed: false,
            findingId: insertOpts.findingId,
            findingRunId: insertOpts.findingRunId
        });
        return { ok: true, insertedEl };
    }

    global.DreamBookChapterEnhancementsDemo = {
        DEMO_FLAG,
        DEMO_SESSION_KEY,
        DEMO_PEER_NOTES,
        captureDemoPeerReviewFromUrl,
        isDemoPeerReviewEnabled,
        demoSleep,
        getDemoPeerNotes,
        buildDemoBandSpecs,
        buildCuratedChapterEnhancementFindings,
        runStagedDemoAnalysisProgress,
        applyDemoCachedHydrate,
        MIN_CACHE_SPINNER_MS
    };
})(typeof window !== 'undefined' ? window : globalThis);
