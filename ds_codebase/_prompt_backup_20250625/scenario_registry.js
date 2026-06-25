/**
 * Bulk-safe scenario assignment for widget generation.
 * Pre-assigns one unique setting per widget before parallel AI calls.
 */
(function (global) {
    'use strict';

    const SCENARIO_FIRST_FORMATS = new Set(['what_if', 'mystery_clinic', 'coach_debrief', 'detective_case']);
    const SPORTS_IDS = new Set(['cricket_match', 'football_squad']);

    const SCENARIO_CATALOG = [
        { id: 'urban_services', label: 'city services and infrastructure', examples: 'water treatment, power grid, waste collection, transit hubs', keywords: ['city', 'urban', 'infrastructure', 'municipal', 'utility'], widgetTypes: ['illustrate', 'case_study', 'opposing-view', 'socratic'] },
        { id: 'architecture_homes', label: 'different types of houses and buildings', examples: 'brick house vs glass office, insulation, foundations, roofing', keywords: ['house', 'home', 'building', 'architecture', 'dwelling'], widgetTypes: ['illustrate', 'case_study', 'opposing-view'] },
        { id: 'factory_floor', label: 'factory production floor', examples: 'assembly line, quality control, warehouse routing, shift handoffs', keywords: ['factory', 'assembly', 'production', 'manufacturing', 'warehouse'], widgetTypes: ['illustrate', 'case_study', 'opposing-view'] },
        { id: 'business_merger', label: 'business partnership or merger', examples: 'two firms combining teams, shared resources, distinct specialties', keywords: ['business', 'merger', 'partnership', 'company', 'corporate'], widgetTypes: ['illustrate', 'case_study', 'opposing-view'] },
        { id: 'energy_grid', label: 'power plant and solar farm energy exchange', examples: 'grid load, solar input, battery storage, peak demand', keywords: ['power plant', 'solar', 'energy grid', 'electricity', 'renewable'], widgetTypes: ['illustrate', 'case_study', 'opposing-view'] },
        { id: 'kitchen_prep', label: 'commercial kitchen prep line', examples: 'prep stations, food safety, ingredient flow, cleanup crew', keywords: ['kitchen', 'chef', 'culinary', 'prep line', 'cooking'], widgetTypes: ['illustrate', 'case_study', 'opposing-view'] },
        { id: 'clinic_lab', label: 'clinic or lab bench', examples: 'sample processing, diagnostic workflow, sterile technique', keywords: ['clinic', 'lab', 'laboratory', 'patient', 'diagnostic'], widgetTypes: ['illustrate', 'case_study', 'socratic', 'opposing-view'] },
        { id: 'training_room', label: 'sports training room', examples: 'physio table, equipment checkout, recovery protocols, coaching board', keywords: ['training room', 'physio', 'athlete', 'workout'], widgetTypes: ['case_study', 'socratic', 'opposing-view'] },
        { id: 'farm_field', label: 'farm field trial', examples: 'crop rows, irrigation lines, soil testing, harvest timing', keywords: ['farm', 'field', 'crop', 'agriculture', 'harvest'], widgetTypes: ['illustrate', 'case_study', 'opposing-view'] },
        { id: 'shipping_port', label: 'shipping port logistics', examples: 'container routing, customs checks, loading cranes, schedules', keywords: ['port', 'shipping', 'cargo', 'logistics', 'container'], widgetTypes: ['illustrate', 'case_study', 'opposing-view'] },
        { id: 'transit_system', label: 'public transit network', examples: 'bus routes, metro lines, transfers, peak scheduling', keywords: ['transit', 'bus route', 'metro', 'commute'], widgetTypes: ['illustrate', 'case_study', 'opposing-view'] },
        { id: 'library_archive', label: 'library or archive', examples: 'cataloguing, lending desk, preservation vault, reading rooms', keywords: ['library', 'archive', 'catalog', 'bookshelf'], widgetTypes: ['illustrate', 'case_study', 'opposing-view'] },
        { id: 'construction_site', label: 'construction site', examples: 'blueprints, scaffolding, inspections, subcontractor crews', keywords: ['construction', 'scaffold', 'builder', 'blueprint'], widgetTypes: ['illustrate', 'case_study', 'opposing-view'] },
        { id: 'recycling_plant', label: 'recycling and waste-sorting facility', examples: 'sorting belts, contamination checks, material recovery', keywords: ['recycling', 'sorting', 'waste facility'], widgetTypes: ['illustrate', 'case_study', 'opposing-view'] },
        { id: 'music_studio', label: 'recording studio', examples: 'tracking rooms, mixing desk, session musicians, mastering', keywords: ['recording studio', 'music studio', 'mixing', 'musician'], widgetTypes: ['illustrate', 'case_study', 'opposing-view'] },
        { id: 'software_startup', label: 'software team workspace', examples: 'sprint board, code review, deployment pipeline, on-call rotation', keywords: ['software', 'startup', 'developer', 'codebase'], widgetTypes: ['illustrate', 'case_study', 'opposing-view'] },
        { id: 'community_garden', label: 'community garden', examples: 'plot assignments, compost bins, shared tools, seasonal planting', keywords: ['garden', 'greenhouse', 'compost', 'planting'], widgetTypes: ['illustrate', 'case_study', 'opposing-view'] },
        { id: 'aquarium_research', label: 'aquarium research tank', examples: 'water chemistry, specimen tanks, filtration loops, feeding schedules', keywords: ['aquarium', 'tank', 'marine', 'filtration'], widgetTypes: ['illustrate', 'case_study', 'opposing-view'] },
        { id: 'cricket_match', label: 'cricket match strategy', examples: 'batting order, field placements, innings changeover, grounds crew', keywords: ['cricket', 'wicket', 'innings', 'batsman'], widgetTypes: ['illustrate', 'case_study', 'opposing-view'] },
        { id: 'football_squad', label: 'football squad coordination', examples: 'formation shifts, substitutions, training drills, match analysis', keywords: ['football', 'soccer', 'squad', 'pitch'], widgetTypes: ['illustrate', 'case_study', 'opposing-view'] },
        { id: 'gaming_coop', label: 'co-op video game mission', examples: 'party roles, resource sharing, level progression, respawn rules', keywords: ['video game', 'gaming', 'co-op', 'level'], widgetTypes: ['illustrate', 'case_study', 'opposing-view'] },
        { id: 'bakery_shift', label: 'neighborhood bakery shift', examples: 'oven timing, proofing racks, morning rush, ingredient orders', keywords: ['bakery', 'oven', 'pastry', 'baker'], widgetTypes: ['illustrate', 'case_study', 'opposing-view'] },
        { id: 'hospital_triage', label: 'hospital triage desk', examples: 'intake vitals, priority sorting, handoff to specialists', keywords: ['triage', 'emergency room', 'hospital intake'], widgetTypes: ['case_study', 'socratic', 'opposing-view'] },
        { id: 'theater_rehearsal', label: 'theater rehearsal stage', examples: 'cue cards, set changes, dress rehearsal, backstage crew', keywords: ['theater', 'rehearsal', 'stage', 'backstage'], widgetTypes: ['illustrate', 'case_study', 'opposing-view'] }
    ];

    const RATIONALE_HINTS = [
        { pattern: /\bcity analogy\b|\bcity services\b|\burban services\b/i, id: 'urban_services' },
        { pattern: /\bcity\b|\burban\b|\binfrastructure\b/i, id: 'urban_services' },
        { pattern: /\bhouse\b|\bhouses\b|\bhome\b|\bdifferent types of houses\b|\btypes of houses\b/i, id: 'architecture_homes' },
        { pattern: /\bfactory\b|\bassembly line\b|\bproduction floor\b/i, id: 'factory_floor' },
        { pattern: /\bbusiness partnership\b|\bbusiness merger\b|\bmerging for mutual\b|\bmerger\b|\bpartnership\b|\bmerging\b/i, id: 'business_merger' },
        { pattern: /\bsymbiotic\b|\bendosymbiotic\b/i, id: 'business_merger' },
        { pattern: /\bpower plant\b|\bsolar farm\b|\benergy exchange\b|\bsolar\b/i, id: 'energy_grid' },
        { pattern: /\bkitchen\b|\bchef\b|\bprep line\b|\bculinary\b/i, id: 'kitchen_prep' },
        { pattern: /\blab bench\b|\bclinic\b|\blaboratory\b|\blab\b/i, id: 'clinic_lab' },
        { pattern: /\btissue\b|\bjunction\b|\bdesmosome\b|\becm\b/i, id: 'clinic_lab' },
        { pattern: /\btraining room\b|\bsports training\b/i, id: 'training_room' },
        { pattern: /\bfarm\b|\bfield trial\b|\bagricultur/i, id: 'farm_field' },
        { pattern: /\bmusic\b|\brecording studio\b|\bmusic studio\b/i, id: 'music_studio' },
        { pattern: /\bgaming\b|\bvideo game\b/i, id: 'gaming_coop' },
        { pattern: /\bcricket\b/i, id: 'cricket_match' },
        { pattern: /\bfootball\b|\bsoccer\b/i, id: 'football_squad' }
    ];

    const PEDAGOGY_CHROME_PATTERNS = [
        /edit delete[^\n]*/gi,
        /description delete[^\n]*/gi,
        /Illustration text \(click to expand\)[^\n]*/gi,
        /moderate difficulty · \d+ turns[^\n]*/gi,
        /progress_activity[^\n]*/gi,
        /Generating widget[^\n]*/gi,
        /Interactive Scenario[^\n]*/gi,
        /Socratic Checkpoint[^\n]*/gi,
        /compare_arrows[^\n]*/gi,
        /target Goal:[^\n]*/gi
    ];

    const FOREIGN_SPORTS = /\b(cricket|football|soccer|wicket|innings|batsman|pitch)\b/i;
    const SOCRATIC_NO_HOOK = /\b(imagine|cricket|football|soccer|like a|are like|is like|coach'?s? strategy|\bteam\b|player|physio|training room|compare.*\bto a\b|as a .* (metaphor|analogy))\b/i;

    function getCatalogById(id) {
        return SCENARIO_CATALOG.find(s => s.id === id) || null;
    }

    function getWidgetTypeKey(actionId, formatId, illustrateStyle) {
        if (illustrateStyle === 'news' || formatId === 'news') return null;
        if (actionId === 'illustrate' || illustrateStyle === 'analogy') return 'illustrate';
        if (actionId === 'mini-case-study') return 'case_study';
        if (actionId === 'socratic-question') return 'socratic';
        if (actionId === 'opposing-view') return 'opposing-view';
        return null;
    }

    function formatUsesScenarioFirst(fmt) {
        return !!(fmt && fmt.hookStyle && SCENARIO_FIRST_FORMATS.has(fmt.hookStyle));
    }

    function formatNeedsScenarioDomain(actionId, formatId, illustrateStyle, fmt) {
        if (illustrateStyle === 'news' || formatId === 'news') return false;
        if (illustrateStyle === 'analogy' || formatId === 'analogy') return false;
        if (!actionId && illustrateStyle === 'analogy') return false;
        if (actionId === 'illustrate') return false;
        if (actionId === 'mini-case-study') return true;
        if (actionId === 'opposing-view') return false;
        if (actionId === 'socratic-question') {
            if (formatId === 'explain_own_words') return false;
            if (fmt && formatUsesScenarioFirst(fmt)) return true;
            return false;
        }
        return false;
    }

    function formatForbidsScenarioHooks(actionId, formatId, illustrateStyle, fmt) {
        if (actionId === 'explain-to-peer') return true;
        if (illustrateStyle === 'news' || formatId === 'news') return true;
        if (fmt && formatUsesScenarioFirst(fmt)) return false;
        return false;
    }

    function resolveFindingWidgetMeta(finding) {
        const payload = finding?.payload || {};
        if (finding?.scanId === 'scan_illustrate' || payload.illustrateStyle || payload.widgetActionId?.startsWith('illustrate')) {
            const style = payload.illustrateStyle || payload.formatId
                || (payload.widgetActionId === 'illustrate-news' ? 'news' : 'analogy');
            return { actionId: 'illustrate', formatId: style, illustrateStyle: style };
        }
        const actionId = payload.widgetActionId || finding?.actionId || '';
        const formatId = payload.formatId || '';
        return { actionId, formatId, illustrateStyle: null };
    }

    function extractGoalText(passage) {
        if (!passage?.trim()) return '';
        const m = String(passage).match(/target Goal:\s*([\s\S]*?)(?=\n\n|$)/i);
        return m ? m[1].trim() : '';
    }

    function parseScenarioHints(text) {
        if (!text?.trim()) return [];
        const hits = [];
        const seen = new Set();
        for (const hint of RATIONALE_HINTS) {
            if (hint.pattern.test(text) && !seen.has(hint.id)) {
                seen.add(hint.id);
                hits.push(hint.id);
            }
        }
        return hits;
    }

    function parseRationaleScenarioId(rationale, title) {
        const hints = parseScenarioHints(`${rationale || ''} ${title || ''}`);
        const nonSports = hints.filter(id => !SPORTS_IDS.has(id));
        if (nonSports.length) return nonSports[0];
        return hints[0] || null;
    }

    function resolvePreferredScenarioId(finding) {
        const rationale = finding?.rationale || '';
        const title = finding?.title || '';
        const passage = finding?.displayPassage || finding?.bandSourceText || '';
        const goalText = extractGoalText(passage);

        const goalHints = parseScenarioHints(goalText);
        const rationaleHints = parseScenarioHints(`${rationale} ${title}`);

        const goalNonSports = goalHints.filter(id => !SPORTS_IDS.has(id));
        if (goalNonSports.length) return goalNonSports[0];

        const goalSports = goalHints.filter(id => SPORTS_IDS.has(id));
        if (goalSports.length) return goalSports[0];

        const rationaleNonSports = rationaleHints.filter(id => !SPORTS_IDS.has(id));
        if (rationaleNonSports.length) return rationaleNonSports[0];

        if (finding?.suggestedScenarioId && !SPORTS_IDS.has(finding.suggestedScenarioId)) {
            return finding.suggestedScenarioId;
        }

        const rationaleSports = rationaleHints.filter(id => SPORTS_IDS.has(id));
        if (rationaleSports.length) return rationaleSports[0];

        if (finding?.suggestedScenarioId) return finding.suggestedScenarioId;
        return null;
    }

    function buildAuthorIntentLine(rationale, assignment, passageOrGoal) {
        if (!assignment?.label) return '';
        const goal = extractGoalText(passageOrGoal || '');
        let detail = assignment.label;
        if (goal) {
            if (/\bcity analogy\b|\bcity services\b|\burban services\b/i.test(goal)) {
                detail = 'city services and infrastructure analogy';
            } else if (/\bbusiness partnership\b|\bbusiness merger\b|\bmerging for mutual\b|\bendosymbiotic\b/i.test(goal)) {
                detail = 'business partnership or merger analogy';
            } else if (/\bpower plant\b|\bsolar farm\b|\benergy exchange\b/i.test(goal)) {
                detail = 'power plant and solar farm energy exchange';
            } else if (/\bdifferent types of houses\b|\btypes of houses\b|\bhouse analogy\b/i.test(goal)) {
                detail = 'different types of houses and buildings analogy';
            }
        }
        const sportsOrTraining = SPORTS_IDS.has(assignment.id) || assignment.id === 'training_room';
        const suffix = sportsOrTraining ? '' : ' Do not substitute sports or unrelated domains.';
        return `AUTHOR INTENT: Use a ${detail} (from peer review).${suffix}`;
    }

    function trimSnippet(text, maxLen) {
        const s = String(text || '').trim();
        if (!s) return '';
        return s.length <= maxLen ? s : s.slice(0, maxLen - 1) + '…';
    }

    function buildAssignmentFromSlot(slot, finding, batchUsedLabels) {
        if (!slot?.label) return null;
        const passage = finding?.displayPassage || finding?.bandSourceText || '';
        const rationale = finding?.rationale || (typeof finding === 'string' ? finding : '');
        const forbiddenLabels = (batchUsedLabels || []).filter(l => l !== slot.label);
        return {
            id: slot.id,
            label: slot.label,
            examples: slot.examples,
            keywords: slot.keywords.slice(),
            forbiddenLabels,
            authorIntent: buildAuthorIntentLine(rationale, slot, passage),
            directive: buildScenarioDirective({ id: slot.id, label: slot.label, examples: slot.examples, forbiddenLabels }, batchUsedLabels)
        };
    }

    function buildScenarioDirective(assignment, batchUsed, chapterUsed) {
        if (!assignment?.label) return '';
        const forbidden = [...new Set([
            ...(assignment.forbiddenLabels || []),
            ...(batchUsed || []).filter(l => l !== assignment.label),
            ...(chapterUsed || []).filter(l => l !== assignment.label)
        ])];
        const lines = [
            `SCENARIO (required): ${assignment.label}${assignment.examples ? ` — e.g. ${assignment.examples}` : ''}`,
            forbidden.length ? `FORBIDDEN THIS CHAPTER: ${forbidden.join(', ')}` : '',
            'MECHANISM RULE: Name at least two specific terms or processes from the SOURCE PASSAGE.'
        ].filter(Boolean);
        return '\n' + lines.join('\n') + '\n';
    }

    const GENERIC_SCENARIO_KEYWORDS = new Set(['team', 'lab', 'cell', 'room', 'class', 'group']);

    function pickSlotForFinding(finding, usedIds, meta, fmt) {
        if (!formatNeedsScenarioDomain(meta.actionId, meta.formatId, meta.illustrateStyle, fmt)) return null;

        const widgetType = getWidgetTypeKey(meta.actionId, meta.formatId, meta.illustrateStyle);
        const preferredId = resolvePreferredScenarioId(finding);
        const scenarioFirstSocratic = fmt && formatUsesScenarioFirst(fmt) && meta.actionId === 'socratic-question';

        const pool = SCENARIO_CATALOG.filter(s => {
            if (usedIds.has(s.id)) return false;
            if (widgetType && s.widgetTypes && !s.widgetTypes.includes(widgetType)) return false;
            if (scenarioFirstSocratic && s.id === 'training_room') return false;
            return true;
        });

        if (preferredId) {
            const preferred = pool.find(s => s.id === preferredId);
            if (preferred?.label && !usedIds.has(preferred.id)) return preferred;
        }

        return pool[0] || SCENARIO_CATALOG.find(s => !usedIds.has(s.id)) || null;
    }

    function assignBulkScenarioDomains(findings, opts) {
        const usedIds = new Set(opts?.existingUsedIds || []);
        const batchUsedLabels = [];
        const assignments = [];

        const entries = (findings || []).map(finding => {
            const meta = resolveFindingWidgetMeta(finding);
            let fmt = null;
            if (meta.actionId && global.DreamBookModuleFormats?.resolveFormat) {
                fmt = DreamBookModuleFormats.resolveFormat(meta.actionId, meta.formatId);
            }
            const needs = formatNeedsScenarioDomain(meta.actionId, meta.formatId, meta.illustrateStyle, fmt);
            const preferredId = needs ? resolvePreferredScenarioId(finding) : null;
            return { finding, meta, fmt, needs, preferredId };
        });

        const assignOne = (entry) => {
            const { finding, meta, fmt } = entry;
            const slot = pickSlotForFinding(finding, usedIds, meta, fmt);
            if (!slot) {
                finding.scenarioAssignment = null;
                return;
            }
            usedIds.add(slot.id);
            const assignment = buildAssignmentFromSlot(slot, finding, batchUsedLabels);
            if (!assignment) {
                finding.scenarioAssignment = null;
                return;
            }
            batchUsedLabels.push(slot.label);
            finding.scenarioAssignment = assignment;
            assignments.push({ findingId: finding.findingId, assignment });
        };

        entries.filter(e => e.needs && e.preferredId).forEach(assignOne);
        entries.filter(e => e.needs && !e.preferredId).forEach(assignOne);
        entries.filter(e => !e.needs).forEach(e => { e.finding.scenarioAssignment = null; });

        return { assignments, usedIds: [...usedIds], batchUsedLabels };
    }

    function resolveScenarioForFinding(finding, opts) {
        if (finding?.scenarioAssignment) return finding.scenarioAssignment;
        const usedIds = new Set(opts?.usedIds || []);
        const meta = resolveFindingWidgetMeta(finding);
        let fmt = null;
        if (meta.actionId && global.DreamBookModuleFormats?.resolveFormat) {
            fmt = DreamBookModuleFormats.resolveFormat(meta.actionId, meta.formatId);
        }
        const slot = pickSlotForFinding(finding, usedIds, meta, fmt);
        if (!slot) return null;
        const batchUsed = opts?.batchUsedLabels || [];
        return buildAssignmentFromSlot(slot, finding, batchUsed);
    }

    function getOtherSlotKeywords(assignment, allUsedAssignments) {
        const blocked = [];
        const currentId = assignment?.id;
        SCENARIO_CATALOG.forEach(slot => {
            if (slot.id === currentId) return;
            const used = (allUsedAssignments || []).some(a => a?.id === slot.id);
            if (used) {
                slot.keywords.forEach(kw => blocked.push({ kw, slotId: slot.id, label: slot.label }));
            }
        });
        return blocked;
    }

    function assignmentKeywordsPresent(text, assignment) {
        const lower = String(text || '').toLowerCase();
        if ((assignment.keywords || []).some(kw => lower.includes(kw.toLowerCase()))) return true;
        const labelWords = (assignment.label || '').toLowerCase().split(/\s+/).filter(w => w.length > 4);
        return labelWords.some(w => lower.includes(w));
    }

    function outputViolatesScenarioAssignment(content, assignment, batchUsedAssignments, opts) {
        if (!content || !assignment) return { violated: false };
        const text = String(content);
        const lower = text.toLowerCase();
        const firstSentence = (text.split(/[.!?]/)[0] || '').trim();

        const blocked = getOtherSlotKeywords(assignment, batchUsedAssignments);
        for (const { kw, label } of blocked) {
            if (lower.includes(kw.toLowerCase())) {
                const isGeneric = GENERIC_SCENARIO_KEYWORDS.has(String(kw).toLowerCase());
                return {
                    violated: true,
                    soft: isGeneric,
                    reason: `Output mentions "${kw}" from another scenario (${label}). Use "${assignment.label}" only.`
                };
            }
        }

        if (assignment.id !== 'cricket_match' && assignment.id !== 'football_squad') {
            if (FOREIGN_SPORTS.test(text)) {
                return { violated: true, reason: `Do not use sports metaphors — stay in "${assignment.label}" only.` };
            }
            if (firstSentence && FOREIGN_SPORTS.test(firstSentence)) {
                return { violated: true, reason: `Opening sentence must not use sports — stay in "${assignment.label}" only.` };
            }
        }

        if (opts?.requireAssignedKeywords && !assignmentKeywordsPresent(text, assignment)) {
            const soft = !!(opts?.scenarioDirectiveInjected || assignment?.directive);
            return {
                violated: true,
                soft,
                reason: `Output must use SCENARIO "${assignment.label}" — mention its setting or keywords.`
            };
        }

        return { violated: false };
    }

    function socraticExplainOwnWordsViolates(content) {
        if (!content) return false;
        return SOCRATIC_NO_HOOK.test(content);
    }

    function stripPedagogyChrome(text) {
        let s = String(text || '');
        PEDAGOGY_CHROME_PATTERNS.forEach(p => { s = s.replace(p, ''); });
        return s.replace(/\n{3,}/g, '\n\n').trim();
    }

    function isPedagogyChrome(text) {
        if (!text?.trim()) return true;
        const t = text.trim();
        if (/^(edit delete|description delete|progress_activity)/i.test(t)) return true;
        if (/Illustration text \(click to expand\)/i.test(t)) return true;
        if (/moderate difficulty · \d+ turns/i.test(t)) return true;
        if (/compare_arrows/i.test(t) && t.length < 120) return true;
        return false;
    }

    function isTeachingProseParagraph(text) {
        if (!text?.trim()) return false;
        const t = text.trim();
        if (t.length < 40) return false;
        if (/^#{1,6}\s/.test(t)) return false;
        if (/^#{1,6}\s[\d.]+\s/.test(t)) return false;
        if (/^\[?Figure\s+\d/i.test(t)) return false;
        if (/^Figure\s+\d/i.test(t)) return false;
        if (/^[A-Z][A-Za-z0-9\s\-()]{0,55}:\s/.test(t)) return false;
        if (isPedagogyChrome(t)) return false;
        return true;
    }

    function isCleanTeachingExcerpt(text) {
        if (!text?.trim()) return false;
        if (isPedagogyChrome(text)) return false;
        if (/progress_activity|Generating widget content/i.test(text)) return false;
        if (/author-widget-pending|animate-spin/i.test(text)) return false;
        const stripped = stripPedagogyChrome(text);
        if (stripped.length < 40) return false;
        if (isPedagogyChrome(stripped)) return false;
        return isTeachingProseParagraph(stripped);
    }

    function extractTeachingExcerpt(text, maxLen) {
        const cleaned = stripPedagogyChrome(text);
        if (!cleaned) return '';
        maxLen = maxLen || 900;
        const paragraphs = cleaned.split(/\n\n+/).map(p => p.trim()).filter(p => isTeachingProseParagraph(p));
        let excerpt = paragraphs[0] || '';
        if (!excerpt && paragraphs.length === 0) {
            const lines = cleaned.split(/\n+/).map(l => l.trim()).filter(l => isTeachingProseParagraph(l));
            excerpt = lines.sort((a, b) => b.length - a.length)[0] || '';
        }
        if (!excerpt) {
            const proseParagraphs = cleaned.split(/\n\n+/).map(p => p.trim()).filter(p => p.length >= 40 && !isPedagogyChrome(p));
            excerpt = proseParagraphs.sort((a, b) => b.length - a.length)[0] || cleaned;
        }
        return excerpt.length <= maxLen ? excerpt : excerpt.slice(0, maxLen - 1) + '…';
    }

    function registerGeneratedScenario(content, assignment, session) {
        if (!session || !assignment?.id) return;
        if (!session.usedScenarioIds) session.usedScenarioIds = [];
        if (!session.usedScenarioIds.includes(assignment.id)) {
            session.usedScenarioIds.push(assignment.id);
        }
        if (!session.usedScenarioLabels) session.usedScenarioLabels = [];
        if (assignment.label && !session.usedScenarioLabels.includes(assignment.label)) {
            session.usedScenarioLabels.push(assignment.label);
        }
    }

    global.DreamBookScenarioRegistry = {
        SCENARIO_CATALOG,
        SCENARIO_FIRST_FORMATS,
        SPORTS_IDS,
        formatNeedsScenarioDomain,
        formatForbidsScenarioHooks,
        formatUsesScenarioFirst,
        resolveFindingWidgetMeta,
        extractGoalText,
        parseScenarioHints,
        parseRationaleScenarioId,
        resolvePreferredScenarioId,
        assignBulkScenarioDomains,
        resolveScenarioForFinding,
        buildScenarioDirective,
        buildAssignmentFromSlot,
        buildAuthorIntentLine,
        outputViolatesScenarioAssignment,
        socraticExplainOwnWordsViolates,
        stripPedagogyChrome,
        isPedagogyChrome,
        isTeachingProseParagraph,
        isCleanTeachingExcerpt,
        extractTeachingExcerpt,
        registerGeneratedScenario,
        getCatalogById
    };
})(typeof window !== 'undefined' ? window : globalThis);
