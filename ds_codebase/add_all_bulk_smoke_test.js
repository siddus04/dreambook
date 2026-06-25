/**
 * Static smoke tests for Add all bulk fix (run: node add_all_bulk_smoke_test.js)
 */
'use strict';

const fs = require('fs');
const path = require('path');

const editor = fs.readFileSync(path.join(__dirname, 'editor.html'), 'utf8');
let passed = 0;
let failed = 0;

function assert(cond, msg) {
    if (cond) { passed++; return; }
    failed++;
    console.error('FAIL:', msg);
}

assert(/function sortReviewFindingsForBulkInsert\s*\(/.test(editor), 'sortReviewFindingsForBulkInsert is defined');
assert(/sortReviewFindingsForBulkInsert\(autoApplicable\)/.test(editor), 'acceptAllReviewFindings calls sortReviewFindingsForBulkInsert');
assert(/getFindingDocumentSortKey\(b, outlineMeta\)/.test(editor), 'sort uses getFindingDocumentSortKey bottom-to-top');
assert(/catch \(e\)[\s\S]*acceptAllReviewFindings failed/.test(editor), 'acceptAllReviewFindings has try/catch');
assert(/failedPlaceholders/.test(editor), 'failed placeholder tracking exists');
assert(/getReviewBulkApplyKind[\s\S]*image_async/.test(editor), 'image_async bulk kind exists');
assert(/applyImageRefreshFindingBulk/.test(editor), 'applyImageRefreshFindingBulk exists');
assert(/could not locate figure anchor for bulk apply/.test(editor), 'bulk image anchor miss logs warning');

const bulkApplicableMatch = editor.match(/function isReviewFindingBulkApplicable\s*\([^)]*\)\s*\{([\s\S]*?)\n    \}/);
assert(bulkApplicableMatch, 'isReviewFindingBulkApplicable function found');
const bulkApplicableBody = bulkApplicableMatch?.[1] || '';
const imageCheckIdx = bulkApplicableBody.indexOf('isImageRefreshFinding(finding)');
const excludeCheckIdx = bulkApplicableBody.indexOf('REVIEW_BULK_EXCLUDE_CAPABILITIES.has');
assert(imageCheckIdx >= 0 && excludeCheckIdx >= 0 && imageCheckIdx < excludeCheckIdx,
    'isImageRefreshFinding checked before REVIEW_BULK_EXCLUDE in isReviewFindingBulkApplicable');
assert(/if \(isImageRefreshFinding\(finding\)\) return true/.test(bulkApplicableBody),
    'auto-generate image findings return true for bulk apply');

console.log(`\nAdd all bulk smoke tests: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
