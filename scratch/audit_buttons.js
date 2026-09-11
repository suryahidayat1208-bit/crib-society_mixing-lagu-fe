const fs = require('fs');
const path = require('path');

const projectRoot = 'c:\\laragon\\www\\Crib_Society_Mixing lagu';
const html = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(projectRoot, 'app.js'), 'utf8');

// Match all buttons in html
const buttonRegex = /<button\b([^>]*)>(.*?)<\/button>/gis;
let match;
const buttons = [];
while ((match = buttonRegex.exec(html)) !== null) {
  const attrs = match[1];
  const inner = match[2].replace(/<[^>]+>/g, '').trim();
  const idMatch = attrs.match(/id=["']([^"']+)["']/);
  const classMatch = attrs.match(/class=["']([^"']+)["']/);
  const dataTab = attrs.match(/data-tab=["']([^"']+)["']/);
  const dataView = attrs.match(/data-view=["']([^"']+)["']/);
  const title = attrs.match(/title=["']([^"']+)["']/);

  buttons.push({
    id: idMatch ? idMatch[1] : null,
    className: classMatch ? classMatch[1] : null,
    dataTab: dataTab ? dataTab[1] : null,
    dataView: dataView ? dataView[1] : null,
    title: title ? title[1] : null,
    text: inner.substring(0, 30)
  });
}

console.log('Total buttons found:', buttons.length);

const unhandled = buttons.filter(b => {
  if (b.id && js.includes(b.id)) return false;
  if (b.dataView && js.includes('data-view') || js.includes('nav-item')) {
    // Check if views handle it
    if (b.dataView === 'settings') return true; // not handled!
    return false;
  }
  if (b.dataTab && (js.includes('data-tab') || js.includes('tab-btn'))) return false;
  if (b.className && b.className.includes('mini-toggle-btn')) return false;
  if (b.className && b.className.includes('filter-pill')) return false;
  if (b.className && b.className.includes('tool-btn')) return false;
  if (b.className && b.className.includes('fx-preset-card')) return false;
  if (b.className && b.className.includes('studio-preset-card')) return false;
  if (b.className && b.className.includes('lang-toggle-btn')) return false;
  return true;
});

console.log('Potentially unhandled buttons:', unhandled.length);
console.log(JSON.stringify(unhandled, null, 2));
