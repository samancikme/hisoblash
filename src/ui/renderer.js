import katex from 'katex';
import 'katex/dist/katex.min.css';

export function renderMath(el, tex, display = true) {
  if (!el) return;
  el.dataset.tex = tex;
  el.dataset.disp = display ? '1' : '';

  try {
    katex.render(tex, el, {
      displayMode: !!display,
      throwOnError: false,
      output: 'htmlAndMathml',
      strict: false
    });
    el.classList.remove('raw');
  } catch (err) {
    el.textContent = tex;
    el.classList.add('raw');
  }
}

export function isMathValid(tex) {
  try {
    const html = katex.renderToString(tex, {
      throwOnError: true,
      strict: false
    });
    return !!html;
  } catch (e) {
    return false;
  }
}
