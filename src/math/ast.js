import {
  F, abs, fAdd, fSub, fMul, fDiv, fNeg, fPowInt,
  isZero, isOne, isInt, fNum, ZERO, ONE, fTex, fTexAbs
} from './fraction.js';

const T = String.raw;

export function constVal(n) {
  if (!n) return null;
  let a, b;
  switch (n.t) {
    case 'num':
      return n.v;
    case 'neg':
      a = constVal(n.a);
      return a ? fNeg(a) : null;
    case 'add':
      a = constVal(n.a);
      b = constVal(n.b);
      return a && b ? fAdd(a, b) : null;
    case 'sub':
      a = constVal(n.a);
      b = constVal(n.b);
      return a && b ? fSub(a, b) : null;
    case 'mul':
      a = constVal(n.a);
      b = constVal(n.b);
      return a && b ? fMul(a, b) : null;
    case 'div':
      a = constVal(n.a);
      b = constVal(n.b);
      return a && b && !isZero(b) ? fDiv(a, b) : null;
    case 'pow':
      a = constVal(n.a);
      b = constVal(n.b);
      if (!a || !b || !isInt(b) || abs(b.n) > 64n) return null;
      if (isZero(a) && b.n < 0n) return null;
      return fPowInt(a, Number(b.n));
    default:
      return null;
  }
}

export function trim(p) {
  while (p.length > 1 && isZero(p[p.length - 1])) {
    p.pop();
  }
  return p;
}

export function toPoly(n) {
  if (!n) return null;
  let a, b, c;
  switch (n.t) {
    case 'num':
      return [n.v];
    case 'x':
      return [ZERO, ONE];
    case 'neg':
      a = toPoly(n.a);
      return a ? a.map(fNeg) : null;
    case 'add':
    case 'sub': {
      a = toPoly(n.a);
      b = toPoly(n.b);
      if (!a || !b) return null;
      c = [];
      const maxLen = Math.max(a.length, b.length);
      for (let i = 0; i < maxLen; i++) {
        const x = a[i] || ZERO;
        const y = b[i] || ZERO;
        c.push(n.t === 'add' ? fAdd(x, y) : fSub(x, y));
      }
      return trim(c);
    }
    case 'mul': {
      a = toPoly(n.a);
      b = toPoly(n.b);
      if (!a || !b) return null;
      c = new Array(a.length + b.length - 1).fill(ZERO);
      for (let i = 0; i < a.length; i++) {
        for (let j = 0; j < b.length; j++) {
          c[i + j] = fAdd(c[i + j], fMul(a[i], b[j]));
        }
      }
      return trim(c);
    }
    case 'div': {
      a = toPoly(n.a);
      b = constVal(n.b);
      if (!a || !b || isZero(b)) return null;
      return a.map((v) => fDiv(v, b));
    }
    case 'pow': {
      b = constVal(n.b);
      if (!b || !isInt(b) || b.n < 0n || b.n > 12n) return null;
      a = toPoly(n.a);
      if (!a) return null;
      let r = [ONE];
      const count = Number(b.n);
      for (let k = 0; k < count; k++) {
        r = toPoly({ t: 'mul', a: { t: 'poly', p: r }, b: { t: 'poly', p: a } });
      }
      return r;
    }
    case 'poly':
      return n.p;
    default:
      return null;
  }
}

export function asLin(n) {
  const p = toPoly(n);
  if (!p) return null;
  trim(p);
  if (p.length === 2) return { a: p[1], b: p[0] };
  if (p.length === 1) return { a: ZERO, b: p[0] };
  return null;
}

const FN_TEX = {
  sin: '\\sin',
  cos: '\\cos',
  tan: '\\tan',
  cot: '\\cot',
  sec: '\\sec',
  csc: '\\csc',
  sinh: '\\sinh',
  cosh: '\\cosh',
  tanh: '\\tanh',
  ln: '\\ln',
  lg: '\\lg',
  arcsin: '\\arcsin',
  arccos: '\\arccos',
  arctan: '\\arctan'
};

export function prec(n) {
  switch (n.t) {
    case 'add':
    case 'sub':
    case 'neg':
      return 1;
    case 'mul':
      return 2;
    case 'div':
      return 3;
    case 'pow':
      return 4;
    case 'num':
      return isInt(n.v) ? 5 : 3;
    case 'fn':
      return n.name === 'exp' ? 4 : 3;
    default:
      return 5;
  }
}

export function toTex(n) {
  function w(c, min) {
    const s = toTex(c);
    return prec(c) < min ? `(${s})` : s;
  }

  switch (n.t) {
    case 'num':
      return fTex(n.v);
    case 'x':
      return 'x';
    case 'e':
      return 'e';
    case 'pi':
      return T`\pi`;
    case 'neg':
      return '-' + w(n.a, 2);
    case 'add':
      if (n.b.t === 'neg') return toTex(n.a) + '-' + w(n.b.a, 2);
      return toTex(n.a) + '+' + toTex(n.b);
    case 'sub':
      return toTex(n.a) + '-' + w(n.b, 2);
    case 'mul': {
      const l = w(n.a, 2);
      const r = w(n.b, 2);
      return l + (/^[0-9]/.test(r) ? T`\cdot ` : '') + r;
    }
    case 'div':
      return T`\frac{${toTex(n.a)}}{${toTex(n.b)}}`;
    case 'pow': {
      if (n.b.t === 'num' && n.b.v.n === 1n && n.b.v.d >= 2n) {
        return n.b.v.d === 2n ? T`\sqrt{${toTex(n.a)}}` : T`\sqrt[${n.b.v.d}]{${toTex(n.a)}}`;
      }
      if (n.b.t === 'div' && n.b.a.t === 'num' && isOne(n.b.a.v) && n.b.b.t === 'num' && isInt(n.b.b.v)) {
        return n.b.b.v.n === 2n ? T`\sqrt{${toTex(n.a)}}` : T`\sqrt[${n.b.b.v.n}]{${toTex(n.a)}}`;
      }
      const base = prec(n.a) >= 5 && !(n.a.t === 'num' && !isInt(n.a.v)) ? toTex(n.a) : `(${toTex(n.a)})`;
      return `${base}^{${toTex(n.b)}}`;
    }
    case 'fn':
      if (n.name === 'exp') return `e^{${toTex(n.a)}}`;
      return `${FN_TEX[n.name] || n.name}(${toTex(n.a)})`;
    default:
      return '?';
  }
}

export function toNerd(n) {
  switch (n.t) {
    case 'num':
      return isInt(n.v) ? n.v.n.toString() : `(${n.v.n}/${n.v.d})`;
    case 'x':
      return 'x';
    case 'e':
      return 'e';
    case 'pi':
      return 'pi';
    case 'neg':
      return `(-${toNerd(n.a)})`;
    case 'add':
      return `(${toNerd(n.a)}+${toNerd(n.b)})`;
    case 'sub':
      return `(${toNerd(n.a)}-${toNerd(n.b)})`;
    case 'mul':
      return `(${toNerd(n.a)}*${toNerd(n.b)})`;
    case 'div':
      return `(${toNerd(n.a)}/${toNerd(n.b)})`;
    case 'pow':
      return `((${toNerd(n.a)})^(${toNerd(n.b)}))`;
    case 'fn':
      if (n.name === 'lg') return `(log(${toNerd(n.a)})/log(10))`;
      if (n.name === 'ln') return `log(${toNerd(n.a)})`;
      if (n.name === 'arcsin') return `asin(${toNerd(n.a)})`;
      if (n.name === 'arccos') return `acos(${toNerd(n.a)})`;
      if (n.name === 'arctan') return `atan(${toNerd(n.a)})`;
      return `${n.name}(${toNerd(n.a)})`;
    default:
      return '0';
  }
}

export function evalAst(n, x) {
  switch (n.t) {
    case 'num':
      return fNum(n.v);
    case 'x':
      return x;
    case 'e':
      return Math.E;
    case 'pi':
      return Math.PI;
    case 'neg':
      return -evalAst(n.a, x);
    case 'add':
      return evalAst(n.a, x) + evalAst(n.b, x);
    case 'sub':
      return evalAst(n.a, x) - evalAst(n.b, x);
    case 'mul':
      return evalAst(n.a, x) * evalAst(n.b, x);
    case 'div':
      return evalAst(n.a, x) / evalAst(n.b, x);
    case 'pow':
      return Math.pow(evalAst(n.a, x), evalAst(n.b, x));
    case 'fn': {
      const u = evalAst(n.a, x);
      const fnMap = {
        sin: Math.sin,
        cos: Math.cos,
        tan: Math.tan,
        cot: (v) => 1 / Math.tan(v),
        sec: (v) => 1 / Math.cos(v),
        csc: (v) => 1 / Math.sin(v),
        sinh: Math.sinh,
        cosh: Math.cosh,
        tanh: Math.tanh,
        ln: Math.log,
        lg: Math.log10,
        exp: Math.exp,
        arcsin: Math.asin,
        arccos: Math.acos,
        arctan: Math.atan
      };
      return fnMap[n.name] ? fnMap[n.name](u) : NaN;
    }
    default:
      return NaN;
  }
}
