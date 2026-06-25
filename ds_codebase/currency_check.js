/**
 * Currency Check — chapter review tool for outdated passages + reference suggestions.
 * Exposed as window.DreamBookCurrencyCheck
 */
(function (global) {
    'use strict';

    const CURRENCY_SEVERITY_LABELS = {
        optional: 'Optional update',
        update_soon: 'Update soon',
        outdated: 'Outdated'
    };

    const VALID_SEVERITIES = new Set(['optional', 'update_soon', 'outdated']);

    function normalizeSeverity(raw) {
        const s = String(raw || '').trim().toLowerCase().replace(/\s+/g, '_');
        if (VALID_SEVERITIES.has(s)) return s;
        if (/outdated|stale|obsolete/.test(s)) return 'outdated';
        if (/soon|aging|aging/.test(s)) return 'update_soon';
        return 'optional';
    }

    function normalizeReference(ref) {
        if (!ref || typeof ref !== 'object') return null;
        const title = String(ref.title || ref.name || '').trim();
        const authors = String(ref.authors || ref.author || '').trim();
        const year = parseInt(ref.year, 10) || null;
        const url = String(ref.url || ref.link || '').trim();
        const doi = String(ref.doi || '').trim();
        if (!title && !authors && !url && !doi) return null;
        const parts = [];
        if (authors) parts.push(authors);
        if (title) parts.push(title);
        if (year) parts.push(String(year));
        const citationLine = parts.join(' — ') || title || url;
        return { title, authors, year, url, doi, citationLine };
    }

    function normalizeCurrencyFinding(raw, index) {
        if (!raw || typeof raw !== 'object') return null;
        const anchorQuote = String(raw.anchorQuote || raw.passage || raw.excerpt || '').trim();
        const sectionHeading = String(raw.sectionHeading || raw.section || '').trim();
        if (!anchorQuote && !sectionHeading) return null;

        const references = (Array.isArray(raw.references) ? raw.references : [])
            .map(normalizeReference)
            .filter(Boolean);

        const severity = normalizeSeverity(raw.severity);
        const stalenessReason = String(raw.stalenessReason || raw.reason || raw.rationale || '').trim();
        const lastKnownGoodYear = parseInt(raw.lastKnownGoodYear || raw.lastGoodYear, 10) || null;
        const title = String(raw.title || '').trim()
            || (severity === 'outdated' ? 'Outdated passage' : 'May need refresh');

        return {
            findingId: raw.findingId || ('currency-' + Date.now() + '-' + index),
            capability: 'currency_flag',
            severity,
            sectionHeading,
            anchorQuote,
            displayPassage: String(raw.displayPassage || anchorQuote).trim(),
            title,
            rationale: stalenessReason || title,
            stalenessReason,
            lastKnownGoodYear,
            references,
            content: '',
            action: 'insert_after',
            status: 'pending'
        };
    }

    function parseCurrencyCheckResponse(text) {
        const raw = String(text || '').trim();
        if (!raw) return [];
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return [];
        try {
            const parsed = JSON.parse(jsonMatch[0]);
            const items = Array.isArray(parsed) ? parsed : (parsed.findings || parsed.items || []);
            if (!Array.isArray(items)) return [];
            return items.map(normalizeCurrencyFinding).filter(Boolean);
        } catch (e) {
            return [];
        }
    }

    function validateCurrencyFinding(finding) {
        if (!finding || finding.capability !== 'currency_flag') {
            return { ok: false, reason: 'Not a currency finding' };
        }
        if (!finding.anchorQuote?.trim() && !finding.sectionHeading?.trim()) {
            return { ok: false, reason: 'Missing passage anchor' };
        }
        if (!finding.stalenessReason?.trim() && !finding.rationale?.trim()) {
            return { ok: false, reason: 'Missing staleness reason' };
        }
        if (!VALID_SEVERITIES.has(finding.severity)) {
            return { ok: false, reason: 'Invalid severity' };
        }
        return { ok: true };
    }

    function buildMockCurrencyFindings(sectionHeadings, helpers) {
        const getAnchor = helpers?.getSectionAnchorQuote || (() => '');
        const getPassage = helpers?.getSectionDisplayPassage || ((h) => h);

        const mockRefs = [
            [
                { title: 'Revised endosymbiotic theory and plastid evolution', authors: 'Keeling P.J.', year: 2023, url: 'https://doi.org/10.1038/s41576-023-00612-4' },
                { title: 'Organelle genomes in eukaryotes', authors: 'Smith D.R.', year: 2022, url: 'https://doi.org/10.1093/molbev/msac045' }
            ],
            [
                { title: 'CRISPR and genome editing in cell biology curricula', authors: 'Doudna J.A.', year: 2024, url: 'https://doi.org/10.1126/science.adk1234' }
            ],
            [
                { title: 'Updated ribosome structure and translation mechanisms', authors: 'Ramakrishnan V.', year: 2023, url: 'https://doi.org/10.1016/j.cell.2023.01.012' },
                { title: '70S vs 80S ribosomes — current consensus', authors: 'Ban N.', year: 2021, url: 'https://doi.org/10.1038/s41586-021-03456-7' }
            ]
        ];

        const severities = ['update_soon', 'outdated', 'optional'];
        const reasons = [
            'Endosymbiotic evidence and organelle genome terminology have shifted since many textbook editions — circular DNA and independent replication are now framed with clearer phylogenetic context.',
            'Gene-editing examples often cite pre-CRISPR-era techniques; students expect current methods and named tools when discussing genetic modification.',
            'Ribosome subunit descriptions and structural detail have been refined by cryo-EM — wording may oversimplify current models.'
        ];

        return sectionHeadings.slice(0, 3).map((heading, i) => {
            const anchorQuote = getAnchor(heading);
            const refs = (mockRefs[i] || []).map(normalizeReference).filter(Boolean);
            return normalizeCurrencyFinding({
                sectionHeading: heading,
                anchorQuote,
                displayPassage: getPassage(heading),
                title: severities[i] === 'outdated' ? 'Outdated terminology' : 'Reference refresh suggested',
                stalenessReason: reasons[i],
                severity: severities[i],
                lastKnownGoodYear: [2018, 2016, 2019][i],
                references: refs
            }, i);
        }).filter(Boolean);
    }

    function formatReferenceListHtml(references, escapeHtml) {
        const esc = escapeHtml || (s => String(s || ''));
        const refs = (references || []).filter(Boolean);
        if (!refs.length) {
            return '<p class="review-currency-no-refs">No references returned — verify externally before updating.</p>';
        }
        return `<ul class="review-currency-ref-list">${refs.map((ref, i) => {
            const line = ref.citationLine || ref.title || ref.url;
            const link = ref.url
                ? `<a href="${esc(ref.url)}" target="_blank" rel="noopener noreferrer">${esc(line)}</a>`
                : esc(line);
            const doi = ref.doi ? `<span class="review-currency-doi">DOI: ${esc(ref.doi)}</span>` : '';
            return `<li class="review-currency-ref-item" data-ref-index="${i}">${link}${doi ? `<br>${doi}` : ''}</li>`;
        }).join('')}</ul>`;
    }

    function getSeverityLabel(severity) {
        return CURRENCY_SEVERITY_LABELS[normalizeSeverity(severity)] || CURRENCY_SEVERITY_LABELS.optional;
    }

    global.DreamBookCurrencyCheck = {
        CURRENCY_SEVERITY_LABELS,
        VALID_SEVERITIES,
        normalizeSeverity,
        normalizeReference,
        normalizeCurrencyFinding,
        parseCurrencyCheckResponse,
        validateCurrencyFinding,
        buildMockCurrencyFindings,
        formatReferenceListHtml,
        getSeverityLabel
    };
})(typeof window !== 'undefined' ? window : globalThis);
