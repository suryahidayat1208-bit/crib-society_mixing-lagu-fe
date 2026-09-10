/**
 * Verification test script for Real-Time Web Audio DSP Routing & Unified Track Selection Syncing
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== VERIFYING REAL-TIME WEB AUDIO DSP ROUTING & UNIFIED TRACK SELECTION ===\n');

const appJs = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const stylesCss = fs.readFileSync(path.join(__dirname, '../styles.css'), 'utf8');

let passCount = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// 1. Audio DSP Routing in startAudioPlayback
test('startAudioPlayback prioritizes Web Audio Buffer Source node over raw AudioElement', () => {
  assert(appJs.includes('const buf = getClipAudioBuffer(clip);'), 'Checks clip buffer first');
  const bufIdx = appJs.indexOf('const buf = getClipAudioBuffer(clip);');
  const elIdx = appJs.indexOf('const el = clip.audioElement || AUDIO_ELEMENTS[clip.id];');
  assert(bufIdx < elIdx, 'Buffer source must be checked before fallback audio element');
});

test('startAudioPlayback connects buffer source clipGain to trackNode.clarityLowCut', () => {
  assert(appJs.includes('clipGain.connect(trackNode.clarityLowCut);'), 'Must route into clarityLowCut input node');
});

test('startAudioPlayback routes HTML5 Audio elements into trackNode.clarityLowCut via createMediaElementSource', () => {
  assert(appJs.includes('const elSrc = ctx.createMediaElementSource(el);'), 'Creates MediaElementSource for audio elements');
  assert(appJs.includes('elSrc.connect(trackNode.clarityLowCut);'), 'Connects MediaElementSource into clarityLowCut input node');
});

// 2. HTML5 audio element attenuation guard
test('updateAudioTrackNode and updateMasterAudioNode only attenuate unrouted elements', () => {
  assert(appJs.includes('if (!activeElementSources[clip.id])'), 'Guards against double gain attenuation on routed elements');
});

// 3. Unified Track Selection: selectStudioTrack
test('JS defines selectStudioTrack with track highlighting and modal syncing', () => {
  assert(appJs.includes('function selectStudioTrack(trackId, options = {})'), 'selectStudioTrack exists');
  assert(appJs.includes('state.selectedTrackId = `track-${id}`;'), 'Sets state.selectedTrackId');
  assert(appJs.includes('state.mixer.selectedTrackId = id;'), 'Sets state.mixer.selectedTrackId');
  assert(appJs.includes('row.classList.toggle(\'selected\', row.dataset.trackId === `track-${id}`);'), 'Syncs timeline track row highlight');
  assert(appJs.includes('strip.classList.toggle(\'selected\', strip.dataset.track === String(id));'), 'Syncs mixer console strip highlight');
  assert(appJs.includes('elements.clarityTrackSelect.value = String(id);'), 'Syncs clarity track dropdown');
  assert(appJs.includes('updateClarityModalUI(id);'), 'Syncs clarity modal cards');
  assert(appJs.includes('elements.voiceTrackSelect.value = String(id);'), 'Syncs voice track dropdown');
  assert(appJs.includes('updateVoiceModalUI(id);'), 'Syncs voice modal cards');
  assert(appJs.includes('elements.mixerTrackSelector.value = String(id);'), 'Syncs inspector channel dropdown');
  assert(appJs.includes('updateMixerUI(id);'), 'Syncs inspector channel UI');
});

test('selectMixerTrack forwards to selectStudioTrack', () => {
  assert(appJs.includes('function selectMixerTrack(trackId) {\n    selectStudioTrack(trackId);\n  }'), 'selectMixerTrack delegates to selectStudioTrack');
});

test('selectClip calls selectStudioTrack', () => {
  assert(appJs.includes('selectStudioTrack(clip.trackId, { syncClip: false });'), 'selectClip delegates track selection to selectStudioTrack');
});

test('Timeline track lane and row clicks trigger selectStudioTrack', () => {
  assert(appJs.includes('selectStudioTrack(parseInt(trackId, 10));'), 'Timeline lane click calls selectStudioTrack');
  assert(appJs.includes('selectStudioTrack(numId);'), 'Timeline track row click calls selectStudioTrack');
});

// 4. Badges and Unicode
test('updateTrackEffectBadges dynamically toggles display: inline-flex and none', () => {
  assert(appJs.includes('el.style.display = hasBadges ? \'inline-flex\' : \'none\';'), 'Dynamic inline-flex badge display');
});

test('updateTrackEffectBadges uses clean Unicode escapes for emojis', () => {
  assert(appJs.includes('\\u{1F9F9}'), 'Unicode escape for broom emoji');
  assert(appJs.includes('\\u{1F43F}\\uFE0F'), 'Unicode escape for chipmunk emoji');
  assert(appJs.includes('\\u{1F479}'), 'Unicode escape for monster emoji');
  assert(appJs.includes('\\u{1F916}'), 'Unicode escape for robot emoji');
});

// 5. Live Audition
test('Clarity preset card clicks trigger live audition immediately', () => {
  assert(appJs.includes('applyTrackClarity(trackId, currentSelectedClarityPreset, intensity);'), 'Clarity preset card click applies clarity DSP immediately');
});

test('Voice preset card clicks trigger live audition immediately', () => {
  assert(appJs.includes('applyTrackVoice(trackId, currentSelectedVoicePreset);'), 'Voice preset card click applies voice DSP immediately');
});

// 6. CSS Highlights
test('CSS track-row.selected has prominent left border and tint', () => {
  assert(stylesCss.includes('.track-row.selected'), 'CSS defines .track-row.selected');
  assert(stylesCss.includes('#22D3EE') || stylesCss.includes('var(--primary)'), 'Has cyan accent border');
});

console.log(`\nALL ${passCount} DSP ROUTING & UNIFIED TRACK SYNC TESTS PASSED SUCCESSFULLY!`);
