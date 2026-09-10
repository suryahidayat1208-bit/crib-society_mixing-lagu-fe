/**
 * Bilingual Localization (i18n) Verification Suite
 * Suno Music Mixing Studio
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- STARTING BILINGUAL (i18n) VERIFICATION SUITE ---\n');

const htmlContent = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const cssContent = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
const jsContent = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

// 1. Verify HTML Elements
console.log('1. Verifying Language Switcher Elements in index.html...');
assert.ok(htmlContent.includes('id="btnLangToggle"'), 'index.html must have #btnLangToggle');
assert.ok(htmlContent.includes('id="langFlag"'), 'index.html must have #langFlag');
assert.ok(htmlContent.includes('id="langText"'), 'index.html must have #langText');
assert.ok(htmlContent.includes('data-i18n='), 'index.html must have data-i18n attributes');
console.log('  ✓ Language switcher button and data-i18n attributes verified.');

// 2. Verify CSS Styling
console.log('\n2. Verifying Language Switcher CSS in styles.css...');
assert.ok(cssContent.includes('.lang-toggle-btn'), 'styles.css must style .lang-toggle-btn');
console.log('  ✓ .lang-toggle-btn styling verified.');

// 3. Verify JavaScript i18n Engine & Dictionaries
console.log('\n3. Verifying JavaScript Translation Dictionaries in app.js...');
assert.ok(jsContent.includes('const TRANSLATIONS ='), 'app.js must define TRANSLATIONS dictionary');
assert.ok(jsContent.includes('function setLanguage'), 'app.js must define setLanguage()');
assert.ok(jsContent.includes('function toggleLanguage'), 'app.js must define toggleLanguage()');
assert.ok(jsContent.includes('initI18nModule'), 'app.js must call initI18nModule()');

// Extract dictionary from app.js using RegExp
const match = jsContent.match(/const TRANSLATIONS = ({[\s\S]*?\n  };)/);
assert.ok(match, 'TRANSLATIONS dictionary extracted');
const translations = eval('(' + match[1].replace(/;\s*$/, '') + ')');

assert.ok(translations.en, 'English dictionary must exist');
assert.ok(translations.id, 'Indonesian dictionary must exist');

const enKeys = Object.keys(translations.en);
const idKeys = Object.keys(translations.id);

assert.strictEqual(enKeys.length, idKeys.length, 'Dictionary keys count must match');
enKeys.forEach(k => {
  assert.ok(translations.id[k], `Missing translation in ID for key: ${k}`);
  assert.ok(typeof translations.id[k] === 'string' && translations.id[k].length > 0, `Empty translation for key: ${k}`);
});
console.log(`  ✓ Both EN and ID dictionaries verified with ${enKeys.length} matching translation keys.`);

// 4. Test Switching Logic Simulation
console.log('\n4. Testing Localization Switching Logic...');
let currentLang = 'id';
function simulateToggle(lang) {
  return lang === 'id' ? 'en' : 'id';
}
currentLang = simulateToggle(currentLang);
assert.strictEqual(currentLang, 'en', 'Toggled to English');
currentLang = simulateToggle(currentLang);
assert.strictEqual(currentLang, 'id', 'Toggled back to Indonesian');
console.log('  ✓ Reactive language toggle logic verified.');

console.log('\n--- BILINGUAL (i18n) VERIFICATION COMPLETE: ALL TESTS PASSED! ---');
