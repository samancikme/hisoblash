import { F, ONE } from './fraction.js';
import { tokenize, ParseError, FUNCS } from './tokens.js';

export function mkFn(name, arg) {
  if (name === 'sqrt') return { t: 'pow', a: arg, b: { t: 'num', v: F(1, 2) } };
  if (name === 'cbrt') return { t: 'pow', a: arg, b: { t: 'num', v: F(1, 3) } };
  if (name === 'log') name = 'ln';
  if (name === 'log10') name = 'lg';
  if (name === 'asin') name = 'arcsin';
  if (name === 'acos') name = 'arccos';
  if (name === 'atan') name = 'arctan';
  return { t: 'fn', name, a: arg };
}

export function parse(src) {
  const toks = tokenize(src);
  if (!toks.length) throw new ParseError('Funksiyani kiriting.');
  let i = 0;

  function peek() {
    return toks[i];
  }

  function isFnName(t) {
    return t && t.t === 'id' && FUNCS.includes(t.name);
  }

  function startsFactor(t) {
    return t && (t.t === 'num' || t.t === 'lp' || t.t === 'id');
  }

  function expectRp() {
    if (!peek() || peek().t !== 'rp') {
      throw new ParseError('Qavslar juft emas: yopuvchi «)» yetishmayapti.');
    }
    i++;
  }

  function expr() {
    let l = term();
    while (peek() && peek().t === 'op' && (peek().c === '+' || peek().c === '-')) {
      const c = toks[i++].c;
      l = { t: c === '+' ? 'add' : 'sub', a: l, b: term() };
    }
    return l;
  }

  function term() {
    let l = unary();
    while (true) {
      const t = peek();
      if (t && t.t === 'op' && (t.c === '*' || t.c === '/')) {
        i++;
        l = { t: t.c === '*' ? 'mul' : 'div', a: l, b: unary() };
      } else if (startsFactor(t)) {
        // Implicit multiplication: 2x, 3(x+1), etc.
        l = { t: 'mul', a: l, b: unary() };
      } else {
        break;
      }
    }
    return l;
  }

  function unary() {
    const t = peek();
    if (t && t.t === 'op' && t.c === '-') {
      i++;
      return { t: 'neg', a: unary() };
    }
    if (t && t.t === 'op' && t.c === '+') {
      i++;
      return unary();
    }
    return power();
  }

  function power() {
    const b = atom();
    const t = peek();
    if (t && t.t === 'op' && t.c === '^') {
      i++;
      return { t: 'pow', a: b, b: expUnary() };
    }
    return b;
  }

  function expUnary() {
    const t = peek();
    if (t && t.t === 'op' && t.c === '-') {
      i++;
      return { t: 'neg', a: expUnary() };
    }
    if (t && t.t === 'op' && t.c === '+') {
      i++;
      return expUnary();
    }
    return power();
  }

  function juxt() {
    let l = power();
    while (true) {
      const t = peek();
      if (t && (t.t === 'num' || t.t === 'lp' || (t.t === 'id' && !isFnName(t)))) {
        l = { t: 'mul', a: l, b: power() };
      } else {
        break;
      }
    }
    return l;
  }

  function atom() {
    const t = toks[i++];
    if (!t) throw new ParseError('Ifoda tugallanmagan, davomi yetishmayapti.');
    if (t.t === 'num') return { t: 'num', v: t.v };
    if (t.t === 'lp') {
      if (peek() && peek().t === 'rp') throw new ParseError('Bo‘sh qavs «()» bo‘lishi mumkin emas.');
      const e = expr();
      expectRp();
      return e;
    }
    if (t.t === 'id') {
      if (t.name === 'x') return { t: 'x' };
      if (t.name === 'e') return { t: 'e' };
      if (t.name === 'pi') return { t: 'pi' };
      if (t.name === 'root') {
        if (!peek() || peek().t !== 'lp') throw new ParseError('root(ifoda, n) ko‘rinishida yozing.');
        i++;
        const u = expr();
        if (!peek() || peek().t !== 'comma') throw new ParseError('root(ifoda, n) ko‘rinishida yozing.');
        i++;
        const nn = expr();
        expectRp();
        return { t: 'pow', a: u, b: { t: 'div', a: { t: 'num', v: ONE }, b: nn } };
      }
      let arg;
      if (peek() && peek().t === 'lp') {
        i++;
        arg = expr();
        expectRp();
      } else {
        if (!startsFactor(peek()) || isFnName(peek())) {
          throw new ParseError(`«${t.name}» dan keyin argument yozing, masalan ${t.name}(x).`);
        }
        arg = juxt();
      }
      return mkFn(t.name, arg);
    }
    if (t.t === 'rp') throw new ParseError('Qavslar juft emas: ortiqcha «)».');
    if (t.t === 'op') throw new ParseError(`«${t.c}» belgisidan oldin yoki keyin qiymat yetishmayapti.`);
    throw new ParseError('Ifodani o‘qib bo‘lmadi.');
  }

  const ast = expr();
  if (i < toks.length) {
    const t = toks[i];
    if (t.t === 'rp') throw new ParseError('Qavslar juft emas: ortiqcha «)».');
    throw new ParseError('Ifodaning davomini o‘qib bo‘lmadi.');
  }
  return ast;
}
