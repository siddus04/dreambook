/**
 * Legacy exercise → interactive recall blocks (MCQ, Match, Order).
 * Triggered from editor context menu on author selection; replaces selection only.
 */
(function (global) {
    'use strict';

    const MAX_PROPOSALS = 8;
    const PICK_COUNT = 5;

    const PROMPT_START = /^(Define|What is|What are|Distinguish|Describe|Compare|List|Explain|Detail|Contrast|For each|How does)/i;

    function normalizeText(s) {
        return String(s || '').replace(/\s+/g, ' ').trim();
    }

    function parsePrompts(text) {
        const lines = String(text || '').split(/\n/).map(function (l) { return l.trim(); }).filter(Boolean);
        const prompts = [];
        let section = '';
        lines.forEach(function (line) {
            if (/^Section [A-D]:/i.test(line)) {
                section = line;
                return;
            }
            if (PROMPT_START.test(line)) {
                prompts.push({ section: section, text: line });
            }
        });
        return prompts;
    }

    function inferFormat(promptText) {
        const t = promptText.toLowerCase();
        if (/\b(list|distinguish|define|for each|four structural|organelles?\b.*\(a\))/i.test(t)) return 'match';
        if (/\b(sequential|order|steps|process of|detail the sequential|involving the endomembrane)/i.test(t)) return 'order';
        if (/\b(contrast|compare|explain|how does|describe the role|primary active|secondary active)/i.test(t)) return 'mcq';
        if (/^define/i.test(t)) return 'match';
        return 'mcq';
    }

    function proposalId() {
        return 'ex-' + Math.random().toString(36).slice(2, 10);
    }

    function makeProposal(title, format, sourceText, preview, payload) {
        return {
            id: proposalId(),
            title: title,
            format: format,
            sourceText: sourceText,
            preview: preview,
            payload: payload || null
        };
    }

    /** Curated demo map for Foundation Biology Ch. 2 Exercises sample */
    function buildDemoCh2Proposals(text) {
        const key = normalizeText(text).toLowerCase();
        if (!key.includes('amphipathic') || !key.includes('endosymbiotic')) return null;

        return [
            makeProposal('Section A: Key definitions', 'match',
                'Define amphipathic; oxidative phosphorylation; Omnis cellula e cellula; cytoplasm vs cytosol; gap junction',
                'Match 5 core terms from Section A to their meanings.',
                {
                    format: 'match',
                    pairs: [
                        { term: 'Amphipathic', definition: 'Having both hydrophilic and hydrophobic regions (plasma membrane)' },
                        { term: 'Oxidative phosphorylation', definition: 'ATP synthesis using the proton gradient · inner mitochondrial membrane' },
                        { term: 'Omnis cellula e cellula', definition: 'All cells arise from pre-existing cells' },
                        { term: 'Cytoplasm', definition: 'Cytosol plus organelles and structures within the cell' },
                        { term: 'Gap junction', definition: 'Channel connecting adjacent animal cells for direct communication' }
                    ]
                }),
            makeProposal('Fluid mosaic model', 'mcq',
                'Describe the structural composition of the fluid mosaic model, including the role of the glycocalyx.',
                'MCQ on membrane structure and glycocalyx function.',
                {
                    format: 'mcq',
                    questions: [{
                        prompt: 'In the fluid mosaic model, what best describes the glycocalyx?',
                        options: [
                            'Carbohydrate chains on the outer membrane surface involved in recognition and protection',
                            'The hydrophobic core made only of phospholipid tails',
                            'A rigid protein shell that prevents lipid movement',
                            'The nuclear pore complex on the inner membrane'
                        ],
                        correctIndex: 0,
                        explanation: 'The glycocalyx is the carbohydrate coating on the extracellular face of the membrane.'
                    }]
                }),
            makeProposal('Prokaryotic vs eukaryotic cells', 'mcq',
                'Compare the structural features of prokaryotic and eukaryotic cells.',
                'MCQ contrasting cell organization.',
                {
                    format: 'mcq',
                    questions: [{
                        prompt: 'Which feature is found in eukaryotic cells but not typical prokaryotes?',
                        options: ['Membrane-bound nucleus', 'Plasma membrane', 'Ribosomes', 'Cytoplasm'],
                        correctIndex: 0,
                        explanation: 'Eukaryotes have a true nucleus; prokaryotes lack membrane-bound organelles.'
                    }]
                }),
            makeProposal('Plant vs animal cell differences', 'match',
                'List four structural differences between a typical plant cell and a typical animal cell.',
                'Match plant-only vs animal-only structures.',
                {
                    format: 'match',
                    pairs: [
                        { term: 'Cell wall (cellulose)', definition: 'Typical plant cell' },
                        { term: 'Central vacuole', definition: 'Typical plant cell' },
                        { term: 'Chloroplasts', definition: 'Typical plant cell' },
                        { term: 'Centrosome / centrioles', definition: 'Typical animal cell' }
                    ]
                }),
            makeProposal('Active transport contrast', 'mcq',
                'Contrast the mechanisms and energy requirements of primary active transport versus secondary active transport.',
                'MCQ on ATP use vs gradient coupling.',
                {
                    format: 'mcq',
                    questions: [{
                        prompt: 'Secondary active transport directly uses energy from:',
                        options: [
                            'An ion gradient established by primary active transport',
                            'Sunlight captured by chlorophyll',
                            'Random thermal motion only',
                            'DNA replication in the nucleus'
                        ],
                        correctIndex: 0,
                        explanation: 'Secondary transport couples to gradients created by primary pumps.'
                    }]
                }),
            makeProposal('Secretory pathway sequence', 'order',
                'Detail the sequential process of protein synthesis, modification, and secretion involving the endomembrane system.',
                'Order steps from synthesis to secretion.',
                {
                    format: 'order',
                    prompt: 'Put the secretory pathway steps in order:',
                    steps: [
                        'Translation on ribosomes (often rough ER)',
                        'Protein folding and modification in the ER',
                        'Sorting and packaging in the Golgi apparatus',
                        'Transport in vesicles to the membrane',
                        'Exocytosis to secrete the protein'
                    ]
                }),
            makeProposal('Endosymbiotic theory', 'mcq',
                'How does the Endosymbiotic Theory explain the origin of mitochondria and chloroplasts? Provide three pieces of supporting evidence.',
                'MCQ on endosymbiosis evidence.',
                {
                    format: 'mcq',
                    questions: [{
                        prompt: 'Which is evidence supporting the endosymbiotic origin of mitochondria?',
                        options: [
                            'Circular DNA and own ribosomes inside the organelle',
                            'Absence of any membrane around the organelle',
                            'Identical genome to the host nucleus',
                            'Formation only during apoptosis'
                        ],
                        correctIndex: 0,
                        explanation: 'Mitochondria/chloroplasts resemble bacterial ancestors in DNA and ribosomes.'
                    }]
                }),
            makeProposal('Organelle structure → function', 'match',
                'For each organelle: mitochondrion, chloroplast, nucleus, Golgi — structure supports function',
                'Match organelle to a structural feature linked to its role.',
                {
                    format: 'match',
                    pairs: [
                        { term: 'Mitochondrion — cristae', definition: 'Increases surface area for ATP synthesis' },
                        { term: 'Chloroplast — thylakoids', definition: 'Light-dependent reactions of photosynthesis' },
                        { term: 'Nucleus — nuclear envelope', definition: 'Separates DNA transcription from cytoplasmic translation' },
                        { term: 'Golgi — flattened cisternae', definition: 'Processing and sorting of proteins and lipids' }
                    ]
                })
        ];
    }

    function clusterDefinitionMatch(prompts) {
        const defs = prompts.filter(function (p) { return /^define/i.test(p.text); });
        if (defs.length < 2) return null;
        const sourceText = defs.map(function (d) { return d.text; }).join('\n');
        return makeProposal(
            'Definition match (' + defs.length + ' terms)',
            'match',
            sourceText,
            'Match terms from definition prompts.',
            null
        );
    }

    function buildGenericProposals(text) {
        const prompts = parsePrompts(text);
        if (!prompts.length) {
            const fallback = normalizeText(text);
            if (fallback.length < 40) return [];
            return [makeProposal('Recall check', 'mcq', fallback, fallback.slice(0, 120) + '…', null)];
        }

        const proposals = [];
        const used = new Set();

        const defCluster = clusterDefinitionMatch(prompts);
        if (defCluster) {
            proposals.push(defCluster);
            prompts.filter(function (p) { return /^define/i.test(p.text); }).forEach(function (p) { used.add(p.text); });
        }

        prompts.forEach(function (p) {
            if (used.has(p.text)) return;
            const format = inferFormat(p.text);
            const short = p.text.length > 72 ? p.text.slice(0, 70) + '…' : p.text;
            proposals.push(makeProposal(short, format, p.text, p.text.slice(0, 140) + (p.text.length > 140 ? '…' : ''), null));
        });

        return proposals.slice(0, MAX_PROPOSALS);
    }

    function buildProposals(selectedText) {
        const demo = buildDemoCh2Proposals(selectedText);
        if (demo) return demo;
        return buildGenericProposals(selectedText);
    }

    function selectionPickRules(proposalCount) {
        if (proposalCount === 0) return { min: 0, max: 0, exact: 0 };
        if (proposalCount <= PICK_COUNT) return { min: proposalCount, max: proposalCount, exact: proposalCount };
        return { min: PICK_COUNT, max: PICK_COUNT, exact: PICK_COUNT };
    }

    global.DreamBookExerciseTransform = {
        MAX_PROPOSALS: MAX_PROPOSALS,
        PICK_COUNT: PICK_COUNT,
        parsePrompts: parsePrompts,
        buildProposals: buildProposals,
        selectionPickRules: selectionPickRules
    };
})(typeof window !== 'undefined' ? window : global);
