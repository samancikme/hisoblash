import { renderMath } from './renderer.js';

export const EXAMPLES = [
  {
    expr: '(4x+7)/(2x+3)',
    n: 5,
    title: {
      uz: 'Kasrli-chiziqli ifoda',
      kaa: 'Bólshek-sızıqlı ańlatpa',
      ru: 'Дробно-линейное выражение'
    }
  },
  {
    expr: 'sin(2x)+cos(x+1)',
    n: 4,
    title: {
      uz: 'Trigonometrik yig‘indi',
      kaa: 'Trigonometriyalıq qosındı',
      ru: 'Тригонометрическая сумма'
    }
  },
  {
    expr: 'e^(3x+1)+2x^4',
    n: 3,
    title: {
      uz: 'Ko‘rsatkichli va ko‘phad',
      kaa: 'Kórsetkishli hám kóp aǵzalı',
      ru: 'Показательная и многочлен'
    }
  },
  {
    expr: 'ln(2x+5)',
    n: 4,
    title: {
      uz: 'Logarifmik funksiya',
      kaa: 'Logarifmlik funktsiya',
      ru: 'Логарифмическая функция'
    }
  },
  {
    expr: 'sqrt(4x+1)',
    n: 3,
    title: {
      uz: 'Ildizli ifoda',
      kaa: 'Túbirli ańlatpa',
      ru: 'Иррациональное выражение'
    }
  },
  {
    expr: 'x^2*sin(x)',
    n: 3,
    title: {
      uz: 'Ko‘paytma (Ketma-ket differensiallash)',
      kaa: 'Kóbeyme (Izbe-iz differentsiallaw)',
      ru: 'Произведение (последовательное дифференцирование)'
    }
  }
];

export function renderExamples(container, onSelect, currentLang = 'uz') {
  if (!container) return;
  container.innerHTML = '';

  const grid = document.createElement('div');
  grid.className = 'examples-grid';

  EXAMPLES.forEach((ex) => {
    const card = document.createElement('div');
    card.className = 'card raised-sm example-card';

    const h4 = document.createElement('h4');
    h4.textContent = ex.title[currentLang] || ex.title.uz;
    card.appendChild(h4);

    const m = document.createElement('div');
    m.className = 'math';
    renderMath(m, `y = ${ex.expr},\\quad n = ${ex.n}`, false);
    card.appendChild(m);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn primary example-btn';
    btn.textContent = currentLang === 'kaa' ? 'Esaplawǵa qoyıw' : currentLang === 'ru' ? 'Рассчитать' : 'Yuklash va hisoblash';
    btn.addEventListener('click', () => {
      onSelect(ex);
    });
    card.appendChild(btn);

    grid.appendChild(card);
  });

  container.appendChild(grid);
}
