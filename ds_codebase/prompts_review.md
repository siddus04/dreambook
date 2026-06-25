# Textbook Generation Prompts

These are the prompts used in `code.html` to generate the book structure, depending on the author's selected "structure style".

## System Prompt (Used for all options)

```text
You are an expert academic textbook author writing for {gradeLevel} students.
{gradeContext}

STRUCTURAL GUIDELINES:
- Chapter 1 MUST be an Introduction that orients readers to the book's purpose, approach, and what they will learn (1-3 subsections).
- The FINAL chapter MUST be Practice/Exercises with review problems, experiments, or activities (1-3 subsections).
- All middle chapters are content chapters and should follow the subsection requirements in the prompt.

[For toc, outline, and full modes only:]
TITLE AND SUBTITLE RULES:
- "title" MUST be a descriptive chapter title (e.g., "Introduction to the World of Physics", "Forces and Motion", "Practice Problems and Review").
- Do NOT use generic labels like "Chapter 1", "Chapter 2", "Introduction", or "Practice/Exercises" as the title.
- Chapter numbering (Chapter 1, Chapter 2, etc.) is handled by the UI — never put it in the title field.
- "subtitle" MUST be a short, engaging tagline (one phrase or sentence) that complements the title.
- The subtitle must NOT repeat or paraphrase the title.

You MUST respond with a valid JSON object matching this exact schema:
{
  "chapters": [
    {
      "title": "Introduction to the World of Physics",
      "subtitle": "Exploring how matter, energy, and experimentation shape our understanding of nature",
      "sections": [
        {
          "title": "Section Title (plain text only — do NOT include numbering like 1.1)",
          "content": "Brief description OR full draft content (depending on the prompt). Omit this field if the prompt asks for NO subsections."
        }
      ]
    }
  ]
}
```

---

## Base Context (Prepended to the user prompt)

If the author provided a description during the interview, it is prepended as a structural directive:

```text
AUTHOR'S VISION:
"{description}"

IMPORTANT: Structure the chapters to reflect this approach. Do NOT default to a generic textbook format.
```

---

## Chapter Counts Summary

| Style | Total Chapters | Structure |
|-------|----------------|-----------|
| TOC | 10 | 1 intro + 8 content + 1 exercises |
| Outline | 6 | 1 intro + 4 content + 1 exercises |
| Full Draft | 5 | 1 intro + 3 content + 1 exercises |
| Custom | varies + 2 | intro + author's chapters + exercises |

Intro and exercises chapters use 1-3 subsections as appropriate. Content chapters follow the subsection rules below.

---

## Option 1: Table of Contents Only (`toc`)

```text
{AUTHOR'S VISION block}
Generate a Table of Contents for a textbook titled "{title}" for {gradeLevel} students. Return exactly 10 chapters total: Chapter 1 must be an Introduction, Chapters 2-9 are content chapters, and Chapter 10 must be Practice/Exercises. Each chapter should have a title and a subtitle, but NO subsections. Each chapter's `title` must be a descriptive topic title (not "Chapter N"). Each `subtitle` must be a short, relevant tagline that complements the title. Structure the content chapters to reflect the author's vision described above.
{gradeContext}
```

## Option 2: Detailed Outline (`outline`)

```text
{AUTHOR'S VISION block}
Generate a Chapter Outline for a textbook titled "{title}" for {gradeLevel} students. Return exactly 6 chapters total: Chapter 1 must be an Introduction (1-3 subsections), Chapters 2-5 are content chapters with exactly 3 subsections each, and Chapter 6 must be Practice/Exercises (1-3 subsections). Each chapter must have a title and a subtitle. Each subsection must have a plain-text title and a brief description (1 sentence). Each chapter's `title` must be a descriptive topic title (not "Chapter N"). Each `subtitle` must be a short, relevant tagline that complements the title. Structure the content chapters to reflect the author's vision described above.
{gradeContext}
```

## Option 3: Full Draft (`full`)

```text
{AUTHOR'S VISION block}
Generate a Full Draft structure for a textbook titled "{title}" for {gradeLevel} students. Return exactly 5 chapters total: Chapter 1 must be an Introduction (1-3 subsections), Chapters 2-4 are content chapters with exactly 3 subsections each, and Chapter 5 must be Practice/Exercises (1-3 subsections). Each chapter must have a title and a subtitle. Each subsection must have a plain-text title and 2 paragraphs of full draft content. Each chapter's `title` must be a descriptive topic title (not "Chapter N"). Each `subtitle` must be a short, relevant tagline that complements the title. Structure the content chapters to reflect the author's vision described above.
{gradeContext}
```

## Option 4: Custom Instructions (`custom`)

```text
{AUTHOR'S VISION block}
Generate a textbook structure for "{title}" for {gradeLevel} students based on the author's instructions below. Chapter 1 must be an Introduction (1-3 subsections). The final chapter must be Practice/Exercises (1-3 subsections). All middle chapters are content chapters and should follow the requested chapter count, topics, and ordering as closely as possible. Each chapter must have a title, a subtitle, and subsections with plain-text titles and brief descriptions. Structure content chapters to reflect the author's vision described above.

Author's structure instructions:
"{customStructureDesc}"

{gradeContext}
```

---

## Pearson Cell Biology Enhancement Demo Runbook

Use this script when presenting the **Foundation Biology → Cell Biology (Chapter 2)** walkthrough in `editor.html`.

### Setup

1. Open the editor with `?importCh2=1` (or run `importFoundationBiologyCh2()` in the console).
2. Confirm the chapter title is **Cell Biology** and ~20 H1 sections appear in the sidebar.
3. Set grade level to **Class 9–10** if not already set.
4. Enable **Learning Assistant** under Settings → Student preview.
5. For live LLM placement, set OpenAI API key in Settings. The stage demo flag (`demoPeerReview=1`) mocks peer notes and widget bodies but still needs a key for live figure refresh and the membrane-transport simulation.

### Stage demo (`?importCh2=1&demoPeerReview=1`)

Reliable rehearsal script for presentations. **Reading level**, **all figure refreshes**, **membrane-transport PhET**, **hero analogy (cricket regenerate)**, and **student preview** stay on live code paths. **Peer notes**, **chapter enhancement list**, and **non-M widget bodies** are curated/cached.

1. Open `editor.html?importCh2=1&demoPeerReview=1`. Publish once if needed; discard edits before each rehearsal to reset.
2. Set grade **Class 9–10**, API key in Settings, **Use pop-culture hooks** ON.
3. **Live — Adjust reading level** — Run side-by-side simplify, accept changes (anchors target post-simplify prose).
4. **Peer Review** — ~2s peer notes, then auto-chained chapter analysis (~8–10s staged progress). Expect ~16 non-M widgets + 1 membrane simulation + 3–4 live figure recommendations.
5. **Add all** — Placeholders appear immediately; cached widgets fill with staggered spinners (1.2s + index×0.8s); figures and simulation generate live.
6. **Live — Hero analogy** — Select §2.3 passage → Illustrate (or insert one widget manually) → cricket regenerate → Confirm block.
7. Confirm simulation + two checkpoints → **Preview** student view.

Flag off or non–Cell Biology chapter: zero behavior change (full LLM analysis).

### Live demo order (full LLM)

1. **Before state** — Show the dense college-level chapter (dry prose, figure blockquotes, plain exercises).
2. **Peer Review** — Open Review mode and run **Peer Review**. Expect strategic summary in Peer notes, plus **all seven enhancement scans** with chapter-specific feedback in **Findings** (none pre-selected).
3. **Run analysis** — Check desired scans in Findings, click **Run analysis**. Returns to Review tools tab; each scan card runs in parallel (same as manual run). Re-run prompts if prior results exist.
4. **Review proposals** — On the Review tools tab, each selected scan shows **Scanning…** then **View proposals (N)**. Click a scan card to review its proposals.
5. **Insert & preview** — Each proposal: **Insert & preview** → scroll to anchor; draft widget with dashed outline and **Confirm block / Discard** toolbar.
6. **Confirm blocks** — Expand scenario/illustration body (collapsed by default), **Edit** or **Regenerate** via modals, then **Confirm block** inline or from the review panel.
7. **Claim Confidence / Misconception** — Run separately if needed (unchanged).
8. **Publish / Preview** — Blocked until all interactive widgets are confirmed. Preview button shows **N drafts** badge when drafts remain.

### Student preview checklist

- **Illustrate blocks** render as styled analogy/news callouts (read-only). Author view uses expandable body + edit/regenerate modal before confirm.
- **Socratic checkpoints** show a 3-step indicator (Clarify → Probe → Consequences) with **3 conversation turns** by default. Students must reply on **each step** before **Done** unlocks. **Need a hint?** in chat (one hint per checkpoint).
- **Counter-argument / Case study / Explain to peer** show generated body text plus the opening question; chat is grounded in `data-source-passage`. Format variants rotate via `format_id` (e.g. role-play, steel-man, teach-Sam).
- **Recall Check** supports MCQ, match, and order formats inline — correct answers mark the checkpoint complete and unlock reading.
- **Simulation** blocks gate reading until completed/skipped (unchanged).

### Expected review behavior

- Peer Review returns **strategic notes in Peer notes** and **all seven scan recommendations in Findings** (unchecked by default) + **Run analysis** CTA — not widget auto-inserts.
- LLM scans place widgets at **mid-section body blocks** (validated `afterBlockId` + verbatim `anchorQuote`).
- Peer review returns **excluded sections** (intros, overviews, background) — scans skip these; fallback targets mid-chapter concept sections.
- Minimum **1 proposal per selected scan** (retry + fallback if LLM returns none).
- **Illustrate scan:** target count scales with abstract sections (`min(5, max(2, ceil(eligible/2)))`); placement enforces **≥50% analogy / ≥50% news** mix; retries if below target.
- **Recall / Socratic / Explain to peer:** weighted target from chapter length × section density × peer priority ÷ effort — **min 2 / max 4** (Explain min 1).
- **Counter-argument:** weighted target — **min 1 / max 3** (comparative sections only).
- **Case study & simulation:** weighted target — **min 1 / max 2** (high author effort; scales with application/process density).
- Other scans: capped by per-scan max above; **Run analysis** clears prior scan runs and rebuilds outline before rescans.
- **Run analysis** returns to Review tools tab — use **View proposals (N)** on each scan card (no merged batch screen).
- **Insert & preview** → draft widget → **Confirm block** (human-in-the-loop). Preview and Publish blocked until all widgets confirmed.
- **Pop-culture hooks:** Settings toggle **Use pop-culture hooks in activities** (default ON) — applies to all grade levels and module generation paths via `buildModuleSystemPrompt`.
- Offline demo (`?importCh2=1&demoPeerReview=1`) uses curated band placements from `chapter_enhancements_demo.js`; cached non-M widgets hydrate without LLM; images and simulation still require API key.

### Out of scope for this demo

Co-author, record lecture, legacy Exercise Transform mapper, removed widgets (Key Takeaways, Real-World Implications as interactive chat, separate Real-World Example / Custom Analogy commands).
