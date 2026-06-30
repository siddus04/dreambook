/**
 * LLM prompts for Peer Review (Phase A) and Enhancement Scan placement (Phase B).
 * Loaded after prompts_ta.js; exposed as window.REVIEW_LLM_PROMPTS.
 */
(function (global) {
    'use strict';

    const SCAN_CATALOG = {
        scan_illustrate: 'Illustrate — mechanism-accurate everyday analogy or in-the-news connection for abstract passages',
        scan_socratic: 'Socratic checkpoint — 3-step dialogue where students explain in their own words',
        scan_counter: 'Counter-argument — flawed-claim debate where students evaluate a partly correct claim using passage evidence',
        scan_case_study: 'Mini case study — realistic scenario applying the concept',
        scan_explain_peer: 'Explain to a peer — Feynman-style teaching practice on core terms',
        scan_simulation: 'Simulation — interactive manipulation of variables in process-heavy content',
        scan_recall: 'Recall check — MCQ, match, or order-steps retrieval practice'
    };

    const AUTHOR_RATIONALE_RULE = `- Rationale must describe what the STUDENT WILL DO in plain language for the textbook author (e.g. "Add a debate exercise where students weigh two viewpoints about…, helping them evaluate common misconceptions."). Focus on learning outcomes — never mention format_id, widget slugs, feature names, internal pipeline terms like "band", or quoted technical identifiers.`;

    function buildPeerReviewSystemPrompt(gradeLevel) {
        return `You are an expert instructional designer and peer reviewer for a ${gradeLevel} textbook chapter.
Analyze the chapter outline and return strategic feedback ONLY — do not propose widget placements yet.

Return valid JSON:
{
  "headline": "one-line overall assessment",
  "strengths": ["specific strength tied to section names", "..."],
  "gaps": ["specific gap tied to section names and learning needs", "..."],
  "focus": "2-3 sentences on what to improve first and why",
  "suggested_scans": [
    {
      "scan_id": "scan_illustrate|scan_socratic|scan_counter|scan_case_study|scan_explain_peer|scan_simulation|scan_recall",
      "chapter_specific_reason": "1-2 sentences citing specific sections from the outline",
      "priority": "essential|recommended|optional"
    }
  ],
  "excluded_sections": [
    {
      "section_heading": "exact heading from outline",
      "reason": "why this section is poor for interactive widgets (e.g. intro, history, background only)"
    }
  ]
}

Rules:
- suggested_scans MUST include exactly one entry for EACH of these scan_id values (all seven required):
  scan_illustrate, scan_socratic, scan_counter, scan_case_study, scan_explain_peer, scan_simulation, scan_recall
- Every entry must have a chapter_specific_reason citing specific sections — even if priority is optional.
- Mark 1-2 scans as essential; others as recommended or optional based on chapter fit.
- Stay within ${gradeLevel} reading level in all prose.
- Do not invent section headings not in the outline.
- excluded_sections: list sections that should NOT receive interactive widgets — typically introductions, overviews, historical context, background-only, or chapter summaries with no core concept to practice. Use exact headings from the outline. Omit sections that teach substantive concepts even if they mention history.`;
    }

    function buildPeerReviewUserPrompt(outlineText, chapterTitle) {
        return `Chapter title: ${chapterTitle || 'Untitled'}

Structured chapter outline (each [blk-…] is an anchorable body block — headings are NOT anchorable):
${outlineText}

Analyze strengths, gaps, and provide chapter-specific feedback for every enhancement scan type listed in the system prompt.`;
    }

    function buildTargetProposalCountRule(scanId, targets) {
        const t = targets?.target ?? targets?.min ?? 1;
        const max = targets?.max ?? t;
        const min = targets?.min ?? t;
        if (scanId === 'scan_illustrate') {
            return `Return ${t} proposals (minimum ${min}, maximum ${max}). Include at least ${targets.minAnalogy || 1} with payload.illustrate_style "analogy" and at least ${targets.minNews || 1} with "news". Spread across different sections.`;
        }
        if (min === max) {
            return `Return EXACTLY ${t} proposal${t === 1 ? '' : 's'} — spread across different sections when returning more than one.`;
        }
        return `Return ${t} proposals (minimum ${min}, maximum ${max}). Spread across different substantive sections — do not cluster all proposals in one section. Rank by learning impact but meet the minimum count.`;
    }

    function buildScanPayloadRules(scanId, scanDef) {
        let payloadRules = '';
        let formatRules = '';
        if (scanId === 'scan_illustrate') {
            payloadRules = 'payload.illustrate_style MUST be exactly "analogy" or "news" (no other values). Do NOT set widget_action_id — the system derives it.';
        } else if (scanId === 'scan_recall') {
            payloadRules = 'payload.recall_format "mcq"|"match"|"order" and payload.widget_action_id "recall-check"';
        } else if (scanId === 'scan_simulation') {
            payloadRules = 'payload.simulation_type "phet"; payload.phet_id "membrane-transport" when transport/osmosis/diffusion fits, else null';
        } else if (scanId === 'scan_counter') {
            payloadRules = 'payload.widget_action_id "opposing-view"; payload.format_id MUST be "compare_models"';
            formatRules = 'Counter rationales must describe a flawed-claim debate (one partly wrong claim vs pushback) — NOT parallel summaries of two categories (e.g. Model A = prokaryote, Model B = eukaryote).';
        } else if (scanDef?.widgetActionId) {
            payloadRules = `payload.widget_action_id "${scanDef.widgetActionId}"`;
            const fmtList = global.DreamBookModuleFormats?.listFormatIds?.(scanDef.widgetActionId) || [];
            if (fmtList.length) {
                formatRules = `payload.format_id one of: ${fmtList.join(', ')} — vary across proposals`;
            }
        }
        return { payloadRules, formatRules };
    }

    function buildScanPlacementSystemPrompt(scanId, scanDef, gradeLevel, placementOptions) {
        const catalogLine = SCAN_CATALOG[scanId] || scanDef?.description || scanId;
        const targets = placementOptions || {};
        const proposalCountRule = targets.target
            ? buildTargetProposalCountRule(scanId, targets)
            : 'Return 1-5 proposals ranked by learning impact; quality over quantity.';
        const { payloadRules, formatRules } = buildScanPayloadRules(scanId, scanDef);

        return `You are an expert instructional designer placing ONE enhancement type in a ${gradeLevel} textbook chapter.

Scan type: ${catalogLine}

Return valid JSON:
{
  "proposals": [
    {
      "section_heading": "exact heading from outline",
      "after_block_id": "blk-… from outline — body block AFTER which to insert",
      "anchor_quote": "8-20 consecutive words copied VERBATIM from that block's text",
      "rationale": "2-3 sentences: WHERE in the section and WHY this widget helps learning",
      "necessity": "essential|recommended|optional",
      "objective_tag": "clarity|retention|critical_thinking|application",
      "title": "short label for the author",
      "payload": { "format_id": "optional — see rules" }
    }
  ]
}

Placement rules (critical):
- Insert AFTER the block where the concept is EXPLAINED, not at the section opening.
- Prefer blocks in the middle third of a section, after core definitions or mechanisms.
- NEVER use section heading blocks — only [blk-…] body blocks from the outline.
- Never anchor on the first body paragraph unless the section has only one paragraph.
- Natural pause points: after a key definition, before an application example, after compare/contrast.
- ${proposalCountRule}
- anchor_quote MUST appear verbatim in the cited block.
- after_block_id MUST be a body block listed under section_heading in the outline — never reuse a block ID from another section.
- NEVER place widgets in excluded sections (listed in the user prompt when provided).
- Prefer substantive concept sections over introductions, history, or background-only passages.
- Rationale MUST name the specific concept or mechanism from anchor_quote — no generic filler.
- ${AUTHOR_RATIONALE_RULE}
- ${formatRules}
- ${payloadRules}
- Stay grade-appropriate: no college-level nuance beyond ${gradeLevel}.`;
    }

    function buildScanPlacementUserPrompt(scanId, outlineText, chapterTitle, peerReviewContext, retryNote, placementOptions) {
        let ctx = '';
        if (peerReviewContext?.gaps?.length) {
            ctx += '\nPeer review gaps:\n' + peerReviewContext.gaps.slice(0, 5).map(g => '- ' + g).join('\n');
        }
        if (peerReviewContext?.scanReason) {
            ctx += '\nWhy this scan was selected: ' + peerReviewContext.scanReason;
        }
        const excluded = peerReviewContext?.excludedSections || [];
        if (excluded.length) {
            ctx += '\n\nDo NOT place widgets in these sections:\n' + excluded.map(e => {
                const heading = e.sectionHeading || e.section_heading || e.heading || '';
                const reason = e.reason ? ` — ${e.reason}` : '';
                return `- ${heading}${reason}`;
            }).filter(line => line !== '- ').join('\n');
        }
        if (retryNote) {
            ctx += '\n\nRETRY: ' + retryNote;
        }
        if (placementOptions?.target) {
            if (scanId === 'scan_illustrate') {
                ctx += `\n\nTarget: return at least ${placementOptions.target} illustrate proposals with a mix of analogy and news styles in different sections.`;
            } else {
                ctx += `\n\nTarget: return at least ${placementOptions.min ?? placementOptions.target} and up to ${placementOptions.max ?? placementOptions.target} proposals in different substantive sections.`;
            }
        }
        return `Chapter: ${chapterTitle || 'Untitled'}
Scan: ${scanId}
${ctx}

Chapter outline:
${outlineText}

Return proposals for this scan only.`;
    }

    function buildCandidateScanSystemPrompt(scanId, scanDef, gradeLevel, targets) {
        const catalogLine = SCAN_CATALOG[scanId] || scanDef?.description || scanId;
        const countRule = buildTargetProposalCountRule(scanId, targets);
        const { payloadRules, formatRules } = buildScanPayloadRules(scanId, scanDef);

        return `You are an expert instructional designer for a ${gradeLevel} textbook chapter.

Your job: choose WHERE in the chapter this enhancement type helps learning — NOT to compute block IDs or anchor quotes.

Scan type: ${catalogLine}

You will receive a numbered candidate menu (C1, C2, …). Each entry is a valid insertion point after a specific paragraph.

Return valid JSON:
{
  "selections": [
    {
      "candidate_id": "C42",
      "title": "short author-facing label",
      "rationale": "2-3 sentences naming the SPECIFIC concept in that passage and WHY this scan type helps here",
      "necessity": "essential|recommended|optional",
      "objective_tag": "clarity|retention|critical_thinking|application",
      "payload": { }
    }
  ]
}

Rules:
- Pick only candidate_id values from the menu — do not invent IDs.
- ${countRule}
- Quality over quantity: skip weak fits rather than padding.
- Spread selections across different sections when returning more than one — prefer sections that do not yet have recommendations in this chapter.
- Use different candidate_id for each selection.
- Rationale must reference the passage content — no generic filler.
- ${AUTHOR_RATIONALE_RULE}
- ${formatRules}
- Payload: ${payloadRules || 'see scan type'}
- Stay grade-appropriate for ${gradeLevel}.`;
    }

    function buildCandidateScanUserPrompt(scanId, menuText, chapterTitle, peerReviewContext, targets, retryNote, sectionCoverageHint) {
        let ctx = '';
        if (sectionCoverageHint) {
            ctx += sectionCoverageHint + '\n\n';
        }
        if (peerReviewContext?.gaps?.length) {
            ctx += 'Peer review gaps:\n' + peerReviewContext.gaps.slice(0, 5).map(g => '- ' + g).join('\n') + '\n\n';
        }
        if (peerReviewContext?.scanReason) {
            ctx += 'Why this scan was selected: ' + peerReviewContext.scanReason + '\n\n';
        }
        const excluded = peerReviewContext?.excludedSections || [];
        if (excluded.length) {
            ctx += 'Excluded sections (not in menu):\n' + excluded.map(e => {
                const heading = e.sectionHeading || e.section_heading || e.heading || '';
                return `- ${heading}`;
            }).filter(line => line !== '- ').join('\n') + '\n\n';
        }
        if (retryNote) {
            ctx += 'RETRY: ' + retryNote + '\n\n';
        }
        const countHint = targets?.max
            ? `Select up to ${targets.max} candidates (aim for ${targets.target ?? targets.min}, minimum quality bar — do not pad).`
            : 'Select the best candidates for this scan type.';
        return `Chapter: ${chapterTitle || 'Untitled'}
Scan: ${scanId}
${ctx}${countHint}

Candidate insertion menu:
${menuText}

Return selections ranked best-first using candidate_id from the menu only.`;
    }

    function buildCandidateScanRetryNote(scanId, targets, gotCount) {
        const min = targets?.min ?? 1;
        const max = targets?.max ?? min;
        return `Previous response yielded ${gotCount} usable selection(s). Return ${min}–${max} high-quality selections using valid candidate_id values from the menu. Spread across sections. Each rationale must name the specific concept in that passage.`;
    }

    function buildBatchedScanPlacementSystemPrompt(gradeLevel, scanSpecs) {
        const scanBlocks = (scanSpecs || []).map(spec => {
            const catalogLine = SCAN_CATALOG[spec.scanId] || spec.scanDef?.description || spec.scanId;
            const countRule = buildTargetProposalCountRule(spec.scanId, spec.targets);
            const { payloadRules, formatRules } = buildScanPayloadRules(spec.scanId, spec.scanDef);
            return `- ${spec.scanId}: ${catalogLine}
  Count: ${countRule}
  Payload: ${payloadRules || 'see widget_action_id in catalog'}
  ${formatRules ? `Formats: ${formatRules}` : ''}
  ${spec.scanReason ? `Peer review note: ${spec.scanReason}` : ''}`.trim();
        }).join('\n');

        const schemaKeys = (scanSpecs || []).map(s => `"${s.scanId}": { "proposals": [ /* same proposal objects as single-scan */ ] }`).join(',\n  ');

        return `You are an expert instructional designer placing MULTIPLE enhancement types in one ${gradeLevel} textbook chapter pass.

The chapter outline appears ONCE in the user message. Return placements for ALL requested scan types in ONE JSON object.

Return valid JSON:
{
  ${schemaKeys}
}

Each proposal object:
{
  "section_heading": "exact heading from outline",
  "after_block_id": "blk-… body block AFTER which to insert",
  "anchor_quote": "8-20 consecutive words copied VERBATIM from that block",
  "rationale": "2-3 sentences naming the SPECIFIC concept in anchor_quote and WHY this widget fits HERE",
  "necessity": "essential|recommended|optional",
  "objective_tag": "clarity|retention|critical_thinking|application",
  "title": "short author-facing label",
  "payload": { }
}

Global quality rules (critical):
- Quality over quantity: only propose where the scan type genuinely fits the passage. Do not pad weak placements to hit counts.
- Spread placements across the chapter — use different sections for different scan types when possible.
- Use each after_block_id at most ONCE across the entire response (all scan types combined).
- Insert AFTER explanation blocks, not section openings. Prefer middle-third body blocks.
- anchor_quote MUST be verbatim from the cited block; after_block_id MUST belong to section_heading.
- NEVER anchor on first body paragraph unless the section has only one paragraph.
- NEVER place in excluded sections (listed in user prompt).
- Rationale must cite the concrete idea from anchor_quote — reject generic rationales mentally before outputting.
- Vary sections: do not stack multiple scan types on the same short passage unless the section is long and concept-dense.

Scan types requested:
${scanBlocks}

Stay grade-appropriate for ${gradeLevel}. Return ONLY the JSON object with keys for requested scans.`;
    }

    function buildBatchedScanPlacementUserPrompt(outlineText, chapterTitle, peerReviewContext, scanSpecs, retryNote) {
        let ctx = '';
        if (peerReviewContext?.gaps?.length) {
            ctx += 'Peer review gaps:\n' + peerReviewContext.gaps.slice(0, 5).map(g => '- ' + g).join('\n') + '\n\n';
        }
        const excluded = peerReviewContext?.excludedSections || [];
        if (excluded.length) {
            ctx += 'Do NOT place widgets in these sections:\n' + excluded.map(e => {
                const heading = e.sectionHeading || e.section_heading || e.heading || '';
                const reason = e.reason ? ` — ${e.reason}` : '';
                return `- ${heading}${reason}`;
            }).filter(line => line !== '- ').join('\n') + '\n\n';
        }
        const scanList = (scanSpecs || []).map(s =>
            `- ${s.scanId}: ${buildTargetProposalCountRule(s.scanId, s.targets)}`
        ).join('\n');
        ctx += `Selected enhancement scans:\n${scanList}\n`;
        if (retryNote) {
            ctx += `\nRETRY: ${retryNote}\n`;
        }
        return `Chapter: ${chapterTitle || 'Untitled'}

${ctx}
Chapter outline (each [blk-…] is an anchorable body block — headings are NOT anchorable):
${outlineText}

Return one JSON object with a proposals array for each selected scan_id.`;
    }

    function buildScanRetryNote() {
        return 'Previous response had no valid proposals. Return at least ONE high-quality proposal with a mid-section body block anchor in a substantive concept section — not in excluded intro/history/background sections, not the section header, and not the first paragraph unless the section has only one paragraph.';
    }

    function buildIllustrateRetryNote(targets, currentCount) {
        return `Previous response had only ${currentCount} valid proposals. Return at least ${targets.target} illustrate proposals — at least ${targets.minAnalogy} analogy and ${targets.minNews} news/real-world — in different substantive sections.`;
    }

    function buildTargetRetryNote(scanId, targets, currentCount) {
        const min = targets?.min ?? targets?.target ?? 1;
        const max = targets?.max ?? min;
        if (scanId === 'scan_illustrate') {
            return buildIllustrateRetryNote(targets, currentCount);
        }
        return `Previous response had only ${currentCount} valid proposals. Return at least ${min} and up to ${max} ${scanId.replace(/^scan_/, '').replace(/_/g, ' ')} proposals in different substantive sections with valid anchor quotes.`;
    }

    function buildBatchedScanRetryNote(scanSpecs, validationSummary) {
        const lines = (scanSpecs || []).map(spec => {
            const got = validationSummary?.[spec.scanId] ?? 0;
            const min = spec.targets?.min ?? 1;
            if (got >= min) return null;
            return `${spec.scanId}: got ${got}, need at least ${min} valid proposals`;
        }).filter(Boolean);
        return `Previous batched response failed validation. Fix these scan types: ${lines.join('; ')}. Use unique after_block_id values across all scans. Copy anchor_quote verbatim from the cited block. Spread across different sections.`;
    }

    function buildBandDiagnosisSystemPrompt(gradeLevel) {
        return `You are an expert instructional designer analyzing a ${gradeLevel} textbook chapter by MAJOR SECTION BANDS (e.g. 2.3, 2.4 — not subsections like 2.3.1 alone).

Each band may include multiple subsections. Analyze the FULL band text holistically.

Return valid JSON:
{
  "bands": [
    {
      "band_id": "2.3",
      "core_concept": "1-2 sentences: the essential idea(s) students must grasp across this entire band",
      "learning_objective": "What students should learn and be able to apply",
      "misconceptions": ["likely confusion 1", "likely confusion 2"],
      "enhancement_opportunity": "1-2 sentences: where the text is weak for learning (static, no reasoning, compare/contrast missing, etc.)",
      "skip": false
    }
  ]
}

Rules:
- One entry per band_id provided in the user message — do not invent bands.
- If a band is too thin to enhance meaningfully, set skip: true with brief enhancement_opportunity explaining why.
- Cover ALL sub-concepts in a band (e.g. 2.3 must address BOTH prokaryotic and eukaryotic ideas if both appear).
- Stay grade-appropriate for ${gradeLevel}.`;
    }

    function buildBandDiagnosisUserPrompt(bandsText, chapterTitle, excludedBandIds, peerGaps) {
        let ctx = `Chapter: ${chapterTitle || 'Untitled'}\n\n`;
        if (excludedBandIds?.length) {
            ctx += `These band IDs were excluded from enhancement (do not include): ${excludedBandIds.join(', ')}\n\n`;
        }
        if (peerGaps?.length) {
            ctx += 'Peer review gaps:\n' + peerGaps.slice(0, 5).map(g => '- ' + g).join('\n') + '\n\n';
        }
        return `${ctx}Analyze each major section band below:\n\n${bandsText}\n\nReturn one diagnosis object per band_id.`;
    }

    function buildBandRecommendationSystemPrompt(gradeLevel) {
        const weapons = global.DreamBookEnhancementBands?.weaponsCatalogText?.()
            || `- illustrate_analogy, illustrate_news, socratic, counter, case_study, explain_peer, recall, simulation`;
        const maxSims = global.DreamBookEnhancementBands?.MAX_SIMULATIONS_PER_CHAPTER || 1;
        const maxM = global.DreamBookEnhancementBands?.MAX_M_PER_BAND || 2;
        const formatCatalog = global.DreamBookEnhancementBands?.formatsCatalogForPrompt?.() || '';
        return `You are an expert instructional designer recommending interactive enhancement BUNDLES for a ${gradeLevel} textbook chapter.

You receive: (1) per-band diagnoses, (2) insertion candidate menus per band (end-of-band -C menus for non-M, flexible -M menus for M-tier).

Return valid JSON:
{
  "recommendations": [
    {
      "band_id": "2.3",
      "tier": "major",
      "non_m": {
        "feature": "socratic|counter|case_study|explain_peer|recall",
        "format_id": "optional format slug when applicable (socratic, counter, explain_peer)",
        "recall_format": "mcq|match|order — required when feature is recall",
        "candidate_id": "B2_3-C1",
        "title": "short author-facing label",
        "rationale": "2-3 sentences tying the weapon to this band's FULL gap (all subsections)",
        "necessity": "essential|recommended|optional"
      },
      "m_items": [
        {
          "feature": "illustrate_analogy|illustrate_news|simulation",
          "phet_id": "only when feature is simulation",
          "candidate_id": "B2_3-M1",
          "title": "short label",
          "rationale": "1-2 sentences with subsection-specific hook",
          "necessity": "recommended|optional"
        }
      ]
    }
  ]
}

Non-M features (required one per band — pick from -C end-of-band candidates):
- socratic, counter, case_study, explain_peer, recall

M-tier features (0–${maxM} per band — pick from -M flexible candidates; only when gap warrants):
- illustrate_analogy, illustrate_news, simulation

Available features:
${weapons}
${formatCatalog ? `\nFormat slugs (optional format_id per feature):\n${formatCatalog}\n` : ''}

Rules:
- REQUIRED: one bundle per eligible band_id in the diagnosis (skip only if diagnosis.skip is true).
- non_m is REQUIRED for every eligible band — full-band rationale covering ALL subsections.
- m_items: 0–${maxM} items; use only when the band has a strong gap for analogy, news, or PhET. Do NOT max-out every band.
- non_m candidate_id MUST use -C prefix (end of major band). m_items candidate_id MUST use -M prefix (flexible mid-band).
- non_m.feature MUST be one of: socratic, counter, case_study, explain_peer, recall — never illustrate_analogy, illustrate_news, or simulation.
- recall is ALWAYS non_m (never place recall in m_items).
- m_items.feature MUST be one of: illustrate_analogy, illustrate_news, simulation — never socratic, counter, case_study, explain_peer, or recall.
- non_m candidate_id MUST use the highest -C slot in the band menu (e.g. -C2 not -C1 when both exist) unless the band has only one paragraph.
- simulation: ONLY when band PhET list includes a match; include phet_id. Max ${maxSims} simulation in entire chapter.
- illustrate_news: ONLY when you can name a real recent news event; otherwise illustrate_analogy.
- For compare/contrast bands, prefer counter or socratic (format_id what_if) for non_m.
- For process/sequence bands, prefer socratic (coach_debrief or what_if) or recall with recall_format order; for explain_peer non_m, prefer whiteboard_steps over explain_like_im_five.
- For conceptual/abstract bands, prefer explain_like_im_five or teach_sam for explain_peer; recall_format mcq or socratic explain_own_words with a named-student hook.
- When non_m.feature is recall, set recall_format: match for vocabulary, order for multi-step processes, mcq for conceptual checks.
- Vary recall_format across the chapter — do not default every recall to mcq.
- For illustrate_analogy rationales: describe mechanisms students will map — do NOT mandate a specific domain name.
- For counter: rationales must describe debating a flawed but plausible claim.
- For terminology/lists, prefer recall or explain_peer for non_m.
- Spread feature types across the chapter — vary non_m types band to band.
- Vary format_id across bands when possible.
- Do NOT default to cricket, football, or sports analogies. At most ONE sports-based item per chapter.
- For socratic explain_own_words: HOOK must name a student or concrete moment; state misconceptions literally (no "like a" similes).
- For explain_peer teach_sam: SAM SAYS in Sam's first-person voice — not "Some students think…".
- ${AUTHOR_RATIONALE_RULE}
- Stay grade-appropriate for ${gradeLevel}.`;
    }

    function buildBandRecommendationUserPrompt(diagnosisJson, menuText, chapterTitle, retryNote) {
        let ctx = `Chapter: ${chapterTitle || 'Untitled'}\n\n`;
        if (retryNote) ctx += `RETRY: ${retryNote}\n\n`;
        ctx += `Band diagnoses:\n${JSON.stringify(diagnosisJson, null, 2)}\n\n`;
        ctx += `Insertion candidate menus:\n${menuText}\n\n`;
        ctx += 'Return one bundle (non_m + optional m_items) per eligible band_id. Do not skip bands unless diagnosis.skip is true.';
        return ctx;
    }

    function buildFigureImageEnrichmentSystemPrompt(gradeLevel, chapterTitle, options = {}) {
        const interactiveHotspots = options.interactiveHotspots === true;
        const illustrationStyle = options.illustrationStyle === 'flat' ? 'flat' : 'vivid';
        const styleRules = interactiveHotspots
            ? (illustrationStyle === 'flat'
                ? `- Use clean black-line or precise vector scientific illustration — NOT clip-art or cartoon.
- Do NOT include any text labels, leader lines, or letters in the image; structures must be visually distinct for hover hotspots.`
                : `- Use a vivid, polished educational illustration: soft 3D depth, gentle lighting, saturated but accurate biology colors, and visually distinct structures.
- Do NOT include any text labels, leader lines, or letters in the image; structures must be visually distinct for hover hotspots.
- NOT clip-art, cartoon, emoji, or photorealistic microscopy.`)
            : (illustrationStyle === 'flat'
                ? `- If the caption says "line drawing", use clean black-line scientific illustration style — not clip-art or cartoon.
- Specify layout and label every important structure with leader lines.`
                : `- Prefer rich color, soft depth, and clear structure separation while keeping grade-appropriate scientific accuracy.
- Specify layout and label every important structure with leader lines unless interactive hotspots are enabled.`);
        return `You write detailed image-generation prompts for biology textbook figures.

Context:
- Chapter: ${chapterTitle || 'Untitled'}
- Grade level: ${gradeLevel || 'Undergrad Intro'}
- Audience: students studying cell biology / life sciences
- Illustration style: ${illustrationStyle}${interactiveHotspots ? ' (interactive hover labels — no text in image)' : ''}

Rules:
- The FIGURE CAPTION is authoritative. Do NOT change the figure type, scope, or subject described in the caption.
- Section text may ONLY add specific structures, relationships, and layout details that support the caption.
- Do NOT introduce unrelated subjects, scenarios, or figure types not implied by the caption.
- Write a single detailed imagePrompt string (150–400 words) suitable for an AI image model.
- Specify: visual style, layout, structures to show, and (when allowed) label placement with leader lines.
- If the caption says "comparative" or "differences between", specify side-by-side layout.
${styleRules}
- Include all biologically relevant structures named in the section that belong in this figure.
- Terminology must match ${gradeLevel || 'Undergrad Intro'} — detailed but grade-appropriate.
- Do NOT include figure numbers, captions, or titles in the imagePrompt (those appear in the document below the image).
- Do NOT use FIGURE_SCOPE lines or "Figure N.N" prefixes in the imagePrompt.
- The imagePrompt must explicitly state: no bottom caption, no subtitle bar, no footer text, and no "Figure N.N" rendered in the image pixels.
- The imagePrompt MUST instruct that the entire subject fits with clear margins and nothing is cut off at any edge.
- Choose aspectHint for the image canvas:
  - portrait — tall vertical subjects (microscope, equipment, apparatus, stacked process steps, single tall cell or structure)
  - landscape — side-by-side comparisons, timelines, wide pathways, horizontal process flows
  - square — roughly balanced or single centered subject without strong vertical/horizontal dominance

Return JSON only: { "imagePrompt": "...", "aspectHint": "portrait|landscape|square" }`;
    }

    function buildFigureImageEnrichmentUserPrompt({ figureCaption, sectionExcerpt, sectionHeading, chapterTitle, interactiveHotspots, illustrationStyle }) {
        let ctx = `Chapter: ${chapterTitle || 'Untitled'}\n`;
        if (sectionHeading) ctx += `Section: ${sectionHeading}\n`;
        ctx += `\nAUTHORITATIVE FIGURE CAPTION (must not be changed):\n${figureCaption || 'Untitled figure'}\n`;
        if (sectionExcerpt?.trim()) {
            ctx += `\nSECTION TEXT (use only to add accurate structures and labels that support the caption):\n${sectionExcerpt.trim()}\n`;
        }
        const styleNote = interactiveHotspots
            ? `Write imagePrompt and aspectHint JSON for a ${illustrationStyle === 'flat' ? 'clean line-art' : 'vivid, color-rich'} unlabeled biology figure with distinct structures for hover hotspots.`
            : `Write imagePrompt and aspectHint JSON for a detailed, accurately labeled biology textbook diagram that strictly adheres to the caption.`;
        ctx += `\n${styleNote}`;
        return ctx;
    }

    function buildCurrencyCheckSystemPrompt(gradeLevel) {
        return `You are an expert textbook editor performing a CURRENCY CHECK for a ${gradeLevel} chapter.
Your job is to find passages that may be OUTDATED — not unsupported — compared to current science, terminology, figures, or real-world examples.

Differentiate from fact-checking: the passage may have been accurate when written but needs a refresh for a new edition.

Use web search to find recent scholarly sources, reviews, or consensus updates (prefer last 5 years when relevant).
Only cite sources you find via search — do NOT invent DOIs, URLs, or paper titles. If uncertain, return an empty references array and say so in stalenessReason.

Return valid JSON only:
{
  "findings": [
    {
      "sectionHeading": "exact section heading from outline",
      "anchorQuote": "verbatim 1-2 sentence excerpt from that section that may be stale",
      "title": "short label for author (e.g. Outdated terminology)",
      "stalenessReason": "2-3 sentences: why this may need updating and what changed in the field",
      "lastKnownGoodYear": 2019,
      "severity": "optional | update_soon | outdated",
      "references": [
        { "title": "...", "authors": "...", "year": 2023, "url": "https://...", "doi": "..." }
      ]
    }
  ]
}

Rules:
- Return 3–5 findings maximum, prioritized by student impact.
- severity: outdated = likely wrong or misleading today; update_soon = still teachable but aging; optional = nice-to-have refresh.
- Each finding must anchor to a real section heading from the outline.
- Do NOT flag passages that are timeless fundamentals unless terminology genuinely shifted.
- Prefer primary reviews, society statements, or widely cited recent papers over news blogs.`;
    }

    function buildCurrencyCheckUserPrompt(chapterOutlineText, chapterTitle, editionYear) {
        let ctx = `Chapter: ${chapterTitle || 'Untitled'}\n`;
        if (editionYear) ctx += `Textbook edition year (approximate): ${editionYear}\n`;
        ctx += `\nCHAPTER OUTLINE AND EXCERPTS:\n${chapterOutlineText || '(no outline)'}\n`;
        ctx += '\nIdentify outdated or aging passages and suggest recent references authors can use to refresh this chapter.';
        return ctx;
    }

    global.REVIEW_LLM_PROMPTS = {
        SCAN_CATALOG,
        buildPeerReviewSystemPrompt,
        buildPeerReviewUserPrompt,
        buildScanPlacementSystemPrompt,
        buildScanPlacementUserPrompt,
        buildCandidateScanSystemPrompt,
        buildCandidateScanUserPrompt,
        buildCandidateScanRetryNote,
        buildBatchedScanPlacementSystemPrompt,
        buildBatchedScanPlacementUserPrompt,
        buildScanRetryNote,
        buildIllustrateRetryNote,
        buildTargetRetryNote,
        buildBatchedScanRetryNote,
        buildScanPayloadRules,
        buildTargetProposalCountRule,
        buildBandDiagnosisSystemPrompt,
        buildBandDiagnosisUserPrompt,
        buildBandRecommendationSystemPrompt,
        buildBandRecommendationUserPrompt,
        buildFigureImageEnrichmentSystemPrompt,
        buildFigureImageEnrichmentUserPrompt,
        buildCurrencyCheckSystemPrompt,
        buildCurrencyCheckUserPrompt
    };
})(typeof window !== 'undefined' ? window : globalThis);
