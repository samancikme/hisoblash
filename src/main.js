import { analyze, LIMITS } from './math/engine.js';
import { casDerivs } from './math/diff.js';
import { computeTaylorSeries } from './math/taylor.js';
import { initI18n, getLang, setLang, t, LANGUAGES } from './i18n/index.js';
import { renderMath } from './ui/renderer.js';
import { createKeypad, handleKeypadPress } from './ui/keypad.js';
import { showToast, copyText } from './ui/toast.js';
import { renderCheatSheet } from './ui/cheatSheet.js';
import { renderExamples } from './ui/examples.js';

// DOM selectors helper
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => (r || document).querySelectorAll(s);

function h(tag, cls, text) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text != null) el.textContent = text;
  return el;
}

// State
let currentTab = 'hosila';
let lastCalcKey = '';
let lastTaylorKey = '';
let updateDebounceTimer = null;
let updateTaylorDebounceTimer = null;

// Normalizer for LaTeX strings
function norm(s) {
  return (s || '').replace(/\\left|\\right|\\,|\s|[()]/g, '');
}

/* ----------------- Theme Controller ----------------- */
function initTheme() {
  const root = document.documentElement;
  const btn = $('#theme');

  function getEffective() {
    const tAttr = root.getAttribute('data-theme');
    if (tAttr) return tAttr;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  try {
    const saved = localStorage.getItem('hosila-theme');
    if (saved === 'dark' || saved === 'light') {
      root.setAttribute('data-theme', saved);
    }
  } catch (e) {}

  btn.setAttribute('aria-pressed', String(getEffective() === 'dark'));

  btn.addEventListener('click', () => {
    const next = getEffective() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    btn.setAttribute('aria-pressed', String(next === 'dark'));
    try {
      localStorage.setItem('hosila-theme', next);
    } catch (e) {}
  });
}

/* ----------------- Tabs Controller ----------------- */
function buildTabs() {
  const nav = $('#tabs');
  nav.innerHTML = '';

  const TABS_DATA = [
    { id: 'hosila', title: t('tabs.hosila'), sub: t('tabs.hosilaSub') },
    { id: 'taylor', title: t('tabs.taylor'), sub: t('tabs.taylorSub') },
    { id: 'cheatsheet', title: t('tabs.cheatsheet'), sub: t('tabs.cheatsheetSub') },
    { id: 'examples', title: t('tabs.examples'), sub: t('tabs.examplesSub') }
  ];

  TABS_DATA.forEach((tab) => {
    const btn = h('button', 'tab');
    btn.type = 'button';
    btn.append(h('b', null, tab.title), h('small', null, tab.sub));

    if (tab.id === currentTab) {
      btn.setAttribute('aria-current', 'page');
    }

    btn.addEventListener('click', () => {
      switchTab(tab.id);
    });

    nav.append(btn);
  });
}

function switchTab(tabId) {
  currentTab = tabId;

  // Update tabs buttons
  $$('#tabs .tab').forEach((b, idx) => {
    const ids = ['hosila', 'taylor', 'cheatsheet', 'examples'];
    if (ids[idx] === tabId) {
      b.setAttribute('aria-current', 'page');
    } else {
      b.removeAttribute('aria-current');
    }
  });

  // Toggle sections
  const secHosila = $('#sec-hosila');
  const secTaylor = $('#sec-taylor');
  const secCheat = $('#sec-cheatsheet');
  const secEx = $('#sec-examples');

  secHosila.style.display = tabId === 'hosila' ? 'flex' : 'none';
  secTaylor.style.display = tabId === 'taylor' ? 'flex' : 'none';
  secCheat.style.display = tabId === 'cheatsheet' ? 'flex' : 'none';
  secEx.style.display = tabId === 'examples' ? 'flex' : 'none';

  if (tabId === 'taylor') {
    updateTaylor(false);
  } else if (tabId === 'cheatsheet') {
    renderCheatSheet($('#cheatsheet-content'), getLang());
  } else if (tabId === 'examples') {
    renderExamples(
      $('#examples-content'),
      (ex) => {
        $('#f-expr').value = ex.expr;
        $('#f-n').value = ex.n;
        switchTab('hosila');
        update(true);
      },
      getLang()
    );
  }
}

/* ----------------- Render Help Guide ----------------- */
function renderHelpGuide() {
  $('#help-summary').textContent = t('helpSummary');
  const body = $('#help-body');
  body.innerHTML = `
    <ul>
      <li>${t('helpMult')}</li>
      <li>${t('helpPow')}</li>
      <li>${t('helpFrac')}</li>
      <li>${t('helpRoot')}</li>
      <li>${t('helpFuncs')}</li>
      <li>${t('helpLogPi')}</li>
    </ul>
    <p>${t('helpWarning')}</p>
  `;
}

/* ----------------- Refresh UI Text on Lang Change ----------------- */
function applyLanguage() {
  const lang = getLang();
  document.title = `${t('title')} - ${t('subtitle')}`;

  $('#app-title').textContent = t('title');
  $('#app-sub').textContent = t('subtitle');
  $('#theme').setAttribute('aria-label', t('themeToggle'));

  // Section 1: Hosila
  $('#h-task').textContent = t('taskTitle');
  $('#p-task-desc').textContent = t('taskDesc');
  $('#h-form-title').textContent = t('formTitle');
  $('#f-expr').placeholder = t('placeholder');
  $('#f-expr').setAttribute('aria-label', t('ariaExpr'));
  $('#preview').setAttribute('aria-label', t('previewAria'));
  $('#lbl-n').textContent = t('orderLabel');
  $('#solve').textContent = t('btnCalc');
  $('#n-minus').setAttribute('aria-label', t('btnDecreaseN'));
  $('#n-plus').setAttribute('aria-label', t('btnIncreaseN'));
  $('#h-res').textContent = t('solutionTitle');

  // Section 2: Taylor
  $('#h-taylor-task').textContent = t('taylorTaskTitle');
  $('#p-taylor-desc').textContent = t('taylorTaskDesc');
  $('#h-taylor-form-title').textContent = t('formTitle');
  $('#t-expr').placeholder = t('taylorPlaceholder');
  $('#t-expr').setAttribute('aria-label', t('ariaExpr'));
  $('#t-preview').setAttribute('aria-label', t('previewAria'));
  $('#lbl-t-x0').textContent = t('centerLabel');
  $('#lbl-t-n').textContent = t('orderLabel');
  $('#solve-taylor').textContent = t('btnCalc');
  $('#t-n-minus').setAttribute('aria-label', t('btnDecreaseN'));
  $('#t-n-plus').setAttribute('aria-label', t('btnIncreaseN'));
  $('#h-taylor-res').textContent = t('solutionTitle');

  // Footer
  $('#footer-text').textContent = t('footer');

  // Cheatsheet section headers
  $('#h-cheatsheet-title').textContent =
    lang === 'kaa'
      ? 'Standart tuwındılar kestesi'
      : lang === 'ru'
      ? 'Таблица стандартных производных'
      : 'Standart hosilalar jadvali';
  $('#p-cheatsheet-desc').textContent =
    lang === 'kaa'
      ? 'n-tártipli tuwındılardıń tiykarǵı formulaları hám differentsiallaw qádeleri.'
      : lang === 'ru'
      ? 'Основные формулы n-й производной и правила дифференцирования.'
      : 'n-tartibli hosilalarning asosiy formulalari va differensiallash qoidalari.';

  // Examples section headers
  $('#h-examples-title').textContent =
    lang === 'kaa'
      ? 'Ámeliy mısallar toplamı'
      : lang === 'ru'
      ? 'Сборник практических примеров'
      : 'Amaliy misollar to‘plami';
  $('#p-examples-desc').textContent =
    lang === 'kaa'
      ? 'Tayar mısallardan birin tańlań hám onıń tolıq sheshiliw qádemlerin kóriń.'
      : lang === 'ru'
      ? 'Выберите пример для автоматического решения с подробными шагами.'
      : 'Tayyor misollardan birini tanlang va to‘liq yechilish bosqichlarini ko‘ring.';

  buildTabs();

  createKeypad($('#keys'), (k) => {
    handleKeypadPress($('#f-expr'), k, () => update(false));
  });

  createKeypad($('#t-keys'), (k) => {
    handleKeypadPress($('#t-expr'), k, () => updateTaylor(false));
  });

  renderHelpGuide();

  if (currentTab === 'cheatsheet') {
    renderCheatSheet($('#cheatsheet-content'), lang);
  } else if (currentTab === 'examples') {
    renderExamples(
      $('#examples-content'),
      (ex) => {
        $('#f-expr').value = ex.expr;
        $('#f-n').value = ex.n;
        switchTab('hosila');
        update(true);
      },
      lang
    );
  }

  lastCalcKey = '';
  lastTaylorKey = '';
  update(false);
  updateTaylor(false);
}

/* ----------------- Render Hosila Result ----------------- */
function renderEmpty(targetId, msg) {
  const box = $(targetId);
  box.replaceChildren(h('p', 'empty', msg));
}

function renderResult(a, n) {
  const box = $('#res-body');
  box.replaceChildren();
  let step = 1;

  function block(label, cls) {
    const b = h('div', 'blk' + (cls ? ` ${cls}` : ''));
    b.append(h('div', 'lbl', label));
    box.append(b);
    return b;
  }

  function row(parent, tex, cls) {
    const d = h('div', 'math' + (cls ? ` ${cls}` : ''));
    parent.append(d);
    renderMath(d, tex, true);
    return d;
  }

  function copyBtn(parent, tex) {
    const r = h('div', 'ans-row');
    const cb = h('button', 'btn', t('copyLatex'));
    cb.type = 'button';
    cb.addEventListener('click', () => {
      copyText(tex, t('copied'), t('copyFail'));
    });
    r.append(cb);
    parent.append(r);
  }

  const yn = `y^{(${n})}`;

  const b0 = block(t('givenFunc'));
  row(b0, a.tex);

  const f = a.formula;
  if (f) {
    if (f.domain) {
      const dm = h('p', 'dom', t('domain'));
      const sp = h('span', 'inline-math');
      dm.append(sp);
      b0.append(dm);
      renderMath(sp, f.domain, false);
    }

    if (norm(f.rewrite) !== norm(a.tex)) {
      const b1 = block(t('step1'));
      row(b1, f.rewrite);
    }

    const onlyConst = a.terms.every((term) => term.kind === 'const');
    if (onlyConst) {
      const bc = block(t('answer'));
      bc.append(h('p', null, t('constNote')));
      row(bc, `${yn}=0`, 'big');
      copyBtn(bc, `${yn}=0`);
      return;
    }

    const cnt = Math.min(3, n);
    const b2 = block(t('step2'));
    for (let k = 1; k <= cnt; k++) {
      row(b2, `y${"'".repeat(k)}=${f.at(k).tex}`);
    }

    const b3 = block(t('step3'));
    b3.append(h('p', null, t('step3Note')));
    f.rules.forEach((rule) => {
      row(b3, rule);
    });

    const ba = block(t('answer'), 'answer');
    row(ba, f.general, 'big');
    if (f.polyNote) {
      ba.append(h('p', null, t('polyNote')));
    }
    copyBtn(ba, f.general);

    const bn = block(t('atN', n));
    row(bn, `${yn}=${f.at(n).tex}`, 'big');
    return;
  }

  const nb = block(t('solutionTitle'));
  nb.append(h('p', null, t('casNote')));

  if (n > LIMITS.casMax) {
    nb.append(h('p', 'empty', t('casMaxWarn', LIMITS.casMax)));
    return;
  }

  let rows;
  try {
    rows = casDerivs(a.ast, n);
  } catch (e) {
    rows = null;
  }

  if (!rows || !rows.length) {
    nb.append(h('p', 'empty', t('casFail')));
    return;
  }

  const tooLong = rows.some((tStr) => tStr.length > 4000);
  if (tooLong) {
    nb.append(h('p', 'empty', t('casTooLong')));
    return;
  }

  const bs = block(t('derivatives'));
  rows.forEach((tStr, i) => {
    const k2 = i + 1;
    const last = k2 === n;
    row(
      bs,
      `${k2 <= 3 ? 'y' + "'".repeat(k2) : `y^{(${k2})}`}=${tStr}`,
      last ? 'big' : ''
    );
  });

  const ba2 = block(t('answer'), 'answer');
  const finalAns = `${yn}=${rows[rows.length - 1]}`;
  row(ba2, finalAns, 'big');
  copyBtn(ba2, finalAns);
}

/* ----------------- Render Taylor / Maclaurin Result ----------------- */
function renderTaylorResult(res) {
  const box = $('#taylor-res-body');
  box.replaceChildren();

  function block(label, cls) {
    const b = h('div', 'blk' + (cls ? ` ${cls}` : ''));
    b.append(h('div', 'lbl', label));
    box.append(b);
    return b;
  }

  function row(parent, tex, cls) {
    const d = h('div', 'math' + (cls ? ` ${cls}` : ''));
    parent.append(d);
    renderMath(d, tex, true);
    return d;
  }

  function copyBtn(parent, tex) {
    const r = h('div', 'ans-row');
    const cb = h('button', 'btn', t('copyLatex'));
    cb.type = 'button';
    cb.addEventListener('click', () => {
      copyText(tex, t('copied'), t('copyFail'));
    });
    r.append(cb);
    parent.append(r);
  }

  // 1. Theoretical definition box (matches user's screenshot!)
  const thBox = h('div', 'theory-box');
  const thH4 = h(
    'h4',
    null,
    res.isMaclaurin
      ? 'Makloren qatori va formulasi (x₀ = 0)'
      : `Teylor qatori va formulasi (x₀ = ${res.x0})`
  );
  thBox.appendChild(thH4);

  const thMath = h('div', 'math');
  const generalFormulaTex = res.isMaclaurin
    ? String.raw`f(x) = f(0) + \frac{f'(0)}{1!} x + \frac{f''(0)}{2!} x^2 + \dots + \frac{f^{(n)}(0)}{n!} x^n + R_n(x) = \sum_{k=0}^{n} \frac{f^{(k)}(0)}{k!} x^k + R_n(x)`
    : String.raw`f(x) = f(x_0) + \frac{f'(x_0)}{1!} (x - x_0) + \dots + \frac{f^{(n)}(x_0)}{n!} (x - x_0)^n + R_n(x) = \sum_{k=0}^{n} \frac{f^{(k)}(x_0)}{k!} (x - x_0)^k + R_n(x)`;
  renderMath(thMath, generalFormulaTex, true);
  thBox.appendChild(thMath);
  box.appendChild(thBox);

  // 2. Taylor / Maclaurin Polynomial P_n(x)
  const bPoly = block(t('taylorPolyTitle', res.isMaclaurin, res.n), 'answer');
  const polyStr = `P_{${res.n}}(x) = ${res.polyTex}`;
  row(bPoly, polyStr, 'big');
  copyBtn(bPoly, polyStr);

  // 3. Full Peano Remainder Equation
  const bPeano = block(t('peanoTitle'));
  row(bPeano, res.peanoEquation, 'big');

  // 4. Standard Maclaurin match if exists
  if (res.matchedStandard) {
    const bStd = block(t('standardSeriesTitle'));
    bStd.append(
      h(
        'p',
        null,
        `${t('givenFunc')}: ${res.matchedStandard.name}. ${t('convergenceRange')}`
      )
    );
    const spConv = h('span', 'inline-math');
    bStd.appendChild(spConv);
    renderMath(spConv, res.matchedStandard.convergence, false);
    row(bStd, res.matchedStandard.general, 'big');
  }

  // 5. Steps & Derivatives Table
  const bSteps = block(t('stepsTableTitle'));
  const tableWrap = h('div', 'taylor-table-wrap');
  const tbl = h('table', 'taylor-table');

  // Header row
  const thead = h('thead');
  const trH = h('tr');
  ['k', 'f^{(k)}(x)', `f^{(k)}(${res.x0})`, 'k!', 'a_k = \\frac{f^{(k)}(x_0)}{k!}', 'Had'].forEach(
    (col) => {
      const thEl = h('th');
      renderMath(thEl, col, false);
      trH.appendChild(thEl);
    }
  );
  thead.appendChild(trH);
  tbl.appendChild(thead);

  // Body rows
  const tbody = h('tbody');
  res.steps.forEach((st) => {
    const tr = h('tr');

    const tdK = h('td', null, String(st.k));
    const tdDeriv = h('td');
    renderMath(tdDeriv, st.derivTex, false);

    const tdVal = h('td');
    renderMath(tdVal, st.valTex, false);

    const tdFact = h('td', null, st.factStr);

    const tdCoef = h('td');
    renderMath(tdCoef, st.coefTex, false);

    const tdTerm = h('td');
    renderMath(tdTerm, st.termTex, false);

    tr.append(tdK, tdDeriv, tdVal, tdFact, tdCoef, tdTerm);
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
  tableWrap.appendChild(tbl);
  bSteps.appendChild(tableWrap);
}

/* ----------------- Update & Live Math (Hosila) ----------------- */
function update(scroll) {
  const exprEl = $('#f-expr');
  const nEl = $('#f-n');
  const err = $('#err');
  const prev = $('#preview');

  exprEl.removeAttribute('aria-invalid');
  nEl.removeAttribute('aria-invalid');

  const expr = exprEl.value;
  if (!expr.trim()) {
    err.textContent = '';
    prev.hidden = true;
    renderEmpty('#res-body', t('emptyPrompt'));
    return;
  }

  let a;
  try {
    a = analyze(expr);
  } catch (e) {
    a = { error: t('errEmptyExpr') + (e.message || '') };
  }

  if (a.error) {
    exprEl.setAttribute('aria-invalid', 'true');
    err.textContent = a.error;
    prev.hidden = true;
    renderEmpty('#res-body', a.error);
    return;
  }

  prev.hidden = false;
  renderMath(prev, a.tex, true);

  const raw = String(nEl.value || '').trim();
  const n = /^\d{1,2}$/.test(raw) ? parseInt(raw, 10) : NaN;
  if (!(n >= 1 && n <= LIMITS.nMax)) {
    nEl.setAttribute('aria-invalid', 'true');
    err.textContent = t('errNRange', LIMITS.nMax);
    renderEmpty('#res-body', t('errNRangePrompt', LIMITS.nMax));
    return;
  }

  err.textContent = '';
  const key = `${expr}|${n}|${getLang()}`;
  if (key !== lastCalcKey || scroll) {
    lastCalcKey = key;
    renderResult(a, n);
  }

  if (scroll) {
    scrollToElement($('#result'));
  }
}

/* ----------------- Update & Live Math (Taylor) ----------------- */
function updateTaylor(scroll) {
  const exprEl = $('#t-expr');
  const x0El = $('#t-x0');
  const nEl = $('#t-n');
  const err = $('#t-err');
  const prev = $('#t-preview');

  exprEl.removeAttribute('aria-invalid');
  nEl.removeAttribute('aria-invalid');

  const expr = exprEl.value;
  if (!expr.trim()) {
    err.textContent = '';
    prev.hidden = true;
    renderEmpty('#taylor-res-body', t('emptyPrompt'));
    return;
  }

  let a;
  try {
    a = analyze(expr);
  } catch (e) {
    a = { error: t('errEmptyExpr') + (e.message || '') };
  }

  if (a.error) {
    exprEl.setAttribute('aria-invalid', 'true');
    err.textContent = a.error;
    prev.hidden = true;
    renderEmpty('#taylor-res-body', a.error);
    return;
  }

  prev.hidden = false;
  renderMath(prev, `f(x) = ${a.tex.replace(/^y=/, '')}`, true);

  const rawN = String(nEl.value || '').trim();
  const n = /^\d{1,2}$/.test(rawN) ? parseInt(rawN, 10) : NaN;
  if (!(n >= 1 && n <= 15)) {
    nEl.setAttribute('aria-invalid', 'true');
    err.textContent = t('errNRange', 15);
    renderEmpty('#taylor-res-body', t('errNRangePrompt', 15));
    return;
  }

  const x0 = x0El.value || '0';
  err.textContent = '';

  const key = `${expr}|${x0}|${n}|${getLang()}`;
  if (key !== lastTaylorKey || scroll) {
    lastTaylorKey = key;
    const res = computeTaylorSeries(expr, x0, n);
    if (res.error) {
      err.textContent = res.error;
      renderEmpty('#taylor-res-body', res.error);
      return;
    }
    renderTaylorResult(res);
  }

  if (scroll) {
    scrollToElement($('#taylor-result'));
  }
}

function scrollToElement(el) {
  if (!el || typeof el.scrollIntoView !== 'function') return;
  const reduce =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  try {
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  } catch (e) {
    el.scrollIntoView();
  }
}

function scheduleUpdate() {
  clearTimeout(updateDebounceTimer);
  updateDebounceTimer = setTimeout(() => {
    update(false);
  }, 120);
}

function scheduleTaylorUpdate() {
  clearTimeout(updateTaylorDebounceTimer);
  updateTaylorDebounceTimer = setTimeout(() => {
    updateTaylor(false);
  }, 120);
}

function bumpN(inputSelector, d, min = 1, max = 30, callback) {
  const el = $(inputSelector);
  let v = parseInt(el.value, 10);
  if (isNaN(v)) v = 5;
  el.value = String(Math.min(max, Math.max(min, v + d)));
  if (callback) callback();
}

/* ----------------- App Initialization ----------------- */
function initApp() {
  const initialLang = initI18n();

  const langSelect = $('#lang-select');
  if (langSelect) {
    langSelect.value = initialLang;
    langSelect.addEventListener('change', (e) => {
      setLang(e.target.value);
    });
  }

  window.addEventListener('langchange', () => {
    applyLanguage();
  });

  initTheme();
  applyLanguage();

  // Section 1: Hosila Events
  $('#form').addEventListener('submit', (e) => {
    e.preventDefault();
    update(true);
  });
  $('#f-expr').addEventListener('input', scheduleUpdate);
  $('#f-n').addEventListener('input', scheduleUpdate);
  $('#n-minus').addEventListener('click', () => bumpN('#f-n', -1, 1, LIMITS.nMax, () => update(false)));
  $('#n-plus').addEventListener('click', () => bumpN('#f-n', 1, 1, LIMITS.nMax, () => update(false)));

  // Section 2: Taylor Events
  $('#form-taylor').addEventListener('submit', (e) => {
    e.preventDefault();
    updateTaylor(true);
  });
  $('#t-expr').addEventListener('input', scheduleTaylorUpdate);
  $('#t-x0').addEventListener('input', scheduleTaylorUpdate);
  $('#t-n').addEventListener('input', scheduleTaylorUpdate);
  $('#t-n-minus').addEventListener('click', () => bumpN('#t-n', -1, 1, 15, () => updateTaylor(false)));
  $('#t-n-plus').addEventListener('click', () => bumpN('#t-n', 1, 1, 15, () => updateTaylor(false)));

  $('#btn-x0-zero').addEventListener('click', () => {
    $('#t-x0').value = '0';
    updateTaylor(false);
  });

  // Preset buttons
  $$('.preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const ex = btn.dataset.expr;
      const x0 = btn.dataset.x0;
      const n = btn.dataset.n;
      if (ex) $('#t-expr').value = ex;
      if (x0 !== undefined) $('#t-x0').value = x0;
      if (n) $('#t-n').value = n;
      updateTaylor(true);
    });
  });

  // Initial runs
  update(false);
  updateTaylor(false);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
