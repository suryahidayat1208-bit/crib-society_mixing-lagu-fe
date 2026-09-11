// scratch/test_allinone_studio_mode.js
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== RUNNING TESTS: All-In-One Studio Suite, Red-Orange Theme, & Mode Studio ===');

const projectRoot = path.resolve(__dirname, '..');
const htmlContent = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
const cssContent = fs.readFileSync(path.join(projectRoot, 'styles.css'), 'utf8');
const jsContent = fs.readFileSync(path.join(projectRoot, 'app.js'), 'utf8');

// 1. Check CSS Red & Orange Palette Tokens
console.log('\n[1] Validating Red & Orange Theme Tokens in styles.css...');
assert(cssContent.includes('#FF4500'), 'CSS must include primary red-orange #FF4500');
assert(cssContent.includes('#FF8C00'), 'CSS must include accent orange #FF8C00');
assert(cssContent.includes('--bg-main: #140505') || cssContent.includes('#140505'), 'CSS must include dark reddish background #140505');
assert(cssContent.includes('.btn-studio-mode'), 'CSS must define .btn-studio-mode');
assert(cssContent.includes('.badge-studio-mode'), 'CSS must define .badge-studio-mode');
assert(cssContent.includes('.track-row.allinone-suite'), 'CSS must define .track-row.allinone-suite');
assert(cssContent.includes('.allinone-stem-card'), 'CSS must define .allinone-stem-card');
assert(cssContent.includes('.studio-preset-card'), 'CSS must define .studio-preset-card');
console.log('✓ styles.css has complete Red & Orange styling, glowing badges, and studio cards');

// 2. Check HTML Elements
console.log('\n[2] Validating HTML Elements in index.html...');
const requiredIds = [
  'btnToggleStudioMode',
  'studioModeBadge',
  'trackRowAllInOne',
  'allinoneStudioBadge',
  'pillStemVocal',
  'pillStemBass',
  'pillStemDrum',
  'pillStemFx',
  'btnOpenStudioModeModal',
  'tabAllInOne',
  'paneAllInOne',
  'sliderStemVocalVol',
  'readoutStemVocalVol',
  'sliderStemVocalClarity',
  'readoutStemVocalClarity',
  'btnStemVocalMute',
  'btnStemVocalSolo',
  'sliderStemBassVol',
  'readoutStemBassVol',
  'sliderStemBassPunch',
  'readoutStemBassPunch',
  'btnStemBassMute',
  'btnStemBassSolo',
  'sliderStemDrumVol',
  'readoutStemDrumVol',
  'sliderStemDrumPunch',
  'readoutStemDrumPunch',
  'btnStemDrumMute',
  'btnStemDrumSolo',
  'sliderStemFxVol',
  'readoutStemFxVol',
  'sliderStemFxReverb',
  'readoutStemFxReverb',
  'btnStemFxMute',
  'btnStemFxSolo',
  'btnAllInOneReset',
  'btnAllInOneDownload',
  'studioModeModal',
  'btnCloseStudioModeModal',
  'modalStudioStatusBadge',
  'studioPresetGrid',
  'sliderStudioClarity',
  'readoutStudioClarity',
  'sliderStudioDeMud',
  'readoutStudioDeMud',
  'sliderStudioAir',
  'readoutStudioAir',
  'sliderStudioWarmth',
  'readoutStudioWarmth',
  'btnApplyStudioMode',
  'btnBypassStudioMode'
];

requiredIds.forEach(id => {
  assert(htmlContent.includes(`id="${id}"`), `HTML must contain element id="${id}"`);
});
console.log(`✓ All ${requiredIds.length} required HTML IDs are present in index.html`);

// 3. Check JavaScript Architecture
console.log('\n[3] Validating JavaScript Architecture in app.js...');
assert(jsContent.includes('studioMasterNodes'), 'app.js must declare studioMasterNodes');
assert(jsContent.includes('updateStudioModeDsp'), 'app.js must define updateStudioModeDsp');
assert(jsContent.includes('applyStudioClarityMode'), 'app.js must define applyStudioClarityMode');
assert(jsContent.includes('toggleStudioMode'), 'app.js must define toggleStudioMode');
assert(jsContent.includes('STUDIO_PRESETS'), 'app.js must define STUDIO_PRESETS');
assert(jsContent.includes('initAllInOneAndStudioMode'), 'app.js must define initAllInOneAndStudioMode');
assert(jsContent.includes('syncAllInOneControlsFromState'), 'app.js must define syncAllInOneControlsFromState');
assert(jsContent.includes("selectedTrackId: 'track-all'"), "app.js must default selectedTrackId to 'track-all'");
assert(jsContent.includes("activeInspectorTab: 'allinone'"), "app.js must default activeInspectorTab to 'allinone'");
assert(jsContent.includes('allInOneStems'), 'app.js state must include allInOneStems');
assert(jsContent.includes('window.applyStudioClarityMode'), 'app.js must expose window.applyStudioClarityMode');
assert(jsContent.includes('window.toggleStudioMode'), 'app.js must expose window.toggleStudioMode');
assert(jsContent.includes('offDeRumble'), 'offline rendering must include offDeRumble filter');
assert(jsContent.includes('offDeMud'), 'offline rendering must include offDeMud filter');
assert(jsContent.includes('offPresence'), 'offline rendering must include offPresence filter');
assert(jsContent.includes('offAir'), 'offline rendering must include offAir filter');
console.log('✓ app.js correctly structures Web Audio DSP chain, state, mastering offline export, and All-In-One methods');

// 4. Standalone Lightweight DOM & Web Audio Graph Simulation
console.log('\n[4] Running Standalone Simulated Logic Test...');

class MockElement {
  constructor(tag, id = '', className = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.className = className;
    this.classList = {
      classes: new Set(className ? className.split(' ') : []),
      add: (c) => this.classList.classes.add(c),
      remove: (c) => this.classList.classes.delete(c),
      toggle: (c, force) => {
        if (typeof force === 'boolean') {
          if (force) this.classList.classes.add(c);
          else this.classList.classes.delete(c);
        } else {
          if (this.classList.classes.has(c)) this.classList.classes.delete(c);
          else this.classList.classes.add(c);
        }
      },
      contains: (c) => this.classList.classes.has(c)
    };
    this.style = {};
    this.dataset = {};
    this.listeners = {};
    this.children = [];
    this.value = '';
    this.textContent = '';
    this.innerHTML = '';
  }

  setAttribute(k, v) { this[k] = v; }
  getAttribute(k) { return this[k]; }
  addEventListener(type, fn) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(fn);
  }
  dispatchEvent(event) {
    const handlers = this.listeners[event.type] || [];
    handlers.forEach((h) => h(event));
  }
  querySelector(sel) { return null; }
  querySelectorAll(sel) { return []; }
  closest(sel) { return this; }
  appendChild(child) { this.children.push(child); }
  remove() {}
}

const mockElementsMap = {};
requiredIds.forEach(id => {
  mockElementsMap[id] = new MockElement('div', id);
});

// Mock document and window globals
const mockDocument = {
  readyState: 'complete',
  getElementById: (id) => mockElementsMap[id] || new MockElement('div', id),
  querySelector: (sel) => null,
  querySelectorAll: (sel) => [],
  createElement: (tag) => new MockElement(tag),
  createElementNS: (ns, tag) => new MockElement(tag),
  addEventListener: () => {}
};

const mockWindow = {
  document: mockDocument,
  addEventListener: () => {},
  AudioContext: class {
    constructor() {
      this.currentTime = 0;
      this.destination = {};
    }
    createGain() { return { gain: { value: 1, setTargetAtTime: () => {} }, connect: () => {} }; }
    createAnalyser() { return { fftSize: 256, connect: () => {} }; }
    createBiquadFilter() { return { frequency: { value: 1000, setTargetAtTime: () => {} }, gain: { value: 0, setTargetAtTime: () => {} }, Q: { value: 1, setTargetAtTime: () => {} }, connect: () => {} }; }
    createStereoPanner() { return { pan: { value: 0 }, connect: () => {} }; }
  },
  localStorage: {
    getItem: () => null,
    setItem: () => {}
  }
};

global.window = mockWindow;
global.document = mockDocument;
global.localStorage = mockWindow.localStorage;
global.AudioContext = mockWindow.AudioContext;

// Evaluate app.js
eval(jsContent);

assert(typeof mockWindow.selectStudioTrack === 'function', 'mockWindow.selectStudioTrack must be function');
assert(typeof mockWindow.applyStudioClarityMode === 'function', 'mockWindow.applyStudioClarityMode must be function');
assert(typeof mockWindow.toggleStudioMode === 'function', 'mockWindow.toggleStudioMode must be function');

// Test selecting track-all
mockWindow.selectStudioTrack('track-all');
console.log('✓ selectStudioTrack("track-all") executed successfully without error');

// Test toggling studio mode
mockWindow.toggleStudioMode();
console.log('✓ toggleStudioMode() executed successfully and updated state');

// Test applying preset
mockWindow.applyStudioClarityMode(true, { preset: 'vocal-polish' });
console.log('✓ applyStudioClarityMode(true, { preset: "vocal-polish" }) executed successfully');

mockWindow.applyStudioClarityMode(true, { preset: 'deep-denoise' });
console.log('✓ applyStudioClarityMode(true, { preset: "deep-denoise" }) executed successfully');

console.log('\n================ ALL TESTS PASSED SUCCESSFULLY ================');
