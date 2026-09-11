const fs = require('fs');
const path = require('path');

const projectRoot = 'c:\\laragon\\www\\Crib_Society_Mixing lagu';
const html = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(projectRoot, 'app.js'), 'utf8');

// Find all buttons, inputs, selects, and elements with IDs
const idMatches = [...html.matchAll(/id=["']([a-zA-Z0-9_-]+)["']/g)].map(m => m[1]);
console.log('Total IDs found in HTML:', idMatches.length);

const unwired = [];
idMatches.forEach(id => {
  if (!js.includes(id)) {
    unwired.push(id);
  }
});

console.log(`\nUnwired IDs count: ${unwired.length}`);
console.log(JSON.stringify(unwired, null, 2));

// Specifically check buttons
const buttonIdMatches = [...html.matchAll(/<button[^>]*id=["']([a-zA-Z0-9_-]+)["'][^>]*>/g)].map(m => m[1]);
console.log(`\nTotal <button> with ID: ${buttonIdMatches.length}`);
const unwiredButtons = buttonIdMatches.filter(id => !js.includes(id));
console.log(`Unwired buttons count: ${unwiredButtons.length}`);
console.log(JSON.stringify(unwiredButtons, null, 2));
