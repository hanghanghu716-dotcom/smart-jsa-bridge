import { normalizeLocale } from './config.js';

// Keep country/province copy explicit: a shared language does not imply shared documents.
export const REGIONAL_MAIN_COPY = {
  ko: {
    title: '현장의 경험을 모아, 우리 작업에 맞는 안전 문서로.',
    description: '현장 사례를 참고하고 공개 JSA의 작업단계를 조합하세요. 위험성평가·작업허가서·TBM·도면을 작업에 맞게 묶어, 필요한 언어로 준비하고 PDF로 출력하세요.',
  },
  'en-US': {
    title: 'Shared experience. Safety documents for your job.',
    description: 'Learn from field case studies and combine steps from public JSAs. Bring your JHA, safe job procedures, toolbox talks and drawings into one job package, add permits as needed, and export to PDF in your chosen language.',
  },
  'en-GB': {
    title: 'Site experience. RAMS for your next job.',
    description: 'Learn from site case studies and reuse steps from public JSAs. Prepare risk assessments and method statements (RAMS), toolbox talks and drawings in one work package. Add permits where needed and export to PDF in your chosen language.',
  },
  'en-AU': {
    title: 'Site experience. Documents for the work ahead.',
    description: 'Explore site case studies and reuse public JSA steps. Bundle risk assessments, pre-start talks and drawings; include a SWMS for high risk construction work where applicable. Prepare your work package in your chosen language and export to PDF.',
  },
  'en-SG': {
    title: 'Shared site knowledge. Your next RA and SWP.',
    description: 'Learn from site case studies and combine public JSA steps. Prepare risk assessments (RA), safe work procedures (SWP), toolbox meetings and drawings as one work package, with PTWs as needed. Choose your document language and export to PDF.',
  },
  'en-CA': {
    title: 'Shared experience. Documents for your crew.',
    description: 'Explore field case studies and reuse public JSA steps. Bundle your JSA, safe work procedures, toolbox talks and drawings for the job. Select your work province and document language, add permits as needed, and export to PDF.',
  },
  'en-CA-AB': {
    title: 'Field experience. Your next hazard assessment.',
    description: 'Learn from field case studies and combine public JSA steps. Bring hazard assessments, safe work procedures, toolbox meetings and drawings into one job package. Add safe work permits as needed and export to PDF in your chosen language.',
  },
  'en-CA-ON': {
    title: 'Shared experience. A JSA for your next job.',
    description: 'Explore field case studies and reuse public JSA steps. Prepare your JSA, safe work procedures, safety talks and drawings together. Add permits as needed, choose your document language and export your job package to PDF.',
  },
  'en-CA-BC': {
    title: 'Field experience. A risk assessment for your job.',
    description: 'Learn from field case studies and combine public JSA steps. Bundle risk assessments, safe work procedures, toolbox meetings and drawings for your crew. Add permits as needed and export the job package to PDF in your chosen language.',
  },
  'fr-CA-QC': {
    title: 'L’expérience du terrain, au service de vos tâches.',
    description: 'Inspirez-vous des études de cas et réutilisez les étapes d’analyses publiques. Regroupez AST, méthodes de travail sécuritaires, rencontres de sécurité et plans. Ajoutez les permis nécessaires, choisissez la langue de vos documents et exportez le dossier en PDF.',
  },
  'de-DE': {
    title: 'Erfahrung teilen. Arbeit sicher vorbereiten.',
    description: 'Nutzen Sie Fallstudien und kombinieren Sie Arbeitsschritte aus öffentlichen JSA. Bündeln Sie tätigkeitsbezogene Gefährdungsbeurteilungen, Arbeitsanweisungen, Sicherheitskurzbesprechungen und Pläne. Ergänzen Sie bei Bedarf Arbeitserlaubnisse und exportieren Sie die Unterlagen in Ihrer gewählten Sprache als PDF.',
  },
  'ja-JP': {
    title: '現場の経験を、次の作業の安全に。',
    description: '現場事例を参考に、公開JSAの作業ステップを組み合わせましょう。リスクアセスメント・安全作業手順書・KY活動記録・図面をまとめ、必要に応じて作業許可書を追加。文書の言語を選んでPDFで出力できます。',
  },
  'fr-FR': {
    title: 'L’expérience du terrain pour préparer vos travaux.',
    description: 'Inspirez-vous des études de cas et combinez les étapes d’analyses publiques. Réunissez évaluations des risques par tâche, modes opératoires, causeries sécurité et plans. Ajoutez les permis nécessaires et exportez le dossier en PDF dans la langue choisie.',
  },
  'it-IT': {
    title: 'Esperienze sul campo, documenti per il tuo lavoro.',
    description: 'Consulta i casi studio e combina le fasi delle JSA pubbliche. Riunisci schede di valutazione dei rischi dell’attività, procedure di lavoro sicuro, riunioni di sicurezza e disegni. Aggiungi i permessi necessari ed esporta il fascicolo in PDF nella lingua scelta.',
  },
  'es-ES': {
    title: 'Experiencia compartida para preparar cada tarea.',
    description: 'Consulta casos prácticos y combina etapas de los JSA públicos. Reúne evaluaciones de riesgos de la tarea, procedimientos de trabajo seguro, charlas de seguridad y planos. Añade las autorizaciones necesarias y exporta el conjunto en PDF en el idioma elegido.',
  },
  'ar-SA': {
    title: 'من خبرة الميدان إلى مستندات عملك.',
    description: 'استفد من دراسات الحالة واجمع خطوات العمل من تحليلات السلامة المنشورة. جهّز تقييم مخاطر المهمة وإجراءات العمل الآمن واجتماعات السلامة والمخططات في ملف واحد، وأضف تصاريح العمل عند الحاجة. اختر لغة المستندات وصدّرها بصيغة PDF.',
  },
  'pt-BR': {
    title: 'Experiência de campo para preparar cada tarefa.',
    description: 'Consulte estudos de caso e combine etapas de análises públicas. Reúna a análise de risco da tarefa (AR), procedimentos de trabalho seguro, DDS e desenhos. Inclua permissões de trabalho (PT) quando necessário e exporte o conjunto em PDF no idioma escolhido.',
  },
  'ru-RU': {
    title: 'Опыт коллег — для вашей следующей работы.',
    description: 'Изучайте практические случаи и объединяйте этапы из опубликованных JSA. Соберите оценку рисков, инструкции, материалы для обсуждения безопасности и чертежи в комплект для работы. При необходимости добавьте шаблон разрешения на работы. Выберите язык документов и сохраните комплект в PDF.',
  },
};

export const regionalMainCopy = locale => REGIONAL_MAIN_COPY[normalizeLocale(locale)] || REGIONAL_MAIN_COPY['en-US'];
