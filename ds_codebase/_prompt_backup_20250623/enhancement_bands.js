/**
 * Major-section-band enhancement pipeline (Pass 1 diagnosis → Pass 2 recommendation).
 * v11: format rotation, news mix, variety controls, bandBlockIds, downgrade transparency.
 */
(function (global) {
    'use strict';

    const MAX_SIMULATIONS_PER_CHAPTER = 2;
    const MIN_PHET_MATCH_SCORE = 8;

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
            label: 'Trivia',
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
            payload: { recallFormat: 'mcq', widgetActionId: 'recall-check' }
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
            .filter(r => r.score >= MIN_PHET_MATCH_SCORE && (r.meta.primarySubject || '') === 'biology')
            .sort((a, b) => b.score - a.score);
        return ranked.slice(0, limit || 5);
    }

    function formatPhETAllowlistForBand(band) {
        const text = formatBandSourceText(band, 4000);
        const matches = rankPhETMatchesForText(text, 4);
        if (!matches.length) return 'No PhET Biology simulation matches this band well — do NOT use feature "simulation". Use illustrate_analogy, socratic, counter, case_study, explain_peer, or recall instead.';
        return 'Allowed PhET Biology slugs for simulation (pick at most one band in chapter): ' +
            matches.map(m => `${m.id} (${m.meta.label}, score ${m.score})`).join('; ');
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

    function buildBandCandidateMenu(band, usedBlockIds) {
        const prefix = bandCandidatePrefix(band.bandId);
        const bodyBlocks = band.blocks || [];
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
                sectionHeading: band.label,
                excerpt: text.length > 280 ? text.slice(0, 280) + '…' : text,
                bodyIndex,
                bodyCount: bodyBlocks.length,
                placement: 'end_of_major_band'
            });
        });
        return menu;
    }

    function buildAllBandCandidateMenus(bands, usedBlockIds) {
        const menuById = new Map();
        const lines = [];
        (bands || []).forEach(band => {
            const menu = buildBandCandidateMenu(band, usedBlockIds);
            if (!menu.length) return;
            lines.push(`Band ${band.bandId} (${band.label}) — insert at END of band after all subsections:`);
            lines.push(formatPhETAllowlistForBand(band));
            menu.forEach(c => {
                menuById.set(c.candidateId, c);
                lines.push(`  ${c.candidateId} | end anchor paragraph ${c.bodyIndex + 1} of ${c.bodyCount}\n    "${c.excerpt}"`);
            });
            lines.push('');
        });
        return { menuById, menuText: lines.join('\n') };
    }

    function anchorQuoteFromBlockText(text) {
        const t = normalizeText(text);
        if (!t) return '';
        const first = t.split(/[.!?]/)[0]?.trim();
        return (first && first.length >= 20 ? first : t).slice(0, 80);
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
            payload.recallFormat = raw.recall_format || raw.recallFormat || 'mcq';
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
        let payload = buildPayloadForWeapon(weapon, opts.raw || {}, band);
        if (!payload) return null;
        payload = normalizePayloadFormatId(weapon.scanId, payload);
        const bandSourceText = formatBandSourceText(band, 5000);
        const bandBlockIds = (band.blocks || []).map(b => b.blockId).filter(Boolean);
        return makeProposal({
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
            placementNote: opts.placementNote || `Band ${band.bandId} (major section)`
        });
    }

    function resolveMenuEntry(raw, band, menuById, usedBlocks) {
        let candidateId = String(raw?.candidate_id || raw?.candidateId || '').trim().toUpperCase();
        candidateId = candidateId.replace(/^B(\d+)\.(\d+)/i, 'B$1_$2');
        let entry = candidateId ? menuById.get(candidateId) : null;
        if (!entry) {
            entry = [...menuById.values()].find(c =>
                c.bandId === band.bandId && !usedBlocks.has(c.blockId)
            );
        }
        if (!entry) {
            const anchor = pickMajorBandAnchorBlock(band);
            if (anchor) entry = { blockId: anchor.blockId, bandId: band.bandId, sectionHeading: band.label };
        }
        return entry;
    }

    function proposalsFromBandRecommendations(recommendations, bands, menuById, outlineMeta, diagnosisByBand) {
        if (!global.DreamBookEnhancements?.makeProposal) return [];
        const usedMajorBands = new Set();
        const usedBlocks = new Set();
        const usedFeatures = new Set();
        let simulationCount = 0;
        const proposals = [];

        (recommendations || []).forEach(raw => {
            const bandId = String(raw.band_id || raw.bandId || '').trim();
            const tier = raw.tier || 'major';
            if (!bandId || tier !== 'major' || usedMajorBands.has(bandId)) return;

            let feature = raw.feature || raw.weapon || raw.recommendation_type;
            let weapon = resolveWeapon(feature);
            if (!weapon || feature === 'none') return;

            const band = bands.find(b => String(b.bandId) === bandId);
            if (!band) return;

            let downgradeNote = '';
            if (weapon.scanId === 'scan_simulation') {
                if (simulationCount >= MAX_SIMULATIONS_PER_CHAPTER) {
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

            const entry = resolveMenuEntry(raw, band, menuById, usedBlocks);
            if (!entry || usedBlocks.has(entry.blockId)) return;
            const blockMeta = outlineMeta?.blockIndex?.[entry.blockId];
            if (!blockMeta) return;

            const rationale = (raw.rationale || raw.why || '').trim();
            if (rationale.length < 20) return;

            const diag = diagnosisByBand?.[bandId];
            const proposal = buildBandProposal({
                band,
                blockMeta,
                weapon,
                raw,
                title: raw.title,
                rationale: rationale.slice(0, 600),
                tier: 'major',
                placementNote: diag?.core_concept ? `Band ${bandId}: ${diag.core_concept}` : `Band ${bandId}`,
                necessity: raw.necessity,
                downgradeNote
            });
            if (!proposal) return;

            if (proposal.scanId === 'scan_simulation') simulationCount++;

            proposals.push(proposal);
            usedMajorBands.add(bandId);
            usedBlocks.add(entry.blockId);
            usedFeatures.add(feature.replace(/-/g, '_'));
        });

        return proposals;
    }

    function ensureMajorBandCoverage(bands, proposals, menuById, outlineMeta, diagnosisByBand) {
        const covered = new Set((proposals || []).map(p => p.bandId));
        const usedBlocks = new Set((proposals || []).map(p => p.afterBlockId));
        const usedFeatures = new Set((proposals || []).map(p => {
            if (p.scanId === 'scan_illustrate') return p.payload?.illustrateStyle === 'news' ? 'illustrate_news' : 'illustrate_analogy';
            if (p.scanId === 'scan_simulation') return 'simulation';
            if (p.scanId === 'scan_socratic') return 'socratic';
            if (p.scanId === 'scan_counter') return 'counter';
            if (p.scanId === 'scan_case_study') return 'case_study';
            if (p.scanId === 'scan_explain_peer') return 'explain_peer';
            if (p.scanId === 'scan_recall') return 'recall';
            return p.scanId;
        }));
        let simulationCount = (proposals || []).filter(p => p.scanId === 'scan_simulation').length;
        const results = [...(proposals || [])];

        (bands || []).forEach(band => {
            if (covered.has(band.bandId)) return;
            const diag = diagnosisByBand?.[band.bandId];
            if (diag?.skip) return;

            let weapon = inferWeaponFromDiagnosis(diag, band, usedFeatures);
            let downgradeNote = '';
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
            if (usedBlocks.has(anchor.blockId)) return;

            const proposal = buildBandProposal({
                band,
                blockMeta,
                weapon,
                title: `${weapon.label} — §${band.bandId}`,
                rationale: (diag?.enhancement_opportunity || `Strengthen learning for ${band.label} with an interactive checkpoint.`).slice(0, 500),
                tier: 'major',
                placementNote: `Band ${band.bandId} (coverage fill)`,
                necessity: 'recommended',
                downgradeNote
            });
            if (!proposal) return;

            if (proposal.scanId === 'scan_simulation') simulationCount++;
            results.push(proposal);
            covered.add(band.bandId);
            usedBlocks.add(anchor.blockId);
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

    function assignChapterFormats(proposals, eligibleBands) {
        const results = [...(proposals || [])];
        const usedFormatsByAction = new Map();
        const analogyCount = results.filter(p => getProposalFeatureKey(p) === 'illustrate_analogy').length;
        const maxAnalogy = Math.max(1, Math.floor(results.length * MAX_ANALOGY_SHARE));
        let newsCount = results.filter(p => getProposalFeatureKey(p) === 'illustrate_news').length;
        const needNews = eligibleBands?.length >= MIN_BANDS_FOR_NEWS_MIX
            ? Math.max(0, MIN_NEWS_WHEN_MANY_BANDS - newsCount)
            : 0;

        results.forEach((p, idx) => {
            assignFormatToProposal(p, usedFormatsByAction);
        });

        if (needNews > 0) {
            const candidates = results.filter(p =>
                getProposalFeatureKey(p) === 'illustrate_analogy'
                || p.scanId === 'scan_case_study'
            );
            candidates.slice(0, needNews).forEach(p => {
                p.scanId = 'scan_illustrate';
                p.payload = global.DreamBookEnhancements?.normalizeIllustratePayload
                    ? global.DreamBookEnhancements.normalizeIllustratePayload({
                        illustrateStyle: 'news',
                        widgetActionId: 'illustrate-news'
                    })
                    : { illustrateStyle: 'news', widgetActionId: 'illustrate-news' };
                newsCount++;
            });
        }

        if (analogyCount > maxAnalogy) {
            let toConvert = analogyCount - maxAnalogy;
            results.filter(p => getProposalFeatureKey(p) === 'illustrate_analogy').slice(0, toConvert).forEach(p => {
                const band = eligibleBands?.find(b => b.bandId === p.bandId);
                const alt = downgradeWeaponFromSimulation(band || { blocks: [] }, new Set());
                p.scanId = alt.scanId;
                p.payload = { ...(alt.payload || {}) };
                assignFormatToProposal(p, usedFormatsByAction);
            });
        }

        return results;
    }

    function finalizeBandProposals(proposals, eligibleBands) {
        return assignChapterFormats(proposals, eligibleBands);
    }

    function formatsCatalogForPrompt() {
        const mf = global.DreamBookModuleFormats;
        if (!mf?.listFormatIds) return '';
        const lines = [];
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
            .filter(([k]) => k !== 'none')
            .map(([id, w]) => `- ${id}: ${w.label}`)
            .join('\n');
    }

    function contentContainsBannedHook(text) {
        return BANNED_HOOK_PATTERNS.some(p => p.test(text || ''));
    }

    global.DreamBookEnhancementBands = {
        ENHANCEMENT_WEAPONS,
        MAX_SIMULATIONS_PER_CHAPTER,
        BANNED_HOOK_PATTERNS,
        extractBandKey,
        buildMajorSectionBands,
        formatBandSourceText,
        formatBandTextForDiagnosis,
        formatBandsForDiagnosisPrompt,
        buildBandCandidateMenu,
        buildAllBandCandidateMenus,
        rankPhETMatchesForText,
        formatPhETAllowlistForBand,
        pickMajorBandAnchorBlock,
        proposalsFromBandRecommendations,
        ensureMajorBandCoverage,
        assignChapterFormats,
        finalizeBandProposals,
        getProposalFeatureKey,
        formatsCatalogForPrompt,
        BANNED_DOMAIN_PATTERNS,
        POP_CULTURE_ROTATION,
        inferWeaponFromDiagnosis,
        indexDiagnosisByBand,
        weaponsCatalogText,
        bandCandidatePrefix,
        resolveWeapon,
        contentContainsBannedHook
    };
})(typeof window !== 'undefined' ? window : globalThis);
