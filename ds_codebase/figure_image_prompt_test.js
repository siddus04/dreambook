/**
 * Figure image prompt sanitization (run: node figure_image_prompt_test.js)
 * Mirrors logic in editor.html — keep in sync when changing prompt helpers.
 */
'use strict';

function parseFigureCaptionText(rawText) {
    const text = String(rawText || '').replace(/\s+/g, ' ').trim();
    const match = text.match(/\[?\s*Figure\s*([\d.]+)\s*:\s*([^\]]+)\]?/i);
    if (!match) return null;
    return {
        figureId: match[1],
        caption: `Figure ${match[1]}: ${match[2].trim()}`
    };
}

function extractFigureSubjectFromCaption(caption) {
    const parsed = parseFigureCaptionText(caption);
    if (parsed) {
        return {
            figureId: parsed.figureId,
            subject: parsed.caption.replace(/^Figure\s*[\d.]+\s*:\s*/i, '').trim()
        };
    }
    const clean = String(caption || '').replace(/^\[|\]$/g, '').trim();
    const match = clean.match(/^Figure\s*([\d.]+)\s*:\s*(.+)$/i);
    if (match) {
        return { figureId: match[1], subject: match[2].trim() };
    }
    return { figureId: null, subject: clean.replace(/^Figure\s*[\d.]+\s*:\s*/i, '').trim() || clean };
}

function stripFigureScopeMetadata(text) {
    return String(text || '')
        .split('\n')
        .filter(line => !/^\s*FIGURE_SCOPE\s*:/i.test(line.trim()))
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function sanitizeImageModelPrompt(text) {
    let out = stripFigureScopeMetadata(text);
    out = out.replace(/\b(include|add|render|show|put)\s+(a\s+)?(the\s+)?(bottom\s+)?(caption|subtitle|figure title|figure number).*$/gim, '');
    out = out.replace(/\b(caption|subtitle)\s+(at|on|in)\s+(the\s+)?(bottom|footer).*$/gim, '');
    return out.replace(/\n{3,}/g, '\n\n').trim();
}

function extractIllustrationSubject(text, figureCaption) {
    const raw = figureCaption || text || '';
    const { subject } = extractFigureSubjectFromCaption(raw);
    if (subject?.trim()) return subject.trim();
    return sanitizeImageModelPrompt(String(text || '').trim());
}

const IMAGE_NO_SUBTITLE_RULES = `- Do NOT render any bottom caption bar, subtitle strip, footer text, or "Figure N.N" anywhere in the image pixels
- The document caption appears below the image in HTML — draw the diagram only
- No title band, page number, or paragraph text in the image`;

function buildStructuredFigureFallbackPrompt(caption, options = {}) {
    const { subject } = extractFigureSubjectFromCaption(caption);
    const subj = subject || String(caption || '').trim();
    const interactiveHotspots = options.interactiveHotspots === true;
    const style = options.illustrationStyle === 'flat' ? 'flat' : 'vivid';
    const styleLine = style === 'flat'
        ? 'Modern clean black-line scientific illustration for a biology textbook'
        : 'Vivid color-rich educational illustration with soft 3D depth and distinct structures';
    let layout = interactiveHotspots
        ? 'Center the subject with generous margins; leave each major structure visually distinct'
        : 'Center the subject with generous margins; label all important structures with thin leader lines';
    if (/\bmicroscope|\bhooke\b/i.test(subj)) {
        layout = 'Portrait-oriented illustration of historical microscope apparatus or observation setup';
    }
    return [
        `Illustrate only: ${subj}`,
        styleLine,
        layout,
        interactiveHotspots ? 'No text labels in the image — structures only' : '',
        IMAGE_NO_SUBTITLE_RULES,
        'Soft off-white or very light neutral background only.'
    ].filter(Boolean).join('\n');
}

function buildImageGenerationPromptSubjectLine(userPrompt, figureCaption) {
    return sanitizeImageModelPrompt(extractIllustrationSubject(userPrompt, figureCaption));
}

let passed = 0;
let failed = 0;

function assert(cond, msg) {
    if (cond) { passed++; return; }
    failed++;
    console.error('FAIL:', msg);
}

const scopeSample = 'FIGURE_SCOPE: Figure 2.1 — Hooke early microscope [finding-abc]\n\nLine drawing of apparatus.';
assert(!stripFigureScopeMetadata(scopeSample).includes('FIGURE_SCOPE'), 'stripFigureScopeMetadata removes FIGURE_SCOPE');

assert(
    extractIllustrationSubject('Figure 2.1: Hooke early microscope') === 'Hooke early microscope',
    'extractIllustrationSubject strips figure prefix'
);

const fallback = buildStructuredFigureFallbackPrompt('Figure 2.1: Hooke early microscope');
assert(!fallback.includes('FIGURE_SCOPE'), 'fallback prompt has no FIGURE_SCOPE');
assert(!fallback.includes('Figure 2.1:'), 'fallback prompt has no figure number prefix');
assert(fallback.includes('Illustrate only: Hooke early microscope'), 'fallback uses subject-only scope');

const subjectLine = buildImageGenerationPromptSubjectLine(
    'FIGURE_SCOPE: Figure 2.1 — Hooke early microscope\n\nPortrait microscope diagram',
    'Figure 2.1: Hooke early microscope'
);
assert(!subjectLine.includes('FIGURE_SCOPE'), 'subject line strips FIGURE_SCOPE');
assert(!subjectLine.startsWith('Figure 2.1:'), 'subject line has no figure prefix');
assert(subjectLine.includes('Hooke early microscope'), 'subject line keeps subject text');

assert(sanitizeImageModelPrompt('Add caption at bottom of image').length < 30, 'sanitize removes caption-at-bottom phrase');

assert(IMAGE_NO_SUBTITLE_RULES.includes('subtitle strip'), 'anti-subtitle rules defined');

console.log(`figure_image_prompt_test: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
