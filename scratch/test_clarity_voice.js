const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

console.log('=== RUNNING TESTS FOR CLARITY CLEANER & VOICE TRANSFORMER FX ===\n');

let passed = 0;
let failed = 0;

function assert(desc, condition) {
  if (condition) {
    console.log(`[PASS] ${desc}`);
    passed++;
  } else {
    console.error(`[FAIL] ${desc}`);
    failed++;
  }
}

// 1. Check HTML Elements
assert('Quick Start Banner exists in HTML', html.includes('id="quickStartBanner"'));
assert('Close Quick Start Button exists', html.includes('id="btnCloseQuickStart"'));
assert('Toolbar Clarity button exists', html.includes('id="btnOpenClarityModal"'));
assert('Toolbar Voice FX button exists', html.includes('id="btnOpenVoiceModal"'));
assert('Clarity Modal exists', html.includes('id="clarityModal"'));
assert('Voice Modal exists', html.includes('id="voiceModal"'));
assert('Clarity presets grid exists', html.includes('id="clarityPresetsGrid"'));
assert('Voice presets grid exists', html.includes('id="voicePresetsGrid"'));
assert('Clarity slider exists', html.includes('id="clarityIntensitySlider"'));
assert('Track FX tag spans exist on all 4 tracks', 
  html.includes('id="trackFxTag-1"') &&
  html.includes('id="trackFxTag-2"') &&
  html.includes('id="trackFxTag-3"') &&
  html.includes('id="trackFxTag-4"')
);

// 2. Check Presets
const clarityPresets = ['clean_total', 'studio_mic', 'anti_hiss', 'warm_crisp'];
clarityPresets.forEach(preset => {
  assert(`Clarity preset [${preset}] exists in HTML`, html.includes(`data-preset="${preset}"`));
});

const voicePresets = ['original', 'chipmunk', 'monster', 'telephone', 'robot', 'underwater', 'cathedral', 'crystal'];
voicePresets.forEach(preset => {
  assert(`Voice FX preset [${preset}] exists in HTML`, html.includes(`data-preset="${preset}"`));
});

// 3. Check CSS Classes
assert('CSS contains .quick-start-banner', css.includes('.quick-start-banner'));
assert('CSS contains .track-badge-pill', css.includes('.track-badge-pill'));
assert('CSS contains .track-badge-pill.voice-fx', css.includes('.track-badge-pill.voice-fx'));
assert('CSS contains .fx-preset-grid', css.includes('.fx-preset-grid'));
assert('CSS contains .fx-preset-card', css.includes('.fx-preset-card'));
assert('CSS contains .clarity-slider-wrap', css.includes('.clarity-slider-wrap'));

// 4. Check JS Functionality & DSP Graph
assert('JS has state.trackEffects initialized', js.includes('trackEffects:'));
assert('JS DSP has clarityLowCut node', js.includes('clarityLowCut = ctx.createBiquadFilter()'));
assert('JS DSP has clarityDeMud node', js.includes('clarityDeMud = ctx.createBiquadFilter()'));
assert('JS DSP has clarityHighAir node', js.includes('clarityHighAir = ctx.createBiquadFilter()'));
assert('JS DSP has voiceFilter node', js.includes('voiceFilter = ctx.createBiquadFilter()'));
assert('JS implements applyTrackClarity', js.includes('function applyTrackClarity('));
assert('JS implements applyTrackVoice', js.includes('function applyTrackVoice('));
assert('JS implements updateTrackEffectBadges', js.includes('function updateTrackEffectBadges('));
assert('JS implements initClarityAndVoiceModules', js.includes('function initClarityAndVoiceModules('));
assert('JS calls initClarityAndVoiceModules in init', js.includes('initClarityAndVoiceModules();'));
assert('JS updates voice pitch playbackRate on HTML5 audio', js.includes('fx.voice === \'chipmunk\''));
assert('JS updates voice pitch playbackRate on Web Audio sources', js.includes('source.playbackRate.setValueAtTime(rate, when)'));

// 5. Check Translations
assert('EN translations contain clarity & voice keys', js.includes('clarity.modal_title') && js.includes('voice.modal_title'));
assert('ID translations contain clarity & voice keys', js.includes('Pembersih Suara & Vokal Jernih') && js.includes('Tools Otomatis Pengubah Suara'));

console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
if (failed > 0) process.exit(1);
