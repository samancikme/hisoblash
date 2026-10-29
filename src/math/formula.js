import {
  F, abs, lcm, fAdd, fSub, fMul, fDiv, fNeg, fPowInt, isZero, isOne, isInt, fNum, ZERO, ONE, fTex, fTexAbs
} from './fraction.js';

const T = String.raw;

export function linInt(A, B) {
  let s = '';
  if (A !== 0n) s = A === 1n ? 'x' : A === -1n ? '-x' : `${A}x`;
  if (B !== 0n) s = s === '' ? B.toString() : s + (B > 0n ? `+${B}` : B.toString());
  return s === '' ? '0' : s;
}

export function linTex(a, b) {
  if (b.n === 0n) {
    if (a.d === 1n) return a.n === 1n ? 'x' : (a.n === -1n ? '-x' : `${a.n}x`);
    return a.n === 1n ? T`\frac{x}{${a.d}}` : (a.n === -1n ? T`-\frac{x}{${a.d}}` : T`\frac{${a.n}x}{${a.d}}`);
  }
  if (b.d === 1n && a.d > 1n) {
    const aStr = a.n === 1n ? T`\frac{x}{${a.d}}` : (a.n === -1n ? T`-\frac{x}{${a.d}}` : T`\frac{${a.n}x}{${a.d}}`);
    const bStr = b.n > 0n ? `+${b.n}` : `${b.n}`;
    return aStr + bStr;
  }
  const D = lcm(a.d, b.d);
  const num = linInt(a.n * (D / a.d), b.n * (D / b.d));
  return D === 1n ? num : T`\frac{${num}}{${D}}`;
}

export function parTex(a, b) {
  if (isOne(a) && isZero(b)) return 'x';
  const D = lcm(a.d, b.d);
  return D === 1n ? `(${linTex(a, b)})` : T`\left(${linTex(a, b)}\right)`;
}

export function aPow(a, e) {
  if (isOne(a)) return '';
  if (isInt(a)) return `${a.n < 0n ? `(${a.n})` : a.n}^{${e}}`;
  return T`\left(${fTex(a)}\right)^{${e}}`;
}

export function cat(a, b) {
  if (!a) return b;
  if (!b) return a;
  if (/^[0-9]/.test(b)) return a + T`\cdot ` + b;
  if (/[})!]$/.test(a) && /^[A-Za-z\\(]/.test(b)) return a + T`\,` + b;
  return a + b;
}

export function stripOuter(s) {
  if (s.charAt(0) !== '(' || s.charAt(s.length - 1) !== ')') return s;
  let d = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') d++;
    else if (s[i] === ')') {
      d--;
      if (d === 0 && i < s.length - 1) return s;
    }
  }
  return s.slice(1, -1);
}

export function joinTerms(ts) {
  if (!ts.length) return '0';
  return ts
    .map((t, i) => (i === 0 ? (t.neg ? '-' : '') : t.neg ? '-' : '+') + t.tex)
    .join('');
}

export function gen(c, numParts, denParts) {
  const neg = c.n < 0n;
  const cn = abs(c.n);
  const cd = c.d;
  const nums = numParts.filter(Boolean);
  const dens = denParts.filter(Boolean);
  let tex = '';

  if (!dens.length) {
    const coef = cd === 1n ? (cn === 1n && nums.length ? '' : cn.toString()) : T`\frac{${cn}}{${cd}}`;
    tex = coef;
    nums.forEach((p) => {
      tex = cat(tex, p);
    });
    return { neg, tex };
  }

  let num = cn !== 1n || !nums.length ? cn.toString() : '';
  nums.forEach((p) => {
    num = cat(num, p);
  });
  let den = cd !== 1n ? cd.toString() : '';
  if (cd === 1n && dens.length === 1) {
    den = stripOuter(dens[0]);
  } else {
    dens.forEach((p) => {
      den = cat(den, p);
    });
  }
  return { neg, tex: T`\frac{${num}}{${den}}` };
}

export function baseTex(B) {
  return isInt(B) ? B.n.toString() : T`\left(${fTex(B)}\right)`;
}

export function lnPow(B, n) {
  const e = n === 1 ? '' : `^{${n}}`;
  return T`\ln${e}${isInt(B) ? ' ' + B.n : T`\left(${fTex(B)}\right)`}`;
}

export function powPiece(a, b, q) {
  const par = parTex(a, b);
  const raw = linTex(a, b);
  if (isInt(q)) return q.n === 1n ? par : `${par}^{${q.n}}`;
  const inner = q.n === 1n ? raw : `${par}^{${q.n}}`;
  return q.d === 2n ? T`\sqrt{${inner}}` : T`\sqrt[${q.d}]{${inner}}`;
}

export function ffNum(p, n) {
  let r = ONE;
  for (let j = 0; j < n; j++) {
    r = fMul(r, fSub(p, F(j)));
  }
  return r;
}

export function factorial(n) {
  let r = 1n;
  for (let i = 2n; i <= BigInt(n); i++) r *= i;
  return r;
}

export function trigName(fn) {
  return fn === 'sin' ? '\\sin' : '\\cos';
}

export function termBase(t) {
  switch (t.kind) {
    case 'const':
      return { neg: t.c.n < 0n, tex: fTexAbs(t.c) };
    case 'trig':
      return gen(t.c, [`${trigName(t.fn)}(${linTex(t.a, t.b)})`], []);
    case 'exp': {
      const M = linTex(t.a, t.b);
      return gen(t.c, [t.base === 'e' ? `e^{${M}}` : `${baseTex(t.base)}^{${M}}`], []);
    }
    case 'log':
      return gen(t.c, [`${t.base === '10' ? T`\lg` : T`\ln`}(${linTex(t.a, t.b)})`], []);
    case 'pow': {
      const neg = t.p.n < 0n;
      const piece = powPiece(t.a, t.b, neg ? fNeg(t.p) : t.p);
      return neg ? gen(t.c, [], [piece]) : gen(t.c, [piece], []);
    }
    default:
      return { neg: false, tex: '0' };
  }
}

export function termAt(t, n) {
  let coef, r;
  switch (t.kind) {
    case 'const':
      return null;
    case 'trig': {
      const sinSeq = [
        ['sin', 1n],
        ['cos', 1n],
        ['sin', -1n],
        ['cos', -1n]
      ];
      const cosSeq = [
        ['cos', 1n],
        ['sin', -1n],
        ['cos', -1n],
        ['sin', 1n]
      ];
      const s = (t.fn === 'sin' ? sinSeq : cosSeq)[n % 4];
      coef = fMul(fMul(t.c, fPowInt(t.a, n)), F(s[1]));
      r = gen(coef, [`${trigName(s[0])}(${linTex(t.a, t.b)})`], []);
      r.num = (x) => fNum(coef) * (s[0] === 'sin' ? Math.sin : Math.cos)(fNum(t.a) * x + fNum(t.b));
      return r;
    }
    case 'exp': {
      coef = fMul(t.c, fPowInt(t.a, n));
      const M = linTex(t.a, t.b);
      const body =
        t.base === 'e'
          ? `e^{${M}}`
          : `${lnPow(t.base, n)}${T`\cdot `}${baseTex(t.base)}^{${M}}`;
      r = gen(coef, [body], []);
      const lnB = t.base === 'e' ? 1 : Math.log(fNum(t.base));
      const B = t.base === 'e' ? Math.E : fNum(t.base);
      r.num = (x) => fNum(coef) * Math.pow(lnB, n) * Math.pow(B, fNum(t.a) * x + fNum(t.b));
      return r;
    }
    case 'log': {
      const sign = n % 2 === 1 ? 1n : -1n;
      coef = fMul(fMul(t.c, fPowInt(t.a, n)), F(sign * factorial(n - 1)));
      const pw = n === 1 ? parTex(t.a, t.b) : `${parTex(t.a, t.b)}^{${n}}`;
      r = gen(coef, [], [t.base === '10' ? T`\ln 10\,` : '', pw]);
      r.num = (x) =>
        fNum(coef) /
        ((t.base === '10' ? Math.LN10 : 1) * Math.pow(fNum(t.a) * x + fNum(t.b), n));
      return r;
    }
    case 'pow': {
      coef = fMul(fMul(t.c, fPowInt(t.a, n)), ffNum(t.p, n));
      if (isZero(coef)) return null;
      const q = fSub(t.p, F(n));
      const nb = [];
      const db = [];
      if (!isZero(q)) {
        if (q.n > 0n) nb.push(powPiece(t.a, t.b, q));
        else db.push(powPiece(t.a, t.b, fNeg(q)));
      }
      r = gen(coef, nb, db);
      r.num = (x) => fNum(coef) * Math.pow(fNum(t.a) * x + fNum(t.b), fNum(q));
      return r;
    }
    default:
      return null;
  }
}

export function termGeneral(t) {
  const c = t.c;
  switch (t.kind) {
    case 'const':
      return null;
    case 'trig':
      return gen(
        c,
        [aPow(t.a, 'n'), `${trigName(t.fn)}${T`\left(${linTex(t.a, t.b)}+\frac{n\pi}{2}\right)`}`],
        []
      );
    case 'exp': {
      const M = linTex(t.a, t.b);
      const body =
        t.base === 'e'
          ? `e^{${M}}`
          : `${T`\ln^{n}`}${isInt(t.base) ? ' ' + t.base.n : T`\left(${fTex(t.base)}\right)`}${T`\cdot `}${baseTex(t.base)}^{${M}}`;
      return gen(c, [aPow(t.a, 'n'), body], []);
    }
    case 'log':
      return gen(
        c,
        [T`(-1)^{n-1}(n-1)!`, aPow(t.a, 'n')],
        [t.base === '10' ? T`\ln 10\,` : '', `${parTex(t.a, t.b)}^{n}`]
      );
    case 'pow': {
      const p = t.p;
      const par = parTex(t.a, t.b);
      if (isInt(p) && p.n >= 0n) {
        return gen(c, [aPow(t.a, 'n'), T`\frac{${p.n}!}{(${p.n}-n)!}`, `${par}^{${p.n}-n}`], []);
      }
      if (isInt(p)) {
        const qq = -p.n;
        const nf = qq === 1n ? 'n!' : T`(n+${qq - 1n})!`;
        const df = qq > 2n ? `${qq - 1n}!` : '';
        return gen(c, [T`(-1)^{n}`, nf, aPow(t.a, 'n')], [df, `${par}^{n+${qq}}`]);
      }
      const pt = fTex(p);
      const ptp = p.n < 0n ? T`\left(${pt}\right)` : pt;
      const prod = T`${ptp}\left(${pt}-1\right)\cdots\left(${pt}-n+1\right)`;
      return gen(c, [aPow(t.a, 'n'), prod, `${par}^{${pt}-n}`], []);
    }
    default:
      return null;
  }
}

export function buildFormula(terms) {
  const has = {};
  terms.forEach((t) => {
    has[t.kind] = true;
    if (t.kind === 'pow') {
      if (isInt(t.p) && t.p.n >= 0n) has.polypow = true;
      else if (isInt(t.p)) has.negpow = true;
      else has.fracpow = true;
    }
  });

  const rules = [];
  let chain = false;

  if (has.trig) {
    rules.push(
      T`\left(\sin u\right)^{(n)}=\sin\left(u+\frac{n\pi}{2}\right),\qquad \left(\cos u\right)^{(n)}=\cos\left(u+\frac{n\pi}{2}\right)`
    );
    chain = true;
  }
  if (has.exp) {
    rules.push(
      T`\left(B^{u}\right)^{(n)}=\left(k\ln B\right)^{n}B^{u}\;\;(u=kx+m),\qquad \left(e^{u}\right)^{(n)}=k^{n}e^{u}`
    );
  }
  if (has.log) {
    rules.push(
      T`\left(\ln u\right)^{(n)}=\frac{(-1)^{n-1}(n-1)!\,a^{n}}{u^{n}}\;\;(u=ax+b),\qquad \lg u=\frac{\ln u}{\ln 10}`
    );
  }
  if (has.polypow) {
    rules.push(
      T`\left(u^{p}\right)^{(n)}=\frac{p!}{(p-n)!}\,a^{n}u^{p-n}\;\;(n\le p),\qquad =0\;\;(n>p)`
    );
  }
  if (has.negpow) {
    rules.push(
      T`\left(\frac{1}{u^{q}}\right)^{(n)}=\frac{(-1)^{n}(n+q-1)!}{(q-1)!}\cdot\frac{a^{n}}{u^{n+q}}\;\;(u=ax+b)`
    );
  }
  if (has.fracpow) {
    rules.push(
      T`\left(u^{p}\right)^{(n)}=p(p-1)\cdots(p-n+1)\,a^{n}u^{p-n}\;\;(u=ax+b)`
    );
  }

  const gens = terms.map(termGeneral).filter(Boolean);
  const base = terms.map(termBase);
  const domain = [];
  const seen = {};

  terms.forEach((t) => {
    let s = null;
    const L = linTex(t.a || ONE, t.b || ZERO);
    if (t.kind === 'log') {
      s = `${L}>0`;
    } else if (t.kind === 'pow') {
      const isEvenRoot = !isInt(t.p) && t.p.d % 2n === 0n;
      const isNeg = t.p.n < 0n;
      if (isEvenRoot && isNeg) {
        s = `${L}>0`;
      } else if (isEvenRoot) {
        s = `${L}${T`\ge 0`}`;
      } else if (isNeg) {
        s = `${L}${T`\ne 0`}`;
      }
    }
    if (s && !seen[s]) {
      seen[s] = 1;
      domain.push(s);
    }
  });

  return {
    rules,
    chain: chain || has.exp || has.log || has.pow,
    general: gens.length ? `y^{(n)}=${joinTerms(gens)}` : 'y^{(n)}=0',
    polyNote: !!has.polypow,
    rewrite: `y=${joinTerms(base)}`,
    domain: domain.join(T`,\quad `),
    at(n) {
      const parts = terms.map((t) => termAt(t, n)).filter(Boolean);
      return {
        tex: joinTerms(parts),
        num(x) {
          return parts.reduce((s, p) => s + p.num(x), 0);
        }
      };
    }
  };
}
