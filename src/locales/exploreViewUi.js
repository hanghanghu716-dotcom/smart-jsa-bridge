const keys = ['view', 'large', 'small', 'details', 'perPage', 'title', 'date', 'actions'];
const labels = {
  ko: ['보기 방식', '큰 카드', '작은 카드', '자세히 보기', '페이지당 {count}개', '자료명', '등록일', '작업'],
  en: ['View', 'Large cards', 'Small cards', 'Details', '{count} per page', 'Document', 'Published', 'Actions'],
  de: ['Ansicht', 'Große Karten', 'Kleine Karten', 'Details', '{count} pro Seite', 'Dokument', 'Veröffentlicht', 'Aktionen'],
  ja: ['表示形式', '大きいカード', '小さいカード', '詳細', '1ページに{count}件', '資料名', '公開日', '操作'],
  fr: ['Affichage', 'Grandes cartes', 'Petites cartes', 'Détails', '{count} par page', 'Document', 'Publication', 'Actions'],
  it: ['Visualizzazione', 'Schede grandi', 'Schede piccole', 'Dettagli', '{count} per pagina', 'Documento', 'Pubblicazione', 'Azioni'],
  es: ['Vista', 'Tarjetas grandes', 'Tarjetas pequeñas', 'Detalles', '{count} por página', 'Documento', 'Publicación', 'Acciones'],
  ar: ['طريقة العرض', 'بطاقات كبيرة', 'بطاقات صغيرة', 'تفاصيل', '{count} في الصفحة', 'المستند', 'تاريخ النشر', 'الإجراءات'],
  pt: ['Visualização', 'Cartões grandes', 'Cartões pequenos', 'Detalhes', '{count} por página', 'Documento', 'Publicação', 'Ações'],
  ru: ['Вид', 'Крупные карточки', 'Мелкие карточки', 'Подробности', '{count} на странице', 'Документ', 'Дата публикации', 'Действия'],
  ro: ['Afișare', 'Carduri mari', 'Carduri mici', 'Detalii', '{count} pe pagină', 'Document', 'Publicat', 'Acțiuni'],
};
export function getExploreViewUi(locale = 'en-US') {
  const values = labels[locale.split('-')[0]] || labels.en;
  return Object.fromEntries(keys.map((key, index) => [key, values[index]]));
}
