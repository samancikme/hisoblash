import nerdamer from 'nerdamer';
import 'nerdamer/Calculus.js';

import {
  F, abs, fAdd, fSub, fMul, fDiv, fNeg, isZero, isOne, isInt, ZERO, ONE
} from './fraction.js';
import { constVal, toTex, toNerd, evalAst } from './ast.js';

const N0 = { t: 'num', v: ZERO };
const N1 = { t: 'num', v: ONE };

function nnum(f) {
  return f.n < 0n ? { t: 'neg', a: { t: 'num', v: fNeg(f) } } : { t: 'num', v: f };
}

function mul(a, b) {
  return { t: 'mul', a, b };
}

function div(a, b) {
  return { t: 'div', a, b };
}

function add(a, b) {
  return { t: 'add', a, b };
}

function sub(a, b) {
  return { t: 'sub', a, b };
}

function fnode(name, a) {
  return { t: 'fn', name, a };
}

function sq(a) {
  return { t: 'pow', a, b: { t: 'num', v: F(2) } };
}

export function diffAst(n) {
  let u, du;
  switch (n.t) {
    case 'num':
    case 'e':
    case 'pi':
      return N0;
    case 'x':
      return N1;
    case 'neg':
      return { t: 'neg', a: diffAst(n.a) };
    case 'add':
      return add(diffAst(n.a), diffAst(n.b));
    case 'sub':
      return sub(diffAst(n.a), diffAst(n.b));
    case 'mul':
      return add(mul(diffAst(n.a), n.b), mul(n.a, diffAst(n.b)));
    case 'div':
      return div(sub(mul(diffAst(n.a), n.b), mul(n.a, diffAst(n.b))), sq(n.b));
    case 'pow': {
      const ce = constVal(n.b);
      if (ce) {
        return mul(
          mul(nnum(ce), { t: 'pow', a: n.a, b: nnum(fSub(ce, ONE)) }),
          diffAst(n.a)
        );
      }
      if (n.a.t === 'e') return mul(n, diffAst(n.b));
      const cb0 = constVal(n.a);
      if (cb0) return mul(mul(n, fnode('ln', n.a)), diffAst(n.b));
      return mul(
        n,
        add(mul(diffAst(n.b), fnode('ln', n.a)), div(mul(n.b, diffAst(n.a)), n.a))
      );
    }
    case 'fn':
      u = n.a;
      du = diffAst(u);
      switch (n.name) {
        case 'sin':
          return mul(fnode('cos', u), du);
        case 'cos':
          return { t: 'neg', a: mul(fnode('sin', u), du) };
        case 'tan':
          return div(du, sq(fnode('cos', u)));
        case 'cot':
          return { t: 'neg', a: div(du, sq(fnode('sin', u))) };
        case 'sec':
          return mul(mul(fnode('sec', u), fnode('tan', u)), du);
        case 'csc':
          return { t: 'neg', a: mul(mul(fnode('csc', u), fnode('cot', u)), du) };
        case 'sinh':
          return mul(fnode('cosh', u), du);
        case 'cosh':
          return mul(fnode('sinh', u), du);
        case 'tanh':
          return div(du, sq(fnode('cosh', u)));
        case 'exp':
          return mul(n, du);
        case 'ln':
          return div(du, u);
        case 'lg':
          return div(du, mul(u, fnode('ln', { t: 'num', v: F(10) })));
        case 'arcsin':
          return div(du, { t: 'pow', a: sub(N1, sq(u)), b: { t: 'num', v: F(1, 2) } });
        case 'arccos':
          return {
            t: 'neg',
            a: div(du, { t: 'pow', a: sub(N1, sq(u)), b: { t: 'num', v: F(1, 2) } })
          };
        case 'arctan':
          return div(du, add(N1, sq(u)));
        default:
          throw new Error(`Unsupported function for diff: ${n.name}`);
      }
    default:
      throw new Error(`Unsupported AST node for diff: ${n.t}`);
  }
}

function sumTerms(n, sign, out) {
  if (n.t === 'add') {
    sumTerms(n.a, sign, out);
    sumTerms(n.b, sign, out);
    return;
  }
  if (n.t === 'sub') {
    sumTerms(n.a, sign, out);
    sumTerms(n.b, fNeg(sign), out);
    return;
  }
  if (n.t === 'neg') {
    sumTerms(n.a, fNeg(sign), out);
    return;
  }
  leaf(simp(n), sign, out);
}

function leaf(n, sign, out) {
  if (n.t === 'neg') {
    leaf(n.a, fNeg(sign), out);
    return;
  }
  if (n.t === 'add' || n.t === 'sub') {
    sumTerms(n, sign, out);
    return;
  }
  const cv = constVal(n);
  if (cv) {
    out.cst = fAdd(out.cst, fMul(sign, cv));
    return;
  }
  let c = sign;
  let rest = n;
  if (n.t === 'mul') {
    const factors = [];
    flatMul(n, factors);
    let cf = ONE;
    const keep = [];
    factors.forEach((f) => {
      const v = constVal(f);
      if (v) cf = fMul(cf, v);
      else keep.push(f);
    });
    c = fMul(sign, cf);
    rest = keep.reduce((acc, f) => (acc ? mul(acc, f) : f), null);
  }
  const key = toTex(rest);
  if (out.map[key]) {
    out.map[key].c = fAdd(out.map[key].c, c);
  } else {
    out.map[key] = { c, node: rest };
    out.list.push(out.map[key]);
  }
}

function flatMul(n, out) {
  if (n.t === 'mul') {
    flatMul(n.a, out);
    flatMul(n.b, out);
  } else {
    out.push(n);
  }
}

export function simp(n) {
  const cv = constVal(n);
  if (cv) return nnum(cv);
  switch (n.t) {
    case 'neg':
    case 'add':
    case 'sub': {
      const o = { cst: ZERO, map: {}, list: [] };
      sumTerms(n, ONE, o);
      let res = null;
      function put(c, node) {
        if (isZero(c)) return;
        const mag = abs(c.n);
        const neg = c.n < 0n;
        const cm = F(mag, c.d);
        const body = node
          ? isOne(cm)
            ? node
            : mul({ t: 'num', v: cm }, node)
          : { t: 'num', v: cm };
        if (!res) res = neg ? { t: 'neg', a: body } : body;
        else res = neg ? sub(res, body) : add(res, body);
      }
      o.list.forEach((t) => put(t.c, t.node));
      put(o.cst, null);
      return res || N0;
    }
    case 'mul': {
      const fs = [];
      flatMul(n, fs);
      let coef = ONE;
      const keep = [];
      let neg = false;
      fs.forEach((f) => {
        f = simp(f);
        if (f.t === 'neg') {
          neg = !neg;
          f = f.a;
        }
        const v = constVal(f);
        if (v) coef = fMul(coef, v);
        else keep.push(f);
      });
      if (isZero(coef)) return N0;
      if (neg) coef = fNeg(coef);

      const counts = [];
      const idx = {};
      keep.forEach((f) => {
        let base = f;
        let ex = ONE;
        if (f.t === 'pow') {
          const ce = constVal(f.b);
          if (ce) {
            base = f.a;
            ex = ce;
          }
        }
        const k = toTex(base);
        if (idx[k] !== undefined) {
          counts[idx[k]].ex = fAdd(counts[idx[k]].ex, ex);
        } else {
          idx[k] = counts.length;
          counts.push({ base, ex });
        }
      });
      let body = null;
      counts.forEach((c) => {
        if (isZero(c.ex)) return;
        const f = isOne(c.ex) ? c.base : { t: 'pow', a: c.base, b: nnum(c.ex) };
        body = body ? mul(body, f) : f;
      });
      if (!body) return nnum(coef);
      if (isOne(coef)) return body;
      if (coef.n === -1n && coef.d === 1n) return { t: 'neg', a: body };
      return coef.n < 0n
        ? { t: 'neg', a: mul({ t: 'num', v: fNeg(coef) }, body) }
        : mul({ t: 'num', v: coef }, body);
    }
    case 'div': {
      const a = simp(n.a);
      const b = simp(n.b);
      const cb = constVal(b);
      if (constVal(a) && isZero(constVal(a))) return N0;
      if (cb && !isZero(cb)) return simp(mul(nnum(fDiv(ONE, cb)), a));
      return div(a, b);
    }
    case 'pow': {
      const ba = simp(n.a);
      const ex = simp(n.b);
      const ce = constVal(ex);
      if (ce && isZero(ce)) return N1;
      if (ce && isOne(ce)) return ba;
      return { t: 'pow', a: ba, b: ex };
    }
    case 'fn': {
      const arg = simp(n.a);
      if (n.name === 'ln' && arg.t === 'e') return N1;
      return fnode(n.name, arg);
    }
    default:
      return n;
  }
}

export function nthDiff(ast, k) {
  let cur = simp(ast);
  for (let i = 0; i < k; i++) {
    cur = simp(diffAst(cur));
  }
  return cur;
}

const CHECK_PTS = [0.3, 0.7, 1.3, 2.6, 0.45, -0.5, 3.4];

export function casDerivs(ast, n) {
  const rows = [];
  let curNerd = null;
  try {
    curNerd = nerdamer(toNerd(ast));
  } catch (e) {
    curNerd = null;
  }

  for (let k = 1; k <= n; k++) {
    const own = nthDiff(ast, k);
    const tex = toTex(own);
    let best = tex;

    if (curNerd) {
      try {
        curNerd = nerdamer.diff(curNerd, 'x');
        const cand = curNerd.toTeX();
        let checked = 0;
        let ok = true;
        for (let i = 0; i < CHECK_PTS.length && checked < 3; i++) {
          const ref = evalAst(own, CHECK_PTS[i]);
          if (!Number.isFinite(ref)) continue;
          const v = Number(curNerd.evaluate({ x: CHECK_PTS[i] }).text('decimals'));
          checked++;
          if (!(Math.abs(v - ref) <= 1e-5 * Math.max(1, Math.abs(ref)))) {
            ok = false;
            break;
          }
        }
        if (ok && checked > 0 && cand && cand.length <= tex.length + 50) {
          best = cand;
        }
      } catch (e) {
        curNerd = null;
      }
    }
    rows.push(best);
  }
  return rows;
}
