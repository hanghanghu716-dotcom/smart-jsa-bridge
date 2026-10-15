// Search metadata only: these terms do not assess a risk or prescribe controls.
const categories = ['사고(추락)', '사고(감전)', '사고(질식)', '준비(에너지차단)', '용접흄', '왕복동/끼임위험'];
const vocabulary = {
  ro: ['cădere de la înălțime', 'electrocutare|șoc electric', 'asfixiere|deficit de oxigen', 'izolarea energiei|blocarea energiei', 'fum de sudură|fumuri de sudură', 'prindere|strivire'],
  ko: ['추락|떨어짐', '감전', '질식|산소결핍', '에너지 차단|잠금장치', '용접 흄|용접흄', '끼임|협착'],
  en: ['fall from height|falling from height', 'electric shock|electrocution', 'asphyxiation|oxygen deficiency', 'lockout|tagout|energy isolation', 'welding fumes|welding fume', 'entanglement|pinch point|crushing'],
  fr: ['chute de hauteur', 'électrocution|choc électrique', 'asphyxie|manque d’oxygène', 'consignation|cadenassage', 'fumées de soudage', 'coincement|écrasement'],
  de: ['Absturz', 'Stromschlag', 'Erstickung|Sauerstoffmangel', 'Energieisolierung|Wiedereinschalten sichern', 'Schweißrauch', 'Quetschung|Einziehen'],
  ja: ['墜落|転落', '感電', '窒息|酸素欠乏', 'エネルギー遮断|ロックアウト', '溶接ヒューム', '挟まれ|巻き込まれ'],
  it: ['caduta dall’alto|caduta dall\'alto', 'folgorazione|scossa elettrica', 'asfissia|carenza di ossigeno', 'isolamento delle energie|blocco delle energie', 'fumi di saldatura', 'schiacciamento|intrappolamento'],
  es: ['caída de altura', 'electrocución|descarga eléctrica', 'asfixia|deficiencia de oxígeno', 'consignación|bloqueo de energías', 'humos de soldadura', 'atrapamiento|aplastamiento'],
  ar: ['السقوط من ارتفاع', 'الصعق الكهربائي', 'الاختناق|نقص الأكسجين', 'عزل الطاقة|القفل ووضع العلامات', 'أبخرة اللحام', 'الانحشار|السحق'],
  pt: ['queda de altura', 'choque elétrico|eletrocussão', 'asfixia|deficiência de oxigênio', 'bloqueio de energias|isolamento de energia', 'fumos de soldagem', 'aprisionamento|esmagamento'],
  ru: ['падение с высоты', 'поражение электрическим током', 'удушье|недостаток кислорода', 'изоляция энергии|блокировка энергии', 'сварочный аэрозоль|сварочные аэрозоли', 'защемление|затягивание'],
};
export function localizedTagTerms(locale) {
  return Object.fromEntries(categories.map((tag, i) => [tag, (vocabulary[String(locale).split('-')[0]]?.[i] || '').split('|').filter(Boolean)]));
}
