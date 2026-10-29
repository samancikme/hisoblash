import { analyze, LIMITS } from './math/engine.js';
import { casDerivs } from './math/diff.js';
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
let updateDebounceTimer = null;

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
    const ids = ['hosila', 'cheatsheet', 'examples'];
    if (ids[idx] === tabId) {
      b.setAttribute('aria-current', 'page');
    } else {
      b.removeAttribute('aria-current');
    }
  });

  // Toggle sections
  const secHosila = $('#sec-hosila');
  const secCheat = $('#sec-cheatsheet');
  const secEx = $('#sec-examples');

  secHosila.style.display = tabId === 'hosila' ? 'flex' : 'none';
  secCheat.style.display = tabId === 'cheatsheet' ? 'flex' : 'none';
  secEx.style.display = tabId === 'examples' ? 'flex' : 'none';

  if (tabId === 'cheatsheet') {
    renderCheatSheet($('#cheatsheet-content'), getLang());
  } else if (tabId === 'examples') {
    renderExamples($('#examples-content'), (ex) => {
      $('#f-expr').value = ex.expr;
      $('#f-n').value = ex.n;
      switchTab('hosila');
      update(true);
    }, getLang());
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
  $('#footer-text').textContent = t('footer');

  // Cheatsheet section headers
  $('#h-cheatsheet-title').textContent = lang === 'kaa' ? 'Standart tuwındılar kestesi' : lang === 'ru' ? 'Таблица стандартных производных' : 'Standart hosilalar jadvali';
  $('#p-cheatsheet-desc').textContent = lang === 'kaa' ? 'n-tártipli tuwındılardıń tiykarǵı formulaları hám differentsiallaw qádeleri.' : lang === 'ru' ? 'Основные формулы n-й производной и правила дифференцирования.' : 'n-tartibli hosilalarning asosiy formulalari va differensiallash qoidalari.';

  // Examples section headers
  $('#h-examples-title').textContent = lang === 'kaa' ? 'Ámeliy mısallar toplamı' : lang === 'ru' ? 'Сборник практических примеров' : 'Amaliy misollar to‘plami';
  $('#p-examples-desc').textContent = lang === 'kaa' ? 'Tayar mısallardan birin tańlań hám onıń tolıq sheshiliw qádemlerin kóriń.' : lang === 'ru' ? 'Выберите пример для автоматического решения с подробными шагами.' : 'Tayyor misollardan birini tanlang va to‘liq yechilish bosqichlarini ko‘ring.';

  buildTabs();
  createKeypad($('#keys'), (k) => {
    handleKeypadPress($('#f-expr'), k, () => update(false));
  });
  renderHelpGuide();

  // Re-render current active tab contents if needed
  if (currentTab === 'cheatsheet') {
    renderCheatSheet($('#cheatsheet-content'), lang);
  } else if (currentTab === 'examples') {
    renderExamples($('#examples-content'), (ex) => {
      $('#f-expr').value = ex.expr;
      $('#f-n').value = ex.n;
      switchTab('hosila');
      update(true);
    }, lang);
  }

  // Force re-calculation to translate result steps
  lastCalcKey = '';
  update(false);
}

/* ----------------- Render Result Logic ----------------- */
function renderEmpty(msg) {
  const box = $('#res-body');
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

  // 1. Given function
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

    // General formula answer
    const ba = block(t('answer'), 'answer');
    row(ba, f.general, 'big');
    if (f.polyNote) {
      ba.append(h('p', null, t('polyNote')));
    }
    copyBtn(ba, f.general);

    // Answer for n
    const bn = block(t('atN', n));
    row(bn, `${yn}=${f.at(n).tex}`, 'big');
    return;
  }

  // Fallback: general formula could not be deduced (e.g. complex product or chain)
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

/* ----------------- Update & Live Math ----------------- */
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
    renderEmpty(t('emptyPrompt'));
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
    renderEmpty(a.error);
    return;
  }

  prev.hidden = false;
  renderMath(prev, a.tex, true);

  const raw = String(nEl.value || '').trim();
  const n = /^\d{1,2}$/.test(raw) ? parseInt(raw, 10) : NaN;
  if (!(n >= 1 && n <= LIMITS.nMax)) {
    nEl.setAttribute('aria-invalid', 'true');
    err.textContent = t('errNRange', LIMITS.nMax);
    renderEmpty(t('errNRangePrompt', LIMITS.nMax));
    return;
  }

  err.textContent = '';
  const key = `${expr}|${n}|${getLang()}`;
  if (key !== lastCalcKey || scroll) {
    lastCalcKey = key;
    renderResult(a, n);
  }

  if (scroll) {
    scrollToResult();
  }
}

function scrollToResult() {
  const el = $('#result');
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

function bumpN(d) {
  const el = $('#f-n');
  let v = parseInt(el.value, 10);
  if (isNaN(v)) v = 5;
  el.value = String(Math.min(LIMITS.nMax, Math.max(1, v + d)));
  update(false);
}

/* ----------------- App Initialization ----------------- */
function initApp() {
  const initialLang = initI18n();

  // Setup language selector in DOM
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

  // Event listeners
  $('#form').addEventListener('submit', (e) => {
    e.preventDefault();
    update(true);
  });

  $('#f-expr').addEventListener('input', scheduleUpdate);
  $('#f-n').addEventListener('input', scheduleUpdate);

  $('#n-minus').addEventListener('click', () => bumpN(-1));
  $('#n-plus').addEventListener('click', () => bumpN(1));

  // Run initial calculation
  update(false);
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
