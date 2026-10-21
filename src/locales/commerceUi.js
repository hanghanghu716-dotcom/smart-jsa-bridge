const messages = {
 en: ['Related products','Purchase country','View product','We may earn a commission from qualifying purchases through these links.','These are related suggestions, not a list of products used in this case. Check specifications and workplace requirements.','No reviewed products are available for this country.'],
 ko: ['관련 상품','구매 국가','상품 보기','이 링크를 통한 구매 시 제휴 수수료를 받을 수 있습니다.','관련 상품 제안이며, 이 사례에서 실제 사용한 제품 목록이 아닙니다. 제품 사양과 작업장 요구사항을 확인하세요.','이 국가에서 구매할 수 있는 검토된 상품이 아직 없습니다.'],
 ja: ['関連商品','購入する国','商品を見る','これらのリンクからの購入により、紹介料を受け取る場合があります。','関連商品の提案であり、この事例で使用された製品の一覧ではありません。仕様と作業現場の要件を確認してください。','この国で購入できる確認済みの商品はまだありません。'],
 de: ['Passende Produkte','Einkaufsland','Produkt ansehen','Bei Käufen über diese Links erhalten wir möglicherweise eine Provision.','Dies sind Produktvorschläge, keine Liste der in diesem Beispiel verwendeten Produkte. Prüfen Sie Spezifikationen und betriebliche Anforderungen.','Für dieses Land sind noch keine geprüften Produkte verfügbar.'],
 fr: ['Produits associés','Pays d’achat','Voir le produit','Nous pouvons percevoir une commission sur les achats effectués via ces liens.','Ces suggestions ne constituent pas la liste des produits utilisés dans ce cas. Vérifiez les caractéristiques et les exigences du lieu de travail.','Aucun produit vérifié n’est disponible pour ce pays.'],
 it: ['Prodotti correlati','Paese di acquisto','Vedi prodotto','Potremmo ricevere una commissione sugli acquisti effettuati tramite questi link.','Sono suggerimenti, non un elenco dei prodotti utilizzati in questo caso. Verifica le specifiche e i requisiti del luogo di lavoro.','Non sono ancora disponibili prodotti verificati per questo paese.'],
 es: ['Productos relacionados','País de compra','Ver producto','Podemos recibir una comisión por las compras realizadas a través de estos enlaces.','Son sugerencias, no una lista de los productos utilizados en este caso. Comprueba las especificaciones y los requisitos del lugar de trabajo.','Aún no hay productos revisados disponibles para este país.'],
 pt: ['Produtos relacionados','País de compra','Ver produto','Podemos receber uma comissão pelas compras feitas através destes links.','Estas são sugestões, não uma lista dos produtos usados neste caso. Verifique as especificações e os requisitos do local de trabalho.','Ainda não há produtos revisados disponíveis para este país.'],
 ro: ['Produse conexe','Țara de cumpărare','Vezi produsul','Putem primi un comision pentru cumpărăturile realizate prin aceste linkuri.','Acestea sunt sugestii, nu lista produselor folosite în acest caz. Verificați specificațiile și cerințele locului de muncă.','Nu sunt încă disponibile produse verificate pentru această țară.'],
 ru: ['Сопутствующие товары','Страна покупки','Посмотреть товар','Мы можем получать комиссию за покупки по этим ссылкам.','Это предложения, а не список товаров, использованных в данном примере. Проверьте характеристики и требования рабочего места.','Для этой страны пока нет проверенных товаров.'],
 ar: ['منتجات ذات صلة','بلد الشراء','عرض المنتج','قد نحصل على عمولة من عمليات الشراء عبر هذه الروابط.','هذه اقتراحات وليست قائمة بالمنتجات المستخدمة في هذه الحالة. تحقق من المواصفات ومتطلبات مكان العمل.','لا تتوفر منتجات تمت مراجعتها لهذا البلد بعد.'],
};
export function getCommerceUi(locale) {
 const [title,country,view,disclosure,context,empty] = messages[locale?.split('-')[0]] || messages.en;
 const merchantCheck = {
 en: 'Check current price, availability and product options at the retailer.',
 ko: '가격·재고·상품 옵션은 쿠팡 등 판매처에서 확인해 주세요.',
 ja: '価格・在庫・商品オプションは販売店でご確認ください。',
 de: 'Aktuelle Preise, Verfügbarkeit und Varianten beim Händler prüfen.',
 fr: 'Vérifiez le prix, la disponibilité et les options chez le vendeur.',
 it: 'Verifica prezzo, disponibilità e varianti presso il venditore.',
 es: 'Consulta el precio, la disponibilidad y las opciones en la tienda.',
 pt: 'Confira preço, disponibilidade e opções na loja.',
 ro: 'Verificați prețul, disponibilitatea și opțiunile la comerciant.',
 ru: 'Проверьте цену, наличие и варианты товара у продавца.',
 ar: 'تحقق من السعر والتوفر وخيارات المنتج لدى البائع.'
 }[locale?.split('-')[0]] || 'Check current price, availability and product options at the retailer.';
 return {title,country,view,disclosure,context,empty,merchantCheck};
}
export const COMMERCE_COUNTRIES = ['KR','US','CA','GB','AU','JP','DE','FR','IT','ES','SG','SA','BR','RO','RU'];
export function commerceCountry(locale) {
 return locale === 'ko' ? 'KR' : (COMMERCE_COUNTRIES.includes(locale?.split('-')[1]) ? locale.split('-')[1] : 'US');
}
