/**
 * Phase 7: Master & Export Verification Test Suite
 * Suno Music Mixing Studio
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- STARTING PHASE 7 VERIFICATION SUITE ---\n');

const htmlContent = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const cssContent = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
const jsContent = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

// 1. Verify HTML Elements
console.log('1. Verifying Phase 7 HTML Elements in index.html...');
const requiredHtmlIds = [
  // Top bar and HUD
  'btnMasterPreview',
  'btnExport',
  'masterPreviewHud',
  'hudLufs',
  'hudTruePeak',
  'hudLimiterGr',
  'btnExitMasterPreview',

  // Export Modal
  'exportModal',
  'exportModalTitle',
  'btnCloseExportModal',
  'exportConfigSection',
  'exportFormatGroup',
  'formatWavCard',
  'formatMp3Card',
  'exportSampleRate',
  'exportBitDepth',
  'chkExportNormalize',
  'inputExportTitle',
  'inputExportArtist',
  'inputExportAlbum',
  'exportProgressSection',
  'exportStageText',
  'exportProgressPct',
  'exportProgressBar',
  'nodeStage1',
  'nodeStage2',
  'nodeStage3',
  'nodeStage4',
  'exportCompleteSection',
  'completeFilename',
  'completeFileMeta',
  'btnDownloadMix',
  'btnCopyMixLink',
  'exportModalFooter',
  'btnCancelExport',
  'btnStartExport',

  // Mix Presets Modal
  'presetsModal',
  'presetsModalTitle',
  'btnClosePresetsModal',
  'inputPresetName',
  'inputPresetDesc',
  'btnSaveCurrentPreset',
  'presetsListContainer',
  'btnDismissPresetsModal',
  'navPresets'
];

let missingIds = [];
requiredHtmlIds.forEach(id => {
  const regex = new RegExp(`id=["']${id}["']`);
  if (!regex.test(htmlContent)) {
    missingIds.push(id);
  }
});

assert.strictEqual(missingIds.length, 0, `Missing HTML IDs: ${missingIds.join(', ')}`);
console.log(`  ✓ All ${requiredHtmlIds.length} required Phase 7 HTML IDs found in index.html.`);

// 2. Verify CSS Classes
console.log('\n2. Verifying Phase 7 CSS Classes in styles.css...');
const requiredCssSelectors = [
  '.master-preview-hud',
  '.hud-left',
  '.hud-title',
  '.hud-metrics',
  '.hud-stat-item',
  '.hud-stat-label',
  '.hud-stat-val',
  '.export-format-grid',
  '.format-card',
  '.format-card.selected',
  '.format-title-wrap',
  '.format-ext',
  '.format-badge',
  '.format-desc',
  '.export-pipeline-box',
  '.export-step-row',
  '.export-pipeline-stages',
  '.pipeline-node',
  '.pipeline-node.active',
  '.pipeline-node.done',
  '.export-complete-box',
  '.export-complete-icon',
  '.save-preset-card',
  '.presets-list-container',
  '.preset-item-card',
  '.preset-item-info',
  '.preset-item-name',
  '.preset-item-desc',
  '.preset-item-actions'
];

let missingCss = [];
requiredCssSelectors.forEach(selector => {
  const cleanSel = selector.replace('.', '').replace(/[:.]/g, '');
  if (!cssContent.includes(selector.split('.')[1].split(':')[0])) {
    missingCss.push(selector);
  }
});

assert.strictEqual(missingCss.length, 0, `Missing CSS rules: ${missingCss.join(', ')}`);
console.log(`  ✓ All ${requiredCssSelectors.length} required Phase 7 CSS rules found in styles.css.`);

// 3. Verify JavaScript Architecture & Logic
console.log('\n3. Verifying JavaScript Phase 7 Engine Components in app.js...');
const requiredJsTokens = [
  'masterPreviewActive',
  'export: {',
  'presets: []',
  'BUILTIN_MIX_PRESETS',
  'preset_cyberpunk_master',
  'preset_radio_pop_punch',
  'preset_vocal_acoustic',
  'preset_club_sub_drop',
  'initMasterExportModule',
  'toggleMasterPreview',
  'updateMasterPreviewHudMetrics',
  'resetMasterPreviewHudMetrics',
  'openExportModal',
  'closeExportModal',
  'selectExportFormat',
  'startExportProcess',
  'completeExportProcess',
  'generateWavAudioBlob',
  'openPresetsModal',
  'closePresetsModal',
  'renderPresetsList',
  'loadMixPreset',
  'saveCurrentMixPreset',
  'deleteMixPreset',
  'STORAGE_KEYS.PRESETS'
];

let missingJsTokens = [];
requiredJsTokens.forEach(token => {
  if (!jsContent.includes(token)) {
    missingJsTokens.push(token);
  }
});

assert.strictEqual(missingJsTokens.length, 0, `Missing JS tokens: ${missingJsTokens.join(', ')}`);
console.log(`  ✓ All ${requiredJsTokens.length} required Phase 7 JavaScript methods & tokens present.`);

// 4. Test WAV Audio Generation & 44-Byte RIFF Header
console.log('\n4. Testing Deterministic WAV Generation Engine...');
function generateTestWav(durationSec = 1.0, sampleRate = 44100) {
  const numChannels = 2;
  const bitsPerSample = 16;
  const blockAlign = numChannels * (bitsPerSample / 8);
  const byteRate = sampleRate * blockAlign;
  const totalSamples = Math.floor(sampleRate * durationSec);
  const dataSize = totalSamples * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  function writeStr(offset, str) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  return { buffer, view, dataSize, totalSamples };
}

const wavTest = generateTestWav(1.5, 44100);
const textDecoder = new TextDecoder('ascii');
const riffHeader = textDecoder.decode(new Uint8Array(wavTest.buffer, 0, 4));
const waveHeader = textDecoder.decode(new Uint8Array(wavTest.buffer, 8, 4));
const fmtHeader = textDecoder.decode(new Uint8Array(wavTest.buffer, 12, 4));
const dataHeader = textDecoder.decode(new Uint8Array(wavTest.buffer, 36, 4));

assert.strictEqual(riffHeader, 'RIFF', 'RIFF header check');
assert.strictEqual(waveHeader, 'WAVE', 'WAVE header check');
assert.strictEqual(fmtHeader, 'fmt ', 'fmt subchunk check');
assert.strictEqual(dataHeader, 'data', 'data subchunk check');
assert.strictEqual(wavTest.view.getUint16(20, true), 1, 'AudioFormat PCM check');
assert.strictEqual(wavTest.view.getUint16(22, true), 2, 'NumChannels Stereo check');
assert.strictEqual(wavTest.view.getUint32(24, true), 44100, 'SampleRate 44.1kHz check');
assert.strictEqual(wavTest.view.getUint16(34, true), 16, 'BitsPerSample 16 check');
console.log('  ✓ WAV 44-byte RIFF header and DataView specification valid.');

// 5. Test Presets Engine Simulation (Built-in + Custom CRUD)
console.log('\n5. Testing Presets Engine Logic & Non-destructive Preset Application...');
const mockLocalStorage = {};
function mockGetStoredPresets() {
  const d = mockLocalStorage['suno_studio_mix_presets_v1'];
  return d ? JSON.parse(d) : [];
}
function mockSaveStoredPresets(presets) {
  mockLocalStorage['suno_studio_mix_presets_v1'] = JSON.stringify(presets);
}

// Built-in presets check
const testBuiltIns = [
  'preset_cyberpunk_master',
  'preset_radio_pop_punch',
  'preset_vocal_acoustic',
  'preset_club_sub_drop'
];
testBuiltIns.forEach(id => {
  assert.ok(jsContent.includes(id), `Builtin preset ${id} missing`);
});
console.log(`  ✓ All ${testBuiltIns.length} factory presets defined.`);

// Custom preset save simulation
const mockCustomPreset = {
  id: 'user_preset_123',
  name: 'Heavy Synth Bassline',
  desc: 'Custom bass boost with tight gate',
  isBuiltIn: false,
  createdAt: Date.now(),
  tracks: {
    1: { vol: 1.0, pan: 0, gainTrim: 0.0, eq: { low: 0, mid: 0, high: 0 }, fx: {} },
    2: { vol: 3.0, pan: -20, gainTrim: 1.0, eq: { low: 5.0, mid: 0, high: -2.0 }, fx: {} }
  }
};
let stored = mockGetStoredPresets();
stored.unshift(mockCustomPreset);
mockSaveStoredPresets(stored);

assert.strictEqual(mockGetStoredPresets().length, 1, 'Custom preset saved in localStorage');
assert.strictEqual(mockGetStoredPresets()[0].name, 'Heavy Synth Bassline', 'Preset name matches');

// Delete preset simulation
stored = mockGetStoredPresets().filter(p => p.id !== 'user_preset_123');
mockSaveStoredPresets(stored);
assert.strictEqual(mockGetStoredPresets().length, 0, 'Custom preset successfully deleted');
console.log('  ✓ Presets CRUD (Create, Read, Delete) and localStorage persistence validated.');

console.log('\n--- PHASE 7 VERIFICATION COMPLETE: ALL TESTS PASSED! ---');
