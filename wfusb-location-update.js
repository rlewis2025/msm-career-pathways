const fs = require('fs');

const program = 'MSM';
const rows = [
  ['North Carolina', 22, 11, 14, 47, '41.2%', 'Lead location signal; prioritize alumni, employer history, and role searches here.'],
  ['Georgia', 3, 4, 3, 10, '8.8%', 'Strong regional market; useful for Southeast, Mid-Atlantic, and campus-connected searches.'],
  ['Texas', 3, 4, 2, 9, '7.9%', 'High-value external market; pair applications with alumni outreach and market-specific search terms.'],
  ['Virginia', 0, 3, 4, 7, '6.1%', 'Strong regional market; useful for Southeast, Mid-Atlantic, and campus-connected searches.'],
  ['New York', 0, 5, 1, 6, '5.3%', 'High-value external market; pair applications with alumni outreach and market-specific search terms.'],
  ['Washington, DC', 1, 5, 0, 6, '5.3%', 'Strong regional market; useful for Southeast, Mid-Atlantic, and campus-connected searches.'],
  ['Tennessee', 1, 1, 2, 4, '3.5%', 'Strong regional market; useful for Southeast, Mid-Atlantic, and campus-connected searches.'],
  ['South Carolina', 0, 2, 1, 3, '2.6%', 'Strong regional market; useful for Southeast, Mid-Atlantic, and campus-connected searches.'],
  ['California', 0, 1, 1, 2, '1.8%', 'High-value external market; pair applications with alumni outreach and market-specific search terms.'],
  ['Florida', 1, 0, 1, 2, '1.8%', 'Strong regional market; useful for Southeast, Mid-Atlantic, and campus-connected searches.']
];
const totals = { y2023: 36, y2024: 41, y2025: 37, total: 114 };

function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildBlock() {
  const bodyRows = rows.map(([location, y2023, y2024, y2025, total, share, implication]) => `<tr>\n<td>${escapeHtml(location)}</td><td>${y2023}</td><td>${y2024}</td><td>${y2025}</td><td><strong>${total}</strong></td><td>${share}</td><td style="text-align:left;">${escapeHtml(implication)}</td>\n</tr>`).join('\n');
  return `<div class="card" style="margin-top: 24px;">\n<div class="trend-chart-title" style="font-weight:800;">Top hiring locations, 2023-2025</div>\n<div class="trend-chart-sub">Ranked by coded location counts in the uploaded ${program} by Location_FDS Historical_2018-2025 file. Use this table to identify geographic markets where ${program} students have recently landed. State abbreviations and full state names have been consolidated for readability.</div>\n<div class="table-wrap">\n<table class="skills-table">\n<thead><tr><th>Location</th><th>2023</th><th>2024</th><th>2025</th><th>Total</th><th>Share</th><th style="text-align:left;">Student search implication</th></tr></thead>\n<tbody>\n${bodyRows}\n<tr class="trend-total-row"><td><strong>Coded location total</strong></td><td>${totals.y2023}</td><td>${totals.y2024}</td><td>${totals.y2025}</td><td><strong>${totals.total}</strong></td><td>100.0%</td><td style="text-align:left;">Share shown is of all coded locations represented in the 2023-2025 location extract.</td></tr>\n</tbody></table></div>\n<div class="data-source-note" style="margin-top:16px;"><strong>Verified outcomes data.</strong> Data source: PowerBI data → FDS Historical → ${program} by Location_FDS Historical_2018-2025. Counts reflect coded location records for accepted outcomes in 2023-2025.</div>\n</div>`;
}

function findMatchingDivEnd(html, start) {
  const tagRegex = /<\/?div\b[^>]*>/gi;
  tagRegex.lastIndex = start;
  let depth = 0;
  let match;
  while ((match = tagRegex.exec(html)) !== null) {
    if (match[0].startsWith('</')) depth -= 1;
    else depth += 1;
    if (depth === 0) return tagRegex.lastIndex;
  }
  throw new Error('Could not find matching closing div for location block.');
}

const marker = '<!-- TOP LOCATION TRENDS - 2023-2025 -->';
const htmlPath = 'index.html';
let html = fs.readFileSync(htmlPath, 'utf8');
const block = buildBlock();
let next;
const markerIndex = html.indexOf(marker);
if (markerIndex !== -1) {
  const cardStart = html.indexOf('<div class="card"', markerIndex);
  if (cardStart === -1) throw new Error('Found location marker but no following card div.');
  const cardEnd = findMatchingDivEnd(html, cardStart);
  next = html.slice(0, cardStart) + block + html.slice(cardEnd);
} else {
  const insertBefore = html.indexOf('<!-- INDUSTRY TRENDS -->') !== -1 ? html.indexOf('<!-- INDUSTRY TRENDS -->') : html.indexOf('<!-- student coach prompt: trends -->');
  if (insertBefore === -1) throw new Error('Could not find insertion point for location section.');
  next = html.slice(0, insertBefore) + `${marker}\n${block}\n` + html.slice(insertBefore);
}
if (next !== html) {
  fs.writeFileSync(htmlPath, next, 'utf8');
  console.log(`Updated ${program} top hiring locations section in index.html`);
} else {
  console.log('No changes needed.');
}
