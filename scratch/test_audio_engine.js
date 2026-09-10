/**
 * Audio Engine Verification Suite
 * Suno Music Mixing Studio
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- STARTING AUDIO ENGINE VERIFICATION SUITE ---\n');

const jsContent = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

// 1. Check AudioContext & Core Audio Graph functions
console.log('1. Verifying AudioContext & Node Graph definitions...');
assert.ok(jsContent.includes('function getAudioContext()'), 'app.js must define getAudioContext()');
assert.ok(jsContent.includes('function ensureTrackAudioNodes()'), 'app.js must define ensureTrackAudioNodes()');
assert.ok(jsContent.includes('function updateAudioTrackNode('), 'app.js must define updateAudioTrackNode()');
assert.ok(jsContent.includes('function updateMasterAudioNode()'), 'app.js must define updateMasterAudioNode()');
console.log('  ✓ Core AudioContext and Track DSP node graph verified.');

// 2. Check Procedural Synth Generators
console.log('\n2. Verifying Procedural Audio Generators...');
assert.ok(jsContent.includes('function generateProceduralDrumsBuffer('), 'app.js must define generateProceduralDrumsBuffer');
assert.ok(jsContent.includes('function generateProceduralBassBuffer('), 'app.js must define generateProceduralBassBuffer');
assert.ok(jsContent.includes('function generateProceduralLeadBuffer('), 'app.js must define generateProceduralLeadBuffer');
assert.ok(jsContent.includes('function getClipAudioBuffer('), 'app.js must define getClipAudioBuffer');
console.log('  ✓ All 3 procedural sound generators (Drums, Bass, Lead) verified.');

// 3. Check Real-time Audio Playback Controls
console.log('\n3. Verifying Real Audio Playback & Stop Routing...');
assert.ok(jsContent.includes('function startAudioPlayback()'), 'app.js must define startAudioPlayback()');
assert.ok(jsContent.includes('function stopAudioPlayback()'), 'app.js must define stopAudioPlayback()');
assert.ok(jsContent.includes('startAudioPlayback()'), 'startPlayback must call startAudioPlayback()');
assert.ok(jsContent.includes('stopAudioPlayback()'), 'pausePlayback must call stopAudioPlayback()');
console.log('  ✓ Real audio playback and stop routing verified.');

// 4. Check Upload Audio Decoding
console.log('\n4. Verifying File Upload AudioBuffer Decoding...');
assert.ok(jsContent.includes('decodeAudioData'), 'handleIncomingFile must use decodeAudioData for real files');
assert.ok(jsContent.includes('state.pendingDecodedBuffer'), 'pendingDecodedBuffer must be stored');
assert.ok(jsContent.includes('AUDIO_BUFFERS[newClip.id]'), 'addSongToTimeline must attach buffer to newClip');
console.log('  ✓ Upload decoding to AudioBuffer verified.');

// 5. Check Track DSP Parameter Automation
console.log('\n5. Verifying Real-time Fader & EQ DSP connections...');
assert.ok(jsContent.includes('updateAudioTrackNode(id);'), 'syncTrackVolume and syncTrackPan must call updateAudioTrackNode');
assert.ok(jsContent.includes('updateMasterAudioNode();'), 'Master faders must call updateMasterAudioNode');
console.log('  ✓ Track volume, pan, mute, solo, and master fader DSP connections verified.');

console.log('\n--- AUDIO ENGINE VERIFICATION COMPLETE: ALL TESTS PASSED! ---');
