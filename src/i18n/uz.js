export default {
  title: 'Hosila Hisoblagich',
  subtitle: 'Istalgan funksiyaning n-tartibli hosilasi va Teylor qatori',
  themeToggle: 'Kunduzgi yoki tungi rejimni almashtirish',
  langSelect: 'Tilni tanlash',

  tabs: {
    hosila: 'Hosila',
    hosilaSub: 'n-tartibli',
    taylor: 'Teylor & Makloren',
    taylorSub: 'Darajali qator',
    cheatsheet: 'Formulalar jadvali',
    cheatsheetSub: 'Qoidalar',
    examples: 'Namunalar',
    examplesSub: 'Amaliy misollar'
  },

  taskTitle: 'n-tartibli hosila hisoblansin',
  taskDesc: 'Funksiyani yozing, hosila tartibi n ni kiriting. Sayt qadamlarni va n bo‘yicha umumiy formulani chiqaradi.',

  taylorTaskTitle: 'Teylor va Makloren qatori formulasi',
  taylorTaskDesc: 'Funksiyani x₀ nuqta atrofida Teylor (yoki x₀ = 0 da Makloren) darajali qatoriga yoying. Har bir hosila va koeffitsiyent qadamma-qadam chiqariladi.',

  formTitle: 'Funksiya',
  placeholder: 'masalan: (4x+7)/(2x+3)',
  taylorPlaceholder: 'masalan: sin(x) yoki e^x',
  ariaExpr: 'Funksiya y(x)',
  previewAria: 'Funksiya ko‘rinishi',
  orderLabel: 'Hosila tartibi n',
  centerLabel: 'Yoyilma markazi x₀',
  maclaurinQuickBtn: 'Makloren (x₀ = 0)',
  btnCalc: 'Hisoblash',
  btnDecreaseN: 'n ni kamaytirish',
  btnIncreaseN: 'n ni oshirish',

  helpSummary: 'Funksiya qanday yoziladi?',
  helpMult: 'Ko‘paytirish: <code>2x</code>, <code>3(x+1)</code> yoki <code>2*x</code>',
  helpPow: 'Daraja: <code>x^3</code>, <code>e^(3x+1)</code>, <code>5^(2x+3)</code>',
  helpFrac: 'Kasr: <code>(4x+7)/(2x+3)</code>, <code>4/x</code>, <code>x/(2(3x+2))</code>',
  helpRoot: 'Ildiz: <code>sqrt(x)</code>, <code>sqrt(e^(3x+1))</code>, <code>root(e^(7x-1), 5)</code>',
  helpFuncs: 'Funksiyalar: <code>sin</code>, <code>cos</code>, <code>tan</code>, <code>ln</code>, <code>lg</code>, <code>exp</code>',
  helpLogPi: '<code>lg</code> o‘nli logarifm, <code>ln</code> va <code>log</code> natural logarifm. <code>pi</code> son π',
  helpWarning: 'Qavslarga ehtiyot bo‘ling: <code>e^3x</code> bu (e³)·x, ko‘rsatkichni <code>e^(3x)</code> deb yozing. Yuqoridagi ko‘rinish sizning ifodangiz qanday o‘qilganini ko‘rsatadi.',

  solutionTitle: 'Yechim',
  emptyPrompt: 'Funksiyani yozing, yechim shu yerda paydo bo‘ladi.',
  errEmptyExpr: 'Funksiyani to‘g‘ri yozing: ',
  errNRange: (max) => `n 1 dan ${max} gacha butun son bo‘lishi kerak.`,
  errNRangePrompt: (max) => `n ni 1 dan ${max} gacha butun son qilib kiriting.`,

  givenFunc: 'Berilgan funksiya',
  domain: 'Aniqlanish sohasi: ',
  step1: '1-qadam. Funksiyani hadlarga ajratamiz',
  step2: '2-qadam. Birinchi hosilalar',
  step3: '3-qadam. Qonuniyat',
  step3Note: 'Yig‘indining hosilasi hosilalar yig‘indisiga teng, shuning uchun har bir had alohida differensiallanadi. Ichki chiziqli ifoda ax+b har qadamda a ko‘paytuvchi beradi.',
  constNote: 'Funksiya o‘zgarmas son, o‘zgarmasning hosilasi nolga teng.',
  polyNote: 'Ko‘phad hadlari (xᵏ ko‘rinishida) faqat n ≤ k bo‘lganda qatnashadi, n > k bo‘lsa ular nolga teng.',
  answer: 'Javob',
  atN: (n) => `n = ${n} bo‘lganda`,
  copyLatex: 'LaTeX nusxalash',
  copied: 'Nusxalandi',
  copyFail: 'Nusxalab bo‘lmadi',

  // Taylor / Maclaurin
  taylorPolyTitle: (isMaclaurin, n) => isMaclaurin ? `${n}-darajali Makloren ko‘phadi P_${n}(x)` : `${n}-darajali Teylor ko‘phadi P_${n}(x)`,
  peanoTitle: 'Peano qoldiqli to‘liq yoyilma',
  stepsTableTitle: 'Hosilalar va koeffitsiyentlar jadvali',
  standardSeriesTitle: 'Standart umumiy Makloren qatori',
  convergenceRange: 'Yaqinlashish oralig‘i: ',
  thOrder: 'k',
  thDeriv: 'f⁽ᵏ⁾(x)',
  thVal: 'f⁽ᵏ⁾(x₀)',
  thFact: 'k!',
  thCoef: 'a_k = f⁽ᵏ⁾(x₀)/k!',
  thTerm: 'Had',

  casNote: 'Bu funksiyada ko‘paytma, murakkab ichki funksiya yoki shunga o‘xshash tuzilma bor, shuning uchun n bo‘yicha umumiy formula chiqarilmadi. Hosilalar ketma-ket differensiallash bilan hisoblandi.',
  casMaxWarn: (max) => `Bunday funksiya uchun n ${max} dan oshmasligi kerak. n ni kamaytiring.`,
  casFail: 'Hosilani hisoblab bo‘lmadi. Funksiyani soddaroq yozib ko‘ring.',
  casTooLong: 'Natija juda uzun bo‘lib ketdi. n ni kamaytiring yoki funksiyani soddalashtiring.',
  derivatives: 'Hosilalar',

  keys: {
    power: 'daraja',
    sub: 'ayirish',
    mul: 'ko‘paytirish',
    div: 'bo‘lish',
    ln: 'natural logarifm',
    lg: 'o‘nli logarifm',
    sqrt: 'kvadrat ildiz',
    exp: 'e ning darajasi',
    pi: 'pi soni',
    back: 'Oxirgi belgini o‘chirish',
    clear: 'Hammasini tozalash'
  },

  footer: `Nukus Davlat Texnika Universiteti, Sun'iy intellekt kafedrasi, Sun'iy intellekt yo'nalishi, 111-26 SI o'zbek guruhi talabasi Farxatov Samandar tomonidan ishlab chiqildi. Xato va kamchiliklar bo'lsa t.me/@samancikme`
};
