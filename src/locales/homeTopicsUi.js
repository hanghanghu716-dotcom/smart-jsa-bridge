const rows = {
  ko: ['작업 분야별 자료', '설비 점검과 부품 교체', '구조물 시공과 현장 작업', '용접 준비와 화기 작업', '전원 차단과 전기 설비', '생산 설비와 위생 관리'],
  en: ['Browse by type of work', 'Equipment checks and component replacement', 'Construction and structural work', 'Welding preparation and hot work', 'Electrical isolation and equipment', 'Production equipment and hygiene'],
  ja: ['作業分野から探す', '設備点検と部品交換', '構造物の施工と現場作業', '溶接準備と火気作業', '電源遮断と電気設備', '生産設備と衛生管理'],
  de: ['Nach Arbeitsbereich suchen', 'Anlagenprüfung und Bauteilwechsel', 'Bauarbeiten und Tragwerke', 'Schweißvorbereitung und Heißarbeiten', 'Freischaltung und elektrische Anlagen', 'Produktionsanlagen und Hygiene'],
  fr: ['Explorer par activité', 'Contrôle des équipements et remplacement de pièces', 'Construction et travaux de structure', 'Préparation du soudage et travaux par point chaud', 'Consignation électrique et équipements', 'Équipements de production et hygiène'],
  it: ['Esplora per attività', 'Controlli delle attrezzature e sostituzione di componenti', 'Edilizia e lavori strutturali', 'Preparazione alla saldatura e lavori a caldo', 'Isolamento elettrico e impianti', 'Impianti produttivi e igiene'],
  es: ['Explorar por actividad', 'Inspección de equipos y sustitución de componentes', 'Construcción y trabajos estructurales', 'Preparación de soldadura y trabajos en caliente', 'Aislamiento eléctrico y equipos', 'Equipos de producción e higiene'],
  pt: ['Explorar por atividade', 'Inspeção de equipamentos e troca de componentes', 'Construção e trabalhos estruturais', 'Preparação de soldagem e trabalho a quente', 'Isolamento elétrico e equipamentos', 'Equipamentos de produção e higiene'],
  ru: ['Поиск по виду работ', 'Проверка оборудования и замена компонентов', 'Строительные и конструкционные работы', 'Подготовка к сварке и огневые работы', 'Отключение питания и электрооборудование', 'Производственное оборудование и гигиена'],
  ar: ['تصفّح حسب نوع العمل', 'فحص المعدات واستبدال المكوّنات', 'أعمال البناء والهياكل', 'التحضير للحام والأعمال الساخنة', 'العزل الكهربائي والمعدات', 'معدات الإنتاج والنظافة'],
  ro: ['Explorați după tipul lucrării', 'Verificarea echipamentelor și înlocuirea componentelor', 'Construcții și lucrări structurale', 'Pregătirea sudării și lucrări cu foc', 'Izolare electrică și echipamente', 'Echipamente de producție și igienă'],
};

export function homeTopicsUi(locale = 'en-US') {
  const [title, ...descriptions] = rows[locale.split('-')[0]] || rows.en;
  return { title, descriptions };
}
