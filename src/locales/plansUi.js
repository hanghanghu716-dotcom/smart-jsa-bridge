import {phase6Language} from './phase6Ui.js';
const values={
  "en": {
    "title": "Community / Professional",
    "intro": "Personal core features are free without a trial expiry. Advanced history and organization controls have a 30-day free beta. No card, payment or automatic billing.",
    "freeStatus": "Free core",
    "proStatus": "Free beta",
    "proDescription": "Personal revision history, company templates, member roles, private team documents and version-specific approval.",
    "start": "Start Professional free beta",
    "trialIncludes": "The 30-day beta covers personal revision history and organization controls. It does not limit free creation, personal private saving, reuse or basic PDF export.",
    "expired": "The Professional beta has ended. Existing documents and history remain readable. Community creation, personal saving, reuse and basic PDF stay free.",
    "saved": "{used} personal documents saved",
    "storageError": "Unable to save right now. Your current draft is kept. Refresh your storage status and retry; existing documents can still be edited and exported."
  },
  "ko": {
    "title": "Community / Professional",
    "intro": "개인 핵심 기능은 체험 기한 없이 무료입니다. 고급 이력·조직 관리는 30일 무료 베타로 제공합니다. 카드 등록·결제·자동 과금은 없습니다.",
    "freeStatus": "핵심 기능 무료",
    "proStatus": "무료 베타",
    "proDescription": "개인 문서 개정 이력, 회사 양식, 구성원 권한, 비공개 팀 문서와 문서 버전별 결재를 제공합니다.",
    "start": "Professional 무료 베타 시작",
    "trialIncludes": "30일 베타는 개인 문서 개정 이력과 조직 관리에 적용됩니다. 무료 작성·개인 비공개 저장·재사용·기본 PDF 출력에는 체험 기한이 없습니다.",
    "expired": "Professional 체험이 종료되었습니다. 기존 문서·이력은 열람할 수 있으며 Community의 작성·개인 저장·재사용·기본 PDF는 계속 무료입니다.",
    "saved": "개인 문서 {used}개 저장됨",
    "storageError": "지금 저장하지 못했습니다. 작성 중인 내용은 유지됩니다. 저장 상태를 새로고침한 뒤 다시 시도해 주세요. 기존 문서의 수정·출력은 가능합니다."
  },
  "ja": {
    "title": "Community / Professional",
    "intro": "個人の基本機能は期限なく無料です。高度な履歴と組織管理は30日間の無料ベータです。カード登録・決済・自動課金はありません。",
    "freeStatus": "基本機能は無料",
    "proStatus": "無料ベータ",
    "proDescription": "個人の版履歴、会社テンプレート、メンバー権限、非公開チーム文書、版ごとの承認を提供します。",
    "start": "Professional無料ベータを開始",
    "trialIncludes": "30日間の対象は個人文書の版履歴と組織管理です。無料の作成・個人用非公開保存・再利用・基本PDF出力に期限はありません。",
    "expired": "Professionalの体験は終了しました。文書と履歴は閲覧でき、Communityの作成・個人保存・再利用・基本PDFは無料のままです。",
    "saved": "個人文書{used}件を保存",
    "storageError": "保存できませんでした。下書きは保持されています。保存状況を更新して再試行してください。既存文書の編集と出力は可能です。"
  },
  "de": {
    "title": "Community / Professional",
    "intro": "Persönliche Kernfunktionen sind ohne Testfrist kostenlos. Erweiterter Verlauf und Organisationsverwaltung bieten eine kostenlose 30-Tage-Beta. Keine Karte, Zahlung oder automatische Abrechnung.",
    "freeStatus": "Kostenlose Kernfunktionen",
    "proStatus": "Kostenlose Beta",
    "proDescription": "Persönlicher Versionsverlauf, Unternehmensvorlagen, Mitgliederrollen, private Teamdokumente und versionsbezogene Freigaben.",
    "start": "Kostenlose Professional-Beta starten",
    "trialIncludes": "Die 30-Tage-Beta gilt für persönlichen Versionsverlauf und Organisationsverwaltung. Kostenlose Erstellung, private Speicherung, Wiederverwendung und grundlegender PDF-Export haben keine Testfrist.",
    "expired": "Die Professional-Beta ist beendet. Dokumente und Verläufe bleiben lesbar. Community-Erstellung, private Speicherung, Wiederverwendung und grundlegender PDF-Export bleiben kostenlos.",
    "saved": "{used} persönliche Dokumente gespeichert",
    "storageError": "Speichern derzeit nicht möglich. Der Entwurf bleibt erhalten. Speicherstatus aktualisieren und erneut versuchen. Bestehende Dokumente bleiben bearbeitbar und exportierbar."
  },
  "fr": {
    "title": "Community / Professional",
    "intro": "Les fonctions personnelles essentielles sont gratuites sans échéance. L’historique avancé et la gestion d’organisation proposent une bêta gratuite de 30 jours. Sans carte, paiement ni facturation automatique.",
    "freeStatus": "Fonctions essentielles gratuites",
    "proStatus": "Bêta gratuite",
    "proDescription": "Historique personnel, modèles d’entreprise, rôles, documents privés d’équipe et approbations par version.",
    "start": "Démarrer la bêta gratuite Professional",
    "trialIncludes": "Les 30 jours concernent l’historique personnel et la gestion d’organisation. Création, stockage personnel privé, réutilisation et PDF de base restent gratuits sans échéance.",
    "expired": "La bêta Professional est terminée. Documents et historiques restent lisibles. Création, stockage personnel, réutilisation et PDF de base Community restent gratuits.",
    "saved": "{used} documents personnels enregistrés",
    "storageError": "Enregistrement impossible actuellement. Le brouillon est conservé. Actualisez le stockage et réessayez. Les documents existants restent modifiables et exportables."
  },
  "es": {
    "title": "Community / Professional",
    "intro": "Las funciones personales básicas son gratuitas sin vencimiento. El historial avanzado y la gestión de organizaciones tienen una beta gratuita de 30 días. Sin tarjeta, pago ni cobro automático.",
    "freeStatus": "Funciones básicas gratuitas",
    "proStatus": "Beta gratuita",
    "proDescription": "Historial personal, plantillas de empresa, roles, documentos privados de equipo y aprobaciones por versión.",
    "start": "Iniciar beta gratuita Professional",
    "trialIncludes": "Los 30 días cubren historial personal y gestión de organizaciones. La creación, almacenamiento personal privado, reutilización y PDF básico gratuitos no caducan.",
    "expired": "Terminó la beta Professional. Documentos e historiales siguen disponibles para lectura. La creación, almacenamiento personal, reutilización y PDF básico de Community siguen gratuitos.",
    "saved": "{used} documentos personales guardados",
    "storageError": "No se puede guardar ahora. Se conserva el borrador. Actualice el estado y reintente. Los documentos existentes se pueden editar y exportar."
  },
  "it": {
    "title": "Community / Professional",
    "intro": "Le funzioni personali essenziali sono gratuite senza scadenza. Cronologia avanzata e gestione organizzazioni hanno una beta gratuita di 30 giorni. Nessuna carta, pagamento o addebito automatico.",
    "freeStatus": "Funzioni essenziali gratuite",
    "proStatus": "Beta gratuita",
    "proDescription": "Cronologia personale, modelli aziendali, ruoli, documenti privati del team e approvazioni per versione.",
    "start": "Avvia beta gratuita Professional",
    "trialIncludes": "I 30 giorni riguardano cronologia personale e gestione organizzazioni. Creazione, salvataggio personale privato, riutilizzo e PDF di base gratuiti non scadono.",
    "expired": "La beta Professional è terminata. Documenti e cronologie restano leggibili. Creazione, salvataggio personale, riutilizzo e PDF di base Community restano gratuiti.",
    "saved": "{used} documenti personali salvati",
    "storageError": "Salvataggio non disponibile ora. La bozza è conservata. Aggiorna lo stato e riprova. I documenti esistenti restano modificabili ed esportabili."
  },
  "pt": {
    "title": "Community / Professional",
    "intro": "As funções pessoais essenciais são gratuitas sem prazo de teste. Histórico avançado e gestão de organizações têm beta grátis de 30 dias. Sem cartão, pagamento ou cobrança automática.",
    "freeStatus": "Funções essenciais grátis",
    "proStatus": "Beta gratuita",
    "proDescription": "Histórico pessoal, modelos da empresa, funções de membros, documentos privados da equipe e aprovações por versão.",
    "start": "Iniciar beta gratuita Professional",
    "trialIncludes": "Os 30 dias abrangem histórico pessoal e gestão de organizações. Criação, armazenamento pessoal privado, reutilização e PDF básico gratuitos não expiram.",
    "expired": "A beta Professional terminou. Documentos e históricos continuam legíveis. Criação, armazenamento pessoal, reutilização e PDF básico do Community seguem grátis.",
    "saved": "{used} documentos pessoais salvos",
    "storageError": "Não foi possível salvar agora. O rascunho foi mantido. Atualize o armazenamento e tente novamente. Documentos existentes podem ser editados e exportados."
  },
  "ru": {
    "title": "Community / Professional",
    "intro": "Основные личные функции бесплатны без срока действия. Расширенная история и управление организациями доступны в бесплатной бета-версии на 30 дней. Без карты, оплаты и автоматических списаний.",
    "freeStatus": "Основные функции бесплатно",
    "proStatus": "Бесплатная бета",
    "proDescription": "Личная история версий, шаблоны компании, роли участников, закрытые документы команды и согласование версий.",
    "start": "Начать бесплатную бету Professional",
    "trialIncludes": "30 дней относятся к истории личных документов и управлению организацией. Бесплатное создание, личное закрытое хранение, повторное использование и базовый PDF не ограничены сроком.",
    "expired": "Бета Professional завершена. Документы и история доступны для чтения. Создание, личное хранение, повторное использование и базовый PDF Community остаются бесплатными.",
    "saved": "Сохранено личных документов: {used}",
    "storageError": "Сейчас сохранить не удалось. Черновик сохранён. Обновите статус хранилища и повторите. Существующие документы можно редактировать и экспортировать."
  },
  "ar": {
    "title": "Community / Professional",
    "intro": "الوظائف الشخصية الأساسية مجانية دون انتهاء تجريبي. للسجل المتقدم وإدارة المؤسسات نسخة تجريبية مجانية لمدة 30 يوماً. لا بطاقة أو دفع أو خصم تلقائي.",
    "freeStatus": "الوظائف الأساسية مجانية",
    "proStatus": "نسخة تجريبية مجانية",
    "proDescription": "سجل الإصدارات الشخصي وقوالب الشركة وأدوار الأعضاء ومستندات الفريق الخاصة والاعتماد لكل إصدار.",
    "start": "بدء تجربة Professional المجانية",
    "trialIncludes": "تخص مدة 30 يوماً سجل المستندات الشخصي وإدارة المؤسسات. الإنشاء والحفظ الشخصي الخاص وإعادة الاستخدام وتصدير PDF الأساسي مجانية دون انتهاء.",
    "expired": "انتهت تجربة Professional. تبقى المستندات والسجلات قابلة للقراءة، ويظل إنشاء Community وحفظه الشخصي وإعادة استخدامه وتصدير PDF الأساسي مجانياً.",
    "saved": "تم حفظ {used} مستندات شخصية",
    "storageError": "تعذر الحفظ الآن. تم الاحتفاظ بالمسودة. حدّث حالة التخزين وأعد المحاولة؛ يمكن تحرير المستندات الحالية وتصديرها."
  }
};
export const getPlansUi=locale=>values[phase6Language(locale)]||values.en;
