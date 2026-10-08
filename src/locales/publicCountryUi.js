const keys = ['country','local','all','origin','empty'];
const labels = {
  ko: ['자료의 작업 국가','현재 지역','전체 국가','작업 국가','선택한 국가의 자료가 없습니다. 전체 국가의 자료도 확인해 보세요.'],
  en: ['Content work country','Current region','All countries','Work country','No documents from this country. You can browse all countries.'],
  ja: ['資料の作業国','現在の地域','すべての国','作業国','この国の資料はありません。すべての国の資料を閲覧できます。'],
  de: ['Arbeitsland der Inhalte','Aktuelle Region','Alle Länder','Arbeitsland','Keine Dokumente aus diesem Land. Sie können alle Länder durchsuchen.'],
  fr: ['Pays de travail du document','Région actuelle','Tous les pays','Pays de travail','Aucun document de ce pays. Vous pouvez consulter tous les pays.'],
  it: ['Paese di lavoro del documento','Regione attuale','Tutti i paesi','Paese di lavoro','Nessun documento di questo paese. Puoi consultare tutti i paesi.'],
  es: ['País de trabajo del documento','Región actual','Todos los países','País de trabajo','No hay documentos de este país. Puedes consultar todos los países.'],
  pt: ['País de trabalho do documento','Região atual','Todos os países','País de trabalho','Não há documentos deste país. Você pode consultar todos os países.'],
  ru: ['Страна выполнения работ','Текущий регион','Все страны','Страна работ','Документов из этой страны нет. Можно посмотреть все страны.'],
  ar: ['بلد العمل في المستند','المنطقة الحالية','جميع البلدان','بلد العمل','لا توجد مستندات من هذا البلد. يمكنك استعراض جميع البلدان.'],
};
export const getPublicCountryUi = locale => Object.fromEntries(keys.map((key,i)=>[key,(labels[locale.split('-')[0]]||labels.en)[i]]));
