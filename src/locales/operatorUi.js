import { romanianUi } from './romanianUi.js';
const labels = {
 ko: ['운영자','운영자 작성 자료만 보기','제한 없음','보관 중 {used}개 · 제한 없음','기록 인계','기술 실패','기본 통제','문서 버전','PDF 다운로드','문서를 불러오거나 PDF를 생성하지 못했습니다.','다시 시도'],
 en: ['Operator','Operator documents only','Unlimited','{used} saved · Unlimited','Records & handover','Technical failures','Basic controls','Document versions','Download PDF','Unable to load documents or generate the PDF.','Retry'],
 ja: ['運営者','運営者の資料のみ','無制限','保存済み {used} 件 · 無制限','記録・引継ぎ','技術的故障','基本管理','文書バージョン','PDFをダウンロード','文書の読み込みまたはPDF作成に失敗しました。','再試行'],
 de: ['Betreiber','Nur Betreiber-Dokumente','Unbegrenzt','{used} gespeichert · Unbegrenzt','Dokumentation und Übergabe','Technische Fehler','Grundmaßnahmen','Dokumentversionen','PDF herunterladen','Dokumente oder PDF konnten nicht geladen werden.','Erneut versuchen'],
 fr: ['Équipe du site','Documents de l’équipe uniquement','Illimité','{used} enregistrés · Illimité','Traçabilité et transmission','Défaillances techniques','Mesures de base','Versions du document','Télécharger le PDF','Impossible de charger les documents ou de générer le PDF.','Réessayer'],
 es: ['Operador','Solo documentos del operador','Sin límite','{used} guardados · Sin límite','Registros y entrega','Fallos técnicos','Controles básicos','Versiones del documento','Descargar PDF','No se pudieron cargar los documentos o generar el PDF.','Reintentar'],
 it: ['Gestore','Solo documenti del gestore','Illimitato','{used} salvati · Illimitato','Registri e consegna','Guasti tecnici','Controlli di base','Versioni del documento','Scarica PDF','Impossibile caricare i documenti o generare il PDF.','Riprova'],
 pt: ['Operador','Somente documentos do operador','Ilimitado','{used} salvos · Ilimitado','Registros e transferência','Falhas técnicas','Controles básicos','Versões do documento','Baixar PDF','Não foi possível carregar os documentos ou gerar o PDF.','Tentar novamente'],
 ru: ['Оператор','Только материалы оператора','Без ограничений','Сохранено: {used} · Без ограничений','Записи и передача','Технические отказы','Основные меры','Версии документа','Скачать PDF','Не удалось загрузить документы или создать PDF.','Повторить'],
 ar: ['المشغّل','مستندات المشغّل فقط','غير محدود','{used} محفوظة · غير محدود','السجلات والتسليم','الأعطال الفنية','الضوابط الأساسية','إصدارات المستند','تنزيل PDF','تعذر تحميل المستندات أو إنشاء PDF.','إعادة المحاولة']
};
export function getOperatorUi(locale='en-US') {
  if (locale?.split('-')[0] === 'ro') return romanianUi.operatorUi;
 const values=labels[locale.split('-')[0]]||labels.en;
 return Object.fromEntries(['badge','only','unlimited','used','handover','technical','basic','versions','download','error','retry'].map((key,index)=>[key,values[index]]));
}
