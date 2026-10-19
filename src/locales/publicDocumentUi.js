import c0 from './ko/export.json' with { type: 'json' };
import c1 from './en-US/export.json' with { type: 'json' };
import c2 from './en-GB/export.json' with { type: 'json' };
import c3 from './en-AU/export.json' with { type: 'json' };
import c4 from './en-CA/export.json' with { type: 'json' };
import c5 from './de-DE/export.json' with { type: 'json' };
import c6 from './fr-FR/export.json' with { type: 'json' };
import c7 from './ja-JP/export.json' with { type: 'json' };
import c8 from './it-IT/export.json' with { type: 'json' };
import c9 from './es-ES/export.json' with { type: 'json' };
import c10 from './ar-SA/export.json' with { type: 'json' };
import c11 from './pt-BR/export.json' with { type: 'json' };
import c12 from './ru-RU/export.json' with { type: 'json' };
import c13 from './ro-RO/export.json' with { type: 'json' };
import r0 from './en-SG/overrides.json' with { type: 'json' };
import r1 from './en-CA-AB/overrides.json' with { type: 'json' };
import r2 from './en-CA-ON/overrides.json' with { type: 'json' };
import r3 from './en-CA-BC/overrides.json' with { type: 'json' };
import r4 from './fr-CA-QC/overrides.json' with { type: 'json' };
import { getDataLocale, normalizeLocale } from './config.js';
const catalogs={'ko':c0,'en-US':c1,'en-GB':c2,'en-AU':c3,'en-CA':c4,'de-DE':c5,'fr-FR':c6,'ja-JP':c7,'it-IT':c8,'es-ES':c9,'ar-SA':c10,'pt-BR':c11,'ru-RU':c12,'ro-RO':c13};
const regions={'en-SG':r0.export,'en-CA-AB':r1.export,'en-CA-ON':r2.export,'en-CA-BC':r3.export,'fr-CA-QC':r4.export};
const labels={"ko": ["작업절차서 미리보기", "콘텐츠 수정일"], "en": ["Procedure preview", "Content updated"], "de": ["Vorschau des Arbeitsablaufs", "Inhalt aktualisiert"], "ja": ["作業手順書プレビュー", "内容更新日"], "fr": ["Aperçu de la procédure", "Contenu mis à jour"], "it": ["Anteprima della procedura", "Contenuto aggiornato"], "es": ["Vista previa del procedimiento", "Contenido actualizado"], "ar": ["معاينة إجراءات العمل", "تحديث المحتوى"], "pt": ["Prévia do procedimento", "Conteúdo atualizado"], "ru": ["Предпросмотр порядка работ", "Содержимое обновлено"], "ro": ["Previzualizarea procedurii", "Conținut actualizat"]};
export function publicExportText(locale, group, key) {
 const code=normalizeLocale(locale), catalog=catalogs[getDataLocale(code)] || catalogs['en-US'];
 return regions[code]?.[group]?.[key] || catalog[group]?.[key] || '';
}
export function getPublicDocumentUi(locale='en-US') {
 const [procedurePreview,modified]=labels[locale.split('-')[0]] || labels.en;
 return {procedurePreview,modified,current:publicExportText(locale,'tags','DATA_CURRENT_MEASURE'),recommended:publicExportText(locale,'tags','DATA_RECOMMEND_MEASURE')};
}
