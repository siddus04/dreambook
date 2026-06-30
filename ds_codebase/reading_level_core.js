/**
 * Reading level prompts, validation, bounds, and temperature helpers.
 * Shared by editor.html, reading_level_lab.html, and reading_level_test.js.
 */
(function (global) {
    'use strict';

    const READING_LEVEL_STYLE_DISPLAY_LABELS = {
        termHelp: { plain: 'Define simply', picture: 'Everyday comparisons', visual: 'Vivid Analogies' },
        tone: { textbook: 'Standard textbook', friendly: 'Conversational', playful: 'Light & memorable' },
        length: { tight: 'Minimal', balanced: 'Balanced', roomy: 'More detail' }
    };

    const READING_LEVEL_PASSIVE_BANNED = [
        'is localized within',
        'is characterized by',
        'are distributed throughout',
        'typically includes',
        'are characterized by',
        'is comprised of'
    ];

    function getGradeLevel() {
        if (typeof global.appState !== 'undefined' && global.appState?.gradeLevel) {
            return global.appState.gradeLevel;
        }
        return 'Class 9-10';
    }

    function getJargonGradeBaselines(gradeLevel) {
        const level = (gradeLevel || getGradeLevel()).toLowerCase();
        if (/class\s*(6|7|8)|6-8|middle/.test(level)) {
            return 'cell, DNA, energy, plant, animal, bacteria, water, food, growth, organism';
        }
        if (/class\s*(9|10)|9-10/.test(level)) {
            return 'cell, nucleus, DNA, membrane, protein, energy, mitochondria, plant, animal, bacteria, enzyme, organism, gene';
        }
        if (/class\s*(11|12)|11-12/.test(level)) {
            return 'cell, DNA, RNA, protein, membrane, ATP, enzyme, nucleus, gene, organism, energy';
        }
        if (/grad|postgrad|graduate/.test(level)) {
            return 'cell, DNA, organism, energy, protein, gene';
        }
        return 'cell, DNA, organism, energy, protein, membrane, enzyme';
    }

    function getDefaultReadingLevelStyleOptions() {
        return { termHelp: 'plain', tone: 'textbook', length: 'tight' };
    }

    function normalizeReadingLevelStyleOptions(raw, level) {
        const defaults = getDefaultReadingLevelStyleOptions();
        const termHelp = ['plain', 'visual', 'picture'].includes(raw?.termHelp) ? raw.termHelp : defaults.termHelp;
        const tone = ['textbook', 'friendly', 'playful'].includes(raw?.tone) ? raw.tone : defaults.tone;
        let length = ['tight', 'balanced', 'roomy'].includes(raw?.length) ? raw.length : defaults.length;
        if (raw?.length === 'expansive') length = 'roomy';
        const normalized = { termHelp, tone, length };
        if (level === 'undergraduate') {
            if (normalized.termHelp === 'picture') normalized.termHelp = 'visual';
            if (normalized.tone === 'playful') normalized.tone = 'friendly';
        }
        return normalized;
    }

    function getReadingLevelStyleDisplayLabels() {
        return READING_LEVEL_STYLE_DISPLAY_LABELS;
    }

    function getReadingLevelTargetLabel(level) {
        const labels = {
            'elementary': 'Elementary (ages 8–10)',
            'high-school': 'High School (grades 9–10)',
            'advanced-high-school': 'Advanced High School / AP·IB (grades 11–12)',
            'undergraduate': 'Undergraduate college'
        };
        return labels[level] || labels['high-school'];
    }

    function getReadingLevelTemperature(styleOptions, level) {
        const opts = normalizeReadingLevelStyleOptions(styleOptions || getDefaultReadingLevelStyleOptions(), level);
        if (opts.tone === 'playful') return 0.65;
        if (opts.tone === 'friendly') return 0.5;
        return 0.2;
    }

    function getReadingLevelSimplifyGradeAddon() {
        const grade = getGradeLevel();
        return `Book audience: ${grade}. Rewrite for easier reading at the chosen level while preserving technical accuracy and every fact.`;
    }

    function getReadingLevelFrictionPhraseRules() {
        return `
FRICTION PHRASE SIMPLIFICATION:
- "include the domains X and Y" → "include two major groups: **X** and **Y**" or split into two sentences; gloss "domain" once only at AP/IB level if needed.
- "membrane-bound [noun]" (first use) → "[noun] surrounded by a membrane" or "sealed inside membranes"; reuse **membrane-bound** later if exam vocabulary requires it.
- "characterized by the absence of" → "do not have" or "lack".
- "localized within" → "sit in" or "gather in".
- Do not repeat "membrane-bound" twice in one sentence — split or unpack once.`;
    }

    function extractReadingLevelFrictionPhraseCandidates(sourceText) {
        const text = String(sourceText || '').toLowerCase();
        if (!text.trim()) return [];
        const patterns = [
            { key: 'include the domains', re: /\binclude\s+the\s+domains\b/ },
            { key: 'membrane-bound', re: /\bmembrane-bound\b/ },
            { key: 'characterized by the absence', re: /\bcharacterized\s+by\s+the\s+absence\b/ },
            { key: 'localized within', re: /\blocalized\s+within\b/ }
        ];
        return patterns.filter(p => p.re.test(text)).map(p => p.key).slice(0, 3);
    }

    function readingLevelHasStackedFrictionPhrases(text) {
        const t = String(text || '').toLowerCase();
        if (/\binclude\s+the\s+domains\b/.test(t)) return true;
        if (/\bcharacterized\s+by\s+the\s+absence\b/.test(t)) return true;
        if (/\bmembrane-bound\b[^.!?]{0,120}\bmembrane-bound\b/.test(t)) return true;
        return false;
    }

    function formatReadingLevelFrictionPromptBlock(frictionPhrases) {
        if (!frictionPhrases?.length) return '';
        return `\n\nFriction phrases to unpack in this passage:\n${frictionPhrases.join('; ')}\n${getReadingLevelFrictionPhraseRules()}`;
    }

    function getCommandOpenerQuotaThreshold() {
        return 0.2;
    }

    function getPlayfulGradeWitGuardrails() {
        const grade = (getGradeLevel() || '').toLowerCase();
        if (/class\s*(6|7|8)|6-8|middle|elementary/.test(grade)) {
            return '- WIT GRADE GUARD: Mild wit only — no violent, graphic, or scary framing (no "violently slamming", "executioner", "toxic waste disaster").';
        }
        if (/class\s*(11|12)|11-12|\bap\b|\bib\b|grad|postgrad|undergrad/.test(grade)) {
            return '- WIT GRADE GUARD: Dry, understated humor and accurate failure-mode color are OK when factually grounded.';
        }
        return '- WIT GRADE GUARD: Moderate dry wit OK (e.g. selective gates, crowded rooms); tone down disease/tumor cynicism unless the source requires it.';
    }

    function getReadingLevelSimplifyDepthRules(level) {
        const common = `
READABILITY TECHNIQUES:
- Split long or multi-clause sentences; aim for one main idea per sentence (roughly under 20 words when possible).
- Prefer common everyday words over formal alternatives (use not utilize, show not demonstrate, help not facilitate) when the meaning stays the same.
- Replace dense noun phrases with simpler subject-verb wording where possible.
- Use active voice when it makes the meaning clearer.
- Make cause-effect and compare-contrast links explicit with plain connectors (because, so, but, unlike).`;

        const frictionBlock = readingLevelRequiresClarifiers(level) ? getReadingLevelFrictionPhraseRules() : '';

        const byLevel = {
            'elementary': `
AUDIENCE DEPTH: Write for ages 8–10. Very short sentences. Plain words first; explain essential science terms briefly inline.`,
            'high-school': `
AUDIENCE DEPTH: Make the passage noticeably easier to read than the source — shorter sentences, simpler wording, same facts. Keep scientific terms; add brief inline clarifiers when needed.`,
            'advanced-high-school': `
AUDIENCE DEPTH: Keep precise disciplinary vocabulary, but reduce sentence density and make relationships between ideas explicit.`,
            'undergraduate': `
AUDIENCE DEPTH: Tighten prose and remove awkward complexity; preserve technical density — do not dumb down.`
        };
        return common + frictionBlock + (byLevel[level] || byLevel['high-school']);
    }

    function getBaseLengthHintMap(level) {
        const byLevel = {
            'elementary': { tight: { min: 0.85, max: 1.20 }, balanced: { min: 0.85, max: 1.35 }, roomy: { min: 0.85, max: 1.50 } },
            'high-school': { tight: { min: 0.85, max: 1.20 }, balanced: { min: 0.85, max: 1.35 }, roomy: { min: 0.85, max: 1.50 } },
            'advanced-high-school': { tight: { min: 0.88, max: 1.15 }, balanced: { min: 0.88, max: 1.25 }, roomy: { min: 0.88, max: 1.35 } },
            'undergraduate': { tight: { min: 0.85, max: 1.05 }, balanced: { min: 0.85, max: 1.10 }, roomy: { min: 0.85, max: 1.15 } }
        };
        return byLevel[level] || byLevel['high-school'];
    }

    function getReadingLevelVisualLengthBump(tier) {
        if (tier === 'tight') return 0.15;
        if (tier === 'roomy' || tier === 'balanced') return 0.25;
        return 0.15;
    }

    function getReadingLevelWordCountBounds(level, styleOptions) {
        const opts = normalizeReadingLevelStyleOptions(styleOptions || getDefaultReadingLevelStyleOptions(), level);
        const tier = opts.length;
        const levelMap = getBaseLengthHintMap(level);
        const bounds = { ...(levelMap[tier] || levelMap.tight) };
        if (opts.termHelp === 'visual') {
            bounds.max = Math.round((bounds.max + getReadingLevelVisualLengthBump(tier)) * 100) / 100;
        }
        return bounds;
    }

    function getReadingLevelValidationBounds(level, styleOptions, blockOptions = {}) {
        const bounds = { ...getReadingLevelWordCountBounds(level, styleOptions) };
        if (blockOptions.isTheoryListItem) {
            bounds.max = Math.min(bounds.max, 1.30);
        } else if (blockOptions.isListItem) {
            bounds.max = Math.min(bounds.max, 1.45);
        }
        return bounds;
    }

    function readingLevelCountSentences(text) {
        return String(text || '')
            .split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => s.length > 4)
            .length;
    }

    function getReadingLevelLengthTargetHint(level, styleOptions) {
        const opts = normalizeReadingLevelStyleOptions(styleOptions || getDefaultReadingLevelStyleOptions(), level);
        const tier = opts.length;
        const levelMap = getBaseLengthHintMap(level);
        const bounds = levelMap[tier] || levelMap.tight;
        let visualBounds = bounds;
        if (opts.termHelp === 'visual') {
            visualBounds = { ...bounds, max: Math.round((bounds.max + getReadingLevelVisualLengthBump(tier)) * 100) / 100 };
        }
        const pct = (n) => `${Math.round(n * 100)}%`;
        const minPct = pct(visualBounds.min);
        const maxPct = pct(visualBounds.max);
        return `${minPct}–${maxPct}`;
    }

    function getFriendlyToneRules() {
        return `
TONE (Friendly / Conversational):
- Write as an enthusiastic peer tutor explaining to a curious student.
- Use second person ("you", "your") at least once in multi-sentence passages.
- Prefer active verbs and direct phrasing.
- Do NOT use passive textbook phrasing such as: "is localized within", "is characterized by", "are distributed throughout", "typically includes".
- Stay accurate — warmth must not sacrifice facts.`;
    }

    function getPlayfulToneRules() {
        return `
TONE (Light & memorable):
- Write as a warm, slightly witty tutor — vivid and memorable, never silly or inaccurate.
- Use second person ("you", "your") at least once in multi-sentence passages.
- Include at least one light, accurate memorable or witty phrase per multi-sentence paragraph (e.g. "hungry host cells", "slipping past immune guards", "overworked power plant") — humor lives inside the metaphor or phrasing, not as stand-up jokes.
- Add dry, understated wit from system messiness when accurate (selective gates, leaks, crowding, backup plans) — not cheerleading or stand-up comedy.
- When biologically accurate, include one failure-mode color per paragraph: what goes wrong if the structure fails (e.g. capsule helps evade capture; lysosome leak would digest the cell).
- Do NOT use motivational filler: no "Great!", "Exciting!", "Let's explore", or corporate AI enthusiasm.
- Vivid wording alone is not enough; add one humanizing or slightly witty phrase when it aids recall.
- When using paragraph analogies, weave witty detail into the sustained theme — not a separate joke paragraph.
- Do NOT use passive textbook phrasing such as: "is localized within", "is characterized by", "are distributed throughout", "typically includes".
- Never sacrifice facts or clarity for a joke.
${getPlayfulGradeWitGuardrails()}`;
    }

    function getReadingLevelVisualGoldFewShot() {
        return `
GOLD STANDARD EXAMPLE (emulate this rhythm, theme cohesion, bold study terms, and mnemonic hooks):

Source: "Prokaryotes, including domains Bacteria and Archaea, are characterized by the absence of a membrane-bound nucleus and membrane-bound organelles. Their genetic material is localized within an irregularly shaped region called the nucleoid. Prokaryotes often contain extrachromosomal DNA in plasmids. The cellular envelope typically includes a plasma membrane, a rigid peptidoglycan cell wall, and sometimes an external polysaccharide capsule to evade host phagocytosis. Prokaryotic ribosomes are 70S in type and are distributed throughout the cytoplasm."

Target: "Prokaryotes include **Bacteria** and **Archaea**. These cells do not have a **nucleus** or **organelles** surrounded by membranes. Instead, their genetic material is clustered in an irregularly shaped region called the **nucleoid**—functioning like an open-plan central command center where DNA gathers without interior walls. They also carry extra bits of DNA in **plasmids**, which serve as small, detached backup drives for emergency instructions.

The prokaryotic cell envelope acts as a sophisticated, multi-layered security fortress. It starts with the **plasma membrane**, serving as the internal checkpoint gate; moves outward to a rigid **peptidoglycan cell wall** *(think: **P**rotective **G**rid)*, which forms a sturdy structural barrier; and is sometimes wrapped in an outer **polysaccharide capsule** *(think: **P**oly-sugar **C**loak)* that helps them slip past hungry host cells. Finally, their protein-building factories, the **70S ribosomes**, are spread throughout the cytoplasm like automated assembly bots deployed across the main factory floor."`;
    }

    function getReadingLevelVisualTermHelpRules() {
        return `
TERM HELP (Vivid Analogies / Visual):
- Choose ONE cohesive metaphor theme for the whole paragraph (security fortress, shipping port, corporate office, power plant, or everyday physical structures).
- RHYTHM: Never hide academic terms behind pure metaphor. State the technical term and its textbook function first, then attach the metaphor inline — science first, picture second.
- Use varied embedded connectors: "which you can picture as", "functions like", "acts as", "serving as", "much like", "according to …".
- OPENER VARIETY: Use command openers ("Imagine…", "Think of…", "Picture…") in at most ~20% of paragraphs in a chapter — never in consecutive paragraphs. Prefer factual leads, action verbs, or the bolded term itself.
- Map every flagged hard term through the SAME theme; state each term factually before mapping it to the theme.
- Do not jump themes mid-paragraph (NOT office desk + flash drive + ninja + factory in one paragraph).
- Do not rely on dry parenthetical definitions (e.g. NOT "peptidoglycan (a sugar-protein complex)" as the main help).
- MEMORY HOOKS: For dense multi-syllable jargon, add a parenthetical acronym mnemonic right after the official term: *(think: **P**rotective **G**rid)* for peptidoglycan, *(think: **P**oly-sugar **C**loak)* for polysaccharide. Bold the mnemonic letters inside the hook. Hooks aid recall — never replace the scientific term.
- BOLD STUDY TERMS: Wrap core scientific terms in **bold markdown** on first use in each paragraph (e.g. **nucleoid**, **peptidoglycan cell wall**), even when the source did not bold them.
- Still return plain prose in the same paragraph count — not a separate analogy block or quoted essay.
- Glossary list items (**Term:**) keep label-first format; one brief metaphorical phrase after the colon only.

GOOD pattern (DO): "The cell envelope works like a fortress: the **plasma membrane** is the checkpoint gate, the **peptidoglycan cell wall** *(think: **P**rotective **G**rid)* is the brick fence, and the **polysaccharide capsule** *(think: **P**oly-sugar **C**loak)* acts as a stealthy outer cloak so hungry immune cells slide past."

BAD pattern (DON'T): "The nucleoid is like an office desk, plasmids are flash drives, the wall is brick, the capsule is a ninja, and ribosomes are factory workers."${getReadingLevelVisualGoldFewShot()}`;
    }

    function getReadingLevelEngagementRules(styleOptions, level, engagementOptions = {}) {
        const opts = normalizeReadingLevelStyleOptions(styleOptions || getDefaultReadingLevelStyleOptions(), level);
        if (engagementOptions.isTheoryListItem) {
            return getReadingLevelTheoryListEngagementRules(opts);
        }
        let rules = '';

        if (opts.termHelp === 'plain') {
            rules += `
TERM HELP (Plain):
- Use appositives, parenthetical glosses, or plain-language replacements for hard terms.
- Do not add comparison analogies or extended metaphors.
- Do not open with command openers ("Imagine…", "Think of…").`;
        } else if (opts.termHelp === 'picture') {
            rules += `
TERM HELP (Everyday comparisons):
- For each flagged hard term, map it to one physical object with "like a [X]" or "like [X]" in the same clause.
- Max ~8 words per mapping; keep sentences tight and punchy.
- Do NOT use a paragraph-level metaphor theme — one inline word-picture per hard term only.
- Do not open paragraphs with command openers ("Imagine…", "Think of…").
- Glossary list items (**Term:**) keep label-first format; one brief "like …" phrase after the colon only.`;
        } else {
            rules += getReadingLevelVisualTermHelpRules();
        }

        if (opts.tone === 'textbook') {
            rules += `
TONE (Textbook): Neutral, accurate, student-facing textbook voice.`;
        } else if (opts.tone === 'friendly') {
            rules += getFriendlyToneRules();
        } else {
            rules += getPlayfulToneRules();
        }

        return rules;
    }

    function getReadingLevelTheoryListEngagementRules(opts) {
        let rules = `
TERM HELP (Principle / theory bullet — keep tight):
- ONE sentence only (two at most when the source includes a Latin phrase, date, or name that needs a brief inline gloss).
- Simpler words and shorter phrasing; preserve every claim from the source.
- Do NOT unpack comma- or "and"-linked ideas into separate sentences or separate metaphors (NOT structure → brick, function → factory, organization → team).
- Do NOT add teaching paragraphs, stacked analogies, acronym memory hooks, or failure-mode asides.`;
        if (opts.termHelp === 'visual') {
            rules += '\n- At most ONE brief inline metaphor (~15 words) in the same sentence — never a sustained paragraph theme.';
        } else if (opts.termHelp === 'picture') {
            rules += '\n- At most one brief "like …" phrase (~8 words) in the same sentence.';
        } else {
            rules += '\n- Plain appositive or parenthetical gloss only; no analogies.';
        }
        if (opts.tone === 'playful') {
            rules += '\n- Light touch only: one mild witty phrase OK if it fits in the same sentence — no cheerleading, no multi-sentence humor.';
        } else if (opts.tone === 'friendly') {
            rules += '\n- Warm but brief; second person optional in one short sentence.';
        } else {
            rules += '\n- Neutral textbook voice; stay compact.';
        }
        return rules;
    }

    function getReadingLevelOutputRules(styleOptions) {
        const opts = normalizeReadingLevelStyleOptions(styleOptions || getDefaultReadingLevelStyleOptions());
        let clarifierFormats = '- Inline clarifiers must use appositives ("term, short phrase,"), parenthetical glosses, or plain-language replacements — not long new paragraphs.';
        if (opts.termHelp === 'picture') {
            clarifierFormats = '- Use immediate "like a …" or "like …" word-pictures next to each hard term; keep the same paragraph structure.';
        } else if (opts.termHelp === 'visual') {
            clarifierFormats = '- State each flagged term factually first, then map it inside ONE sustained metaphor theme using embedded connectors ("which you can picture as", "acts as", "serving as"); wrap flagged study terms in **bold** on first use; add acronym memory hooks *(think: **L**etter **H**ints)* after dense jargon. Avoid dry parenthetical definitions as the primary strategy.';
        }
        return `
OUTPUT FORMAT:
- Return plain rewritten prose only — ready to insert directly into the textbook.
- Do NOT wrap the output in quotation marks (no leading or trailing " or ').
- Do not echo prompt labels, XML tags, or delimiters from the source block.
- Preserve **bold** markdown on key terms from the source (especially list labels like **Evidence:** and **Rough ER:**).
${opts.termHelp === 'visual' ? '- Bold core scientific terms on first use in body paragraphs (**term**), even if the source did not bold them.\n' : ''}- Only use quotation marks inside the text when the source quoted speech or a specific term verbatim.
${clarifierFormats}`;
    }

    function getReadingLevelAnalogyGlobalRule(styleOptions) {
        const opts = normalizeReadingLevelStyleOptions(styleOptions || getDefaultReadingLevelStyleOptions());
        if (opts.termHelp === 'plain') {
            return '- Preserve technical terms; add short inline clarifiers only when needed. Do not add long explanations, analogies, or pedagogical padding.';
        }
        if (opts.termHelp === 'picture') {
            return '- Preserve technical terms; add ultra-brief inline "like a …" word-pictures per hard term. Do not use a sustained paragraph metaphor theme.';
        }
        return '- Preserve technical terms; reframe the paragraph with ONE sustained metaphor theme mapping multiple hard terms. Lead with science, then embed the metaphor inline. Do not add extra paragraphs or standalone analogy blocks.';
    }

    function getReadingLevelListItemRules(styleOptions) {
        const opts = normalizeReadingLevelStyleOptions(styleOptions || getDefaultReadingLevelStyleOptions());
        let analogyNote = ' Do not add comparison analogies (like a factory, like tubes).';
        if (opts.termHelp === 'picture') {
            analogyNote = ' One brief "like …" word-picture after the label is OK.';
        } else if (opts.termHelp === 'visual') {
            analogyNote = ' One brief metaphorical phrase after the label is OK; no full analogy paragraph.';
        }
        return `
LIST ITEM RULES (when the source is a bullet or numbered list item):
- Keep the format **Term:** short definition (about 8–20 words after the colon when possible).
- Do NOT rewrite as "The [term] is…" — keep the bold label first, then a concise phrase.
- One sentence maximum after the label.${analogyNote}`;
    }

    function getReadingLevelTheoryListRules(styleOptions) {
        const opts = normalizeReadingLevelStyleOptions(styleOptions || getDefaultReadingLevelStyleOptions());
        let extra = '';
        if (opts.termHelp === 'picture') {
            extra = ' You may use one brief "like …" word-picture in the same sentence when it aids understanding.';
        } else if (opts.termHelp === 'visual') {
            extra = ' You may use one brief metaphorical image in the same sentence when it aids understanding.';
        }
        return `
LIST ITEM RULES (theory, history, or principle bullets — not a glossary):
- Rewrite as ONE complete grammatical sentence per bullet (two only if glossing a Latin phrase or date inline).
- Do not strip the subject or main verb. Keep named people, dates, and Latin phrases.
- Preserve the core claim; use simpler vocabulary and shorter phrasing.
- Do NOT unpack enumerated ideas (e.g. "structure, function, and organization") into separate sentences or metaphors — keep them in one claim.${extra}`;
    }

    function isReadingLevelGlossaryListItem(text) {
        const t = (text || '').trim();
        return /\*\*[^*]+:\*\*/.test(t) || /^[A-Z][^:]{0,48}:\s/.test(t);
    }

    function isReadingLevelTheoryListItem(text, isListItem) {
        return isListItem === true && !isReadingLevelGlossaryListItem(text);
    }

    function getReadingLevelParagraphRules(styleOptions) {
        const opts = normalizeReadingLevelStyleOptions(styleOptions || getDefaultReadingLevelStyleOptions());
        let analogyRule = '- Add brief inline clarifiers for essential difficult terms only when needed; do not pad with analogies.';
        if (opts.termHelp === 'picture') {
            analogyRule = '- Add tight inline "like a …" word-pictures for essential difficult terms; keep sentences punchy.';
        } else if (opts.termHelp === 'visual') {
            analogyRule = '- Reframe with one sustained metaphor theme using science-first rhythm: state the biology, then attach the picture inline with varied connectors — not command openers every time.';
        }
        return `
PARAGRAPH RULES (when the source is a body paragraph):
- Use complete grammatical sentences only; never drop subjects, verbs, or essential prepositions.
- Prefer shorter sentences and clearer transitions; a modest length increase is fine when it improves clarity.
- Split sentences that pack multiple ideas; keep one main idea per sentence when possible.
- Prefer plain verbs and concrete wording over abstract or formal phrasing.
- If the source uses **Term:** definition, preserve that bold-label-first pattern.
${analogyRule}`;
    }

    function getReadingLevelListContextRules(text, isListItem, styleOptions) {
        if (!isListItem) return getReadingLevelParagraphRules(styleOptions);
        return isReadingLevelGlossaryListItem(text)
            ? getReadingLevelListItemRules(styleOptions)
            : getReadingLevelTheoryListRules(styleOptions);
    }

    function getReadingLevelExerciseRules() {
        return `
EXERCISE / QUESTION RULES:
- Never answer homework, review, or exercise prompts.
- If the text asks the student to define, explain, compare, describe, or analyze, keep it as a question or instruction for the student.
- You may simplify wording of the prompt, but NEVER supply the answer, definition, or solution.`;
    }

    function getReadingLevelLevelTarget(level, styleOptions) {
        const lengthHint = getReadingLevelLengthTargetHint(level, styleOptions);
        const targets = {
            'elementary': `Elementary (ages 8–10): short sentences and familiar words; keep key scientific terms with brief inline explanations; avoid dense noun phrases; target ${lengthHint} of original length.`,
            'high-school': `High school (grades 9–10): noticeably easier to read than the source — shorter sentences, simpler words, same facts; brief inline clarifiers for difficult terms; split long sentences; explicit cause-effect; target ${lengthHint} of original length.`,
            'advanced-high-school': `Advanced high school / AP·IB (grades 11–12): keep precise disciplinary vocabulary; reduce sentence density; brief clarifiers for high-friction terms; do not oversimplify; target ${lengthHint} of original length.`,
            'undergraduate': `Undergraduate: precise academic prose; tighten grammar and flow; preserve technical density; no pedagogical padding; target ${lengthHint} of original length.`
        };
        return targets[level] || targets['high-school'];
    }

    function getReadingLevelPromptForLevel(level, options = {}) {
        const isListItem = options.isListItem === true;
        const sourceText = options.sourceText || '';
        const isTheoryListItem = isReadingLevelTheoryListItem(sourceText, isListItem);
        const styleOptions = normalizeReadingLevelStyleOptions(options.styleOptions, level);
        const structureRules = getReadingLevelListContextRules(sourceText, isListItem, styleOptions);
        const exerciseRules = getReadingLevelExerciseRules();
        const outputRules = getReadingLevelOutputRules(styleOptions);
        const depthRules = getReadingLevelSimplifyDepthRules(level);
        const engagementRules = getReadingLevelEngagementRules(styleOptions, level, { isTheoryListItem });
        const lengthHint = isTheoryListItem
            ? '85%–130%'
            : getReadingLevelLengthTargetHint(level, styleOptions);

        const prompts = {
            'elementary': `Target: elementary readers (ages 8–10). Use short sentences and familiar words. Keep key scientific terms, but explain them briefly in-line. Avoid dense noun phrases. Keep facts unchanged. Do not add extra examples unless needed for basic understanding. Target ${lengthHint} of original length.${depthRules}${engagementRules}${structureRules}${exerciseRules}${outputRules} Return ONLY the rewritten plain text.`,
            'high-school': `Target: high school (grades 9–10). Make the passage noticeably easier to read: shorter sentences, simpler everyday words, same facts. Preserve scientific terms but add brief inline clarifiers for difficult terms. Split long sentences. Make cause-effect and compare-contrast relationships explicit. Target ${lengthHint} of original length.${depthRules}${engagementRules}${structureRules}${exerciseRules}${outputRules} Return ONLY the rewritten plain text.`,
            'advanced-high-school': `Target: advanced high school / AP·IB (grades 11–12). Keep precise disciplinary vocabulary. Reduce sentence density and clarify relationships between concepts. Use brief inline clarifiers for high-friction terms (e.g. nucleoid, plasmid, peptidoglycan, cytosol, rough ER). Do not oversimplify. Target ${lengthHint} of original length.${depthRules}${engagementRules}${structureRules}${exerciseRules}${outputRules} Return ONLY the rewritten plain text.`,
            'undergraduate': `Target: undergraduate college readers. Use precise academic prose. Tighten grammar and flow. Preserve technical density, but remove awkward phrasing and unnecessary complexity. Do not add pedagogical padding. Target ${lengthHint} of original length.${depthRules}${engagementRules}${structureRules}${exerciseRules}${outputRules} Return ONLY the rewritten plain text.`,
        };
        return prompts[level] || prompts['high-school'];
    }

    function getReadingLevelSimplifySystemPrompt(options = {}) {
        const level = options.level || 'high-school';
        const styleOptions = normalizeReadingLevelStyleOptions(options.styleOptions, level);
        const isTheoryListItem = options.isTheoryListItem === true;
        const gradeAddon = getReadingLevelSimplifyGradeAddon();
        const depthRules = getReadingLevelSimplifyDepthRules(level);
        const engagementRules = getReadingLevelEngagementRules(styleOptions, level, { isTheoryListItem });
        const analogyGlobal = isTheoryListItem
            ? '- Preserve the principle in compact form. Do not pad with analogies or pedagogical elaboration.'
            : getReadingLevelAnalogyGlobalRule(styleOptions);
        const structureNote = isTheoryListItem
            ? '- This is a principle/theory bullet — keep ONE tight sentence; do not expand into a paragraph or unpack each enumerated idea separately.'
            : (styleOptions.termHelp === 'visual'
                ? '- Prefer structural rewrite and sustained metaphor over sentence-by-sentence synonym swaps. Preserve every fact from the source — do not stop after the first metaphor block.'
                : '- Prefer sentence splitting, clearer transitions, and inline clarifiers over adding new paragraphs.');
        return `You are an expert textbook author rewriting textbook prose for clarity and readability.

${gradeAddon}
${depthRules}
${engagementRules}

Global rules:
- Return ONLY the rewritten plain text for the passage given — no headings, section labels, markdown fences, commentary, or quotation marks around the whole output.
- Improve readability (clearer sentences, lower cognitive load) and understandability (brief local clarifiers when essential).
- The rewrite should read noticeably simpler than the source for the target audience, not a light synonym swap.
- Every sentence must be grammatically complete. Never delete words in a way that breaks grammar.
- Preserve all facts, dates, names, equations, terminology, examples, and exercise prompts from the source.
${analogyGlobal}
${structureNote}
- Never answer questions posed to students (Define…, Explain…, Compare…). Rephrase the prompt only if clarifying an exercise question.
- Never turn an exercise or review prompt into an answer or explanatory paragraph.
- Keep each block as a single unit with no blank lines.`;
    }

    function buildReadingLevelChapterSystemPrompt(level, styleOptions, gradeLevel, gradeContext) {
        const opts = normalizeReadingLevelStyleOptions(styleOptions || getDefaultReadingLevelStyleOptions(), level);
        const levelLabel = getReadingLevelTargetLabel(level);
        const levelTarget = getReadingLevelLevelTarget(level, opts);
        const engagementRules = getReadingLevelEngagementRules(opts, level);
        const gl = gradeLevel || getGradeLevel();
        const gc = gradeContext || (typeof global.getGradeContext === 'function' ? global.getGradeContext(gl) : '');
        let analogyImportant = '- Do not add long explanations, analogies, or pedagogical padding.';
        let structureNote = '- Prefer sentence splitting, clearer transitions, and inline clarifiers over adding new paragraphs.';
        if (opts.termHelp === 'picture') {
            analogyImportant = '- Inline "like a …" word-pictures per hard term are OK; do not use sustained paragraph metaphors.';
        } else if (opts.termHelp === 'visual') {
            analogyImportant = '- One sustained metaphor theme per prose paragraph is OK when it aids understanding; do not add standalone analogy blocks.';
            structureNote = '- Rewrite each prose paragraph with the same paragraph-level rules as single-paragraph simplify (sustained metaphor, bold study terms, memory hooks). Preserve every fact — do not truncate or stop after the first metaphor block.';
        }
        return `You are an expert textbook author rewriting a chapter for ${gl} students. ${gc}

Rewrite the chapter to improve:
1. readability: shorter sentences, simpler wording, lower cognitive load
2. understandability: brief local clarification of difficult concepts

Target reading level: ${levelLabel}.
${levelTarget}
${getReadingLevelSimplifyDepthRules(level)}
${engagementRules}

Preserve:
- all headings
- markdown structure
- lists, tables, blockquotes
- placeholders like <!-- PRESERVE_BLOCK_N -->
- facts, dates, names, equations, terminology, examples, and exercise prompts

Do not answer exercises or change their intent.

Only rewrite prose in paragraphs and list items.

Important:
- Preserve technical terms, but make them understandable.
- Add short inline clarifiers for essential difficult terms when required.
${analogyImportant}
- Do not repeat the same inline clarification more than once per section.
- If a term is already plain in the source, do not define it again.
${structureNote}

STRICT RULES:
- Return the COMPLETE chapter — do not omit any section, heading, list, table, blockquote, or <!-- PRESERVE_BLOCK_N --> placeholder.
- Preserve markdown structure exactly: heading levels (# ## ###), lists, blockquotes (> ), tables, and preserve-block comments unchanged in position.
- Do not merge or delete sections.
- Remove unnecessary blank lines but keep one blank line between blocks.
${getReadingLevelListItemRules(opts)}
${getReadingLevelTheoryListRules(opts)}
${getReadingLevelExerciseRules()}
${getReadingLevelOutputRules(opts)}

Return the complete rewritten chapter in markdown.`;
    }

    function sanitizeReadingLevelOutput(text) {
        if (!text?.trim()) return text;
        let s = text.trim();
        s = s.replace(/^```(?:\w+)?\s*/i, '').replace(/\s*```$/i, '').trim();
        const wrapPairs = [
            ['"', '"'],
            ["'", "'"],
            ['\u201c', '\u201d'],
            ['\u2018', '\u2019'],
        ];
        let changed = true;
        while (changed && s.length > 1) {
            changed = false;
            for (const [open, close] of wrapPairs) {
                if (s.startsWith(open) && s.endsWith(close)) {
                    s = s.slice(open.length, s.length - close.length).trim();
                    changed = true;
                }
            }
        }
        return s;
    }

    function readingLevelWordCount(text) {
        return String(text || '').trim().split(/\s+/).filter(Boolean).length;
    }

    function readingLevelLevenshtein(a, b) {
        const s = String(a || '').toLowerCase();
        const t = String(b || '').toLowerCase();
        if (s === t) return 0;
        const m = s.length;
        const n = t.length;
        if (!m) return n;
        if (!n) return m;
        const dp = Array.from({ length: m + 1 }, (_, i) => [i]);
        for (let j = 1; j <= n; j++) dp[0][j] = j;
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                const cost = s[i - 1] === t[j - 1] ? 0 : 1;
                dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
            }
        }
        return dp[m][n];
    }

    function extractReadingLevelProtectedTerms(text) {
        const t = String(text || '');
        const terms = new Set();
        (t.match(/\b(1[0-9]{3}|20[0-9]{2})\b/g) || []).forEach(y => terms.add(y));
        (t.match(/\b\d{1,2}(?:st|nd|rd|th)\s+century\b/gi) || []).forEach(c => terms.add(c.trim()));
        (t.match(/\([^)]*[a-z]{3,}[^)]*\)/gi) || []).forEach(p => {
            const inner = p.slice(1, -1).trim();
            if (inner.length >= 4 && /[a-z]/i.test(inner)) terms.add(inner);
        });
        (t.match(/[""][^""]{2,40}[""]/g) || []).forEach(q => terms.add(q.replace(/^[""]|[""]$/g, '').trim()));
        const nameRe = /\b(?:[A-Z][a-z]+(?:\s+(?:van\s+|de\s+|von\s+)?[A-Z][a-z]+)+|[A-Z][a-z]{2,})\b/g;
        let match;
        while ((match = nameRe.exec(t)) !== null) {
            const name = match[0].trim();
            if (/^(The|This|All|Later|However|Modern|Cell|In)$/i.test(name)) continue;
            if (name.length >= 4) terms.add(name);
        }
        return Array.from(terms);
    }

    function readingLevelTermMatchesSimplified(term, simplifiedLower) {
        const needle = String(term || '').trim();
        if (!needle) return true;
        const lower = simplifiedLower || '';
        if (lower.includes(needle.toLowerCase())) return true;
        const parts = needle.toLowerCase().split(/\s+/).filter(p => p.length >= 4);
        if (!parts.length) return lower.includes(needle.toLowerCase().slice(0, 4));
        const words = lower.split(/\s+/).map(w => w.replace(/[^a-z0-9]/gi, ''));
        return parts.every(part => words.some(w => (
            w.includes(part) || readingLevelLevenshtein(w, part) <= 1
        )));
    }

    function readingLevelRequiresClarifiers(level) {
        return level !== 'undergraduate';
    }

    function readingLevelEscapeRegExp(text) {
        return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function readingLevelTextHash(text) {
        return `${String(text || '').slice(0, 200)}|${readingLevelWordCount(text)}`;
    }

    function readingLevelGetContentWords(text) {
        const stop = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'is', 'are', 'was', 'were',
            'be', 'been', 'being', 'that', 'this', 'these', 'those', 'with', 'from', 'by', 'as', 'it', 'its',
            'they', 'their', 'them', 'which', 'who', 'whom', 'when', 'where', 'has', 'have', 'had', 'not', 'can',
            'may', 'will', 'would', 'could', 'should', 'also', 'into', 'such', 'than', 'then', 'there', 'here',
            'about', 'over', 'under', 'between', 'through', 'during', 'before', 'after', 'while', 'both', 'each',
            'other', 'some', 'any', 'all', 'most', 'more', 'very', 'much', 'many', 'one', 'two', 'three'
        ]);
        return String(text || '').toLowerCase()
            .split(/\s+/)
            .map(w => w.replace(/[^a-z0-9]/gi, ''))
            .filter(w => w.length >= 3 && !stop.has(w));
    }

    function readingLevelTokenOverlapRatio(source, simplified) {
        const srcWords = new Set(readingLevelGetContentWords(source));
        const simpWords = readingLevelGetContentWords(simplified);
        if (!srcWords.size || !simpWords.length) return 0;
        let overlap = 0;
        simpWords.forEach(w => { if (srcWords.has(w)) overlap++; });
        return overlap / simpWords.length;
    }

    function isReadingLevelTermAlreadyDefinedInSource(term, sourceText) {
        const t = String(term || '').trim();
        if (!t) return false;
        const escaped = readingLevelEscapeRegExp(t);
        const re = new RegExp(`\\b${escaped}\\b`, 'i');
        if (!re.test(sourceText)) return false;
        const patterns = [
            new RegExp(`\\b${escaped}\\b\\s*\\([^)]+\\)`, 'i'),
            new RegExp(`\\b${escaped}\\b\\s*,\\s*[^,]{4,40},`, 'i'),
            new RegExp(`\\b${escaped}\\b\\s+(?:is|are|was|were)\\s+(?:called|known as|defined as)\\b`, 'i'),
            new RegExp(`\\b(?:called|known as|defined as)\\s+${escaped}\\b`, 'i'),
            new RegExp(`\\b${escaped}\\s*[:—–-]\\s*[^.!?]{8,}`, 'i')
        ];
        return patterns.some(p => p.test(sourceText));
    }

    function extractReadingLevelClarifierCandidatesHeuristic(sourceText, level) {
        const text = String(sourceText || '');
        if (!text.trim() || !readingLevelRequiresClarifiers(level)) return [];

        const baselines = getJargonGradeBaselines(getGradeLevel())
            .split(',')
            .map(w => w.trim().toLowerCase())
            .filter(Boolean);
        const baselineSet = new Set(baselines);
        const candidates = new Set();
        let match;

        const compoundRe = /\b[a-z]{4,}(?:o(?:sis|tic|id|us|um|ae|al|ate|ine|one)|(?:phy|bio|geo|photo|proto|extra|intra|inter|trans|micro|macro|poly|mono|di|tri|tetra|penta|hexa|hepta|octa|deca)[a-z]{3,})\b/gi;
        while ((match = compoundRe.exec(text)) !== null) {
            const word = match[0];
            if (word.length >= 8 && !baselineSet.has(word.toLowerCase())) candidates.add(word);
        }

        (text.match(/\b\d{2,3}S\b/gi) || []).forEach(label => candidates.add(label));

        const domainRe = /\b(?:Archaea|Eukarya|Prokaryot(?:e|ic)|Eukaryot(?:e|ic)|Nucleoid|Plasmid|Peptidoglycan|Phagocytosis|Cytosol|Extrachromosomal|Endocytosis|Exocytosis|Mitochondri(?:a|on)|Chloroplast|Ribosome|Endoplasmic|Peroxisome|Centriole|Flagell(?:um|a)|Cyanobacteria|Streptococcus|Escherichia)\b/g;
        while ((match = domainRe.exec(text)) !== null) candidates.add(match[0]);

        const wordRe = /\b[A-Za-z]{8,}\b/g;
        while ((match = wordRe.exec(text)) !== null) {
            const word = match[0];
            const lower = word.toLowerCase();
            if (baselineSet.has(lower)) continue;
            if (/^(however|therefore|although|scientists|researchers|organisms|bacteria|students|chapter|section|paragraph|validate|properly|carefully|enough|words|things|living|basis|study|form|this|these|those|their|there|which|where|while|during|before|after|between|through|without|within|against|across|around|another|other|first|second|third|many|most|some|such|each|both|only|also|very|much|more|most|well|high|school|advanced|college|university)$/i.test(word)) continue;
            candidates.add(word);
        }

        return Array.from(candidates)
            .filter(term => !isReadingLevelTermAlreadyDefinedInSource(term, text))
            .slice(0, 12);
    }

    function buildReadingLevelClarifierTermSystemPrompt(level) {
        const levelLabel = getReadingLevelTargetLabel(level);
        const baselines = getJargonGradeBaselines(getGradeLevel());
        return `You are an instructional designer preparing a ${levelLabel} textbook rewrite.

Identify technical terms, discipline jargon, acronyms, and named concepts that ${levelLabel} readers would likely need a brief inline clarifier on first use (appositive or plain-language gloss).

STRONG CANDIDATES — prioritize terms that are:
- Discipline-specific and abstract (e.g. nucleoid, peptidoglycan, phagocytosis)
- Acronyms or numeric labels students may not decode (e.g. 70S)
- Named models, theories, or processes central to understanding the passage

DO NOT flag:
- Baseline vocabulary students should already know, such as: ${baselines}
- Terms already plainly defined in the passage (e.g. "X is…", "called X", parenthetical definitions)
- Generic scaffolding (chapter, section, example, figure)

Return 1–4 highest-priority terms for this block only. Rank by priority: "high" = likely to block comprehension; "medium" = helpful but not essential.

Return ONLY valid JSON:
{"terms":[{"term":"word or phrase","priority":"high"}]}`;
    }

    function buildReadingLevelClarifierTermUserPrompt(sourceText, heuristicSeeds, level) {
        const seedBlock = heuristicSeeds?.length
            ? `\n\nHeuristic seed terms (keep, drop, or refine):\n${heuristicSeeds.join('; ')}`
            : '';
        return `Select terms that MUST receive a brief inline clarifier on first use in a ${getReadingLevelTargetLabel(level)} rewrite.

<source passage>
${sourceText}
</source passage>${seedBlock}`;
    }

    function readingLevelTermPattern(term) {
        const escaped = readingLevelEscapeRegExp(term);
        const variants = [escaped];
        if (/s$/i.test(term)) {
            variants.push(readingLevelEscapeRegExp(term.replace(/s$/i, '')));
        } else {
            variants.push(readingLevelEscapeRegExp(`${term}s`));
        }
        return new RegExp(`\\b(?:${variants.join('|')})\\b`, 'i');
    }

    function readingLevelBestMatchingSentence(sourceSentence, candidates) {
        const sourceWords = new Set(readingLevelGetContentWords(sourceSentence));
        let best = null;
        let bestScore = 0;
        (candidates || []).forEach(candidate => {
            const words = readingLevelGetContentWords(candidate);
            const score = words.filter(w => sourceWords.has(w)).length;
            if (score > bestScore) {
                bestScore = score;
                best = candidate;
            }
        });
        return bestScore >= 2 ? best : null;
    }

    function isDryParentheticalDefinition(text, termLen) {
        const after = text.slice(termLen);
        const paren = after.match(/^\s*\(([^)]{4,80})\)/);
        if (!paren) return false;
        const inner = paren[1].toLowerCase();
        if (/\b(?:like|as)\b/.test(inner)) return false;
        if (/\b(?:like|shaped|coated|bound|filled|jacket|cloak|armor|mesh|room|apartment|floor|furniture)\b/.test(inner)) return false;
        return /\b(?:complex|region|area|structure|molecule|compound|protein|sugar|bound|membrane)\b/.test(inner);
    }

    function hasPictureWordPictureForTerm(simplified, term) {
        const simp = String(simplified || '');
        const termStr = String(term || '').trim();
        if (!termStr || !simp) return false;
        const mentionRe = readingLevelTermPattern(termStr);
        const mention = mentionRe.exec(simp);
        if (!mention) return false;
        const local = simp.slice(mention.index, mention.index + mention[0].length + 80);
        const after = local.slice(mention[0].length);
        return /\b(?:like|as)\s+(?:a\s+|an\s+|the\s+)?[^,.]{3,50}/i.test(after);
    }

    function hasVisualMetaphorForTerm(simplified, term, source) {
        const simp = String(simplified || '');
        const src = String(source || '');
        const termStr = String(term || '').trim();
        if (!termStr || !simp) return false;
        const mentionRe = readingLevelTermPattern(termStr);
        const mention = mentionRe.exec(simp);
        if (mention) {
            const local = simp.slice(mention.index, mention.index + 180);
            const after = local.slice(mention[0].length);
            if (/\b(?:like|as)\s+[^,.]{4,60}/i.test(after)) return true;
            if (/\b[a-z]+-(?:like|shaped|coated|bound|filled)\b/i.test(local)) return true;
            if (/\*(?:think|\s*think:)/i.test(after)) return true;
            if (/\(\s*think:\s*\*\*[A-Za-z]\*\*/i.test(after)) return true;
            if (/\b(?:think(?:\s+of\s+it\s+as|\s+pg\s+wall|\s+the\s+pg\s+wall)|students call it|nicknamed|remember it as|say\s+"[^"]{2,24}"|for short)\b/i.test(after)) return true;
            if (isDryParentheticalDefinition(local, mention[0].length)) return false;
            const appositiveMatch = after.match(/^\s*,\s*([^,]{4,80})(?:,\s|\.\s|\.?$)/);
            if (appositiveMatch) {
                const gloss = appositiveMatch[1].toLowerCase();
                if (/\b(?:like|as|room|wall|armor|cloak|jacket|mesh|floor|apartment|studio|furniture|cheat|blueprint|wrapper|pg|poly|stealth|brick|gate|fortress|coat|sugar)\b/.test(gloss)) {
                    return true;
                }
                return false;
            }
            if (/\s*\([^)]{4,80}\)/.test(after) && !isDryParentheticalDefinition(local, mention[0].length)) {
                return true;
            }
        }

        if (!mentionRe.test(src)) return false;
        const srcSentences = src.split(/(?<=[.!?])\s+/).filter(Boolean);
        const simpSentences = simp.split(/(?<=[.!?])\s+/).filter(Boolean);
        const sourceSentence = srcSentences.find(sentence => mentionRe.test(sentence));
        if (!sourceSentence) return false;
        const matchedSentence = readingLevelBestMatchingSentence(sourceSentence, simpSentences);
        if (matchedSentence) {
            const lower = matchedSentence.toLowerCase();
            if (/\b(?:think of|imagine|basically|like a|like an|like the|studio|apartment|armor|cloak|jacket|mesh|furniture|cheat sheet|blueprint)\b/.test(lower)) {
                return true;
            }
        }
        return false;
    }

    function hasInlineClarifierForTerm(simplified, term, source, styleOptions) {
        const opts = normalizeReadingLevelStyleOptions(styleOptions || getDefaultReadingLevelStyleOptions());
        if (opts.termHelp === 'visual') {
            return hasVisualMetaphorForTerm(simplified, term, source);
        }
        if (opts.termHelp === 'picture') {
            return hasPictureWordPictureForTerm(simplified, term);
        }

        const simp = String(simplified || '');
        const src = String(source || '');
        const termStr = String(term || '').trim();
        if (!termStr || !simp) return false;

        const mentionRe = readingLevelTermPattern(termStr);
        const mention = mentionRe.exec(simp);

        if (mention) {
            const after = simp.slice(mention.index + mention[0].length);
            const appositiveMatch = after.match(/^\s*,\s*([^,]{4,80})(?:,\s|\.\s|\.?$)/);
            if (appositiveMatch) {
                const clarifierWords = appositiveMatch[1].trim().split(/\s+/).filter(Boolean);
                if (clarifierWords.length >= 2 && clarifierWords.length <= 15) return true;
            }
            const local = simp.slice(mention.index, mention.index + 140);
            if (/\s*\([^)]{4,80}\)/.test(local.slice(mention[0].length))) return true;
        }

        if (!mentionRe.test(src)) return false;
        const srcSentences = src.split(/(?<=[.!?])\s+/).filter(Boolean);
        const simpSentences = simp.split(/(?<=[.!?])\s+/).filter(Boolean);
        const sourceSentence = srcSentences.find(sentence => mentionRe.test(sentence));
        if (!sourceSentence) return false;
        const srcContent = new Set(readingLevelGetContentWords(sourceSentence));
        const matchedSentence = readingLevelBestMatchingSentence(sourceSentence, simpSentences);
        if (matchedSentence && !mentionRe.test(matchedSentence)) {
            const simpContent = readingLevelGetContentWords(matchedSentence);
            const overlap = simpContent.filter(w => srcContent.has(w)).length;
            const newWords = simpContent.filter(w => !srcContent.has(w)).length;
            if (newWords >= 3 && overlap >= 2) return true;
        }
        return false;
    }

    function readingLevelIsParaphraseOnly(source, simplified, clarifierTerms, styleOptions) {
        const terms = clarifierTerms || [];
        if (!terms.length) return false;
        const opts = normalizeReadingLevelStyleOptions(styleOptions || getDefaultReadingLevelStyleOptions());
        const anyClarifier = terms.some(term => hasInlineClarifierForTerm(simplified, term, source, styleOptions));
        if (anyClarifier) return false;
        const threshold = opts.termHelp === 'visual' ? 0.65 : 0.75;
        return readingLevelTokenOverlapRatio(source, simplified) > threshold;
    }

    function countReadingLevelPassiveBannedPhrases(text) {
        const lower = String(text || '').toLowerCase();
        return READING_LEVEL_PASSIVE_BANNED.filter(phrase => lower.includes(phrase)).length;
    }

    function detectReadingLevelParagraphOpenerStyle(text) {
        const trimmed = String(text || '').replace(/\s+/g, ' ').trim();
        if (!trimmed) return 'factual';
        if (/^(?:imagine|think of|picture this|basically)\b/i.test(trimmed)) return 'command';
        if (/\b(?:behaves|acts|functions|works)\s+like\b/i.test(trimmed.slice(0, 80))) return 'embedded';
        if (/\b(?:which you can picture|you can picture|functions like|functions exactly like|acts as|serving as|much like|according to)\b/i.test(trimmed)) {
            return 'embedded';
        }
        return 'factual';
    }

    function readingLevelHasParagraphVisualMetaphor(simplified) {
        const lower = String(simplified || '').toLowerCase();
        return /\b(?:think of|imagine|basically|picture|like a|like an|like the|which you can picture|you can picture|functions like|functions exactly like|acts as|serving as|much like|according to|studio|apartment|armor|cloak|jacket|mesh|furniture|cheat sheet|blueprint|single-room|walled-off|inner wrapper|outer cloak|power plant|engine room|city border|busy city|security gate|checkpoint|mortar|decorative flag)\b/.test(lower);
    }

    const READING_LEVEL_VISUAL_THEME_BUCKETS = [
        { id: 'city', re: /\b(?:city|border|gate|checkpoint|district|square|street|town|fortress|castle)\b/i },
        { id: 'building', re: /\b(?:wall|brick|fence|mortar|foundation|building|layered defense)\b/i },
        { id: 'stealth', re: /\b(?:cloak|ninja|stealth|invisibility|hide|evade|capture|phagocyt|immune guard|slip past)\b/i },
        { id: 'office', re: /\b(?:office|desk|flash drive|usb|file folder|computer|digital|portable drive)\b/i },
        { id: 'factory', re: /\b(?:factory|worker|assembly|production line|bustling floor|tiny factories)\b/i },
        { id: 'body', re: /\b(?:jacket|coat|armor|skin|body|organ|stealthy coat)\b/i },
        { id: 'power', re: /\b(?:power plant|engine room|generator|battery|energy hub)\b/i }
    ];

    function readingLevelCountVisualThemeBuckets(text) {
        const lower = String(text || '').toLowerCase();
        return READING_LEVEL_VISUAL_THEME_BUCKETS.reduce((count, bucket) => (
            bucket.re.test(lower) ? count + 1 : count
        ), 0);
    }

    function readingLevelHasMixedVisualThemes(text) {
        return readingLevelCountVisualThemeBuckets(text) >= 3;
    }

    function readingLevelTermAppearsBold(simplified, term) {
        const termStr = String(term || '').trim();
        if (!termStr) return true;
        const escaped = readingLevelEscapeRegExp(termStr);
        return new RegExp(`\\*\\*[^*\\n]{0,40}${escaped}[^*\\n]{0,40}\\*\\*`, 'i').test(String(simplified || ''));
    }

    function readingLevelWouldExceedCommandOpenerQuota(openerStats) {
        if (!openerStats || typeof openerStats.total !== 'number') return false;
        if (openerStats.total < 4) return false;
        const threshold = getCommandOpenerQuotaThreshold();
        const projected = (openerStats.command + 1) / (openerStats.total + 1);
        return projected > threshold;
    }

    function formatReadingLevelClarifierPromptBlock(terms, styleOptions, frictionPhrases) {
        if (!terms?.length && !frictionPhrases?.length) return '';
        const opts = normalizeReadingLevelStyleOptions(styleOptions || getDefaultReadingLevelStyleOptions());
        let formatHint = 'Use appositives ("term, short phrase,") or replace opaque wording with plain speech. Max ~12 words per clarifier. Allowed formats: appositive, parenthetical gloss, or plain-language replacement — not long new paragraphs.';
        if (opts.termHelp === 'visual') {
            formatHint = 'State each term factually first, then map it inside ONE sustained metaphor theme using embedded connectors — not dry parenthetical definitions. Wrap each listed term in **bold** on first use. For dense jargon, add acronym hooks *(think: **L**etter **H**ints)* after the official term (e.g. peptidoglycan *(think: **P**rotective **G**rid)*).';
        } else if (opts.termHelp === 'picture') {
            formatHint = 'Each term needs an immediate "like a …" or "like …" word-picture inline in the same clause. Max ~8 words per mapping — tight and punchy.';
        }
        let block = '';
        if (terms?.length) {
            block += `\n\nTerms that MUST receive help on first use:\n${terms.join('; ')}\n${formatHint}`;
        }
        block += formatReadingLevelFrictionPromptBlock(frictionPhrases);
        return block;
    }

    function validateReadingLevelOutput(sourceText, simplifiedText, options = {}) {
        const reasons = [];
        const source = String(sourceText || '').replace(/\s+/g, ' ').trim();
        const simplified = String(simplifiedText || '').replace(/\s+/g, ' ').trim();
        const isListItem = options.isListItem === true;
        const isTheoryListItem = options.isTheoryListItem === true
            || isReadingLevelTheoryListItem(source, isListItem);
        const protectedTerms = options.protectedTerms || extractReadingLevelProtectedTerms(source);
        const level = options.level || 'high-school';
        const styleOptions = normalizeReadingLevelStyleOptions(options.styleOptions, level);
        const bounds = getReadingLevelValidationBounds(level, styleOptions, { isListItem, isTheoryListItem });
        const opts = styleOptions;

        if (!simplified) reasons.push('empty output');
        const sourceWords = readingLevelWordCount(source);
        const simplifiedWords = readingLevelWordCount(simplified);
        const minWordsForLengthCheck = isListItem ? 4 : 8;
        if (sourceWords >= minWordsForLengthCheck) {
            const ratio = simplifiedWords / sourceWords;
            if (ratio < bounds.min) reasons.push('too short');
            if (ratio > bounds.max) reasons.push('too long');
        }
        if (/,,/.test(simplified)) reasons.push('doubled punctuation');
        if (/\b\w+\.'s\b/i.test(simplified)) reasons.push('broken possessive');
        if (/,\s*[a-z]{1,2}\s+van\b/i.test(simplified)) reasons.push('corrupted name');
        if (/\bto at\b/i.test(simplified)) reasons.push('broken phrase');
        if (/\b(things|organisms)\s+up\s+(one|of)\b/i.test(simplified)) reasons.push('missing verb');
        if (/^\s*the\s+basic\s+unit\b/i.test(simplified) && !/\bcell\b/i.test(simplified)) {
            reasons.push('leading fragment');
        }
        if (/\b(the|a|an)\s+\w+\s*$/i.test(simplified) && simplifiedWords >= 4) reasons.push('incomplete trailing clause');
        if (/\bthe it\b/i.test(simplified)) reasons.push('broken pronoun');
        if (/\w+function\*\*/i.test(simplified)) reasons.push('merged emphasis artifact');
        if ((simplified.match(/\*\*/g) || []).length % 2 !== 0) reasons.push('unmatched bold markers');
        if (!isListItem && simplifiedWords >= 8 && !/[.!?]/.test(simplified)) reasons.push('missing sentence end');
        if (isListItem && simplifiedWords > 0 && simplifiedWords < 6) reasons.push('list item too short');
        if (isTheoryListItem && readingLevelCountSentences(simplified) > 2) {
            reasons.push('theory list item too many sentences');
        }

        const simplifiedLower = simplified.toLowerCase();
        protectedTerms.forEach(term => {
            if (/^\d{4}$/.test(term)) {
                if (!simplified.includes(term)) reasons.push(`missing year ${term}`);
                return;
            }
            if (/\d{1,2}(?:st|nd|rd|th)\s+century/i.test(term)) {
                const centuryNum = term.match(/\d{1,2}/)?.[0];
                if (centuryNum && !new RegExp(`\\b${centuryNum}(?:st|nd|rd|th)?\\s*century`, 'i').test(simplified)) {
                    reasons.push(`missing ${term}`);
                }
                return;
            }
            if (!readingLevelTermMatchesSimplified(term, simplifiedLower)) {
                reasons.push(`missing term ${term}`);
            }
        });

        const clarifierTerms = options.clarifierTerms;

        if (readingLevelRequiresClarifiers(level) && clarifierTerms?.length && !isTheoryListItem) {
            clarifierTerms.forEach(term => {
                if (!hasInlineClarifierForTerm(simplified, term, source, styleOptions)) {
                    reasons.push(`missing clarifier: ${term}`);
                }
            });
            if ((clarifierTerms.length >= 2 || sourceWords >= 40) && readingLevelIsParaphraseOnly(source, simplified, clarifierTerms, styleOptions)) {
                reasons.push('insufficient clarity change');
            }
        } else if (readingLevelRequiresClarifiers(level) && sourceWords >= 30) {
            const overlap = readingLevelTokenOverlapRatio(source, simplified);
            const overlapMax = opts.termHelp === 'visual' ? 0.82 : 0.88;
            if (overlap > overlapMax) reasons.push('insufficient clarity change');
        }

        if (opts.termHelp === 'visual' && (isTheoryListItem || sourceWords >= 30) && readingLevelHasMixedVisualThemes(simplified)) {
            reasons.push('mixed metaphor themes');
        }

        const openerStyle = detectReadingLevelParagraphOpenerStyle(simplified);
        if (opts.termHelp === 'visual' && !isTheoryListItem && openerStyle === 'command') {
            if (options.priorOpenerStyle === 'command') {
                reasons.push('repeated command opener');
            }
            if (readingLevelWouldExceedCommandOpenerQuota(options.openerStats)) {
                reasons.push('command opener quota exceeded');
            }
        }

        if (readingLevelRequiresClarifiers(level) && !isListItem && readingLevelHasStackedFrictionPhrases(simplified)) {
            reasons.push('stacked friction phrasing');
        }

        if (opts.termHelp === 'visual' && !isListItem && clarifierTerms?.length) {
            clarifierTerms.forEach(term => {
                if (!readingLevelTermAppearsBold(simplified, term)) {
                    reasons.push(`missing bold on study term: ${term}`);
                }
            });
        }

        if ((opts.tone === 'friendly' || opts.tone === 'playful') && sourceWords >= 40) {
            if (!/\b(you|your)\b/i.test(simplified)) {
                reasons.push('missing second person (you/your) for conversational tone');
            }
            if (countReadingLevelPassiveBannedPhrases(simplified) >= 2) {
                reasons.push('too much passive textbook phrasing for conversational tone');
            }
        }

        return { ok: reasons.length === 0, reasons };
    }

    function buildReadingLevelUserPrompt(levelPrompt, text, protectedTerms, clarifierTerms, styleOptions, promptOptions = {}) {
        let prompt = `${levelPrompt}\n\nRewrite the source passage below. Output plain text only — not wrapped in quotes.\n\n<source passage>\n${text}\n</source passage>`;
        if (protectedTerms?.length) {
            prompt += `\n\nThese terms must appear recognizably in your rewrite: ${protectedTerms.join('; ')}`;
        }
        const frictionPhrases = extractReadingLevelFrictionPhraseCandidates(text);
        const isTheoryListItem = promptOptions.isTheoryListItem === true;
        if (!isTheoryListItem) {
            prompt += formatReadingLevelClarifierPromptBlock(clarifierTerms, styleOptions, frictionPhrases);
        } else if (frictionPhrases.length) {
            prompt += formatReadingLevelFrictionPromptBlock(frictionPhrases);
        }
        const opts = normalizeReadingLevelStyleOptions(styleOptions || getDefaultReadingLevelStyleOptions(), promptOptions.level);
        if (opts.termHelp === 'visual' && !isTheoryListItem && promptOptions.priorOpenerStyle === 'command') {
            prompt += '\n\nPrevious paragraph used a command opener ("Imagine…" / "Think of…") — open this paragraph with a factual lead or embedded connector instead.';
        }
        if (opts.termHelp === 'visual' && !isTheoryListItem && promptOptions.openerStats?.total >= 3) {
            const ratio = promptOptions.openerStats.command / promptOptions.openerStats.total;
            if (ratio >= 0.15) {
                prompt += '\n\nChapter opener note: command-style openers are already frequent in earlier paragraphs — start this one with a factual lead, action verb, or bolded technical term.';
            }
        }
        return prompt;
    }

    function buildReadingLevelRepairUserPrompt(sourceText, brokenDraft, protectedTerms, level, repairOptions = {}) {
        const levelLabel = getReadingLevelTargetLabel(level);
        const styleOptions = normalizeReadingLevelStyleOptions(repairOptions.styleOptions, level);
        const reasons = repairOptions.reasons || [];
        const clarifierTerms = repairOptions.clarifierTerms || [];
        const protectedBlock = protectedTerms?.length
            ? `\n\nThese terms must appear recognizably: ${protectedTerms.join('; ')}`
            : '';
        const missingClarifiers = clarifierTerms.filter(term =>
            !hasInlineClarifierForTerm(brokenDraft, term, sourceText, styleOptions)
        );
        let validationBlock = '';
        if (reasons.length) {
            validationBlock += `\n\nValidation failures to fix:\n${reasons.join('\n')}`;
        }
        if (missingClarifiers.length) {
            validationBlock += `\n\nAdd missing clarifiers for: ${missingClarifiers.join('; ')}`;
        }
        const isTheoryListItem = repairOptions.isTheoryListItem === true;
        const styleHint = isTheoryListItem
            ? '\n\nThis is a principle/theory bullet — compress to ONE sentence (two max for a Latin gloss). Do not unpack enumerated ideas into separate metaphors. No sustained paragraph theme, no stacked analogies.'
            : (styleOptions.termHelp === 'visual'
                ? `\n\nUse one sustained metaphor theme with science-first rhythm — state biology, then embed the picture with varied connectors ("which you can picture as", "acts as", "serving as"). Wrap flagged study terms in **bold** on first use. For dense jargon, add acronym hooks *(think: **P**rotective **G**rid)* after the official term. Map every flagged term through the same theme. Do not mix unrelated themes (office + ninja + factory). Unpack dense phrasing (domains → major groups; membrane-bound → surrounded by a membrane). Preserve every fact from the source. Do not open with "Imagine" or "Think of" if fixing a repeated command opener or command opener quota.`
                : (styleOptions.termHelp === 'picture'
                    ? '\n\nAdd immediate "like a …" word-pictures next to each hard term.'
                    : ''));
        let toneHint = '';
        if (isTheoryListItem && styleOptions.tone === 'playful') {
            toneHint = '\n\nKeep wit to one short phrase inside the single sentence — no cheerleading.';
        } else if (styleOptions.tone === 'friendly') {
            toneHint = '\n\nUse second person (you/your) and active, conversational phrasing.';
        } else if (!isTheoryListItem && styleOptions.tone === 'playful') {
            toneHint = '\n\nUse second person (you/your), active phrasing, dry understated wit inside the metaphor, and accurate failure-mode color — no cheerleading ("Great!", "Exciting!", "Let\'s explore").';
        }
        const frictionHint = reasons.includes('stacked friction phrasing')
            ? `\n\n${getReadingLevelFrictionPhraseRules()}`
            : '';
        return `Repair this ${levelLabel} textbook rewrite. Restore clarity and completeness: fix grammar, restore missing words, and preserve every fact from the source. Return ONLY the corrected plain text — no quotes around the whole output.

<source passage>
${sourceText}
</source passage>

<broken draft>
${brokenDraft}
</broken draft>${protectedBlock}${validationBlock}${styleHint}${toneHint}${frictionHint}`;
    }

    function createReadingLevelValidationStats() {
        return { passed: 0, retried: 0, keptOriginal: 0, total: 0 };
    }

    const api = {
        READING_LEVEL_STYLE_DISPLAY_LABELS,
        READING_LEVEL_PASSIVE_BANNED,
        getDefaultReadingLevelStyleOptions,
        normalizeReadingLevelStyleOptions,
        getReadingLevelStyleDisplayLabels,
        getReadingLevelTargetLabel,
        getReadingLevelTemperature,
        getReadingLevelSimplifyGradeAddon,
        getReadingLevelSimplifyDepthRules,
        getReadingLevelLengthTargetHint,
        getReadingLevelEngagementRules,
        getFriendlyToneRules,
        getPlayfulToneRules,
        getReadingLevelVisualTermHelpRules,
        getReadingLevelOutputRules,
        getReadingLevelAnalogyGlobalRule,
        getReadingLevelListItemRules,
        getReadingLevelTheoryListRules,
        isReadingLevelGlossaryListItem,
        getReadingLevelParagraphRules,
        getReadingLevelListContextRules,
        getReadingLevelExerciseRules,
        getReadingLevelLevelTarget,
        getReadingLevelPromptForLevel,
        getReadingLevelSimplifySystemPrompt,
        buildReadingLevelChapterSystemPrompt,
        sanitizeReadingLevelOutput,
        readingLevelWordCount,
        readingLevelLevenshtein,
        extractReadingLevelProtectedTerms,
        readingLevelTermMatchesSimplified,
        getReadingLevelWordCountBounds,
        getReadingLevelValidationBounds,
        readingLevelCountSentences,
        isReadingLevelTheoryListItem,
        getReadingLevelTheoryListEngagementRules,
        readingLevelRequiresClarifiers,
        readingLevelEscapeRegExp,
        readingLevelTextHash,
        readingLevelGetContentWords,
        readingLevelTokenOverlapRatio,
        isReadingLevelTermAlreadyDefinedInSource,
        extractReadingLevelClarifierCandidatesHeuristic,
        buildReadingLevelClarifierTermSystemPrompt,
        buildReadingLevelClarifierTermUserPrompt,
        readingLevelTermPattern,
        readingLevelBestMatchingSentence,
        hasPictureWordPictureForTerm,
        hasVisualMetaphorForTerm,
        hasInlineClarifierForTerm,
        readingLevelIsParaphraseOnly,
        countReadingLevelPassiveBannedPhrases,
        detectReadingLevelParagraphOpenerStyle,
        readingLevelHasParagraphVisualMetaphor,
        readingLevelCountVisualThemeBuckets,
        readingLevelHasMixedVisualThemes,
        readingLevelTermAppearsBold,
        readingLevelWouldExceedCommandOpenerQuota,
        getReadingLevelVisualGoldFewShot,
        getReadingLevelFrictionPhraseRules,
        extractReadingLevelFrictionPhraseCandidates,
        readingLevelHasStackedFrictionPhrases,
        getCommandOpenerQuotaThreshold,
        getPlayfulGradeWitGuardrails,
        formatReadingLevelClarifierPromptBlock,
        validateReadingLevelOutput,
        createReadingLevelValidationStats,
        buildReadingLevelUserPrompt,
        buildReadingLevelRepairUserPrompt,
        getJargonGradeBaselines
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    global.ReadingLevelCore = api;
    Object.keys(api).forEach(key => {
        global[key] = api[key];
    });
}(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : global));
