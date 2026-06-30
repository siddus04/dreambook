/**
 * DreamBook Studio — display equation blocks (KaTeX / Describe / Image).
 * Loaded before editor.html inline script; calls editor globals at runtime.
 */
(function () {
    'use strict';

    const KATEX_EXAMPLES = {
        quadratic: 'x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}',
        maxwell: '\\nabla\\cdot\\mathbf{E}=\\frac{\\rho}{\\varepsilon_0}',
        piecewise: 'f(x)=\\begin{cases}x^2 & x\\geq 0\\\\ -x & x<0\\end{cases}'
    };

    const DESCRIBE_SUGGESTIONS = [
        'Quadratic formula',
        'Integral of sin x',
        'Matrix 2×2'
    ];

    const MOCK_DESCRIBE = {
        'quadratic formula': KATEX_EXAMPLES.quadratic,
        'integral of sin x': '\\int \\sin x\\, dx = -\\cos x + C',
        'matrix 2×2': '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}'
    };

    const modalState = {
        open: false,
        tab: 'katex',
        latex: '',
        editingBlock: null,
        imageFile: null,
        imageDataUrl: null,
        generating: false
    };

    function escapeHtml(str) {
        if (typeof window.escapeHtml === 'function') return window.escapeHtml(str);
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function encodeLatexAttr(latex) {
        return escapeHtml(String(latex || ''));
    }

    function decodeLatexAttr(encoded) {
        const el = document.createElement('textarea');
        el.innerHTML = String(encoded || '');
        return el.value;
    }

    function isStudentMode() {
        return window.state?.copilotMode === 'student';
    }

    function isEquationIntent(text) {
        return /\b(equation|formula|latex|katex|integral|maxwell|quadratic|matrix|derivative|fraction)\b/i.test(String(text || ''));
    }

    function extractLatexFromCopilot(raw) {
        const text = String(raw || '');
        const fenced = text.match(/```(?:latex|tex)\s*\n([\s\S]*?)```/i);
        if (fenced) return fenced[1].trim();
        const anyFence = text.match(/```\s*\n([\s\S]*?)```/);
        if (anyFence && /\\|[\^_]|\\frac|\\begin/.test(anyFence[1])) return anyFence[1].trim();
        return '';
    }

    function getCopilotPromptAddon(userMessage) {
        if (!isEquationIntent(userMessage)) return '';
        return `\n\nEQUATION INSERT MODE:
When the author asks for an equation or formula to insert, respond with a brief note (optional), then a line \`---\`, then a fenced LaTeX block:

\`\`\`latex
...KaTeX source only, no $ delimiters...
\`\`\`

Use valid KaTeX. Do not wrap in display math delimiters. No prose inside the fence.`;
    }

    function getMockCopilotEquationResponse(message) {
        const lower = String(message || '').toLowerCase();
        if (lower.includes('quadratic')) {
            return `Here is the quadratic formula in standard form:\n\n---\n\`\`\`latex\n${KATEX_EXAMPLES.quadratic}\n\`\`\``;
        }
        if (lower.includes('maxwell')) {
            return `Gauss's law for electricity (first Maxwell equation):\n\n---\n\`\`\`latex\n${KATEX_EXAMPLES.maxwell}\n\`\`\``;
        }
        if (lower.includes('integral') && lower.includes('sin')) {
            return `---\n\`\`\`latex\n\\int \\sin x\\, dx = -\\cos x + C\n\`\`\``;
        }
        return `---\n\`\`\`latex\n${KATEX_EXAMPLES.quadratic}\n\`\`\``;
    }

    function validateLatex(latex) {
        if (!latex || !String(latex).trim()) return { ok: false, error: 'Enter an equation.' };
        if (typeof katex === 'undefined') return { ok: false, error: 'KaTeX is not loaded.' };
        try {
            katex.renderToString(String(latex).trim(), { displayMode: true, throwOnError: true });
            return { ok: true, error: '' };
        } catch (err) {
            return { ok: false, error: err.message || 'Invalid KaTeX.' };
        }
    }

    function renderPreviewInto(el, latex) {
        if (!el) return validateLatex(latex);
        el.innerHTML = '';
        const result = validateLatex(latex);
        if (!result.ok) {
            el.innerHTML = `<span class="text-error text-sm">${escapeHtml(result.error)}</span>`;
            return result;
        }
        try {
            katex.render(String(latex).trim(), el, { displayMode: true, throwOnError: true });
        } catch (err) {
            el.innerHTML = `<span class="text-error text-sm">${escapeHtml(err.message || 'Render error')}</span>`;
            return { ok: false, error: err.message };
        }
        return result;
    }

    function buildEquationBlockHTML(latex) {
        const safe = encodeLatexAttr(String(latex || '').trim());
        return `<div class="equation-block my-6 flex justify-center rounded-lg border border-transparent hover:border-border/60 transition-colors cursor-pointer" contenteditable="false" data-type="equation" data-latex="${safe}"><div class="equation-block-preview px-2"></div></div>`;
    }

    function hydrateBlock(block) {
        if (!block?.classList?.contains('equation-block')) return;
        const preview = block.querySelector('.equation-block-preview');
        const latex = decodeLatexAttr(block.getAttribute('data-latex') || '');
        renderPreviewInto(preview, latex);
    }

    function hydrateAll(rootEl) {
        const root = rootEl || document.getElementById('editor');
        if (!root) return;
        root.querySelectorAll('.equation-block').forEach(hydrateBlock);
    }

    function bindEquationBlock(block) {
        if (!block || block.dataset.equationBound === 'true') return;
        block.dataset.equationBound = 'true';

        block.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isStudentMode()) return;
            document.querySelectorAll('#editor .equation-block.is-selected').forEach((el) => {
                if (el !== block) el.classList.remove('is-selected');
            });
            block.classList.add('is-selected');
        });

        block.addEventListener('dblclick', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isStudentMode()) return;
            const latex = decodeLatexAttr(block.getAttribute('data-latex') || '');
            openModal({ latex, tab: 'katex', editingBlock: block });
        });
    }

    function initEquationBlocks(root) {
        const container = root || document.getElementById('editor');
        if (!container) return;
        hydrateAll(container);
        container.querySelectorAll('.equation-block').forEach(bindEquationBlock);
    }

    function captureInsertAnchor() {
        if (typeof window.captureCursorInsertRange === 'function') {
            const range = window.captureCursorInsertRange();
            if (range && typeof window.getBlockElementForRange === 'function') {
                window.state = window.state || {};
                window.state.aiInsertAnchorBlock = window.getBlockElementForRange(range);
            }
        }
    }

    function insertBlock(latex, opts) {
        opts = opts || {};
        const trimmed = String(latex || '').trim();
        const validation = validateLatex(trimmed);
        if (!validation.ok) {
            if (typeof window.showReviewToast === 'function') {
                window.showReviewToast(validation.error, true);
            }
            return null;
        }

        if (opts.editingBlock) {
            opts.editingBlock.setAttribute('data-latex', encodeLatexAttr(trimmed));
            hydrateBlock(opts.editingBlock);
            if (typeof window.saveCurrentChapterState === 'function') window.saveCurrentChapterState();
            if (typeof window.saveBook === 'function') window.saveBook({ markDirty: true });
            return opts.editingBlock;
        }

        const html = buildEquationBlockHTML(trimmed);
        let inserted = null;

        if (typeof window.insertHTMLBelowAnchor === 'function') {
            inserted = window.insertHTMLBelowAnchor(html, {
                placement: opts.placement || (typeof window.getCopilotInsertPlacementSnapshot === 'function'
                    ? window.getCopilotInsertPlacementSnapshot()
                    : {}),
                promptPlacement: opts.promptPlacement !== false
            });
        }

        if (!inserted) {
            const anchor = opts.anchorBlock || window.state?.aiInsertAnchorBlock;
            if (anchor && typeof window.insertHTMLAfterEditorBlock === 'function') {
                inserted = window.insertHTMLAfterEditorBlock(anchor, html);
            } else {
                const editor = document.getElementById('editor');
                if (editor) {
                    editor.insertAdjacentHTML('beforeend', html);
                    inserted = editor.lastElementChild;
                    if (typeof window.assignBlockIdsToNewNodes === 'function') {
                        window.assignBlockIdsToNewNodes(inserted);
                    }
                }
            }
        }

        if (inserted) {
            bindEquationBlock(inserted);
            hydrateBlock(inserted);
            if (typeof window.saveCurrentChapterState === 'function') window.saveCurrentChapterState();
            if (typeof window.saveBook === 'function') window.saveBook({ markDirty: true });
            if (opts.fromCopilot && typeof window.finalizeCopilotEditorInsert === 'function') {
                window.finalizeCopilotEditorInsert(inserted, opts.title || '');
            }
            if (inserted.scrollIntoView) {
                inserted.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
        return inserted;
    }

    function injectStyles() {
        if (document.getElementById('dreambook-equation-styles')) return;
        const style = document.createElement('style');
        style.id = 'dreambook-equation-styles';
        style.textContent = `
            .equation-block.is-selected { border-color: rgb(46 76 185 / 0.45) !important; background: rgb(238 241 251 / 0.5); }
            .equation-block-preview .katex { font-size: 1.15em; }
            .equation-modal-tab.active { border-color: #2E4CB9; color: #2E4CB9; background: #EEF1FB; }
            .equation-example-chip { font-size: 0.75rem; padding: 0.25rem 0.625rem; border-radius: 9999px; border: 1px solid #E5E7EB; color: #6B7280; cursor: pointer; }
            .equation-example-chip:hover { border-color: #2E4CB9; color: #2E4CB9; background: #EEF1FB; }
            .equation-drop-zone.drag-over { border-color: #2E4CB9; background: #EEF1FB; }
        `;
        document.head.appendChild(style);
    }

    function injectModal() {
        if (document.getElementById('equation-modal')) return;
        const mount = document.createElement('div');
        mount.innerHTML = `
<div id="equation-modal" class="hidden fixed inset-0 z-[210] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="equation-modal-title">
  <div class="bg-surface rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-border">
    <div class="flex border-b border-border px-2 pt-2 gap-1">
      <button type="button" data-eq-tab="katex" class="equation-modal-tab active flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-sm font-medium rounded-t-lg border border-transparent text-text-secondary">
        <span class="material-symbols-outlined text-base">functions</span> KaTeX
      </button>
      <button type="button" data-eq-tab="describe" class="equation-modal-tab flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-sm font-medium rounded-t-lg border border-transparent text-text-secondary">
        <span class="material-symbols-outlined text-base">auto_awesome</span> Describe
      </button>
      <button type="button" data-eq-tab="image" class="equation-modal-tab flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-sm font-medium rounded-t-lg border border-transparent text-text-secondary">
        <span class="material-symbols-outlined text-base">image</span> Image
      </button>
    </div>
    <div class="p-5">
      <div id="equation-panel-katex" class="equation-panel">
        <textarea id="equation-katex-input" class="w-full min-h-[88px] p-3 border-2 border-primary/30 rounded-xl text-sm font-mono resize-y focus:outline-none focus:border-primary" placeholder="Type KaTeX equation..." spellcheck="false"></textarea>
        <div class="mt-3 text-xs text-text-tertiary uppercase tracking-wide">Example formulas</div>
        <div class="mt-2 flex flex-wrap gap-2">
          <button type="button" class="equation-example-chip" data-katex-example="quadratic">Quadratic</button>
          <button type="button" class="equation-example-chip" data-katex-example="maxwell">Maxwell's</button>
          <button type="button" class="equation-example-chip" data-katex-example="piecewise">Piecewise</button>
        </div>
      </div>
      <div id="equation-panel-describe" class="equation-panel hidden">
        <textarea id="equation-describe-input" class="w-full min-h-[88px] p-3 border-2 border-primary/30 rounded-xl text-sm resize-y focus:outline-none focus:border-primary" placeholder="Describe your equation in plain English..." spellcheck="true"></textarea>
        <div class="mt-3 text-xs text-text-tertiary uppercase tracking-wide">Try describing</div>
        <div class="mt-2 flex flex-wrap gap-2">
          ${DESCRIBE_SUGGESTIONS.map((s) => `<button type="button" class="equation-example-chip" data-describe-suggest="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join('')}
        </div>
        <button type="button" id="equation-generate-btn" class="mt-4 w-full py-2.5 rounded-xl text-sm font-medium bg-primary/40 text-white cursor-not-allowed" disabled>Generate</button>
      </div>
      <div id="equation-panel-image" class="equation-panel hidden">
        <div id="equation-drop-zone" class="equation-drop-zone border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 transition-colors" tabindex="0">
          <span class="material-symbols-outlined text-3xl text-text-tertiary">image</span>
          <p class="mt-2 text-sm font-medium text-text-primary">Paste or drop an image</p>
          <p class="text-xs text-text-tertiary mt-1">PNG, JPG up to 5MB</p>
          <button type="button" id="equation-browse-btn" class="mt-3 text-sm text-primary hover:underline">Browse files</button>
          <input type="file" id="equation-file-input" class="hidden" accept="image/png,image/jpeg,image/jpg" />
        </div>
        <div id="equation-image-preview-wrap" class="hidden mt-3">
          <img id="equation-image-preview" class="max-h-32 mx-auto rounded border border-border" alt="Equation image preview" />
        </div>
        <button type="button" id="equation-image-generate-btn" class="mt-4 w-full py-2.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-dark hidden">Generate from image</button>
      </div>
      <div class="mt-4 p-3 rounded-xl bg-surface-secondary border border-border min-h-[52px] flex items-center justify-center overflow-x-auto" id="equation-live-preview" aria-live="polite"></div>
      <p id="equation-error-msg" class="hidden mt-2 text-xs text-error"></p>
    </div>
    <div class="flex items-center justify-between px-5 py-4 border-t border-border bg-surface-secondary/50">
      <button type="button" id="equation-close-btn" class="text-sm text-text-secondary hover:text-text-primary">Esc Close</button>
      <button type="button" id="equation-done-btn" class="px-5 py-2 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed" disabled>Done</button>
    </div>
  </div>
</div>`;
        document.body.appendChild(mount.firstElementChild);
        bindModalEvents();
    }

    function getModalEl(id) {
        return document.getElementById(id);
    }

    function setTab(tab) {
        modalState.tab = tab;
        document.querySelectorAll('.equation-modal-tab').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.eqTab === tab);
        });
        document.querySelectorAll('.equation-panel').forEach((panel) => {
            panel.classList.add('hidden');
        });
        const panel = getModalEl(`equation-panel-${tab}`);
        if (panel) panel.classList.remove('hidden');
        syncDoneButton();
        updateLivePreview();
    }

    function currentLatexSource() {
        return modalState.latex || getModalEl('equation-katex-input')?.value || '';
    }

    function updateLivePreview() {
        const preview = getModalEl('equation-live-preview');
        const errEl = getModalEl('equation-error-msg');
        const latex = currentLatexSource();
        const result = renderPreviewInto(preview, latex);
        if (errEl) {
            if (!latex.trim()) {
                errEl.classList.add('hidden');
            } else if (!result.ok) {
                errEl.textContent = result.error;
                errEl.classList.remove('hidden');
            } else {
                errEl.classList.add('hidden');
            }
        }
        syncDoneButton();
    }

    function syncDoneButton() {
        const doneBtn = getModalEl('equation-done-btn');
        const genBtn = getModalEl('equation-generate-btn');
        const describeInput = getModalEl('equation-describe-input');
        const latex = currentLatexSource();
        const valid = validateLatex(latex).ok;
        if (doneBtn) doneBtn.disabled = !valid;
        if (genBtn && describeInput) {
            const hasText = !!describeInput.value.trim();
            genBtn.disabled = !hasText || modalState.generating;
            genBtn.classList.toggle('cursor-not-allowed', genBtn.disabled);
            genBtn.classList.toggle('bg-primary/40', genBtn.disabled);
            genBtn.classList.toggle('bg-primary', !genBtn.disabled);
            genBtn.classList.toggle('hover:bg-primary-dark', !genBtn.disabled);
        }
    }

    function mockDescribeLatex(description) {
        const lower = String(description || '').toLowerCase();
        for (const [key, latex] of Object.entries(MOCK_DESCRIBE)) {
            if (lower.includes(key.split(' ')[0]) && (key === 'quadratic formula' ? lower.includes('quadratic') : lower.includes(key.replace('×', '')))) {
                return latex;
            }
        }
        if (lower.includes('quadratic')) return MOCK_DESCRIBE['quadratic formula'];
        if (lower.includes('integral') || lower.includes('sin')) return MOCK_DESCRIBE['integral of sin x'];
        if (lower.includes('matrix')) return MOCK_DESCRIBE['matrix 2×2'];
        return KATEX_EXAMPLES.quadratic;
    }

    async function describeToLatex(description) {
        const text = String(description || '').trim();
        if (!text) throw new Error('Describe the equation first.');

        if (!window.state?.apiKey) {
            await new Promise((r) => setTimeout(r, 600));
            return mockDescribeLatex(text);
        }

        const messages = [
            {
                role: 'system',
                content: 'You convert plain-English math descriptions into KaTeX LaTeX for display equations. Return ONLY valid JSON: {"latex":"..."}. No $ delimiters. No markdown. Valid KaTeX only.'
            },
            { role: 'user', content: text }
        ];

        let raw = '';
        if (typeof window.fetchStreamingChatMessages === 'function') {
            raw = await window.fetchStreamingChatMessages(messages, {
                max_tokens: 300,
                temperature: 0.2,
                mockText: () => JSON.stringify({ latex: mockDescribeLatex(text) })
            });
        } else {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.state.apiKey}`
                },
                body: JSON.stringify({
                    model: window.state?.model || 'gpt-4o',
                    messages,
                    max_tokens: 300,
                    temperature: 0.2
                })
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error?.message || `API Error ${response.status}`);
            }
            const data = await response.json();
            raw = data.choices?.[0]?.message?.content || '';
        }

        return parseLatexJson(raw);
    }

    async function imageToLatex(file) {
        if (!file) throw new Error('Choose an image first.');
        if (file.size > 5 * 1024 * 1024) throw new Error('Image must be 5MB or smaller.');

        const dataUrl = await readFileAsDataUrl(file);
        if (!window.state?.apiKey) {
            await new Promise((r) => setTimeout(r, 800));
            return KATEX_EXAMPLES.quadratic;
        }

        const base64 = dataUrl.split(',')[1];
        const mimeType = file.type || 'image/png';

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.state.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [{
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: 'Convert the equation in this image to KaTeX LaTeX for a display equation. Return ONLY JSON: {"latex":"..."}. No $ delimiters. Valid KaTeX only.'
                        },
                        {
                            type: 'image_url',
                            image_url: { url: `data:${mimeType};base64,${base64}` }
                        }
                    ]
                }],
                max_tokens: 500,
                temperature: 0
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error?.message || `Vision API Error ${response.status}`);
        }
        const data = await response.json();
        return parseLatexJson(data.choices?.[0]?.message?.content || '');
    }

    function parseLatexJson(raw) {
        const text = String(raw || '').trim();
        const jsonMatch = text.match(/\{[\s\S]*"latex"[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.latex) return String(parsed.latex).trim();
            } catch (_) { /* fall through */ }
        }
        const codeMatch = text.match(/```(?:latex|tex|json)?\s*\n?([\s\S]*?)```/i);
        if (codeMatch) return codeMatch[1].trim();
        if (/\\|[\^_]/.test(text)) return text;
        throw new Error('Could not parse LaTeX from response.');
    }

    function readFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Failed to read image.'));
            reader.readAsDataURL(file);
        });
    }

    function applyLatexToModal(latex) {
        modalState.latex = String(latex || '').trim();
        const katexInput = getModalEl('equation-katex-input');
        if (katexInput) katexInput.value = modalState.latex;
        setTab('katex');
        updateLivePreview();
    }

    async function onGenerateDescribe() {
        const input = getModalEl('equation-describe-input');
        const genBtn = getModalEl('equation-generate-btn');
        if (!input?.value.trim()) return;
        modalState.generating = true;
        if (genBtn) genBtn.textContent = 'Generating…';
        syncDoneButton();
        try {
            const latex = await describeToLatex(input.value.trim());
            applyLatexToModal(latex);
        } catch (err) {
            if (typeof window.showReviewToast === 'function') {
                window.showReviewToast(err.message || 'Generation failed.', true);
            }
        } finally {
            modalState.generating = false;
            if (genBtn) genBtn.textContent = 'Generate';
            syncDoneButton();
        }
    }

    async function onGenerateImage() {
        const btn = getModalEl('equation-image-generate-btn');
        if (!modalState.imageFile) return;
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Generating…';
        }
        try {
            const latex = await imageToLatex(modalState.imageFile);
            applyLatexToModal(latex);
        } catch (err) {
            if (typeof window.showReviewToast === 'function') {
                window.showReviewToast(err.message || 'Image conversion failed.', true);
            }
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Generate from image';
            }
        }
    }

    function handleImageFile(file) {
        if (!file || !/^image\/(png|jpe?g)$/i.test(file.type)) {
            if (typeof window.showReviewToast === 'function') {
                window.showReviewToast('Use PNG or JPG.', true);
            }
            return;
        }
        modalState.imageFile = file;
        readFileAsDataUrl(file).then((url) => {
            modalState.imageDataUrl = url;
            const wrap = getModalEl('equation-image-preview-wrap');
            const img = getModalEl('equation-image-preview');
            const genBtn = getModalEl('equation-image-generate-btn');
            if (img) img.src = url;
            if (wrap) wrap.classList.remove('hidden');
            if (genBtn) genBtn.classList.remove('hidden');
        });
    }

    function bindModalEvents() {
        document.querySelectorAll('.equation-modal-tab').forEach((btn) => {
            btn.addEventListener('click', () => setTab(btn.dataset.eqTab));
        });

        getModalEl('equation-katex-input')?.addEventListener('input', (e) => {
            modalState.latex = e.target.value;
            updateLivePreview();
        });

        getModalEl('equation-describe-input')?.addEventListener('input', syncDoneButton);

        document.querySelectorAll('[data-katex-example]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.katexExample;
                applyLatexToModal(KATEX_EXAMPLES[key] || '');
            });
        });

        document.querySelectorAll('[data-describe-suggest]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const input = getModalEl('equation-describe-input');
                if (input) input.value = btn.dataset.describeSuggest || btn.textContent;
                syncDoneButton();
            });
        });

        getModalEl('equation-generate-btn')?.addEventListener('click', onGenerateDescribe);
        getModalEl('equation-image-generate-btn')?.addEventListener('click', onGenerateImage);

        getModalEl('equation-close-btn')?.addEventListener('click', closeModal);
        getModalEl('equation-done-btn')?.addEventListener('click', () => {
            const latex = currentLatexSource();
            insertBlock(latex, { editingBlock: modalState.editingBlock });
            closeModal();
        });

        getModalEl('equation-browse-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            getModalEl('equation-file-input')?.click();
        });

        getModalEl('equation-file-input')?.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (file) handleImageFile(file);
        });

        const dropZone = getModalEl('equation-drop-zone');
        dropZone?.addEventListener('click', () => getModalEl('equation-file-input')?.click());
        dropZone?.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        dropZone?.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
        dropZone?.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            const file = e.dataTransfer?.files?.[0];
            if (file) handleImageFile(file);
        });

        document.addEventListener('paste', (e) => {
            if (!modalState.open || modalState.tab !== 'image') return;
            const items = e.clipboardData?.items || [];
            for (const item of items) {
                if (item.type.startsWith('image/')) {
                    e.preventDefault();
                    const file = item.getAsFile();
                    if (file) handleImageFile(file);
                    break;
                }
            }
        });
    }

    function openModal(opts) {
        opts = opts || {};
        injectModal();
        captureInsertAnchor();
        if (typeof window.hideSelectionMenus === 'function') window.hideSelectionMenus();

        modalState.editingBlock = opts.editingBlock || null;
        modalState.latex = opts.latex || '';
        modalState.imageFile = null;
        modalState.imageDataUrl = null;
        modalState.generating = false;

        const katexInput = getModalEl('equation-katex-input');
        const describeInput = getModalEl('equation-describe-input');
        if (katexInput) katexInput.value = modalState.latex;
        if (describeInput) describeInput.value = '';

        getModalEl('equation-image-preview-wrap')?.classList.add('hidden');
        getModalEl('equation-image-generate-btn')?.classList.add('hidden');
        const fileInput = getModalEl('equation-file-input');
        if (fileInput) fileInput.value = '';

        setTab(opts.tab || 'katex');
        getModalEl('equation-modal')?.classList.remove('hidden');
        modalState.open = true;
        katexInput?.focus();
    }

    function closeModal() {
        getModalEl('equation-modal')?.classList.add('hidden');
        modalState.open = false;
        modalState.editingBlock = null;
        document.getElementById('editor')?.focus();
    }

    function isModalOpen() {
        const modal = getModalEl('equation-modal');
        return modal && !modal.classList.contains('hidden');
    }

    function formatCopilotPreview(rawMarkdown) {
        const latex = extractLatexFromCopilot(rawMarkdown);
        if (!latex) return null;
        const text = String(rawMarkdown || '');
        const sepMatch = text.match(/\n---+\s*\n/);
        let prose = sepMatch ? text.slice(0, sepMatch.index).trim() : text.replace(/```(?:latex|tex)?[\s\S]*?```/gi, '').trim();
        prose = prose.replace(/```[\s\S]*?```/g, '').trim();

        const previewId = 'eq-copilot-preview-' + Date.now();
        let html = `<div class="my-2 p-3 rounded-lg border border-border bg-surface-secondary"><div class="text-xs text-text-tertiary mb-2 uppercase tracking-wide">Equation preview</div><div id="${previewId}" class="flex justify-center overflow-x-auto"></div></div>`;
        if (prose && typeof window.markdownToEditorHTML === 'function') {
            html += window.markdownToEditorHTML(prose, { preview: true });
        } else if (prose) {
            html += `<p class="text-sm">${escapeHtml(prose)}</p>`;
        }
        requestAnimationFrame(() => {
            const el = document.getElementById(previewId);
            if (el) renderPreviewInto(el, latex);
        });
        return html;
    }

    function init() {
        injectStyles();
        injectModal();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.DreamBookEquations = {
        openModal,
        closeModal,
        isModalOpen,
        insertBlock,
        hydrateAll,
        initEquationBlocks,
        extractLatexFromCopilot,
        formatCopilotPreview,
        getCopilotPromptAddon,
        isEquationIntent,
        getMockCopilotEquationResponse
    };

    window.openEquationModal = function () {
        window.DreamBookEquations.openModal();
    };
})();
