// Shared interface labels; regional variants use their base language.
const keys = ['caseSearch', 'caseEmpty', 'sectorGuides', 'loadError', 'retry', 'googlePrivacy', 'adSettings'];
const translations = {
  en: ['Search case studies…', 'No matching case studies.', 'Sector guides (50)', 'Unable to load data. Please try again.', 'Retry', 'How Google uses data', 'Google ad personalization settings'],
  ko: ['사례 제목 또는 내용 검색…', '검색 조건과 일치하는 사례가 없습니다.', '분야별 가이드 (50종)', '데이터를 불러오지 못했습니다. 다시 시도해 주세요.', '다시 시도', 'Google의 데이터 사용 방식', 'Google 광고 개인 최적화 설정'],
  fr: ['Rechercher des études de cas…', 'Aucune étude de cas correspondante.', 'Guides sectoriels (50)', 'Impossible de charger les données. Réessayez.', 'Réessayer', 'Utilisation des données par Google', 'Personnalisation des annonces Google'],
  de: ['Fallstudien suchen…', 'Keine passenden Fallstudien.', 'Branchenleitfäden (50)', 'Daten konnten nicht geladen werden. Bitte erneut versuchen.', 'Erneut versuchen', 'Datennutzung durch Google', 'Personalisierung von Google-Anzeigen'],
  ja: ['事例を検索…', '該当する事例はありません。', '分野別ガイド（50種）', 'データを読み込めませんでした。再試行してください。', '再試行', 'Google によるデータの使用', 'Google 広告のカスタマイズ設定'],
  it: ['Cerca casi di studio…', 'Nessun caso di studio corrispondente.', 'Guide di settore (50)', 'Impossibile caricare i dati. Riprova.', 'Riprova', 'Come Google utilizza i dati', 'Personalizzazione degli annunci Google'],
  es: ['Buscar casos prácticos…', 'No hay casos prácticos coincidentes.', 'Guías sectoriales (50)', 'No se pudieron cargar los datos. Inténtelo de nuevo.', 'Reintentar', 'Cómo utiliza Google los datos', 'Personalización de anuncios de Google'],
  ar: ['البحث في دراسات الحالة…', 'لا توجد دراسات حالة مطابقة.', 'أدلة القطاعات (50)', 'تعذر تحميل البيانات. يرجى المحاولة مرة أخرى.', 'إعادة المحاولة', 'كيفية استخدام Google للبيانات', 'إعدادات تخصيص إعلانات Google'],
  pt: ['Pesquisar estudos de caso…', 'Nenhum estudo de caso correspondente.', 'Guias setoriais (50)', 'Não foi possível carregar os dados. Tente novamente.', 'Tentar novamente', 'Como o Google usa os dados', 'Personalização de anúncios do Google'],
  ru: ['Поиск примеров…', 'Подходящие примеры не найдены.', 'Отраслевые руководства (50)', 'Не удалось загрузить данные. Повторите попытку.', 'Повторить', 'Как Google использует данные', 'Персонализация рекламы Google'],
};
export function getSiteUi(locale = 'en-US') {
  const values = translations[locale.split('-')[0]] || translations.en;
  return Object.fromEntries(keys.map((key, index) => [key, values[index]]));
}
