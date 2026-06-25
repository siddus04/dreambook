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
                    contentPrompt: `Create a short Socratic checkpoint grounded in the SOURCE PASSAGE.

First, silently identify: (1) the core concept, (2) one likely misconception or shallow interpretation, (3) the strongest mechanism or relationship named in the passage (prefer explicit dependencies like "A receives from B" over familiar but weak topics), (4) a concrete hook that makes the misconception visible, (5) the takeaway students should reach.

Do not reveal this analysis.

SOCRATIC DESIGN RULES:
- Hook: a concrete student claim, observation, or misconception (NO question marks).
- Q1: retrieve specific evidence from the passage — do NOT ask for the full explanation.
- Q2: probe a consequence, dependency, or assumption using passage ideas.
- Q3: ask students to generalize the principle in their own words.
- Do NOT repeat the hook as Q1.
- Use only concepts supported by the passage.
- Each question open-ended, ends with "?", under 25 words.
- Do NOT use "Imagine", sports analogies, or generic "explain the concept".

Return ONLY this structure (plain text, no markdown bold):

TITLE:
A short student-friendly title.

HOOK:
1–2 sentences: concrete situation, student claim, or misconception. No question marks.

QUESTIONS:
1. First question grounded in specific passage evidence.
2. Second question probing consequence, dependency, or assumption.
3. Third question asking students to generalize the idea in their own words.

AUTHOR NOTE:
Misconception: (one line)
Evidence used: (comma-separated terms from the passage)
Takeaway: (one sentence students should reach)`,
                    openingPromptGen: `Return ONLY the HOOK text verbatim — no question mark, no preamble.`,
                    hintTemplate: 'Start with one specific detail from the passage, then say what would break if that link failed.',
                    goalTemplate: 'Challenge a plausible misconception using passage evidence so students discover the core idea step by step.',
                    whyFormatTemplate: 'students reason from passage evidence through consequence to the core principle'
                },
                what_if: {
                    label: 'What if…',
                    hookStyle: 'what_if',
                    contentPrompt: `Write a Socratic checkpoint grounded in this passage.
First line MUST start with "SCENARIO:" — 1–2 declarative sentences (NO question marks) describing a concrete everyday situation tied to the concept. Do NOT use airports, train stations, or school-as-map clichés.
Then write 3 "what if" questions numbered 1–3. Q1 MUST reference a specific detail from the SCENARIO. Escalate from a small change to a bigger consequence. Each under 25 words, ending with "?".
Do NOT use markdown bold (**). Return SCENARIO line + numbered questions, then:

AUTHOR NOTE:
Misconception: (one line)
Evidence used: (comma-separated terms from the passage)
Takeaway: (one sentence)`,
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
Do NOT use markdown bold (**). Return SCENARIO line + numbered questions, then:

AUTHOR NOTE:
Misconception: (one line)
Evidence used: (comma-separated terms from the passage)
Takeaway: (one sentence)`,
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
Do NOT use markdown bold (**). Return SCENARIO + numbered questions, then:

AUTHOR NOTE:
Misconception: (one line)
Evidence used: (comma-separated terms from the passage)
Takeaway: (one sentence)`,
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
Do NOT use markdown bold (**). Return SCENARIO + numbered questions, then:

AUTHOR NOTE:
Misconception: (one line)
Evidence used: (comma-separated terms from the passage)
Takeaway: (one sentence)`,
                    openingPromptGen: `Return ONLY the SCENARIO line verbatim.`,
                    hintTemplate: 'Which detail in the scenario is the first clue the passage would explain?',
                    goalTemplate: 'Investigate what broke in a concrete setting so that students use passage evidence like detectives to explain the failure.',
                    whyFormatTemplate: 'students use passage evidence to explain what broke in a concrete setting'
                }
            }
        },
        'opposing-view': {
            defaultFormat: 'compare_models',
            formats: {
                compare_models: {
                    label: 'Debate a flawed claim',
                    hookStyle: 'counterargument',
                    contentPrompt: `Create a counterargument challenge grounded in the SOURCE PASSAGE.

First, silently identify: (1) the core concept, (2) one likely misconception or overgeneralization, (3) at least two specific terms students must use from the passage, (4) the best scenario style for this misconception.

Choose ONE engaging scenario style that fits the concept (do not pick randomly): peer debate (two students disagree), AI tutor mistake (confident but flawed explanation), real-world analogy that partly breaks down, lab misinterpretation, design trade-off (one system assumed "better"), news/social oversimplification, teacher shortcut hiding nuance, or classification error.

THE CLAIM and COUNTER-VIEW must debate ONE shared idea — not parallel descriptions of two different categories (e.g. do NOT write Model A = prokaryote and Model B = eukaryote with no disagreement).

Return ONLY this structure (plain text, no markdown bold):

THE CLAIM:
2–4 sentences: a plausible but partly wrong or incomplete claim about the concept, in your chosen scenario.

COUNTER-VIEW:
2–4 sentences: a pushback that uses specific ideas from the passage; partly correct but may also need refinement.

AUTHOR NOTE:
Misconception: (one line)
Evidence to use: (comma-separated terms from the passage)

Rules: Do NOT use "Model A" / "Model B". Do NOT start with "Imagine". Name at least two specific terms from the SOURCE PASSAGE in the claim or counter-view.`,
                    openingPromptGen: `Using the SAME scenario as THE CLAIM and COUNTER-VIEW above, write ONE task question (under 35 words) asking the student to: (1) say what is partly correct, (2) identify what is wrong or incomplete, (3) cite evidence from the passage, and (4) note where the analogy or scenario breaks down. Must end with "?". Return ONLY the question.`,
                    hintTemplate: 'Start with what is partly correct in the claim, then fix the error using two terms from the passage.',
                    goalTemplate: 'Evaluate a partly correct claim using evidence from the passage.',
                    whyFormatTemplate: 'students confront a plausible misconception and defend their reasoning with passage evidence'
                }
            }
        },
        'explain-to-peer': {
            defaultFormat: 'teach_sam',
            formats: {
                teach_sam: {
                    label: 'Teach Sam',
                    hookStyle: 'teach_sam',
                    contentPrompt: `Create a Feynman-style "explain to a peer" checkpoint grounded in the SOURCE PASSAGE.

First, silently identify: (1) the core concept students must explain, (2) one plausible student misconception, (3) a concrete passage example (structure, process, or failure consequence), (4) the takeaway students should reach.

Do not reveal this analysis.

FEYNMAN DESIGN RULES:
- SAM SAYS: only the peer's flawed belief — NO correction, NO "however", NO "this is wrong because".
- TASK: one plain-language instruction for the student to explain to Sam (no jargon).
- Q1: what is partly correct about Sam's idea?
- Q2: what important jobs or ideas does Sam leave out?
- Q3: ask for one concrete example from the passage (structure, process, or what breaks if missing).
- Do NOT use sports analogies, "Imagine", or meta-language ("the passage says").

Return ONLY this structure (plain text, no markdown bold):

TITLE:
A short student-friendly title.

SAM SAYS:
1–2 sentences: Sam's misconception in Sam's voice. No correction.

TASK:
One sentence telling the student to explain to Sam in plain language.

QUESTIONS:
1. First question — partly correct about Sam's idea.
2. Second question — what Sam leaves out.
3. Third question — explain using one concrete example from the passage.

AUTHOR NOTE:
Misconception: (one line)
Evidence used: (comma-separated terms from the passage)
Required passage example: (one structure, process, or consequence from the passage)
Takeaway: (one sentence students should reach)`,
                    openingPromptGen: `Return ONLY the TASK line verbatim — no preamble, no extra question.`,
                    hintTemplate: 'Start with what Sam got partly right, then name one thing from the passage Sam is missing.',
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
            label: 'Real-World Application',
            hookStyle: 'news',
            goalTemplate: 'Use a recent real-world example to show why one key idea from this passage matters outside the textbook.',
            whyFormatTemplate: 'a recent discovery or application makes one core concept feel current and important'
        }
    };

    const SCENARIO_FIRST_HOOK_STYLES = new Set(['clarify', 'what_if', 'mystery_clinic', 'coach_debrief', 'detective_case']);

    const SOCRATIC_LADDER_LABELS = ['Evidence', 'Consequence', 'Takeaway'];

    const EXPLAIN_PEER_LADDER_LABELS = ['Partly correct', 'Missing jobs', 'Explain with example'];

    function isLadderStepsComplete(stepMessages) {
        const sm = stepMessages || {};
        return (sm[1] || 0) >= 1 && (sm[2] || 0) >= 1 && (sm[3] || 0) >= 1;
    }

    function buildLadderCoachInstruction(step, opts) {
        const n = parseInt(step, 10);
        const isExplain = opts?.chatType === 'explain';
        if (n === 0) {
            return isExplain
                ? 'COACHING MODE: The student is responding to the TASK (explain to Sam). Affirm what is partly correct. Do NOT reveal full answers or repeat Question 1. Do not ask a new question — only coach this response.'
                : 'COACHING MODE: The student is responding to the hook/scenario. Affirm their engagement with the scenario. Do NOT reveal Question 1 yet. Do not ask a new question — only coach this response.';
        }
        if (n === 3) {
            return 'COACHING MODE: Final ladder step. Briefly affirm their example or takeaway using passage terms. Do NOT ask follow-up questions. End with: Continue reading.';
        }
        if (n >= 1 && n <= 2) {
            return `COACHING MODE: Student is on ladder step ${n} of 3. Briefly affirm what is strong, then nudge one gap using the source passage. Do NOT ask the next ladder question — only coach this response.`;
        }
        return 'COACHING MODE: Briefly affirm the student response using the source passage. Do not ask a new ladder question yet.';
    }

    function buildRecallCoachPrompt(format, ctx) {
        const isCorrect = !!ctx?.isCorrect;
        const source = ctx?.sourceText?.trim()
            ? `\nSource passage (ground hints in this text only):\n${String(ctx.sourceText).slice(0, 1500)}`
            : '';
        if (format === 'mcq') {
            const q = ctx?.question || {};
            const opts = (q.options || []).map((o, i) => `${i}. ${o}`).join('\n');
            if (isCorrect) {
                return [
                    'The student chose the CORRECT multiple-choice answer.',
                    `Question: ${q.prompt || ''}`,
                    opts ? `Options:\n${opts}` : '',
                    q.explanation ? `Reference explanation: ${q.explanation}` : '',
                    source,
                    'Respond in 2–3 sentences reinforcing why the answer fits the passage. Do NOT ask a new question.'
                ].filter(Boolean).join('\n');
            }
            return [
                'The student chose a WRONG multiple-choice answer.',
                `Question: ${q.prompt || ''}`,
                opts ? `Options:\n${opts}` : '',
                ctx?.selectedIndex != null ? `Their choice index: ${ctx.selectedIndex}` : '',
                source,
                'Give a hint pointing to passage evidence. Do NOT state the correct option letter, index, or exact option text. Encourage them to try again.'
            ].filter(Boolean).join('\n');
        }
        if (format === 'match') {
            if (isCorrect) {
                return [
                    'The student matched all term/definition pairs correctly.',
                    source,
                    'Respond in 2–3 sentences reinforcing one mapping using passage language. Do NOT ask a new question.'
                ].filter(Boolean).join('\n');
            }
            return [
                'The student submitted matches but at least one pair is incorrect.',
                source,
                'Give a hint about one term that does not fit its definition — point to the passage. Do NOT list the full correct pairing. Encourage retry.'
            ].filter(Boolean).join('\n');
        }
        if (format === 'order') {
            if (isCorrect) {
                return [
                    'The student put the steps in the correct order.',
                    ctx?.prompt ? `Task: ${ctx.prompt}` : '',
                    source,
                    'Respond in 2–3 sentences reinforcing why the sequence matters. Do NOT ask a new question.'
                ].filter(Boolean).join('\n');
            }
            return [
                'The student submitted an incorrect step order.',
                ctx?.prompt ? `Task: ${ctx.prompt}` : '',
                source,
                'Hint which part of the sequence is out of order using passage logic. Do NOT give the full correct order. Encourage retry.'
            ].filter(Boolean).join('\n');
        }
        return 'Coach the student briefly using the source passage. Do not give away answers directly.';
    }

    function formatUsesScenarioFirst(fmt) {
        return !!(fmt && SCENARIO_FIRST_HOOK_STYLES.has(fmt.hookStyle));
    }

    const LENGTH_GUIDANCE = {
        illustrate: 'Keep to 2–3 sentences.',
        recall: 'Keep questions and options concise for the grade level.',
        simulation: 'Keep author prompt focused and grade-appropriate.',
        default: 'Keep content concise and engaging for the grade level.'
    };

    /** One pedagogical line per widget family — exercise science layer */
    const WIDGET_EXERCISE_LINES = {
        illustrate: 'Help students connect abstract mechanisms to something concrete they already understand.',
        'socratic-question': 'Guide students through a short Socratic ladder so they explain the idea in their own words.',
        'opposing-view': 'Present a flawed but plausible claim and counter-view so students evaluate both using passage evidence.',
        'mini-case-study': 'Place students in a realistic scenario where they must apply the passage to decide or act.',
        'explain-to-peer': 'Ask students to teach the key idea in plain language as if to a confused classmate.'
    };

    const BANNED_CLICHE_LINE = 'Banned clichés: concerts/bands, phone apps, Lego cities, superhero tropes, generic chef-kitchen scenarios, bustling airports/train stations, school-as-map analogies.';

    function trimSnippet(text, maxLen) {
        const s = String(text || '').trim();
        if (!s) return '';
        return s.length <= maxLen ? s : s.slice(0, maxLen - 1) + '…';
    }

    function buildWidgetContextBlock(ctx) {
        if (!ctx) return '';
        const lines = [];
        if (ctx.bookTitle) lines.push(`BOOK: ${ctx.bookTitle}`);
        if (ctx.chapterTitle) lines.push(`CHAPTER: ${ctx.chapterTitle}`);
        if (ctx.gradeLevel) lines.push(`AUDIENCE: ${ctx.gradeLevel}`);
        if (ctx.sectionHeading) lines.push(`SECTION: ${ctx.sectionHeading}`);
        if (ctx.objectiveLabel) lines.push(`OBJECTIVE: ${ctx.objectiveLabel}`);
        if (ctx.why) lines.push(`WHY (gap): ${trimSnippet(ctx.why, 280)}`);
        if (ctx.authorNote) lines.push(`AUTHOR NOTE: ${ctx.authorNote}`);
        if (ctx.newsExcerpt?.trim()) lines.push(`NEWS EXCERPT:\n${trimSnippet(ctx.newsExcerpt, 1200)}`);
        if (ctx.scenarioAssignment?.authorIntent) lines.push(ctx.scenarioAssignment.authorIntent);
        else if (ctx.authorIntent) lines.push(ctx.authorIntent);
        if (!lines.length) return '';
        return lines.join('\n') + '\n\n';
    }

    function buildWidgetExerciseLine(moduleType, formatId) {
        if (moduleType === 'illustrate' && formatId === 'news') {
            return 'Use a recent real-world event to show why one key idea from the passage matters outside the textbook — translate the news for students, do not summarize it like a press release.';
        }
        const line = WIDGET_EXERCISE_LINES[moduleType];
        return line || WIDGET_EXERCISE_LINES.default || '';
    }

    function formatForbidsHooksInPrompt(actionId, formatId, illustrateStyle) {
        const reg = global.DreamBookScenarioRegistry;
        if (reg?.formatForbidsScenarioHooks) {
            const fmt = actionId ? resolveFormat(actionId, formatId) : null;
            return reg.formatForbidsScenarioHooks(actionId, formatId, illustrateStyle, fmt);
        }
        if (illustrateStyle === 'news' || formatId === 'news') return true;
        if (actionId === 'explain-to-peer') return true;
        return false;
    }

    function buildWidgetVarietyBlock(ctx) {
        if (!ctx || ctx.skipVariety) return '';
        if (ctx.illustrateStyle === 'news') {
            return '\nSTRICT: Real news only. Translate one passage concept for students — no "Imagine…", no metaphors, no invented dates or institutions. Do not overclaim section coverage.\n';
        }
        if (ctx.actionId === 'opposing-view') {
            const parts = ['Pick a scenario style that fits the misconception — vary settings across the chapter.'];
            const hooks = buildUsedHooksDirective(ctx.usedHooks);
            if (hooks) parts.push(hooks.trim());
            const domains = buildUsedDomainsDirective(ctx.usedDomains);
            if (domains) parts.push(domains.trim());
            parts.push(BANNED_CLICHE_LINE);
            return '\n' + parts.join('\n') + '\n';
        }
        if (ctx.illustrateStyle === 'analogy' || ctx.formatId === 'analogy') {
            const parts = ['Choose an analogy domain that best fits the mechanism in the passage — vary settings across the chapter.'];
            const hooks = buildUsedHooksDirective(ctx.usedHooks);
            if (hooks) parts.push(hooks.trim());
            const domains = buildUsedDomainsDirective(ctx.usedDomains);
            if (domains) parts.push(domains.trim());
            parts.push(BANNED_CLICHE_LINE);
            return '\n' + parts.join('\n') + '\n';
        }
        if (formatForbidsHooksInPrompt(ctx.actionId, ctx.formatId, ctx.illustrateStyle)) {
            const bands = global.DreamBookEnhancementBands;
            return bands?.BANNED_HOOK_PATTERNS?.length ? '\n' + BANNED_CLICHE_LINE + '\n' : '';
        }
        const reg = global.DreamBookScenarioRegistry;
        if (ctx.scenarioAssignment && reg?.buildScenarioDirective) {
            return reg.buildScenarioDirective(
                ctx.scenarioAssignment,
                ctx.batchUsedScenarios || [],
                ctx.chapterUsedScenarios || []
            );
        }
        const parts = [];
        if (ctx.phase === 'opening') {
            const engagement = buildEngagementDirective(ctx.popCultureEnabled);
            if (engagement) parts.push(engagement);
        }
        const hooks = buildUsedHooksDirective(ctx.usedHooks);
        if (hooks) parts.push(hooks.trim());
        const bands = global.DreamBookEnhancementBands;
        if (bands?.BANNED_HOOK_PATTERNS?.length) {
            parts.push(BANNED_CLICHE_LINE);
        }
        if (!parts.length) return '';
        return '\n' + parts.join('\n') + '\n';
    }

    function substantiveTokens(text) {
        return String(text || '').toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 3 && !/^(what|when|where|which|that|this|with|from|have|would|could|should|about|their|there|these|those|your|they|them)$/.test(w));
    }

    function tokensOverlap(a, b, minCount) {
        const setA = new Set(substantiveTokens(a));
        const tokensB = substantiveTokens(b);
        let hits = 0;
        tokensB.forEach(t => { if (setA.has(t)) hits++; });
        return hits >= (minCount || 1);
    }

    function normalizeForCompare(text) {
        return String(text || '').replace(/\s+/g, ' ').trim().toLowerCase();
    }

    function openingRepeatsBrief(opening, brief) {
        const open = normalizeForCompare(opening);
        const sentences = String(brief || '').split(/[.!?]+/).map(s => normalizeForCompare(s)).filter(s => s.length > 25);
        return sentences.some(s => open.includes(s) || s.includes(open));
    }

    const DOMAIN_LABEL_TO_RESERVED = {
        cricket: 'cricket',
        football: 'football',
        'chef kitchen': 'cooking'
    };

    function outputUsesForeignDomain(content, reservedDomain) {
        if (!reservedDomain || !content) return false;
        const bands = global.DreamBookEnhancementBands;
        const patterns = bands?.BANNED_DOMAIN_PATTERNS || [];
        const reserved = String(reservedDomain).toLowerCase();
        for (const { pattern, label } of patterns) {
            if (!pattern.test(content)) continue;
            const mapped = DOMAIN_LABEL_TO_RESERVED[label];
            if (mapped) {
                if (mapped !== reserved) return true;
            } else {
                return true;
            }
        }
        return false;
    }

    function illustrateContentHasBannedOpener(text) {
        const trimmed = String(text || '').trim();
        if (!trimmed) return true;
        const bands = global.DreamBookEnhancementBands;
        if (bands?.contentContainsBannedHook?.(text)) return true;
        if (/^imagine\b/i.test(trimmed)) return true;
        if (/\bbustling city\b/i.test(text)) return true;
        return false;
    }

    function parseOpposingChallengeContent(text) {
        const raw = String(text || '');
        const claimMatch = raw.match(/THE CLAIM:\s*([\s\S]*?)(?=COUNTER-VIEW:|$)/i);
        const counterMatch = raw.match(/COUNTER-VIEW:\s*([\s\S]*?)(?=AUTHOR NOTE:|$)/i);
        const noteMatch = raw.match(/AUTHOR NOTE:\s*([\s\S]*?)$/i);
        return {
            claim: (claimMatch?.[1] || '').trim(),
            counter: (counterMatch?.[1] || '').trim(),
            authorNote: (noteMatch?.[1] || '').trim()
        };
    }

    function parseAnalogyIllustrationContent(text) {
        const raw = String(text || '');
        const titleMatch = raw.match(/ANALOGY TITLE:\s*([\s\S]*?)(?=THE ANALOGY:|$)/i);
        const analogyMatch = raw.match(/THE ANALOGY:\s*([\s\S]*?)(?=CONCEPT MAPPING:|$)/i);
        const mappingMatch = raw.match(/CONCEPT MAPPING:\s*([\s\S]*?)(?=WHERE THE ANALOGY BREAKS DOWN:|$)/i);
        const breaksMatch = raw.match(/WHERE THE ANALOGY BREAKS DOWN:\s*([\s\S]*?)(?=ONE-LINE TAKEAWAY:|$)/i);
        const takeawayMatch = raw.match(/ONE-LINE TAKEAWAY:\s*([\s\S]*?)$/i);
        return {
            title: (titleMatch?.[1] || '').trim(),
            analogy: (analogyMatch?.[1] || '').trim(),
            mapping: (mappingMatch?.[1] || '').trim(),
            breaksDown: (breaksMatch?.[1] || '').trim(),
            takeaway: (takeawayMatch?.[1] || '').trim()
        };
    }

    function parseNewsAuthorNoteFields(noteText) {
        const note = String(noteText || '').trim();
        const conceptMatch = note.match(/Concept illustrated:\s*([\s\S]*?)(?=Passage terms used:|Not covered:|Why this example|$)/i);
        const termsMatch = note.match(/Passage terms used:\s*([\s\S]*?)(?=Not covered:|Why this example|Verification status:|$)/i);
        const notCoveredMatch = note.match(/Not covered:\s*([\s\S]*?)(?=Why this example|Verification status:|$)/i);
        const whyMatch = note.match(/Why this example was chosen:\s*([\s\S]*?)(?=Verification status:|$)/i);
        const verifyMatch = note.match(/Verification status:\s*([\s\S]*?)$/i);
        return {
            conceptIllustrated: (conceptMatch?.[1] || '').trim(),
            passageTermsUsed: (termsMatch?.[1] || '').trim(),
            notCovered: (notCoveredMatch?.[1] || '').trim(),
            whyChosen: (whyMatch?.[1] || '').trim(),
            verificationStatus: (verifyMatch?.[1] || '').trim()
        };
    }

    function parseNewsApplicationContent(text) {
        const raw = String(text || '').trim();
        const empty = {
            title: '', studentView: '', thinkAboutIt: '', authorNote: '',
            conceptIllustrated: '', passageTermsUsed: '', notCovered: '',
            whyChosen: '', verificationStatus: '', structured: false
        };
        if (!raw) return empty;

        const titleMatch = raw.match(/TITLE:\s*([\s\S]*?)(?=\n(?:STUDENT VIEW:|THINK ABOUT IT:|AUTHOR NOTE:)|$)/i);
        const studentMatch = raw.match(/STUDENT VIEW:\s*([\s\S]*?)(?=\n(?:THINK ABOUT IT:|AUTHOR NOTE:)|$)/i);
        const thinkMatch = raw.match(/THINK ABOUT IT:\s*([\s\S]*?)(?=\nAUTHOR NOTE:|$)/i);
        const noteMatch = raw.match(/AUTHOR NOTE:\s*([\s\S]*?)$/i);

        const structured = !!(titleMatch?.[1]?.trim() || studentMatch?.[1]?.trim());
        if (structured) {
            const authorNoteRaw = (noteMatch?.[1] || '').trim();
            const noteFields = parseNewsAuthorNoteFields(authorNoteRaw);
            return {
                title: (titleMatch?.[1] || '').trim(),
                studentView: (studentMatch?.[1] || '').trim(),
                thinkAboutIt: (thinkMatch?.[1] || '').trim(),
                authorNote: authorNoteRaw,
                ...noteFields,
                structured: true
            };
        }

        return {
            ...empty,
            studentView: raw,
            structured: false
        };
    }

    function newsContentHasMetaLanguage(text) {
        return /\b(this connects to the textbook|as discussed above|the passage says|from the textbook|in this section we)\b/i.test(String(text || ''));
    }

    function newsContentLooksLikeAbstract(text) {
        const t = String(text || '');
        if (/\b(researchers at|demonstrated that|study published|findings suggest|method that uses)\b/i.test(t)
            && !/\b(students|you|your|imagine if|what if)\b/i.test(t)) {
            return true;
        }
        if (/\b(activated|demonstrated|effectively|utilize|facilitate)\b/i.test(t) && t.split(/\s+/).length > 45) {
            return true;
        }
        return false;
    }

    function newsDateInvented(studentView, newsExcerpt) {
        const view = String(studentView || '');
        const excerpt = String(newsExcerpt || '');
        const years = view.match(/\b(20\d{2})\b/g);
        if (!years?.length) return false;
        if (!excerpt.trim()) return false;
        return years.some(y => !excerpt.includes(y));
    }

    function passageHasMultipleMajorConcepts(sourceText) {
        const s = String(sourceText || '').toLowerCase();
        let count = 0;
        if (/\bextracellular matrix\b|\becm\b|\bcollagen\b|\bfibronectin\b/.test(s)) count++;
        if (/\btight junction\b|\bdesmosome\b|\bgap junction\b|\bintegrin\b/.test(s)) count++;
        if (/\bmitochondri|\bnucleus\b|\bribosome\b|\bgolgi\b/.test(s)) count++;
        return count >= 2;
    }

    function newsApplicationViolates(parsed, content, ctx) {
        const studentView = parsed?.studentView || '';
        const combined = `${parsed?.title || ''} ${studentView} ${parsed?.thinkAboutIt || ''}`;

        if (parsed?.structured) {
            if (!parsed?.title?.trim()) {
                return { violated: true, retryNote: 'Return TITLE: with a short student-friendly title.' };
            }
            if (!studentView.trim()) {
                return { violated: true, retryNote: 'Return STUDENT VIEW: with 2–4 grade-appropriate sentences.' };
            }
            if (!parsed?.thinkAboutIt?.trim()) {
                return { violated: true, retryNote: 'Return THINK ABOUT IT: with one reflective question.' };
            }
        }

        if (illustrateContentHasBannedOpener(content)) {
            return { violated: true, retryNote: 'Do NOT start with "Imagine" or banned clichés.' };
        }
        if (newsContentHasMetaLanguage(combined)) {
            return { violated: true, retryNote: 'Do NOT use meta-language like "this connects to the textbook" — write directly for students.' };
        }
        if (newsContentLooksLikeAbstract(studentView)) {
            return { violated: true, retryNote: 'Rewrite in plain student language — not like a research abstract or press release.' };
        }
        if (/\bare like\b|\bis like a\b|\bas a .* (metaphor|analogy)\b|\bmuch like how\b|\bsimilar to how\b|\blike how a\b/i.test(combined)) {
            return { violated: true, retryNote: 'No metaphors or analogies — explain the real-world application directly.' };
        }
        if (/\bfuturistic city\b/i.test(combined)) {
            return { violated: true, retryNote: 'No invented futuristic scenarios — real news only.' };
        }
        if (ctx?.sourceText?.trim() && studentView.trim() && parsed?.structured
            && !tokensOverlap(ctx.sourceText, studentView, 2)) {
            return { violated: true, retryNote: 'Name at least two specific terms or ideas from the SOURCE PASSAGE in STUDENT VIEW.' };
        }
        if (newsDateInvented(studentView, ctx?.newsExcerpt)) {
            return { violated: true, retryNote: 'Do not invent dates — include a date only if it appears in the NEWS EXCERPT.' };
        }
        if (parsed?.structured && passageHasMultipleMajorConcepts(ctx?.sourceText)
            && !parsed?.notCovered?.trim()) {
            return { violated: true, retryNote: 'List major passage concepts NOT covered by this example in AUTHOR NOTE → Not covered:.' };
        }
        return { violated: false };
    }

    function countAnalogyMappingLines(mapping) {
        return String(mapping || '').split('\n').filter(l => /→|->/.test(l)).length;
    }

    function analogyTranslationMisconceptionViolates(sourceText, analogyText, mappingText) {
        const source = String(sourceText || '').toLowerCase();
        const combined = `${analogyText} ${mappingText}`.toLowerCase();
        const mentionsTranslation = /\bmrna\b|\btranslat/i.test(source) || /\bmessenger rna\b/i.test(source);
        if (!mentionsTranslation) return false;
        const hasMrnaInOutput = /\bmrna\b|\bmessenger\b|\bmessenger rna\b/i.test(combined);
        const rrnaAsBlueprint = /\b(blueprint|instruction|recipe|plan).{0,50}\brrna\b|\brrna\b.{0,50}\b(blueprint|protein instruction|build protein|protein chain)/i.test(combined);
        if (rrnaAsBlueprint) return true;
        if (!hasMrnaInOutput && /\bribosom/i.test(source)) return true;
        return false;
    }

    function parseSocraticAuthorNoteFields(noteText) {
        const note = String(noteText || '').trim();
        const misconceptionMatch = note.match(/Misconception:\s*([\s\S]*?)(?=Evidence used:|Takeaway:|$)/i);
        const evidenceMatch = note.match(/Evidence used:\s*([\s\S]*?)(?=Takeaway:|$)/i);
        const takeawayMatch = note.match(/Takeaway:\s*([\s\S]*?)$/i);
        return {
            misconception: (misconceptionMatch?.[1] || '').trim(),
            evidenceUsed: (evidenceMatch?.[1] || '').trim(),
            takeaway: (takeawayMatch?.[1] || '').trim()
        };
    }

    function cleanLadderQuestionText(raw) {
        let q = String(raw || '').trim();
        q = q.replace(/^\*+\s*|\s*\*+$/g, '').trim();
        q = q.replace(/^\d+[\.)]\s*/, '').trim();
        q = q.replace(/^\*+\s*|\s*\*+$/g, '').trim();
        return q.replace(/\s+/g, ' ').trim();
    }

    function extractSocraticNumberedQuestions(text) {
        const questions = [];
        String(text || '').split('\n').map(l => l.trim()).filter(Boolean).forEach(l => {
            if (/^AUTHOR NOTE:/i.test(l)) return;
            const numbered = /^\d+[\.)]\s/.test(l);
            const q = cleanLadderQuestionText(l);
            if (q.length > 10 && (q.includes('?') || numbered)) questions.push(q);
        });
        if (questions.length < 3) {
            String(text || '').split(/(?<=\?)\s+/).forEach(part => {
                const q = cleanLadderQuestionText(part);
                if (q.includes('?') && q.length > 12 && questions.length < 3) {
                    const dup = questions.some(existing => normalizeForCompare(existing) === normalizeForCompare(q));
                    if (!dup) questions.push(q);
                }
            });
        }
        return questions.slice(0, 3);
    }

    function parseSocraticStructuredContent(text) {
        const raw = String(text || '').trim();
        const empty = {
            title: '', hook: '', scenarioHook: '', questions: [], authorNote: '',
            misconception: '', evidenceUsed: '', takeaway: '', structured: false
        };
        if (!raw) return empty;

        const titleMatch = raw.match(/TITLE:\s*([\s\S]*?)(?=\n(?:HOOK:|SCENARIO:|QUESTIONS:|AUTHOR NOTE:)|$)/i);
        const hookMatch = raw.match(/HOOK:\s*([\s\S]*?)(?=\n(?:QUESTIONS:|AUTHOR NOTE:)|$)/i);
        const questionsSectionMatch = raw.match(/QUESTIONS:\s*([\s\S]*?)(?=\nAUTHOR NOTE:|$)/i);
        const noteMatch = raw.match(/AUTHOR NOTE:\s*([\s\S]*?)$/i);

        let hook = (hookMatch?.[1] || '').trim().replace(/\?\s*$/, '');
        let questionText = questionsSectionMatch?.[1] || '';

        if (!hook) {
            const scenarioLine = raw.match(/^SCENARIO:\s*(.+?)(?:\n|$)/im);
            if (scenarioLine) {
                hook = scenarioLine[1].trim().replace(/\?\s*$/, '');
                questionText = raw.slice(scenarioLine.index + scenarioLine[0].length).trim();
                const noteIdx = questionText.search(/\nAUTHOR NOTE:/i);
                if (noteIdx >= 0) questionText = questionText.slice(0, noteIdx).trim();
            }
        }

        let questions = extractSocraticNumberedQuestions(questionText);
        if (questions.length < 3 && !questionsSectionMatch && !hookMatch && !raw.match(/^SCENARIO:/im)) {
            questions = extractSocraticNumberedQuestions(raw);
        }

        const authorNoteRaw = (noteMatch?.[1] || '').trim();
        const noteFields = parseSocraticAuthorNoteFields(authorNoteRaw);
        const structured = !!(titleMatch?.[1]?.trim() || hookMatch || questionsSectionMatch || /^SCENARIO:/im.test(raw));

        return {
            title: (titleMatch?.[1] || '').trim(),
            hook,
            scenarioHook: hook,
            questions,
            authorNote: authorNoteRaw,
            misconception: noteFields.misconception,
            evidenceUsed: noteFields.evidenceUsed,
            takeaway: noteFields.takeaway,
            structured
        };
    }

    function parseExplainPeerAuthorNoteFields(noteText) {
        const note = String(noteText || '').trim();
        const misconceptionMatch = note.match(/Misconception:\s*([\s\S]*?)(?=Evidence used:|Required passage example:|Takeaway:|$)/i);
        const evidenceMatch = note.match(/Evidence used:\s*([\s\S]*?)(?=Required passage example:|Takeaway:|$)/i);
        const exampleMatch = note.match(/Required passage example:\s*([\s\S]*?)(?=Takeaway:|$)/i);
        const takeawayMatch = note.match(/Takeaway:\s*([\s\S]*?)$/i);
        return {
            misconception: (misconceptionMatch?.[1] || '').trim(),
            evidenceUsed: (evidenceMatch?.[1] || '').trim(),
            requiredExample: (exampleMatch?.[1] || '').trim(),
            takeaway: (takeawayMatch?.[1] || '').trim()
        };
    }

    function parseExplainPeerContent(text) {
        const raw = String(text || '').trim();
        const empty = {
            title: '', samSays: '', task: '', questions: [], authorNote: '',
            misconception: '', evidenceUsed: '', requiredExample: '', takeaway: '', structured: false
        };
        if (!raw) return empty;

        const titleMatch = raw.match(/TITLE:\s*([\s\S]*?)(?=\n(?:SAM SAYS:|TASK:|QUESTIONS:|AUTHOR NOTE:)|$)/i);
        const samMatch = raw.match(/SAM SAYS:\s*([\s\S]*?)(?=\n(?:TASK:|QUESTIONS:|AUTHOR NOTE:)|$)/i);
        const taskMatch = raw.match(/TASK:\s*([\s\S]*?)(?=\n(?:QUESTIONS:|AUTHOR NOTE:)|$)/i);
        const questionsSectionMatch = raw.match(/QUESTIONS:\s*([\s\S]*?)(?=\nAUTHOR NOTE:|$)/i);
        const noteMatch = raw.match(/AUTHOR NOTE:\s*([\s\S]*?)$/i);

        const samSays = (samMatch?.[1] || '').trim().replace(/\?\s*$/, '');
        const task = (taskMatch?.[1] || '').trim();
        let questions = extractSocraticNumberedQuestions(questionsSectionMatch?.[1] || '');
        if (questions.length < 3 && !questionsSectionMatch && !samMatch) {
            questions = extractSocraticNumberedQuestions(raw);
        }

        const authorNoteRaw = (noteMatch?.[1] || '').trim();
        const noteFields = parseExplainPeerAuthorNoteFields(authorNoteRaw);
        const structured = !!(titleMatch?.[1]?.trim() || samMatch || taskMatch || questionsSectionMatch);

        return {
            title: (titleMatch?.[1] || '').trim(),
            samSays,
            task,
            questions,
            authorNote: authorNoteRaw,
            misconception: noteFields.misconception,
            evidenceUsed: noteFields.evidenceUsed,
            requiredExample: noteFields.requiredExample,
            takeaway: noteFields.takeaway,
            structured
        };
    }

    function explainPeerContentGivesCorrection(samSays, fullContent) {
        const sam = String(samSays || '').trim();
        if (!sam) return false;
        if (/\b(however|incorrect because|this is wrong|also need to|but actually|in fact,? cells also)\b/i.test(sam)) {
            return true;
        }
        if (/\bbecause\b/i.test(sam) && /\b(also|must|need to|require)\b/i.test(sam)) {
            return true;
        }
        return false;
    }

    function passageHasNamedStructures(sourceText) {
        const s = String(sourceText || '').toLowerCase();
        return /\bmitochondri|\bnucleus\b|\bmembrane\b|\bribosome\b|\bgolgi\b|\bextracellular matrix\b|\becm\b|\bjunction\b|\batp\b|\bhomeostasis\b/.test(s);
    }

    function explainPeerHasPassageExample(parsed, sourceText) {
        const combined = `${parsed?.questions?.[2] || ''} ${parsed?.requiredExample || ''} ${parsed?.authorNote || ''}`.toLowerCase();
        const source = String(sourceText || '').toLowerCase();
        if (!passageHasNamedStructures(source)) return true;
        const exampleTerms = ['mitochondri', 'nucleus', 'membrane', 'ribosome', 'golgi', 'extracellular', 'ecm', 'junction', 'atp', 'homeostasis', 'collagen', 'transport', 'integrin'];
        return exampleTerms.some(t => combined.includes(t) && source.includes(t));
    }

    function sanitizeSocraticHook(text) {
        return String(text || '').replace(/^imagine\s+(?:that\s+)?/i, '').trim();
    }

    function narrowSocraticHookViolates(text, opts) {
        if (!text) return { violated: false };
        if (/\b(cricket|football|soccer)\b/i.test(text)) {
            return { violated: true, retryNote: 'Avoid "Imagine" and sports clichés — use the assigned scenario setting instead.' };
        }
        if (!opts?.allowImagine && /\bimagine\b/i.test(text)) {
            return { violated: true, retryNote: 'Avoid "Imagine" and sports clichés — use the assigned scenario setting instead.' };
        }
        return { violated: false };
    }

    function stripAuthorNoteForWordCount(content) {
        return String(content || '').replace(/\nAUTHOR NOTE:[\s\S]*/i, '').trim();
    }

    function scenarioFirstExempt(ctx, formatId) {
        if (ctx?.scenarioAssignment) return true;
        const reg = global.DreamBookScenarioRegistry;
        const fmt = formatId && resolveFormat('socratic-question', formatId);
        return !!(fmt && reg?.formatUsesScenarioFirst?.(fmt));
    }

    function explainPeerViolates(parsed, content, ctx) {
        const samSays = parsed?.samSays || '';
        const questions = parsed?.questions || [];
        const combined = `${samSays} ${questions.join(' ')} ${parsed?.task || ''}`;

        if (parsed?.structured) {
            if (!parsed?.title?.trim()) {
                return { violated: true, retryNote: 'Return TITLE: with a short student-friendly title.' };
            }
            if (!samSays.trim()) {
                return { violated: true, retryNote: 'Return SAM SAYS: with Sam\'s misconception only — no correction.' };
            }
            if (!parsed?.task?.trim()) {
                return { violated: true, retryNote: 'Return TASK: with one plain-language instruction for the student.' };
            }
            if (questions.length < 3) {
                return { violated: true, retryNote: 'Return QUESTIONS: with exactly 3 numbered questions.' };
            }
            if (!parsed?.authorNote?.trim()) {
                return { violated: true, retryNote: 'Return AUTHOR NOTE: with Misconception, Evidence used, Required passage example, and Takeaway.' };
            }
        }

        if (explainPeerContentGivesCorrection(samSays, content)) {
            return { violated: true, retryNote: 'Do NOT explain why Sam is wrong in SAM SAYS — Sam states only the misconception.' };
        }

        const reg = global.DreamBookScenarioRegistry;
        const hookCheckText = `${samSays} ${parsed?.task || ''}`;
        if (reg?.socraticExplainOwnWordsViolates?.(hookCheckText)) {
            if (scenarioFirstExempt(ctx, ctx?.formatId || 'teach_sam')) {
                const narrow = narrowSocraticHookViolates(hookCheckText);
                if (narrow.violated) return narrow;
            } else {
                return { violated: true, retryNote: 'Explain in plain language — no analogies, sports comparisons, or "Imagine" openings in SAM SAYS or TASK.' };
            }
        }

        if (/\b(this connects to the textbook|as discussed above|the passage says)\b/i.test(combined)) {
            return { violated: true, retryNote: 'Do NOT use meta-language — write directly for students.' };
        }

        if (parsed?.structured && samSays && socraticHookRepeatsQuestion(samSays, questions[0])) {
            return { violated: true, retryNote: 'Do NOT repeat SAM SAYS as Question 1 — Q1 should ask what is partly correct.' };
        }

        if (parsed?.structured && questions.length >= 3) {
            if (socraticHookRepeatsQuestion(questions[0], questions[2])) {
                return {
                    violated: true,
                    retryNote: 'Question 3 must ask for a concrete example from the passage — do NOT repeat Question 1.'
                };
            }
            if (questions[1] && socraticHookRepeatsQuestion(questions[0], questions[1])) {
                return {
                    violated: true,
                    retryNote: 'Questions 1–3 must be distinct — each step should probe a different angle.'
                };
            }
        }

        if (ctx?.sourceText?.trim() && parsed?.structured
            && !tokensOverlap(ctx.sourceText, combined, 2)) {
            return { violated: true, retryNote: 'Name at least two specific terms from the SOURCE PASSAGE in SAM SAYS or QUESTIONS.' };
        }

        if (parsed?.structured && ctx?.sourceText?.trim() && passageHasNamedStructures(ctx.sourceText)
            && !explainPeerHasPassageExample(parsed, ctx.sourceText)) {
            return { violated: true, retryNote: 'Q3 or AUTHOR NOTE must name a concrete example from the passage (e.g. mitochondria, membrane, nucleus).' };
        }

        return { violated: false };
    }

    function socraticHookRepeatsQuestion(hook, question) {
        const h = normalizeForCompare(hook);
        const q = normalizeForCompare(question);
        if (!h || !q) return false;
        if (h === q) return true;
        if (h.includes(q.slice(0, Math.min(40, q.length))) || q.includes(h.slice(0, Math.min(40, h.length)))) return true;
        return tokensOverlap(hook, question, 4);
    }

    function socraticQ1LooksLikeFullEssay(q1) {
        const q = String(q1 || '').trim();
        if (!/^how (do|does|did|would|can|could)\b/i.test(q)) return false;
        if (/\bwork together\b|\bexplain how\b|\bexplain why\b/i.test(q)) {
            return !/\b(passage|text|golgi|mitochondri|transport vesicle|receive|ER|ribosome|membrane)\b/i.test(q);
        }
        return false;
    }

    function socraticQuestionStartsWhatIf(question) {
        return /^what if\b/i.test(String(question || '').trim());
    }

    function socraticWhatIfLadderViolates(questions) {
        const qs = (questions || []).map(q => String(q || '').trim()).filter(Boolean);
        if (qs.length < 3) return { violated: false };

        const allWhatIf = qs.every(socraticQuestionStartsWhatIf);
        if (allWhatIf) {
            return {
                violated: true,
                retryNote: 'Only Question 1 should be a "What if" hypothetical — Q2 should probe consequences or passage mechanisms; Q3 should ask for a principle or takeaway.'
            };
        }

        if (socraticQuestionStartsWhatIf(qs[1])
            && /^what if (this|that|these|those|it)\b/i.test(qs[1])) {
            return {
                violated: true,
                retryNote: 'Question 2 must not extend the same "What if this…" scenario — ask about a downstream effect or a different mechanism from the passage.'
            };
        }

        if (socraticQuestionStartsWhatIf(qs[0]) && socraticQuestionStartsWhatIf(qs[2])
            && tokensOverlap(qs[0], qs[2], 3)) {
            return {
                violated: true,
                retryNote: 'Questions 1 and 3 must not repeat the same hypothetical — Q3 should state a principle or broader takeaway.'
            };
        }

        return { violated: false };
    }

    function socraticLadderQuestionsDistinct(questions) {
        const qs = (questions || []).map(q => String(q || '').trim()).filter(Boolean);
        if (qs.length < 3) return { violated: false };

        if (socraticHookRepeatsQuestion(qs[0], qs[2])) {
            return {
                violated: true,
                retryNote: 'Question 3 must not repeat Question 1 — each ladder step should probe a different angle.'
            };
        }
        if (qs[1] && socraticHookRepeatsQuestion(qs[0], qs[1])) {
            return {
                violated: true,
                retryNote: 'Questions 1 and 2 must be distinct — Q2 should build on Q1 with a new consequence or mechanism.'
            };
        }
        if (qs[1] && qs[2] && normalizeForCompare(qs[1]) === normalizeForCompare(qs[2])) {
            return {
                violated: true,
                retryNote: 'Questions 2 and 3 must not repeat the same wording — escalate from consequence to takeaway.'
            };
        }
        return { violated: false };
    }

    function socraticCheckpointViolates(parsed, content, formatId, ctx) {
        const reg = global.DreamBookScenarioRegistry;
        const hook = parsed?.hook || parsed?.scenarioHook || '';
        const questions = parsed?.questions || [];
        const combined = `${hook} ${questions.join(' ')} ${parsed?.authorNote || ''}`;

        if (formatId === 'explain_own_words') {
            if (!parsed?.title?.trim()) {
                return { violated: true, retryNote: 'Return TITLE: with a short student-friendly title.' };
            }
            if (!hook.trim()) {
                return { violated: true, retryNote: 'Return HOOK: with 1–2 declarative sentences (no question marks).' };
            }
            if (questions.length < 3) {
                return { violated: true, retryNote: 'Return QUESTIONS: with exactly 3 numbered open-ended questions.' };
            }
            if (!parsed?.authorNote?.trim()) {
                return { violated: true, retryNote: 'Return AUTHOR NOTE: with Misconception, Evidence used, and Takeaway lines.' };
            }
        }

        if (hook && hook.includes('?')) {
            return { violated: true, retryNote: 'The hook must be declarative — no question marks in HOOK or SCENARIO.' };
        }
        const exempt = scenarioFirstExempt(ctx, formatId) || ctx?.scenarioAssignment;
        if (reg?.socraticExplainOwnWordsViolates?.(content)) {
            if (exempt) {
                const allowImagine = !!ctx?.scenarioAssignment;
                const narrowHook = narrowSocraticHookViolates(hook, { allowImagine });
                if (narrowHook.violated) return narrowHook;
                if (!ctx?.scenarioAssignment) {
                    const narrowContent = narrowSocraticHookViolates(content);
                    if (narrowContent.violated) return narrowContent;
                }
            } else {
                return { violated: true, retryNote: 'No "Imagine", sports analogies, or "like a" comparisons in the checkpoint.' };
            }
        }
        if (questions.length < 3) {
            return { violated: true, retryNote: 'Return exactly 3 numbered questions ending with "?".' };
        }
        if (hook && socraticHookRepeatsQuestion(hook, questions[0])) {
            return { violated: true, retryNote: 'Do NOT repeat the HOOK as Question 1 — Q1 should retrieve passage evidence.' };
        }
        if (socraticQ1LooksLikeFullEssay(questions[0])) {
            return { violated: true, retryNote: 'Q1 must point to specific passage evidence — not ask for the full explanation upfront.' };
        }
        if (ctx?.sourceText?.trim() && !tokensOverlap(ctx.sourceText, combined, 2)) {
            return { violated: true, retryNote: 'Name at least two specific terms or relationships from the SOURCE PASSAGE in the hook or questions.' };
        }
        if (parsed?.misconception?.trim()) {
            const tested = `${hook} ${questions.slice(0, 2).join(' ')}`;
            if (!tokensOverlap(parsed.misconception, tested, 1)) {
                return { violated: true, retryNote: 'Questions must challenge the Misconception named in AUTHOR NOTE — tie Q1 or Q2 to that idea.' };
            }
        }
        if (questions.length >= 3) {
            const distinct = socraticLadderQuestionsDistinct(questions);
            if (distinct.violated) return distinct;
            if (formatId === 'what_if') {
                const whatIf = socraticWhatIfLadderViolates(questions);
                if (whatIf.violated) return whatIf;
            }
        }
        return { violated: false };
    }

    function opposingParallelTaxonomyViolates(claim, counter) {
        const combined = `${claim} ${counter}`;
        if (/\bmodel a\b|\bmodel b\b/i.test(combined)) return true;
        const debateSignals = /\b(less accurate|more accurate|push(?:es)? back|disagree|misconception|oversimplif|partly correct|incomplete|not quite|however|debate|argues that|wrong|inaccurate|flawed|breaks down)\b/i;
        if (debateSignals.test(combined)) return false;
        const hasPro = /\bprokaryot/i.test(combined);
        const hasEuk = /\beukaryot/i.test(combined);
        if (hasPro && hasEuk) {
            const claimL = String(claim || '').toLowerCase();
            const counterL = String(counter || '').toLowerCase();
            if ((/\bprokaryot/i.test(claimL) && /\beukaryot/i.test(counterL))
                || (/\beukaryot/i.test(claimL) && /\bprokaryot/i.test(counterL))) {
                return true;
            }
        }
        return false;
    }

    function validateWidgetOutput(moduleType, formatId, phase, content, opening, ctx) {
        const fmt = moduleType === 'illustrate' ? null : resolveFormat(moduleType, formatId);
        const scenarioFirst = fmt && formatUsesScenarioFirst(fmt);
        const enhancements = global.DreamBookEnhancements;
        const bands = global.DreamBookEnhancementBands;

        if (moduleType === 'illustrate') {
            const style = ctx?.illustrateStyle || formatId || 'analogy';
            if (style === 'news' && phase === 'content') {
                const parsed = parseNewsApplicationContent(content);
                const violation = newsApplicationViolates(parsed, content, {
                    ...ctx,
                    sourceText: ctx?.sourceText || ctx?.displayPassage || ''
                });
                if (violation.violated) {
                    return { ok: false, retryNote: violation.retryNote };
                }
                if (!parsed.structured) {
                    const text = content || '';
                    if (!text || illustrateContentHasBannedOpener(text)) {
                        return { ok: false, retryNote: 'Use structured output (TITLE / STUDENT VIEW / THINK ABOUT IT / AUTHOR NOTE) or plain real-world text without "Imagine" or metaphors.' };
                    }
                    if (/^imagine\b/i.test(text.trim())) {
                        return { ok: false, retryNote: 'Do NOT start with "Imagine".' };
                    }
                    if (/\bare like\b|\bis like a\b|\bas a .* (metaphor|analogy)\b/i.test(text)) {
                        return { ok: false, retryNote: 'No metaphors or analogies — real news only.' };
                    }
                }
                return { ok: true };
            }
            if (style === 'analogy' && phase === 'content') {
                const parsed = parseAnalogyIllustrationContent(content);
                if (!parsed.analogy) {
                    return { ok: false, retryNote: 'Return THE ANALOGY: with 1–3 paragraphs (see required structure).' };
                }
                if (!parsed.mapping || countAnalogyMappingLines(parsed.mapping) < 4) {
                    return { ok: false, retryNote: 'Return CONCEPT MAPPING: with at least 4 lines using "Textbook term → Analogy part → Why".' };
                }
                if (!parsed.breaksDown) {
                    return { ok: false, retryNote: 'Return WHERE THE ANALOGY BREAKS DOWN: with 1–2 bullets on imperfect comparisons.' };
                }
                if (!parsed.takeaway) {
                    return { ok: false, retryNote: 'Return ONE-LINE TAKEAWAY: with one sentence students should remember.' };
                }
                if (illustrateContentHasBannedOpener(parsed.analogy)) {
                    return { ok: false, retryNote: 'Do NOT start THE ANALOGY with "Imagine" or banned clichés.' };
                }
                if (ctx?.sourceText?.trim() && !tokensOverlap(ctx.sourceText, `${parsed.analogy} ${parsed.mapping}`, 2)) {
                    return { ok: false, retryNote: 'Name at least two specific terms or processes from the SOURCE PASSAGE in THE ANALOGY or CONCEPT MAPPING.' };
                }
                if (analogyTranslationMisconceptionViolates(ctx?.sourceText, parsed.analogy, parsed.mapping)) {
                    return { ok: false, retryNote: 'If the passage mentions mRNA translation, include messenger RNA (mRNA) in the analogy — do NOT call rRNA a protein blueprint.' };
                }
                return { ok: true };
            }
            if (phase === 'content') {
                if (illustrateContentHasBannedOpener(content)) {
                    return { ok: false, retryNote: 'Avoid banned clichés and "Imagine" openings. Map specific mechanisms from the source.' };
                }
                if (ctx?.sourceText?.trim() && !tokensOverlap(ctx.sourceText, content, 2)) {
                    return { ok: false, retryNote: 'Name at least two specific terms or processes from the SOURCE PASSAGE in your illustration.' };
                }
            }
            return { ok: true };
        }

        if (moduleType === 'socratic-question' && phase === 'content') {
            const enhancements = global.DreamBookEnhancements;
            const parsedStructured = parseSocraticStructuredContent(content);
            const parsed = enhancements?.parseSocraticContent
                ? enhancements.parseSocraticContent(content)
                : parsedStructured;
            const hook = parsed.scenarioHook || parsedStructured.hook || '';
            const violation = socraticCheckpointViolates(
                { ...parsedStructured, ...parsed, hook, scenarioHook: hook },
                content,
                formatId,
                ctx
            );
            if (violation.violated) {
                return { ok: false, retryNote: violation.retryNote };
            }
            if (scenarioFirst) {
                if (!hook.trim()) {
                    return { ok: false, retryNote: formatId === 'explain_own_words'
                        ? 'Return HOOK: with 1–2 declarative sentences (no question marks).'
                        : 'First line MUST start with SCENARIO: followed by 1–2 declarative sentences (no question marks).' };
                }
                if (formatId !== 'explain_own_words' && !tokensOverlap(hook, parsed.questions[0], 1)) {
                    return { ok: false, retryNote: 'Q1 MUST reference a specific detail from the HOOK or SCENARIO line.' };
                }
            }
            return { ok: true };
        }

        if (moduleType === 'socratic-question' && phase === 'opening' && scenarioFirst) {
            const parsed = global.DreamBookEnhancements?.parseSocraticContent
                ? global.DreamBookEnhancements.parseSocraticContent(content)
                : parseSocraticStructuredContent(content);
            const hook = parsed.scenarioHook || parsed.hook || '';
            const openNorm = normalizeForCompare(opening);
            const q1Norm = normalizeForCompare(parsed.questions?.[0] || '');
            if (openNorm && q1Norm && (openNorm === q1Norm || openNorm.includes(q1Norm.slice(0, 40)))) {
                return { ok: false, retryNote: 'Return ONLY the HOOK or SCENARIO line verbatim — do not repeat Q1 as the opening.' };
            }
            if (hook && openNorm && !tokensOverlap(hook, opening, 1) && openNorm !== normalizeForCompare(hook)) {
                return { ok: false, retryNote: formatId === 'explain_own_words'
                    ? 'Return ONLY the HOOK text verbatim — no new hook or question.'
                    : 'Return ONLY the SCENARIO line verbatim — no new hook or question.' };
            }
            return { ok: true };
        }

        if (moduleType === 'explain-to-peer' && phase === 'opening') {
            if (formatId === 'teach_sam') {
                const parsed = parseExplainPeerContent(content);
                const task = String(opening || '').trim();
                if (parsed?.structured && parsed?.task?.trim() && task !== parsed.task.trim()) {
                    return { ok: true, warning: 'Opening adjusted to TASK line from content.' };
                }
            }
            if (openingRepeatsBrief(opening, content)) {
                return { ok: false, retryNote: 'Return ONLY one short question — do NOT repeat sentences from the brief above.' };
            }
            return { ok: true };
        }

        if (moduleType === 'explain-to-peer' && phase === 'content') {
            if (formatId === 'teach_sam') {
                const parsed = parseExplainPeerContent(content);
                const violation = explainPeerViolates(parsed, content, {
                    ...ctx,
                    sourceText: ctx?.sourceText || ctx?.displayPassage || ''
                });
                if (violation.violated) {
                    return { ok: false, retryNote: violation.retryNote };
                }
                if (!parsed.structured) {
                    const reg = global.DreamBookScenarioRegistry;
                    if (reg?.socraticExplainOwnWordsViolates?.(content)) {
                        if (!scenarioFirstExempt(ctx, formatId)) {
                            return { ok: false, retryNote: 'Explain in plain language — no analogies, city/garbage-truck comparisons, or setup hooks.' };
                        }
                    }
                }
                return { ok: true };
            }
            const reg = global.DreamBookScenarioRegistry;
            if (reg?.socraticExplainOwnWordsViolates?.(content)) {
                if (formatId === 'explain_like_im_five') {
                    const narrow = narrowSocraticHookViolates(content);
                    if (narrow.violated) {
                        return { ok: false, retryNote: narrow.retryNote };
                    }
                } else if (!scenarioFirstExempt(ctx, formatId)) {
                    return { ok: false, retryNote: 'Explain in plain language — no analogies, city/garbage-truck comparisons, or setup hooks.' };
                } else {
                    const narrow = narrowSocraticHookViolates(content);
                    if (narrow.violated) {
                        return { ok: false, retryNote: narrow.retryNote };
                    }
                }
            }
            return { ok: true };
        }

        if (moduleType === 'opposing-view' && phase === 'opening') {
            const task = String(opening || '').trim();
            if (!task.endsWith('?')) {
                return { ok: false, retryNote: 'Return ONLY one task question ending with "?".' };
            }
            const parsed = parseOpposingChallengeContent(content);
            if (parsed.claim && !tokensOverlap(`${parsed.claim} ${parsed.counter}`, opening, 1)) {
                return { ok: false, retryNote: 'The task question must reference the same debate as THE CLAIM — cite the scenario or claim idea.' };
            }
            return { ok: true };
        }

        if (moduleType === 'opposing-view' && phase === 'content') {
            const parsed = parseOpposingChallengeContent(content);
            if (!parsed.claim || !parsed.counter) {
                return { ok: false, retryNote: 'Return THE CLAIM: and COUNTER-VIEW: sections with non-empty text (see required structure).' };
            }
            if (illustrateContentHasBannedOpener(parsed.claim)) {
                return { ok: false, retryNote: 'Do NOT start THE CLAIM with "Imagine" or banned clichés.' };
            }
            if (opposingParallelTaxonomyViolates(parsed.claim, parsed.counter)) {
                return { ok: false, retryNote: 'THE CLAIM and COUNTER-VIEW must debate ONE shared idea — not parallel Model A/B summaries of two categories.' };
            }
            if (ctx?.sourceText?.trim() && !tokensOverlap(ctx.sourceText, `${parsed.claim} ${parsed.counter}`, 2)) {
                return { ok: false, retryNote: 'Name at least two specific terms from the SOURCE PASSAGE in THE CLAIM or COUNTER-VIEW.' };
            }
            return { ok: true };
        }

        if (moduleType === 'mini-case-study' && phase === 'content') {
            const bodyForCount = stripAuthorNoteForWordCount(content);
            const words = bodyForCount.split(/\s+/).filter(Boolean).length;
            if (words < 60) {
                return { ok: false, retryNote: 'Case study body must be at least 60 words. Return ONLY the scenario body.' };
            }
            if (words > 160) {
                return { ok: false, retryNote: 'Case study body must be 80–120 words. Return ONLY the scenario body.' };
            }
            const reg = global.DreamBookScenarioRegistry;
            if (ctx?.scenarioAssignment && reg?.outputViolatesScenarioAssignment) {
                const v = reg.outputViolatesScenarioAssignment(content, ctx.scenarioAssignment, ctx.batchUsedAssignments, { requireAssignedKeywords: true });
                if (v?.violated) {
                    const directiveInjected = !!(ctx.scenarioAssignment?.directive || ctx.scenarioDirectiveInjected);
                    if (v.soft || directiveInjected) {
                        return { ok: true, warning: v.reason || 'Draft — review scenario wording before confirming.' };
                    }
                    return { ok: false, retryNote: v.reason || `Stay in SCENARIO "${ctx.scenarioAssignment?.label || 'assigned setting'}" only.` };
                }
            }
            if (words > 140) {
                return { ok: true, warning: 'Case study is slightly over the target word count — review before confirming.' };
            }
            if (illustrateContentHasBannedOpener(content)) {
                return { ok: false, retryNote: 'No "Imagine" or bustling-city clichés. Use the assigned SCENARIO setting.' };
            }
            return { ok: true };
        }

        if (moduleType === 'mini-case-study' && phase === 'opening') {
            const wc = String(opening || '').trim().split(/\s+/).filter(Boolean).length;
            if (wc > 30 || openingRepeatsBrief(opening, content)) {
                return { ok: false, retryNote: 'Return ONLY one activity hook under 25 words — do not copy the full scenario.' };
            }
            return { ok: true };
        }

        return { ok: true };
    }

    function buildIllustrateUserPrompt(style, sourceText, ctx) {
        const cfg = global.DreamBookEnhancements?.ILLUSTRATE_STYLES?.[style];
        if (!cfg) return `Source text:\n${sourceText || ''}`;
        const promptCtx = { ...ctx, illustrateStyle: style, phase: 'content' };
        const contextBlock = buildWidgetContextBlock(promptCtx);
        const exerciseLine = buildWidgetExerciseLine('illustrate', style);
        const varietyBlock = buildWidgetVarietyBlock(promptCtx);
        const task = cfg.promptSuffix;
        return `${contextBlock}${exerciseLine ? `EXERCISE: ${exerciseLine}\n\n` : ''}TASK:\n${task}${varietyBlock}\nSOURCE PASSAGE:\n${sourceText || ''}`;
    }

    function buildIllustrateNewsRewritePrompt(sourceText, ctx) {
        const cfg = global.DreamBookEnhancements?.ILLUSTRATE_STYLES?.news;
        const promptCtx = { ...ctx, illustrateStyle: 'news', phase: 'content' };
        const contextBlock = buildWidgetContextBlock(promptCtx);
        const exerciseLine = buildWidgetExerciseLine('illustrate', 'news');
        const varietyBlock = buildWidgetVarietyBlock({ ...promptCtx, skipVariety: false });
        const task = cfg?.promptSuffix || '';
        return `${contextBlock}${exerciseLine ? `EXERCISE: ${exerciseLine}\n\n` : ''}TASK:\n${task}${varietyBlock}\nSOURCE PASSAGE:\n${sourceText || ''}`;
    }

    function buildIllustrateNewsWebPrompt(sourceText, ctx) {
        const promptCtx = { ...ctx, illustrateStyle: 'news', phase: 'content' };
        const contextBlock = buildWidgetContextBlock({ ...promptCtx, skipVariety: true });
        const cfg = global.DreamBookEnhancements?.ILLUSTRATE_STYLES?.news;
        const exerciseLine = buildWidgetExerciseLine('illustrate', 'news');
        const varietyBlock = buildWidgetVarietyBlock(promptCtx);
        return `${contextBlock}${exerciseLine ? `EXERCISE: ${exerciseLine}\n\n` : ''}TASK:\n${cfg?.promptSuffix || ''}${varietyBlock}\nSOURCE PASSAGE:\n${sourceText || ''}`;
    }

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
        if (actionId === 'opposing-view') {
            return resolveFormat(actionId, 'compare_models');
        }
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
        const pick = popCulturePick ? String(popCulturePick).toLowerCase() : '';
        const used = (usedPopCulture || []).filter(Boolean).filter(d => String(d).toLowerCase() !== pick);
        const avoidLine = used.length
            ? ` Do NOT reuse these domains already used in this chapter: ${used.join(', ')}.`
            : '';
        const domainLine = popCulturePick
            ? ` Use a ${popCulturePick} scenario/domain.`
            : ' You may use one brief sports, cooking, gaming, or music reference if it fits.';
        return `\nPop-culture guidance:${domainLine}${avoidLine} Keep it respectful and grade-appropriate.\n`;
    }

    function pickNextFormatId(actionId, usedFormatIds) {
        const fmt = pickFormatForInsert(actionId, usedFormatIds);
        return fmt?.formatId || null;
    }

    function buildModuleUserPrompt(actionId, formatId, sourceText, options) {
        const fmt = resolveFormat(actionId, formatId);
        if (!fmt) return `SOURCE PASSAGE:\n${sourceText || ''}`;
        const ctx = options?.widgetCtx || {};
        const forbidsHooks = formatForbidsHooksInPrompt(actionId, formatId, ctx.illustrateStyle);
        const scenarioFirst = formatUsesScenarioFirst(fmt) || options?.skipEngagement || ctx.skipVariety;
        const promptCtx = {
            ...ctx,
            actionId,
            formatId,
            phase: 'content',
            skipVariety: forbidsHooks || scenarioFirst
        };
        const contextBlock = buildWidgetContextBlock({ ...promptCtx, skipVariety: forbidsHooks });
        const exerciseLine = buildWidgetExerciseLine(actionId, formatId);
        let varietyBlock = '';
        if (forbidsHooks) {
            varietyBlock = buildWidgetVarietyBlock({ ...promptCtx, skipVariety: false, scenarioAssignment: null });
        } else if (!scenarioFirst) {
            varietyBlock = buildWidgetVarietyBlock(promptCtx);
        }
        const personal = options?.personalHint && !promptCtx.authorNote
            ? `\nAUTHOR NOTE: ${options.personalHint}` : '';
        return `${contextBlock}${exerciseLine ? `EXERCISE: ${exerciseLine}\n\n` : ''}TASK:\n${fmt.contentPrompt}${varietyBlock}${personal}\n\nSOURCE PASSAGE:\n${sourceText || ''}`;
    }

    function buildModuleOpeningPrompt(actionId, formatId, contentResult, options) {
        const fmt = resolveFormat(actionId, formatId);
        if (!fmt) return `Content:\n${contentResult || ''}`;
        const ctx = options?.widgetCtx || {};
        const promptCtx = { ...ctx, actionId, formatId, phase: 'opening', skipVariety: true };
        const contextBlock = buildWidgetContextBlock(promptCtx);
        const personal = options?.personalHint && !promptCtx.authorNote
            ? `\nAUTHOR NOTE: ${options.personalHint}` : '';
        return `${contextBlock}TASK:\n${fmt.openingPromptGen}${personal}\n\nContent:\n${contentResult || ''}`;
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
        if (actionId === 'opposing-view' && (id === 'steel_man' || id === 'edge_case')) {
            id = 'compare_models';
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
            compare_models: 'Add a flawed-claim debate where students evaluate a partly correct claim about {topic} using passage evidence.'
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
        scan_illustrate_news: 'Add a real-world application showing why one key idea from {topic} matters outside the textbook, using a recent discovery or event students can relate to.',
        scan_recall_mcq: 'Add a quick multiple-choice recall check after {topic} to confirm students caught the main idea.',
        scan_recall_match: 'Add a match-the-terms recall check to reinforce vocabulary from {topic}.',
        scan_recall_order: 'Add an ordering exercise where students put the steps from {topic} in the correct sequence from memory.',
        scan_simulation: 'Add an interactive PhET simulation so students can manipulate variables and explore the process described in {topic}.',
        scan_socratic: 'Add a Socratic checkpoint where students explain ideas from {topic} in their own words.',
        scan_counter: 'Add a flawed-claim debate where students evaluate a partly correct claim about {topic} and cite passage evidence.',
        scan_case_study: 'Add a mini case study that asks students to apply concepts from {topic} in a realistic scenario.',
        scan_explain_peer: 'Add an explain-to-a-peer exercise where students teach the key terms from {topic} in plain language.'
    };

    /** Substrings to bold in proposal card descriptions — must match text inside blurbs. */
    const AUTHOR_ACTIVITY_LABELS = {
        'opposing-view': {
            compare_models: 'flawed-claim debate'
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
        scan_illustrate_news: 'real-world application',
        scan_recall_mcq: 'quick multiple-choice recall check',
        scan_recall_match: 'match-the-terms recall check',
        scan_recall_order: 'ordering exercise',
        scan_simulation: 'interactive PhET simulation',
        scan_socratic: 'Socratic checkpoint',
        scan_counter: 'flawed-claim debate',
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

    function isWidgetGateCleared(record) {
        if (!record) return false;
        if (record.gateCleared) return true;
        return record.status === 'completed' || record.status === 'skipped';
    }

    function isReadingGateBlocking(status, record) {
        if (isWidgetGateCleared(record)) return false;
        return status === 'pending' || status === 'engaged';
    }

    function buildRetryResetRecord(existing) {
        const base = existing || {};
        const reset = {
            type: base.type || 'unknown',
            viewedAt: base.viewedAt || null,
            gateCleared: isWidgetGateCleared(base),
            status: 'pending',
            engagedAt: null,
            completedAt: null,
            skippedAt: null,
            timeSpentMs: 0,
            messageCount: 0
        };
        return reset;
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
        WIDGET_EXERCISE_LINES,
        buildWidgetContextBlock,
        buildWidgetVarietyBlock,
        buildWidgetExerciseLine,
        buildIllustrateUserPrompt,
        buildIllustrateNewsWebPrompt,
        outputUsesForeignDomain,
        validateWidgetOutput,
        parseOpposingChallengeContent,
        opposingParallelTaxonomyViolates,
        parseAnalogyIllustrationContent,
        parseNewsApplicationContent,
        newsApplicationViolates,
        buildIllustrateNewsRewritePrompt,
        parseSocraticStructuredContent,
        parseExplainPeerContent,
        explainPeerViolates,
        socraticCheckpointViolates,
        SOCRATIC_LADDER_LABELS,
        EXPLAIN_PEER_LADDER_LABELS,
        countAnalogyMappingLines,
        analogyTranslationMisconceptionViolates,
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
        formatForbidsHooksInPrompt,
        formatUsesScenarioFirst,
        SCENARIO_FIRST_HOOK_STYLES,
        listSocraticFormatIds,
        sanitizeSocraticHook,
        narrowSocraticHookViolates,
        cleanLadderQuestionText,
        isLadderStepsComplete,
        buildLadderCoachInstruction,
        buildRecallCoachPrompt,
        isWidgetGateCleared,
        isReadingGateBlocking,
        buildRetryResetRecord
    };
})(typeof window !== 'undefined' ? window : globalThis);
