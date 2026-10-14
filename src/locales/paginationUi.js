const copy = {
  ko: ['페이지 선택', '첫 페이지', '이전 페이지 묶음', '다음 페이지 묶음', '마지막 페이지', '{page}페이지'],
  en: ['Pagination', 'First page', 'Previous page group', 'Next page group', 'Last page', 'Page {page}'],
  ja: ['ページ選択', '最初のページ', '前のページグループ', '次のページグループ', '最後のページ', '{page}ページ'],
  de: ['Seitenauswahl', 'Erste Seite', 'Vorherige Seitengruppe', 'Nächste Seitengruppe', 'Letzte Seite', 'Seite {page}'],
  fr: ['Pagination', 'Première page', 'Groupe précédent', 'Groupe suivant', 'Dernière page', 'Page {page}'],
  es: ['Paginación', 'Primera página', 'Grupo anterior', 'Grupo siguiente', 'Última página', 'Página {page}'],
  it: ['Paginazione', 'Prima pagina', 'Gruppo precedente', 'Gruppo successivo', 'Ultima pagina', 'Pagina {page}'],
  pt: ['Paginação', 'Primeira página', 'Grupo anterior', 'Próximo grupo', 'Última página', 'Página {page}'],
  ru: ['Выбор страницы', 'Первая страница', 'Предыдущая группа страниц', 'Следующая группа страниц', 'Последняя страница', 'Страница {page}'],
  ar: ['اختيار الصفحة', 'الصفحة الأولى', 'مجموعة الصفحات السابقة', 'مجموعة الصفحات التالية', 'الصفحة الأخيرة', 'الصفحة {page}'],
};
export function getPaginationUi(locale = 'en') {
  const values = copy[locale.split('-')[0]] || copy.en;
  return Object.fromEntries(['label', 'first', 'previous', 'next', 'last', 'page'].map((key, i) => [key, values[i]]));
}
