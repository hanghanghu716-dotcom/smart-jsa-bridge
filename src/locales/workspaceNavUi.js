const copy = {
  ko: ['내 작업 공간', '작업별 서류 묶음', '플랜·팀 관리', '서류와 도면을 묶어 준비하고 한 번에 출력하세요.', 'Community 무료 · Professional 무료 베타', '묶음 관리', '플랜 및 팀 확인', '저장 기준 안내', '무료 베타 사용 중'],
  en: ['My workspace', 'Work packages', 'Plans & teams', 'Prepare documents and drawings together, then print in one go.', 'Community free · Professional free beta', 'Manage packages', 'View plans & teams', 'Storage details', 'Free beta active'],
  de: ['Mein Arbeitsbereich', 'Arbeitspakete', 'Tarife & Teams', 'Dokumente und Zeichnungen bündeln und gemeinsam drucken.', 'Community kostenlos · Professional als kostenlose Beta', 'Pakete verwalten', 'Tarife & Teams ansehen', 'Speicherhinweise', 'Kostenlose Beta aktiv'],
  ja: ['マイワークスペース', '作業書類セット', 'プラン・チーム', '書類と図面をまとめて準備し、一括で印刷できます。', 'Community 無料 · Professional 無料ベータ', '書類セットを管理', 'プラン・チームを確認', '保存条件の詳細', '無料ベータ利用中'],
  fr: ['Mon espace de travail', 'Dossiers de travail', 'Offres et équipes', 'Regroupez documents et plans pour les imprimer ensemble.', 'Community gratuit · Professional en bêta gratuite', 'Gérer les dossiers', 'Voir les offres et équipes', 'Détails du stockage', 'Bêta gratuite active'],
  it: ['Il mio spazio di lavoro', 'Fascicoli di lavoro', 'Piani e team', 'Prepara documenti e disegni insieme e stampali in un unico passaggio.', 'Community gratuito · Professional in beta gratuita', 'Gestisci i fascicoli', 'Visualizza piani e team', 'Dettagli dello spazio', 'Beta gratuita attiva'],
  es: ['Mi espacio de trabajo', 'Paquetes de trabajo', 'Planes y equipos', 'Agrupa documentos y planos para imprimirlos juntos.', 'Community gratis · Professional en beta gratuita', 'Gestionar paquetes', 'Ver planes y equipos', 'Detalles del almacenamiento', 'Beta gratuita activa'],
  ar: ['مساحة عملي', 'حزم مستندات العمل', 'الخطط والفرق', 'اجمع المستندات والمخططات وجهّزها للطباعة معًا.', 'Community مجاني · Professional بإصدار تجريبي مجاني', 'إدارة الحزم', 'عرض الخطط والفرق', 'تفاصيل التخزين', 'الإصدار التجريبي المجاني نشط'],
  pt: ['Meu espaço de trabalho', 'Pacotes de trabalho', 'Planos e equipes', 'Reúna documentos e desenhos para imprimir tudo de uma vez.', 'Community grátis · Professional em beta gratuito', 'Gerenciar pacotes', 'Ver planos e equipes', 'Detalhes do armazenamento', 'Beta gratuito ativo'],
  ru: ['Моё рабочее пространство', 'Комплекты документов', 'Планы и команды', 'Объединяйте документы и чертежи для совместной печати.', 'Community бесплатно · Professional в бесплатной бета-версии', 'Управлять комплектами', 'Планы и команды', 'Условия хранения', 'Бесплатная бета активна'],
};
const keys = ['workspace', 'packages', 'plans', 'packagesDescription', 'plansDescription', 'openPackages', 'openPlans', 'storageDetails', 'beta'];
export function getWorkspaceNavUi(locale = 'en-US') {
  const values = copy[locale.split('-')[0]] || copy.en;
  return Object.fromEntries(keys.map((key, index) => [key, values[index]]));
}
