import nerdamer from 'nerdamer';
import 'nerdamer/Calculus.js';

import { parse } from './parser.js';
import { toTex, toNerd } from './ast.js';
import { analyze } from './engine.js';
import { factorial } from './formula.js';

const T = String.raw;

/**
 * Standard known Maclaurin series catalogue
 */
export const STANDARD_MACLAURIN = [
  {
    match: (expr) => /^e\^(\(?x\)?)|\bexp\(x\)$/.test(expr.replace(/\s+/g, '')),
    name: 'e^x',
    general: T`\sum_{n=0}^{\infty} \frac{x^n}{n!} = 1 + x + \frac{x^2}{2!} + \frac{x^3}{3!} + \dots + \frac{x^n}{n!} + \dots`,
    convergence: T`x \in (-\infty, +\infty)`
  },
  {
    match: (expr) => /^sin\(x\)$/.test(expr.replace(/\s+/g, '')),
    name: '\\sin(x)',
    general: T`\sum_{k=0}^{\infty} \frac{(-1)^k x^{2k+1}}{(2k+1)!} = x - \frac{x^3}{3!} + \frac{x^5}{5!} - \dots`,
    convergence: T`x \in (-\infty, +\infty)`
  },
  {
    match: (expr) => /^cos\(x\)$/.test(expr.replace(/\s+/g, '')),
    name: '\\cos(x)',
    general: T`\sum_{k=0}^{\infty} \frac{(-1)^k x^{2k}}{(2k)!} = 1 - \frac{x^2}{2!} + \frac{x^4}{4!} - \dots`,
    convergence: T`x \in (-\infty, +\infty)`
  },
  {
    match: (expr) => /^(ln|log)\(1\+x\)$/.test(expr.replace(/\s+/g, '')),
    name: '\\ln(1+x)',
    general: T`\sum_{n=1}^{\infty} \frac{(-1)^{n-1} x^n}{n} = x - \frac{x^2}{2} + \frac{x^3}{3} - \frac{x^4}{4} + \dots`,
    convergence: T`x \in (-1, 1]`
  },
  {
    match: (expr) => /^1\/\(1-x\)$/.test(expr.replace(/\s+/g, '')),
    name: '\\frac{1}{1-x}',
    general: T`\sum_{n=0}^{\infty} x^n = 1 + x + x^2 + x^3 + \dots`,
    convergence: T`|x| < 1`
  },
  {
    match: (expr) => /^1\/\(1\+x\)$/.test(expr.replace(/\s+/g, '')),
    name: '\\frac{1}{1+x}',
    general: T`\sum_{n=0}^{\infty} (-1)^n x^n = 1 - x + x^2 - x^3 + \dots`,
    convergence: T`|x| < 1`
  },
  {
    match: (expr) => /^sinh\(x\)$/.test(expr.replace(/\s+/g, '')),
    name: '\\sinh(x)',
    general: T`\sum_{k=0}^{\infty} \frac{x^{2k+1}}{(2k+1)!} = x + \frac{x^3}{3!} + \frac{x^5}{5!} + \dots`,
    convergence: T`x \in (-\infty, +\infty)`
  },
  {
    match: (expr) => /^cosh\(x\)$/.test(expr.replace(/\s+/g, '')),
    name: '\\cosh(x)',
    general: T`\sum_{k=0}^{\infty} \frac{x^{2k}}{(2k)!} = 1 + \frac{x^2}{2!} + \frac{x^4}{4!} + \dots`,
    convergence: T`x \in (-\infty, +\infty)`
  },
  {
    match: (expr) => /^arctan\(x\)$/.test(expr.replace(/\s+/g, '')),
    name: '\\arctan(x)',
    general: T`\sum_{k=0}^{\infty} \frac{(-1)^k x^{2k+1}}{2k+1} = x - \frac{x^3}{3} + \frac{x^5}{5} - \dots`,
    convergence: T`|x| \le 1`
  }
];

function cleanNerdTeX(tex) {
  if (!tex) return '0';
  return tex
    .replace(/\\mathrm\{sin\}/g, '\\sin')
    .replace(/\\mathrm\{cos\}/g, '\\cos')
    .replace(/\\mathrm\{tan\}/g, '\\tan')
    .replace(/\\mathrm\{log\}/g, '\\ln')
    .replace(/\\mathrm\{exp\}/g, '\\exp')
    .replace(/\\left\(/g, '(')
    .replace(/\\right\)/g, ')')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatBinomialPower(x0Clean, k) {
  if (k === 0) return '';
  const isZero = x0Clean === '0' || Number(x0Clean) === 0;
  if (isZero) {
    return k === 1 ? 'x' : `x^{${k}}`;
  }
  const numX0 = Number(x0Clean);
  let inner;
  if (!isNaN(numX0) && numX0 < 0) {
    inner = `x + ${Math.abs(numX0)}`;
  } else if (!isNaN(numX0) && numX0 > 0) {
    inner = `x - ${numX0}`;
  } else {
    inner = `x - ${x0Clean}`;
  }
  return k === 1 ? `(${inner})` : `(${inner})^{${k}}`;
}

function formatVal(tex) {
  let s = cleanNerdTeX(tex);
  // Simplify -\frac{\sin(2)}{2} -> -\frac{1}{2}\sin 2
  const fracTrig = /^(-?)\\frac\{(\\sin|\\cos|\\ln)\(([^)]+)\)\}\{(\d+)\}$/.exec(s);
  if (fracTrig) {
    const sign = fracTrig[1] ? '-' : '';
    const fn = fracTrig[2];
    const arg = fracTrig[3];
    const den = fracTrig[4];
    return `${sign}\\frac{1}{${den}} ${fn} ${arg}`;
  }
  // Simplify \sin(2) -> \sin 2, \cos(2) -> \cos 2
  s = s.replace(/(\\sin|\\cos|\\ln)\((\d+)\)/g, '$1 $2');
  return s;
}

export function computeTaylorSeries(rawExpr, rawX0 = '0', maxN = 5) {
  const n = Math.min(15, Math.max(1, parseInt(maxN, 10) || 5));
  let ast;
  try {
    ast = parse(rawExpr);
  } catch (e) {
    return { error: e.message || 'Ifodani o‘qib bo‘lmadi.' };
  }

  const origTex = toTex(ast);
  const nerdInput = toNerd(ast);

  let x0Clean = String(rawX0 || '0').trim();
  if (!x0Clean) x0Clean = '0';
  x0Clean = x0Clean.replace(/pi/g, 'pi').replace(/π/g, 'pi');
  const isMaclaurin = x0Clean === '0' || Number(x0Clean) === 0;

  // Analyze general formula if possible (from our formula engine)
  let generalInfo = null;
  try {
    const an = analyze(rawExpr);
    if (an && an.formula && an.terms && an.terms.length > 0) {
      generalInfo = an;
    }
  } catch (e) {}

  let curNerd;
  try {
    curNerd = nerdamer(nerdInput);
  } catch (e) {
    return { error: `Nerdamer ifodani tahlil qila olmadi: ${e.message}` };
  }

  const steps = [];
  const derivatives = [];
  const valuesAtX0 = [];
  const unreducedParts = [];
  const polyTerms = [];

  for (let k = 0; k <= n; k++) {
    // 1. Derivative f^(k)(x)
    let derivTex;
    if (generalInfo && generalInfo.formula && k >= 1) {
      try {
        const atK = generalInfo.formula.at(k);
        derivTex = atK.tex;
      } catch (e) {
        derivTex = cleanNerdTeX(curNerd.toTeX());
      }
    } else {
      derivTex = cleanNerdTeX(curNerd.toTeX());
    }

    if (k >= 1 && k <= Math.min(n, 4)) {
      const primes = k <= 3 ? "'".repeat(k) : `^{(${k})}`;
      derivatives.push({
        order: k,
        tex: `f${primes}(x) = ${derivTex}`
      });
    }

    // 2. Value at x0: f^(k)(x0)
    let valTex;
    try {
      const subbed = nerdamer(curNerd.text()).sub('x', x0Clean);
      valTex = formatVal(subbed.toTeX());
    } catch (e) {
      valTex = '0';
    }

    if (k <= Math.min(n, 4)) {
      const primes = k === 0 ? '' : (k <= 3 ? "'".repeat(k) : `^{(${k})}`);
      valuesAtX0.push({
        order: k,
        tex: `f${primes}(${x0Clean}) = ${valTex}`
      });
    }

    // 3. Coefficient a_k = f^(k)(x0) / k!
    const factBig = factorial(k);
    const factStr = factBig.toString();

    let coefObj;
    let coefTex;
    try {
      coefObj = nerdamer(`(${nerdamer(curNerd.text()).sub('x', x0Clean).text()}) / ${factStr}`).evaluate();
      coefTex = formatVal(coefObj.toTeX());
    } catch (e) {
      coefTex = '0';
    }

    const binom = formatBinomialPower(x0Clean, k);

    // 4. Unreduced term over k!: \frac{f^(k)(x0)}{k!} (x-x0)^k
    if (k === 0) {
      unreducedParts.push({ k: 0, tex: valTex });
    } else {
      const isNeg = valTex.startsWith('-');
      const absValTex = isNeg ? valTex.slice(1).trim() : valTex;
      const xPart = binom ? (binom.startsWith('(') ? binom : `\\, ${binom}`) : '';
      const fracPart = T`\frac{${valTex}}{${k}!}${xPart}`;
      unreducedParts.push({ k, tex: fracPart });
    }

    // 5. Simplified term for P_n(x)
    if (coefTex !== '0' && coefTex !== '0.0') {
      const isNeg = coefTex.startsWith('-');
      const absCoef = isNeg ? coefTex.slice(1).trim() : coefTex;
      let piece;
      if (k === 0) {
        piece = absCoef;
      } else if (absCoef === '1') {
        piece = binom;
      } else {
        piece = `${absCoef}${binom.startsWith('(') ? '' : '\\,'}${binom}`;
      }
      polyTerms.push({ isNeg, tex: piece });
    }

    steps.push({
      k,
      derivTex,
      valTex,
      factStr,
      coefTex,
      termTex: coefTex === '0' ? '0' : `${coefTex}${binom}`
    });

    if (k < n) {
      try {
        curNerd = nerdamer.diff(curNerd, 'x');
      } catch (e) {
        break;
      }
    }
  }

  // General n-th derivative and value at x0
  let generalDerivTex = null;
  let generalValAtX0Tex = null;
  let generalSummationBody = null;

  if (generalInfo && generalInfo.formula && generalInfo.formula.general) {
    const rawGen = generalInfo.formula.general.replace(/^y\^\{\(n\)\}=/, '');
    generalDerivTex = `f^{(n)}(x) = ${rawGen}`;

    // Evaluate general formula at x = x0
    // e.g. (1/2)^n cos( (x/2+2) + n*pi/2 ) at x=0 -> (1/2)^n cos(2 + n*pi/2)
    let atX0 = rawGen;
    if (x0Clean === '0') {
      atX0 = atX0
        .replace(/\\frac\{x\}\{(\d+)\}/g, '0')
        .replace(/x/g, '0')
        .replace(/0\s*\+\s*/g, '')
        .replace(/\s*\+\s*0/g, '');
    }
    generalValAtX0Tex = `f^{(n)}(${x0Clean}) = ${atX0}`;
    generalSummationBody = T`\frac{${atX0}}{n!} ${formatBinomialPower(x0Clean, 'n')}`;
  }

  // Construct unreduced expansion formula:
  // f(x) = f(0) + \frac{f'(0)}{1!}x + \frac{f''(0)}{2!}x^2 + ... + \frac{f^(n)(0)}{n!}x^n
  const patternTex = isMaclaurin
    ? T`f(x) = f(0) + \frac{f'(0)}{1!} x + \frac{f''(0)}{2!} x^2 + \dots + \frac{f^{(n)}(0)}{n!} x^n + \dots`
    : T`f(x) = f(${x0Clean}) + \frac{f'(${x0Clean})}{1!} (x-${x0Clean}) + \frac{f''(${x0Clean})}{2!} (x-${x0Clean})^2 + \dots + \frac{f^{(n)}(${x0Clean})}{n!} (x-${x0Clean})^n + \dots`;

  // Build the notebook-style substitution line:
  // f(x) = cos 2 + \frac{-1/2 sin 2}{1!} x + \frac{-1/4 cos 2}{2!} x^2 + ... + \frac{1/2^n cos(2 + n*pi/2)}{n!} x^n
  let unreducedLine = 'f(x) = ';
  unreducedParts.slice(0, Math.min(unreducedParts.length, 4)).forEach((p, idx) => {
    if (idx === 0) {
      unreducedLine += p.tex;
    } else {
      unreducedLine += ' + ' + p.tex;
    }
  });

  if (generalSummationBody) {
    unreducedLine += ` + \\dots + ${generalSummationBody}`;
  } else if (unreducedParts.length > 4) {
    unreducedLine += ` + \\dots + ${unreducedParts[unreducedParts.length - 1].tex}`;
  }

  // Construct series summation (Sigma notation)
  let seriesSummationTex = null;
  if (generalSummationBody) {
    seriesSummationTex = T`f(x) = \sum_{n=0}^{\infty} ${generalSummationBody}`;
  } else {
    seriesSummationTex = isMaclaurin
      ? T`f(x) = \sum_{n=0}^{\infty} \frac{f^{(n)}(0)}{n!} x^n`
      : T`f(x) = \sum_{n=0}^{\infty} \frac{f^{(n)}(${x0Clean})}{n!} (x - ${x0Clean})^n`;
  }

  // Polynomial P_n(x) string
  let polyTex = '';
  if (!polyTerms.length) {
    polyTex = '0';
  } else {
    polyTerms.forEach((t, i) => {
      if (i === 0) {
        polyTex += (t.isNeg ? '-' : '') + t.tex;
      } else {
        polyTex += (t.isNeg ? ' - ' : ' + ') + t.tex;
      }
    });
  }

  const peanoRem = isMaclaurin ? `o(x^{${n}})` : `o((x - ${x0Clean})^{${n}})`;
  const peanoEquation = `f(x) = ${polyTex} + ${peanoRem}`;

  const matchedStandard = STANDARD_MACLAURIN.find((s) => isMaclaurin && s.match(rawExpr));

  return {
    isMaclaurin,
    origTex,
    x0: x0Clean,
    n,
    derivatives,
    generalDerivTex,
    valuesAtX0,
    generalValAtX0Tex,
    patternTex,
    unreducedLine,
    seriesSummationTex,
    polyTex,
    peanoEquation,
    steps,
    matchedStandard
  };
}
