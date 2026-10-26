const labels={
  "ko": "전체 메뉴",
  "en": "All pages",
  "ja": "すべてのページ",
  "de": "Alle Seiten",
  "fr": "Toutes les pages",
  "it": "Tutte le pagine",
  "es": "Todas las páginas",
  "pt": "Todas as páginas",
  "ru": "Все страницы",
  "ar": "جميع الصفحات",
  "ro": "Toate paginile"
};
export const allPagesLabel = locale => labels[locale?.split("-")[0]] || labels.en;
