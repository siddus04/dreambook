# Editor UX change policy

When working on `editor.html` and related review/enhancement flows, follow these rules unless the user explicitly requests otherwise in the current task.

## Do not invent new UX surfaces

- Do **not** add supplemental blocks, hidden finding lists, or parallel recommendation panels that were not discussed in the task.
- Do **not** relocate features into ad-hoc UI (for example, stuffing peer-review findings under a chapter-analysis CTA) as a shortcut.
- Do **not** add, remove, or rename tool-card buttons (e.g. splitting "View peer notes" into extra actions on the Chapter Review card) unless the task explicitly asks for it.
- Prefer wiring capabilities into their **existing, named flows**:
  - **Peer review (`xray`)** → narrative peer notes only
  - **Chapter enhancements (`chapter_enhancements`)** → band-based interactive recommendations **and** AI figure illustrations
  - **Individual enhancement scans** → targeted re-runs from the Enhancement Scans tab
 -Do not assume requirements. If a fix is internal (e.g. tier logic), don't add UI labels, badges, or copy unless the user explicitly asks.



## Discuss before changing author-facing behavior

Before changing any of the following, confirm intent with the user or the active plan/story:

- Where a run is triggered (tool card vs findings view vs auto-run)
- What appears in findings lists vs summary headers
- Navigation after a run completes (which view opens)
- Copy, button labels, and progress messaging
- Mock/demo data surfacing in production paths

## Progress and layout

- Primary action buttons that show live progress labels must stay **single-line** with ellipsis truncation when text overflows.
- Do not wrap long progress strings onto multiple lines inside compact tool-card buttons.

## Reference flows (current)

1. Run **Peer Review** → **View peer notes** on the Chapter Review card (unchanged: primary + Re-run only).
2. Inside peer notes, use **Run chapter analysis** (single button below the summary — not a separate "Interactive recommendations" panel).
3. **Chapter analysis** merges band proposals with `image_refresh` findings and opens the **Chapter enhancements** findings view when complete.
