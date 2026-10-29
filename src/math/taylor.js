import nerdamer from 'nerdamer';
import 'nerdamer/Calculus.js';

import { parse } from './parser.js';
import { toTex, toNerd, constVal } from './ast.js';
import { factorial } from './formula.js';
import { F, abs, fTex } from './fraction.js';

const T = String.raw;

/**
 * Standard known Maclaurin series catalogue
 */
export const STANDARD_MACLAURIN = [
  {
    match: (expr) => /^e\^(\(?x\)?)|\bexp\(x\)$/.test(expr.replace(/\s+/g, '')),
    name: 'e^x',
    general: T`\sum_{k=0}^{\infty} \frac{x^k}{k!} = 1 + x + \frac{x^2}{2!} + \frac{x^3}{3!} + \dots`,
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
    general: T`\sum_{k=1}^{\infty} \frac{(-1)^{k-1} x^k}{k} = x - \frac{x^2}{2} + \frac{x^3}{3} - \frac{x^4}{4} + \dots`,
    convergence: T`x \in (-1, 1]`
  },
  {
    match: (expr) => /^1\/\(1-x\)$/.test(expr.replace(/\s+/g, '')),
    name: '\\frac{1}{1-x}',
    general: T`\sum_{k=0}^{\infty} x^k = 1 + x + x^2 + x^3 + \dots`,
    convergence: T`|x| < 1`
  },
  {
    match: (expr) => /^1\/\(1\+x\)$/.test(expr.replace(/\s+/g, '')),
    name: '\\frac{1}{1+x}',
    general: T`\sum_{k=0}^{\infty} (-1)^k x^k = 1 - x + x^2 - x^3 + \dots`,
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

/**
 * Format linear binomial factor (x - x0)^k in LaTeX
 */
function formatBinomialPower(x0Nerd, k) {
  if (k === 0) return '';
  const isZero = x0Nerd === '0' || Number(x0Nerd) === 0;

  if (isZero) {
    return k === 1 ? 'x' : `x^{${k}}`;
  }

  // Check if x0 is negative
  let inner;
  const numX0 = Number(x0Nerd);
  if (!isNaN(numX0) && numX0 < 0) {
    inner = `x + ${Math.abs(numX0)}`;
  } else if (!isNaN(numX0) && numX0 > 0) {
    inner = `x - ${numX0}`;
  } else {
    inner = `x - ${x0Nerd}`;
  }

  return k === 1 ? `(${inner})` : `(${inner})^{${k}}`;
}

/**
 * Assemble coefficient and binomial into a clean LaTeX term
 */
function assembleTerm(coefObj, x0Nerd, k) {
  const coefText = coefObj.text();
  if (coefText === '0' || Number(coefText) === 0) {
    return { isZero: true, sign: '+', tex: '0' };
  }

  const binom = formatBinomialPower(x0Nerd, k);
  const isNeg = coefText.startsWith('-');
  const absCoefObj = isNeg ? nerdamer(`-(${coefText})`).evaluate() : coefObj;
  const absCoefText = absCoefObj.text();
  const absCoefTex = absCoefObj.toTeX();

  if (k === 0) {
    return {
      isZero: false,
      sign: isNeg ? '-' : '+',
      tex: absCoefTex
    };
  }

  // If abs coefficient is 1
  if (absCoefText === '1' || Number(absCoefText) === 1) {
    return {
      isZero: false,
      sign: isNeg ? '-' : '+',
      tex: binom
    };
  }

  // If coefficient is a fraction e.g. 1/6, 3/4
  if (absCoefTex.includes('\\frac')) {
    // Format as \frac{(x-x0)^k}{d} if numerator is 1
    const match = /\\frac\{1\}\{([^}]+)\}/.exec(absCoefTex);
    if (match) {
      const den = match[1];
      return {
        isZero: false,
        sign: isNeg ? '-' : '+',
        tex: T`\frac{${binom}}{${den}}`
      };
    }
  }

  // General: coef * binom
  return {
    isZero: false,
    sign: isNeg ? '-' : '+',
    tex: `${absCoefTex} ${binom}`
  };
}

/**
 * Main Taylor/Maclaurin series computation
 */
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

  let curNerd;
  try {
    curNerd = nerdamer(nerdInput);
  } catch (e) {
    return { error: `Nerdamer ifodani tahlil qila olmadi: ${e.message}` };
  }

  const isMaclaurin = x0Clean === '0' || Number(x0Clean) === 0;
  const steps = [];
  const termsList = [];

  for (let k = 0; k <= n; k++) {
    const derivTex = curNerd.toTeX();
    const factBig = factorial(k);
    const factStr = factBig.toString();

    let valObj;
    let valTex;
    try {
      valObj = nerdamer(curNerd.text()).sub('x', x0Clean).evaluate();
      valTex = valObj.toTeX();
    } catch (e) {
      valObj = nerdamer('0');
      valTex = '0';
    }

    let coefObj;
    let coefTex;
    try {
      coefObj = nerdamer(`(${valObj.text()}) / ${factStr}`).evaluate();
      coefTex = coefObj.toTeX();
    } catch (e) {
      coefObj = nerdamer('0');
      coefTex = '0';
    }

    const termData = assembleTerm(coefObj, x0Clean, k);
    if (!termData.isZero) {
      termsList.push(termData);
    }

    steps.push({
      k,
      derivTex,
      valTex,
      factStr,
      coefTex,
      termTex: termData.isZero ? '0' : (termData.sign === '-' ? '-' : '') + termData.tex
    });

    if (k < n) {
      try {
        curNerd = nerdamer.diff(curNerd, 'x');
      } catch (e) {
        break;
      }
    }
  }

  // Construct polynomial P_n(x) string
  let polyTex = '';
  if (!termsList.length) {
    polyTex = '0';
  } else {
    termsList.forEach((t, i) => {
      if (i === 0) {
        polyTex += (t.sign === '-' ? '-' : '') + t.tex;
      } else {
        polyTex += (t.sign === '-' ? ' - ' : ' + ') + t.tex;
      }
    });
  }

  // Binomial for Peano remainder
  const peanoRem = isMaclaurin ? `o(x^{${n}})` : `o((x - ${x0Clean})^{${n}})`;
  const lagrangeRem = isMaclaurin
    ? T`\frac{f^{(${n + 1})}(\xi)}{${n + 1}!} x^{${n + 1}}`
    : T`\frac{f^{(${n + 1})}(\xi)}{${n + 1}!} (x - ${x0Clean})^{${n + 1}}`;

  // Check matching standard series
  const matchedStandard = STANDARD_MACLAURIN.find((s) => isMaclaurin && s.match(rawExpr));

  return {
    isMaclaurin,
    origTex,
    x0: x0Clean,
    n,
    steps,
    polyTex,
    peanoEquation: `f(x) = ${polyTex} + ${peanoRem}`,
    lagrangeRemainder: lagrangeRem,
    matchedStandard
  };
}
