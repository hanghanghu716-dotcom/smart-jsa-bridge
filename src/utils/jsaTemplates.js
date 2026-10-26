import { defaultColumns, templateLayout, pickDocumentLayout } from './documentLayout.js';
import { defaultPaperSize } from './paperFormat.js';
export const JSA_TEMPLATES = ['standard', 'portrait', 'photo', 'actions'];
export const AUTHORING_ROUTES = ['/templates', '/info', '/procedure', '/analysis', '/export'];
export function authoringSnapshot(state = {}, draft) {
 state = state || {};
 return { ...draft?.layout_data, ...state,
  formData: state.formData ?? draft?.form_data ?? {}, participants: state.participants ?? draft?.participants ?? [],
  procedures: state.procedures ?? draft?.procedures ?? [], analysisData: state.analysisData ?? draft?.analysis_data ?? [],
  existingId: state.existingId ?? state.id ?? draft?.source_project_id ?? null };
}
export function needsTemplate(snapshot) {
 return !snapshot.formData?.projectName && !snapshot.analysisData?.length && !snapshot.existingId && !snapshot.isFork &&
  !snapshot.documentBlocks?.length && !snapshot.savedActiveOrder?.length;
}
export function draftDocumentLayout(snapshot, i18n) {
 const locale = snapshot.formData?.context?.documentLocale || i18n.language, t = i18n.getFixedT(locale, 'common');
 return { ...pickDocumentLayout(snapshot), ...templateLayout(pickDocumentLayout(snapshot), {
  savedActiveOrder: defaultColumns(snapshot.formData?.jsaType), docTitle: t('designer.defaultTitle'),
  appr1: t('designer.appr1'), appr2: t('designer.appr2'), appr3: t('designer.appr3'),
  savedSignatureRows: Math.max(1, Math.ceil((snapshot.participants?.length || 0) / 8)),
  paperSize: defaultPaperSize(snapshot.formData?.context?.jurisdiction),
 }) };
}
export function builtInTemplate(id, snapshot, i18n) {
 if (!JSA_TEMPLATES.includes(id)) throw Error('UNKNOWN_JSA_TEMPLATE');
 const layout = draftDocumentLayout({ formData: snapshot.formData, participants: snapshot.participants, paperSize: snapshot.paperSize }, i18n);
 layout.templateId = id;
 if (id === 'portrait') {
  layout.savedOrientation = 'portrait';
  layout.documentBlocks = [{id:'PROJECT_INFO',enabled:true},{id:'JSA_TABLE',enabled:true},{id:'NOTES',enabled:true}];
  layout.savedActiveOrder = layout.savedActiveOrder.filter(key => !['DATA_FREQUENCY','DATA_SEVERITY','DATA_RESIDUAL_RISK'].includes(key));
 }
 if (id === 'photo') {
  layout.savedActiveOrder.splice(2, 0, 'DATA_PHOTO');
  layout.savedColumnOverrides = { DATA_PHOTO: {width:10}, DATA_STEP_TITLE:{width:5} };
 }
 if (id === 'actions') {
  layout.documentBlocks = [{id:'PROJECT_INFO',enabled:true},{id:'SAFETY',enabled:true},{id:'JSA_TABLE',enabled:true},{id:'NOTES',enabled:true},{id:'PARTICIPANTS',enabled:true}];
  layout.savedColumnOverrides = {DATA_ACTION_OWNER:{width:6},DATA_ACTION_CHECK:{width:12},DATA_RESIDUAL_RISK:{width:6}};
 }
 // A format changes layout only. Work details, verification values and photos stay with their owner.
 return { ...snapshot, ...layout, stepPhotos: snapshot.stepPhotos || {}, formData: {...snapshot.formData, jsaType:snapshot.formData?.jsaType || '2-step'} };
}
