/**
 * Static verification for the responsive layout.  Run: npm run verify:ui
 *  1. Every JSX file under src/ must parse.
 *  2. Every .tbl table: td count per row must match th count (colSpan aware),
 *     and every td that isn't a headline/actions/checkbox/full-width cell must
 *     carry a data-label matching its column header — the labels are what the
 *     stacked mobile card layout prints instead of the (hidden) header row.
 *  3. index.css: braces balanced, required rules + breakpoints present, and no
 *     inline pixel min-widths left on tables (they'd beat the stylesheet).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

let parse;
try {
  ({ parse } = await import('@babel/parser'));
} catch {
  console.error('@babel/parser not found — run `npm install` in client/ first.');
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const SRC = process.argv[2] || join(here, '..', 'src');
let fail = 0;
const bad = (m) => { fail++; console.log('  FAIL ' + m); };
const ok = (m) => console.log('  ok   ' + m);

/* ── 1. parse every jsx in the app ─────────────────────────────────────── */
function walkFiles(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walkFiles(p, out);
    else if (/\.jsx?$/.test(e)) out.push(p);
  }
  return out;
}
const files = walkFiles(SRC);
console.log('\n1. Parse check (' + files.length + ' files)');
const asts = new Map();
for (const f of files) {
  try {
    asts.set(f, parse(readFileSync(f, 'utf8'), { sourceType: 'module', plugins: ['jsx'] }));
  } catch (e) {
    bad(relative(SRC, f) + ' — ' + e.message);
  }
}
if (asts.size === files.length) ok('all files parse as ESM + JSX');

/* ── 2. table structure ────────────────────────────────────────────────── */
const name = (n) => (n?.type === 'JSXIdentifier' ? n.name : null);
function attrs(el) {
  const o = {};
  for (const a of el.openingElement?.attributes || []) {
    if (a.type !== 'JSXAttribute') continue;
    const v = a.value;
    if (!v) { o[a.name.name] = true; continue; }
    if (v.type === 'StringLiteral') o[a.name.name] = v.value;
    else if (v.type === 'JSXExpressionContainer') {
      const e = v.expression;
      o[a.name.name] = e.type === 'NumericLiteral' || e.type === 'StringLiteral'
        ? e.value
        : '<expr>';
      if (a.name.name === 'style' && e.type === 'ObjectExpression') {
        o.styleProps = e.properties.map(
          (p) => (p.key?.value ?? p.key?.name) + ':' +
                 (p.value?.value ?? '<expr>')
        );
      }
    } else o[a.name.name] = '<expr>';
  }
  return o;
}
/** text of an element's simple string children, for th labels */
function textOf(el) {
  let s = '';
  const visit = (n) => {
    if (!n || typeof n !== 'object') return;
    if (n.type === 'JSXText') s += n.value;
    for (const k of Object.keys(n)) {
      const v = n[k];
      if (Array.isArray(v)) v.forEach(visit);
      else if (v && typeof v === 'object' && v.type) visit(v);
    }
  };
  el.children?.forEach(visit);
  return s.replace(/\s+/g, ' ').trim();
}
function collect(node, tag, out = []) {
  if (!node || typeof node !== 'object') return out;
  if (node.type === 'JSXElement' && name(node.openingElement.name) === tag) out.push(node);
  for (const k of Object.keys(node)) {
    const v = node[k];
    if (Array.isArray(v)) v.forEach((c) => collect(c, tag, out));
    else if (v && typeof v === 'object' && v.type) collect(v, tag, out);
  }
  return out;
}

console.log('\n2. Table structure (headers ↔ cells ↔ data-labels)');
const NO_LABEL = new Set(['cell-main', 'cell-actions', 'cell-check', 'cell-empty', 'cell-runway']);
let tableCount = 0;
for (const [f, ast] of asts) {
  for (const table of collect(ast, 'table')) {
    const cls = attrs(table).className || '';
    if (!/\btbl\b/.test(cls)) continue;
    tableCount++;
    const where = relative(SRC, f) + ' <table class="' + cls + '">';
    const inlineMin = (attrs(table).styleProps || []).filter((p) => /^minWidth/.test(p));
    if (inlineMin.length) bad(where + ' still has inline ' + inlineMin.join(','));

    const heads = collect(table, 'thead').flatMap((t) => collect(t, 'th'));
    const headLabels = heads.map(textOf);
    const rows = collect(table, 'tbody').flatMap((t) => collect(t, 'tr'));
    for (const [i, tr] of rows.entries()) {
      const tds = collect(tr, 'td');
      const span = tds.reduce((n, td) => n + (Number(attrs(td).colSpan) || 1), 0);
      if (heads.length && span !== heads.length) {
        bad(where + ' row ' + (i + 1) + ': ' + span + ' cells vs ' + heads.length + ' headers');
      }
      tds.forEach((td, ci) => {
        const a = attrs(td);
        const classes = String(a.className || '').split(/\s+/);
        const roleless = !classes.some((c) => NO_LABEL.has(c));
        const header = headLabels[ci] || '';
        const hasLabel = typeof a['data-label'] === 'string' && a['data-label'].length > 0;
        if (a.colSpan) return;                       // full-width empty state
        if (roleless && !hasLabel) {
          bad(where + ' row ' + (i + 1) + ' cell ' + (ci + 1) +
              ' ("' + header + '") has no data-label and no cell-* role');
        }
        if (hasLabel && header && a['data-label'] !== header) {
          bad(where + ' cell ' + (ci + 1) + ' label "' + a['data-label'] +
              '" ≠ header "' + header + '"');
        }
        // hide-md must be applied to header and cell together
        const thHidden = heads[ci] ? /hide-md/.test(String(attrs(heads[ci]).className || '')) : false;
        const tdHidden = classes.includes('hide-md');
        if (heads.length && thHidden !== tdHidden) {
          bad(where + ' cell ' + (ci + 1) + ' hide-md mismatch (th ' + thHidden + ' / td ' + tdHidden + ')');
        }
      });
    }
    ok(where + ' — ' + heads.length + ' headers, ' + rows.length + ' row template(s)');
  }
}
if (!tableCount) bad('no .tbl tables found — selector changed?');

/* ── 3. css ────────────────────────────────────────────────────────────── */
console.log('\n3. index.css');
const css = readFileSync(join(SRC, 'index.css'), 'utf8');
const opens = (css.match(/{/g) || []).length;
const closes = (css.match(/}/g) || []).length;
opens === closes ? ok('braces balanced (' + opens + ')') : bad('braces ' + opens + ' vs ' + closes);

const need = [
  [/min-width:\s*var\(--tbl-min,\s*640px\)/, 'table floor uses --tbl-min'],
  [/\.grid > \*,[\s\S]{0,400}min-width: 0;/, 'grid/flex children get min-width:0'],
  [/@media \(max-width: 1100px\)/, '1100px breakpoint (tablet landscape)'],
  [/@media \(min-width: 861px\) and \(max-width: 1100px\)/, '.hide-md band'],
  [/@media \(max-width: 960px\)/, '960px drawer'],
  [/@media \(max-width: 860px\)/, '860px stacked tables'],
  [/@media \(max-width: 620px\)/, '620px phone'],
  [/@media \(max-width: 460px\)/, '460px small phone'],
  [/\.tbl thead \{ display: none; \}/, 'thead hidden when stacked'],
  [/content: attr\(data-label\)/, 'labels come from data-label'],
  [/table\.tbl \{ display: block; min-width: 0; \}/, 'table floor dropped when stacked (specificity-proof)'],
  [/\.table-scroll \{ overflow-x: visible; \}/, 'no inner scroll when stacked'],
  [/min-width: min\(var\(--tbl-min, 640px\), 100%\)/, 'squeeze instead of scroll on tablet'],
  [/\.shell \{\s*display: grid;\s*grid-template-columns: var\(--sidebar-w\) minmax\(0, 1fr\)/, 'shell track cannot blow out'],
  [/order: -1/, 'headline cell floats to top of stacked card'],
];
for (const [re, label] of need) (re.test(css) ? ok : bad)(label);

// the stacked block must re-assert the border it fights with
const stacked = css.slice(css.indexOf('@media (max-width: 860px)'));
/\.tbl tr:last-child td\.cell-main/.test(stacked)
  ? ok('last-row specificity handled for .cell-main')
  : bad('.tbl tr:last-child td would beat .cell-main border');

console.log('\n' + (fail ? fail + ' problem(s) found' : 'All checks passed'));
process.exit(fail ? 1 : 0);
