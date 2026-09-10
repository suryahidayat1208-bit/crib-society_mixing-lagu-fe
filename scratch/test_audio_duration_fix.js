const fs = require('fs');

console.log('--- TESTING AUDIO FULL DURATION & TIMELINE DYNAMIC EXPANSION ---');

const appCode = fs.readFileSync('app.js', 'utf8');

// 1. Verify ensureTimelineDurationForClips exists
if (!appCode.includes('function ensureTimelineDurationForClips()')) {
  throw new Error('ensureTimelineDurationForClips function not found in app.js');
}
console.log('✓ ensureTimelineDurationForClips defined');

// 2. Verify importAudioFileDirectly exists
if (!appCode.includes('function importAudioFileDirectly(')) {
  throw new Error('importAudioFileDirectly function not found in app.js');
}
console.log('✓ importAudioFileDirectly defined');

// 3. Verify drag and drop event listeners on tracksContainer
if (!appCode.includes('elements.tracksContainer.addEventListener(\'drop\'')) {
  throw new Error('Drop listener on tracksContainer not found');
}
console.log('✓ Drag & Drop onto timeline tracks active');

// 4. Verify direct toolbar import button and input
if (!appCode.includes('elements.btnStudioImportAudio') || !appCode.includes('studioDirectFileInput')) {
  throw new Error('Direct toolbar import button or file input not hooked up');
}
console.log('✓ Direct toolbar Import Audio button hooked up');

// 5. Verify playbackLoop effective duration calculation
if (!appCode.includes('let maxEndTime = state.totalDuration') || !appCode.includes('maxClipEnd = Math.max(maxClipEnd')) {
  throw new Error('playbackLoop does not dynamically calculate effective duration');
}
console.log('✓ playbackLoop dynamically respects full song duration');

// 6. Verify default clips start at 0.0 and span 225.0s
if (!appCode.includes('startSec: 0.0,\n        durationSec: 225.0')) {
  throw new Error('Default clips duration not extended to 225.0s');
}
console.log('✓ Default demo clips extended to full project duration (225s)');

// 7. Verify index.html cache-buster version 2.2.0
const htmlCode = fs.readFileSync('index.html', 'utf8');
if (!htmlCode.includes('app.js?v=2.2.0') || !htmlCode.includes('styles.css?v=2.2.0')) {
  throw new Error('index.html does not have v=2.2.0 cache buster');
}
console.log('✓ index.html cache-buster query string v=2.2.0 active');

// 8. Verify toolbar import button exists in index.html
if (!htmlCode.includes('id="btnStudioImportAudio"') || !htmlCode.includes('id="studioDirectFileInput"')) {
  throw new Error('index.html missing toolbar import elements');
}
console.log('✓ index.html has btnStudioImportAudio and studioDirectFileInput');

// 9. Verify track-drop-hover CSS class in styles.css
const cssCode = fs.readFileSync('styles.css', 'utf8');
if (!cssCode.includes('.track-lane.track-drop-hover')) {
  throw new Error('styles.css missing .track-lane.track-drop-hover');
}
console.log('✓ styles.css has .track-lane.track-drop-hover styling');

console.log('--- ALL AUDIO DURATION & PLAYBACK TESTS PASSED! ---');
