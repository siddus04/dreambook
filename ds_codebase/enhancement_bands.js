/**
 * Major-section-band enhancement pipeline (Pass 1 diagnosis → Pass 2 recommendation).
 * v12: section bundles (1 non-M + 0–2 M), flexible M placement, chapter variety caps.
 * v12.1: variety guard — protect sole non-M from news conversion; sync conversion metadata.
 * v13: band-aware recall format inference (mcq/match/order); prompt hook quality.
 */
(function (global) {
    'use strict';

    const MAX_SIMULATIONS_PER_CHAPTER = 1;
    const MIN_PHET_MATCH_SCORE = 8;
    const MAX_M_PER_BAND = 2;
    const M_GAP_SCORE_THRESHOLD = 4;

    const NON_M_FEATURES = new Set(['socratic', 'counter', 'case_study', 'explain_peer', 'recall']);
    const M_FEATURES = new Set(['illustrate_analogy', 'illustrate_news', 'simulation']);

    /** Widget generation source text: 'band_full' (default) or 'legacy' (first paragraph only). */
    const WIDGET_SOURCE_PASSAGE_MODE = 'band_full';

    const MAX_ANALOGY_SHARE = 0.4;
    const MIN_NEWS_WHEN_MANY_BANDS = 2;
    const MIN_BANDS_FOR_NEWS_MIX = 8;

    const POP_CULTURE_ROTATION = ['cricket', 'football', 'cooking', 'gaming', 'music'];

    const BANNED_HOOK_PATTERNS = [
        /\bconcert\b/i,
        /\bband playing\b/i,
        /\bfavorite song\b/i,
        /\blego (city|building)\b/i,
        /\bphone app\b/i,
        /\bphone battery\b/i,
        /\bsuperhero\b/i,
        /\bbustling airport\b/i,
        /\bbustling train station\b/i,
        /\beach classroom represents\b/i,
        /\bschool where each classroom\b/i,
        /\bcity of new york\b/i,
        /\bmia and jake\b/i,
        /\bbattery system\b/i
    ];

    const BANNED_DOMAIN_PATTERNS = [
        { pattern: /\bairport\b/i, label: 'airport' },
        { pattern: /\btrain station\b/i, label: 'train station' },
        { pattern: /\beach classroom\b/i, label: 'school-as-map' },
        { pattern: /\bbustling city\b/i, label: 'bustling city' },
        { pattern: /\bcaf[eé] biologica\b/i, label: 'chef kitchen' },
        { pattern: /\bcricket\b/i, label: 'cricket' },
        { pattern: /\bfootball\b|\bsoccer\b/i, label: 'football' }
    ];

    const WEAPON_TO_ACTION = {
        scan_socratic: 'socratic-question',
        scan_case_study: 'mini-case-study',
        scan_counter: 'opposing-view',
        scan_explain_peer: 'explain-to-peer'
    };

    const ENHANCEMENT_WEAPONS = {
        illustrate_analogy: {
            scanId: 'scan_illustrate',
            label: 'Everyday analogy',
            payload: { illustrateStyle: 'analogy', widgetActionId: 'illustrate-analogy' }
        },
        illustrate_news: {
            scanId: 'scan_illustrate',
            label: 'Real-World Application',
            payload: { illustrateStyle: 'news', widgetActionId: 'illustrate-news' }
        },
        socratic: {
            scanId: 'scan_socratic',
            label: 'Socratic checkpoint',
            payload: { widgetActionId: 'socratic-question' }
        },
        counter: {
            scanId: 'scan_counter',
            label: 'Counter-argument',
            payload: { widgetActionId: 'opposing-view' }
        },
        case_study: {
            scanId: 'scan_socratic',
            label: 'Mini case study',
            payload: { widgetActionId: 'mini-case-study' }
        },
        explain_peer: {
            scanId: 'scan_explain_peer',
            label: 'Explain to a peer',
            payload: { widgetActionId: 'explain-to-peer' }
        },
        recall: {
            scanId: 'scan_recall',
            label: 'Recall check',
            payload: { widgetActionId: 'recall-check' }
        },
        simulation: {
            scanId: 'scan_simulation',
            label: 'PhET simulation',
            payload: { simulationType: 'phet' }
        },
        none: null
    };

    ENHANCEMENT_WEAPONS.case_study.scanId = 'scan_case_study';

    const EXCLUDED_BAND_PATTERNS = [
        /\bintroduction to\b/i,
        /\bchapter introduction\b/i,
        /\blearning objectives\b/i,
        /\bchapter summary\b/i,
        /\bpractice problems\b/i,
        /\bexercises?\b/i,
        /\breview questions\b/i,
        /^part (one|two|three|four|five|six)\b/i,
        /\bpreface\b/i
    ];

    function normalizeText(str) {
        return String(str || '').replace(/\s+/g, ' ').trim();
    }

    function extractBandKey(heading) {
        const h = normalizeText(heading);
        const sub = h.match(/^(\d+\.\d+)\.\d+/);
        if (sub) return sub[1];
        const major = h.match(/^(\d+\.\d+)\b/);
        if (major) return major[1];
        return null;
    }

    function isSubsectionHeading(heading) {
        return /^\d+\.\d+\.\d+/.test(normalizeText(heading));
    }

    function bandCandidatePrefix(bandId) {
        return 'B' + String(bandId).replace(/\./g, '_');
    }

    function bandLooksExcluded(band) {
        const labels = [band.label, band.majorHeading, ...(band.subheadings || [])].filter(Boolean);
        return labels.some(label => EXCLUDED_BAND_PATTERNS.some(p => p.test(normalizeText(label))));
    }

    function getPhETCatalog() {
        return global.PHET_SIM_CATALOG || {};
    }

    function scorePhETMatch(text, meta) {
        const t = (text || '').toLowerCase();
        if (!t || !meta) return 0;
        let score = 0;
        const topics = (meta.topics || '').split(/,\s*/);
        topics.forEach(kw => {
            const k = kw.trim().toLowerCase();
            if (k.length > 3 && t.includes(k)) score += 4;
        });
        (meta.label || '').toLowerCase().split(/[\s:–\-]+/).forEach(w => {
            if (w.length > 4 && t.includes(w)) score += 3;
        });
        if ((meta.primarySubject || '') === 'biology' && /\bcell|organism|membrane|protein|gene|mitochond|chloroplast|osmosis|diffusion|transport\b/.test(t)) {
            score += 2;
        }
        return score;
    }

    function rankPhETMatchesForText(text, limit) {
        const catalog = getPhETCatalog();
        const ranked = Object.entries(catalog)
            .map(([id, meta]) => ({ id, meta, score: scorePhETMatch(text, meta) }))
            .filter(r => r.meta && r.score >= MIN_PHET_MATCH_SCORE && (r.meta.primarySubject || '') === 'biology')
            .sort((a, b) => b.score - a.score);
        return ranked.slice(0, limit || 5);
    }

    function formatPhETAllowlistForBand(band) {
        const text = formatBandSourceText(band, 4000);
        const matches = rankPhETMatchesForText(text, 4);
        if (!matches.length) return 'No PhET Biology simulation matches this band well — do NOT use feature "simulation". Use illustrate_analogy, socratic, counter, case_study, explain_peer, or recall instead.';
        return 'Allowed PhET Biology slugs for simulation (pick at most one band in chapter): ' +
            matches.map(m => `${m.id} (${m.meta?.label || m.id}, score ${m.score})`).join('; ');
    }

    function buildMajorSectionBands(outlineMeta, excludedSet) {
        const isExcluded = global.DreamBookEnhancements?.isSectionExcluded
            || ((h, set) => set?.has(normalizeText(h).toLowerCase()));
        const bandsMap = new Map();
        const bandOrder = [];

        (outlineMeta?.sections || []).forEach(section => {
            if (isExcluded(section.heading, excludedSet)) return;
            const bandKey = extractBandKey(section.heading)
                || ('topic:' + normalizeText(section.heading).toLowerCase().slice(0, 48));
            let band = bandsMap.get(bandKey);
            if (!band) {
                band = {
                    bandId: bandKey,
                    label: section.heading,
                    majorHeading: null,
                    subheadings: [],
                    sections: [],
                    blocks: [],
                    blockIds: new Set()
                };
                bandsMap.set(bandKey, band);
                bandOrder.push(bandKey);
            }
            band.sections.push(section.heading);
            if (!isSubsectionHeading(section.heading)) {
                band.majorHeading = section.heading;
                band.label = section.heading;
            } else {
                band.subheadings.push(section.heading);
            }
            (section.blocks || []).filter(b => !b.isHeading).forEach(block => {
                if (!block.blockId || band.blockIds.has(block.blockId)) return;
                band.blockIds.add(block.blockId);
                band.blocks.push({ ...block, sectionHeading: block.sectionHeading || section.heading });
            });
        });

        return bandOrder
            .map(k => bandsMap.get(k))
            .map(band => {
                if (!band.majorHeading && band.bandId && /^\d+\.\d+$/.test(band.bandId)) {
                    const parent = band.subheadings?.[0] || band.sections?.[0] || '';
                    const topic = parent.replace(/^\d+\.\d+(?:\.\d+)?\s*/, '').trim();
                    band.label = topic
                        ? `${band.bandId} ${topic.split(/[:(]/)[0].trim()}`
                        : `Section ${band.bandId}`;
                }
                return band;
            })
            .filter(band => {
                if (!band?.blocks?.length) return false;
                const chars = band.blocks.reduce((n, b) => n + (b.text || '').length, 0);
                if (chars < 120) return false;
                if (bandLooksExcluded(band)) return false;
                return true;
            });
    }

    function formatBandSourceText(band, maxChars) {
        const limit = maxChars || 5000;
        const parts = [];
        if (band.majorHeading) parts.push(`## ${band.majorHeading}`);
        (band.subheadings || []).forEach(sh => parts.push(`### ${sh}`));
        band.blocks.forEach(b => parts.push(b.text));
        let text = parts.join('\n\n');
        if (text.length > limit) text = text.slice(0, limit) + '…';
        return text;
    }

    function formatBandTextForDiagnosis(band, maxChars) {
        return formatBandSourceText(band, maxChars || 2200);
    }

    function formatBandsForDiagnosisPrompt(bands) {
        return (bands || []).map(band => {
            const subs = (band.subheadings || []).length
                ? `\nSubsections: ${band.subheadings.join('; ')}`
                : '';
            return `--- Band ${band.bandId}: ${band.label} ---${subs}\n${formatBandTextForDiagnosis(band, 2000)}`;
        }).join('\n\n');
    }

    function pickMajorBandAnchorBlock(band) {
        const blocks = band?.blocks || [];
        if (!blocks.length) return null;
        return blocks[blocks.length - 1];
    }

    function isNonMFeatureKey(key) {
        return NON_M_FEATURES.has(String(key || '').trim().toLowerCase().replace(/-/g, '_'));
    }

    function isMFeatureKey(key) {
        return M_FEATURES.has(String(key || '').trim().toLowerCase().replace(/-/g, '_'));
    }

    function featureKeyFromRaw(raw) {
        return String(raw?.feature || raw?.weapon || raw?.recommendation_type || '')
            .trim().toLowerCase().replace(/-/g, '_');
    }

    function scoreBandGapForM(diag, band) {
        if (!diag || diag.skip) return 0;
        let score = 0;
        score += Math.min((diag.enhancement_opportunity || '').length / 25, 3);
        score += Math.min((diag.core_concept || '').length / 20, 2);
        score += ((diag.misconceptions || []).length) * 2;
        if (diag.necessity === 'essential') score += 2;
        const textLen = formatBandSourceText(band, 5000).length;
        if (textLen > 800) score += 1;
        if (textLen > 2000) score += 1;
        return score;
    }

    function buildBandCandidateMenu(band, usedBlockIds) {
        const prefix = bandCandidatePrefix(band.bandId);
        const bodyBlocks = (band.blocks || []).filter(b => {
            const key = extractBandKey(b.sectionHeading || band.label);
            return !key || key === String(band.bandId);
        });
        if (!bodyBlocks.length) return [];
        const menu = [];
        const anchorIndices = bodyBlocks.length >= 2
            ? [bodyBlocks.length - 2, bodyBlocks.length - 1]
            : [0];
        anchorIndices.forEach((bodyIndex, idx) => {
            const block = bodyBlocks[bodyIndex];
            if (!block || usedBlockIds?.has(block.blockId)) return;
            const text = normalizeText(block.text);
            if (!text || text.length < 40) return;
            menu.push({
                candidateId: `${prefix}-C${idx + 1}`,
                bandId: band.bandId,
                blockId: block.blockId,
                sectionHeading: band.majorHeading || band.label,
                excerpt: text.length > 280 ? text.slice(0, 280) + '…' : text,
                bodyIndex,
                bodyCount: bodyBlocks.length,
                placement: 'end_of_major_band',
                bundleTier: 'non_m'
            });
        });
        return menu;
    }

    function buildBandFlexibleCandidateMenu(band, usedBlockIds) {
        const prefix = bandCandidatePrefix(band.bandId);
        const bodyBlocks = (band.blocks || []).filter(b => {
            const text = normalizeText(b.text);
            return text.length >= 40;
        });
        if (!bodyBlocks.length) return [];
        const menu = [];
        const maxCandidates = Math.min(4, bodyBlocks.length);
        const step = bodyBlocks.length <= maxCandidates
            ? 1
            : Math.max(1, Math.floor((bodyBlocks.length - 1) / (maxCandidates - 1)));
        const indices = [];
        for (let i = 0; i < bodyBlocks.length && indices.length < maxCandidates; i += step) {
            indices.push(i);
        }
        if (indices[indices.length - 1] !== bodyBlocks.length - 1) {
            indices.push(bodyBlocks.length - 1);
        }
        [...new Set(indices)].forEach((bodyIndex, idx) => {
            const block = bodyBlocks[bodyIndex];
            if (!block || usedBlockIds?.has(block.blockId)) return;
            const text = normalizeText(block.text);
            if (!text || text.length < 40) return;
            const subHeading = block.sectionHeading && block.sectionHeading !== band.label
                ? block.sectionHeading
                : '';
            menu.push({
                candidateId: `${prefix}-M${idx + 1}`,
                bandId: band.bandId,
                blockId: block.blockId,
                sectionHeading: subHeading || band.majorHeading || band.label,
                excerpt: text.length > 280 ? text.slice(0, 280) + '…' : text,
                bodyIndex,
                bodyCount: bodyBlocks.length,
                placement: 'flexible',
                bundleTier: 'm'
            });
        });
        return menu;
    }

    function buildAllBandCandidateMenus(bands, usedBlockIds) {
        const menuById = new Map();
        const lines = [];
        (bands || []).forEach(band => {
            const endMenu = buildBandCandidateMenu(band, usedBlockIds);
            const flexMenu = buildBandFlexibleCandidateMenu(band, usedBlockIds);
            if (!endMenu.length && !flexMenu.length) return;
            lines.push(`Band ${band.bandId} (${band.label})`);
            lines.push(formatPhETAllowlistForBand(band));
            if (endMenu.length) {
                lines.push('  Non-M placements (end of major band — use candidate_id with -C prefix):');
                endMenu.forEach(c => {
                    menuById.set(c.candidateId, c);
                    lines.push(`    ${c.candidateId} | end anchor paragraph ${c.bodyIndex + 1} of ${c.bodyCount}\n      "${c.excerpt}"`);
                });
            }
            if (flexMenu.length) {
                lines.push('  M-tier placements (flexible mid-band — use candidate_id with -M prefix):');
                flexMenu.forEach(c => {
                    menuById.set(c.candidateId, c);
                    const sub = c.sectionHeading !== (band.majorHeading || band.label)
                        ? ` (${c.sectionHeading})`
                        : '';
                    lines.push(`    ${c.candidateId}${sub} | paragraph ${c.bodyIndex + 1} of ${c.bodyCount}\n      "${c.excerpt}"`);
                });
            }
            lines.push('');
        });
        return { menuById, menuText: lines.join('\n') };
    }

    function anchorQuoteFromBlockText(text) {
        const t = normalizeText(text);
        if (!t) return '';
        const reg = global.DreamBookScenarioRegistry;
        const stripped = reg?.stripPedagogyChrome ? reg.stripPedagogyChrome(t) : t;
        const isProse = reg?.isTeachingProseParagraph
            ? (s) => reg.isTeachingProseParagraph(s)
            : (s) => s.length >= 40 && !/^#{1,6}\s/.test(s);
        const sentences = stripped.split(/[.!?]/).map(s => s.trim()).filter(s => {
            if (s.length < 20) return false;
            if (/^(edit delete|description delete|progress_activity)/i.test(s)) return false;
            if (/Illustration text \(click to expand\)/i.test(s)) return false;
            if (/moderate difficulty · \d+ turns/i.test(s)) return false;
            return true;
        });
        const proseSentences = sentences.filter(s => isProse(s + '.'));
        const withPunctuation = proseSentences.filter(s => /[.!?]$/.test(s + '.') && !/^[A-Z][A-Za-z0-9\s\-()]{0,55}:\s/.test(s));
        const first = withPunctuation[0] || proseSentences[0] || sentences.find(s => isProse(s + '.')) || '';
        if (first) return first.slice(0, 80);
        const line = stripped.split(/\n+/).map(l => l.trim()).find(l => isProse(l)) || stripped.split(/\n+/).find(l => l.trim().length >= 20) || stripped;
        return line.slice(0, 80);
    }

    function resolveWeapon(feature) {
        const key = String(feature || '').trim().toLowerCase().replace(/-/g, '_');
        if (key === 'illustrate' || key === 'analogy') return ENHANCEMENT_WEAPONS.illustrate_analogy;
        if (key === 'news' || key === 'real_world') return ENHANCEMENT_WEAPONS.illustrate_news;
        return ENHANCEMENT_WEAPONS[key] || null;
    }

    function downgradeWeaponFromSimulation(band, usedFeatures) {
        const text = formatBandSourceText(band, 2000).toLowerCase();
        const pick = (key) => {
            if (usedFeatures?.has(key)) return null;
            return ENHANCEMENT_WEAPONS[key];
        };
        if (/process|transport|osmosis|diffusion|membrane|respiration|photosynthesis/.test(text)) {
            return pick('socratic') || pick('case_study') || ENHANCEMENT_WEAPONS.socratic;
        }
        return pick('socratic') || pick('case_study') || pick('counter') || ENHANCEMENT_WEAPONS.illustrate_analogy;
    }

    function inferWeaponFromDiagnosis(diag, band, usedFeatures) {
        const opp = (diag?.enhancement_opportunity || '').toLowerCase();
        const concept = (diag?.core_concept || '').toLowerCase();
        const text = formatBandSourceText(band, 2000).toLowerCase();
        const phetMatches = rankPhETMatchesForText(text, 1);
        const used = usedFeatures || new Set();

        const pick = (key) => {
            if (used.has(key)) return null;
            return ENHANCEMENT_WEAPONS[key];
        };

        if (/compar|contrast|versus|prokaryot|eukaryot|plant.*animal/.test(opp + ' ' + concept + ' ' + text)) {
            return pick('counter') || pick('socratic') || pick('illustrate_analogy');
        }
        if (/process|transport|osmosis|diffusion|gradient|membrane/.test(opp + ' ' + text)) {
            if (phetMatches.length && !used.has('simulation')) return ENHANCEMENT_WEAPONS.simulation;
            return pick('illustrate_analogy') || pick('socratic');
        }
        if (/terminolog|defin|recall|list|steps|sequence/.test(opp + ' ' + text)) {
            return pick('recall') || pick('explain_peer');
        }
        if (/appli|real.?world|scenario|ecm|extracellular|lysosom|signal transduction|homeostasis|autophagy/.test(opp + ' ' + text)) {
            return pick('illustrate_news') || pick('case_study') || pick('explain_peer');
        }
        return pick('socratic') || pick('illustrate_analogy') || pick('explain_peer') || ENHANCEMENT_WEAPONS.illustrate_analogy;
    }

    function inferBandPromptProfile(diag, bandSourceText) {
        const opp = (diag?.enhancement_opportunity || diag?.enhancementOpportunity || '').toLowerCase();
        const concept = (diag?.core_concept || diag?.coreConcept || '').toLowerCase();
        const text = String(bandSourceText || '').toLowerCase();
        const combined = `${opp} ${concept} ${text}`;
        if (/compar|contrast|versus|\bvs\.?\b|two types|two primary|two distinct|prokaryot.*eukaryot|eukaryot.*prokaryot|plant.*animal|animal.*plant/.test(combined)) {
            return 'compare_contrast';
        }
        if (/terminolog|defin|recall|vocabular|key terms|\blist of\b/.test(combined)) {
            return 'vocabulary';
        }
        if (/process|transport|osmosis|diffusion|gradient|membrane|sequence|steps|stages/.test(combined)) {
            return 'process';
        }
        return 'default';
    }

    const RECALL_FORMAT_ORDER = ['mcq', 'match', 'order'];
    const RECALL_FORMAT_TITLES = {
        mcq: 'Quick check (MCQ)',
        match: 'Match terms',
        order: 'Order the steps'
    };

    function normalizeRecallFormat(fmt) {
        const f = String(fmt || '').toLowerCase();
        return RECALL_FORMAT_ORDER.includes(f) ? f : null;
    }

    function inferRecallFormatFromBand(diag, bandSourceText) {
        const en = global.DreamBookEnhancements;
        const text = String(bandSourceText || '');
        if (en?.sectionLooksSequential?.(text)) return 'order';
        if (en?.sectionLooksDefinitional?.(text)
            || /\b(list|four|three|five|types of|components)\b/i.test(text)) {
            return 'match';
        }
        const profile = inferBandPromptProfile(diag, bandSourceText);
        if (profile === 'vocabulary') return 'match';
        if (profile === 'process') return 'order';
        return 'mcq';
    }

    function pickRecallFormatWithRotation(preferred, usedCounts) {
        const pref = normalizeRecallFormat(preferred) || 'mcq';
        if ((usedCounts.get(pref) || 0) < 2) return pref;
        for (const fmt of RECALL_FORMAT_ORDER) {
            if ((usedCounts.get(fmt) || 0) < 2) return fmt;
        }
        let best = RECALL_FORMAT_ORDER[0];
        let min = Infinity;
        RECALL_FORMAT_ORDER.forEach(fmt => {
            const c = usedCounts.get(fmt) || 0;
            if (c < min) { min = c; best = fmt; }
        });
        return best;
    }

    function syncRecallProposalTitle(proposal, format) {
        const label = RECALL_FORMAT_TITLES[format];
        if (!label) return;
        const t = String(proposal.title || '').trim();
        if (!t || /recall check|quick check|match terms|order the steps/i.test(t)) {
            proposal.title = label;
        }
    }

    function assignRecallFormats(proposals, eligibleBands, diagnosisByBand) {
        const usedCounts = new Map();
        (proposals || []).forEach(p => {
            if (p.scanId !== 'scan_recall' && getProposalFeatureKey(p) !== 'recall') return;
            const band = eligibleBands?.find(b => b.bandId === p.bandId);
            const diag = diagnosisByBand?.[p.bandId];
            const text = p.bandSourceText || formatBandSourceText(band, 4000);
            let format = normalizeRecallFormat(p.payload?.recallFormat);
            if (!format || (format === 'mcq' && !p.payload?._recallFormatExplicit)) {
                const inferred = inferRecallFormatFromBand(diag, text);
                format = pickRecallFormatWithRotation(inferred, usedCounts);
            }
            usedCounts.set(format, (usedCounts.get(format) || 0) + 1);
            p.payload = { ...(p.payload || {}), recallFormat: format };
            delete p.payload._recallFormatExplicit;
            syncRecallProposalTitle(p, format);
        });
        return proposals;
    }

    function buildPayloadForWeapon(weapon, raw, band) {
        if (!weapon) return {};
        let payload = { ...weapon.payload };
        if (weapon.scanId === 'scan_simulation') {
            const phetId = raw.phet_id || raw.phetId;
            const text = formatBandSourceText(band, 4000);
            const matches = rankPhETMatchesForText(text, 3);
            const valid = matches.find(m => m.id === phetId) || matches[0];
            if (valid) {
                payload.phetId = valid.id;
                payload.simulationType = 'phet';
            } else {
                return null;
            }
        }
        if (weapon.scanId === 'scan_illustrate' && global.DreamBookEnhancements?.normalizeIllustratePayload) {
            payload = global.DreamBookEnhancements.normalizeIllustratePayload(payload);
        }
        const fmt = raw.format_id || raw.formatId;
        if (fmt && weapon.scanId !== 'scan_illustrate') payload.formatId = fmt;
        if (weapon.scanId === 'scan_recall') {
            const explicit = normalizeRecallFormat(raw.recall_format || raw.recallFormat);
            if (explicit) {
                payload.recallFormat = explicit;
                payload._recallFormatExplicit = true;
            }
        }
        if (weapon.scanId === 'scan_counter') {
            payload.formatId = 'compare_models';
        }
        return payload;
    }

    function buildBandProposal(opts) {
        const makeProposal = global.DreamBookEnhancements.makeProposal.bind(global.DreamBookEnhancements);
        const normalizePayloadFormatId = global.DreamBookEnhancements?.normalizePayloadFormatId
            || ((scanId, p) => p);
        const band = opts.band;
        const blockMeta = opts.blockMeta;
        const weapon = opts.weapon;
        if (!weapon?.scanId || !weapon?.label) return null;
        let payload = buildPayloadForWeapon(weapon, opts.raw || {}, band);
        if (!payload) return null;
        payload = normalizePayloadFormatId(weapon.scanId, payload);
        const rationale = opts.rationale || '';
        if (payload?.illustrateStyle === 'news' && /\banalogy\b|\bcompare.*\bto\b|\blike a\b/i.test(rationale)) {
            payload = {
                ...payload,
                illustrateStyle: 'analogy',
                widgetActionId: 'illustrate-analogy',
                formatId: 'analogy'
            };
        }
        const bandSourceText = formatBandSourceText(band, 5000);
        const suggestedScenarioId = global.DreamBookScenarioRegistry?.resolvePreferredScenarioId?.({
            rationale,
            title: opts.title,
            bandSourceText,
            displayPassage: bandSourceText
        }) || global.DreamBookScenarioRegistry?.parseRationaleScenarioId?.(rationale, opts.title) || '';
        const bandBlockIds = (band.blocks || []).map(b => b.blockId).filter(Boolean);
        const diagnosis = opts.diagnosis || null;
        const misconceptionHint = (weapon.scanId === 'scan_socratic' && diagnosis?.misconceptions?.[0])
            ? `Target misconception: ${diagnosis.misconceptions[0]}`
            : '';
        const proposal = makeProposal({
            scanId: weapon.scanId,
            necessity: opts.necessity || 'recommended',
            objectiveTag: opts.objectiveTag || 'clarity',
            sectionHeading: band.majorHeading || band.label,
            afterBlockId: blockMeta.blockId || opts.afterBlockId,
            anchorQuote: anchorQuoteFromBlockText(blockMeta.text),
            displayPassage: bandSourceText.slice(0, 4000),
            bandSourceText,
            bandBlockIds,
            title: opts.title || weapon.label,
            rationale: opts.rationale,
            payload,
            bandId: band.bandId,
            tier: opts.tier || 'major',
            downgradeNote: opts.downgradeNote || '',
            placementNote: opts.placementNote || `Band ${band.bandId} (major section)`,
            suggestedScenarioId,
            suggestedPrompt: misconceptionHint,
            bundleTier: opts.bundleTier || ''
        });
        if (proposal) {
            const featureKey = opts.featureKey || featureKeyFromRaw({ feature: weapon === ENHANCEMENT_WEAPONS.illustrate_news ? 'illustrate_news'
                : weapon === ENHANCEMENT_WEAPONS.illustrate_analogy ? 'illustrate_analogy'
                : weapon === ENHANCEMENT_WEAPONS.simulation ? 'simulation'
                : Object.entries(ENHANCEMENT_WEAPONS).find(([, w]) => w === weapon)?.[0] || '' });
            proposal.plannedFeatureKey = featureKey;
            proposal.plannedScanId = weapon.scanId;
            proposal.bundleTier = opts.bundleTier || (isMFeatureKey(featureKey) ? 'm' : 'non_m');
        }
        return proposal;
    }

    function candidateCIndex(entry) {
        const m = String(entry?.candidateId || '').match(/-C(\d+)$/i);
        return m ? parseInt(m[1], 10) : 0;
    }

    function resolveMenuEntry(raw, band, menuById, usedBlocks, preferTier) {
        let candidateId = String(raw?.candidate_id || raw?.candidateId || '').trim().toUpperCase();
        candidateId = candidateId.replace(/^B(\d+)\.(\d+)/i, 'B$1_$2');
        let entry = candidateId ? menuById.get(candidateId) : null;
        const isBlockUsed = (c) => usedBlocks.has(`${c.blockId}:${c.bundleTier || preferTier || 'non_m'}`);
        if (!entry && preferTier === 'non_m') {
            const cEntries = [...menuById.values()]
                .filter(c => c.bandId === band.bandId && c.bundleTier === 'non_m' && !isBlockUsed(c))
                .sort((a, b) => candidateCIndex(b) - candidateCIndex(a));
            entry = cEntries[0];
        }
        if (!entry && preferTier) {
            entry = [...menuById.values()].find(c =>
                c.bandId === band.bandId
                && c.bundleTier === preferTier
                && !isBlockUsed(c)
            );
        }
        if (!entry) {
            entry = [...menuById.values()].find(c =>
                c.bandId === band.bandId && !isBlockUsed(c)
            );
        }
        if (entry && preferTier === 'non_m' && entry.bundleTier === 'non_m') {
            const cEntries = [...menuById.values()]
                .filter(c => c.bandId === band.bandId && c.bundleTier === 'non_m' && !isBlockUsed(c))
                .sort((a, b) => candidateCIndex(b) - candidateCIndex(a));
            if (cEntries[0] && candidateCIndex(cEntries[0]) > candidateCIndex(entry)) {
                entry = cEntries[0];
            }
        }
        if (!entry) {
            const anchor = pickMajorBandAnchorBlock(band);
            if (anchor) entry = {
                blockId: anchor.blockId,
                bandId: band.bandId,
                sectionHeading: band.majorHeading || band.label,
                bundleTier: preferTier || 'non_m'
            };
        }
        return entry;
    }

    function addBundleItemProposal(ctx, raw, band, bundleTier) {
        const { menuById, outlineMeta, diagnosisByBand, usedBlocks, usedFeatures, state } = ctx;
        const bandId = band.bandId;
        let feature = featureKeyFromRaw(raw);
        let weapon = resolveWeapon(feature);
        if (!weapon?.scanId || !weapon?.label || feature === 'none') return null;

        let downgradeNote = '';
        if (weapon.scanId === 'scan_simulation') {
            if (state.simulationCount >= MAX_SIMULATIONS_PER_CHAPTER) {
                downgradeNote = 'PhET simulation cap reached for this chapter — picked an interactive alternative.';
                weapon = downgradeWeaponFromSimulation(band, usedFeatures);
                feature = weapon === ENHANCEMENT_WEAPONS.socratic ? 'socratic'
                    : weapon === ENHANCEMENT_WEAPONS.case_study ? 'case_study' : 'illustrate_analogy';
            } else {
                const payload = buildPayloadForWeapon(weapon, raw, band);
                if (!payload) {
                    downgradeNote = 'No matching PhET simulation for this section — picked an interactive alternative.';
                    weapon = downgradeWeaponFromSimulation(band, usedFeatures);
                    feature = weapon === ENHANCEMENT_WEAPONS.socratic ? 'socratic' : 'case_study';
                }
            }
        }
        if (!weapon?.scanId || !weapon?.label) return null;

        const preferTier = (() => {
            let tier = bundleTier || (isMFeatureKey(feature) ? 'm' : 'non_m');
            if (isMFeatureKey(feature) && tier === 'non_m') tier = 'm';
            if (isNonMFeatureKey(feature) && tier === 'm') tier = 'non_m';
            return tier;
        })();
        const entry = resolveMenuEntry(raw, band, menuById, usedBlocks, preferTier);
        if (!entry) return null;
        const blockUseKey = `${entry.blockId}:${preferTier}`;
        if (usedBlocks.has(blockUseKey)) return null;
        const blockMeta = outlineMeta?.blockIndex?.[entry.blockId] || entry;
        if (!blockMeta?.blockId && !blockMeta?.text) return null;

        const rationale = (raw.rationale || raw.why || '').trim();
        if (rationale.length < 20) return null;

        const diag = diagnosisByBand?.[bandId];
        const placementNote = entry.placement === 'flexible'
            ? (diag?.core_concept ? `Band ${bandId} (mid-section): ${diag.core_concept}` : `Band ${bandId} (flexible placement)`)
            : (diag?.core_concept ? `Band ${bandId}: ${diag.core_concept}` : `Band ${bandId}`);

        const proposal = buildBandProposal({
            band,
            blockMeta,
            weapon,
            raw,
            title: raw.title,
            rationale: rationale.slice(0, 600),
            tier: 'major',
            placementNote,
            necessity: raw.necessity,
            downgradeNote,
            diagnosis: diag,
            featureKey: feature,
            bundleTier: preferTier
        });
        if (!proposal) return null;

        if (proposal.scanId === 'scan_simulation') state.simulationCount++;

        usedBlocks.add(blockUseKey);
        usedFeatures.add(feature);
        return proposal;
    }

    function normalizeRecommendationsToBundles(recommendations) {
        return (recommendations || []).map(raw => {
            if (raw.non_m || raw.m_items) return raw;
            const feature = featureKeyFromRaw(raw);
            const bandId = String(raw.band_id || raw.bandId || '').trim();
            if (isMFeatureKey(feature)) {
                return {
                    band_id: bandId,
                    tier: raw.tier || 'major',
                    non_m: null,
                    m_items: [raw]
                };
            }
            return {
                band_id: bandId,
                tier: raw.tier || 'major',
                non_m: raw,
                m_items: []
            };
        });
    }

    function sanitizeBundleRecommendation(bundle) {
        const b = {
            ...bundle,
            m_items: [...(bundle.m_items || [])]
        };
        if (b.non_m && b.non_m.feature && b.non_m.feature !== 'none') {
            const f = featureKeyFromRaw(b.non_m);
            if (isMFeatureKey(f)) {
                const moved = { ...b.non_m };
                b.m_items = [moved, ...b.m_items.filter(it => featureKeyFromRaw(it) !== f)];
                b.non_m = null;
            }
        }
        b.m_items = (b.m_items || []).filter(it => {
            if (!it || it.feature === 'none') return false;
            const f = featureKeyFromRaw(it);
            if (isNonMFeatureKey(f)) {
                if (!b.non_m || b.non_m.feature === 'none') {
                    b.non_m = { ...it };
                }
                return false;
            }
            return true;
        });
        return b;
    }

    function proposalsFromBandBundles(recommendations, bands, menuById, outlineMeta, diagnosisByBand) {
        if (!global.DreamBookEnhancements?.makeProposal) return [];
        const bundles = normalizeRecommendationsToBundles(recommendations).map(sanitizeBundleRecommendation);
        const usedBlocks = new Set();
        const usedFeatures = new Set();
        const state = { simulationCount: 0 };
        const proposals = [];
        const ctx = { menuById, outlineMeta, diagnosisByBand, usedBlocks, usedFeatures, state };

        bundles.forEach(bundle => {
            const bandId = String(bundle.band_id || bundle.bandId || '').trim();
            const tier = bundle.tier || 'major';
            if (!bandId || tier !== 'major') return;

            const band = bands.find(b => String(b.bandId) === bandId);
            if (!band) return;

            const nonMRaw = bundle.non_m;
            if (nonMRaw && nonMRaw.feature !== 'none') {
                const p = addBundleItemProposal(ctx, nonMRaw, band, 'non_m');
                if (p) proposals.push(p);
            }

            (bundle.m_items || []).slice(0, MAX_M_PER_BAND).forEach(mRaw => {
                if (!mRaw || mRaw.feature === 'none') return;
                const p = addBundleItemProposal(ctx, mRaw, band, 'm');
                if (p) proposals.push(p);
            });
        });

        return proposals;
    }

    function proposalsFromBandRecommendations(recommendations, bands, menuById, outlineMeta, diagnosisByBand) {
        return proposalsFromBandBundles(recommendations, bands, menuById, outlineMeta, diagnosisByBand);
    }

    function ensureMajorBandBundleCoverage(bands, proposals, menuById, outlineMeta, diagnosisByBand) {
        const byBand = new Map();
        (proposals || []).forEach(p => {
            if (!byBand.has(p.bandId)) byBand.set(p.bandId, []);
            byBand.get(p.bandId).push(p);
        });
        const usedBlocks = new Set((proposals || []).map(p =>
            `${p.afterBlockId}:${isMFeatureKey(getProposalFeatureKey(p)) ? 'm' : 'non_m'}`
        ));
        const usedFeatures = new Set((proposals || []).map(p => getProposalFeatureKey(p)));
        let simulationCount = (proposals || []).filter(p => p.scanId === 'scan_simulation').length;
        const results = [...(proposals || [])];

        (bands || []).forEach(band => {
            const diag = diagnosisByBand?.[band.bandId];
            if (diag?.skip) return;

            const bandProposals = byBand.get(band.bandId) || [];
            if (bandHasEffectiveNonM(bandProposals, band.bandId)) return;

            const bandFeatureKeys = new Set(bandProposals.map(p => getProposalFeatureKey(p)));
            let { weapon, featureKey: weaponKey } = pickCoverageFillWeapon(
                diag, band, usedFeatures, bandFeatureKeys
            );
            let downgradeNote = '';
            if (!weapon?.scanId || !weapon?.label) return;
            if (weapon?.scanId === 'scan_simulation') {
                if (simulationCount >= MAX_SIMULATIONS_PER_CHAPTER) {
                    downgradeNote = 'PhET simulation cap reached — coverage fill used an alternative.';
                    weapon = downgradeWeaponFromSimulation(band, usedFeatures);
                } else {
                    const payload = buildPayloadForWeapon(weapon, {}, band);
                    if (!payload) {
                        downgradeNote = 'No PhET match — coverage fill used an alternative.';
                        weapon = downgradeWeaponFromSimulation(band, usedFeatures);
                    }
                }
            }

            const anchor = pickMajorBandAnchorBlock(band);
            if (!anchor) return;
            const blockMeta = outlineMeta?.blockIndex?.[anchor.blockId] || anchor;
            const blockUseKey = `${anchor.blockId}:non_m`;
            if (usedBlocks.has(blockUseKey)) return;

            const featureKey = weaponKey || weaponToFeatureKey(weapon) || 'socratic';
            const proposal = buildBandProposal({
                band,
                blockMeta,
                weapon,
                title: `${weapon.label} — §${band.bandId}`,
                rationale: (diag?.enhancement_opportunity || `Strengthen learning for ${band.label} with an interactive checkpoint.`).slice(0, 500),
                tier: 'major',
                placementNote: `Band ${band.bandId} (coverage fill)`,
                necessity: 'recommended',
                downgradeNote,
                diagnosis: diag,
                featureKey,
                bundleTier: 'non_m'
            });
            if (!proposal) return;

            if (proposal.scanId === 'scan_simulation') simulationCount++;
            results.push(proposal);
            usedBlocks.add(blockUseKey);
            usedFeatures.add(getProposalFeatureKey(proposal));
        });

        return results;
    }

    function ensureMajorBandCoverage(bands, proposals, menuById, outlineMeta, diagnosisByBand) {
        return ensureMajorBandBundleCoverage(bands, proposals, menuById, outlineMeta, diagnosisByBand);
    }

    function necessityRank(n) {
        if (n === 'essential') return 3;
        if (n === 'recommended') return 2;
        return 1;
    }

    function enforceMBundleCaps(proposals, diagnosisByBand, eligibleBands) {
        const byBand = new Map();
        (proposals || []).forEach(p => {
            if (!byBand.has(p.bandId)) byBand.set(p.bandId, []);
            byBand.get(p.bandId).push(p);
        });
        const kept = [];
        const bandList = eligibleBands || [...byBand.keys()].map(id => ({ bandId: id }));

        bandList.forEach(band => {
            const bandId = band.bandId;
            const items = byBand.get(bandId) || [];
            const mItems = items.filter(p => isMFeatureKey(getProposalFeatureKey(p)));
            const nonM = items.filter(p => !isMFeatureKey(getProposalFeatureKey(p)));
            const gapScore = scoreBandGapForM(diagnosisByBand?.[bandId], band);

            mItems.sort((a, b) => necessityRank(b.necessity) - necessityRank(a.necessity));
            let keptM = mItems;
            if (keptM.length > MAX_M_PER_BAND) {
                keptM.slice(MAX_M_PER_BAND).forEach(p => {
                    p.downgradeNote = (p.downgradeNote ? p.downgradeNote + ' ' : '')
                        + `Dropped — max ${MAX_M_PER_BAND} M-tier items per section.`;
                });
                keptM = keptM.slice(0, MAX_M_PER_BAND);
            }
            if (keptM.length >= 2 && gapScore < M_GAP_SCORE_THRESHOLD) {
                const dropped = keptM.pop();
                if (dropped) {
                    dropped.downgradeNote = (dropped.downgradeNote ? dropped.downgradeNote + ' ' : '')
                        + 'Second M-tier item dropped — section gap score below threshold.';
                }
            }
            kept.push(...nonM, ...keptM);
        });

        const maxMChapter = Math.ceil((eligibleBands?.length || bandList.length) * 1.35);
        let mAll = kept.filter(p => isMFeatureKey(getProposalFeatureKey(p)));
        if (mAll.length > maxMChapter) {
            mAll.sort((a, b) => {
                const sa = scoreBandGapForM(diagnosisByBand?.[a.bandId], eligibleBands?.find(bnd => bnd.bandId === a.bandId) || { blocks: [] });
                const sb = scoreBandGapForM(diagnosisByBand?.[b.bandId], eligibleBands?.find(bnd => bnd.bandId === b.bandId) || { blocks: [] });
                return sa - sb || necessityRank(a.necessity) - necessityRank(b.necessity);
            });
            const dropIds = new Set(mAll.slice(0, mAll.length - maxMChapter).map(p => p.findingId));
            return kept.filter(p => {
                if (!dropIds.has(p.findingId)) return true;
                p.downgradeNote = (p.downgradeNote ? p.downgradeNote + ' ' : '')
                    + 'Dropped — chapter M-tier budget reached.';
                return false;
            });
        }
        return kept;
    }

    function enforceChapterVariety(proposals) {
        const results = [...(proposals || [])];
        results.forEach(p => {
            if (!p.plannedFeatureKey) p.plannedFeatureKey = getProposalFeatureKey(p);
            if (!p.plannedScanId) p.plannedScanId = p.scanId;
        });
        const featureCounts = new Map();
        results.forEach(p => {
            const k = getProposalFeatureKey(p);
            featureCounts.set(k, (featureCounts.get(k) || 0) + 1);
        });
        const total = results.length || 1;
        results.forEach((p, idx) => {
            const key = getProposalFeatureKey(p);
            const count = featureCounts.get(key) || 0;
            const share = count / total;
            if (key === 'illustrate_analogy' && share > MAX_ANALOGY_SHARE && count > 2) {
                const altKeys = ['socratic', 'counter', 'explain_peer', 'recall'].filter(k => (featureCounts.get(k) || 0) < 2);
                if (altKeys.length && p.necessity === 'optional') {
                    p.downgradeNote = (p.downgradeNote ? p.downgradeNote + ' ' : '')
                        + `Variety: ${key} share high — consider skipping or swapping.`;
                }
            }
        });
        return results;
    }

    function getProposalFeatureKey(proposal) {
        if (proposal.scanId === 'scan_illustrate') {
            return proposal.payload?.illustrateStyle === 'news' ? 'illustrate_news' : 'illustrate_analogy';
        }
        if (proposal.scanId === 'scan_simulation') return 'simulation';
        if (proposal.scanId === 'scan_socratic') return 'socratic';
        if (proposal.scanId === 'scan_counter') return 'counter';
        if (proposal.scanId === 'scan_case_study') return 'case_study';
        if (proposal.scanId === 'scan_explain_peer') return 'explain_peer';
        if (proposal.scanId === 'scan_recall') return 'recall';
        return proposal.scanId;
    }

    const COVERAGE_FILL_NON_M_ORDER = ['socratic', 'counter', 'explain_peer', 'recall', 'case_study'];

    function weaponToFeatureKey(weapon) {
        if (!weapon) return '';
        return Object.entries(ENHANCEMENT_WEAPONS).find(([, w]) => w === weapon)?.[0] || '';
    }

    function bandHasEffectiveNonM(proposals, bandId) {
        return (proposals || []).some(p =>
            p.bandId === bandId && !isMFeatureKey(getProposalFeatureKey(p))
        );
    }

    function isSoleEffectiveNonM(proposal, proposals) {
        if (!proposal?.bandId || isMFeatureKey(getProposalFeatureKey(proposal))) return false;
        return (proposals || []).filter(p =>
            p.bandId === proposal.bandId && !isMFeatureKey(getProposalFeatureKey(p))
        ).length === 1;
    }

    function pickCoverageFillWeapon(diag, band, usedFeatures, bandFeatureKeys) {
        let weapon = inferWeaponFromDiagnosis(diag, band, usedFeatures);
        let featureKey = weaponToFeatureKey(weapon);
        if (featureKey && isMFeatureKey(featureKey)) {
            weapon = downgradeWeaponFromSimulation(band, usedFeatures);
            featureKey = weaponToFeatureKey(weapon);
        }
        if (!weapon?.scanId) return { weapon: null, featureKey: '' };
        if (featureKey && bandFeatureKeys.has(featureKey)) {
            for (const key of COVERAGE_FILL_NON_M_ORDER) {
                if (bandFeatureKeys.has(key)) continue;
                if (usedFeatures.has(key)) continue;
                if (ENHANCEMENT_WEAPONS[key]) {
                    weapon = ENHANCEMENT_WEAPONS[key];
                    featureKey = key;
                    break;
                }
            }
        }
        return { weapon, featureKey: featureKey || weaponToFeatureKey(weapon) };
    }

    function analogyShapedProposal(p) {
        const text = `${p.rationale || ''} ${p.title || ''}`;
        return /\banalogy\b|\bcompare.*\bto\b|\blike a\b|\bcity border\b/i.test(text);
    }

    function topicFromProposalHeading(sectionHeading, title) {
        if (title && /^case study:\s*/i.test(title)) {
            return title.replace(/^case study:\s*/i, '').trim();
        }
        return String(sectionHeading || '').replace(/^[\d.]+\s*/, '').trim() || 'this section';
    }

    function syncProposalAfterNewsConversion(proposal, fromKey, conversionKind) {
        proposal.bundleTier = 'm';
        const topic = topicFromProposalHeading(proposal.sectionHeading, proposal.title);
        if (/^case study:/i.test(proposal.title || '')) {
            proposal.title = proposal.title.replace(/^case study:/i, 'Real-World Application:');
        } else if (!/^real-world application:/i.test(proposal.title || '')) {
            proposal.title = `Real-World Application: ${topic}`;
        }
        const DE = global.DreamBookEnhancements;
        if (DE?.buildAuthorProposalDescriptionParts) {
            const parts = DE.buildAuthorProposalDescriptionParts(
                { ...proposal, rationale: '' },
                null
            );
            proposal.rationale = parts.text || proposal.rationale;
        } else if (DE?.buildAuthorProposalDescription) {
            proposal.rationale = DE.buildAuthorProposalDescription(
                { ...proposal, rationale: '' },
                null
            );
        } else {
            proposal.rationale = (proposal.rationale || '')
                .replace(/\bintroduce a case study\b/gi, 'Add a real-world application')
                .replace(/\bcase study\b/gi, 'real-world application');
        }
        const suffix = conversionKind === 'shared_band'
            ? '(band retains non-M checkpoint).'
            : '(optional M-tier item).';
        if (!proposal.downgradeNote) {
            proposal.downgradeNote = `Converted from ${fromKey} to news for chapter variety ${suffix}`;
        }
    }

    function rankNewsConversionCandidates(proposals) {
        const ranked = [];
        (proposals || []).forEach(p => {
            const key = getProposalFeatureKey(p);
            if (key === 'illustrate_analogy') {
                if (analogyShapedProposal(p)) return;
                if (!bandHasEffectiveNonM(proposals, p.bandId)) return;
                const rank = p.necessity === 'optional' ? 1 : 2;
                ranked.push({ p, rank, conversionKind: 'optional_m' });
            } else if (key === 'case_study' || p.scanId === 'scan_case_study') {
                if (isSoleEffectiveNonM(p, proposals)) return;
                if (!bandHasEffectiveNonM(proposals, p.bandId)) return;
                ranked.push({ p, rank: 3, conversionKind: 'shared_band' });
            }
        });
        ranked.sort((a, b) =>
            a.rank - b.rank
            || necessityRank(b.p.necessity) - necessityRank(a.p.necessity)
        );
        return ranked;
    }

    function convertProposalToNews(proposal, fromKey, conversionKind, usedFormatsByAction) {
        if (!proposal.plannedFeatureKey) proposal.plannedFeatureKey = getProposalFeatureKey(proposal);
        if (!proposal.plannedScanId) proposal.plannedScanId = proposal.scanId;
        proposal.scanId = 'scan_illustrate';
        proposal.payload = global.DreamBookEnhancements?.normalizeIllustratePayload
            ? global.DreamBookEnhancements.normalizeIllustratePayload({
                illustrateStyle: 'news',
                widgetActionId: 'illustrate-news'
            })
            : { illustrateStyle: 'news', widgetActionId: 'illustrate-news' };
        syncProposalAfterNewsConversion(proposal, fromKey, conversionKind);
        assignFormatToProposal(proposal, usedFormatsByAction);
    }

    function assignFormatToProposal(proposal, usedFormatsByAction) {
        const actionId = WEAPON_TO_ACTION[proposal.scanId];
        if (!actionId || !global.DreamBookModuleFormats?.pickNextFormatId) return proposal;
        const used = usedFormatsByAction.get(actionId) || [];
        const mf = global.DreamBookModuleFormats;
        const existing = mf.normalizeFormatId?.(proposal.payload?.formatId, actionId);
        if (existing && mf.resolveFormat?.(actionId, existing)) {
            proposal.payload = { ...(proposal.payload || {}), formatId: existing };
            if (!used.includes(existing)) used.push(existing);
            usedFormatsByAction.set(actionId, used);
            return proposal;
        }
        const formatId = mf.pickNextFormatId(actionId, used);
        if (formatId) {
            proposal.payload = { ...(proposal.payload || {}), formatId };
            used.push(formatId);
            usedFormatsByAction.set(actionId, used);
        }
        return proposal;
    }

    function assignChapterFormats(proposals, eligibleBands, diagnosisByBand) {
        const results = [...(proposals || [])];
        const usedFormatsByAction = new Map();
        const analogyCount = results.filter(p => getProposalFeatureKey(p) === 'illustrate_analogy').length;
        const maxAnalogy = Math.max(1, Math.floor(results.length * MAX_ANALOGY_SHARE));
        let newsCount = results.filter(p => getProposalFeatureKey(p) === 'illustrate_news').length;
        const needNews = eligibleBands?.length >= MIN_BANDS_FOR_NEWS_MIX
            ? Math.max(0, MIN_NEWS_WHEN_MANY_BANDS - newsCount)
            : 0;

        results.forEach((p) => {
            assignFormatToProposal(p, usedFormatsByAction);
        });

        assignRecallFormats(results, eligibleBands, diagnosisByBand);

        if (needNews > 0) {
            const ranked = rankNewsConversionCandidates(results);
            ranked.slice(0, needNews).forEach(({ p, conversionKind }) => {
                const fromKey = p.plannedFeatureKey || getProposalFeatureKey(p);
                convertProposalToNews(p, fromKey, conversionKind, usedFormatsByAction);
                newsCount++;
            });
        }

        if (analogyCount > maxAnalogy) {
            let toConvert = analogyCount - maxAnalogy;
            results.filter(p => getProposalFeatureKey(p) === 'illustrate_analogy').slice(0, toConvert).forEach(p => {
                if (!p.plannedFeatureKey) p.plannedFeatureKey = getProposalFeatureKey(p);
                if (!p.plannedScanId) p.plannedScanId = p.scanId;
                const band = eligibleBands?.find(b => b.bandId === p.bandId);
                const alt = downgradeWeaponFromSimulation(band || { blocks: [] }, new Set());
                if (!alt?.scanId) return;
                p.scanId = alt.scanId;
                p.payload = { ...(alt.payload || {}) };
                p.downgradeNote = p.downgradeNote || `Converted from ${p.plannedFeatureKey} — analogy cap reached.`;
                assignFormatToProposal(p, usedFormatsByAction);
            });
        }

        return results;
    }

    function finalizeBandProposals(proposals, eligibleBands, diagnosisByBand) {
        let results = enforceChapterVariety(proposals);
        if (diagnosisByBand) {
            results = enforceMBundleCaps(results, diagnosisByBand, eligibleBands);
        }
        return assignChapterFormats(results, eligibleBands, diagnosisByBand);
    }

    function formatsCatalogForPrompt() {
        const mf = global.DreamBookModuleFormats;
        const lines = ['scan_recall: recall_format one of mcq, match, order'];
        if (!mf?.listFormatIds) return lines.join('\n');
        Object.entries(WEAPON_TO_ACTION).forEach(([scanKey, actionId]) => {
            const ids = mf.listFormatIds(actionId);
            if (ids.length) lines.push(`${scanKey}: format_id one of ${ids.join(', ')}`);
        });
        return lines.join('\n');
    }

    function indexDiagnosisByBand(diagnosisResponse) {
        const map = {};
        (diagnosisResponse?.bands || diagnosisResponse?.diagnoses || []).forEach(d => {
            const id = String(d.band_id || d.bandId || '').trim();
            if (id) map[id] = d;
        });
        return map;
    }

    function weaponsCatalogText() {
        return Object.entries(ENHANCEMENT_WEAPONS)
            .filter(([k, w]) => k !== 'none' && w && w.label)
            .map(([id, w]) => `- ${id}: ${w.label}`)
            .join('\n');
    }

    function contentContainsBannedHook(text) {
        return BANNED_HOOK_PATTERNS.some(p => p.test(text || ''));
    }

    global.DreamBookEnhancementBands = {
        WIDGET_SOURCE_PASSAGE_MODE,
        ENHANCEMENT_WEAPONS,
        MAX_SIMULATIONS_PER_CHAPTER,
        MAX_M_PER_BAND,
        NON_M_FEATURES,
        M_FEATURES,
        BANNED_HOOK_PATTERNS,
        extractBandKey,
        buildMajorSectionBands,
        formatBandSourceText,
        formatBandTextForDiagnosis,
        formatBandsForDiagnosisPrompt,
        buildBandCandidateMenu,
        buildBandFlexibleCandidateMenu,
        buildAllBandCandidateMenus,
        rankPhETMatchesForText,
        formatPhETAllowlistForBand,
        pickMajorBandAnchorBlock,
        proposalsFromBandBundles,
        proposalsFromBandRecommendations,
        ensureMajorBandBundleCoverage,
        ensureMajorBandCoverage,
        enforceMBundleCaps,
        enforceChapterVariety,
        assignChapterFormats,
        assignRecallFormats,
        inferRecallFormatFromBand,
        normalizeRecallFormat,
        RECALL_FORMAT_ORDER,
        finalizeBandProposals,
        getProposalFeatureKey,
        bandHasEffectiveNonM,
        isSoleEffectiveNonM,
        isNonMFeatureKey,
        isMFeatureKey,
        scoreBandGapForM,
        formatsCatalogForPrompt,
        BANNED_DOMAIN_PATTERNS,
        POP_CULTURE_ROTATION,
        inferWeaponFromDiagnosis,
        inferBandPromptProfile,
        indexDiagnosisByBand,
        weaponsCatalogText,
        bandCandidatePrefix,
        resolveWeapon,
        contentContainsBannedHook,
        figureDedupeKey: (figureId, sectionHeading) => {
            const bandKey = extractBandKey(sectionHeading) || normalizeText(sectionHeading).slice(0, 48);
            return `${figureId}|${bandKey}`;
        }
    };
})(typeof window !== 'undefined' ? window : globalThis);
