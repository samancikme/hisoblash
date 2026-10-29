import uz from './uz.js';
import kaa from './kaa.js';
import ru from './ru.js';

export const LANGUAGES = {
  uz: { name: "O'zbekcha", flag: '🇺🇿', strings: uz },
  kaa: { name: 'Qaraqalpaqsha', flag: '🟦', strings: kaa },
  ru: { name: 'Русский', flag: '🇷🇺', strings: ru }
};

const STORAGE_KEY = 'hosila-lang';
let currentLang = 'kaa'; // Default or from storage (let's check storage, or fallback)

export function initI18n() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LANGUAGES[saved]) {
      currentLang = saved;
    } else {
      // Default to Uzbek or Karakalpak
      currentLang = 'uz';
    }
  } catch (e) {
    currentLang = 'uz';
  }
  return currentLang;
}

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  if (!LANGUAGES[lang]) return;
  currentLang = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch (e) {}
  document.documentElement.lang = lang === 'kaa' ? 'kaa' : lang;
  window.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
}

export function t(key, ...args) {
  const dict = LANGUAGES[currentLang]?.strings || uz;
  const parts = key.split('.');
  let val = dict;
  for (const p of parts) {
    val = val?.[p];
    if (val === undefined) break;
  }
  if (typeof val === 'function') {
    return val(...args);
  }
  if (val !== undefined) return val;

  // Fallback to uz
  let fb = uz;
  for (const p of parts) {
    fb = fb?.[p];
    if (fb === undefined) break;
  }
  if (typeof fb === 'function') return fb(...args);
  return fb || key;
}
