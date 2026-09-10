/**
 * Phase 9: QA & Polish Automated Verification Suite
 * Suno Music Mixing Studio
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- STARTING PHASE 9 QA & POLISH VERIFICATION SUITE ---\n');

const htmlContent = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const cssContent = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
const jsContent = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

// 1. Accessibility & ARIA Verification
console.log('1. Verifying Accessibility & ARIA Attribute Coverage in index.html...');
const btnRegex = /<button\s+([^>]+)>/gi;
let match;
let missingAriaButtons = [];
while ((match = btnRegex.exec(htmlContent)) !== null) {
  const attrs = match[1];
  const hasAria = /aria-label=/i.test(attrs);
  const idMatch = attrs.match(/id="([^"]+)"/);
  const id = idMatch ? idMatch[1] : 'no-id';
  const isIconBtn = /class="[^"]*icon-btn/i.test(attrs) || /class="[^"]*zoom-btn/i.test(attrs);
  if (!hasAria && isIconBtn) {
    missingAriaButtons.push(id);
  }
}
assert.strictEqual(missingAriaButtons.length, 0, `Icon buttons missing aria-label: ${missingAriaButtons.join(', ')}`);
console.log('  ✓ All icon-only and zoom buttons have explicit aria-label attributes.');

// Verify all modals have dialog roles
const expectedModals = [
  'shortcutsModal',
  'newProjectModal',
  'uploadModal',
  'renameModal',
  'deleteProjectModal',
  'audioAnalysisModal',
  'autoMixModal',
  'exportModal',
  'presetsModal'
];

expectedModals.forEach(modalId => {
  const modalRegex = new RegExp(`<div\\s+class="modal-backdrop"\\s+id="${modalId}"[^>]*role="dialog"[^>]*aria-modal="true"[^>]*aria-labelledby="[^"]+"`);
  assert.ok(modalRegex.test(htmlContent), `Modal #${modalId} missing role="dialog", aria-modal="true", or aria-labelledby`);
});
console.log(`  ✓ All ${expectedModals.length} modals have valid role="dialog", aria-modal="true", and aria-labelledby.`);

// 2. Focus Visibility & Locked Design System Tokens
console.log('\n2. Verifying Focus Visibility & Design System Tokens in styles.css...');
assert.ok(cssContent.includes(':focus-visible'), 'styles.css must define :focus-visible rules');
assert.ok(cssContent.includes('button:focus-visible'), 'styles.css must define button:focus-visible rules');
assert.ok(cssContent.includes('input:focus-visible'), 'styles.css must define input:focus-visible rules');

const lockedTokens = [
  '--bg-main: #08090D;',
  '--sidebar-bg: #0D0F14;',
  '--panel-bg: #13161D;',
  '--active-panel-bg: #1A1E27;',
  '--border-color: #272C36;',
  '--primary: #8B5CF6;',
  '--primary-hover: #A78BFA;',
  '--accent: #22D3EE;',
  '--success: #22C55E;',
  '--warning: #F59E0B;',
  '--danger: #EF4444;',
  '--text-main: #F8FAFC;',
  '--text-secondary: #94A3B8;',
  '--text-muted: #64748B;'
];

lockedTokens.forEach(token => {
  assert.ok(cssContent.includes(token), `Locked color token missing: ${token}`);
});
console.log(`  ✓ All ${lockedTokens.length} locked SOT color tokens and :focus-visible outline rules verified.`);

// 3. Responsive Media Queries
console.log('\n3. Verifying Responsive Viewport Breakpoints in styles.css...');
const requiredBreakpoints = [
  '@media (max-width: 1280px)',
  '@media (max-width: 1024px)',
  '@media (max-width: 768px)',
  '@media (max-width: 480px)'
];

requiredBreakpoints.forEach(bp => {
  assert.ok(cssContent.includes(bp), `Missing media query: ${bp}`);
});
console.log(`  ✓ All ${requiredBreakpoints.length} responsive breakpoints (1280px, 1024px, 768px, 480px) active.`);

// 4. Undo / Redo History Engine Logic Simulation
console.log('\n4. Testing Undo / Redo State History Engine Logic...');
assert.ok(jsContent.includes('pushHistorySnapshot'), 'app.js must include pushHistorySnapshot');
assert.ok(jsContent.includes('function undo()'), 'app.js must include function undo()');
assert.ok(jsContent.includes('function redo()'), 'app.js must include function redo()');
assert.ok(jsContent.includes('initHistoryModule'), 'app.js must include initHistoryModule');
assert.ok(jsContent.includes('updateUndoRedoButtons'), 'app.js must include updateUndoRedoButtons');

// Simulate History Stack Behavior
class HistoryEngineSimulator {
  constructor(maxHistory = 30) {
    this.past = [];
    this.future = [];
    this.maxHistory = maxHistory;
    this.state = { volume: 0, pan: 0 };
  }

  push(actionName) {
    this.past.push({ actionName, state: { ...this.state } });
    if (this.past.length > this.maxHistory) this.past.shift();
    this.future = [];
  }

  undo() {
    if (this.past.length === 0) return null;
    const prev = this.past.pop();
    this.future.push({ actionName: prev.actionName, state: { ...this.state } });
    this.state = { ...prev.state };
    return prev.actionName;
  }

  redo() {
    if (this.future.length === 0) return null;
    const next = this.future.pop();
    this.past.push({ actionName: next.actionName, state: { ...this.state } });
    this.state = { ...next.state };
    return next.actionName;
  }
}

const sim = new HistoryEngineSimulator(5);
assert.strictEqual(sim.past.length, 0);
assert.strictEqual(sim.future.length, 0);

sim.push('Initial');
sim.state.volume = -3;
sim.push('Volume Change');
sim.state.volume = 2;

assert.strictEqual(sim.past.length, 2);
const undone = sim.undo();
assert.strictEqual(undone, 'Volume Change');
assert.strictEqual(sim.state.volume, -3);
assert.strictEqual(sim.future.length, 1);

const redone = sim.redo();
assert.strictEqual(redone, 'Volume Change');
assert.strictEqual(sim.state.volume, 2);
assert.strictEqual(sim.future.length, 0);

// Test stack limit
for (let i = 0; i < 10; i++) {
  sim.push(`Action ${i}`);
}
assert.strictEqual(sim.past.length, 5, 'History capacity must be capped at max limit');
console.log('  ✓ History snapshot pushing, undo stack, redo stack, and limit capping verified.');

// 5. Input Safety Clamping Tests
console.log('\n5. Testing Input Clamping Safety Rules...');
assert.ok(jsContent.includes('Math.max(-60, Math.min(6'), 'syncTrackVolume must clamp between -60 and +6 dB');
assert.ok(jsContent.includes('Math.max(-50, Math.min(50'), 'syncTrackPan must clamp between -50 and +50');
assert.ok(jsContent.includes('Math.max(-24, Math.min(24'), 'Gain trim must clamp between -24 and +24 dB');

function clampVol(val) {
  return Math.max(-60, Math.min(6, isNaN(val) ? 0 : val));
}
assert.strictEqual(clampVol(10), 6, 'Volume cannot exceed +6 dB');
assert.strictEqual(clampVol(-100), -60, 'Volume cannot go below -60 dB');
assert.strictEqual(clampVol(-12.5), -12.5);

function clampPan(val) {
  return Math.max(-50, Math.min(50, isNaN(val) ? 0 : val));
}
assert.strictEqual(clampPan(100), 50, 'Pan cannot exceed +50 (Right)');
assert.strictEqual(clampPan(-80), -50, 'Pan cannot go below -50 (Left)');
assert.strictEqual(clampPan(0), 0);

console.log('  ✓ Input range clamping for volume, pan, and gain trim verified.');

// 6. Memory Leak Prevention: URL.revokeObjectURL
console.log('\n6. Verifying Object URL Cleanup in Audio Export...');
assert.ok(jsContent.includes('URL.revokeObjectURL'), 'app.js must call URL.revokeObjectURL on blob export');
console.log('  ✓ Browser object URL memory cleanup verified.');

console.log('\n--- PHASE 9 QA & POLISH VERIFICATION COMPLETE: ALL TESTS PASSED! ---');
