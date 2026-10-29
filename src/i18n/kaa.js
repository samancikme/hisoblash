export default {
  title: 'Tuwındı Esaplaǵısh',
  subtitle: 'Qálegen funktsiyanıń n-tártipli tuwındısı hám Teylor qatarı',
  themeToggle: 'Kúndizgi yamasa túngi rejimge ótiw',
  langSelect: 'Tildi tańlaw',

  tabs: {
    hosila: 'Tuwındı',
    hosilaSub: 'n-tártipli',
    taylor: 'Teylor & Makloren',
    taylorSub: 'Dárejeli qatar',
    cheatsheet: 'Formulalar kestesi',
    cheatsheetSub: 'Qádeler',
    examples: 'Mısallar',
    examplesSub: 'Ámeliy shınıǵıwlar'
  },

  taskTitle: 'n-tártipli tuwındı esaplansın',
  taskDesc: 'Funktsiyanı jazıń, tuwındı tártibi n di kiritiń. Sayt qádemlerdi hám n boyınsha ulıwma formulanı shıǵaradı.',

  taylorTaskTitle: 'Teylor hám Makloren qatarı formulası',
  taylorTaskDesc: 'Funktsiyanı x₀ noqatı átirapında Teylor (yamasa x₀ = 0 da Makloren) dárejeli qatarına ayıriń. Hár bir tuwındı hám koeffitsient qádembe-qádem shıǵarıladı.',

  formTitle: 'Funktsiya',
  placeholder: 'mısalı: (4x+7)/(2x+3)',
  taylorPlaceholder: 'mısalı: sin(x) yamasa e^x',
  ariaExpr: 'Funktsiya y(x)',
  previewAria: 'Funktsiyanıń kórinisi',
  orderLabel: 'Tuwındı tártibi n',
  centerLabel: 'Jayıw orayı x₀',
  maclaurinQuickBtn: 'Makloren (x₀ = 0)',
  btnCalc: 'Esaplaw',
  btnDecreaseN: 'n di kemeytiw',
  btnIncreaseN: 'n di arttırıw',

  helpSummary: 'Funktsiya qalay jazıladı?',
  helpMult: 'Kóbeytiw: <code>2x</code>, <code>3(x+1)</code> yamasa <code>2*x</code>',
  helpPow: 'Dáreje: <code>x^3</code>, <code>e^(3x+1)</code>, <code>5^(2x+3)</code>',
  helpFrac: 'Bólshek: <code>(4x+7)/(2x+3)</code>, <code>4/x</code>, <code>x/(2(3x+2))</code>',
  helpRoot: 'Túbir: <code>sqrt(x)</code>, <code>sqrt(e^(3x+1))</code>, <code>root(e^(7x-1), 5)</code>',
  helpFuncs: 'Funktsiyalar: <code>sin</code>, <code>cos</code>, <code>tan</code>, <code>ln</code>, <code>lg</code>, <code>exp</code>',
  helpLogPi: '<code>lg</code> onlıq logarifm, <code>ln</code> hám <code>log</code> natural logarifm. <code>pi</code> sanı π',
  helpWarning: 'Qawıslarǵa itibar beriń: <code>e^3x</code> bul (e³)·x, kórsetkishin <code>e^(3x)</code> dep jazıń. Joqarıdaǵı kórinis sizdiń ańlatpańız qalay oqılǵanın kórsetedi.',

  solutionTitle: 'Sheshim',
  emptyPrompt: 'Funktsiyanı jazıń, sheshim usı jerde payda boladı.',
  errEmptyExpr: 'Funktsiyanı durıs jazıń: ',
  errNRange: (max) => `n 1 den ${max} ge shekem pútin san bolıwı kerek.`,
  errNRangePrompt: (max) => `n di 1 den ${max} ge shekem pútin san etip kiritiń.`,

  givenFunc: 'Berilgen funktsiya',
  domain: 'Anıqlanıw tarawı: ',
  step1: '1-qádem. Funktsiyanı aǵzalarǵa ajıratamız',
  step2: '2-qádem. Dáslepki tuwındılar',
  step3: '3-qádem. Nızamlılıq',
  step3Note: 'Qosındınıń tuwındısı tuwındılar qosındısına teń, sonlıqtan hár bir aǵza bólek differentsiallanadı. Ishki sızıqlı ańlatpa ax+b hár qádemde a kóbeytiwshisin beredi.',
  constNote: 'Funktsiya turaqlı san, turaqlınıń tuwındısı nolge teń.',
  polyNote: 'Kóp aǵzalılar (xᵏ kórinisinde) tek n ≤ k bolǵanda qatnasadı, n > k bolsa olar nolge teń.',
  answer: 'Juwap',
  atN: (n) => `n = ${n} bolǵanda`,
  copyLatex: 'LaTeX nusqalaw',
  copied: 'Nusqalandı',
  copyFail: 'Nusqalap bolmadı',

  // Taylor / Maclaurin
  taylorPolyTitle: (isMaclaurin, n) => isMaclaurin ? `${n}-dárejeli Makloren kóp aǵzalısı P_${n}(x)` : `${n}-dárejeli Teylor kóp aǵzalısı P_${n}(x)`,
  peanoTitle: 'Peano qaldıqlı tolıq jayıw',
  stepsTableTitle: 'Tuwındılar hám koeffitsientler kestesi',
  standardSeriesTitle: 'Standart ulıwma Makloren qatarı',
  convergenceRange: 'Jaqınlasıw aralıǵı: ',
  thOrder: 'k',
  thDeriv: 'f⁽ᵏ⁾(x)',
  thVal: 'f⁽ᵏ⁾(x₀)',
  thFact: 'k!',
  thCoef: 'a_k = f⁽ᵏ⁾(x₀)/k!',
  thTerm: 'Aǵza',

  casNote: 'Bul funktsiyada kóbeyme, quramalı ishki funktsiya yamasa usıǵan uqsas dúzilis bar, sonlıqtan n boyınsha ulıwma formula shıǵarılmadı. Tuwındılar izbe-iz differentsiallaw arqalı esaplandı.',
  casMaxWarn: (max) => `Bunday funktsiya ushın n ${max} ten aspawı kerek. n di kemeytiń.`,
  casFail: 'Tuwındını esaplap bolmadı. Funktsiyanı ápiwayıraq jazıp kóriń.',
  casTooLong: 'Nátije júdá uzın bolıp ketti. n di kemeytiń yamasa funktsiyanı ápiwayılastırıń.',
  derivatives: 'Tuwındılar',

  keys: {
    power: 'dáreje',
    sub: 'alıw',
    mul: 'kóbeytiw',
    div: 'bóliw',
    ln: 'natural logarifm',
    lg: 'onlıq logarifm',
    sqrt: 'kvadrat túbir',
    exp: 'e ning dárejesi',
    pi: 'pi sanı',
    back: 'Aqırǵı belgini óshiriw',
    clear: 'Barlıǵın tazalaw'
  },

  footer: `Nókis Mámleketlik Texnika Universiteti, Jasama intellekt kafedrası, Jasama intellekt qánigeligi, 111-26 JI toparı studenti Farxatov Samandar tárepinen islep shıǵıldı. Qáte hám kemshilikler bolsa t.me/@samancikme`
};
