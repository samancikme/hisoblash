import { renderMath } from './renderer.js';

export const FORMULA_RULES = [
  {
    title: { uz: 'Darajali funksiya', kaa: 'Dárejeli funktsiya', ru: 'Степенная функция' },
    formula: String.raw`(x^m)^{(n)} = \frac{m!}{(m-n)!}\, x^{m-n} \quad (n \le m), \qquad (x^m)^{(n)} = 0 \quad (n > m)`
  },
  {
    title: { uz: 'Kasrli-chiziqli funksiya', kaa: 'Bólshek-sızıqlı funktsiya', ru: 'Дробно-линейная функция' },
    formula: String.raw`\left(\frac{1}{ax+b}\right)^{(n)} = \frac{(-1)^n n!\, a^n}{(ax+b)^{n+1}}`
  },
  {
    title: { uz: 'Ko‘rsatkichli funksiya', kaa: 'Kórsetkishli funktsiya', ru: 'Показательная функция' },
    formula: String.raw`(e^{ax+b})^{(n)} = a^n e^{ax+b}, \qquad (B^{kx+m})^{(n)} = (k\ln B)^n B^{kx+m}`
  },
  {
    title: { uz: 'Logarifmik funksiya', kaa: 'Logarifmlik funktsiya', ru: 'Логарифмическая функция' },
    formula: String.raw`(\ln(ax+b))^{(n)} = \frac{(-1)^{n-1} (n-1)!\, a^n}{(ax+b)^n}`
  },
  {
    title: { uz: 'Sinus funksiyasi', kaa: 'Sinus funktsiyası', ru: 'Функция синуса' },
    formula: String.raw`(\sin(ax+b))^{(n)} = a^n \sin\left(ax+b + \frac{n\pi}{2}\right)`
  },
  {
    title: { uz: 'Kosinus funksiyasi', kaa: 'Kosinus funktsiyası', ru: 'Функция косинуса' },
    formula: String.raw`(\cos(ax+b))^{(n)} = a^n \cos\left(ax+b + \frac{n\pi}{2}\right)`
  },
  {
    title: { uz: 'Leybnis formulasi (ko‘paytma)', kaa: 'Leybnis formulası (kóbeyme)', ru: 'Формула Лейбница (произведение)' },
    formula: String.raw`(u \cdot v)^{(n)} = \sum_{k=0}^{n} C_n^k\, u^{(n-k)} v^{(k)} = \sum_{k=0}^{n} \frac{n!}{k!(n-k)!}\, u^{(n-k)} v^{(k)}`
  }
];

export function renderCheatSheet(container, currentLang = 'uz') {
  if (!container) return;
  container.innerHTML = '';

  const list = document.createElement('div');
  list.className = 'cheatsheet-grid';

  FORMULA_RULES.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'card raised formula-card';

    const h4 = document.createElement('h4');
    h4.textContent = `${idx + 1}. ${item.title[currentLang] || item.title.uz}`;
    card.appendChild(h4);

    const mathBox = document.createElement('div');
    mathBox.className = 'math';
    renderMath(mathBox, item.formula, true);
    card.appendChild(mathBox);

    list.appendChild(card);
  });

  container.appendChild(list);
}
