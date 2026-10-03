import { phase6Language } from './phase6Ui.js';
const values = {
  "ko": {
    "intro": "위험요인별로 연결된 현재 안전대책과 추가 안전대책을 모아 살펴보는 사전입니다. 공종이나 키워드로 찾고, 각 대책의 적용 가능성을 비교해 보세요.",
    "howTo": "작업 조건에 맞는 위험요인을 찾은 뒤 현재 조치와 추가로 필요한 조치를 함께 확인하세요. 각 대책은 현장 조건을 검토한 후 적용해야 합니다.",
    "count": "위험요인 {{count}}개",
    "groupHint": "검색어가 포함된 위험요인을 찾고, 그 위험요인에 연결된 대책 전체를 함께 보여줍니다.",
    "missingMeasure": "현재 안전대책 내용 미등록",
    "missingSolutions": "연결된 추가 안전대책이 등록되어 있지 않습니다.",
    "guide": "위험성평가 작성 가이드",
    "cases": "현장 사례 찾아보기",
    "reference": "참고 자료이며 현장별 평가와 검토를 대신하지 않습니다.",
    "pageLabel": "위험요인 사전 페이지"
  },
  "en": {
    "intro": "Browse hazards with their linked current and additional controls. Find a category or keyword and compare the applicability of each control.",
    "howTo": "Find a hazard that matches your work conditions, then review existing controls and additional actions together. Check site conditions before applying any control.",
    "count": "{{count}} hazards",
    "groupHint": "Search finds matching hazards and displays all controls linked to each one.",
    "missingMeasure": "Current control not provided",
    "missingSolutions": "No linked additional controls have been provided.",
    "guide": "Assessment guide",
    "cases": "Browse case studies",
    "reference": "Reference material; it does not replace a site-specific assessment and review.",
    "pageLabel": "Hazard dictionary pages"
  },
  "ja": {
    "intro": "危険要因ごとに現在の対策と追加対策をまとめた事典です。工種やキーワードで検索し、適用できる対策を比較できます。",
    "howTo": "作業条件に合う危険要因を探し、現在の対策と追加措置を確認してください。適用前に現場条件を確認してください。",
    "count": "危険要因 {{count}}件",
    "groupHint": "検索に一致した危険要因に関連する対策をすべて表示します。",
    "missingMeasure": "現在の対策は未登録",
    "missingSolutions": "関連する追加対策は未登録です。",
    "guide": "評価作成ガイド",
    "cases": "現場事例を探す",
    "reference": "参考資料であり、現場ごとの評価や検討を代替しません。",
    "pageLabel": "危険要因事典のページ"
  },
  "de": {
    "intro": "Gefahren mit bestehenden und zusätzlichen Maßnahmen durchsuchen. Nach Kategorie oder Stichwort suchen und die Anwendbarkeit vergleichen.",
    "howTo": "Passende Gefahren suchen und bestehende sowie zusätzliche Maßnahmen gemeinsam prüfen. Vor der Anwendung die Bedingungen vor Ort bewerten.",
    "count": "{{count}} Gefahren",
    "groupHint": "Die Suche zeigt passende Gefahren mit allen zugehörigen Maßnahmen.",
    "missingMeasure": "Bestehende Maßnahme nicht angegeben",
    "missingSolutions": "Keine zusätzlichen Maßnahmen hinterlegt.",
    "guide": "Leitfaden zur Beurteilung",
    "cases": "Fallstudien durchsuchen",
    "reference": "Referenzmaterial; ersetzt keine standortspezifische Beurteilung und Prüfung.",
    "pageLabel": "Seiten des Gefahrenverzeichnisses"
  },
  "fr": {
    "intro": "Consultez les dangers avec leurs mesures actuelles et complémentaires. Recherchez une catégorie ou un mot-clé et comparez leur applicabilité.",
    "howTo": "Trouvez un danger correspondant au travail, puis examinez les mesures existantes et complémentaires. Vérifiez les conditions du site avant toute application.",
    "count": "{{count}} dangers",
    "groupHint": "La recherche affiche les dangers correspondants avec toutes leurs mesures associées.",
    "missingMeasure": "Mesure actuelle non renseignée",
    "missingSolutions": "Aucune mesure complémentaire associée n’est renseignée.",
    "guide": "Guide d’évaluation",
    "cases": "Parcourir les études de cas",
    "reference": "Document de référence ; ne remplace pas une évaluation et une vérification propres au site.",
    "pageLabel": "Pages du dictionnaire des dangers"
  },
  "es": {
    "intro": "Consulta los peligros con sus medidas actuales y adicionales. Busca por categoría o palabra clave y compara su aplicabilidad.",
    "howTo": "Busca un peligro acorde al trabajo y revisa las medidas existentes y adicionales. Comprueba las condiciones del lugar antes de aplicarlas.",
    "count": "{{count}} peligros",
    "groupHint": "La búsqueda muestra los peligros coincidentes y todas sus medidas vinculadas.",
    "missingMeasure": "Medida actual no registrada",
    "missingSolutions": "No se han registrado medidas adicionales vinculadas.",
    "guide": "Guía de evaluación",
    "cases": "Explorar casos",
    "reference": "Material de referencia; no sustituye la evaluación y revisión específicas del lugar.",
    "pageLabel": "Páginas del diccionario de peligros"
  },
  "it": {
    "intro": "Consulta i pericoli con le misure attuali e aggiuntive. Cerca per categoria o parola chiave e confronta la loro applicabilità.",
    "howTo": "Trova un pericolo adatto al lavoro e valuta insieme le misure esistenti e aggiuntive. Verifica le condizioni del sito prima di applicarle.",
    "count": "{{count}} pericoli",
    "groupHint": "La ricerca mostra i pericoli corrispondenti con tutte le misure associate.",
    "missingMeasure": "Misura attuale non indicata",
    "missingSolutions": "Nessuna misura aggiuntiva associata disponibile.",
    "guide": "Guida alla valutazione",
    "cases": "Esplora i casi studio",
    "reference": "Materiale di riferimento; non sostituisce la valutazione e verifica specifica del sito.",
    "pageLabel": "Pagine del dizionario dei pericoli"
  },
  "pt": {
    "intro": "Consulte perigos com as medidas atuais e adicionais associadas. Pesquise por categoria ou palavra-chave e compare a aplicabilidade.",
    "howTo": "Encontre um perigo adequado ao trabalho e revise as medidas existentes e adicionais. Verifique as condições do local antes de aplicá-las.",
    "count": "{{count}} perigos",
    "groupHint": "A busca mostra os perigos correspondentes e todas as medidas associadas.",
    "missingMeasure": "Medida atual não informada",
    "missingSolutions": "Nenhuma medida adicional associada foi informada.",
    "guide": "Guia de avaliação",
    "cases": "Explorar estudos de caso",
    "reference": "Material de referência; não substitui a avaliação e revisão específicas do local.",
    "pageLabel": "Páginas do dicionário de perigos"
  },
  "ru": {
    "intro": "Просматривайте опасности вместе с текущими и дополнительными мерами. Ищите по категории или слову и сравнивайте применимость мер.",
    "howTo": "Найдите опасность для ваших условий работы и изучите текущие и дополнительные меры. Перед применением проверьте условия на объекте.",
    "count": "Опасностей: {{count}}",
    "groupHint": "Поиск показывает подходящие опасности и все связанные с ними меры.",
    "missingMeasure": "Текущая мера не указана",
    "missingSolutions": "Связанные дополнительные меры не указаны.",
    "guide": "Руководство по оценке",
    "cases": "Просмотр примеров",
    "reference": "Справочный материал не заменяет оценку и проверку на конкретном объекте.",
    "pageLabel": "Страницы справочника опасностей"
  },
  "ar": {
    "intro": "تصفح المخاطر مع التدابير الحالية والإضافية المرتبطة بها. ابحث حسب الفئة أو الكلمة وقارن قابلية تطبيق التدابير.",
    "howTo": "ابحث عن خطر يناسب العمل ثم راجع التدابير الحالية والإضافية معاً. تحقق من ظروف الموقع قبل تطبيق أي تدبير.",
    "count": "عدد المخاطر: {{count}}",
    "groupHint": "يعرض البحث المخاطر المطابقة وجميع التدابير المرتبطة بها.",
    "missingMeasure": "لم يُسجل التدبير الحالي",
    "missingSolutions": "لم تُسجل تدابير إضافية مرتبطة.",
    "guide": "دليل التقييم",
    "cases": "تصفح دراسات الحالة",
    "reference": "مادة مرجعية لا تحل محل التقييم والمراجعة الخاصين بالموقع.",
    "pageLabel": "صفحات قاموس المخاطر"
  }
};
export const getDictionaryGroupUi = locale => values[phase6Language(locale)] || values.en;
