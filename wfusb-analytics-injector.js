const fs = require('fs');
const path = require('path');

const GA4_ID = process.env.GA4_MEASUREMENT_ID || process.env.GA_MEASUREMENT_ID || '';
const CLARITY_ID = process.env.CLARITY_PROJECT_ID || '';
const ROOT = process.cwd();
const MARKER_START = '<!-- WFUSB Analytics: Google Analytics 4 + Microsoft Clarity -->';
const MARKER_END = '<!-- /WFUSB Analytics -->';

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.html?$/i.test(entry.name)) files.push(full);
  }
  return files;
}

function trackingSnippet() {
  return `${MARKER_START}
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA4_ID}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${GA4_ID}');
</script>
<script>
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window, document, 'clarity', 'script', '${CLARITY_ID}');
</script>
${MARKER_END}`;
}

if (!GA4_ID || !CLARITY_ID) {
  console.warn('WFUSB analytics injector skipped: set repository variable or secret GA4_MEASUREMENT_ID and CLARITY_PROJECT_ID.');
  process.exit(0);
}

const blockPattern = new RegExp(`${MARKER_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${MARKER_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'g');
let updated = 0;

for (const file of walk(ROOT)) {
  let html = fs.readFileSync(file, 'utf8');
  if (!/<\/head>/i.test(html)) continue;
  const withoutOldBlock = html.replace(blockPattern, '');
  const next = withoutOldBlock.replace(/<\/head>/i, `${trackingSnippet()}\n</head>`);
  if (next !== html) {
    fs.writeFileSync(file, next, 'utf8');
    updated += 1;
    console.log(`Injected analytics into ${path.relative(ROOT, file)}`);
  }
}

console.log(`WFUSB analytics injector complete. HTML files updated: ${updated}`);
