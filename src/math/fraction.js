/**
 * BigInt aniq kasrlar arifmetikasi (Rational Numbers)
 */
const T = String.raw;

export function abs(v) {
  return v < 0n ? -v : v;
}

export function gcd(a, b) {
  a = abs(a);
  b = abs(b);
  while (b) {
    const t = a % b;
    a = b;
    b = t;
  }
  return a;
}

export function lcm(a, b) {
  if (a === 0n || b === 0n) return 0n;
  return (a / gcd(a, b)) * b;
}

export function F(n, d = 1n) {
  n = BigInt(n);
  d = BigInt(d);
  if (d === 0n) throw new Error('Division by zero in fraction');
  if (d < 0n) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d) || 1n;
  return { n: n / g, d: d / g };
}

export function fAdd(x, y) {
  return F(x.n * y.d + y.n * x.d, x.d * y.d);
}

export function fSub(x, y) {
  return F(x.n * y.d - y.n * x.d, x.d * y.d);
}

export function fMul(x, y) {
  return F(x.n * y.n, x.d * y.d);
}

export function fDiv(x, y) {
  if (y.n === 0n) throw new Error('Division by zero fraction');
  return F(x.n * y.d, x.d * y.n);
}

export function fNeg(x) {
  return { n: -x.n, d: x.d };
}

export function fPowInt(x, k) {
  const e = BigInt(Math.abs(k));
  const r = F(x.n ** e, x.d ** e);
  return k < 0 ? fDiv(F(1), r) : r;
}

export function isZero(x) {
  return x.n === 0n;
}

export function isOne(x) {
  return x.n === 1n && x.d === 1n;
}

export function isInt(x) {
  return x.d === 1n;
}

export function fNum(x) {
  return Number(x.n) / Number(x.d);
}

export function fKey(x) {
  return `${x.n}/${x.d}`;
}

export const ZERO = F(0);
export const ONE = F(1);

export function fTexAbs(f) {
  return f.d === 1n ? abs(f.n).toString() : T`\frac{${abs(f.n)}}{${f.d}}`;
}

export function fTex(f) {
  return (f.n < 0n ? '-' : '') + fTexAbs(f);
}

export function decimalToF(str) {
  const parts = str.split('.');
  if (parts.length === 1) return F(BigInt(parts[0]));
  return F(BigInt((parts[0] || '0') + parts[1]), 10n ** BigInt(parts[1].length));
}
