/**
 * Generates responsive-preview.html — a browser harness for eyeballing the app
 * shell at phone / tablet / laptop widths and asserting that no viewport
 * scrolls horizontally.
 *
 * It inlines the real client/src/index.css, so re-run it after changing styles:
 *     node tools/gen-responsive-preview.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'client/src/index.css'), 'utf8');

const WIDTHS = [360, 390, 768, 834, 1024, 1280];

/* Markup mirrors the real components' class names closely enough that any
   layout rule which misbehaves here misbehaves in the app too. */
const shell = (page) => `
<div class="shell">
  <aside class="sidebar">
    <div class="brand">
      <div class="brand-mark">FE</div>
      <div>
        <div class="brand-name">Feasy</div>
        <div class="brand-sub">Workspace</div>
      </div>
    </div>
    <nav class="nav">
      <div class="nav-label">Overview</div>
      <a class="nav-item active">Dashboard</a>
      <a class="nav-item">Members</a>
      <a class="nav-item">Payments</a>
      <div class="nav-label">Engage</div>
      <a class="nav-item">Reminders</a>
      <a class="nav-item">Plans &amp; Pricing</a>
    </nav>
    <div class="nav-spacer"></div>
    <div class="sidebar-foot">Feasy v1.0</div>
  </aside>
  <div class="main">
    <header class="topbar">
      <button class="hamburger">≡</button>
      <div>
        <h1>Students</h1>
        <div class="topbar-sub">Roster and subscription runways</div>
      </div>
      <div class="topbar-spacer"></div>
      <span class="chip">Feasy Workspace</span>
    </header>
    <div class="content">${page}</div>
  </div>
</div>`;

const runway = (pct, hue, days) => `
  <div style="display:flex;flex-direction:column;gap:6px;min-width:96px">
    <div class="runway" style="--pct:${pct}%;--hue:var(--${hue})"><span></span></div>
    <div class="hstack" style="gap:8px">
      <span class="days-big ${hue === 'emerald' ? 'ok' : hue === 'saffron' ? 'warn' : 'bad'}">${days}</span>
      <span style="font-size:12px;color:var(--text-faint)">days left</span>
    </div>
  </div>`;

const studentRow = (n, parent, cls, fee, pct, hue, days) => `
  <tr>
    <td class="cell-main">
      <span class="person">
        <span class="avatar">${n.slice(0, 2).toUpperCase()}</span>
        <span class="who"><span class="nm">${n}</span><span class="sub">${parent}</span></span>
      </span>
    </td>
    <td class="muted" data-label="Class">${cls}</td>
    <td class="muted hide-md" data-label="Subjects"><span class="badge neutral">4</span></td>
    <td class="right num" data-label="Fee / mo">${fee}</td>
    <td class="cell-runway" data-label="Subscription">${runway(pct, hue, days)}</td>
    <td class="hide-md" data-label="Status"><span class="badge ${hue === 'coral' ? 'expired' : hue === 'saffron' ? 'expiring' : 'active'}"><span class="dot"></span>${hue === 'coral' ? 'Expired' : hue === 'saffron' ? 'Expiring' : 'Active'}</span></td>
    <td class="cell-actions">
      <span class="row-actions">
        <button class="btn btn-subtle btn-sm btn-icon">👁</button>
        <button class="btn btn-subtle btn-sm btn-icon">✎</button>
        <button class="btn btn-danger btn-sm btn-icon">🗑</button>
      </span>
    </td>
  </tr>`;

const studentsPage = `
<div class="page-head">
  <div>
    <div class="eyebrow">Roster</div>
    <h2>Students</h2>
    <p>Everyone enrolled at your centre, with live subscription runways.</p>
  </div>
  <button class="btn btn-primary">Enroll student</button>
</div>
<div class="toolbar">
  <div class="search grow"><input class="input" placeholder="Search by student, parent or phone…"></div>
  <select class="select"><option>All classes</option></select>
  <select class="select"><option>Any status</option></select>
  <select class="select"><option>Sort: Expiring first</option></select>
</div>
<section class="card">
  <div class="card-body tight">
    <div class="table-scroll">
      <table class="tbl">
        <thead><tr>
          <th>Student</th><th>Class</th><th class="hide-md">Subjects</th>
          <th class="right">Fee / mo</th><th>Subscription</th>
          <th class="hide-md">Status</th><th class="right">Actions</th>
        </tr></thead>
        <tbody>
          ${studentRow('Aarav Sharma', 'Meena Sharma', 'Class 8', '₹3,400', 72, 'emerald', 21)}
          ${studentRow('Vaishnavi Krishnamurthy', 'Ramachandran Krishnamurthy', 'Class 12', '₹12,50,000', 18, 'saffron', 5)}
          ${studentRow('Dev Patel', 'Nirali Patel', 'Nursery', '₹1,200', 0, 'coral', 0)}
        </tbody>
      </table>
    </div>
  </div>
</section>`;

const feesPage = `
<div class="page-head">
  <div>
    <div class="eyebrow">Configuration</div>
    <h2>Classes &amp; Fees</h2>
    <p>Set the base fee for each class and the monthly add-on for each subject.</p>
  </div>
</div>
<div class="grid grid-2">
  <section class="card">
    <div class="card-head">
      <div><h3>Classes</h3><div class="card-sub">14 classes</div></div>
      <div class="hstack"><button class="btn btn-primary btn-sm">Add class</button></div>
    </div>
    <div class="card-body tight">
      <div class="table-scroll">
        <table class="tbl" style="--tbl-min:420px">
          <thead><tr><th>Class</th><th class="right">Base fee / mo</th><th class="right">Actions</th></tr></thead>
          <tbody>
            <tr>
              <td class="cell-main" style="font-weight:600">Class 8</td>
              <td class="right num" data-label="Base fee / mo">₹2,400</td>
              <td class="cell-actions"><span class="row-actions">
                <button class="btn btn-subtle btn-sm btn-icon">✎</button>
                <button class="btn btn-danger btn-sm btn-icon">🗑</button></span></td>
            </tr>
            <tr>
              <td class="cell-main" style="font-weight:600">Class 12 (Science stream)</td>
              <td class="right num" data-label="Base fee / mo">₹6,000</td>
              <td class="cell-actions"><span class="row-actions">
                <button class="btn btn-subtle btn-sm btn-icon">✎</button>
                <button class="btn btn-danger btn-sm btn-icon">🗑</button></span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
  <section class="card">
    <div class="card-head">
      <div><h3>Subjects</h3><div class="card-sub">38 subjects</div></div>
      <div class="hstack">
        <div class="hstack wrap" style="gap:8px;flex:1 1 auto;justify-content:flex-end">
          <select class="select head-select"><option>All classes</option></select>
          <button class="btn btn-primary btn-sm">Add subject</button>
        </div>
      </div>
    </div>
    <div class="card-body tight">
      <div class="table-scroll">
        <table class="tbl" style="--tbl-min:520px">
          <thead><tr><th>Subject</th><th>Class</th><th class="right">Add-on / mo</th><th>Status</th><th class="right">Actions</th></tr></thead>
          <tbody>
            <tr>
              <td class="cell-main"><span style="font-weight:600">Mathematics</span><span class="tag-pill">MATH</span></td>
              <td data-label="Class">Class 8</td>
              <td class="right num" data-label="Add-on / mo">₹500</td>
              <td data-label="Status"><span class="badge active"><span class="dot"></span>Active</span></td>
              <td class="cell-actions"><span class="row-actions">
                <button class="btn btn-subtle btn-sm btn-icon">✎</button>
                <button class="btn btn-danger btn-sm btn-icon">🗑</button></span></td>
            </tr>
            <tr>
              <td class="cell-main"><span style="font-weight:600">Environmental Science</span><span class="tag-pill">EVS</span></td>
              <td data-label="Class">Class 12 (Science stream)</td>
              <td class="right num" data-label="Add-on / mo">₹750</td>
              <td data-label="Status"><span class="badge neutral">Hidden</span></td>
              <td class="cell-actions"><span class="row-actions">
                <button class="btn btn-subtle btn-sm btn-icon">✎</button>
                <button class="btn btn-danger btn-sm btn-icon">🗑</button></span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</div>`;

const remindersPage = `
<div class="page-head">
  <div>
    <div class="eyebrow">Retention</div>
    <h2>Reminders</h2>
    <p>Nudge parents before a subscription lapses — over WhatsApp or SMS.</p>
  </div>
  <button class="btn btn-primary">Send (2)</button>
</div>
<div class="grid dash-cols">
  <section class="card">
    <div class="card-head">
      <div><h3>Due for a reminder</h3><div class="card-sub">Subscriptions expiring within the window</div></div>
      <div class="hstack"><select class="select head-select"><option>Next 7 days</option></select></div>
    </div>
    <div class="card-body tight">
      <label class="hstack" style="gap:10px;padding:10px 16px;border-bottom:1px solid var(--border-soft)">
        <input type="checkbox"><span style="font-size:13px;color:var(--text-dim)">Select all (3)</span>
      </label>
      <div class="table-scroll">
        <table class="tbl select-tbl">
          <tbody>
            <tr>
              <td class="cell-check"><input type="checkbox"></td>
              <td class="cell-main"><span class="person"><span class="avatar">AS</span>
                <span class="who"><span class="nm">Aarav Sharma</span><span class="sub">Meena Sharma · +91 98765 43210</span></span></span></td>
              <td class="cell-runway" data-label="Subscription">${runway(18, 'saffron', 5)}</td>
            </tr>
            <tr>
              <td class="cell-check"><input type="checkbox"></td>
              <td class="cell-main"><span class="person"><span class="avatar">VK</span>
                <span class="who"><span class="nm">Vaishnavi Krishnamurthy</span><span class="sub">Ramachandran Krishnamurthy · +91 90000 12345</span></span></span></td>
              <td class="cell-runway" data-label="Subscription">${runway(4, 'coral', 1)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
  <section class="card">
    <div class="card-head">
      <div><h3>Recent reminders</h3><div class="card-sub">Delivery log</div></div>
    </div>
    <div class="card-body tight">
      <div class="expiry-row" style="grid-template-columns:1fr auto">
        <div>
          <div class="hstack wrap" style="gap:8px">
            <span style="font-weight:600">Vaishnavi Krishnamurthy</span>
            <span class="badge active"><span class="dot"></span>sent</span>
            <span class="badge neutral">whatsapp</span>
          </div>
          <div style="font-size:12.5px;color:var(--text-faint);margin-top:4px;max-width:46ch">
            Namaste Ramachandran, Vaishnavi's subscription at Feasy Workspace ends in 1 day…
          </div>
        </div>
        <div style="font-size:12px;color:var(--text-faint);white-space:nowrap;justify-self:end">2h ago</div>
      </div>
    </div>
  </section>
</div>`;

const dashboardPage = `
<div class="page-head">
  <div>
    <div class="eyebrow">Overview</div>
    <h2>Good to see you</h2>
    <p>Here's how Feasy Workspace is doing — collections, dues and whose subscription is about to lapse.</p>
  </div>
  <button class="btn btn-primary">Add member</button>
</div>
<div class="grid grid-kpi" style="margin-bottom:18px">
  ${[
    ['Expected / month', '₹4,86,000', 'saffron'],
    ['Collected this month', '₹3,12,500', 'emerald'],
    ['Pending this month', '₹1,73,500', 'coral'],
    ['Pending yearly income', '₹41,26,000', 'violet'],
  ]
    .map(
      ([l, v, t]) => `
  <div class="stat" style="--tone:var(--${t});--tone-soft:var(--${t}-soft)">
    <div class="stat-top"><span class="stat-label">${l}</span><span class="stat-icon">₹</span></div>
    <div class="stat-value num">${v}</div>
    <div class="stat-foot">from <b>128</b> active students</div>
  </div>`
    )
    .join('')}
</div>
<div class="grid grid-2">
  <section class="card"><div class="card-head"><div><h3>Students by class</h3><div class="card-sub">Active enrolment spread</div></div></div>
    <div class="card-body"><div style="height:220px;background:var(--surface-2);border-radius:10px"></div></div></section>
  <section class="card">
    <div class="card-head"><div><h3>Expiring soonest</h3><div class="card-sub">Renewals to chase first</div></div>
      <div class="hstack"><button class="btn btn-subtle btn-sm">Reminders</button></div></div>
    <div class="card-body tight"><div style="padding:0 12px">
      <a class="expiry-row">
        <span class="person"><span class="avatar">VK</span>
          <span class="who"><span class="nm">Vaishnavi Krishnamurthy</span><span class="sub">Class 12 (Science stream)</span></span></span>
        <span style="justify-self:end">${runway(4, 'coral', 1)}</span>
      </a>
    </div></div>
  </section>
</div>`;

const PAGES = [
  ['Students', studentsPage],
  ['Classes & Fees (/fees)', feesPage],
  ['Reminders (/reminders)', remindersPage],
  ['Dashboard', dashboardPage],
];

/* The stylesheet and each page's markup are embedded once, then every frame is
   written into a blank same-origin iframe at run time — one copy of the CSS
   instead of twenty-four. */
const payload = `
<script type="text/css" id="app-css">${css}<\/script>
${PAGES.map(
  ([label, page], i) =>
    `<script type="text/html" id="page-${i}" data-label="${label}">${shell(page)}<\/script>`
).join('\n')}`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Tution Management — responsive preview</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; background: #0b0e18; color: #e9edf7;
         font: 14px/1.5 Inter, system-ui, sans-serif; padding: 24px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  p.lede { color: #9aa6c2; margin: 0 0 20px; max-width: 80ch; }
  .rail { display: flex; gap: 20px; overflow-x: auto; padding-bottom: 16px; align-items: flex-start; }
  .group { margin-bottom: 26px; border-top: 1px solid #232e4c; padding-top: 14px; }
  .group h2 { font-size: 15px; margin: 0 0 12px; color: #f6a93b; }
  figure { margin: 0; flex: 0 0 auto; }
  figcaption { font-size: 12px; color: #9aa6c2; margin-bottom: 6px; display: flex; gap: 8px; align-items: center; }
  iframe { border: 1px solid #26304a; border-radius: 10px; background: #0e1220; display: block; }
  .verdict { font-weight: 700; padding: 1px 7px; border-radius: 999px; font-size: 11px; }
  .pass { background: rgba(52,211,154,.15); color: #34d39a; }
  .fail { background: rgba(255,107,107,.15); color: #ff6b6b; }
  #summary { position: sticky; top: 0; background: #0b0e18; padding: 10px 0 14px; z-index: 5;
             font-weight: 600; border-bottom: 1px solid #232e4c; margin-bottom: 18px; }
</style>
</head>
<body>
  <h1>Responsive preview — Tution Management</h1>
  <p class="lede">Each frame is the real stylesheet rendered at a device width. The badge fails if
  that viewport can scroll sideways, or if a table still forces its own scrollbar. Scroll each rail
  horizontally to compare widths; regenerate with <code>node tools/gen-responsive-preview.mjs</code>
  after changing styles.</p>
  <div id="summary">Building frames…</div>
  <div id="groups"></div>
  ${payload}
<script>
  const WIDTHS = ${JSON.stringify(WIDTHS)};
  const cssText = document.getElementById('app-css').textContent;
  const pages = [...document.querySelectorAll('script[type="text/html"]')];

  /* Build: one rail of iframes per page, each iframe at a device width. */
  const groups = document.getElementById('groups');
  for (const p of pages) {
    const sec = document.createElement('section');
    sec.className = 'group';
    sec.innerHTML = '<h2>' + p.dataset.label + '</h2><div class="rail"></div>';
    const rail = sec.querySelector('.rail');
    for (const w of WIDTHS) {
      const fig = document.createElement('figure');
      fig.className = 'frame';
      fig.dataset.w = w;
      fig.innerHTML =
        '<figcaption><b>' + p.dataset.label + '</b> · ' + w + 'px ' +
        '<span class="verdict">checking…</span></figcaption>' +
        '<iframe width="' + w + '" height="700"></iframe>';
      rail.appendChild(fig);
      const d = fig.querySelector('iframe').contentDocument;
      d.open();
      d.write(
        '<!doctype html><html><head><meta charset="utf-8"><style>' +
        cssText + '</style></head><body>' + p.textContent + '</body></html>'
      );
      d.close();
    }
    groups.appendChild(sec);
  }

  /* Assert: nothing may scroll sideways. Below 860px tables must not scroll
     internally either — they are supposed to have restacked as cards. */
  function check() {
    let pass = 0, fail = 0;
    document.querySelectorAll('.frame').forEach((fig) => {
      const v = fig.querySelector('.verdict');
      const d = fig.querySelector('iframe').contentDocument;
      if (!d || !d.body) { v.textContent = 'no doc'; return; }
      const page = d.documentElement.scrollWidth - d.documentElement.clientWidth;
      const inner = [...d.querySelectorAll('.table-scroll')]
        .map((el) => el.scrollWidth - el.clientWidth)
        .filter((n) => n > 1);
      const problems = [];
      if (page > 1) problems.push('page scrolls ' + page + 'px');
      if (inner.length) problems.push(inner.length + ' table(s) scroll inside');
      const bad = page > 1 || (inner.length > 0 && +fig.dataset.w <= 860);
      v.className = 'verdict ' + (bad ? 'fail' : 'pass');
      v.textContent = bad
        ? problems.join(' · ')
        : (problems.length ? 'ok (contained: ' + problems.join(', ') + ')' : 'no h-scroll');
      bad ? fail++ : pass++;
    });
    const s = document.getElementById('summary');
    s.textContent = fail
      ? fail + ' viewport(s) still scroll horizontally — ' + pass + ' clean'
      : 'All ' + pass + ' viewports clean — no horizontal scrolling anywhere';
    s.style.color = fail ? '#ff6b6b' : '#34d39a';
  }
  addEventListener('load', () => setTimeout(check, 300));
<\/script>
</body>
</html>`;

writeFileSync(join(root, 'responsive-preview.html'), html);
console.log('responsive-preview.html written (' + PAGES.length + ' pages × ' + WIDTHS.length + ' widths)');
