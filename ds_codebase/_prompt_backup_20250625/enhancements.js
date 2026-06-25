/**
 * DreamBook Enhancement Capabilities
 * Scan configs, proposal generation, Recall Check + Illustrate helpers.
 * Wired from editor.html via window.DreamBookEnhancements
 */
(function (global) {
    'use strict';

    const ENHANCEMENT_SCAN_TOOLS = [
        {
            id: 'scan_illustrate',
            title: 'Illustrate scan',
            icon: 'compare_arrows',
            accent: 'amber',
            description: 'Find passages that need an everyday analogy or a news connection.',
            actionIds: ['illustrate-analogy', 'illustrate-news']
        },
        {
            id: 'scan_socratic',
            title: 'Socratic scan',
            icon: 'psychology_alt',
            accent: 'emerald',
            description: 'Find concepts where students should explain ideas in their own words.',
            widgetActionId: 'socratic-question'
        },
        {
            id: 'scan_counter',
            title: 'Counter-argument scan',
            icon: 'forum',
            accent: 'rose',
            description: 'Find compare/contrast or debatable claims worth challenging.',
            widgetActionId: 'opposing-view'
        },
        {
            id: 'scan_case_study',
            title: 'Case study scan',
            icon: 'cases',
            accent: 'violet',
            description: 'Find sections where application scenarios would deepen understanding.',
            widgetActionId: 'mini-case-study'
        },
        {
            id: 'scan_explain_peer',
            title: 'Explain to a peer scan',
            icon: 'school',
            accent: 'sky',
            description: 'Find definitions and core mechanisms suited to Feynman-style teaching.',
            widgetActionId: 'explain-to-peer'
        },
        {
            id: 'scan_simulation',
            title: 'Simulation scan',
            icon: 'science',
            accent: 'cyan',
            description: 'Find process-heavy passages suited to interactive manipulation.',
            capability: 'simulation_upgrade'
        },
        {
            id: 'scan_recall',
            title: 'Recall check scan',
            icon: 'quiz',
            accent: 'orange',
            description: 'Find terms, lists, and sequences worth retrieval practice.',
            recallFormats: ['mcq', 'match', 'order']
        }
    ];

    const ILLUSTRATE_STYLES = {
        analogy: {
            id: 'illustrate-analogy',
            label: 'Everyday analogy',
            icon: 'compare_arrows',
            accent: 'amber',
            promptSuffix: `Generate one clear everyday analogy that explains the main concept in the SOURCE PASSAGE.

Before writing, silently identify: (1) the core concept, (2) key parts and how they relate, (3) the best analogy domain for this mechanism, (4) mappings that could mislead students.

Choose the analogy domain dynamically — factory, kitchen, school, library, delivery network, office, construction site, hospital, farm, or another familiar setting. Pick the best fit; do not default to city or generic house unless it truly fits.

Return ONLY this structure (plain text, no markdown bold):

ANALOGY TITLE:
A short, student-friendly title.

THE ANALOGY:
1–3 short paragraphs mapping relationships from the passage — not just label swaps.

CONCEPT MAPPING:
4–7 lines in this format:
Textbook term → Analogy part → Why this comparison works

WHERE THE ANALOGY BREAKS DOWN:
1–2 bullets on imperfect comparisons so students do not take it too literally.

ONE-LINE TAKEAWAY:
One sentence capturing what students should remember.

Rules: Use the SOURCE PASSAGE as truth — name at least two specific terms from it in THE ANALOGY. Map relationships (e.g. information flow, compartment roles), not parallel lists. If the passage mentions mRNA translation, ribosomes read messenger RNA (mRNA) to build proteins — do NOT call rRNA a protein blueprint. The nucleolus helps make/assemble ribosomal RNA and ribosome parts. Do NOT use concerts, bands, phone apps, Lego cities, superheroes, or generic chef-kitchen clichés. Do NOT start with "Imagine".`
        },
        news: {
            id: 'illustrate-news',
            label: 'Real-World Application',
            icon: 'newspaper',
            accent: 'blue',
            promptSuffix: `Create a Real-World Application block grounded in the SOURCE PASSAGE.

Before writing, silently identify: (1) the main passage concept the example actually illustrates, (2) the real-world problem or discovery, (3) the simplest accurate explanation for the student level, (4) the implication for what students just studied, (5) which passage terms are supported, (6) which major passage terms are NOT covered.

Do not reveal this analysis.

RULES:
- This is NOT trivia, NOT a research abstract, and NOT a full case study.
- Pick ONE concept from the passage — do not imply the example covers the whole section.
- Preserve why the recent event is exciting, but translate it for students.
- Include a date ONLY if it appears in the NEWS EXCERPT below — do not invent dates, institutions, or findings.
- Do NOT say "this connects to the textbook", "the passage says", or "as discussed above".
- Do NOT use "Imagine", metaphors, analogies, or banned clichés.
- STUDENT VIEW: 2–4 natural sentences in plain language.
- THINK ABOUT IT: one short reflective question tied to the concept.

Return ONLY this structure (plain text, no markdown bold):

TITLE:
A short, student-friendly title.

STUDENT VIEW:
2–4 sentences explaining why this concept matters in the real world.

THINK ABOUT IT:
One short reflective question for the student.

AUTHOR NOTE:
Concept illustrated:
Passage terms used:
Not covered:
Why this example was chosen:
Verification status:`
        }
    };

    const OBJECTIVE_LABELS = {
        clarity: 'Conceptual clarity',
        retention: 'Retention',
        critical_thinking: 'Critical thinking',
        application: 'Application'
    };

    /** Default pedagogical objective when no peer-review finding supplies objectiveTag */
    const WIDGET_DEFAULT_OBJECTIVES = {
        illustrate: 'retention',
        'socratic-question': 'clarity',
        'opposing-view': 'critical_thinking',
        'mini-case-study': 'application',
        'explain-to-peer': 'clarity'
    };

    function getDefaultObjectiveTag(moduleKey) {
        return WIDGET_DEFAULT_OBJECTIVES[moduleKey] || 'clarity';
    }

    /** Pedagogical outcome groups for peer-review enhancement checklist */
    const PEDAGOGICAL_GOAL_GROUPS = {
        understand: {
            id: 'understand',
            label: 'Understand',
            description: 'Help students grasp core ideas in their own words'
        },
        remember: {
            id: 'remember',
            label: 'Remember',
            description: 'Strengthen recall and connect ideas to familiar contexts'
        },
        challenge: {
            id: 'challenge',
            label: 'Challenge',
            description: 'Stress-test claims and compare alternative views'
        },
        apply: {
            id: 'apply',
            label: 'Apply',
            description: 'Transfer concepts through scenarios and interaction'
        }
    };

    const SCAN_PEDAGOGICAL_GOALS = {
        scan_socratic: 'understand',
        scan_explain_peer: 'understand',
        scan_illustrate: 'remember',
        scan_recall: 'remember',
        scan_counter: 'challenge',
        scan_case_study: 'apply',
        scan_simulation: 'apply'
    };

    function getScanPedagogicalGoal(scanId) {
        return SCAN_PEDAGOGICAL_GOALS[scanId] || 'understand';
    }

    function getPedagogicalGoalLabel(goalId) {
        return PEDAGOGICAL_GOAL_GROUPS[goalId]?.label || goalId;
    }

    const NECESSITY_ORDER = { essential: 0, recommended: 1, optional: 2 };

    function escapeHtml(str) {
        if (global.escapeHtml) return global.escapeHtml(str);
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function normalizeText(str) {
        return String(str || '').replace(/\s+/g, ' ').trim();
    }

    function sectionLooksAbstract(text) {
        const t = normalizeText(text).toLowerCase();
        return /\b(process|mechanism|pathway|theory|model|transport|synthesis|respiration|photosynthesis|signal|endosymbiotic|diffusion|osmosis|membrane|gradient)\b/.test(t);
    }

    const SCAN_TARGET_CONFIG = {
        scan_illustrate: { min: 2, max: 5, effort: 1.0, matchType: 'abstract' },
        scan_recall: { min: 2, max: 4, effort: 1.0, matchType: 'recall' },
        scan_socratic: { min: 2, max: 4, effort: 1.2, matchType: 'socratic' },
        scan_explain_peer: { min: 1, max: 4, effort: 1.2, matchType: 'definitional' },
        scan_counter: { min: 1, max: 3, effort: 1.3, matchType: 'comparative' },
        scan_case_study: { min: 1, max: 2, effort: 2.0, matchType: 'caseStudy' },
        scan_simulation: { min: 1, max: 1, effort: 3.0, matchType: 'simulation' }
    };

    const SCAN_PRIORITY_BOOST = { essential: 1.2, recommended: 1.0, optional: 0.85 };

    function clampScanTarget(n, min, max) {
        return Math.min(max, Math.max(min, n));
    }

    function getScanMaxProposals(scanId) {
        return SCAN_TARGET_CONFIG[scanId]?.max ?? 5;
    }

    function getSectionBodyText(section) {
        return (section?.blocks || []).filter(b => !b.isHeading).map(b => b.text).join(' ');
    }

    function countEligibleSections(outlineMeta, excludedSet) {
        if (!outlineMeta?.sections) return 0;
        return outlineMeta.sections.filter(s => !isSectionExcluded(s.heading, excludedSet)).length;
    }

    function sectionMatchesScanType(text, matchType) {
        const t = normalizeText(text);
        if (!t) return false;
        switch (matchType) {
            case 'abstract':
                return sectionLooksAbstract(t);
            case 'comparative':
                return sectionLooksComparative(t);
            case 'definitional':
                return sectionLooksDefinitional(t);
            case 'socratic':
                return sectionLooksAbstract(t) || sectionLooksDefinitional(t);
            case 'recall':
                return sectionLooksDefinitional(t) || sectionLooksSequential(t)
                    || /\b(list|four|three|five|types of|components|terms)\b/i.test(t);
            case 'caseStudy':
                return sectionLooksAbstract(t) && t.length > 120;
            case 'simulation':
                return /\b(transport|membrane|osmosis|diffusion|gradient|force|motion|graph|cell cycle|process|variable)\b/i.test(t);
            default:
                return true;
        }
    }

    function countMatchingSections(outlineMeta, excludedSet, matchType) {
        if (!outlineMeta?.sections) return 0;
        let count = 0;
        outlineMeta.sections.forEach(s => {
            if (isSectionExcluded(s.heading, excludedSet)) return;
            if (sectionMatchesScanType(getSectionBodyText(s), matchType)) count++;
        });
        return count;
    }

    function countAbstractEligibleSections(outlineMeta, excludedSet) {
        return countMatchingSections(outlineMeta, excludedSet, 'abstract');
    }

    function getScanPriorityBoost(peerReviewContext, scanId) {
        const entry = peerReviewContext?.suggestedScans?.find(s => s.scanId === scanId);
        return SCAN_PRIORITY_BOOST[entry?.priority] ?? 1.0;
    }

    function computeScanProposalTargets(outlineMeta, scanId, excludedSet, peerReviewContext) {
        const cfg = SCAN_TARGET_CONFIG[scanId];
        if (!cfg) return { target: 1, max: 1, min: 1 };

        const eligible = Math.max(countEligibleSections(outlineMeta, excludedSet), 1);
        const matchCount = countMatchingSections(outlineMeta, excludedSet, cfg.matchType);
        const density = matchCount / eligible;
        const lengthFactor = clampScanTarget(eligible / 6, 0.5, 1.5);
        const goalBoost = getScanPriorityBoost(peerReviewContext, scanId);

        if (scanId === 'scan_illustrate') {
            const abstractCount = countAbstractEligibleSections(outlineMeta, excludedSet);
            const target = clampScanTarget(
                cfg.min,
                cfg.max,
                Math.ceil(Math.max(abstractCount, 2) / 2)
            );
            const minAnalogy = Math.max(1, Math.floor(target / 2));
            const minNews = Math.max(1, target - minAnalogy);
            return { target, max: cfg.max, min: cfg.min, minAnalogy, minNews, matchCount, eligible };
        }

        const rawTarget = (lengthFactor * Math.max(density, 0.15) * goalBoost) / cfg.effort;
        const target = clampScanTarget(cfg.min, cfg.max, Math.round(rawTarget));

        return { target, max: cfg.max, min: cfg.min, matchCount, eligible };
    }

    function normalizePayloadFormatId(scanId, payload) {
        if (!payload) return payload;
        const actionId = payload.widgetActionId;
        if (global.DreamBookModuleFormats && actionId) {
            const fmtId = global.DreamBookModuleFormats.normalizeFormatId(payload.formatId, actionId);
            if (fmtId) payload.formatId = fmtId;
        }
        if (scanId === 'scan_illustrate' && payload.illustrateStyle && !payload.formatId) {
            payload.formatId = payload.illustrateStyle;
        }
        return payload;
    }

    function coerceIllustrateStyle(raw) {
        const s = String(raw || '').trim().toLowerCase();
        if (!s) return 'analogy';
        if (s === 'news' || s === 'illustrate-news' || /real.?world|in.the.news|headline/.test(s)) return 'news';
        if (s === 'analogy' || s === 'illustrate-analogy' || /everyday|analog|compare/.test(s)) return 'analogy';
        return 'analogy';
    }

    function payloadLooksIllustrate(payload) {
        if (!payload) return false;
        const wa = String(payload.widgetActionId || payload.widget_action_id || '').toLowerCase();
        return !!(payload.illustrateStyle || payload.illustrate_style || wa.includes('illustrate'));
    }

    function normalizeIllustratePayload(payload) {
        const next = { ...(payload || {}) };
        const rawStyle = next.illustrateStyle || next.illustrate_style
            || (String(next.widgetActionId || next.widget_action_id || '').includes('news') ? 'news' : null)
            || next.formatId;
        const style = coerceIllustrateStyle(rawStyle);
        next.illustrateStyle = style;
        next.widgetActionId = style === 'news' ? 'illustrate-news' : 'illustrate-analogy';
        next.formatId = style;
        delete next.illustrate_style;
        delete next.widget_action_id;
        return next;
    }

    function prioritizeSelectionsBySectionSpread(selections, menuById, chapterSectionCounts) {
        if (!selections?.length || !chapterSectionCounts) return selections || [];
        return [...selections].sort((a, b) => {
            const sa = normalizeText(menuById.get(a.candidateId)?.sectionHeading).toLowerCase();
            const sb = normalizeText(menuById.get(b.candidateId)?.sectionHeading).toLowerCase();
            return (chapterSectionCounts.get(sa) || 0) - (chapterSectionCounts.get(sb) || 0);
        });
    }

    function sectionLooksComparative(text) {
        const t = normalizeText(text).toLowerCase();
        return /\b(compare|contrast|versus|vs\.|difference|prokaryot|eukaryot|primary|secondary|plant|animal)\b/.test(t);
    }

    function sectionLooksSequential(text) {
        const t = normalizeText(text).toLowerCase();
        return /\b(step|sequence|process of|first|then|finally|transcription|translation|secretion|cycle)\b/.test(t);
    }

    function sectionLooksDefinitional(text) {
        const t = normalizeText(text).toLowerCase();
        return /\b(is defined|refers to|known as|called|term|principle|means)\b/.test(t);
    }

    function buildStrategicPeerReviewSummary(ctx) {
        const headings = ctx.sectionHeadings || [];
        const grade = ctx.gradeLevel || 'Class 9-10';
        const excerpts = headings.map(h => ({
            heading: h,
            text: ctx.getSectionExcerpt ? ctx.getSectionExcerpt(h, 400) : h
        }));

        const gaps = [];
        const strengths = [];
        const suggestedScans = [];

        if (headings.length >= 5) strengths.push('clear sectional structure students can navigate');
        else gaps.push('section structure could be clearer for self-paced reading');

        const abstractSections = excerpts.filter(e => sectionLooksAbstract(e.text));
        const compareSections = excerpts.filter(e => sectionLooksComparative(e.text));
        const sequentialSections = excerpts.filter(e => sectionLooksSequential(e.text));
        const definitionalSections = excerpts.filter(e => sectionLooksDefinitional(e.text));

        if (abstractSections.length >= 3) {
            gaps.push('several abstract process sections may need illustration or simulation');
            suggestedScans.push({ scanId: 'scan_illustrate', reason: 'Ground abstract mechanisms in relatable examples.', priority: 'essential' });
            suggestedScans.push({ scanId: 'scan_simulation', reason: 'Let students manipulate variables in process-heavy sections.', priority: 'recommended' });
        }

        if (compareSections.length) {
            gaps.push('compare/contrast passages would benefit from counter-argument checkpoints');
            suggestedScans.push({ scanId: 'scan_counter', reason: 'Stress-test comparisons students often memorize without understanding.', priority: 'recommended' });
        }

        if (definitionalSections.length) {
            suggestedScans.push({ scanId: 'scan_explain_peer', reason: 'Core terms need Feynman-style explanation practice.', priority: 'recommended' });
            suggestedScans.push({ scanId: 'scan_recall', reason: 'Terms and lists are suited to retrieval checks.', priority: 'recommended' });
        }

        if (sequentialSections.length) {
            suggestedScans.push({ scanId: 'scan_recall', reason: 'Multi-step processes need ordering practice.', priority: 'essential' });
            suggestedScans.push({ scanId: 'scan_socratic', reason: 'Walk students through why each step matters.', priority: 'recommended' });
        }

        if (abstractSections.length >= 2) {
            suggestedScans.push({ scanId: 'scan_case_study', reason: 'Application scenarios help transfer beyond the textbook.', priority: 'optional' });
        }

        suggestedScans.push({ scanId: 'scan_socratic', reason: 'Confirm understanding at natural pause points.', priority: 'optional' });

        const uniqueScans = ensureAllScanFeedback(suggestedScans);

        return {
            headline: gaps.length
                ? 'Solid foundation — interactive practice and clarity need attention'
                : 'Strong chapter — targeted enhancements can raise retention',
            strength: strengths.length
                ? `Your chapter shows ${strengths.join(' and ')} for ${grade} readers.`
                : `The chapter covers core material appropriate for ${grade} readers.`,
            gap: gaps.length
                ? `A peer reviewer would flag: ${gaps.slice(0, 3).join('; ')}.`
                : 'Minor polish on engagement and retrieval practice would strengthen classroom readiness.',
            focus: `Select enhancement scans in Findings below, then run analysis to generate placement proposals.`,
            suggestedScans: uniqueScans,
            excludedSections: mergeExcludedSections(headings, []),
            expanded: false
        };
    }

    function makeProposal(opts) {
        return {
            findingId: opts.findingId || ('ep-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)),
            capability: 'enhancement_proposal',
            scanId: opts.scanId,
            severity: opts.necessity === 'essential' ? 'critical' : (opts.necessity === 'optional' ? 'optional' : 'recommended'),
            necessity: opts.necessity || 'recommended',
            objectiveTag: opts.objectiveTag || 'clarity',
            sectionHeading: opts.sectionHeading,
            afterBlockId: opts.afterBlockId || '',
            anchorQuote: opts.anchorQuote || '',
            displayPassage: opts.displayPassage || '',
            bandSourceText: opts.bandSourceText || opts.displayPassage || '',
            title: opts.title,
            rationale: opts.rationale,
            placementNote: opts.placementNote || '',
            bandId: opts.bandId || '',
            bandBlockIds: opts.bandBlockIds || [],
            tier: opts.tier || 'major',
            downgradeNote: opts.downgradeNote || '',
            content: '',
            payload: opts.payload || {},
            action: 'insert_after',
            status: opts.status || 'pending',
            suggestedScenarioId: opts.suggestedScenarioId || '',
            suggestedPrompt: opts.suggestedPrompt || ''
        };
    }

    function normalizeScanProposal(raw, scanId) {
        const payload = raw.payload || {};
        let normalizedPayload = { ...payload };
        if (scanId === 'scan_illustrate' || payloadLooksIllustrate(payload)) {
            normalizedPayload = normalizeIllustratePayload(normalizedPayload);
        } else if (payload.recall_format || payload.recallFormat) {
            normalizedPayload.recallFormat = payload.recall_format || payload.recallFormat;
            normalizedPayload.widgetActionId = 'recall-check';
        } else if (payload.widget_action_id) {
            normalizedPayload.widgetActionId = payload.widget_action_id;
        }
        if (payload.recall_format) normalizedPayload.recallFormat = payload.recall_format;
        if (payload.simulation_type) normalizedPayload.simulationType = payload.simulation_type;
        if (payload.phet_id) normalizedPayload.phetId = payload.phet_id;
        if (payload.format_id || payload.formatId) {
            normalizedPayload.formatId = payload.format_id || payload.formatId;
        }
        if (scanId === 'scan_recall' && !normalizedPayload.widgetActionId) {
            normalizedPayload.widgetActionId = 'recall-check';
        }
        const scanDef = ENHANCEMENT_SCAN_TOOLS.find(t => t.id === scanId);
        if (scanDef?.widgetActionId && !normalizedPayload.widgetActionId && scanId !== 'scan_illustrate' && scanId !== 'scan_recall') {
            normalizedPayload.widgetActionId = scanDef.widgetActionId;
        }
        if (scanId === 'scan_illustrate' || payloadLooksIllustrate(normalizedPayload)) {
            normalizedPayload = normalizeIllustratePayload(normalizedPayload);
        }
        return {
            sectionHeading: (raw.section_heading || raw.sectionHeading || '').trim(),
            afterBlockId: (raw.after_block_id || raw.afterBlockId || '').trim(),
            anchorQuote: (raw.anchor_quote || raw.anchorQuote || '').trim(),
            rationale: (raw.rationale || '').trim(),
            necessity: raw.necessity || 'recommended',
            objectiveTag: raw.objective_tag || raw.objectiveTag || 'clarity',
            title: (raw.title || 'Enhancement proposal').trim(),
            payload: normalizedPayload
        };
    }

    function isGenericRationale(rationale, sectionHeading) {
        const r = normalizeText(rationale).toLowerCase();
        if (r.length < 40) return true;
        const sectionTerms = normalizeText(sectionHeading).toLowerCase().split(/\s+/).filter(w => w.length > 4);
        const hasSectionRef = sectionTerms.some(t => r.includes(t));
        const genericPatterns = [
            /students may struggle to visualize/,
            /students should explain the core idea/,
            /connect abstract mechanisms/,
            /natural pause point$/
        ];
        if (genericPatterns.some(p => p.test(r)) && !hasSectionRef) return true;
        return false;
    }

    function quoteInBlockText(anchorQuote, blockText) {
        if (!anchorQuote?.trim() || !blockText) return false;
        const q = normalizeText(anchorQuote).toLowerCase();
        const t = normalizeText(blockText).toLowerCase();
        return t.includes(q);
    }

    const EXCLUDED_SECTION_PATTERNS = [
        /\bintroduction to\b/i,
        /\bintroductory\b/i,
        /\bintro to\b/i,
        /^[\d.]+\s*introduction\b/i,
        /\bchapter overview\b/i,
        /\boverview of\b/i,
        /\bpreface\b/i,
        /\bforeword\b/i,
        /\bprologue\b/i,
        /\bchapter summary\b/i,
        /\bhistorical overview\b/i,
        /\bhistory of\b/i,
        /\bbackground only\b/i
    ];

    function headingLooksExcludedByKeyword(heading) {
        const h = normalizeText(heading || '');
        return EXCLUDED_SECTION_PATTERNS.some(pattern => pattern.test(h));
    }

    function buildHeuristicExcludedSections(headings) {
        return (headings || []).filter(headingLooksExcludedByKeyword).map(heading => ({
            sectionHeading: heading,
            reason: 'Introductory, historical, or background section — poor target for interactive checkpoints.'
        }));
    }

    function mergeExcludedSections(headings, fromLlm) {
        const byKey = new Map();
        (fromLlm || []).forEach(entry => {
            const heading = entry.sectionHeading || entry.section_heading || entry.heading || '';
            if (!heading?.trim()) return;
            byKey.set(normalizeText(heading).toLowerCase(), {
                sectionHeading: heading,
                reason: entry.reason || ''
            });
        });
        buildHeuristicExcludedSections(headings).forEach(entry => {
            const key = normalizeText(entry.sectionHeading).toLowerCase();
            if (!byKey.has(key)) byKey.set(key, entry);
        });
        return Array.from(byKey.values());
    }

    function buildExcludedSectionSet(headings, excludedSections) {
        const merged = mergeExcludedSections(headings, excludedSections);
        return new Set(merged.map(e => normalizeText(e.sectionHeading).toLowerCase()));
    }

    function isSectionExcluded(sectionHeading, excludedSet) {
        if (!sectionHeading || !excludedSet?.size) return false;
        return excludedSet.has(normalizeText(sectionHeading).toLowerCase());
    }

    function getEligibleSectionHeadings(outlineMeta, excludedSet) {
        const headings = outlineMeta?.sections?.map(s => s.heading) || [];
        const eligible = headings.filter(h => !isSectionExcluded(h, excludedSet));
        return eligible.length ? eligible : headings;
    }

    function pickFallbackTargetHeading(outlineMeta, peerReviewContext, excludedSet) {
        const eligible = getEligibleSectionHeadings(outlineMeta, excludedSet);
        let targetHeading = eligible.length >= 3
            ? eligible[Math.floor(eligible.length / 2)]
            : eligible[eligible.length - 1];
        if (peerReviewContext?.scanReason) {
            const reason = peerReviewContext.scanReason.toLowerCase();
            const match = eligible.find(h => {
                const lower = h.toLowerCase();
                return reason.includes(lower.slice(0, 12))
                    || lower.split(/\s+/).some(w => w.length > 4 && reason.includes(w));
            });
            if (match) targetHeading = match;
        }
        return targetHeading;
    }

    function validateAndRankProposals(rawList, outlineMeta, scanId, options) {
        if (!outlineMeta?.blockIndex || !Array.isArray(rawList)) return [];
        const headings = outlineMeta.sections?.map(s => s.heading) || [];
        const excludedSet = options?.excludedSections
            || buildExcludedSectionSet(headings, options?.excludedSectionList);
        const valid = [];
        rawList.forEach(raw => {
            const n = normalizeScanProposal(raw, scanId);
            if (!n.sectionHeading) return;
            if (isSectionExcluded(n.sectionHeading, excludedSet)) return;
            const blockMeta = outlineMeta.blockIndex[n.afterBlockId];
            if (!blockMeta || blockMeta.isHeading) return;
            if (blockMeta.sectionHeading !== n.sectionHeading &&
                normalizeText(blockMeta.sectionHeading).toLowerCase() !== normalizeText(n.sectionHeading).toLowerCase()) {
                return;
            }
            if (!quoteInBlockText(n.anchorQuote, blockMeta.text)) return;
            if (isGenericRationale(n.rationale, n.sectionHeading)) return;
            const section = outlineMeta.sections.find(s =>
                normalizeText(s.heading).toLowerCase() === normalizeText(n.sectionHeading).toLowerCase()
            );
            const bodyBlocks = section?.blocks?.filter(b => !b.isHeading) || [];
            if (bodyBlocks.length >= 3 && blockMeta.bodyIndex === 0 && n.necessity !== 'essential') return;
            valid.push(makeProposal({
                scanId,
                necessity: n.necessity,
                objectiveTag: n.objectiveTag,
                sectionHeading: blockMeta.sectionHeading || n.sectionHeading,
                afterBlockId: n.afterBlockId,
                anchorQuote: n.anchorQuote,
                displayPassage: blockMeta.text.slice(0, 400),
                title: n.title,
                rationale: n.rationale,
                payload: normalizePayloadFormatId(scanId, n.payload)
            }));
        });
        valid.sort((a, b) => (NECESSITY_ORDER[a.necessity] ?? 9) - (NECESSITY_ORDER[b.necessity] ?? 9));
        const maxProposals = options?.maxProposals ?? getScanMaxProposals(scanId);
        return valid.slice(0, maxProposals);
    }

    function dedupeFormatProposals(proposals, scanId, targetMin) {
        if (!proposals?.length) return proposals;
        if (scanId === 'scan_illustrate') return proposals;
        const actionId = proposals[0]?.payload?.widgetActionId;
        if (!actionId || !global.DreamBookModuleFormats) return proposals;

        const minKeep = Math.max(1, targetMin || 1);
        const seenFormats = new Set();
        const kept = [];
        const duplicates = [];

        proposals.forEach(p => {
            const fmt = p.payload?.formatId || p.payload?.illustrateStyle;
            if (!fmt) {
                kept.push(p);
                return;
            }
            const key = String(fmt).toLowerCase();
            if (!seenFormats.has(key)) {
                seenFormats.add(key);
                kept.push(p);
            } else {
                duplicates.push(p);
            }
        });

        while (kept.length < minKeep && duplicates.length) {
            kept.push(duplicates.shift());
        }
        return kept;
    }

    function enforceIllustrateMix(proposals, targets) {
        if (!targets?.minAnalogy || !proposals?.length) return proposals;
        const analogy = proposals.filter(p => (p.payload?.illustrateStyle || p.payload?.formatId) === 'analogy');
        const news = proposals.filter(p => (p.payload?.illustrateStyle || p.payload?.formatId) === 'news');
        if (analogy.length >= targets.minAnalogy && news.length >= targets.minNews) return proposals;
        return proposals;
    }

    function buildInsertionCandidateMenu(outlineMeta, excludedSet, options) {
        const usedBlockIds = options?.usedBlockIds || null;
        const menu = [];
        let idx = 1;
        (outlineMeta?.sections || []).forEach(section => {
            if (isSectionExcluded(section.heading, excludedSet)) return;
            const bodyBlocks = section.blocks.filter(b => !b.isHeading);
            bodyBlocks.forEach((block, bodyIndex) => {
                if (bodyBlocks.length >= 3 && bodyIndex === 0) return;
                if (usedBlockIds?.has(block.blockId)) return;
                const text = normalizeText(block.text);
                if (!text || text.length < 40) return;
                menu.push({
                    candidateId: 'C' + idx,
                    blockId: block.blockId,
                    sectionHeading: block.sectionHeading || section.heading,
                    excerpt: text.length > 280 ? text.slice(0, 280) + '…' : text,
                    bodyIndex,
                    bodyCount: bodyBlocks.length
                });
                idx++;
            });
        });
        return menu;
    }

    function formatCandidateMenuText(menu) {
        return (menu || []).map(c =>
            `${c.candidateId} | ${c.sectionHeading} | paragraph ${c.bodyIndex + 1} of ${c.bodyCount}\n    "${c.excerpt}"`
        ).join('\n\n');
    }

    function normalizeCandidateSelections(rawList) {
        if (!Array.isArray(rawList)) return [];
        return rawList.map(raw => {
            let candidateId = String(raw.candidate_id || raw.candidateId || '').trim().toUpperCase();
            if (candidateId && !candidateId.startsWith('C')) candidateId = 'C' + candidateId.replace(/^C/i, '');
            const payload = raw.payload || {};
            let normalizedPayload = { ...payload };
            if (payloadLooksIllustrate(payload)) {
                normalizedPayload = normalizeIllustratePayload(normalizedPayload);
            } else if (payload.recall_format || payload.recallFormat) {
                normalizedPayload.recallFormat = payload.recall_format || payload.recallFormat;
                normalizedPayload.widgetActionId = 'recall-check';
            } else if (payload.widget_action_id) {
                normalizedPayload.widgetActionId = payload.widget_action_id;
            }
            if (payload.format_id || payload.formatId) {
                normalizedPayload.formatId = payload.format_id || payload.formatId;
            }
            return {
                candidateId,
                title: (raw.title || '').trim(),
                rationale: (raw.rationale || '').trim(),
                necessity: raw.necessity || 'recommended',
                objectiveTag: raw.objective_tag || raw.objectiveTag || 'clarity',
                payload: normalizedPayload
            };
        }).filter(s => s.candidateId);
    }

    function proposalsFromCandidateSelections(scanId, selections, menuById, outlineMeta, targets, options) {
        const scanDef = ENHANCEMENT_SCAN_TOOLS.find(t => t.id === scanId);
        const perSectionCap = scanId === 'scan_case_study' || scanId === 'scan_counter' ? 1 : 2;
        const sectionCounts = {};
        const proposals = [];
        const orderedSelections = prioritizeSelectionsBySectionSpread(
            selections, menuById, options?.chapterSectionCounts
        );

        (orderedSelections || []).forEach(sel => {
            if (proposals.length >= (targets?.max ?? 5)) return;
            const entry = menuById.get(sel.candidateId);
            if (!entry) return;
            const blockMeta = outlineMeta.blockIndex?.[entry.blockId];
            if (!blockMeta || blockMeta.isHeading) return;
            const sectionKey = normalizeText(entry.sectionHeading).toLowerCase();
            sectionCounts[sectionKey] = sectionCounts[sectionKey] || 0;
            if (sectionCounts[sectionKey] >= perSectionCap) return;
            if (!sel.rationale || sel.rationale.length < 25) return;
            if (isGenericRationale(sel.rationale, entry.sectionHeading)) return;

            let payload = normalizePayloadFormatId(scanId, { ...sel.payload });
            if (scanId === 'scan_illustrate') {
                payload = normalizeIllustratePayload(payload.illustrateStyle ? payload : { ...payload, illustrateStyle: 'analogy' });
            } else if (scanId === 'scan_recall' && !payload.recallFormat) {
                payload.recallFormat = 'mcq';
                payload.widgetActionId = 'recall-check';
            } else if (scanDef?.widgetActionId && !payload.widgetActionId && scanId !== 'scan_illustrate') {
                payload.widgetActionId = scanDef.widgetActionId;
            }

            proposals.push(makeProposal({
                scanId,
                necessity: sel.necessity,
                objectiveTag: sel.objectiveTag,
                sectionHeading: blockMeta.sectionHeading || entry.sectionHeading,
                afterBlockId: entry.blockId,
                anchorQuote: anchorQuoteFromBlockText(blockMeta.text),
                displayPassage: blockMeta.text.slice(0, 400),
                title: sel.title || scanDef?.title?.replace(/ scan$/i, '') || 'Enhancement',
                rationale: sel.rationale,
                payload
            }));
            sectionCounts[sectionKey]++;
        });

        let results = dedupeFormatProposals(proposals, scanId, targets?.min ?? 1);
        if (scanId === 'scan_illustrate') {
            results = enforceIllustrateMix(results, targets);
        }
        return results.slice(0, targets?.max ?? getScanMaxProposals(scanId));
    }

    function pickMidSectionBlock(outlineMeta, sectionHeading) {
        const section = findSectionInOutline(outlineMeta, sectionHeading);
        if (!section) return null;
        const bodyBlocks = section.blocks.filter(b => !b.isHeading);
        if (!bodyBlocks.length) return null;
        if (bodyBlocks.length === 1) return bodyBlocks[0];
        const midIdx = Math.floor(bodyBlocks.length / 2);
        return bodyBlocks[midIdx] || bodyBlocks[bodyBlocks.length - 1];
    }

    function buildFallbackProposalForSection(scanId, outlineMeta, sectionHeading, block, peerReviewContext) {
        if (!block) return null;
        const scanDef = ENHANCEMENT_SCAN_TOOLS.find(t => t.id === scanId);
        const payload = {};
        if (scanId === 'scan_illustrate') {
            payload.illustrateStyle = 'analogy';
            payload.widgetActionId = 'illustrate-analogy';
        } else if (scanId === 'scan_recall') {
            payload.recallFormat = 'mcq';
            payload.widgetActionId = 'recall-check';
        } else if (scanId === 'scan_simulation') {
            payload.simulationType = 'phet';
            payload.phetId = 'membrane-transport';
        } else if (scanDef?.widgetActionId) {
            payload.widgetActionId = scanDef.widgetActionId;
            const fmtIds = global.DreamBookModuleFormats?.listFormatIds?.(scanDef.widgetActionId) || [];
            if (fmtIds.length) payload.formatId = fmtIds[0];
        }
        const anchorQuote = block.text.split(/[.!?]/)[0]?.trim().slice(0, 80) || block.text.slice(0, 60);
        return makeProposal({
            scanId,
            necessity: 'recommended',
            objectiveTag: 'clarity',
            sectionHeading: block.sectionHeading || sectionHeading,
            afterBlockId: block.blockId,
            anchorQuote,
            displayPassage: block.text.slice(0, 400),
            title: scanDef?.title?.replace(/ scan$/i, '') || 'Enhancement',
            rationale: `After the core explanation in ${sectionHeading}, a ${scanDef?.description?.toLowerCase() || 'checkpoint'} helps students consolidate before moving on. (Best available placement.)`,
            payload,
            placementNote: 'fallback'
        });
    }

    function buildFallbackProposal(scanId, outlineMeta, peerReviewContext) {
        const headings = outlineMeta.sections.map(s => s.heading);
        const excludedSet = buildExcludedSectionSet(headings, peerReviewContext?.excludedSections);
        const targetHeading = pickFallbackTargetHeading(outlineMeta, peerReviewContext, excludedSet);
        const block = pickMidSectionBlock(outlineMeta, targetHeading);
        return buildFallbackProposalForSection(scanId, outlineMeta, targetHeading, block, peerReviewContext);
    }

    function ensureMinScanProposals(scanId, outlineMeta, peerReviewContext, proposals, targets, chapterSectionCounts) {
        const minTarget = targets?.min ?? 1;
        const maxCap = targets?.max ?? getScanMaxProposals(scanId);
        let results = Array.isArray(proposals) ? [...proposals] : [];
        if (results.length >= minTarget) return results.slice(0, maxCap);

        const headings = outlineMeta?.sections?.map(s => s.heading) || [];
        const excludedSet = buildExcludedSectionSet(headings, peerReviewContext?.excludedSections);
        const cfg = SCAN_TARGET_CONFIG[scanId];
        const eligible = getEligibleSectionHeadings(outlineMeta, excludedSet);
        const usedSections = new Set(results.map(p => normalizeText(p.sectionHeading).toLowerCase()));

        const rankedHeadings = eligible
            .map(h => ({
                heading: h,
                text: getSectionBodyText(outlineMeta.sections.find(s =>
                    normalizeText(s.heading).toLowerCase() === normalizeText(h).toLowerCase())),
                chapterCount: chapterSectionCounts?.get(normalizeText(h).toLowerCase()) || 0
            }))
            .filter(entry => cfg ? sectionMatchesScanType(entry.text, cfg.matchType) : true)
            .sort((a, b) => a.chapterCount - b.chapterCount)
            .map(entry => entry.heading);

        const pool = rankedHeadings.length ? rankedHeadings : eligible;
        let pass = 0;
        while (results.length < minTarget && pass < pool.length + 1) {
            const heading = pool[pass % Math.max(pool.length, 1)];
            pass++;
            if (!heading) break;
            const key = normalizeText(heading).toLowerCase();
            if (usedSections.has(key)) continue;
            const block = pickMidSectionBlock(outlineMeta, heading);
            const proposal = buildFallbackProposalForSection(scanId, outlineMeta, heading, block, peerReviewContext);
            if (!proposal) continue;
            results.push(proposal);
            usedSections.add(key);
        }

        if (!results.length) {
            const single = buildFallbackProposal(scanId, outlineMeta, peerReviewContext);
            if (single) results.push(single);
        }
        return results.slice(0, maxCap);
    }

    function findSectionInOutline(outlineMeta, sectionHeading) {
        if (!outlineMeta?.sections || !sectionHeading) return null;
        const key = normalizeText(sectionHeading).toLowerCase();
        const exact = outlineMeta.sections.find(s => normalizeText(s.heading).toLowerCase() === key);
        if (exact) return exact;
        const numMatch = key.match(/^(\d+(?:\.\d+)*)/);
        if (numMatch) {
            const escaped = numMatch[1].replace(/\./g, '\\.');
            const byNum = outlineMeta.sections.filter(s =>
                new RegExp(`^${escaped}(\\b|\\s|$)`).test(normalizeText(s.heading).toLowerCase())
            );
            if (byNum.length === 1) return byNum[0];
            if (byNum.length > 1) {
                return byNum.find(s => normalizeText(s.heading).toLowerCase() === key) || byNum[0];
            }
        }
        const titleOnly = key.replace(/^\d+(?:\.\d+)*\s*[-–—:.]?\s*/, '').trim();
        if (titleOnly) {
            const byTitle = outlineMeta.sections.filter(s => {
                const sh = normalizeText(s.heading).toLowerCase();
                return sh.includes(titleOnly) || titleOnly.includes(sh.replace(/^\d+(?:\.\d+)*\s*/, '').trim());
            });
            if (byTitle.length === 1) return byTitle[0];
        }
        return null;
    }

    function anchorQuoteFromBlockText(text) {
        const normalized = normalizeText(text);
        if (!normalized) return '';
        const sentenceMatch = normalized.match(/^[^.!?]+[.!?]/);
        let quote = sentenceMatch ? sentenceMatch[0].trim() : normalized;
        if (quote.length > 80) {
            quote = quote.slice(0, 80).trim();
            const lastSpace = quote.lastIndexOf(' ');
            if (lastSpace > 40) quote = quote.slice(0, lastSpace);
        }
        if (quote.length < 20 && normalized.length > quote.length) {
            quote = normalized.slice(0, Math.min(60, normalized.length)).trim();
            const lastSpace = quote.lastIndexOf(' ');
            if (lastSpace > 20) quote = quote.slice(0, lastSpace);
        }
        return quote;
    }

    function blockEntryMatchesSection(blockEntry, sectionHeading) {
        if (!blockEntry || !sectionHeading) return false;
        return normalizeText(blockEntry.sectionHeading).toLowerCase()
            === normalizeText(sectionHeading).toLowerCase();
    }

    function resolveProposalPlacement(proposal, outlineMeta) {
        if (!proposal || !outlineMeta?.blockIndex) return proposal;
        const section = findSectionInOutline(outlineMeta, proposal.sectionHeading);
        if (!section) return proposal;

        const existing = proposal.afterBlockId ? outlineMeta.blockIndex[proposal.afterBlockId] : null;
        if (existing && !existing.isHeading && blockEntryMatchesSection(existing, proposal.sectionHeading)) {
            proposal.anchorQuote = anchorQuoteFromBlockText(existing.text);
            proposal.displayPassage = existing.text.slice(0, 400);
            return proposal;
        }

        const block = pickMidSectionBlock(outlineMeta, proposal.sectionHeading);
        if (!block) return proposal;

        proposal.afterBlockId = block.blockId;
        proposal.anchorQuote = anchorQuoteFromBlockText(block.text);
        proposal.displayPassage = block.text.slice(0, 400);
        if (!proposal.sectionHeading) proposal.sectionHeading = block.sectionHeading;
        return proposal;
    }

    function dedupeProposalsBySection(proposals, maxPerSection) {
        const cap = Math.max(1, maxPerSection || 1);
        const bySection = {};
        proposals.forEach(p => {
            const key = normalizeText(p.sectionHeading).toLowerCase();
            if (!bySection[key]) bySection[key] = [];
            bySection[key].push(p);
        });
        const kept = [];
        Object.values(bySection).forEach(list => {
            list.sort((a, b) => (NECESSITY_ORDER[a.necessity] ?? 9) - (NECESSITY_ORDER[b.necessity] ?? 9));
            kept.push(...list.slice(0, cap));
        });
        kept.sort((a, b) => (NECESSITY_ORDER[a.necessity] ?? 9) - (NECESSITY_ORDER[b.necessity] ?? 9));
        return kept;
    }

    function finalizeScanProposals(scanId, proposals, outlineMeta, peerReviewContext, options) {
        if (!outlineMeta?.blockIndex) return proposals || [];
        const headings = outlineMeta.sectionHeadings
            || outlineMeta.sections?.map(s => s.heading)
            || [];
        const excludedSet = options?.excludedSections
            || buildExcludedSectionSet(headings, peerReviewContext?.excludedSections);
        const targets = options?.targets
            || computeScanProposalTargets(outlineMeta, scanId, excludedSet, peerReviewContext);
        const perSectionCap = scanId === 'scan_case_study' || scanId === 'scan_counter' ? 1 : 2;

        let results = (proposals || [])
            .filter(p => p?.sectionHeading && !isSectionExcluded(p.sectionHeading, excludedSet))
            .map(p => resolveProposalPlacement({ ...p, scanId: p.scanId || scanId }, outlineMeta));

        results = dedupeProposalsBySection(results, perSectionCap);
        results = dedupeFormatProposals(results, scanId, targets.min);
        if (scanId === 'scan_illustrate') {
            results = enforceIllustrateMix(results, targets);
        }
        if (results.length > targets.target) {
            results = applyClusteringGuardrail(results, outlineMeta, 1);
        }
        results = results.slice(0, targets.max);
        if (!options?.skipMinFill) {
            results = ensureMinScanProposals(scanId, outlineMeta, peerReviewContext, results, targets);
            if (scanId === 'scan_illustrate') {
                results = enforceIllustrateMix(results, targets);
            }
        }
        return results.slice(0, targets.max);
    }

    function applyClusteringGuardrail(proposals, outlineMeta, maxPerSection) {
        const cap = maxPerSection ?? 2;
        const bySection = {};
        proposals.forEach(p => {
            const key = normalizeText(p.sectionHeading).toLowerCase();
            if (!bySection[key]) bySection[key] = [];
            bySection[key].push(p);
        });
        const kept = [];
        Object.values(bySection).forEach(list => {
            list.sort((a, b) => (NECESSITY_ORDER[a.necessity] ?? 9) - (NECESSITY_ORDER[b.necessity] ?? 9));
            let count = 0;
            list.forEach(p => {
                if (p.necessity === 'essential' || count < cap) {
                    kept.push(p);
                    count++;
                }
            });
        });
        const orderMap = {};
        (outlineMeta?.sections || []).forEach((s, i) => {
            orderMap[normalizeText(s.heading).toLowerCase()] = i;
        });
        kept.sort((a, b) => {
            const sa = orderMap[normalizeText(a.sectionHeading).toLowerCase()] ?? 999;
            const sb = orderMap[normalizeText(b.sectionHeading).toLowerCase()] ?? 999;
            return sa - sb || (NECESSITY_ORDER[a.necessity] ?? 9) - (NECESSITY_ORDER[b.necessity] ?? 9);
        });
        return kept;
    }

    function dedupCrossScan(proposals) {
        const byAnchor = new Map();
        proposals.forEach(p => {
            const key = `${p.afterBlockId}|${p.payload?.widgetActionId || p.scanId}`;
            const existing = byAnchor.get(key);
            if (!existing || (NECESSITY_ORDER[p.necessity] ?? 9) < (NECESSITY_ORDER[existing.necessity] ?? 9)) {
                byAnchor.set(key, p);
            }
        });
        return Array.from(byAnchor.values());
    }

    function ensureMinOneProposalPerScan(merged, allProposals, scanIds) {
        const result = [...merged];
        scanIds.forEach(scanId => {
            if (result.some(p => p.scanId === scanId)) return;
            const candidate = allProposals.find(p => p.scanId === scanId);
            if (candidate) result.push(candidate);
        });
        return result;
    }

    function ensureAllScanFeedback(suggestedScans) {
        const byId = new Map();
        (suggestedScans || []).forEach(s => {
            if (s.scanId && ENHANCEMENT_SCAN_TOOLS.some(t => t.id === s.scanId)) {
                byId.set(s.scanId, s);
            }
        });
        return ENHANCEMENT_SCAN_TOOLS.map(tool => {
            const existing = byId.get(tool.id);
            if (existing?.reason?.trim()) return existing;
            return {
                scanId: tool.id,
                reason: existing?.reason?.trim()
                    || `Review ${tool.title.replace(/ scan$/i, '').toLowerCase()} opportunities — ${tool.description.charAt(0).toLowerCase()}${tool.description.slice(1)}`,
                priority: existing?.priority || 'optional'
            };
        });
    }

    function normalizePeerReviewSummary(parsed, outlineHeadings) {
        const fromLlm = (parsed.suggested_scans || parsed.suggestedScans || []).map(s => ({
            scanId: s.scan_id || s.scanId,
            reason: s.chapter_specific_reason || s.reason || '',
            priority: s.priority || 'recommended'
        })).filter(s => ENHANCEMENT_SCAN_TOOLS.some(t => t.id === s.scanId));

        const fromLlmExcluded = (parsed.excluded_sections || parsed.excludedSections || []).map(e => ({
            sectionHeading: e.section_heading || e.sectionHeading || e.heading || '',
            reason: e.reason || ''
        })).filter(e => e.sectionHeading);

        return {
            headline: parsed.headline || 'Chapter review complete',
            strength: Array.isArray(parsed.strengths)
                ? parsed.strengths.join(' ')
                : (parsed.strength || ''),
            gap: Array.isArray(parsed.gaps)
                ? parsed.gaps.join(' ')
                : (parsed.gap || ''),
            focus: parsed.focus || '',
            suggestedScans: ensureAllScanFeedback(fromLlm),
            excludedSections: mergeExcludedSections(outlineHeadings || [], fromLlmExcluded),
            expanded: false
        };
    }

    function buildEnhancementScanFindings(scanId, ctx) {
        const headings = ctx.sectionHeadings || [];
        const excludedSet = buildExcludedSectionSet(headings, ctx.excludedSections);
        const proposals = [];
        const usedAnchors = new Set();

        function pushOnce(proposal) {
            const key = `${proposal.sectionHeading}|${proposal.payload?.widgetActionId || proposal.payload?.illustrateStyle || proposal.payload?.recallFormat || proposal.scanId}`;
            if (usedAnchors.has(key)) return;
            usedAnchors.add(key);
            proposals.push(proposal);
        }

        headings.forEach((heading, i) => {
            if (isSectionExcluded(heading, excludedSet)) return;
            const excerpt = ctx.getSectionExcerpt ? ctx.getSectionExcerpt(heading, 500) : heading;
            const anchorQuote = ctx.getAnchorQuote ? ctx.getAnchorQuote(heading) : excerpt.slice(0, 80);
            const displayPassage = ctx.getDisplayPassage ? ctx.getDisplayPassage(heading) : excerpt.slice(0, 200);

            if (scanId === 'scan_illustrate' && sectionLooksAbstract(excerpt)) {
                pushOnce(makeProposal({
                    scanId,
                    necessity: i === 0 ? 'essential' : 'recommended',
                    objectiveTag: 'clarity',
                    sectionHeading: heading,
                    anchorQuote,
                    displayPassage,
                    title: 'Add everyday analogy',
                    rationale: `Students may struggle to visualize ${heading}. An analogy here connects abstract mechanisms to something familiar.`,
                    payload: { illustrateStyle: 'analogy', widgetActionId: 'illustrate-analogy' }
                }));
                if (/\b(news|recent|current|application|industry|health|climate)\b/i.test(excerpt)) {
                    pushOnce(makeProposal({
                        scanId,
                        necessity: 'optional',
                        objectiveTag: 'application',
                        sectionHeading: heading,
                        anchorQuote,
                        displayPassage,
                        title: 'Connect to the news',
                        rationale: `This section touches real-world impact — a news-linked example would show why ${heading} matters now.`,
                        payload: { illustrateStyle: 'news', widgetActionId: 'illustrate-news' }
                    }));
                }
            }

            if (scanId === 'scan_socratic' && (sectionLooksAbstract(excerpt) || sectionLooksDefinitional(excerpt))) {
                pushOnce(makeProposal({
                    scanId,
                    necessity: sectionLooksDefinitional(excerpt) ? 'essential' : 'recommended',
                    objectiveTag: 'critical_thinking',
                    sectionHeading: heading,
                    anchorQuote,
                    displayPassage,
                    title: 'Socratic checkpoint',
                    rationale: `Students should explain the core idea in ${heading} in their own words before moving on.`,
                    payload: { widgetActionId: 'socratic-question' }
                }));
            }

            if (scanId === 'scan_counter' && sectionLooksComparative(excerpt)) {
                pushOnce(makeProposal({
                    scanId,
                    necessity: 'recommended',
                    objectiveTag: 'critical_thinking',
                    sectionHeading: heading,
                    anchorQuote,
                    displayPassage,
                    title: 'Counter-argument checkpoint',
                    rationale: `Comparison language in ${heading} invites a fair opposing view so students defend or refine their understanding.`,
                    payload: { widgetActionId: 'opposing-view' }
                }));
            }

            if (scanId === 'scan_case_study' && sectionLooksAbstract(excerpt) && excerpt.length > 120) {
                pushOnce(makeProposal({
                    scanId,
                    necessity: 'recommended',
                    objectiveTag: 'application',
                    sectionHeading: heading,
                    anchorQuote,
                    displayPassage,
                    title: 'Mini case study',
                    rationale: `${heading} describes mechanisms that students should apply in a realistic scenario.`,
                    payload: { widgetActionId: 'mini-case-study' }
                }));
            }

            if (scanId === 'scan_explain_peer' && sectionLooksDefinitional(excerpt)) {
                pushOnce(makeProposal({
                    scanId,
                    necessity: 'essential',
                    objectiveTag: 'retention',
                    sectionHeading: heading,
                    anchorQuote,
                    displayPassage,
                    title: 'Explain to a peer',
                    rationale: `Key terms in ${heading} are best retained when students teach them aloud to a curious peer.`,
                    payload: { widgetActionId: 'explain-to-peer' }
                }));
            }

            if (scanId === 'scan_simulation' && /\b(transport|membrane|osmosis|diffusion|gradient|force|motion|graph|cell cycle)\b/i.test(excerpt)) {
                pushOnce(makeProposal({
                    scanId,
                    necessity: 'recommended',
                    objectiveTag: 'application',
                    sectionHeading: heading,
                    anchorQuote,
                    displayPassage,
                    title: 'Interactive simulation',
                    rationale: `${heading} describes relationships students grasp faster by manipulating variables interactively.`,
                    payload: { simulationType: 'phet', phetId: /membrane|transport/i.test(excerpt) ? 'membrane-transport' : null }
                }));
            }

            if (scanId === 'scan_recall') {
                if (sectionLooksDefinitional(excerpt) || /\b(list|four|three|five|types of|components)\b/i.test(excerpt)) {
                    pushOnce(makeProposal({
                        scanId,
                        necessity: 'recommended',
                        objectiveTag: 'retention',
                        sectionHeading: heading,
                        anchorQuote,
                        displayPassage,
                        title: 'Match terms',
                        rationale: `Terminology in ${heading} is suited to a match-the-column recall check.`,
                        payload: { recallFormat: 'match', widgetActionId: 'recall-check' }
                    }));
                }
                if (sectionLooksSequential(excerpt)) {
                    pushOnce(makeProposal({
                        scanId,
                        necessity: 'essential',
                        objectiveTag: 'retention',
                        sectionHeading: heading,
                        anchorQuote,
                        displayPassage,
                        title: 'Order the steps',
                        rationale: `The sequence in ${heading} should be reinforced by ordering steps from memory.`,
                        payload: { recallFormat: 'order', widgetActionId: 'recall-check' }
                    }));
                }
                if (sectionLooksAbstract(excerpt)) {
                    pushOnce(makeProposal({
                        scanId,
                        necessity: 'recommended',
                        objectiveTag: 'retention',
                        sectionHeading: heading,
                        anchorQuote,
                        displayPassage,
                        title: 'Quick check (MCQ)',
                        rationale: `A short MCQ after ${heading} confirms students caught the main idea.`,
                        payload: { recallFormat: 'mcq', widgetActionId: 'recall-check' }
                    }));
                }
            }
        });

        proposals.sort((a, b) => (NECESSITY_ORDER[a.necessity] ?? 9) - (NECESSITY_ORDER[b.necessity] ?? 9));
        return proposals;
    }

    function buildDemoEnhancementProposals(scanId, demoSpecs, ctx) {
        if (!demoSpecs?.length) return [];
        const mapScanToCapability = {
            scan_illustrate: ['analogy_insert', 'real_world_example'],
            scan_socratic: ['pedagogy_widget'],
            scan_counter: ['opposing_view'],
            scan_case_study: ['mini_case_study'],
            scan_explain_peer: ['explain_peer'],
            scan_simulation: ['simulation_upgrade'],
            scan_recall: ['recall_check']
        };
        const caps = mapScanToCapability[scanId] || [];
        return demoSpecs
            .filter(spec => {
                if (scanId === 'scan_illustrate') return spec.capability === 'analogy_insert' || spec.capability === 'real_world_example';
                if (scanId === 'scan_socratic') return spec.capability === 'pedagogy_widget';
                if (scanId === 'scan_simulation') return spec.capability === 'simulation_upgrade';
                if (scanId === 'scan_counter') return spec.capability === 'opposing_view';
                if (scanId === 'scan_case_study') return spec.capability === 'mini_case_study';
                if (scanId === 'scan_recall') return spec.capability === 'recall_check';
                return false;
            })
            .map((spec, i) => {
                const heading = ctx.resolveDemoSection ? ctx.resolveDemoSection(spec.sectionPatterns, spec.fallbackPatterns) : null;
                if (!heading) return null;
                const payload = { ...(spec.payload || {}) };
                if (scanId === 'scan_illustrate') {
                    payload.illustrateStyle = spec.capability === 'analogy_insert' ? 'analogy' : 'news';
                    payload.widgetActionId = payload.illustrateStyle === 'analogy' ? 'illustrate-analogy' : 'illustrate-news';
                }
                if (scanId === 'scan_socratic') payload.widgetActionId = 'socratic-question';
                if (scanId === 'scan_counter') payload.widgetActionId = 'opposing-view';
                if (scanId === 'scan_case_study') payload.widgetActionId = 'mini-case-study';
                if (scanId === 'scan_explain_peer') payload.widgetActionId = 'explain-to-peer';
                if (scanId === 'scan_recall') payload.recallFormat = spec.payload?.recallFormat || 'mcq';
                const anchorQuote = spec.anchorQuote
                    || (ctx.getAnchorQuote ? ctx.getAnchorQuote(heading) : '');
                let afterBlockId = spec.afterBlockId || '';
                if (!afterBlockId && ctx.resolveDemoBlockId) {
                    afterBlockId = ctx.resolveDemoBlockId(heading, anchorQuote);
                }
                let displayPassage = spec.displayPassage
                    || (ctx.getDisplayPassage ? ctx.getDisplayPassage(heading) : '');
                if (afterBlockId && ctx.getBlockText) {
                    const blockText = ctx.getBlockText(afterBlockId);
                    if (blockText) displayPassage = blockText.slice(0, 400);
                }
                return makeProposal({
                    scanId,
                    findingId: 'demo-ep-' + scanId + '-' + i,
                    necessity: spec.severity === 'critical' ? 'essential' : 'recommended',
                    objectiveTag: 'clarity',
                    sectionHeading: heading,
                    afterBlockId,
                    anchorQuote,
                    displayPassage,
                    title: spec.title,
                    rationale: spec.rationale || `Demo placement for ${heading}.`,
                    payload
                });
            })
            .filter(Boolean);
    }

    const RECALL_FORMAT_ORDER = ['mcq', 'match', 'order'];
    const RECALL_TYPE_LABELS = { mcq: 'MCQ', match: 'Match', order: 'Order' };
    const RECALL_TYPE_HEADERS = { mcq: 'Multiple choice', match: 'Match terms', order: 'Order steps' };
    const RECALL_MAX_BUNDLE_TOTAL = 10;
    const RECALL_MAX_MATCH_PAIRS = 5;

    function validateRecallBundleConfig(config) {
        const mcq = Math.max(0, parseInt(config?.mcq, 10) || 0);
        const match = Math.max(0, parseInt(config?.match, 10) || 0);
        const order = Math.max(0, parseInt(config?.order, 10) || 0);
        const total = mcq + match + order;
        const errors = [];
        if (total === 0) errors.push('Select at least one exercise type.');
        if (total > RECALL_MAX_BUNDLE_TOTAL) errors.push(`Maximum ${RECALL_MAX_BUNDLE_TOTAL} exercises across all types.`);
        return { ok: errors.length === 0, total, mcq, match, order, errors };
    }

    function getRecallLearningContext(sourceText, editorState) {
        const outlineMeta = editorState?.chapterOutlineMeta;
        let sectionHeading = normalizeText(editorState?.sectionHeading || '');
        if (outlineMeta && sectionHeading) {
            sectionHeading = resolvePrimarySectionHeading(sectionHeading, outlineMeta) || sectionHeading;
        }
        const section = findSectionInOutline(outlineMeta, sectionHeading);
        let learningObjective = 'retention';
        let coreConcept = '';

        const bandsApi = global.DreamBookEnhancementBands;
        if (bandsApi?.buildMajorSectionBands && outlineMeta) {
            const bands = bandsApi.buildMajorSectionBands(outlineMeta, new Set());
            const shKey = normalizeText(sectionHeading).toLowerCase();
            const band = bands.find(b => {
                const label = normalizeText(b.label).toLowerCase();
                return label === shKey || shKey.includes(label) || label.includes(shKey);
            });
            const diag = band && editorState?.diagnosisByBand?.[band.bandId];
            if (diag) {
                learningObjective = diag.learning_objective || diag.learningObjective || learningObjective;
                coreConcept = diag.core_concept || diag.coreConcept || coreConcept;
            }
        }

        if (!coreConcept && section?.heading) {
            coreConcept = topicFromSectionHeading(section.heading);
        } else if (!coreConcept && sectionHeading) {
            coreConcept = topicFromSectionHeading(sectionHeading);
        }

        return {
            sectionHeading: sectionHeading || section?.heading || '',
            learningObjective,
            coreConcept: coreConcept || learningObjective,
            grade: editorState?.gradeLevel || 'undergraduate'
        };
    }

    function singleQuestionMcqPayload(q) {
        return {
            format: 'mcq',
            questions: [{
                prompt: q.prompt || q.question || '',
                options: q.options || [],
                correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
                explanation: q.explanation || ''
            }]
        };
    }

    function buildMockRecallPayloadForIndex(format, sourceText, typeIndex, learningContext) {
        const topic = normalizeText(sourceText).split(/[.!?]/)[0].slice(0, 60) || 'this section';
        const lo = learningContext?.coreConcept || learningContext?.learningObjective || 'the main idea';
        if (format === 'mcq') {
            const prompts = [
                `Which statement best captures the main idea of: "${topic}"?`,
                `According to the passage, which is most accurate about ${lo}?`,
                `Which answer is best supported by the selected passage?`
            ];
            const prompt = prompts[(typeIndex - 1) % prompts.length];
            return singleQuestionMcqPayload({
                prompt,
                options: [
                    'It describes a core mechanism students must understand.',
                    'It is unrelated to the rest of the chapter.',
                    'It only applies to plant cells.',
                    'It contradicts the fluid mosaic model.'
                ],
                correctIndex: 0,
                explanation: 'The passage focuses on a mechanism central to this section.'
            });
        }
        if (format === 'match') {
            const allPairs = [
                { term: 'Cytosol', definition: 'Fluid inside the cell excluding organelles' },
                { term: 'Cytoplasm', definition: 'Cytosol plus organelles and structures' },
                { term: 'Gap junction', definition: 'Channel connecting adjacent animal cells' },
                { term: 'Plasma membrane', definition: 'Selective barrier around the cell' },
                { term: 'Nucleus', definition: 'Organelle containing genetic material' }
            ];
            const pairCount = Math.min(RECALL_MAX_MATCH_PAIRS, 3 + ((typeIndex - 1) % 3));
            return {
                format: 'match',
                pairs: allPairs.slice(0, pairCount)
            };
        }
        if (format === 'order') {
            const prompts = [
                'Order the steps of protein synthesis and secretion:',
                'Order the stages described in the passage:',
                'Put the process steps in the correct sequence:'
            ];
            return {
                format: 'order',
                prompt: prompts[(typeIndex - 1) % prompts.length],
                steps: [
                    'Transcription in the nucleus',
                    'Translation on ribosomes',
                    'Modification in the rough ER',
                    'Sorting in the Golgi apparatus',
                    'Secretion via exocytosis'
                ]
            };
        }
        return { format: 'mcq', questions: [] };
    }

    function buildMockRecallBundle(config, sourceText, learningContext) {
        const validated = validateRecallBundleConfig(config);
        if (!validated.ok) return [];
        const exercises = [];
        RECALL_FORMAT_ORDER.forEach(format => {
            const count = validated[format] || 0;
            for (let i = 1; i <= count; i++) {
                exercises.push({
                    format,
                    typeIndex: i,
                    payload: buildMockRecallPayloadForIndex(format, sourceText, i, learningContext)
                });
            }
        });
        return exercises;
    }

    function buildRecallBundlePrompt(config, sourceText, learningContext) {
        const validated = validateRecallBundleConfig(config);
        const specs = [];
        RECALL_FORMAT_ORDER.forEach(format => {
            const count = validated[format] || 0;
            for (let i = 1; i <= count; i++) {
                if (format === 'mcq') {
                    specs.push(`- MCQ ${i}: one question with prompt, 4 options, correctIndex (0-3), explanation`);
                } else if (format === 'match') {
                    specs.push(`- Match ${i}: 3-${RECALL_MAX_MATCH_PAIRS} term/definition pairs`);
                } else {
                    specs.push(`- Order ${i}: prompt plus 4-6 ordered steps`);
                }
            }
        });
        const loLine = learningContext?.learningObjective
            ? `Learning objective: ${learningContext.learningObjective}.`
            : '';
        const conceptLine = learningContext?.coreConcept
            ? ` Core concept: ${learningContext.coreConcept}.`
            : '';
        const sectionLine = learningContext?.sectionHeading
            ? ` Section: ${learningContext.sectionHeading}.`
            : '';
        const userPrompt = `From this passage, create recall exercises grounded ONLY in the text.${sectionLine}${loLine}${conceptLine}

Grade level: ${learningContext?.grade || 'undergraduate'}.

Create exactly these exercises:
${specs.join('\n')}

Passage:
${sourceText}

Return JSON:
{
  "exercises": [
    { "format": "mcq", "typeIndex": 1, "prompt": "...", "options": ["..."], "correctIndex": 0, "explanation": "..." },
    { "format": "match", "typeIndex": 1, "pairs": [{ "term": "...", "definition": "..." }] },
    { "format": "order", "typeIndex": 1, "prompt": "...", "steps": ["..."] }
  ]
}`;
        const systemPrompt = `You create short recall checks for a biology textbook. Use only facts from the passage. Match counts and formats exactly. Match exercises: max ${RECALL_MAX_MATCH_PAIRS} pairs. Return valid JSON only.`;
        return { systemPrompt, userPrompt };
    }

    function normalizeRecallExercise(raw) {
        if (!raw || !raw.format) return null;
        const format = String(raw.format).toLowerCase();
        const typeIndex = Math.max(1, parseInt(raw.typeIndex, 10) || 1);
        if (format === 'mcq') {
            const payload = raw.payload || singleQuestionMcqPayload(raw);
            if (!payload.questions?.[0]?.prompt) return null;
            return { format: 'mcq', typeIndex, payload: { format: 'mcq', questions: [payload.questions[0]] } };
        }
        if (format === 'match') {
            const pairs = (raw.pairs || raw.payload?.pairs || []).slice(0, RECALL_MAX_MATCH_PAIRS);
            if (pairs.length < 2) return null;
            return { format: 'match', typeIndex, payload: { format: 'match', pairs } };
        }
        if (format === 'order') {
            const steps = raw.steps || raw.payload?.steps || [];
            if (steps.length < 2) return null;
            return {
                format: 'order',
                typeIndex,
                payload: {
                    format: 'order',
                    prompt: raw.prompt || raw.payload?.prompt || 'Put the steps in the correct order.',
                    steps
                }
            };
        }
        return null;
    }

    function normalizeRecallBundle(raw, config) {
        const validated = validateRecallBundleConfig(config);
        if (!validated.ok) return [];
        const expected = {};
        RECALL_FORMAT_ORDER.forEach(format => { expected[format] = validated[format] || 0; });

        let items = raw?.exercises || raw?.items || [];
        if (!items.length && Array.isArray(raw)) items = raw;

        const byKey = {};
        items.forEach(item => {
            const ex = normalizeRecallExercise(item);
            if (!ex) return;
            const key = `${ex.format}:${ex.typeIndex}`;
            if (!byKey[key]) byKey[key] = ex;
        });

        const result = [];
        RECALL_FORMAT_ORDER.forEach(format => {
            for (let i = 1; i <= (expected[format] || 0); i++) {
                const key = `${format}:${i}`;
                if (byKey[key]) {
                    result.push(byKey[key]);
                }
            }
        });
        return result;
    }

    function getRecallTypeSublabel(format, typeIndex) {
        const prefix = RECALL_TYPE_LABELS[format] || String(format).toUpperCase();
        return `${prefix} ${typeIndex}`;
    }

    /** Mock recall payloads when API unavailable */
    function buildMockRecallPayload(format, sourceText) {
        const topic = normalizeText(sourceText).split(/[.!?]/)[0].slice(0, 60) || 'this section';
        if (format === 'mcq') {
            return {
                format: 'mcq',
                questions: [{
                    prompt: `Which statement best captures the main idea of: "${topic}"?`,
                    options: [
                        'It describes a core mechanism students must understand.',
                        'It is unrelated to the rest of the chapter.',
                        'It only applies to plant cells.',
                        'It contradicts the fluid mosaic model.'
                    ],
                    correctIndex: 0,
                    explanation: 'The passage focuses on a mechanism central to this section.'
                }]
            };
        }
        if (format === 'match') {
            return {
                format: 'match',
                pairs: [
                    { term: 'Cytosol', definition: 'Fluid inside the cell excluding organelles' },
                    { term: 'Cytoplasm', definition: 'Cytosol plus organelles and structures' },
                    { term: 'Gap junction', definition: 'Channel connecting adjacent animal cells' }
                ]
            };
        }
        if (format === 'order') {
            return {
                format: 'order',
                prompt: 'Order the steps of protein synthesis and secretion:',
                steps: [
                    'Transcription in the nucleus',
                    'Translation on ribosomes',
                    'Modification in the rough ER',
                    'Sorting in the Golgi apparatus',
                    'Secretion via exocytosis'
                ]
            };
        }
        return { format: 'mcq', questions: [] };
    }

    function stripMarkdownFromSocraticText(text) {
        return String(text || '')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/^["']|["']$/g, '')
            .trim();
    }

    function sanitizeSocraticParsed(parsed) {
        const scenarioHook = stripMarkdownFromSocraticText(parsed?.scenarioHook || parsed?.hook || '');
        const questions = (parsed?.questions || []).map(stripMarkdownFromSocraticText).filter(Boolean);
        return {
            title: stripMarkdownFromSocraticText(parsed?.title || ''),
            scenarioHook,
            hook: scenarioHook,
            questions,
            authorNote: stripMarkdownFromSocraticText(parsed?.authorNote || ''),
            misconception: stripMarkdownFromSocraticText(parsed?.misconception || ''),
            evidenceUsed: stripMarkdownFromSocraticText(parsed?.evidenceUsed || ''),
            takeaway: stripMarkdownFromSocraticText(parsed?.takeaway || '')
        };
    }

    function parseSocraticLadder(content) {
        return parseSocraticContent(content).questions;
    }

    function parseSocraticContent(content) {
        const mf = global.DreamBookModuleFormats;
        if (mf?.parseSocraticStructuredContent) {
            const structured = mf.parseSocraticStructuredContent(content);
            if (structured.structured && (structured.questions?.length >= 3 || (structured.hook && structured.questions?.length >= 1))) {
                return sanitizeSocraticParsed(structured);
            }
        }
        const text = String(content || '').trim();
        let scenarioHook = '';
        let questionText = text;
        const scenarioLine = text.match(/^SCENARIO:\s*(.+?)(?:\n|$)/i);
        if (scenarioLine) {
            scenarioHook = scenarioLine[1].trim();
            questionText = text.slice(scenarioLine[0].length).trim();
        } else {
            const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
            const firstNum = lines.findIndex(l => /^\d+[\.)]\s/.test(l));
            if (firstNum > 0) {
                scenarioHook = lines.slice(0, firstNum).join(' ').replace(/^SCENARIO:\s*/i, '').trim();
                questionText = lines.slice(firstNum).join('\n');
            }
        }
        scenarioHook = stripMarkdownFromSocraticText(scenarioHook.replace(/\?\s*$/, '').trim());
        const questions = [];
        const lines = String(questionText).split('\n').map(l => l.trim()).filter(Boolean);
        lines.forEach(l => {
            const q = stripMarkdownFromSocraticText(l.replace(/^\d+[\.)]\s*/, '').trim()).replace(/\s+/g, ' ').trim();
            if (q.length > 10 && (q.includes('?') || questions.length < 3)) questions.push(q);
        });
        if (questions.length < 3) {
            String(questionText).split(/(?<=\?)\s+/).forEach(part => {
                const q = stripMarkdownFromSocraticText(part.trim()).replace(/\s+/g, ' ').trim();
                if (q.includes('?') && q.length > 12 && questions.length < 3) questions.push(q);
            });
        }
        return sanitizeSocraticParsed({ scenarioHook, questions: questions.slice(0, 3) });
    }

    function parseExplainPeerContent(content) {
        const mf = global.DreamBookModuleFormats;
        if (mf?.parseExplainPeerContent) {
            const parsed = mf.parseExplainPeerContent(content);
            if (parsed.structured && parsed.samSays && parsed.questions?.length >= 3) {
                return {
                    title: parsed.title || '',
                    samSays: parsed.samSays || '',
                    task: parsed.task || '',
                    scenarioHook: parsed.samSays || '',
                    hook: parsed.samSays || '',
                    questions: parsed.questions.slice(0, 3),
                    authorNote: parsed.authorNote || '',
                    misconception: parsed.misconception || '',
                    evidenceUsed: parsed.evidenceUsed || '',
                    requiredExample: parsed.requiredExample || '',
                    takeaway: parsed.takeaway || '',
                    structured: true
                };
            }
            return parsed;
        }
        return { title: '', samSays: '', task: '', scenarioHook: '', questions: [], structured: false };
    }

    function renderRecallStudentHtml(blockId, payload, status, recallResult) {
        const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
        if (!data) return '';
        const isFinished = status === 'completed' || status === 'skipped';
        const result = recallResult && recallResult.format ? recallResult : null;

        function renderFeedback() {
            if (result && (isFinished || status === 'engaged')) {
                const cls = result.isCorrect ? 'correct' : 'incorrect';
                return `<div class="rc-feedback ${cls}">${escapeHtml(result.feedbackMessage || '')}</div>`;
            }
            return `<div class="rc-feedback hidden"></div>`;
        }

        function renderSubmit(label) {
            return isFinished ? '' : `<button type="button" class="rc-submit-btn" data-block-id="${blockId}">${label}</button>`;
        }

        if (data.format === 'mcq') {
            const q = data.questions[0];
            const selectedIndex = result?.selectedIndex;
            const correctIndex = result?.correctIndex ?? q?.correctIndex;
            const opts = (q.options || []).map((opt, i) => {
                const classes = ['rc-mcq-option'];
                if (selectedIndex === i) classes.push('rc-selected');
                if (isFinished && result) {
                    if (i === selectedIndex && result.isCorrect) classes.push('rc-correct');
                    else if (i === selectedIndex && !result.isCorrect) classes.push('rc-incorrect');
                    else if (i === correctIndex && !result.isCorrect) classes.push('rc-correct');
                }
                const checked = selectedIndex === i ? 'checked' : '';
                const disabled = isFinished ? 'disabled' : '';
                return `<label class="${classes.join(' ')}"><input type="radio" name="rc-${blockId}" value="${i}" ${checked} ${disabled}/> ${escapeHtml(opt)}</label>`;
            }).join('');

            let summaryHtml = '';
            if (isFinished && result && selectedIndex >= 0 && q.options?.[selectedIndex]) {
                summaryHtml = `<div class="rc-result-summary">Your answer: ${escapeHtml(q.options[selectedIndex])}</div>`;
            }

            return `<div class="rc-body" data-recall-id="${blockId}">
                <p class="rc-prompt">${escapeHtml(q.prompt)}</p>
                <div class="rc-mcq-options">${opts}</div>
                ${summaryHtml}
                ${renderFeedback()}
                ${renderSubmit('Check answer')}
            </div>`;
        }
        if (data.format === 'match') {
            const pairs = data.pairs || [];
            const matchedIndices = new Set(result?.matchedPairIndices || []);
            if (isFinished && result?.isCorrect) {
                pairs.forEach((_, i) => matchedIndices.add(i));
            }
            const terms = pairs.map((p, i) => {
                const classes = ['rc-match-term'];
                if (matchedIndices.has(i)) classes.push('matched');
                const disabled = isFinished ? 'disabled' : '';
                return `<button type="button" class="${classes.join(' ')}" data-pair-index="${i}" ${disabled}>${escapeHtml(p.term)}</button>`;
            }).join('');

            let defPairs;
            if (result?.defOrder?.length === pairs.length) {
                defPairs = result.defOrder.map(idx => pairs[idx]).filter(Boolean);
            } else {
                defPairs = pairs.slice().sort(() => Math.random() - 0.5);
            }
            const defs = defPairs.map(p => {
                const idx = pairs.indexOf(p);
                const classes = ['rc-match-def'];
                if (matchedIndices.has(idx)) classes.push('matched');
                const disabled = isFinished ? 'disabled' : '';
                return `<button type="button" class="${classes.join(' ')}" data-pair-index="${idx}" ${disabled}>${escapeHtml(p.definition)}</button>`;
            }).join('');

            const summaryHtml = isFinished && result?.isCorrect
                ? '<div class="rc-result-summary">All pairs matched</div>'
                : '';

            return `<div class="rc-body rc-match" data-recall-id="${blockId}">
                <p class="rc-prompt">Match each term to its definition.</p>
                <div class="rc-match-columns"><div class="rc-match-col">${terms}</div><div class="rc-match-col">${defs}</div></div>
                ${summaryHtml}
                ${renderFeedback()}
                ${renderSubmit('Check matches')}
            </div>`;
        }
        if (data.format === 'order') {
            const steps = data.steps || [];
            let orderedItems;
            if (result?.studentOrder?.length) {
                orderedItems = result.studentOrder.map(text => {
                    const idx = steps.indexOf(text);
                    return { text, correctIndex: idx >= 0 ? idx : 0 };
                });
            } else {
                orderedItems = steps.slice().sort(() => Math.random() - 0.5).map(step => ({
                    text: step,
                    correctIndex: steps.indexOf(step)
                }));
            }
            const items = orderedItems.map(({ text, correctIndex }) => {
                const draggable = isFinished ? 'false' : 'true';
                return `<li class="rc-order-item" draggable="${draggable}" data-correct-index="${correctIndex}">${escapeHtml(text)}</li>`;
            }).join('');

            let summaryHtml = '';
            if (isFinished && result) {
                summaryHtml = result.isCorrect
                    ? '<div class="rc-result-summary">Correct order</div>'
                    : '<div class="rc-result-summary">Your order is shown below</div>';
            }

            return `<div class="rc-body rc-order" data-recall-id="${blockId}">
                <p class="rc-prompt">${escapeHtml(data.prompt || 'Put the steps in the correct order.')}</p>
                <ul class="rc-order-list">${items}</ul>
                ${summaryHtml}
                ${renderFeedback()}
                ${renderSubmit('Check order')}
            </div>`;
        }
        return '';
    }

    function isSubsectionHeading(heading) {
        return /^\d+\.\d+\.\d+/.test(normalizeText(heading));
    }

    function resolvePrimarySectionHeading(heading, outlineMeta) {
        const h = normalizeText(heading);
        if (!h) return h;
        if (!isSubsectionHeading(h)) return h;

        const bandKey = h.match(/^(\d+\.\d+)/)?.[1];
        if (!bandKey) return h;

        const sections = outlineMeta?.sections || [];
        const major = sections.find(s => {
            const sh = normalizeText(s.heading);
            return sh.startsWith(bandKey) && !isSubsectionHeading(sh);
        });
        return major?.heading || h;
    }

    function topicFromSectionHeading(heading) {
        const h = normalizeText(heading);
        if (!h) return 'this section';
        const stripped = h.replace(/^\d+(?:\.\d+)*\s*[-–—:.]?\s*/, '').trim();
        return stripped || h;
    }

    const INTERNAL_JARGON_PATTERNS = [
        /\bformat_id\b/gi,
        /\bwidget_action_id\b/gi,
        /\bwidget_action\b/gi,
        /\bcounter feature\b/gi,
        /\bcompare_models\b/gi,
        /\bsteel_man\b/gi,
        /\bedge_case\b/gi,
        /\bwhat_if\b/gi,
        /\bteach_sam\b/gi,
        /\bscenario_roleplay\b/gi,
        /\b'[a-z_]+'\s*format/gi,
        /with a '[a-z_]+' format/gi,
        /\bfeature\s+(?:with|using)\b/gi,
        /\b2023[–-]2026\b/g,
        /\bno analogies\b/gi,
        /\bName a real headline\b/gi,
        /\bfrom 2023\b/gi
    ];

    function rationaleLooksInternal(text) {
        const t = normalizeText(text);
        if (!t) return false;
        if (INTERNAL_JARGON_PATTERNS.some(p => p.test(t))) return true;
        if (/\b[a-z]+_[a-z_]+\b/.test(t)) return true;
        if (/\bformat_id\b|\bwidget\b|\bband \d/i.test(t)) return true;
        return false;
    }

    function sanitizeRationaleForDisplay(text) {
        let t = normalizeText(text);
        INTERNAL_JARGON_PATTERNS.forEach(p => { t = t.replace(p, ''); });
        t = t.replace(/\s{2,}/g, ' ').replace(/\s+([,.])/g, '$1').trim();
        return t;
    }

    function extractPedagogicalBenefit(rationale) {
        const t = normalizeText(rationale);
        if (!t || rationaleLooksInternal(t)) return '';

        const sentences = t.split(/(?<=[.!?])\s+/).filter(Boolean);
        const benefitPatterns = [
            /misconception/i,
            /students (?:often|may|should|grasp|retain|evaluate|critically)/i,
            /help(?:ing|s)? students/i,
            /reinforc/i,
            /consolidat/i,
            /transfer/i,
            /deeper understanding/i,
            /before moving on/i
        ];

        const benefitSentences = sentences.filter(s =>
            benefitPatterns.some(p => p.test(s)) && !rationaleLooksInternal(s)
        );

        if (benefitSentences.length) {
            return sanitizeRationaleForDisplay(benefitSentences.join(' '));
        }

        if (!rationaleLooksInternal(t) && t.length >= 40) {
            return sanitizeRationaleForDisplay(t);
        }
        return '';
    }

    function capitalizeSentence(text) {
        const t = normalizeText(text);
        if (!t) return t;
        return t.charAt(0).toUpperCase() + t.slice(1);
    }

    function ensureEndsWithPeriod(text) {
        const t = normalizeText(text);
        if (!t) return t;
        return t.endsWith('.') ? t : `${t}.`;
    }

    function mergeActionLineAndBenefit(actionLine, benefit) {
        if (!benefit) return ensureEndsWithPeriod(actionLine);

        const actionLower = actionLine.toLowerCase();
        const benefitLower = benefit.toLowerCase();
        if (benefitLower.startsWith(actionLower.slice(0, 30))) return ensureEndsWithPeriod(benefit);
        if (actionLower.includes(benefitLower.slice(0, 40))) return ensureEndsWithPeriod(actionLine);

        let benefitSentence = benefit.endsWith('.') ? benefit.slice(0, -1).trim() : benefit.trim();
        benefitSentence = capitalizeSentence(benefitSentence);
        return `${ensureEndsWithPeriod(actionLine)} ${benefitSentence}.`.replace(/\.\s+\./g, '.');
    }

    function buildAuthorProposalDescriptionParts(finding, outlineMeta) {
        const sectionHeading = resolvePrimarySectionHeading(
            finding?.sectionHeading || finding?.bandId || '',
            outlineMeta
        );
        const topic = topicFromSectionHeading(sectionHeading);
        const payload = finding?.payload || {};
        const scanId = finding?.scanId || '';
        const actionId = payload.widgetActionId || '';
        const formatId = payload.formatId || payload.recallFormat || payload.illustrateStyle || '';

        const mf = global.DreamBookModuleFormats;
        let actionLine = null;

        if (actionId && mf?.buildFormatAuthorBlurb) {
            actionLine = mf.buildFormatAuthorBlurb(actionId, formatId, topic);
        }
        if (!actionLine && scanId && mf?.buildScanAuthorBlurb) {
            actionLine = mf.buildScanAuthorBlurb(scanId, payload, topic);
        }
        if (!actionLine) {
            actionLine = `Add an interactive checkpoint after ${topic} to strengthen student understanding.`;
        }

        const activityLabel = mf?.getAuthorActivityLabel
            ? mf.getAuthorActivityLabel(actionId, formatId, scanId, payload)
            : 'interactive checkpoint';

        const benefit = extractPedagogicalBenefit(finding?.rationale || '');
        const text = mergeActionLineAndBenefit(actionLine, benefit);

        return { text, activityLabel };
    }

    function buildAuthorProposalDescription(finding, outlineMeta) {
        return buildAuthorProposalDescriptionParts(finding, outlineMeta).text;
    }

    function buildAuthorProposalDescriptionHtml(finding, outlineMeta) {
        const { text, activityLabel } = buildAuthorProposalDescriptionParts(finding, outlineMeta);
        if (!text) return '';
        if (!activityLabel) return escapeHtml(text);

        const idx = text.indexOf(activityLabel);
        if (idx < 0) return escapeHtml(text);

        return escapeHtml(text.slice(0, idx))
            + '<strong>' + escapeHtml(activityLabel) + '</strong>'
            + escapeHtml(text.slice(idx + activityLabel.length));
    }

    global.DreamBookEnhancements = {
        ENHANCEMENT_SCAN_TOOLS,
        ILLUSTRATE_STYLES,
        OBJECTIVE_LABELS,
        WIDGET_DEFAULT_OBJECTIVES,
        getDefaultObjectiveTag,
        PEDAGOGICAL_GOAL_GROUPS,
        SCAN_PEDAGOGICAL_GOALS,
        getScanPedagogicalGoal,
        getPedagogicalGoalLabel,
        buildStrategicPeerReviewSummary,
        buildEnhancementScanFindings,
        buildDemoEnhancementProposals,
        buildMockRecallPayload,
        validateRecallBundleConfig,
        getRecallLearningContext,
        buildMockRecallBundle,
        buildRecallBundlePrompt,
        normalizeRecallBundle,
        getRecallTypeSublabel,
        RECALL_FORMAT_ORDER,
        RECALL_TYPE_HEADERS,
        RECALL_MAX_BUNDLE_TOTAL,
        RECALL_MAX_MATCH_PAIRS,
        parseSocraticLadder,
        parseSocraticContent,
        parseExplainPeerContent,
        sanitizeSocraticParsed,
        stripMarkdownFromSocraticText,
        renderRecallStudentHtml,
        validateAndRankProposals,
        normalizeScanProposal,
        coerceIllustrateStyle,
        normalizeIllustratePayload,
        normalizePayloadFormatId,
        payloadLooksIllustrate,
        prioritizeSelectionsBySectionSpread,
        buildFallbackProposal,
        buildExcludedSectionSet,
        mergeExcludedSections,
        isSectionExcluded,
        applyClusteringGuardrail,
        dedupCrossScan,
        normalizePeerReviewSummary,
        ensureAllScanFeedback,
        ensureMinOneProposalPerScan,
        SCAN_TARGET_CONFIG,
        getScanMaxProposals,
        computeScanProposalTargets,
        dedupeFormatProposals,
        enforceIllustrateMix,
        ensureMinScanProposals,
        finalizeScanProposals,
        resolveProposalPlacement,
        buildInsertionCandidateMenu,
        formatCandidateMenuText,
        normalizeCandidateSelections,
        proposalsFromCandidateSelections,
        anchorQuoteFromBlockText,
        findSectionInOutline,
        countAbstractEligibleSections,
        countMatchingSections,
        makeProposal,
        resolvePrimarySectionHeading,
        topicFromSectionHeading,
        buildAuthorProposalDescription,
        buildAuthorProposalDescriptionParts,
        buildAuthorProposalDescriptionHtml,
        rationaleLooksInternal,
        escapeHtml
    };
})(typeof window !== 'undefined' ? window : globalThis);
