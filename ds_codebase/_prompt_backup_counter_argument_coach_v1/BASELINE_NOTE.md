# Counter-argument coach baseline — counter-argument-coach-v1

Pre hint-guard backup of opposing-view (`compare_models`) debate chat coaching.

**Version id:** `counter-argument-coach-v1`

**Date:** 2025-06-25

**Files:**
- `module_formats.js` — debate rubric, `evaluateDebateStepAnswer`, merge helpers
- `editor.html` — `processLadderStudentTurn`, `evaluateDebateTurnWithLLM`
- `widget_coaching_test.js` — coaching unit tests

**Rollback:** Copy all files from this folder back to `ds_codebase/` (overwrite), then reload the editor.

**Smoke test:** Student preview → Counter-argument on cell/nucleus passage → Step 2 with a confused eukaryote guess should NOT immediately reveal prokaryotes/bacteria.
