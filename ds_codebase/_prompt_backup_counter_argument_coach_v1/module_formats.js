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
- HOOK: open with a named student (e.g. Priya, Jade) OR a concrete moment (lab, discussion, quiz mistake) — NOT "Some students think…".
- State the misconception literally in plain language — do NOT use similes ("like a", "is like"). Bad: "thinks the nucleus is like a locked vault." Good: "insists the nucleus is a sealed vault that nothing enters or leaves."
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
1–2 sentences: named student or concrete moment plus the misconception stated literally. No question marks. No similes.

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
Then write exactly 3 numbered questions. Q1 MUST start with "What if" and reference a specific detail from the SCENARIO. Q2 MUST challenge the Misconception named in AUTHOR NOTE using plain language (same idea, not necessarily the same words — e.g. static/fixed/unchanging). Q3 asks for a principle or takeaway. Only Q1 may start with "What if". Each under 25 words, ending with "?".
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
Then write exactly 3 numbered open-ended questions. Q1 MUST reference a specific detail from the SCENARIO (patient, symptom, lab finding, or setting). Q2 MUST challenge the Misconception named in AUTHOR NOTE using plain language. Q3 states a principle or takeaway. Escalate: clarify mechanism → probe assumption → examine consequence. Each under 25 words, ending with "?".
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
Then 3 numbered questions. Q1 MUST reference the SCENARIO detail. Q2 MUST challenge the Misconception named in AUTHOR NOTE using plain language. Q3 states a principle or takeaway. Escalate: clarify → challenge assumption → predict consequence. Each under 25 words, ending with "?".
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
Then 3 numbered investigation-style questions. Q1 MUST reference the SCENARIO. Q2 MUST challenge the Misconception named in AUTHOR NOTE using plain language. Q3 states a principle or takeaway. Each under 25 words, ending with "?".
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

Rules: Do NOT use "Model A" / "Model B". Do NOT start with "Imagine". Name at least two specific terms from the SOURCE PASSAGE in the claim or counter-view. Do NOT include a QUESTIONS section — the student exercise uses a fixed Socratic ladder.`,
                    openingPromptGen: `Return ONLY this exact question verbatim — no preamble: Does the claim work for all cases, or is it too broad?`,
                    hintTemplate: 'Test the claim first, then find an exception and explain what it teaches.',
                    goalTemplate: 'Reason through a flawed claim using a Socratic ladder — test the claim, find an exception, and state the bigger idea.',
                    whyFormatTemplate: 'students confront a plausible misconception and refine it through guided reasoning'
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
- SAM SAYS: Sam's flawed belief in first person or as a direct quote — NO correction, NO "however", NO "this is wrong because".
- Prefer a brief situational opener (e.g. "After the microscopy lab, Sam says…") before the belief.
- State the belief literally — do NOT use similes ("like a", "is like"). Bad: "the cytoskeleton is like a rigid skeleton." Good: "the cytoskeleton is rigid and never remodels."
- Do NOT write "Some students think…" — write Sam's belief directly.
- TASK: one plain-language instruction for the student to explain to Sam (no jargon).
- Q1: what is partly correct about Sam's idea?
- Q2: what important jobs or ideas does Sam leave out?
- Q3: ask for one concrete example from the passage (structure, process, or what breaks if missing).
- Do NOT use sports analogies, "Imagine", or meta-language ("the passage says").

Return ONLY this structure (plain text, no markdown bold):

TITLE:
A short student-friendly title.

SAM SAYS:
1–2 sentences: situational opener optional, then Sam's misconception in Sam's voice. No correction. No similes.

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
                    contentPrompt: `Create an explain-like-I'm-five brief grounded in the SOURCE PASSAGE.

Return ONLY this structure (plain text, no markdown bold):

CORE IDEA:
One sentence naming the most important concept using at least one term from the passage.

CONTEXT:
Two sentences a 10-year-old could follow. You may use one comparison that maps a passage relationship — do NOT replace the biology with an unrelated story.

AUTHOR NOTE:
Misconception: (one line)
Evidence used: (comma-separated terms from the passage)
Takeaway: (one sentence)`,
                    openingPromptGen: `Ask the student to explain the CORE IDEA in their own words so a 10-year-old would understand. Return ONLY one question — do NOT repeat sentences from CONTEXT or reuse its comparison.`,
                    hintTemplate: 'Drop the jargon — use an object or action from daily life.',
                    goalTemplate: 'Explain the most important concept simply so that students can state the core idea without specialized vocabulary.',
                    whyFormatTemplate: 'students state the core idea without specialized vocabulary'
                },
                whiteboard_steps: {
                    label: 'Whiteboard steps',
                    hookStyle: 'steps',
                    contentPrompt: `Create a whiteboard-steps brief grounded in the SOURCE PASSAGE.

Return ONLY this structure (plain text, no markdown bold):

SETUP:
Two sentences on why sequence or order matters for this process. Name at least two specific terms from the passage. Do NOT list the steps — the student supplies those.

STUDENT TASK:
One instruction asking the student to order stages or name evidence on a whiteboard. Reference passage mechanisms — not a freestanding analogy that replaces the biology.

AUTHOR NOTE:
Misconception: (one line)
Evidence used: (comma-separated terms from the passage)
Takeaway: (one sentence)`,
                    openingPromptGen: `Return ONLY the STUDENT TASK line verbatim — do NOT repeat SETUP sentences.`,
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
    const DEBATE_LADDER_STEP_COUNT = 3;
    const DEBATE_SOCRATIC_STEP_IDS = ['useful_truth', 'counterexample', 'repair_claim'];
    const DEBATE_LADDER_LABELS = ['Test the claim', 'Find the exception', 'Bigger idea'];
    const DEBATE_CANONICAL_PROMPTS = [
        'Does the claim work for all cases, or is it too broad?',
        'What specific case or example challenges the claim, and how does it still work?',
        'So what bigger idea or revised rule does that give you?'
    ];

    const COACH_STEP_DONE_TAG = '[STEP_DONE]';
    const COACH_STEP_EVAL_OPEN = '[STEP_EVAL]';
    const COACH_STEP_EVAL_CLOSE = '[/STEP_EVAL]';
    const DEFAULT_MAX_PER_LADDER_STEP = 4;

    const WIDGET_CHAT_POLICIES = {
        socratic: { minTurns: 1, maxPerLadderStep: DEFAULT_MAX_PER_LADDER_STEP, minTurnsRecall: 2 },
        explain: { minTurns: 2, maxPerLadderStep: DEFAULT_MAX_PER_LADDER_STEP, minTurnsRecall: 2 },
        debate: { minTurns: 3, maxPerLadderStep: DEFAULT_MAX_PER_LADDER_STEP, minTurnsRecall: 2 },
        casestudy: { minTurns: 3, maxPerLadderStep: DEFAULT_MAX_PER_LADDER_STEP, minTurnsRecall: 2 },
        realworld: { minTurns: 2, maxPerLadderStep: DEFAULT_MAX_PER_LADDER_STEP, minTurnsRecall: 2 },
        reflect: { minTurns: 2, maxPerLadderStep: DEFAULT_MAX_PER_LADDER_STEP, minTurnsRecall: 2 },
        firstprinciples: { minTurns: 2, maxPerLadderStep: DEFAULT_MAX_PER_LADDER_STEP, minTurnsRecall: 2 },
        recall: { minTurns: 2, maxPerLadderStep: DEFAULT_MAX_PER_LADDER_STEP, minTurnsRecall: 2 }
    };

    function getWidgetChatPolicy(type, actionId) {
        let normalized = type || 'socratic';
        if (actionId === 'mini-case-study') normalized = 'casestudy';
        else if (actionId === 'explain-to-peer') normalized = 'explain';
        else if (actionId === 'real-world-implications') normalized = 'realworld';
        else if (actionId === 'key-takeaways') normalized = 'reflect';
        else if (actionId === 'opposing-view') normalized = 'debate';
        return WIDGET_CHAT_POLICIES[normalized] || WIDGET_CHAT_POLICIES.socratic;
    }

    const COACH_STEP_DONE_NUMBERED_RE = /\[STEP_DONE:(\d)\]/g;
    const COACH_STEP_EVAL_RE = /\[STEP_EVAL\]([\s\S]*?)\[\/STEP_EVAL\]/g;

    function parseOpposingAuthorNote(noteText) {
        const note = String(noteText || '').trim();
        const misconceptionMatch = note.match(/Misconception:\s*([\s\S]*?)(?=Evidence to use:|Evidence used:|$)/i);
        const evidenceMatch = note.match(/Evidence to use:\s*([\s\S]*?)$/i) || note.match(/Evidence used:\s*([\s\S]*?)$/i);
        return {
            misconception: (misconceptionMatch?.[1] || '').trim(),
            evidenceTerms: (evidenceMatch?.[1] || '')
                .split(/[,;]/)
                .map(term => term.trim())
                .filter(Boolean)
        };
    }

    function extractDebateSalientTerms(text, limit = 8) {
        const seen = new Set();
        const out = [];
        substantiveTokens(text).forEach(token => {
            if (seen.has(token)) return;
            seen.add(token);
            out.push(token);
        });
        return out.slice(0, limit);
    }

    function buildDebateRubricProfile(contentOrParsed) {
        const parsed = typeof contentOrParsed === 'string'
            ? parseOpposingChallengeContent(contentOrParsed)
            : (contentOrParsed || {});
        const note = parseOpposingAuthorNote(parsed.authorNote || '');
        const claim = String(parsed.claim || '').trim();
        const counter = String(parsed.counter || '').trim();
        const combined = `${claim} ${counter}`.toLowerCase();
        const isCellNucleusDebate = /nucleus/.test(combined) && /(prokaryot|eukaryot|bacteri|archaea|cell)/.test(combined);
        return {
            kind: isCellNucleusDebate ? 'cell_nucleus' : 'generic',
            claim,
            counter,
            misconception: note.misconception,
            evidenceTerms: note.evidenceTerms,
            claimTerms: extractDebateSalientTerms(claim),
            counterTerms: extractDebateSalientTerms(counter)
        };
    }

    function buildDebateStepSpec(step, rubricProfile) {
        const n = parseInt(step, 10) || 1;
        const profile = rubricProfile || { kind: 'generic' };
        if (profile.kind === 'cell_nucleus') {
            const specs = {
                1: {
                    id: 'test_claim',
                    goal: 'Student should identify that the claim is too broad, while preserving the useful truth that the nucleus matters for eukaryotic cells.',
                    satisfactorySigns: [
                        'Says the claim is too broad, not always true, or only true for some cells',
                        'Identifies that the nucleus is still important for eukaryotic cells',
                        'May mention DNA, genetic material, or organizing cell activities'
                    ],
                    commonMisconceptions: [
                        'Says nothing in the claim is true',
                        'Says prokaryotic cells are the cells that need a nucleus',
                        'Repeats the claim without evaluating it'
                    ],
                    fallbackHints: [
                        'Focus on the part that is true for eukaryotic cells.',
                        'The nucleus helps organize DNA in cells that have one.'
                    ]
                },
                2: {
                    id: 'find_exception',
                    goal: 'Student should identify prokaryotic cells as the counterexample and explain that they still manage genetic instructions without a nucleus.',
                    satisfactorySigns: [
                        'Names prokaryotic cells, bacteria, or archaea',
                        'States they lack a nucleus',
                        'Mentions nucleoid, DNA, or genetic material as the way they still manage instructions'
                    ],
                    commonMisconceptions: [
                        'Names eukaryotic cells as the counterexample',
                        'Says prokaryotic cells have a nucleus',
                        'Can state not all cells need a nucleus but cannot name the counterexample'
                    ],
                    fallbackHints: [
                        'Think about bacteria.',
                        'Bacteria are prokaryotic cells, and prokaryotic cells lack a nucleus.'
                    ]
                },
                3: {
                    id: 'bigger_idea',
                    goal: 'Student should generalize the bigger idea that cells need genetic instructions but do not all use the same structure to manage them.',
                    satisfactorySigns: [
                        'States that not all cells have the same structure',
                        'States that cells can do the same basic job in different ways',
                        'Repairs the original claim in a scientifically accurate way'
                    ],
                    commonMisconceptions: [
                        'Only repeats the counterexample without stating the lesson',
                        'Restates not all cells need a nucleus without explaining the broader principle'
                    ],
                    fallbackHints: [
                        'Try to say what the counterexample teaches us about cells in general.',
                        'Cells can do the same basic job without all having the same structure.'
                    ]
                }
            };
            return specs[n] || specs[1];
        }
        const genericSpecs = {
            1: {
                id: 'test_claim',
                goal: 'Student should judge whether the claim is fully true or too broad, and give a reason.',
                satisfactorySigns: [
                    'States the claim is too broad or only true in some cases',
                    'Keeps at least one plausible part of the claim in view'
                ],
                commonMisconceptions: [
                    'Rejects or accepts the claim without reasoning'
                ]
            },
            2: {
                id: 'find_exception',
                goal: 'Student should identify the counterexample or exception and explain how it still works.',
                satisfactorySigns: [
                    'Names a concrete exception or edge case',
                    'Explains how it still functions or why it challenges the claim'
                ],
                commonMisconceptions: [
                    'Restates the conclusion without naming the exception'
                ]
            },
            3: {
                id: 'bigger_idea',
                goal: 'Student should state the revised rule or broader idea that fits both the claim and the exception.',
                satisfactorySigns: [
                    'Gives a broader rule, revised claim, or takeaway'
                ],
                commonMisconceptions: [
                    'Repeats examples without generalizing'
                ]
            }
        };
        return genericSpecs[n] || genericSpecs[1];
    }

    function parseDebateTurnEvaluation(text) {
        const raw = String(text || '').trim();
        if (!raw) return null;
        const cleaned = raw
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim();
        const candidates = [];
        candidates.push(cleaned);
        const blockMatch = cleaned.match(/\{[\s\S]*\}/);
        if (blockMatch) candidates.push(blockMatch[0]);
        for (const candidate of candidates) {
            try {
                const parsed = JSON.parse(candidate);
                if (!parsed || typeof parsed !== 'object') continue;
                const studentState = String(parsed.student_state || parsed.studentState || '').trim().toLowerCase();
                const coachReply = String(parsed.coach_reply || parsed.coachReply || '').trim();
                if (!coachReply) continue;
                return {
                    student_state: studentState || 'partial',
                    step_complete: !!(parsed.step_complete ?? parsed.stepComplete),
                    mastery_estimate: String(parsed.mastery_estimate || parsed.masteryEstimate || '').trim().toLowerCase() || 'partial',
                    misconception: String(parsed.misconception || '').trim(),
                    coach_move: String(parsed.coach_move || parsed.coachMove || '').trim().toLowerCase() || 'nudge',
                    coach_reply: coachReply,
                    advance_to_step: parsed.advance_to_step == null ? null : parseInt(parsed.advance_to_step, 10),
                    rationale: String(parsed.rationale || '').trim(),
                    state_delta: (parsed.state_delta && typeof parsed.state_delta === 'object') ? parsed.state_delta : {}
                };
            } catch (e) {
                continue;
            }
        }
        return null;
    }

    function buildDebateQuestionLadder(contentOrParsed) {
        const profile = buildDebateRubricProfile(contentOrParsed);
        if (profile.kind === 'cell_nucleus') {
            return [
                'Does the claim work for all cells, or is it too broad?',
                'What kind of cell challenges the claim, and how does it still manage genetic instructions?',
                'So what bigger idea about cells does that give you?'
            ];
        }
        return DEBATE_CANONICAL_PROMPTS.slice();
    }

    function debateStepIdFromNumber(stepNum) {
        const n = parseInt(stepNum, 10);
        return DEBATE_SOCRATIC_STEP_IDS[n - 1] || DEBATE_SOCRATIC_STEP_IDS[0];
    }

    function createEmptyKnownConcepts() {
        return {
            nucleus_controls_eukaryotes: false,
            prokaryotes_lack_nucleus: false,
            nucleoid_or_dna: false,
            broader_principle: false,
            repaired_claim: false
        };
    }

    function createDebateSocraticState(stepNum, rubricProfile) {
        const step = parseInt(stepNum, 10) || 1;
        return {
            current_step: debateStepIdFromNumber(step),
            step_status: 'active',
            student_turn_count: 0,
            followups_in_current_step: 0,
            known_concepts: createEmptyKnownConcepts(),
            rubric_profile: rubricProfile || null,
            should_advance: false
        };
    }

    function parseCoachStepEval(text) {
        const raw = String(text || '');
        const match = /\[STEP_EVAL\]([\s\S]*?)\[\/STEP_EVAL\]/.exec(raw);
        if (!match) return null;
        try {
            const parsed = JSON.parse(match[1].trim());
            return {
                feedback: String(parsed.feedback || parsed.missing_piece || '').trim(),
                should_advance: !!parsed.should_advance,
                next_step: parsed.next_step || null,
                nudge_question: parsed.nudge_question != null ? String(parsed.nudge_question).trim() : null,
                is_correct: !!parsed.is_correct,
                is_complete_for_current_step: !!parsed.is_complete_for_current_step,
                missing_piece: String(parsed.missing_piece || '')
            };
        } catch (e) {
            return null;
        }
    }

    function stripQuestionSentences(text) {
        return String(text || '')
            .split(/(?<=[.!])\s+/)
            .filter(sentence => sentence.trim() && !sentence.includes('?'))
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function buildDebateCoachVisibleReply(stepEval, fallbackText) {
        const fb = String(stepEval?.feedback || '').trim();
        const fallback = stripCoachHiddenTags(fallbackText || '');
        if (stepEval?.should_advance) {
            const visible = fb || stripQuestionSentences(fallback);
            return visible.replace(/\?\s*$/, '').trim() || visible;
        }
        const nudge = stepEval?.nudge_question != null ? String(stepEval.nudge_question).trim() : '';
        if (nudge) {
            if (stepEval?.is_correct) {
                return nudge;
            }
            if (fb && fb.length <= 140 && !fb.includes('?')) {
                return `${fb.replace(/\.\s*$/, '')}. ${nudge}`.trim();
            }
            return nudge;
        }
        return fb || fallback;
    }

    function extractKnownConceptsFromText(text) {
        const t = String(text || '').toLowerCase();
        return {
            nucleus_controls_eukaryotes: /nucleus.*(control|activit|organiz|store|important)|control.*nucleus|stores dna|genetic material|eukaryot/i.test(t),
            prokaryotes_lack_nucleus: /prokaryot|bacteri|archaea|without a nucleus|no nucleus|lack.*nucleus|cells without/i.test(t),
            nucleoid_or_dna: /nucleoid|dna|genetic material|genetic instruction|chromosom/i.test(t),
            broader_principle: /(different (ways|way|structures|structure)|same basic (job|jobs|need|function)|organize.*different|different.*organize|not all cells (need|have) the same|same structural organi[sz]ation|same organi[sz]ation|too broad|overgeneral|genetic instructions.*different|different cell types.*function|cells can still function)/i.test(t),
            repaired_claim: false
        };
    }

    function detectCellTypeNucleusConfusion(text) {
        const t = String(text || '').toLowerCase();
        const prokaryoteMention = /(prokaryot|bacteri|archaea)/.test(t);
        const eukaryoteMention = /eukaryot/.test(t);
        const positiveNucleus = /(have|has|need|needs|must|require)[\s\S]{0,20}(a\s+)?nucleus|(a\s+)?nucleus[\s\S]{0,30}(for controlling|to control|is essential|is important)/.test(t);
        const negativeNucleus = /(do not|don't|dont|lack|without|no)[\s\S]{0,20}(a\s+)?nucleus/.test(t);
        const prokaryoteHasNucleus = prokaryoteMention && positiveNucleus && !negativeNucleus;
        const eukaryoteLacksNucleus = eukaryoteMention && negativeNucleus;
        return { prokaryoteMention, eukaryoteMention, prokaryoteHasNucleus, eukaryoteLacksNucleus };
    }

    function mergeKnownConcepts(existing, detected) {
        const base = existing || createEmptyKnownConcepts();
        const next = detected || {};
        return {
            nucleus_controls_eukaryotes: !!(base.nucleus_controls_eukaryotes || next.nucleus_controls_eukaryotes),
            prokaryotes_lack_nucleus: !!(base.prokaryotes_lack_nucleus || next.prokaryotes_lack_nucleus),
            nucleoid_or_dna: !!(base.nucleoid_or_dna || next.nucleoid_or_dna),
            broader_principle: !!(base.broader_principle || next.broader_principle),
            repaired_claim: !!(base.repaired_claim || next.repaired_claim)
        };
    }

    function evaluateGenericDebateStepAnswer(step, studentText, state) {
        const t = String(studentText || '').toLowerCase().trim();
        const words = t.split(/\s+/).filter(Boolean);
        const profile = state?.rubric_profile || null;
        const claimText = profile?.claim || '';
        const counterText = profile?.counter || '';
        const evidenceText = (profile?.evidenceTerms || []).join(' ');
        const result = {
            feedback: '',
            is_correct: false,
            is_complete_for_current_step: false,
            missing_piece: '',
            should_advance: false,
            next_step: null,
            nudge_question: null,
            known_concepts: state?.known_concepts || createEmptyKnownConcepts()
        };
        if (!t) {
            result.missing_piece = 'a substantive answer';
            result.nudge_question = 'What makes you think the claim is solid or too broad?';
            return result;
        }
        const mentionsClaim = tokensOverlap(claimText, t, 1) || tokensOverlap(evidenceText, t, 1);
        const mentionsCounter = tokensOverlap(counterText, t, 1) || tokensOverlap(evidenceText, t, 1);
        const rejectsOvergeneralization = /too broad|not always|not every|not all|only some|depends|overgeneral|exception|works for some/i.test(t);
        const explainsReasoning = /because|since|so|but|however|yet|still|instead|while/i.test(t) || words.length >= 8;
        const statesBroaderRule = /bigger idea|bigger rule|revised rule|better rule|revised claim|broader lesson|shows that|suggests that|means that|different ways|same job|same basic/i.test(t)
            || (rejectsOvergeneralization && explainsReasoning);
        const n = parseInt(step, 10) || 1;
        if (n === 1) {
            if ((rejectsOvergeneralization || mentionsClaim) && explainsReasoning) {
                result.is_correct = true;
                result.is_complete_for_current_step = true;
                result.should_advance = true;
                result.next_step = 'counterexample';
                result.feedback = 'Yes — good start. You are testing whether the claim really holds in every case.';
                return result;
            }
            result.missing_piece = 'whether the claim fully holds or is too broad';
            result.nudge_question = 'What part of the claim sounds plausible at first, and what makes it too broad?';
            return result;
        }
        if (n === 2) {
            if (mentionsCounter && explainsReasoning) {
                result.is_correct = true;
                result.is_complete_for_current_step = true;
                result.should_advance = true;
                result.next_step = 'repair_claim';
                result.feedback = 'Right — that example helps test the claim against a real exception or edge case.';
                return result;
            }
            if (mentionsCounter) {
                result.is_correct = true;
                result.missing_piece = 'how that example still works';
                result.nudge_question = 'Good. How does that case still work even though it does not fit the claim exactly?';
                return result;
            }
            result.missing_piece = 'a concrete case or example from the counter-view';
            result.nudge_question = 'What specific case or example from the counter-view makes the claim look too broad?';
            return result;
        }
        if (n === 3) {
            if (statesBroaderRule && words.length >= 6) {
                result.is_correct = true;
                result.is_complete_for_current_step = true;
                result.should_advance = true;
                result.feedback = 'Yes — that gets the bigger idea: the original claim was too broad, so the better rule has to fit both the claim and the exception.';
                return result;
            }
            result.is_correct = true;
            result.missing_piece = 'the broader lesson from the exception';
            result.nudge_question = 'What broader rule would fit both the original claim and the exception?';
            return result;
        }
        return result;
    }

    function evaluateDebateStepAnswer(step, studentText, state) {
        const t = String(studentText || '').toLowerCase().trim();
        const words = t.split(/\s+/).filter(Boolean);
        const profile = state?.rubric_profile || null;
        if (profile?.kind && profile.kind !== 'cell_nucleus') {
            return evaluateGenericDebateStepAnswer(step, studentText, state);
        }
        const confusion = detectCellTypeNucleusConfusion(t);
        const known = mergeKnownConcepts(state?.known_concepts, extractKnownConceptsFromText(t));
        const result = {
            feedback: '',
            is_correct: false,
            is_complete_for_current_step: false,
            missing_piece: '',
            should_advance: false,
            next_step: null,
            nudge_question: null,
            known_concepts: known
        };
        if (!t) {
            result.missing_piece = 'a substantive answer';
            result.nudge_question = 'What part of the claim could still be true?';
            return result;
        }
        const n = parseInt(step, 10) || 1;
        if (n === 1) {
            const rejectingOnly = /nothing is fair|not fair|no part|none of it|every cell does not need|all cells do not need/i.test(t);
            const broadDiagnosis = /too broad|overgeneral|not all|not every|works for some|only some|depends/i.test(t);
            if (confusion.prokaryoteHasNucleus) {
                result.missing_piece = 'the correct cell type for the useful truth';
                result.feedback = 'Check the cell type: prokaryotic cells do not have a nucleus.';
                result.nudge_question = 'Which cells does that part of the claim fit instead?';
                return result;
            }
            if (confusion.eukaryoteLacksNucleus) {
                result.missing_piece = 'the correct cell type for the useful truth';
                result.feedback = 'Check the cell type: eukaryotic cells do have a nucleus.';
                result.nudge_question = 'Which cells does that useful truth apply to?';
                return result;
            }
            const goodEnough = !rejectingOnly && (
                /nucleus.*(control|activit|organiz|store|contain)|control.*(cell|activit)|nucleus.*(important|helps?|stores?|organizes?)|stores dna|genetic material|genetic information|eukaryot.*nucleus|nucleus helps/i.test(t)
                || (/eukaryot/i.test(t) && /nucleus/i.test(t) && /(important|helps?|control|activit|organiz|store|genetic|dna)/i.test(t))
            );
            if (goodEnough) {
                result.is_correct = true;
                result.is_complete_for_current_step = true;
                result.should_advance = true;
                result.next_step = 'counterexample';
                result.feedback = 'Right — that part is true for eukaryotic cells because the nucleus helps organize genetic information.';
                known.nucleus_controls_eukaryotes = true;
                result.known_concepts = known;
            } else if (broadDiagnosis || rejectingOnly) {
                result.is_correct = true;
                result.is_complete_for_current_step = false;
                result.feedback = 'Yes — the claim is too broad.';
                result.missing_piece = 'what part could still be true for some cells';
                result.nudge_question = 'If the claim is too broad, what part of it still holds for some cells?';
            } else if (/yes|no|maybe|idk|don't know/i.test(t)) {
                result.missing_piece = 'what part of the claim could be true for some cells';
                result.nudge_question = 'What does the nucleus contain or organize that helps the cell control activities?';
            } else {
                result.missing_piece = 'what structure or role makes part of the claim reasonable';
                result.nudge_question = 'What does the nucleus contain or organize that helps the cell control activities?';
            }
            return result;
        }
        if (n === 2) {
            if (confusion.eukaryoteMention && !confusion.prokaryoteMention) {
                result.missing_piece = 'the cell type that actually lacks a nucleus';
                result.feedback = 'Eukaryotic cells have a nucleus, so they are not the counterexample here.';
                result.nudge_question = (state?.followups_in_current_step || 0) >= 1
                    ? 'Think about bacteria. What kind of cell lacks a nucleus?'
                    : 'Which kind of cell lacks a nucleus instead?';
                result.known_concepts = known;
                return result;
            }
            if (confusion.eukaryoteLacksNucleus) {
                result.missing_piece = 'the cell type that actually lacks a nucleus';
                result.feedback = 'Eukaryotic cells do have a nucleus.';
                result.nudge_question = (state?.followups_in_current_step || 0) >= 1
                    ? 'Think about bacteria. What kind of cell lacks a nucleus?'
                    : 'Which kind of cell lacks a nucleus instead?';
                result.known_concepts = known;
                return result;
            }
            if (confusion.prokaryoteHasNucleus) {
                result.missing_piece = 'the key feature of the counterexample';
                result.feedback = 'Prokaryotic cells are the counterexample because they do not have a nucleus.';
                result.nudge_question = 'How do prokaryotic cells still manage their genetic instructions?';
                result.known_concepts = known;
                return result;
            }
            const bareConclusion = /not all|don't need|dont need|all cells.*nucleus/i.test(t)
                && !known.prokaryotes_lack_nucleus;
            if (bareConclusion) {
                result.is_correct = true;
                result.missing_piece = 'which cell type shows the claim is too broad';
                result.nudge_question = 'That is the conclusion. What kind of cell shows this?';
                result.known_concepts = known;
                return result;
            }
            if (known.prokaryotes_lack_nucleus && known.nucleoid_or_dna) {
                result.is_correct = true;
                result.is_complete_for_current_step = true;
                result.should_advance = true;
                result.next_step = 'repair_claim';
                result.feedback = 'Yes — prokaryotes lack a nucleus but still have genetic instructions, usually in a nucleoid.';
                result.known_concepts = known;
                return result;
            }
            if (known.prokaryotes_lack_nucleus && !known.nucleoid_or_dna) {
                result.is_correct = true;
                result.is_complete_for_current_step = false;
                result.missing_piece = 'where genetic material is found without a nucleus';
                result.nudge_question = 'Good. Since they do not have a nucleus, where is their genetic material found?';
                result.known_concepts = known;
                return result;
            }
            result.missing_piece = 'a cell type that lacks a nucleus';
            result.nudge_question = 'What kind of cell lacks a nucleus?';
            result.known_concepts = known;
            return result;
        }
        if (n === 3) {
            const hasEukaryoteRole = /eukaryot|nucleus.*(control|activit|organiz|manage)|have a nucleus/i.test(t);
            const hasProkaryoteContrast = /prokaryot|bacteri|archaea|no nucleus|without.*nucleus|lack.*nucleus|do not have|don't have/i.test(t)
                || (known.prokaryotes_lack_nucleus && /prokaryot|do not|don't|without|lack/i.test(t));
            const hasRevisedClaim = /not (all|essential|require)|not essential|not ess|isn'?t essential|aren'?t essential|don'?t need|do not need|doesn'?t need|do not require|not require|not needed|without a nucleus|can function without|can manage without|is not essential|are not essential/i.test(t);
            const hasMechanism = known.nucleoid_or_dna || /nucleoid|dna|genetic/i.test(t);
            const hasDifferentWays = /different (ways|way|structures|structure)|organize.*different|different.*organize|same basic (job|jobs|need|function)|same thing in different ways|still function|still do the same|not all cells (need|have) the same|same structural organi[sz]ation|same organi[sz]ation/i.test(t);
            const hasOvergeneralization = /too broad|overgeneral|not all|not every|cannot say all|can't say all|doesn'?t mean all|one kind.*not all/i.test(t);
            const hasPrinciple = known.broader_principle
                || ((hasDifferentWays || hasOvergeneralization) && (hasMechanism || hasProkaryoteContrast || /genetic instructions|genetic material|dna/i.test(t)))
                || (/all cells need genetic/i.test(t) && /not all.*nucleus|but not all.*nucleus/i.test(t));
            const hasRepair = words.length >= 8
                && hasEukaryoteRole
                && hasProkaryoteContrast
                && hasRevisedClaim
                && (hasMechanism || known.prokaryotes_lack_nucleus);
            const hasBigIdea = words.length >= 8 && (hasPrinciple || hasRepair);
            if (hasBigIdea) {
                result.is_correct = true;
                result.is_complete_for_current_step = true;
                result.should_advance = true;
                result.feedback = 'Yes — that gets the bigger idea: cells need genetic instructions, but they do not all organize them in the same way.';
                known.broader_principle = true;
                known.repaired_claim = hasRepair;
                result.known_concepts = known;
                return result;
            }
            const partialOnly = /not all|don't need|dont need|all cells/i.test(t) && words.length < 12;
            if (partialOnly || words.length < 8) {
                result.is_correct = true;
                result.is_complete_for_current_step = false;
                result.missing_piece = 'the bigger idea this counterexample reveals';
                result.nudge_question = 'You have the example. What bigger idea does it show about how cells work?';
                result.known_concepts = known;
                return result;
            }
            result.missing_piece = 'the broader lesson from the counterexample';
            result.nudge_question = 'So what does that suggest: do all cells need the same structure to do the same basic job?';
            result.known_concepts = known;
            return result;
        }
        return result;
    }

    function mergeDebateStepEvaluations(coachEval, clientEval) {
        const coach = coachEval || null;
        const client = clientEval || {};
        const clientComplete = client.is_complete_for_current_step === true;
        const clientAdvance = client.should_advance === true;
        const coachAdvance = !!(coach && coach.should_advance === true);
        // Client good-enough wins even when the coach is conservative or omits STEP_EVAL.
        let shouldAdvance = clientComplete && (clientAdvance || coachAdvance);
        if (!coach && clientAdvance) shouldAdvance = true;
        const feedback = (client.feedback && (clientComplete || client.is_correct))
            ? client.feedback
            : ((coach && coach.feedback) || client.feedback || '');
        let nudgeQuestion = null;
        if (!shouldAdvance) {
            nudgeQuestion = client.nudge_question || (coach && coach.nudge_question) || null;
        }
        return {
            feedback,
            is_correct: !!(coach && coach.is_correct) || !!client.is_correct,
            is_complete_for_current_step: clientComplete,
            missing_piece: client.missing_piece || (coach && coach.missing_piece) || '',
            should_advance: shouldAdvance,
            next_step: shouldAdvance ? ((coach && coach.next_step) || client.next_step || null) : null,
            nudge_question: nudgeQuestion,
            known_concepts: client.known_concepts || (coach && coach.known_concepts) || createEmptyKnownConcepts()
        };
    }

    function updateDebateSocraticState(state, step, mergedEval, studentText) {
        const next = { ...(state || createDebateSocraticState(step)) };
        const n = parseInt(step, 10) || 1;
        next.current_step = debateStepIdFromNumber(n);
        next.student_turn_count = (next.student_turn_count || 0) + 1;
        next.known_concepts = mergeKnownConcepts(next.known_concepts, mergedEval.known_concepts || extractKnownConceptsFromText(studentText));
        next.should_advance = mergedEval.should_advance === true;
        if (mergedEval.should_advance) {
            next.step_status = 'complete';
            next.followups_in_current_step = 0;
            if (n === 1) next.known_concepts.nucleus_controls_eukaryotes = true;
            if (n === 2) {
                next.known_concepts.prokaryotes_lack_nucleus = true;
                next.known_concepts.nucleoid_or_dna = true;
            }
            if (n === 3) next.known_concepts.broader_principle = true;
        } else {
            next.step_status = 'needs_nudge';
            next.followups_in_current_step = (next.followups_in_current_step || 0) + 1;
        }
        return next;
    }

    function resetDebateSocraticStateForStep(stepNum, priorStateOrProfile) {
        const step = parseInt(stepNum, 10) || 1;
        const profile = priorStateOrProfile?.rubric_profile
            ? priorStateOrProfile.rubric_profile
            : priorStateOrProfile;
        const next = createDebateSocraticState(step, profile || null);
        next.step_status = 'active';
        return next;
    }

    function isDebateLadderConcluded(stepConcluded) {
        const sc = stepConcluded || {};
        return !!sc[1] && !!sc[2] && !!sc[3];
    }

    function getDebateStepFooterCopy(step, stepStatus, stepsDone) {
        const n = parseInt(step, 10) || 1;
        const done = stepsDone || 0;
        const status = stepStatus || 'active';
        const labels = {
            1: 'test whether the claim really holds',
            2: 'find the exception and explain how it still works',
            3: 'name the bigger idea'
        };
        const activeGoal = labels[n] || 'keep reasoning';
        if (status === 'needs_nudge') {
            const nudgeHints = {
                1: 'close — say why the claim sounds plausible or too broad',
                2: 'close — name the exception and how it still works',
                3: 'close — say what the exception teaches you'
            };
            return `Step ${n} of ${DEBATE_LADDER_STEP_COUNT} — ${nudgeHints[n] || activeGoal}. · ${done}/${DEBATE_LADDER_STEP_COUNT} steps complete. Reply in chat, or skip to continue reading.`;
        }
        if (status === 'complete' && n < DEBATE_LADDER_STEP_COUNT) {
            const nextGoal = labels[n + 1] || 'continue';
            return `Step ${n + 1} of ${DEBATE_LADDER_STEP_COUNT} — ${nextGoal}. · ${done}/${DEBATE_LADDER_STEP_COUNT} steps complete. Reply in chat, or skip to continue reading.`;
        }
        if (done >= DEBATE_LADDER_STEP_COUNT) {
            return `All ${DEBATE_LADDER_STEP_COUNT} steps complete — continuing\u2026`;
        }
        return `Step ${n} of ${DEBATE_LADDER_STEP_COUNT} — ${activeGoal}. · ${done}/${DEBATE_LADDER_STEP_COUNT} steps complete. Reply in chat, or skip to continue reading.`;
    }

    function stripCoachHiddenTags(text) {
        let visible = String(text || '');
        visible = visible.replace(COACH_STEP_EVAL_RE, '');
        visible = visible
            .split('\n')
            .filter(line => {
                const trimmed = line.trim();
                if (trimmed === COACH_STEP_DONE_TAG) return false;
                if (/^\[STEP_DONE:\d\]$/.test(trimmed)) return false;
                return true;
            })
            .join('\n')
            .replace(new RegExp(COACH_STEP_DONE_TAG.replace(/[[\]]/g, '\\$&'), 'g'), '')
            .replace(/\[STEP_DONE:\d\]/g, '')
            .trim();
        return visible;
    }

    function parseCoachResponse(text) {
        const raw = String(text || '');
        const tag = COACH_STEP_DONE_TAG;
        const stepEval = parseCoachStepEval(raw);
        const stepDoneNumbers = [];
        let numberedMatch;
        const numberedRe = new RegExp(COACH_STEP_DONE_NUMBERED_RE.source, 'g');
        while ((numberedMatch = numberedRe.exec(raw)) !== null) {
            const n = parseInt(numberedMatch[1], 10);
            if (n >= 1 && n <= 3 && !stepDoneNumbers.includes(n)) stepDoneNumbers.push(n);
        }
        const stepDone = raw.includes(tag) || stepDoneNumbers.length > 0 || (stepEval && stepEval.should_advance);
        const visible = stripCoachHiddenTags(raw);
        return { text: visible || raw.trim(), stepDone, stepDoneNumbers, stepEval };
    }

    function shouldUseDebateRubricMode(chatType, actionId, formatId) {
        return chatType === 'debate'
            && actionId === 'opposing-view'
            && (formatId === 'compare_models' || !formatId);
    }

    function resolveDebateActiveStep(stepConcluded) {
        const sc = stepConcluded || {};
        for (let n = 1; n <= DEBATE_LADDER_STEP_COUNT; n++) {
            if (!sc[n]) return n;
        }
        return null;
    }

    function detectDebateRubricFromStudentTurn(text, stepConcluded) {
        const sc = stepConcluded || {};
        const detected = [];
        for (let n = 1; n <= DEBATE_LADDER_STEP_COUNT; n++) {
            if (!sc[n]) {
                const evalResult = evaluateDebateStepAnswer(n, text);
                if (evalResult.should_advance) detected.push(n);
            }
        }
        return detected;
    }

    function buildDebateRubricCoachInstruction(opts) {
        const labels = DEBATE_LADDER_LABELS;
        const step = parseInt(opts?.step, 10) || 1;
        const currentQuestion = String(opts?.currentQuestion || DEBATE_CANONICAL_PROMPTS[step - 1] || '').trim();
        const weakTries = opts?.weakTries || 0;
        const followups = opts?.followupsInStep || 0;
        const label = labels[step - 1] || `Step ${step}`;
        const lines = [
            'You are a Socratic AI tutor for a counter-argument exercise.',
            'Help the student reach a strong answer in a short guided discussion (target: 3–6 student turns total).',
            'Do not ask the student to quote or reference the passage. Use the source text only as hidden grounding.',
            '',
            'MESSAGE OWNERSHIP (critical):',
            '- The UI prompt box and chat both show the current step question. Do NOT repeat that question in your visible reply.',
            '- When the step is complete: return brief feedback ONLY in visible text. Set nudge_question to null. Do NOT ask the next step question — the system posts it as a separate chat message.',
            '- When the step is incomplete: ask exactly ONE nudge_question in STEP_EVAL. If the student is directionally right but incomplete, prefer the question alone over evaluative phrases like "Close", "Good", or "Exactly". Never repeat a question the student already answered on this step.',
            '',
            `Student is on step ${step} of ${DEBATE_LADDER_STEP_COUNT} (${label}).`,
            currentQuestion ? `UI step question (for your reference only — do NOT repeat): ${currentQuestion}` : '',
            '',
            'Step goals (accept good-enough answers and move on):',
            '- Step 1 Test the claim: student decides whether the claim fully holds or is too broad, and gives a brief reason.',
            '- Step 2 Find the exception: student names a concrete counterexample or edge case and explains how it still works.',
            '- Step 3 Bigger idea: student states the broader takeaway or revised rule that fits both the claim and the exception.',
            '',
            'For cell/nucleus debates, keep the stronger biology-specific coaching: eukaryotes use a nucleus, prokaryotes lack one, and genetic material can be in a nucleoid.',
            'Step 3 partial answers: ask for the bigger idea behind the counterexample. Prefer a reasoning question over a fill-in-the-blank frame.',
            '',
            'Keep visible replies to 1–3 sentences. Avoid "Exactly", "Correct", "Good job". No long lectures.',
            '',
            'Append hidden evaluation every turn (student must not see this block):',
            `[STEP_EVAL]{"feedback":"Brief visible feedback here","should_advance":false,"next_step":null,"nudge_question":"One question or null"}[/STEP_EVAL]`,
            'When should_advance is true: set nudge_question to null and next_step to counterexample | repair_claim | null (step 3 complete).'
        ].filter(Boolean);
        if (followups >= 1 && step === 2) {
            lines.push('- Student named prokaryotes but not genetic material: ask once where DNA is found, then accept good-enough.');
        }
        if (weakTries >= 2) {
            lines.push('- Student has struggled: one small hint, then one nudge question only.');
        }
        if (weakTries >= 3) {
            lines.push('- Student is stuck: stronger hint with key terms, still one nudge question.');
        }
        return lines.join('\n');
    }

    const buildDebateLadderCoachInstruction = buildDebateRubricCoachInstruction;

    function migrateStepConcludedFromLegacy(stepConcluded, stepMessages, opts) {
        if (opts?.skipLegacyMigration) return { ...(stepConcluded || {}) };
        const concluded = { ...(stepConcluded || {}) };
        const sm = stepMessages || {};
        [0, 1, 2, 3].forEach(n => {
            if (!concluded[n] && (sm[n] || 0) >= 1) concluded[n] = true;
        });
        return concluded;
    }

    function isLadderStepsConcluded(stepConcluded) {
        const sc = stepConcluded || {};
        return !!sc[1] && !!sc[2] && !!sc[3];
    }

    function isLadderStepsComplete(stepMessagesOrRecord) {
        if (stepMessagesOrRecord && typeof stepMessagesOrRecord === 'object' && !Array.isArray(stepMessagesOrRecord)) {
            const record = stepMessagesOrRecord;
            if (record.stepConcluded) {
                return isLadderStepsConcluded(record.stepConcluded);
            }
            if (record.stepMessages) {
                const sm = record.stepMessages;
                return (sm[1] || 0) >= 1 && (sm[2] || 0) >= 1 && (sm[3] || 0) >= 1;
            }
        }
        const sm = stepMessagesOrRecord || {};
        return (sm[1] || 0) >= 1 && (sm[2] || 0) >= 1 && (sm[3] || 0) >= 1;
    }

    function shouldConcludeLadderStep(opts) {
        const stepDone = !!opts?.stepDone;
        const exchangesOnStep = opts?.exchangesOnStep || 0;
        const maxPerStep = opts?.maxPerStep || DEFAULT_MAX_PER_LADDER_STEP;
        return stepDone || exchangesOnStep >= maxPerStep;
    }

    function buildSharedTutorPolicy(opts) {
        const mode = opts?.mode || 'freeform';
        const step = parseInt(opts?.step, 10);
        const weakTries = opts?.weakTries || 0;
        const lines = [
            'TUTOR POLICY:',
            '- Guide with questions and hints first; do not give full answers unless the student is stuck.',
            '- Keep responses to 2–3 sentences. One question per turn unless the step is finishing.',
            '- Ground every nudge in the source passage; avoid walls of text or bullet dumps.',
            '- Foster critical thinking — ask the student to justify, compare, or predict.'
        ];
        if (weakTries >= 2) {
            lines.push('- The student has struggled on this step: offer a narrower hint or partial scaffold, then ask them to restate.');
        }
        if (weakTries >= 3) {
            lines.push('- Student is stuck: give one missing piece using passage terms, then ask them to restate in their own words.');
        }
        if (mode === 'ladder') {
            lines.push(`- Never reveal or ask the next ladder question in this reply — only coach step ${Number.isNaN(step) ? '?' : step}.`);
            if (step === 3) {
                lines.push(`- Final ladder step: affirm briefly, no new follow-up question. When the student demonstrates understanding, append ${COACH_STEP_DONE_TAG} on its own line and end with "Continue reading."`);
            } else {
                lines.push(`- When the student demonstrates understanding OR you coached them through the gap and they restated it, append ${COACH_STEP_DONE_TAG} on its own line at the end (student must not see this tag spoken aloud).`);
            }
        } else if (mode === 'recall') {
            lines.push('- Do not give away the correct MCQ option, full match pairing, or complete order on the first try.');
        } else if (mode === 'freeform') {
            lines.push('- Stay in dialogue until the student has defended or refined their thinking with passage evidence.');
        }
        return lines.join('\n');
    }

    function buildLadderCoachInstruction(step, opts) {
        const n = parseInt(step, 10);
        const isExplain = opts?.chatType === 'explain';
        const weakTries = opts?.weakTries || 0;
        let base;
        const isDebate = opts?.chatType === 'debate';
        if (n === 0) {
            base = isExplain
                ? 'COACHING MODE: The student is responding to the TASK (explain to Sam). Affirm what is partly correct. Do NOT reveal full answers or repeat Question 1. Do not ask a new question — only coach this response.'
                : isDebate
                    ? 'COACHING MODE: The student is reading the claim and counter-view. Affirm engagement only. Do NOT reveal evaluation answers or Question 1 yet.'
                    : 'COACHING MODE: The student is responding to the hook/scenario. Affirm their engagement with the scenario. Do NOT reveal Question 1 yet. Do not ask a new question — only coach this response.';
        } else if (n === 3) {
            base = isDebate
                ? 'COACHING MODE: Final debate step. Briefly affirm their evidence and limits using passage terms. Do NOT ask follow-up questions.'
                : 'COACHING MODE: Final ladder step. Briefly affirm their example or takeaway using passage terms. Do NOT ask follow-up questions.';
        } else if (n >= 1 && n <= 2) {
            base = isDebate
                ? `COACHING MODE: Student is on debate evaluation step ${n} of 3. Affirm what they got right about the claim. Do NOT answer the remaining steps for them. Nudge with one passage term if stuck — no lecture. Do NOT ask the next ladder question — only coach this response.`
                : `COACHING MODE: Student is on ladder step ${n} of 3. Briefly affirm what is strong, then nudge one gap using the source passage. Do NOT ask the next ladder question — only coach this response.`;
        } else {
            base = 'COACHING MODE: Briefly affirm the student response using the source passage. Do not ask a new ladder question yet.';
        }
        const tagLine = `When ready to advance, append ${COACH_STEP_DONE_TAG} on its own line (only if understanding is demonstrated or coached through).`;
        const weakLine = weakTries >= 2 ? ' Student has had multiple weak tries — escalate hint level before concluding the step.' : '';
        return `${base}${weakLine} ${tagLine}`;
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
        const diag = ctx.bandDiagnosis;
        if (diag) {
            const core = diag.core_concept || diag.coreConcept;
            const lo = diag.learning_objective || diag.learningObjective;
            const opp = diag.enhancement_opportunity || diag.enhancementOpportunity;
            const misc = diag.misconceptions;
            if (core) lines.push(`CORE CONCEPT: ${trimSnippet(core, 320)}`);
            if (lo && lo !== core) lines.push(`LEARNING OBJECTIVE: ${trimSnippet(lo, 280)}`);
            if (Array.isArray(misc) && misc.length) {
                lines.push(`LIKELY MISCONCEPTIONS: ${misc.slice(0, 3).map(m => trimSnippet(m, 120)).join('; ')}`);
            }
            if (opp) lines.push(`ENHANCEMENT GAP: ${trimSnippet(opp, 280)}`);
        }
        if (ctx.bandPromptProfile && ctx.bandPromptProfile !== 'default') {
            lines.push(`BAND TYPE: ${ctx.bandPromptProfile}`);
        }
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

    function extractAuthorDomainKeywords(authorNote) {
        const raw = String(authorNote || '').trim().toLowerCase();
        if (!raw) return [];
        const known = [
            { pattern: /\bcricket\b/, label: 'cricket' },
            { pattern: /\bcooking\b|\brecipe\b|\bkitchen\b/, label: 'cooking' },
            { pattern: /\bvideo game\b|\bgaming\b|\bminecraft\b|\bgame\b/, label: 'video game' },
            { pattern: /\bsport/, label: 'sports' },
            { pattern: /\beveryday life\b|\bdaily life\b/, label: 'everyday life' },
            { pattern: /\brecent news\b|\bnews event\b/, label: 'recent news' },
            { pattern: /\bindustry\b|\bcareer/, label: 'industry or careers' },
            { pattern: /\blocal community\b|\bcommunity example\b/, label: 'local community' }
        ];
        const found = [];
        known.forEach(({ pattern, label }) => {
            if (pattern.test(raw)) found.push(label);
        });
        if (found.length) return [...new Set(found)];
        const cleaned = raw
            .replace(/^(use a |use an |author instruction:?|follow this:?)/i, '')
            .replace(/\b(analogy|scenario|example|application|event|to explain this concept)\b/gi, ' ')
            .trim();
        return cleaned.split(/\s+/).filter(w => w.length > 2).slice(0, 3);
    }

    function buildAuthorAnalogyDirective(authorNote, style) {
        const note = String(authorNote || '').trim();
        if (!note) return '';
        if (style === 'news') {
            return `\nAUTHOR ANGLE (MANDATORY): Follow the author's request: "${note}". Build the real-world application around this angle. Do NOT substitute a generic news story that ignores this instruction.\n`;
        }
        const domains = extractAuthorDomainKeywords(note);
        const domainPhrase = domains.length
            ? domains.join(' / ')
            : note.replace(/\s+/g, ' ').slice(0, 120);
        return `\nAUTHOR DOMAIN (MANDATORY): Build the entire analogy in a ${domainPhrase} setting, following: "${note}".
Do NOT use office, factory, open-plan workspace, school, kitchen, hospital, or other domains unless the author note explicitly allows them.
Every paragraph in THE ANALOGY and CONCEPT MAPPING must reflect this domain.\n`;
    }

    function buildAuthorIntentFromNote(authorNote, style) {
        const directive = buildAuthorAnalogyDirective(authorNote, style);
        if (!directive) return '';
        return directive.trim().split('\n')[0];
    }

    function analogyAuthorNoteViolates(authorNote, parsed) {
        const note = String(authorNote || '').trim();
        if (!note) return { violated: false };
        const combined = `${parsed?.title || ''} ${parsed?.analogy || ''} ${parsed?.mapping || ''}`.toLowerCase();
        const domains = extractAuthorDomainKeywords(note);
        if (!domains.length) {
            if (!tokensOverlap(note, combined, 1)) {
                return { violated: true, retryNote: `The analogy must follow the author request: ${note}` };
            }
            return { violated: false };
        }
        const matched = domains.some(domain => {
            const parts = domain.split(/\s+/).filter(w => w.length > 2);
            return parts.some(part => combined.includes(part)) || tokensOverlap(domain, combined, 1);
        });
        if (!matched) {
            return {
                violated: true,
                retryNote: `The analogy must use the author-requested domain (${domains.join(' / ')}). Do not use office, factory, or other unrelated settings.`
            };
        }
        return { violated: false };
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
            const parts = ctx.authorNote?.trim()
                ? []
                : ['Choose an analogy domain that best fits the mechanism in the passage — vary settings across the chapter.'];
            parts.push('Identify key technical terms or mechanisms in the SOURCE PASSAGE. Map as many as needed for clarity; use at least 2 specific terms when available. If fewer than 2, map the main concept and one supporting detail.');
            if (ctx.bandPromptProfile === 'compare_contrast') {
                parts.push('COMPARE/CONTRAST BAND: The analogy must explain BOTH sides of the contrast. Map key terms from EACH side. Do NOT generate an analogy that explains only one category.');
            }
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

    const CONCEPT_SYNONYM_GROUPS = [
        ['static', 'fixed', 'rigid', 'unchanging', 'unchanged', 'permanent', 'stable', 'constant', 'immobile'],
        ['dynamic', 'fluid', 'changing', 'remodel', 'remodels', 'flexible', 'mutable', 'adapt', 'adaptable'],
        ['membrane', 'boundary', 'barrier', 'border', 'wall', 'edge', 'envelope'],
        ['selective', 'permeability', 'permeable', 'filter', 'gate', 'checkpoint', 'semipermeable'],
        ['structure', 'framework', 'scaffold', 'support', 'skeleton'],
        ['process', 'sequence', 'stage', 'step', 'order', 'pathway']
    ];

    function expandConceptTokens(text) {
        const tokens = new Set(substantiveTokens(text));
        CONCEPT_SYNONYM_GROUPS.forEach(group => {
            if (group.some(g => tokens.has(g))) {
                group.forEach(g => tokens.add(g));
            }
        });
        return tokens;
    }

    function conceptOverlap(a, b) {
        const setA = expandConceptTokens(a);
        return substantiveTokens(b).some(t => setA.has(t));
    }

    function misconceptionChallengesQuestions(misconception, hook, q1, q2, evidenceUsed) {
        const tested = `${hook} ${q1} ${q2}`;
        if (!misconception?.trim()) return true;
        if (tokensOverlap(misconception, tested, 1)) return true;
        if (conceptOverlap(misconception, tested)) return true;
        if (evidenceUsed?.trim()) {
            const terms = evidenceUsed.split(/[,;]/).map(t => t.trim()).filter(Boolean);
            if (terms.some(t => tokensOverlap(t, tested, 1) || conceptOverlap(t, tested))) return true;
        }
        return false;
    }

    function explainPeerFormatDriftViolates(content) {
        if (/\*\*Most Important Concept|\*\*Context for Younger|Most Important Concept:|Context for Younger Students:/i.test(content)) {
            return {
                violated: true,
                retryNote: 'Use the required section headers (SETUP/STUDENT TASK or CORE IDEA/CONTEXT) — not freeform markdown labels.'
            };
        }
        return { violated: false };
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
        const claimMatch = raw.match(/THE CLAIM:\s*([\s\S]*?)(?=COUNTER-VIEW:|QUESTIONS:|YOUR TASK:|AUTHOR NOTE:|$)/i);
        const counterMatch = raw.match(/COUNTER-VIEW:\s*([\s\S]*?)(?=QUESTIONS:|YOUR TASK:|AUTHOR NOTE:|$)/i);
        const questionsSectionMatch = raw.match(/QUESTIONS:\s*([\s\S]*?)(?=\nAUTHOR NOTE:|$)/i);
        const taskMatch = raw.match(/YOUR TASK:\s*([\s\S]*?)(?=AUTHOR NOTE:|$)/i);
        const noteMatch = raw.match(/AUTHOR NOTE:\s*([\s\S]*?)$/i);
        const questions = extractSocraticNumberedQuestions(questionsSectionMatch?.[1] || '');
        return {
            claim: (claimMatch?.[1] || '').trim(),
            counter: (counterMatch?.[1] || '').trim(),
            task: (taskMatch?.[1] || '').trim(),
            questions,
            authorNote: (noteMatch?.[1] || '').trim(),
            structured: !!(claimMatch?.[1]?.trim() && counterMatch?.[1]?.trim())
        };
    }

    function opposingCompoundQuestionViolates(text) {
        const t = String(text || '').trim();
        if (!t) return false;
        if (/\(\s*1\s*\)|\(\s*2\s*\)|what is partly correct.*what is incorrect|partly correct.*incorrect or incomplete.*evidence.*break down/i.test(t)) {
            return true;
        }
        const qCount = (t.match(/\?/g) || []).length;
        return qCount > 1;
    }

    function opposingQuestionsViolates(questions) {
        const qs = (questions || []).map(q => cleanLadderQuestionText(q)).filter(Boolean);
        if (qs.length === 0) return { violated: false };
        return { violated: true, retryNote: 'Do NOT include QUESTIONS — return only THE CLAIM, COUNTER-VIEW, and AUTHOR NOTE.' };
    }

    function opposingClaimCounterViolates(parsed) {
        if (!parsed?.claim?.trim() || !parsed?.counter?.trim()) {
            return { violated: true, retryNote: 'Return THE CLAIM: and COUNTER-VIEW: sections with non-empty text (see required structure).' };
        }
        return { violated: false };
    }

    function parseCaseStudyCachedContent(text) {
        const raw = String(text || '').trim();
        const hookMatch = raw.match(/ACTIVITY HOOK:\s*([\s\S]*?)(?=\n\n|\n[A-Z][A-Z ]+:|$)/i);
        let activityHook = (hookMatch?.[1] || '').trim();
        let body = raw;
        if (hookMatch) {
            body = raw.replace(hookMatch[0], '').trim();
        }
        if (!activityHook) {
            const sentences = body.split(/(?<=[.?!])\s+/).map(s => s.trim()).filter(Boolean);
            const question = sentences.find(s => s.includes('?') && s.split(/\s+/).filter(Boolean).length <= 30);
            activityHook = question || '';
        }
        return { body, activityHook };
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

    const COMPARE_CONTRAST_SOURCE_PAIRS = [
        [/\bprokaryot/i, /\beukaryot/i],
        [/\bplant\b/i, /\banimal\b/i],
        [/\bpassive\b/i, /\bactive\b/i],
        [/\bmitosis\b/i, /\bmeiosis\b/i]
    ];

    function detectCompareContrastPairInSource(sourceText) {
        const source = String(sourceText || '');
        for (const [sideA, sideB] of COMPARE_CONTRAST_SOURCE_PAIRS) {
            if (sideA.test(source) && sideB.test(source)) return [sideA, sideB];
        }
        return null;
    }

    function analogyCompareContrastViolates(ctx, parsed) {
        if (ctx?.bandPromptProfile !== 'compare_contrast') return { violated: false };
        const source = String(ctx?.sourceText || '');
        const combined = `${parsed?.analogy || ''} ${parsed?.mapping || ''} ${parsed?.takeaway || ''}`;
        const pair = detectCompareContrastPairInSource(source);
        if (pair) {
            const [sideA, sideB] = pair;
            if (!(sideA.test(combined) && sideB.test(combined))) {
                return {
                    violated: true,
                    retryNote: 'Compare/contrast band: explain BOTH categories with passage terms from each side — do not cover only one.'
                };
            }
            return { violated: false };
        }
        const hasContrastLanguage = /\bcompar|\bcontrast|\bversus|\bvs\.|\btwo (primary|types|architectures)\b/i.test(source);
        if (!hasContrastLanguage) return { violated: false };
        const dualSideSignals = /\bwhile\b|\bwhereas\b|\bin contrast\b|\bon the other hand\b|\bmeanwhile\b/i.test(combined);
        if (!dualSideSignals) {
            return {
                violated: true,
                retryNote: 'Compare/contrast band: explain BOTH sides of the contrast with passage terms from each side.'
            };
        }
        return { violated: false };
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

    function parseExplainPeerWhiteboardContent(text) {
        const raw = String(text || '').trim();
        const empty = {
            setup: '', task: '', authorNote: '', misconception: '', evidenceUsed: '', takeaway: '', structured: false
        };
        if (!raw) return empty;

        const setupMatch = raw.match(/SETUP:\s*([\s\S]*?)(?=\n(?:STUDENT TASK:|TASK:|AUTHOR NOTE:)|$)/i);
        const taskMatch = raw.match(/(?:STUDENT TASK:|TASK:)\s*([\s\S]*?)(?=\n(?:AUTHOR NOTE:)|$)/i);
        const noteMatch = raw.match(/AUTHOR NOTE:\s*([\s\S]*?)$/i);
        const noteFields = parseSocraticAuthorNoteFields((noteMatch?.[1] || '').trim());
        const setup = (setupMatch?.[1] || '').trim();
        const task = (taskMatch?.[1] || '').trim();
        const structured = !!(setupMatch || taskMatch);

        return {
            setup,
            task,
            authorNote: (noteMatch?.[1] || '').trim(),
            misconception: noteFields.misconception,
            evidenceUsed: noteFields.evidenceUsed,
            takeaway: noteFields.takeaway,
            structured
        };
    }

    function parseExplainPeerEli5Content(text) {
        const raw = String(text || '').trim();
        const empty = {
            coreIdea: '', context: '', authorNote: '', misconception: '', evidenceUsed: '', takeaway: '', structured: false
        };
        if (!raw) return empty;

        const coreMatch = raw.match(/CORE IDEA:\s*([\s\S]*?)(?=\n(?:CONTEXT:|AUTHOR NOTE:)|$)/i);
        const contextMatch = raw.match(/CONTEXT:\s*([\s\S]*?)(?=\n(?:AUTHOR NOTE:)|$)/i);
        const noteMatch = raw.match(/AUTHOR NOTE:\s*([\s\S]*?)$/i);
        const noteFields = parseSocraticAuthorNoteFields((noteMatch?.[1] || '').trim());
        const coreIdea = (coreMatch?.[1] || '').trim();
        const context = (contextMatch?.[1] || '').trim();
        const structured = !!(coreMatch || contextMatch);

        return {
            coreIdea,
            context,
            authorNote: (noteMatch?.[1] || '').trim(),
            misconception: noteFields.misconception,
            evidenceUsed: noteFields.evidenceUsed,
            takeaway: noteFields.takeaway,
            structured
        };
    }

    function explainPeerWhiteboardViolates(parsed, content, ctx) {
        const drift = explainPeerFormatDriftViolates(content);
        if (drift.violated) return drift;

        if (!parsed?.setup?.trim() || !parsed?.task?.trim()) {
            return { violated: true, retryNote: 'Return SETUP: and STUDENT TASK: sections with non-empty text (see required structure).' };
        }

        const combined = `${parsed.setup} ${parsed.task}`;
        if (ctx?.sourceText?.trim() && !tokensOverlap(ctx.sourceText, combined, 2)) {
            return { violated: true, retryNote: 'Name at least two specific terms from the SOURCE PASSAGE in SETUP or STUDENT TASK.' };
        }

        if (ctx?.bandPromptProfile === 'process') {
            const lower = combined.toLowerCase();
            const analogyHeavy = /\b(like a|is like|imagine|fish|story|metaphor)\b/i.test(lower);
            const orderedTask = /\b(order|sequence|step|stage|whiteboard|draw|list|arrange)\b/i.test(lower);
            if (analogyHeavy && !orderedTask) {
                return {
                    violated: true,
                    retryNote: 'This is a step-order exercise — ask students to order stages or name evidence, not a standalone analogy.'
                };
            }
        }

        const reg = global.DreamBookScenarioRegistry;
        if (reg?.socraticExplainOwnWordsViolates?.(combined)) {
            const narrow = narrowSocraticHookViolates(combined);
            if (narrow.violated) return narrow;
        }

        return { violated: false };
    }

    function explainPeerEli5Violates(parsed, content, ctx) {
        const drift = explainPeerFormatDriftViolates(content);
        if (drift.violated) return drift;

        if (!parsed?.coreIdea?.trim() || !parsed?.context?.trim()) {
            return { violated: true, retryNote: 'Return CORE IDEA: and CONTEXT: sections with non-empty text (see required structure).' };
        }

        const combined = `${parsed.coreIdea} ${parsed.context}`;
        if (ctx?.sourceText?.trim() && !tokensOverlap(ctx.sourceText, combined, 2)) {
            return { violated: true, retryNote: 'Name at least two specific terms from the SOURCE PASSAGE in CORE IDEA or CONTEXT.' };
        }

        const reg = global.DreamBookScenarioRegistry;
        if (reg?.socraticExplainOwnWordsViolates?.(combined)) {
            const narrow = narrowSocraticHookViolates(combined);
            if (narrow.violated) return narrow;
        }

        return { violated: false };
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

    function socraticHookQualityViolates(hookText) {
        const hook = String(hookText || '').trim();
        if (!hook) return { violated: false };
        if (/\bsome students think\b/i.test(hook)) {
            return { violated: true, retryNote: 'Write in Sam\'s voice (first person), not "Some students think…"' };
        }
        if (/\b(is like a|are like a|is like an|are like an|like a rigid|like an?\b)/i.test(hook)) {
            return {
                violated: true,
                retryNote: 'State the belief literally without simile comparisons (e.g. "rigid and never remodels" not "like a rigid skeleton").'
            };
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
        const hookQuality = socraticHookQualityViolates(samSays);
        if (hookQuality.violated) return hookQuality;
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
        const hookQuality = socraticHookQualityViolates(hook);
        if (hookQuality.violated) return hookQuality;
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
                if (/\b(is like a|are like a|is like an|are like an)\b/i.test(hook)) {
                    return {
                        violated: true,
                        retryNote: 'State the belief literally without simile comparisons (e.g. "rigid and never remodels" not "like a rigid skeleton").'
                    };
                }
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
            if (!misconceptionChallengesQuestions(
                parsed.misconception,
                hook,
                questions[0] || '',
                questions[1] || '',
                parsed.evidenceUsed || ''
            )) {
                return { violated: true, retryNote: 'Questions must challenge the Misconception named in AUTHOR NOTE — tie Q1 or Q2 to that idea (plain language is fine).' };
            }
        }
        if (questions.some(q => q && !String(q).trim().endsWith('?'))) {
            return { violated: true, retryNote: 'Each numbered question must end with "?".' };
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
                const compareViolation = analogyCompareContrastViolates(ctx, parsed);
                if (compareViolation.violated) {
                    return { ok: false, retryNote: compareViolation.retryNote };
                }
                const authorViolation = analogyAuthorNoteViolates(ctx?.authorNote, parsed);
                if (authorViolation.violated) {
                    return { ok: false, retryNote: authorViolation.retryNote };
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
            if (formatId === 'whiteboard_steps') {
                const parsed = parseExplainPeerWhiteboardContent(content);
                if (openingRepeatsBrief(opening, parsed?.setup || '')) {
                    return { ok: false, retryNote: 'Return ONLY the STUDENT TASK line — do NOT repeat SETUP sentences.' };
                }
                const task = String(opening || '').trim();
                if (parsed?.structured && parsed?.task?.trim() && task !== parsed.task.trim()) {
                    return { ok: false, retryNote: 'Return ONLY the STUDENT TASK line verbatim from the content.' };
                }
            }
            if (formatId === 'explain_like_im_five') {
                const parsed = parseExplainPeerEli5Content(content);
                const ctxNorm = normalizeForCompare(parsed?.context || '');
                const openNorm = normalizeForCompare(opening || '');
                if (ctxNorm.length > 30 && openNorm.length > 20
                    && (ctxNorm.includes(openNorm) || openNorm.includes(ctxNorm.slice(0, 40)))) {
                    return { ok: false, retryNote: 'Return ONLY one question — do NOT repeat sentences from CONTEXT or reuse its comparison.' };
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
            if (formatId === 'whiteboard_steps') {
                const parsed = parseExplainPeerWhiteboardContent(content);
                const violation = explainPeerWhiteboardViolates(parsed, content, {
                    ...ctx,
                    sourceText: ctx?.sourceText || ctx?.displayPassage || ''
                });
                if (violation.violated) {
                    return { ok: false, retryNote: violation.retryNote };
                }
                if (!parsed.structured) {
                    return { ok: false, retryNote: 'Return SETUP: and STUDENT TASK: sections (see required structure).' };
                }
                return { ok: true };
            }
            if (formatId === 'explain_like_im_five') {
                const parsed = parseExplainPeerEli5Content(content);
                const violation = explainPeerEli5Violates(parsed, content, {
                    ...ctx,
                    sourceText: ctx?.sourceText || ctx?.displayPassage || ''
                });
                if (violation.violated) {
                    return { ok: false, retryNote: violation.retryNote };
                }
                if (!parsed.structured) {
                    return { ok: false, retryNote: 'Return CORE IDEA: and CONTEXT: sections (see required structure).' };
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
            const canonicalOpening = buildDebateQuestionLadder()[0];
            if (normalizeForCompare(task) !== normalizeForCompare(canonicalOpening)) {
                return { ok: false, retryNote: `Return ONLY this exact question verbatim: ${canonicalOpening}` };
            }
            if (opposingCompoundQuestionViolates(task)) {
                return { ok: false, retryNote: 'Return ONLY one question — not a compound list of evaluation steps.' };
            }
            return { ok: true };
        }

        if (moduleType === 'opposing-view' && phase === 'content') {
            const parsed = parseOpposingChallengeContent(content);
            const ccViolation = opposingClaimCounterViolates(parsed);
            if (ccViolation.violated) {
                return { ok: false, retryNote: ccViolation.retryNote };
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
            const qViolation = opposingQuestionsViolates(parsed.questions);
            if (qViolation.violated) {
                return { ok: false, retryNote: qViolation.retryNote };
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
        const hasAuthorNote = !!(ctx?.authorNote || '').trim();
        const promptCtx = { ...ctx, illustrateStyle: style, phase: 'content' };
        const contextBlock = buildWidgetContextBlock(promptCtx);
        const exerciseLine = buildWidgetExerciseLine('illustrate', style);
        const authorDirective = hasAuthorNote ? buildAuthorAnalogyDirective(ctx.authorNote, style) : '';
        const varietyBlock = buildWidgetVarietyBlock(promptCtx);
        const task = cfg.promptSuffix;
        return `${contextBlock}${exerciseLine ? `EXERCISE: ${exerciseLine}\n\n` : ''}TASK:\n${task}${authorDirective}${varietyBlock}\nSOURCE PASSAGE:\n${sourceText || ''}`;
    }

    function buildIllustrateNewsRewritePrompt(sourceText, ctx) {
        const cfg = global.DreamBookEnhancements?.ILLUSTRATE_STYLES?.news;
        const hasAuthorNote = !!(ctx?.authorNote || '').trim();
        const promptCtx = { ...ctx, illustrateStyle: 'news', phase: 'content' };
        const contextBlock = buildWidgetContextBlock(promptCtx);
        const exerciseLine = buildWidgetExerciseLine('illustrate', 'news');
        const authorDirective = hasAuthorNote ? buildAuthorAnalogyDirective(ctx.authorNote, 'news') : '';
        const varietyBlock = buildWidgetVarietyBlock({ ...promptCtx, skipVariety: false });
        const task = cfg?.promptSuffix || '';
        return `${contextBlock}${exerciseLine ? `EXERCISE: ${exerciseLine}\n\n` : ''}TASK:\n${task}${authorDirective}${varietyBlock}\nSOURCE PASSAGE:\n${sourceText || ''}`;
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

    function canCompleteFreeformWidget(record, type, actionId) {
        const policy = getWidgetChatPolicy(type, actionId);
        const count = record?.messageCount || 0;
        if (type === 'recall') return count >= policy.minTurnsRecall;
        return count >= policy.minTurns;
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
        buildAuthorAnalogyDirective,
        buildAuthorIntentFromNote,
        extractAuthorDomainKeywords,
        buildIllustrateNewsWebPrompt,
        outputUsesForeignDomain,
        validateWidgetOutput,
        parseOpposingChallengeContent,
        parseCaseStudyCachedContent,
        opposingParallelTaxonomyViolates,
        parseAnalogyIllustrationContent,
        parseNewsApplicationContent,
        newsApplicationViolates,
        buildIllustrateNewsRewritePrompt,
        parseSocraticStructuredContent,
        parseExplainPeerContent,
        parseExplainPeerWhiteboardContent,
        parseExplainPeerEli5Content,
        explainPeerViolates,
        explainPeerWhiteboardViolates,
        explainPeerEli5Violates,
        misconceptionChallengesQuestions,
        socraticCheckpointViolates,
        SOCRATIC_LADDER_LABELS,
        EXPLAIN_PEER_LADDER_LABELS,
        DEBATE_LADDER_LABELS,
        DEBATE_LADDER_STEP_COUNT,
        DEBATE_SOCRATIC_STEP_IDS,
        DEBATE_CANONICAL_PROMPTS,
        buildDebateRubricProfile,
        buildDebateStepSpec,
        parseDebateTurnEvaluation,
        buildDebateQuestionLadder,
        createDebateSocraticState,
        resetDebateSocraticStateForStep,
        updateDebateSocraticState,
        parseCoachStepEval,
        buildDebateCoachVisibleReply,
        evaluateDebateStepAnswer,
        mergeDebateStepEvaluations,
        isDebateLadderConcluded,
        getDebateStepFooterCopy,
        opposingClaimCounterViolates,
        opposingCompoundQuestionViolates,
        opposingQuestionsViolates,
        countAnalogyMappingLines,
        analogyTranslationMisconceptionViolates,
        analogyCompareContrastViolates,
        detectCompareContrastPairInSource,
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
        isLadderStepsConcluded,
        migrateStepConcludedFromLegacy,
        shouldConcludeLadderStep,
        COACH_STEP_DONE_TAG,
        parseCoachResponse,
        shouldUseDebateRubricMode,
        resolveDebateActiveStep,
        detectDebateRubricFromStudentTurn,
        buildDebateRubricCoachInstruction,
        buildDebateLadderCoachInstruction,
        buildSharedTutorPolicy,
        getWidgetChatPolicy,
        canCompleteFreeformWidget,
        buildLadderCoachInstruction,
        buildRecallCoachPrompt,
        isWidgetGateCleared,
        isReadingGateBlocking,
        buildRetryResetRecord
    };
})(typeof window !== 'undefined' ? window : globalThis);
