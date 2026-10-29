import { parse } from './parser.js';
import { toTex, toNerd, evalAst } from './ast.js';
import { decompose } from './decompose.js';
import { buildFormula } from './formula.js';
import { nthDiff, diffAst, casDerivs, simp } from './diff.js';
import { ParseError } from './tokens.js';

export const LIMITS = {
  nMax: 30,
  casMax: 8
};

export function analyze(src) {
  let ast;
  try {
    ast = parse(src);
  } catch (e) {
    if (e && e.isParseError) return { error: e.message, code: e.code };
    throw e;
  }

  const terms = decompose(ast);
  const out = {
    ast,
    tex: 'y=' + toTex(ast),
    nerd: toNerd(ast),
    terms,
    formula: null
  };

  if (terms) {
    out.formula = buildFormula(terms);
  }

  return out;
}

export {
  parse,
  toTex,
  toNerd,
  evalAst,
  decompose,
  buildFormula,
  nthDiff,
  diffAst,
  casDerivs,
  simp,
  ParseError
};
