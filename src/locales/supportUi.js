const copy={
 en:['Use this document','Start a document','Forms and downloads','Keep exploring','Related cases','Browse case studies','Explore community documents','Writing guides','Choose a document format','Work accessories','More products'],
 ko:['문서 활용','작업 문서 작성','양식·다운로드','관련 자료 탐색','관련 사례','작업 사례 둘러보기','Explore 문서 둘러보기','작성 가이드','문서 양식 선택','작업 관련 용품','추가 상품'],
 ja:['文書を活用','作業文書を作成','書式・ダウンロード','関連資料を探す','関連事例','事例一覧','公開文書を探す','作成ガイド','書式を選ぶ','作業関連用品','その他の商品'],
 de:['Dokument nutzen','Dokument erstellen','Vorlagen und Downloads','Weiter entdecken','Ähnliche Fälle','Fallstudien ansehen','Community-Dokumente','Schreibhilfen','Dokumentformat wählen','Arbeitszubehör','Weitere Produkte'],
 fr:['Utiliser ce document','Créer un document','Modèles et téléchargements','Explorer les ressources','Cas associés','Parcourir les études de cas','Documents communautaires','Guides de rédaction','Choisir un format','Accessoires de travail','Autres produits'],
 it:['Usa il documento','Crea un documento','Modelli e download','Esplora le risorse','Casi correlati','Consulta i casi studio','Documenti della comunità','Guide alla redazione','Scegli un formato','Accessori da lavoro','Altri prodotti'],
 es:['Utilizar el documento','Crear un documento','Plantillas y descargas','Explorar recursos','Casos relacionados','Ver casos prácticos','Documentos comunitarios','Guías de redacción','Elegir formato','Accesorios de trabajo','Más productos'],
 pt:['Usar o documento','Criar documento','Modelos e downloads','Explorar recursos','Casos relacionados','Ver estudos de caso','Documentos da comunidade','Guias de elaboração','Escolher formato','Acessórios de trabalho','Mais produtos'],
 ro:['Utilizați documentul','Creați un document','Modele și descărcări','Explorați resurse','Cazuri conexe','Consultați studiile de caz','Documente comunitare','Ghiduri de redactare','Alegeți formatul','Accesorii de lucru','Alte produse'],
 ru:['Работа с документом','Создать документ','Шаблоны и загрузки','Другие материалы','Похожие примеры','Посмотреть примеры','Документы сообщества','Руководства по составлению','Выбрать формат','Рабочие принадлежности','Другие товары'],
 ar:['استخدام المستند','إنشاء مستند','النماذج والتنزيلات','استكشاف الموارد','حالات ذات صلة','تصفح دراسات الحالة','مستندات المجتمع','أدلة الكتابة','اختيار تنسيق المستند','مستلزمات العمل','منتجات إضافية'],
};
export function getSupportUi(locale){
 const [use,start,downloads,explore,related,cases,community,guides,formats,accessories,more]=copy[locale?.split('-')[0]]||copy.en;
 return {use,start,downloads,explore,related,cases,community,guides,formats,accessories,more};
}
const categories=['clipboard','document-holder','tool-storage','parts-organizer','measuring-tape','carpenter-pencil','masking-tape','paint-roller','paint-tray','paint-brush','cleaning-cloth','dustpan','packing-tape','stretch-film'];
const purpose={
 en:['Checklist writing','Document storage','Tool organization','Small-parts storage','General length checks','Marking wood','Paint masking','Wall painting','Holding paint','Painting edges','General surface cleaning','Ordinary waste collection','Carton packing','Pallet wrapping'],
 ko:['점검표 작성','문서·도면 보관','공구 정리','소형 부품 분류','일반 길이 확인','목재 위치 표시','도장면 마스킹','벽면 도장','도료 담기','모서리 도장','일반 표면 청소','일반 쓰레기 수거','종이상자 포장','팔레트 포장'],
 ja:['点検表の記入','書類・図面の保管','工具の整理','小部品の保管','一般的な長さ確認','木材の墨付け','塗装の養生','壁面塗装','塗料受け','隅部の塗装','一般表面の清掃','一般ごみの回収','段ボール梱包','パレット梱包'],
 de:['Checklisten ausfüllen','Dokumente aufbewahren','Werkzeug ordnen','Kleinteile aufbewahren','Längen prüfen','Holz anzeichnen','Abkleben','Wände streichen','Farbe aufnehmen','Kanten streichen','Oberflächen reinigen','Allgemeinen Abfall sammeln','Kartons verpacken','Paletten verpacken'],
 fr:['Remplir les listes','Ranger les documents','Organiser les outils','Ranger les petites pièces','Vérifier les longueurs','Tracer sur le bois','Masquer avant peinture','Peindre les murs','Contenir la peinture','Peindre les bords','Nettoyer les surfaces','Ramasser les déchets ordinaires','Fermer les cartons','Emballer les palettes'],
 it:['Compilare le liste','Conservare documenti','Organizzare utensili','Conservare piccole parti','Controllare lunghezze','Tracciare sul legno','Mascherare per la pittura','Dipingere pareti','Contenere la pittura','Dipingere bordi','Pulire superfici','Raccogliere rifiuti comuni','Imballare cartoni','Avvolgere pallet'],
 es:['Completar listas','Guardar documentos','Organizar herramientas','Guardar piezas pequeñas','Comprobar longitudes','Marcar madera','Enmascarar para pintar','Pintar paredes','Contener pintura','Pintar bordes','Limpiar superficies','Recoger residuos comunes','Empacar cajas','Envolver palés'],
 pt:['Preencher listas','Guardar documentos','Organizar ferramentas','Guardar peças pequenas','Verificar comprimentos','Marcar madeira','Mascarar para pintura','Pintar paredes','Conter tinta','Pintar bordas','Limpar superfícies','Recolher resíduos comuns','Embalar caixas','Envolver paletes'],
 ro:['Completarea listelor','Păstrarea documentelor','Organizarea uneltelor','Păstrarea pieselor mici','Verificarea lungimii','Marcarea lemnului','Mascare pentru vopsire','Vopsirea pereților','Păstrarea vopselei','Vopsirea marginilor','Curățarea suprafețelor','Colectarea deșeurilor obișnuite','Ambalarea cutiilor','Înfolierea paleților'],
 ru:['Заполнение чек-листа','Хранение документов','Хранение инструмента','Хранение мелких деталей','Проверка длины','Разметка древесины','Маскирование при покраске','Покраска стен','Ёмкость для краски','Покраска кромок','Очистка поверхностей','Сбор обычного мусора','Упаковка коробок','Упаковка поддонов'],
 ar:['تعبئة قوائم التحقق','حفظ المستندات','تنظيم الأدوات','حفظ القطع الصغيرة','فحص الأطوال العامة','تحديد مواضع على الخشب','تغطية حواف الطلاء','طلاء الجدران','احتواء الطلاء','طلاء الحواف','تنظيف الأسطح العامة','جمع النفايات العادية','تغليف الصناديق','تغليف المنصات'],
};
export function productPurpose(category,locale){const index=categories.indexOf(category);return index<0?'':(purpose[locale?.split('-')[0]]||purpose.en)[index];}
