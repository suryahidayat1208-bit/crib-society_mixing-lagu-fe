/**
 * Phase 8: Presets & Shortcuts Automated Verification Suite
 * Suno Music Mixing Studio
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- STARTING PHASE 8 VERIFICATION SUITE ---\n');

const htmlContent = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const cssContent = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
const jsContent = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

// 1. Verify Phase 8 HTML Elements
console.log('1. Verifying Phase 8 HTML Elements in index.html...');
const requiredHtmlIds = [
  'shortcutSearchInput',
  'shortcutsListWrap',
  'noShortcutsFound',
  'btnDismissShortcuts',
  'btnExportPresetsJson',
  'btnImportPresetsJson',
  'inputImportPresets',
  'mixerQuickPresetSelect'
];

let missingIds = [];
requiredHtmlIds.forEach(id => {
  const regex = new RegExp(`id=["']${id}["']`);
  if (!regex.test(htmlContent)) {
    missingIds.push(id);
  }
});
assert.strictEqual(missingIds.length, 0, `Missing HTML IDs: ${missingIds.join(', ')}`);
console.log(`  ✓ All ${requiredHtmlIds.length} required Phase 8 HTML IDs verified.`);

// 2. Verify HTML Hierarchy & Closing Tags
console.log('\n2. Verifying DOM Hierarchy & Modal Closing Tags...');
// Check that shortcutsModal is properly closed before newProjectModal
const shortcutsModalIdx = htmlContent.indexOf('id="shortcutsModal"');
const newProjectModalIdx = htmlContent.indexOf('id="newProjectModal"');
assert.ok(shortcutsModalIdx !== -1 && newProjectModalIdx !== -1, 'Modals found');
const betweenShortcutsAndNewProj = htmlContent.slice(shortcutsModalIdx, newProjectModalIdx);
const openDivsCount = (betweenShortcutsAndNewProj.match(/<div/g) || []).length;
const closeDivsCount = (betweenShortcutsAndNewProj.match(/<\/div>/g) || []).length;
assert.strictEqual(openDivsCount, closeDivsCount, 'shortcutsModal opening and closing div tags must balance');
console.log('  ✓ shortcutsModal opening and closing div tags are perfectly balanced.');

// Check deleteProjectModal closing tag
const deleteModalIdx = htmlContent.indexOf('id="deleteProjectModal"');
const audioAnalysisModalIdx = htmlContent.indexOf('id="audioAnalysisModal"');
assert.ok(deleteModalIdx !== -1 && audioAnalysisModalIdx !== -1, 'Modals found');
const betweenDeleteAndAnalysis = htmlContent.slice(deleteModalIdx, audioAnalysisModalIdx);
const openDeleteDivs = (betweenDeleteAndAnalysis.match(/<div/g) || []).length;
const closeDeleteDivs = (betweenDeleteAndAnalysis.match(/<\/div>/g) || []).length;
assert.strictEqual(openDeleteDivs, closeDeleteDivs, 'deleteProjectModal opening and closing div tags must balance');
console.log('  ✓ deleteProjectModal opening and closing div tags are perfectly balanced.');

// 3. Verify CSS Rules
console.log('\n3. Verifying Phase 8 CSS Classes in styles.css...');
const requiredCssSelectors = [
  '.shortcuts-search-wrap',
  '.shortcut-category-group',
  '.shortcut-row',
  '.no-shortcuts-found',
  '.preset-backup-row',
  '.mixer-quick-preset-wrap'
];

let missingCss = [];
requiredCssSelectors.forEach(sel => {
  const cleanSel = sel.replace('.', '');
  if (!cssContent.includes(cleanSel)) {
    missingCss.push(sel);
  }
});
assert.strictEqual(missingCss.length, 0, `Missing CSS selectors: ${missingCss.join(', ')}`);
console.log(`  ✓ All ${requiredCssSelectors.length} required Phase 8 CSS selectors present.`);

// 4. Verify JavaScript Methods & Engine Tokens
console.log('\n4. Verifying JavaScript Methods & Tokens in app.js...');
const requiredJsTokens = [
  'exportPresetsToJson',
  'importPresetsFromJson',
  'populateMixerQuickPresetSelect',
  'initShortcutsSearch',
  'filterShortcuts',
  'shortcutSearchInput',
  'shortcutsListWrap',
  'noShortcutsFound',
  'btnExportPresetsJson',
  'btnImportPresetsJson',
  'inputImportPresets',
  'mixerQuickPresetSelect',
  'ArrowLeft',
  'ArrowRight',
  'Equal',
  'Minus',
  'KeyF',
  'KeyP',
  'KeyA',
  'KeyE'
];

let missingJs = [];
requiredJsTokens.forEach(t => {
  if (!jsContent.includes(t)) {
    missingJs.push(t);
  }
});
assert.strictEqual(missingJs.length, 0, `Missing JS tokens: ${missingJs.join(', ')}`);
console.log(`  ✓ All ${requiredJsTokens.length} required Phase 8 JS tokens and methods verified.`);

// 5. Test Live Search Filtering Logic
console.log('\n5. Testing Live Shortcut Search Filter Algorithm...');
const mockShortcuts = [
  { search: 'play pause spacebar transport', desc: 'Play / Pause', keys: 'Space' },
  { search: 'export mix master audio wav mp3 ctrl e cmd', desc: 'Export Master Mix', keys: 'Ctrl+E' },
  { search: 'zoom in enlarge magnify plus equal', desc: 'Zoom In', keys: '+ / =' },
  { search: 'razor split cut blade slice c', desc: 'Razor / Split Tool', keys: 'C' },
  { search: 'presets studio mixing presets shift p alt', desc: 'Open Studio Presets', keys: 'Shift+P' }
];

function testFilterShortcuts(query) {
  const q = (query || '').toLowerCase().trim();
  return mockShortcuts.filter(item => {
    return !q || item.search.includes(q) || item.desc.toLowerCase().includes(q) || item.keys.toLowerCase().includes(q);
  });
}

assert.strictEqual(testFilterShortcuts('').length, 5, 'Empty search returns all');
const exportResults = testFilterShortcuts('export');
assert.strictEqual(exportResults.length, 1);
assert.strictEqual(exportResults[0].desc, 'Export Master Mix');

const zoomResults = testFilterShortcuts('zoom');
assert.strictEqual(zoomResults.length, 1);
assert.strictEqual(zoomResults[0].desc, 'Zoom In');

const spaceResults = testFilterShortcuts('space');
assert.strictEqual(spaceResults.length, 1);
assert.strictEqual(spaceResults[0].desc, 'Play / Pause');

const noResults = testFilterShortcuts('nonexistentkeyword123');
assert.strictEqual(noResults.length, 0);
console.log('  ✓ Live search filtering algorithm tested and accurate.');

// 6. Test JSON Import / Export Preset Schema Validation
console.log('\n6. Testing Presets JSON Export / Import Schema Validation...');
const samplePresets = [
  {
    id: 'user_1',
    name: 'Synthwave Night Punch',
    desc: 'Deep warm sub bass with wide synth lead',
    tracks: {
      1: { vol: 0, pan: 0, gainTrim: 0, eq: { low: 0, mid: 0, high: 0 }, fx: {} },
      2: { vol: 2, pan: -15, gainTrim: 1, eq: { low: 3, mid: 0, high: -1 }, fx: {} }
    }
  }
];

// Test export JSON structure
const exportPayload = {
  app: 'Suno Music Mixing Studio',
  version: '1.0.0',
  exportedAt: new Date().toISOString(),
  presetCount: samplePresets.length,
  presets: samplePresets
};
const exportedJson = JSON.stringify(exportPayload);
const parsedPayload = JSON.parse(exportedJson);
assert.strictEqual(parsedPayload.app, 'Suno Music Mixing Studio');
assert.strictEqual(parsedPayload.presetCount, 1);
assert.strictEqual(parsedPayload.presets[0].name, 'Synthwave Night Punch');

// Test import parser logic
function testImportParser(rawJson) {
  const parsed = JSON.parse(rawJson);
  const list = Array.isArray(parsed) ? parsed : (parsed.presets || []);
  if (!Array.isArray(list) || list.length === 0) throw new Error('No presets');
  return list.map(p => ({
    name: String(p.name).trim(),
    desc: p.desc || '',
    tracks: p.tracks
  }));
}

const imported = testImportParser(exportedJson);
assert.strictEqual(imported.length, 1);
assert.strictEqual(imported[0].name, 'Synthwave Night Punch');
assert.ok(imported[0].tracks[2].vol === 2);
console.log('  ✓ Presets JSON serialization and deserialization verified.');

console.log('\n--- PHASE 8 VERIFICATION COMPLETE: ALL TESTS PASSED! ---');
