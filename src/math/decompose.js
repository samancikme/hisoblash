import {
  F, abs, fAdd, fSub, fMul, fDiv, fNeg, isZero, isOne, isInt, fKey, ZERO, ONE
} from './fraction.js';
import { constVal, toPoly, asLin } from './ast.js';

export const NOFORM = { noform: true };

export function asExpForm(n) {
  if (n.t === 'fn' && n.name === 'exp') {
    const L0 = asLin(n.a);
    return L0 ? { base: 'e', k: L0.a, m: L0.b } : null;
  }
  if (n.t === 'pow') {
    const L = asLin(n.b);
    if (L) {
      if (n.a.t === 'e') return { base: 'e', k: L.a, m: L.b };
      const bc = constVal(n.a);
      if (bc && bc.n > 0n && !isOne(bc)) return { base: bc, k: L.a, m: L.b };
    }
    const ex = constVal(n.b);
    if (ex) {
      const inner = asExpForm(n.a);
      if (inner) return { base: inner.base, k: fMul(inner.k, ex), m: fMul(inner.m, ex) };
    }
  }
  return null;
}

/**
 * maxraj: c * (ax+b)^k ko'rinishida
 */
export function asDenPow(n) {
  let r;
  if (n.t === 'mul') {
    const ca = constVal(n.a);
    const cb = constVal(n.b);
    if (ca && !isZero(ca) && (r = asDenPow(n.b))) {
      r.c = fMul(r.c, ca);
      return r;
    }
    if (cb && !isZero(cb) && (r = asDenPow(n.a))) {
      r.c = fMul(r.c, cb);
      return r;
    }
  }
  if (n.t === 'div') {
    const cd = constVal(n.b);
    if (cd && !isZero(cd) && (r = asDenPow(n.a))) {
      r.c = fDiv(r.c, cd);
      return r;
    }
  }
  if (n.t === 'neg' && (r = asDenPow(n.a))) {
    r.c = fNeg(r.c);
    return r;
  }
  if (n.t === 'pow') {
    const k = constVal(n.b);
    const base = asLin(n.a);
    if (k && base && k.n > 0n) return { c: ONE, a: base.a, b: base.b, k };
  }
  const L = asLin(n);
  if (L) return { c: ONE, a: L.a, b: L.b, k: ONE };
  return null;
}

export function decompose(ast) {
  const terms = [];

  function addPoly(p, m) {
    for (let k = 0; k < p.length; k++) {
      if (isZero(p[k])) continue;
      if (k === 0) {
        terms.push({ kind: 'const', c: fMul(m, p[k]) });
      } else {
        terms.push({ kind: 'pow', c: fMul(m, p[k]), a: ONE, b: ZERO, p: F(k) });
      }
    }
  }

  function go(n, m) {
    const cv = constVal(n);
    if (cv) {
      terms.push({ kind: 'const', c: fMul(m, cv) });
      return;
    }
    let ca, cb, p, L;
    switch (n.t) {
      case 'add':
        go(n.a, m);
        go(n.b, m);
        return;
      case 'sub':
        go(n.a, m);
        go(n.b, fNeg(m));
        return;
      case 'neg':
        go(n.a, fNeg(m));
        return;
      case 'mul':
        ca = constVal(n.a);
        cb = constVal(n.b);
        if (ca) {
          go(n.b, fMul(m, ca));
          return;
        }
        if (cb) {
          go(n.a, fMul(m, cb));
          return;
        }
        p = toPoly(n);
        if (p) {
          addPoly(p, m);
          return;
        }
        throw NOFORM;
      case 'div': {
        cb = constVal(n.b);
        if (cb) {
          go(n.a, fDiv(m, cb));
          return;
        }
        const N = toPoly(n.a);
        const D = asDenPow(n.b);
        if (N && D) {
          const N_trimmed = [...N];
          while (N_trimmed.length > 1 && isZero(N_trimmed[N_trimmed.length - 1])) {
            N_trimmed.pop();
          }
          if (N_trimmed.length <= 2) {
            const q = N_trimmed[0];
            const pp = N_trimmed[1] || ZERO;
            const alpha = fDiv(pp, D.a);
            const beta = fSub(q, fMul(alpha, D.b));
            const cc = fDiv(m, D.c);
            if (!isZero(alpha)) {
              const e1 = fSub(ONE, D.k);
              if (isZero(e1)) terms.push({ kind: 'const', c: fMul(cc, alpha) });
              else terms.push({ kind: 'pow', c: fMul(cc, alpha), a: D.a, b: D.b, p: e1 });
            }
            if (!isZero(beta)) {
              terms.push({ kind: 'pow', c: fMul(cc, beta), a: D.a, b: D.b, p: fNeg(D.k) });
            }
            return;
          }
        }
        throw NOFORM;
      }
      case 'pow': {
        const ex = asExpForm(n);
        if (ex) {
          terms.push({ kind: 'exp', c: m, base: ex.base, a: ex.k, b: ex.m });
          return;
        }
        const e = constVal(n.b);
        L = asLin(n.a);
        if (e && L && abs(e.n) <= 400n && e.d <= 12n) {
          terms.push({ kind: 'pow', c: m, a: L.a, b: L.b, p: e });
          return;
        }
        p = toPoly(n);
        if (p) {
          addPoly(p, m);
          return;
        }
        throw NOFORM;
      }
      case 'fn': {
        if (n.name === 'exp') {
          const ex2 = asExpForm(n);
          if (ex2) {
            terms.push({ kind: 'exp', c: m, base: ex2.base, a: ex2.k, b: ex2.m });
            return;
          }
          throw NOFORM;
        }
        L = asLin(n.a);
        if (!L) throw NOFORM;
        if (n.name === 'sin' || n.name === 'cos') {
          terms.push({ kind: 'trig', c: m, fn: n.name, a: L.a, b: L.b });
          return;
        }
        if (n.name === 'ln') {
          terms.push({ kind: 'log', c: m, base: 'e', a: L.a, b: L.b });
          return;
        }
        if (n.name === 'lg') {
          terms.push({ kind: 'log', c: m, base: '10', a: L.a, b: L.b });
          return;
        }
        throw NOFORM;
      }
      default:
        p = toPoly(n);
        if (p) {
          addPoly(p, m);
          return;
        }
        throw NOFORM;
    }
  }

  try {
    go(ast, ONE);
  } catch (err) {
    if (err === NOFORM) return null;
    throw err;
  }

  // O'xshash hadlarni birlashtirish
  const map = {};
  const order = [];
  let cst = ZERO;

  terms.forEach((t) => {
    if (t.kind === 'const') {
      cst = fAdd(cst, t.c);
      return;
    }
    const key = `${t.kind}|${t.fn || ''}|${
      t.base === undefined ? '' : t.base === 'e' || t.base === '10' ? t.base : fKey(t.base)
    }|${fKey(t.a)}|${fKey(t.b)}|${t.p ? fKey(t.p) : ''}`;

    if (map[key]) {
      map[key].c = fAdd(map[key].c, t.c);
    } else {
      map[key] = t;
      order.push(t);
    }
  });

  const out = order.filter((t) => !isZero(t.c));
  if (!isZero(cst)) {
    out.push({ kind: 'const', c: cst });
  }
  return out;
}
