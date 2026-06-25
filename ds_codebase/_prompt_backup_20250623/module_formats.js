/**
 * Module format registry — variety hooks, prompts, and hints per interactive widget type.
 * Loaded before enhancements.js; exposed as window.DreamBookModuleFormats.
 */
(function (global) {
    'use strict';

    const MODULE_FORMATS = {
        'mini-case-study': {
            defaultFormat: 'scenario_roleplay',
            formats: {
                scenario_roleplay: {
                    label: 'Role-play scenario',
                    hookStyle: 'role_play',
                    contentPrompt: `Transform this concept into a short (80–120 word) narrative case study. Use a specific, fresh setting (lab bench, clinic triage, farm field trial, kitchen prep line, sports training room) — NOT airports, train stations, classrooms-as-maps, or generic bustling cities. Open with stakes or a surprising detail. End with ONE activity hook inviting the student to decide or act. Return ONLY the case study body.`,
                    openingPromptGen: `From this case study, write ONE engaging activity hook (under 25 words) that invites the student to step into the scenario — e.g. "You're the nurse on duty — what do you check first?" Return ONLY that hook.`,
                    hintTemplate: 'Think about what the passage says about {concept} — what would you notice first in this situation?',
                    goalTemplate: 'Apply the concept in a realistic role-play scenario so that students practice deciding and acting under real stakes.',
                    whyFormatTemplate: 'students practice applying the concept under realistic stakes instead of only recognizing definitions'
                },
                teach_a_peer: {
                    label: 'Teach a confused peer',
                    hookStyle: 'teach_peer',
                    contentPrompt: `Create a short (80–120 word) scenario where a curious peer (give them a name like Sam or Priya) misunderstands a key idea from the passage. Include what they got wrong and enough context from the passage to fix it. Open with something relatable or lightly humorous. Return ONLY the scenario text.`,
                    openingPromptGen: `Turn this into ONE hook asking the student to teach the confused peer using evidence from the passage — e.g. "Sam keeps mixing up X and Y — how would you explain it?" Return ONLY the hook.`,
                    hintTemplate: 'What is the key difference the passage draws between the confused idea and the correct one?',
                    goalTemplate: 'Help a confused peer correct a misunderstanding so that students explain the key difference clearly using evidence from the passage.',
                    whyFormatTemplate: 'students must explain the key difference when a peer misunderstands the passage'
                },
                decision_branch: {
                    label: 'Decision branch',
                    hookStyle: 'decision',
                    contentPrompt: `Write a short (80–120 word) scenario presenting two plausible choices related to the concept in the passage. Make both options sound reasonable. Open with a concrete real-world hook. Return ONLY the scenario — do not reveal the "correct" answer.`,
                    openingPromptGen: `Write ONE hook asking which path the student would take and why — under 25 words. Return ONLY the hook.`,
                    hintTemplate: 'Which option aligns better with the mechanism described in the passage? Name one piece of evidence.',
                    goalTemplate: 'Choose between two plausible paths so that students justify their decision with evidence from the passage.',
                    whyFormatTemplate: 'students weigh two plausible options and justify their choice with evidence from the passage'
                }
            }
        },
        'socratic-question': {
            defaultFormat: 'explain_own_words',
            formats: {
                explain_own_words: {
                    label: 'Explain in your own words',
                    hookStyle: 'clarify',
                    contentPrompt: `Based on this text, write exactly 3 sequential open-ended QUESTIONS for a Socratic dialogue: (1) clarify the core mechanism in plain language, (2) probe an assumption, (3) examine a consequence if something changed. Each must end with "?". Keep each under 25 words. Return ONLY the 3 numbered questions — no hooks, analogies, or setup sentences.`,
                    openingPromptGen: `Return ONLY the first numbered question verbatim — no new hook, analogy, or preamble.`,
                    hintTemplate: 'Start by naming the main process in one sentence, then explain why it matters.',
                    goalTemplate: 'Guide students through a Socratic ladder so that they explain the core idea in their own words before moving on.',
                    whyFormatTemplate: 'students articulate the core mechanism before moving deeper into the section'
                },
                what_if: {
                    label: 'What if…',
                    hookStyle: 'what_if',
                    contentPrompt: `Write a Socratic checkpoint grounded in this passage.
First line MUST start with "SCENARIO:" — 1–2 declarative sentences (NO question marks) describing a concrete everyday situation tied to the concept. Do NOT use airports, train stations, or school-as-map clichés.
Then write 3 "what if" questions numbered 1–3. Q1 MUST reference a specific detail from the SCENARIO. Escalate from a small change to a bigger consequence. Each under 25 words, ending with "?".
Do NOT use markdown bold (**). Return SCENARIO line + numbered questions only.`,
                    openingPromptGen: `Return ONLY the SCENARIO line verbatim — no question yet.`,
                    hintTemplate: 'Trace one step: if this variable changed, what would happen next according to the passage?',
                    goalTemplate: 'Explore "what if" changes in a concrete scenario so that students trace consequences step by step according to the passage.',
                    whyFormatTemplate: 'students trace consequences when a variable changes in a scenario tied to the passage'
                },
                mystery_clinic: {
                    label: 'Mystery lab result',
                    hookStyle: 'mystery_clinic',
                    contentPrompt: `Write a Socratic checkpoint grounded in this passage.
First line MUST start with "SCENARIO:" — 1–2 declarative sentences (NO question marks) describing a mystery patient, odd lab result, or clinic puzzle tied to the concept. Do NOT use airports, train stations, schools-as-maps, or generic bustling cities.
Then write exactly 3 numbered open-ended questions. Q1 MUST reference a specific detail from the SCENARIO (patient, symptom, lab finding, or setting). Escalate: clarify mechanism → probe assumption → examine consequence. Each under 25 words, ending with "?".
Do NOT use markdown bold (**). Return SCENARIO line + numbered questions only.`,
                    openingPromptGen: `Return ONLY the SCENARIO line verbatim — no question yet.`,
                    hintTemplate: 'What clue in the scenario maps to a mechanism named in the passage?',
                    goalTemplate: 'Work through a mystery clinical scenario so that students connect puzzle clues to mechanisms named in the passage.',
                    whyFormatTemplate: 'students connect clinical clues to mechanisms named in the passage'
                },
                coach_debrief: {
                    label: 'Coach debrief',
                    hookStyle: 'coach_debrief',
                    contentPrompt: `Write a Socratic checkpoint grounded in this passage.
First line MUST start with "SCENARIO:" — 1–2 declarative sentences (NO question marks) where a coach or mentor describes something that failed in practice linked to the concept. Avoid airport/school/train-station clichés.
Then 3 numbered questions. Q1 MUST reference the SCENARIO detail. Escalate: clarify → challenge assumption → predict consequence. Each under 25 words, ending with "?".
Do NOT use markdown bold (**). Return SCENARIO + numbered questions only.`,
                    openingPromptGen: `Return ONLY the SCENARIO line verbatim.`,
                    hintTemplate: 'What would the coach want you to notice first about what went wrong?',
                    goalTemplate: 'Debrief a practice failure with a coach so that students identify what went wrong and why the mechanism matters.',
                    whyFormatTemplate: 'students analyze what went wrong in practice and tie it back to the concept'
                },
                detective_case: {
                    label: 'Detective case',
                    hookStyle: 'detective_case',
                    contentPrompt: `Write a Socratic checkpoint grounded in this passage.
First line MUST start with "SCENARIO:" — 1–2 declarative sentences (NO question marks) where something broke or looks wrong in a concrete setting (greenhouse, workshop, hospital ward, research bench). No airport/school/train-station templates.
Then 3 numbered investigation-style questions. Q1 MUST reference the SCENARIO. Each under 25 words, ending with "?".
Do NOT use markdown bold (**). Return SCENARIO + numbered questions only.`,
                    openingPromptGen: `Return ONLY the SCENARIO line verbatim.`,
                    hintTemplate: 'Which detail in the scenario is the first clue the passage would explain?',
                    goalTemplate: 'Investigate what broke in a concrete setting so that students use passage evidence like detectives to explain the failure.',
                    whyFormatTemplate: 'students use passage evidence to explain what broke in a concrete setting'
                }
            }
        },
        'opposing-view': {
            defaultFormat: 'steel_man',
            formats: {
                steel_man: {
                    label: 'Steel-man counter-view',
                    hookStyle: 'debate',
                    contentPrompt: `Present a fair, credible counter-argument (1 short paragraph, 60–90 words) to the following text. Use ONE consistent scenario or metaphor throughout — do not switch domains mid-paragraph. Open with a hook that makes the tension interesting. Do NOT dismiss the original view.`,
                    openingPromptGen: `Using the SAME scenario/metaphor as the counter-argument above, write ONE challenging question asking the student to defend the original view OR acknowledge merit in the alternative. Do NOT introduce a new metaphor. Return ONLY the question.`,
                    hintTemplate: 'What is the strongest point on each side? Use one fact from the passage.',
                    goalTemplate: 'Examine this concept from a credible opposing perspective so that students defend or refine their understanding when a fair counter-view is introduced.',
                    whyFormatTemplate: 'students test whether they understand the claim or only memorized it when a fair counter-view is introduced'
                },
                edge_case: {
                    label: 'Edge case',
                    hookStyle: 'edge_case',
                    contentPrompt: `Describe a specific edge case or exception (60–90 words) that complicates the claim in the passage. Use a concrete example (environment, organism, or situation). Open with an intriguing hook.`,
                    openingPromptGen: `Ask ONE question about how the edge case changes the student's understanding. Return ONLY the question.`,
                    hintTemplate: 'Does the edge case break the rule entirely, or only limit when it applies?',
                    goalTemplate: 'Examine how edge cases complicate this claim so that students test how far the rule really applies when real exceptions appear.',
                    whyFormatTemplate: 'students test how far the rule really applies when real exceptions appear'
                },
                compare_models: {
                    label: 'Compare two models',
                    hookStyle: 'compare',
                    contentPrompt: `Briefly present two mini-viewpoints (Model A vs Model B) about the concept in the passage — 2–3 sentences each, 80–100 words total. Make both sound plausible.`,
                    openingPromptGen: `Ask ONE question: which model fits the passage better and why? Return ONLY the question.`,
                    hintTemplate: 'Match each model to a specific sentence or mechanism in the passage.',
                    goalTemplate: 'Compare two plausible models about this concept so that students critically evaluate common misconceptions by weighing both viewpoints.',
                    whyFormatTemplate: 'students weigh two plausible viewpoints and evaluate common misconceptions'
                }
            }
        },
        'explain-to-peer': {
            defaultFormat: 'teach_sam',
            formats: {
                teach_sam: {
                    label: 'Teach Sam',
                    hookStyle: 'teach_sam',
                    contentPrompt: `Write a 2–3 sentence brief: Sam (or a named peer) is confused about a specific idea in this passage. Say what Sam believes and why it's wrong. Make it relatable.`,
                    openingPromptGen: `Ask the student to explain the concept to Sam in plain language. Return ONLY one short question — do NOT repeat the scenario from the brief.`,
                    hintTemplate: 'What is the one thing Sam is mixing up? Correct that first.',
                    goalTemplate: 'Explain the concept to a confused classmate so that students teach the key idea in plain language without jargon.',
                    whyFormatTemplate: 'students teach the key idea in plain language when a classmate is confused'
                },
                explain_like_im_five: {
                    label: 'Explain like I\'m five',
                    hookStyle: 'simple',
                    contentPrompt: `Identify the single most important concept in this passage. Write 2 sentences of context a younger student would need.`,
                    openingPromptGen: `Ask the student to explain that concept so a 10-year-old would get it. Return ONLY the question.`,
                    hintTemplate: 'Drop the jargon — use an object or action from daily life.',
                    goalTemplate: 'Explain the most important concept simply so that students can state the core idea without specialized vocabulary.',
                    whyFormatTemplate: 'students state the core idea without specialized vocabulary'
                },
                whiteboard_steps: {
                    label: 'Whiteboard steps',
                    hookStyle: 'steps',
                    contentPrompt: `Identify a multi-step process in the passage. Write 2 sentences setting up why order matters. Do NOT list the steps themselves — the student will supply those.`,
                    openingPromptGen: `Ask the student to walk through the steps in order as if drawing on a whiteboard. Return ONLY one question — do NOT repeat the setup sentences from the brief.`,
                    hintTemplate: 'List the steps in order first, then say what happens if you swap two of them.',
                    goalTemplate: 'Walk through the process step by step so that students put stages in the correct order and see why sequence matters.',
                    whyFormatTemplate: 'students put process stages in order and see why sequence matters'
                }
            }
        }
    };

    const ILLUSTRATE_FORMATS = {
        analogy: {
            label: 'Everyday analogy',
            hookStyle: 'analogy',
            goalTemplate: 'Connect the mechanism in this passage to something familiar so that students can reason about the concept using a concrete comparison.',
            whyFormatTemplate: 'students can map abstract mechanisms onto something they already understand'
        },
        news: {
            label: 'Trivia',
            hookStyle: 'news',
            goalTemplate: 'Link this concept to a recent real-world example so that students see why it matters outside the textbook.',
            whyFormatTemplate: 'a recent example makes the abstract idea memorable and relevant'
        }
    };

    const SCENARIO_FIRST_HOOK_STYLES = new Set(['what_if', 'mystery_clinic', 'coach_debrief', 'detective_case']);

    function formatUsesScenarioFirst(fmt) {
        return !!(fmt && SCENARIO_FIRST_HOOK_STYLES.has(fmt.hookStyle));
    }

    const LENGTH_GUIDANCE = {
        illustrate: 'Keep to 2–3 sentences.',
        recall: 'Keep questions and options concise for the grade level.',
        simulation: 'Keep author prompt focused and grade-appropriate.',
        default: 'Keep content concise and engaging for the grade level.'
    };

    function getFormatsForAction(actionId) {
        return MODULE_FORMATS[actionId] || null;
    }

    function resolveFormat(actionId, formatId) {
        const def = MODULE_FORMATS[actionId];
        if (!def) return null;
        const id = formatId && def.formats[formatId] ? formatId : def.defaultFormat;
        return { formatId: id, ...def.formats[id] };
    }

    function listFormatIds(actionId) {
        const def = MODULE_FORMATS[actionId];
        return def ? Object.keys(def.formats) : [];
    }

    function pickFormatForInsert(actionId, usedFormatIds) {
        const ids = listFormatIds(actionId);
        if (!ids.length) return null;
        const used = new Set((usedFormatIds || []).map(s => String(s).toLowerCase()));
        const unused = ids.filter(id => !used.has(id.toLowerCase()));
        const pool = unused.length ? unused : ids;
        const pick = pool[Math.floor(Math.random() * pool.length)];
        return resolveFormat(actionId, pick);
    }

    function buildEngagementDirective(popCultureEnabled) {
        let line = 'Open with an engaging hook: real-world scenario, recent news, surprising fact, or vivid concrete example so students want to participate.';
        if (popCultureEnabled !== false) {
            line += ' When it helps understanding, you may use pop-culture references (movies, TV, games, sports) that fit the grade level — keep them brief and respectful.';
        }
        return line;
    }

    function buildUsedHooksDirective(usedHooks) {
        if (!usedHooks?.length) return '';
        const list = usedHooks.slice(0, 8).map(h => `- ${h}`).join('\n');
        return `\nDo NOT reuse these hooks/analogies already used elsewhere in this chapter:\n${list}\n`;
    }

    function buildUsedDomainsDirective(usedDomains) {
        if (!usedDomains?.length) return '';
        const list = usedDomains.slice(0, 10).map(d => `- ${d}`).join('\n');
        return `\nDo NOT reuse these scenario settings/domains already used in this chapter:\n${list}\n`;
    }

    function buildPopCultureDirective(popCultureEnabled, popCulturePick, usedPopCulture) {
        if (popCultureEnabled === false) return '';
        const used = (usedPopCulture || []).filter(Boolean);
        const avoidLine = used.length
            ? ` Do NOT reuse these domains already used in this chapter: ${used.join(', ')}.`
            : '';
        const pick = popCulturePick
            ? ` Prefer a ${popCulturePick} reference if it clarifies the concept.`
            : ' You may use one brief sports, cooking, gaming, or music reference if it fits.';
        return `\nPop-culture guidance:${pick}${avoidLine} Keep it respectful and grade-appropriate.\n`;
    }

    function pickNextFormatId(actionId, usedFormatIds) {
        const fmt = pickFormatForInsert(actionId, usedFormatIds);
        return fmt?.formatId || null;
    }

    function buildModuleUserPrompt(actionId, formatId, sourceText, options) {
        const fmt = resolveFormat(actionId, formatId);
        if (!fmt) return `Text:\n${sourceText || ''}`;
        const personal = options?.personalHint ? `\nAuthor instruction: ${options.personalHint}` : '';
        const scenarioFirst = formatUsesScenarioFirst(fmt) || options?.skipEngagement;
        const hooks = scenarioFirst ? '' : buildUsedHooksDirective(options?.usedHooks);
        const domains = scenarioFirst ? '' : buildUsedDomainsDirective(options?.usedDomains);
        const pop = scenarioFirst ? '' : buildPopCultureDirective(options?.popCultureEnabled, options?.popCulturePick, options?.usedPopCulture);
        const engagement = scenarioFirst ? '' : `\n${buildEngagementDirective(options?.popCultureEnabled)}`;
        return `${fmt.contentPrompt}${engagement}${pop}${hooks}${domains}${personal}\n\nText:\n${sourceText || ''}`;
    }

    function buildModuleOpeningPrompt(actionId, formatId, contentResult, options) {
        const fmt = resolveFormat(actionId, formatId);
        if (!fmt) return `Content:\n${contentResult || ''}`;
        const personal = options?.personalHint ? `\nAuthor instruction: ${options.personalHint}` : '';
        const engagement = options?.skipEngagement ? '' : `\n${buildEngagementDirective(options?.popCultureEnabled)}`;
        return `${fmt.openingPromptGen}${engagement}${personal}\n\nContent:\n${contentResult || ''}`;
    }

    function buildHintText(actionId, formatId, conceptSnippet) {
        const fmt = resolveFormat(actionId, formatId);
        if (!fmt?.hintTemplate) return 'Re-read the passage — what is the key idea you would use here?';
        const concept = (conceptSnippet || 'this concept').slice(0, 60);
        return fmt.hintTemplate.replace(/\{concept\}/g, concept);
    }

    function buildGoalText(actionId, formatId, fallbackGoal) {
        const fmt = resolveFormat(actionId, formatId);
        if (fmt?.goalTemplate) return fmt.goalTemplate;
        if (fallbackGoal && !/\bso that\b/i.test(fallbackGoal)) {
            return `${fallbackGoal.replace(/\.\s*$/, '')} so that students strengthen understanding of the passage.`;
        }
        return fallbackGoal || 'Guide students through this checkpoint.';
    }

    function buildWhyFormatText(actionId, formatId) {
        const fmt = resolveFormat(actionId, formatId);
        return fmt?.whyFormatTemplate || '';
    }

    function getFormatLabel(actionId, formatId) {
        const fmt = resolveFormat(actionId, formatId);
        return fmt?.label || 'interactive checkpoint';
    }

    function resolveIllustrateFormat(style) {
        const id = style && ILLUSTRATE_FORMATS[style] ? style : 'analogy';
        return { formatId: id, ...ILLUSTRATE_FORMATS[id] };
    }

    function buildIllustrateGoalText(style) {
        const fmt = resolveIllustrateFormat(style);
        return fmt?.goalTemplate || 'Help students connect this passage to a familiar or real-world example.';
    }

    function buildIllustrateWhyFormatText(style) {
        const fmt = resolveIllustrateFormat(style);
        return fmt?.whyFormatTemplate || '';
    }

    function getIllustrateFormatLabel(style) {
        const fmt = resolveIllustrateFormat(style);
        return fmt?.label || 'illustration';
    }

    function normalizeFormatId(raw, actionId) {
        if (!raw) return MODULE_FORMATS[actionId]?.defaultFormat || null;
        let id = String(raw.format_id || raw.formatId || raw).trim();
        if (actionId === 'socratic-question' && id === 'teach_back') {
            id = 'explain_own_words';
        }
        const def = MODULE_FORMATS[actionId];
        if (def?.formats[id]) return id;
        return def?.defaultFormat || null;
    }

    function listSocraticFormatIds() {
        return listFormatIds('socratic-question');
    }

    /** Author-facing proposal card blurbs — {topic} is replaced with a readable section name. */
    const AUTHOR_FORMAT_BLURBS = {
        'opposing-view': {
            steel_man: 'Add a counter-argument exercise where students hear a fair opposing view on {topic}, then defend or refine their understanding.',
            edge_case: 'Add an edge-case challenge that presents a real exception related to {topic}, prompting students to test how far the rule really goes.',
            compare_models: 'Add a compare-models debate where students weigh two plausible viewpoints about {topic}, helping them critically evaluate common misconceptions.'
        },
        'socratic-question': {
            explain_own_words: 'Add a Socratic checkpoint where students explain the core idea in {topic} in their own words before moving on.',
            what_if: 'Add a "what if" Socratic checkpoint with a concrete scenario tied to {topic} and follow-up questions that probe consequences.',
            mystery_clinic: 'Add a mystery lab-result Socratic checkpoint where students work through a puzzle scenario related to {topic}.',
            coach_debrief: 'Add a coach-debrief Socratic checkpoint where students analyze what went wrong in a practice scenario linked to {topic}.',
            detective_case: 'Add a detective-style Socratic checkpoint where students investigate clues related to {topic}.'
        },
        'mini-case-study': {
            scenario_roleplay: 'Add a role-play case study that puts students in a realistic situation applying ideas from {topic}.',
            teach_a_peer: 'Add a case study where a confused peer misunderstands a key idea in {topic} and students must explain it clearly.',
            decision_branch: 'Add a decision-branch case study presenting two plausible choices related to {topic}, asking students to justify their path.'
        },
        'explain-to-peer': {
            teach_sam: 'Add an explain-to-a-peer exercise where students teach a confused classmate the key idea from {topic}.',
            explain_like_im_five: 'Add an explain-like-I\'m-five exercise asking students to explain the most important concept in {topic} in plain language.',
            whiteboard_steps: 'Add a whiteboard-steps exercise where students walk through the process in {topic} in the correct order.'
        }
    };

    const SCAN_AUTHOR_BLURBS = {
        scan_illustrate_analogy: 'Add an everyday analogy that connects the mechanism in {topic} to something familiar students already understand.',
        scan_illustrate_news: 'Add a trivia-style real-world connection showing why {topic} matters outside the textbook, linked to a recent example students can relate to.',
        scan_recall_mcq: 'Add a quick multiple-choice recall check after {topic} to confirm students caught the main idea.',
        scan_recall_match: 'Add a match-the-terms recall check to reinforce vocabulary from {topic}.',
        scan_recall_order: 'Add an ordering exercise where students put the steps from {topic} in the correct sequence from memory.',
        scan_simulation: 'Add an interactive PhET simulation so students can manipulate variables and explore the process described in {topic}.',
        scan_socratic: 'Add a Socratic checkpoint where students explain ideas from {topic} in their own words.',
        scan_counter: 'Add a counter-argument exercise where students debate competing views about {topic} and refine their understanding.',
        scan_case_study: 'Add a mini case study that asks students to apply concepts from {topic} in a realistic scenario.',
        scan_explain_peer: 'Add an explain-to-a-peer exercise where students teach the key terms from {topic} in plain language.'
    };

    /** Substrings to bold in proposal card descriptions — must match text inside blurbs. */
    const AUTHOR_ACTIVITY_LABELS = {
        'opposing-view': {
            steel_man: 'counter-argument exercise',
            edge_case: 'edge-case challenge',
            compare_models: 'compare-models debate'
        },
        'socratic-question': {
            explain_own_words: 'Socratic checkpoint',
            what_if: '"what if" Socratic checkpoint',
            mystery_clinic: 'mystery lab-result Socratic checkpoint',
            coach_debrief: 'coach-debrief Socratic checkpoint',
            detective_case: 'detective-style Socratic checkpoint'
        },
        'mini-case-study': {
            scenario_roleplay: 'role-play case study',
            teach_a_peer: 'case study',
            decision_branch: 'decision-branch case study'
        },
        'explain-to-peer': {
            teach_sam: 'explain-to-a-peer exercise',
            explain_like_im_five: 'explain-like-I\'m-five exercise',
            whiteboard_steps: 'whiteboard-steps exercise'
        }
    };

    const SCAN_ACTIVITY_LABELS = {
        scan_illustrate_analogy: 'everyday analogy',
        scan_illustrate_news: 'trivia-style real-world connection',
        scan_recall_mcq: 'quick multiple-choice recall check',
        scan_recall_match: 'match-the-terms recall check',
        scan_recall_order: 'ordering exercise',
        scan_simulation: 'interactive PhET simulation',
        scan_socratic: 'Socratic checkpoint',
        scan_counter: 'counter-argument exercise',
        scan_case_study: 'mini case study',
        scan_explain_peer: 'explain-to-a-peer exercise'
    };

    function getAuthorActivityLabel(actionId, formatId, scanId, payload) {
        if (actionId && AUTHOR_ACTIVITY_LABELS[actionId]) {
            const fmtId = normalizeFormatId(formatId, actionId);
            const label = AUTHOR_ACTIVITY_LABELS[actionId][fmtId];
            if (label) return label;
            const def = MODULE_FORMATS[actionId]?.defaultFormat;
            if (def && AUTHOR_ACTIVITY_LABELS[actionId][def]) {
                return AUTHOR_ACTIVITY_LABELS[actionId][def];
            }
        }
        if (scanId === 'scan_illustrate') {
            const style = payload?.illustrateStyle || payload?.formatId || 'analogy';
            const key = style === 'news' ? 'scan_illustrate_news' : 'scan_illustrate_analogy';
            return SCAN_ACTIVITY_LABELS[key] || SCAN_ACTIVITY_LABELS.scan_illustrate_analogy;
        }
        if (scanId === 'scan_recall') {
            const fmt = payload?.recallFormat || 'mcq';
            const key = `scan_recall_${fmt}`;
            return SCAN_ACTIVITY_LABELS[key] || SCAN_ACTIVITY_LABELS.scan_recall_mcq;
        }
        if (scanId && SCAN_ACTIVITY_LABELS[scanId]) return SCAN_ACTIVITY_LABELS[scanId];
        return 'interactive checkpoint';
    }

    function buildFormatAuthorBlurb(actionId, formatId, topic) {
        const t = topic || 'this section';
        const fmtId = normalizeFormatId(formatId, actionId);
        const blurb = AUTHOR_FORMAT_BLURBS[actionId]?.[fmtId];
        if (blurb) return blurb.replace(/\{topic\}/g, t);
        const def = MODULE_FORMATS[actionId];
        if (def?.defaultFormat && AUTHOR_FORMAT_BLURBS[actionId]?.[def.defaultFormat]) {
            return AUTHOR_FORMAT_BLURBS[actionId][def.defaultFormat].replace(/\{topic\}/g, t);
        }
        return null;
    }

    function buildScanAuthorBlurb(scanId, payload, topic) {
        const t = topic || 'this section';
        if (scanId === 'scan_illustrate') {
            const style = payload?.illustrateStyle || payload?.formatId || 'analogy';
            const key = style === 'news' ? 'scan_illustrate_news' : 'scan_illustrate_analogy';
            return (SCAN_AUTHOR_BLURBS[key] || SCAN_AUTHOR_BLURBS.scan_illustrate_analogy).replace(/\{topic\}/g, t);
        }
        if (scanId === 'scan_recall') {
            const fmt = payload?.recallFormat || 'mcq';
            const key = `scan_recall_${fmt}`;
            return (SCAN_AUTHOR_BLURBS[key] || SCAN_AUTHOR_BLURBS.scan_recall_mcq).replace(/\{topic\}/g, t);
        }
        const key = scanId;
        if (SCAN_AUTHOR_BLURBS[key]) return SCAN_AUTHOR_BLURBS[key].replace(/\{topic\}/g, t);
        return null;
    }

    global.DreamBookModuleFormats = {
        MODULE_FORMATS,
        ILLUSTRATE_FORMATS,
        LENGTH_GUIDANCE,
        AUTHOR_FORMAT_BLURBS,
        SCAN_AUTHOR_BLURBS,
        AUTHOR_ACTIVITY_LABELS,
        SCAN_ACTIVITY_LABELS,
        getFormatsForAction,
        resolveFormat,
        listFormatIds,
        pickFormatForInsert,
        buildEngagementDirective,
        buildUsedHooksDirective,
        buildUsedDomainsDirective,
        buildPopCultureDirective,
        pickNextFormatId,
        buildModuleUserPrompt,
        buildModuleOpeningPrompt,
        buildHintText,
        buildGoalText,
        buildWhyFormatText,
        getFormatLabel,
        resolveIllustrateFormat,
        buildIllustrateGoalText,
        buildIllustrateWhyFormatText,
        getIllustrateFormatLabel,
        normalizeFormatId,
        buildFormatAuthorBlurb,
        buildScanAuthorBlurb,
        getAuthorActivityLabel,
        formatUsesScenarioFirst,
        SCENARIO_FIRST_HOOK_STYLES,
        listSocraticFormatIds
    };
})(typeof window !== 'undefined' ? window : globalThis);
