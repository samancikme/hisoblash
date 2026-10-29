import { t } from '../i18n/index.js';

export function createKeypad(container, onInput) {
  if (!container) return;

  const KEYS = [
    { l: 'x', v: 'x' },
    { l: '^', v: '^', aKey: 'keys.power' },
    { l: '(', v: '(' },
    { l: ')', v: ')' },
    { l: '+', v: '+' },
    { l: '−', v: '-', aKey: 'keys.sub' },
    { l: '×', v: '*', aKey: 'keys.mul' },
    { l: '÷', v: '/', aKey: 'keys.div' },
    { l: 'sin', v: 'sin(', fn: true },
    { l: 'cos', v: 'cos(', fn: true },
    { l: 'tan', v: 'tan(', fn: true },
    { l: 'ln', v: 'ln(', fn: true, aKey: 'keys.ln' },
    { l: 'lg', v: 'lg(', fn: true, aKey: 'keys.lg' },
    { l: '√', v: 'sqrt(', fn: true, aKey: 'keys.sqrt' },
    { l: 'eˣ', v: 'e^(', fn: true, aKey: 'keys.exp' },
    { l: 'π', v: 'pi', aKey: 'keys.pi' },
    { l: '⌫', act: 'back', aKey: 'keys.back' },
    { l: 'C', act: 'clear', aKey: 'keys.clear' }
  ];

  container.innerHTML = '';
  KEYS.forEach((k) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'key' + (k.fn ? ' fn' : '') + (k.act === 'clear' ? ' key-danger' : '');
    btn.textContent = k.l;
    const label = k.aKey ? t(k.aKey) : k.v || k.l;
    btn.setAttribute('aria-label', label);
    btn.title = label;

    btn.addEventListener('mousedown', (e) => e.preventDefault());
    btn.addEventListener('click', () => {
      onInput(k);
    });
    container.appendChild(btn);
  });
}

export function handleKeypadPress(inputEl, keyObj, onChange) {
  let s = inputEl.selectionStart;
  let e = inputEl.selectionEnd;
  const val = inputEl.value;

  if (s == null) {
    s = e = val.length;
  }
  let pos = s;

  if (keyObj.act === 'clear') {
    inputEl.value = '';
    pos = 0;
  } else if (keyObj.act === 'back') {
    if (s !== e) {
      inputEl.value = val.slice(0, s) + val.slice(e);
      pos = s;
    } else if (s > 0) {
      inputEl.value = val.slice(0, s - 1) + val.slice(e);
      pos = s - 1;
    } else {
      pos = 0;
    }
  } else {
    inputEl.value = val.slice(0, s) + keyObj.v + val.slice(e);
    pos = s + keyObj.v.length;
  }

  try {
    inputEl.setSelectionRange(pos, pos);
  } catch (err) {}
  inputEl.focus();

  if (typeof onChange === 'function') {
    onChange();
  }
}
