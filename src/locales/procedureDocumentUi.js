const labels = {
  ko: ['작업절차서', '작업절차서 보기·출력', 'PDF 저장', '인쇄', '닫기', '작업순서', '작업단계', '상세 작업절차'],
  en: ['Work procedure', 'View / print work procedure', 'Save PDF', 'Print', 'Close', 'No.', 'Work step', 'Detailed procedure'],
  de: ['Arbeitsablauf', 'Arbeitsablauf ansehen / drucken', 'PDF speichern', 'Drucken', 'Schließen', 'Nr.', 'Arbeitsschritt', 'Detaillierter Arbeitsablauf'],
  ja: ['作業手順書', '作業手順書の表示・印刷', 'PDFを保存', '印刷', '閉じる', '番号', '作業ステップ', '詳細な作業手順'],
  fr: ['Procédure de travail', 'Voir / imprimer la procédure', 'Enregistrer le PDF', 'Imprimer', 'Fermer', 'Nº', 'Étape de travail', 'Procédure détaillée'],
  it: ['Procedura di lavoro', 'Visualizza / stampa la procedura', 'Salva PDF', 'Stampa', 'Chiudi', 'N.', 'Fase di lavoro', 'Procedura dettagliata'],
  es: ['Procedimiento de trabajo', 'Ver / imprimir el procedimiento', 'Guardar PDF', 'Imprimir', 'Cerrar', 'N.º', 'Etapa de trabajo', 'Procedimiento detallado'],
  ar: ['إجراءات العمل', 'عرض / طباعة إجراءات العمل', 'حفظ PDF', 'طباعة', 'إغلاق', 'الرقم', 'خطوة العمل', 'إجراءات العمل التفصيلية'],
  pt: ['Procedimento de trabalho', 'Ver / imprimir o procedimento', 'Salvar PDF', 'Imprimir', 'Fechar', 'Nº', 'Etapa de trabalho', 'Procedimento detalhado'],
  ru: ['Порядок выполнения работ', 'Просмотр / печать порядка работ', 'Сохранить PDF', 'Печать', 'Закрыть', '№', 'Этап работы', 'Подробный порядок работ'],
  ro: ['Procedură de lucru', 'Vezi / tipărește procedura', 'Salvează PDF', 'Tipărește', 'Închide', 'Nr.', 'Etapă de lucru', 'Procedură detaliată'],
};
export function getProcedureDocumentUi(locale = 'en-US') {
  const values = labels[locale.split('-')[0]] || labels.en;
  return Object.fromEntries(['title', 'open', 'download', 'print', 'close', 'number', 'step', 'detail'].map((key, i) => [key, values[i]]));
}
