import { decimalToF } from './fraction.js';

export class ParseError extends Error {
  constructor(message, code = 'PARSE_ERROR') {
    super(message);
    this.name = 'ParseError';
    this.isParseError = true;
    this.code = code;
  }
}

export const FUNCS = [
  'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh',
  'asin', 'acos', 'atan', 'log10', 'sqrt', 'cbrt', 'root',
  'sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'exp', 'log', 'ln', 'lg'
];

export const NAMES = [...FUNCS, 'pi', 'e', 'x'].sort((a, b) => b.length - a.length);

export function tokenize(src) {
  const s = String(src)
    .replace(/[−–—]/g, '-')
    .replace(/[×·⋅∙]/g, '*')
    .replace(/÷/g, '/')
    .replace(/\*\*/g, '^')
    .replace(/√/g, 'sqrt')
    .replace(/π/g, 'pi')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/[\[{]/g, '(')
    .replace(/[\]}]/g, ')')
    .toLowerCase();

  const toks = [];
  let i = 0;
  let m;

  while (i < s.length) {
    const ch = s[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if ((m = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i)))) {
      const raw = m[1].replace(/\.$/, '');
      toks.push({ t: 'num', v: decimalToF(raw.charAt(0) === '.' ? '0' + raw : raw) });
      i += m[1].length;
      continue;
    }
    if (/[a-z]/.test(ch)) {
      let found = null;
      for (let k = 0; k < NAMES.length; k++) {
        if (s.startsWith(NAMES[k], i)) {
          found = NAMES[k];
          break;
        }
      }
      if (!found) {
        const match = /^[a-z]+/.exec(s.slice(i));
        const word = match ? match[0] : ch;
        if (word.length === 1) {
          throw new ParseError(`Faqat 'x' o‘zgaruvchisi ishlatiladi, «${word}» tanilmadi.`);
        }
        throw new ParseError(`«${word}» funksiyasi yoki o'zgaruvchisi tanilmadi.`);
      }
      toks.push({ t: 'id', name: found });
      i += found.length;
      continue;
    }
    if (ch === '(') {
      toks.push({ t: 'lp' });
      i++;
      continue;
    }
    if (ch === ')') {
      toks.push({ t: 'rp' });
      i++;
      continue;
    }
    if (ch === ',') {
      toks.push({ t: 'comma' });
      i++;
      continue;
    }
    if ('+-*/^'.indexOf(ch) >= 0) {
      toks.push({ t: 'op', c: ch });
      i++;
      continue;
    }
    throw new ParseError(`Tushunarsiz belgi: «${ch}».`);
  }
  return toks;
}
