// Stable reading destinations shared by server HTML and the interactive page.
const labels = {
  ko: ['이 해설 바로가기', '본문·적용범위', 'PDF·작업 문서', '작성·검토 상태'],
  en: ['Navigate this guide', 'Guide and scope', 'PDFs and work documents', 'Authorship and review'],
  ja: ['解説内の移動', '本文・適用範囲', 'PDF・作業文書', '作成・レビュー状況'],
  de: ['In diesem Leitfaden', 'Inhalt und Geltungsbereich', 'PDFs und Arbeitsdokumente', 'Autorschaft und Prüfung'],
  fr: ['Parcourir ce guide', 'Contenu et champ d’application', 'PDF et documents de travail', 'Rédaction et révision'],
  it: ['Naviga nella guida', 'Contenuto e ambito', 'PDF e documenti di lavoro', 'Redazione e revisione'],
  es: ['Navegar por esta guía', 'Contenido y alcance', 'PDF y documentos de trabajo', 'Autoría y revisión'],
  pt: ['Navegar neste guia', 'Conteúdo e âmbito', 'PDFs e documentos de trabalho', 'Autoria e revisão'],
  ru: ['Навигация по руководству', 'Текст и область применения', 'PDF и рабочие документы', 'Авторство и проверка'],
  ar: ['التنقل في هذا الدليل', 'المحتوى ونطاق التطبيق', 'ملفات PDF ووثائق العمل', 'التأليف والمراجعة'],
  ro: ['Navigare în ghid', 'Conținut și domeniu', 'PDF-uri și documente de lucru', 'Redactare și verificare'],
};
export function caseNavigation(locale, hasReview = false, baseUrl) {
  const [label, body, resources, review] = labels[locale?.split('-')[0]] || labels.en;
  const targets = [['case-body', body], ['case-resources', resources]];
  if (hasReview) targets.push(['case-review', review]);
  return {
    label,
    links: targets.map(([id, text]) => ({
      id, text, href: baseUrl ? new URL('#' + id, baseUrl).href : '#' + id,
    })),
  };
}
