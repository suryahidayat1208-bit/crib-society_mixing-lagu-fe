const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== RUNNING TESTS: Soundcard, Audio Interface, Laptop Compact & SOT Palette ===');

const projectRoot = path.resolve(__dirname, '..');
const htmlContent = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
const cssContent = fs.readFileSync(path.join(projectRoot, 'styles.css'), 'utf8');
const jsContent = fs.readFileSync(path.join(projectRoot, 'app.js'), 'utf8');

// 1. Validate SOT Color Palette in styles.css
console.log('\n[1] Checking SOT Color Tokens in styles.css...');
assert(cssContent.includes('--bg-main: #08090D'), 'styles.css must have locked SOT background #08090D');
assert(cssContent.includes('--primary: #8B5CF6'), 'styles.css must have locked SOT primary #8B5CF6');
assert(cssContent.includes('--accent: #22D3EE'), 'styles.css must have locked SOT accent #22D3EE');
assert(cssContent.includes('.compact-timeline'), 'styles.css must define .compact-timeline');
assert(cssContent.includes('.compact-mode'), 'styles.css must define .compact-mode for inspector');
assert(cssContent.includes('.mixer-console-drawer.minimized'), 'styles.css must define .mixer-console-drawer.minimized');
assert(cssContent.includes('max-height: 88vh'), 'styles.css must have laptop modal viewport protection');
console.log('✓ SOT Color tokens and laptop compact CSS classes verified successfully.');

// 2. Validate HTML Elements
console.log('\n[2] Checking HTML elements in index.html...');
const requiredIds = [
  'soundcardModal',
  'btnOpenSoundcard',
  'topbarSoundcardBadge',
  'btnCloseSoundcardModal',
  'btnCancelSoundcard',
  'btnApplySoundcard',
  'btnTestSoundcardTone',
  'selectSoundcardDevice',
  'selectSoundcardSampleRate',
  'selectSoundcardBuffer',
  'readoutAudioCtxState',
  'readoutSampleRate',
  'readoutBaseLatency',
  'readoutOutputChannels',
  'soundcardLiveStatusBadge',
  'btnToggleTimelineCompact',
  'btnToggleInspectorCompact',
  'btnToggleMixerCompact',
  'navSettings',
  'btnSubmitNewProject'
];

requiredIds.forEach(id => {
  assert(htmlContent.includes(`id="${id}"`), `index.html must include id="${id}"`);
});
console.log(`✓ All ${requiredIds.length} required HTML elements are present in index.html.`);

// 3. Functional Simulation Test with Mock DOM
console.log('\n[3] Testing Soundcard & Compact Interactions with Mock DOM...');

class MockClassList {
  constructor() {
    this.classes = new Set();
  }
  add(c) { this.classes.add(c); }
  remove(c) { this.classes.delete(c); }
  toggle(c, force) {
    if (typeof force === 'boolean') {
      if (force) this.classes.add(c);
      else this.classes.delete(c);
      return force;
    }
    if (this.classes.has(c)) {
      this.classes.delete(c);
      return false;
    } else {
      this.classes.add(c);
      return true;
    }
  }
  contains(c) { return this.classes.has(c); }
}

class MockElement {
  constructor(id, tagName = 'div') {
    this.id = id;
    this.tagName = tagName.toUpperCase();
    this.classList = new MockClassList();
    this.style = {};
    this.attributes = {};
    this.listeners = {};
    this.children = [];
    this.value = '';
    this.textContent = '';
    this.title = '';
    this.dataset = {};
    this.innerHTML = '';
  }
  addEventListener(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }
  dispatchEvent(event) {
    const type = typeof event === 'string' ? event : event.type;
    const fns = this.listeners[type] || [];
    fns.forEach(fn => fn(event));
    return true;
  }
  appendChild(child) {
    this.children.push(child);
  }
  remove() {}
  querySelectorAll(selector) { return []; }
  querySelector(selector) { return null; }
  setAttribute(k, v) { this.attributes[k] = v; }
  getAttribute(k) { return this.attributes[k]; }
  getBoundingClientRect() {
    return { top: 0, left: 0, right: 1000, bottom: 600, width: 1000, height: 600 };
  }
}

// Build mock document
const domMap = new Map();
function getOrCreate(id, tag = 'div') {
  if (!domMap.has(id)) {
    domMap.set(id, new MockElement(id, tag));
  }
  return domMap.get(id);
}

// Extract IDs from htmlContent and register
const idMatches = htmlContent.matchAll(/id=["']([^"']+)["']/g);
for (const m of idMatches) {
  getOrCreate(m[1]);
}

// Mock Web Audio Context
class MockOscillator {
  constructor() {
    this.frequency = { setValueAtTime: () => {} };
  }
  connect() {}
  start() {}
  stop() {}
}

class MockGain {
  constructor() {
    this.gain = {
      setValueAtTime: () => {},
      exponentialRampToValueAtTime: () => {}
    };
  }
  connect() {}
}

class MockAudioContext {
  constructor() {
    this.state = 'running';
    this.sampleRate = 48000;
    this.baseLatency = 0.005;
    this.currentTime = 0;
    this.destination = { channelCount: 2 };
  }
  resume() { return Promise.resolve(); }
  createOscillator() { return new MockOscillator(); }
  createGain() { return new MockGain(); }
  createBiquadFilter() { return { frequency: { value: 100 }, gain: { value: 0 }, Q: { value: 1 } }; }
  createAnalyser() { return { fftSize: 256, getByteFrequencyData: () => {} }; }
  createDynamicsCompressor() { return { threshold: {}, ratio: {}, attack: {}, release: {}, knee: {} }; }
  createStereoPanner() { return { pan: { value: 0 } }; }
  createConvolver() { return {}; }
  createDelay() { return { delayTime: {} }; }
  createBuffer() { return {}; }
}

const mockDoc = {
  readyState: 'complete',
  getElementById: (id) => domMap.get(id) || null,
  querySelectorAll: () => [],
  querySelector: () => null,
  createElement: (tag) => new MockElement('', tag),
  createElementNS: (ns, tag) => new MockElement('', tag),
  addEventListener: () => {}
};

const mockWindow = {
  document: mockDoc,
  localStorage: {
    getItem: () => null,
    setItem: () => {}
  },
  AudioContext: MockAudioContext,
  webkitAudioContext: MockAudioContext,
  navigator: {
    mediaDevices: {
      enumerateDevices: () => Promise.resolve([
        { kind: 'audiooutput', deviceId: 'dev-1', label: 'Realtek High Definition Audio' },
        { kind: 'audiooutput', deviceId: 'dev-2', label: 'Focusrite Scarlett 2i2 USB' }
      ])
    }
  },
  addEventListener: () => {},
  setTimeout: (fn) => setTimeout(fn, 10),
  requestAnimationFrame: () => 1
};

// Evaluate app.js in sandbox
const vm = require('vm');
const sandbox = {
  window: mockWindow,
  document: mockDoc,
  localStorage: mockWindow.localStorage,
  navigator: mockWindow.navigator,
  AudioContext: MockAudioContext,
  webkitAudioContext: MockAudioContext,
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  requestAnimationFrame: () => 1,
  cancelAnimationFrame: () => {},
  Event: function(type, opts) { this.type = type; this.opts = opts; this.preventDefault = () => {}; }
};

vm.createContext(sandbox);
vm.runInContext(jsContent, sandbox);

// 4. Test Actions
console.log('\n[4] Validating runtime event listener actions...');

const soundcardModal = domMap.get('soundcardModal');
const btnOpenSoundcard = domMap.get('btnOpenSoundcard');
const navSettings = domMap.get('navSettings');
const btnCloseSoundcardModal = domMap.get('btnCloseSoundcardModal');
const btnTestSoundcardTone = domMap.get('btnTestSoundcardTone');
const btnApplySoundcard = domMap.get('btnApplySoundcard');
const selectSoundcardSampleRate = domMap.get('selectSoundcardSampleRate');
const topbarSoundcardBadge = domMap.get('topbarSoundcardBadge');

// Test 4.1: Open modal via topbar button
btnOpenSoundcard.dispatchEvent('click');
assert.strictEqual(soundcardModal.style.display, 'flex', 'Clicking #btnOpenSoundcard must show soundcardModal');
console.log('✓ Opening Soundcard Modal via topbar button works.');

// Test 4.2: Close modal
btnCloseSoundcardModal.dispatchEvent('click');
assert.strictEqual(soundcardModal.style.display, 'none', 'Clicking #btnCloseSoundcardModal must hide soundcardModal');
console.log('✓ Closing Soundcard Modal works.');

// Test 4.3: Open modal via sidebar settings nav
navSettings.dispatchEvent({ type: 'click', preventDefault: () => {} });
assert.strictEqual(soundcardModal.style.display, 'flex', 'Clicking #navSettings must show soundcardModal');
console.log('✓ Opening Soundcard Modal via Sidebar settings nav works.');

// Test 4.4: 440Hz Test Beep Generator
const statusBadge = domMap.get('soundcardLiveStatusBadge');
btnTestSoundcardTone.dispatchEvent('click');
assert.strictEqual(statusBadge.textContent, 'OUTPUT OK', 'Test tone should indicate OUTPUT OK');
console.log('✓ 440Hz Test Tone Audio generator triggered successfully.');

// Test 4.5: Apply soundcard config
selectSoundcardSampleRate.value = '96000';
btnApplySoundcard.dispatchEvent('click');
assert.strictEqual(soundcardModal.style.display, 'none', 'Applying configuration must hide modal');
assert.strictEqual(topbarSoundcardBadge.textContent, '96kHz', 'Topbar badge should update to 96kHz');
console.log('✓ Soundcard sample rate configuration applies and updates topbar badge.');

// Test 4.6: Laptop Timeline Compact Toggle
const tracksContainer = domMap.get('tracksContainer');
const btnToggleTimelineCompact = domMap.get('btnToggleTimelineCompact');
btnToggleTimelineCompact.dispatchEvent('click');
assert(tracksContainer.classList.contains('compact-timeline'), 'Timeline should have .compact-timeline active');
btnToggleTimelineCompact.dispatchEvent('click');
assert(!tracksContainer.classList.contains('compact-timeline'), 'Timeline should toggle back to normal');
console.log('✓ Timeline Compact mode toggle functions correctly.');

// Test 4.7: Inspector Compact Toggle
const inspectorPanel = domMap.get('inspectorPanel');
const btnToggleInspectorCompact = domMap.get('btnToggleInspectorCompact');
btnToggleInspectorCompact.dispatchEvent('click');
assert(inspectorPanel.classList.contains('compact-mode'), 'Inspector should have .compact-mode active');
btnToggleInspectorCompact.dispatchEvent('click');
assert(!inspectorPanel.classList.contains('compact-mode'), 'Inspector should toggle back to normal');
console.log('✓ Inspector Compact mode toggle functions correctly.');

// Test 4.8: Mixer Console Drawer Minimize Toggle
const mixerConsoleDrawer = domMap.get('mixerConsoleDrawer');
const btnToggleMixerCompact = domMap.get('btnToggleMixerCompact');
btnToggleMixerCompact.dispatchEvent('click');
assert(mixerConsoleDrawer.classList.contains('minimized'), 'Mixer Console drawer should have .minimized active');
assert.strictEqual(btnToggleMixerCompact.textContent, '◻ Maximize');
btnToggleMixerCompact.dispatchEvent('click');
assert(!mixerConsoleDrawer.classList.contains('minimized'), 'Mixer Console drawer should maximize');
assert.strictEqual(btnToggleMixerCompact.textContent, '_ Minimize');
console.log('✓ Mixer Console Drawer minimize/maximize toggle functions correctly.');

// Test 4.9: #btnSubmitNewProject trigger
let newProjectSubmitted = false;
const newProjectForm = domMap.get('newProjectForm');
newProjectForm.addEventListener('submit', (e) => {
  newProjectSubmitted = true;
});
const btnSubmitNewProject = domMap.get('btnSubmitNewProject');
btnSubmitNewProject.dispatchEvent({ type: 'click', preventDefault: () => {} });
assert(newProjectSubmitted, '#btnSubmitNewProject must dispatch submit on #newProjectForm');
console.log('✓ #btnSubmitNewProject forwards click to form submission successfully.');

console.log('\n🎉 ALL SOUNDCARD, COMPACT MINIMIZE, AND SOT PALETTE TESTS PASSED 100%!\n');
setTimeout(() => process.exit(0), 50);
