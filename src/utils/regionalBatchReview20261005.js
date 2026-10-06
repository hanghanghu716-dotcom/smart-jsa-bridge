// Narrow findings from primary publications; no full-topic legal approval.
const source = (title, url, scope, basis = 'regulation-publication') => ({ title, url, scope, basis, checkedAt: '2026-10-05' });
export function applyRegionalBatchReview(records) {
  const result = structuredClone(records);
  const add = (country, topic, fields, note, sources, resolvedIssues = []) => {
    const r = result[country][topic];
    r.fields = [...new Set([...r.fields, ...fields])];
    r.additionalNotes = [...new Set([...(r.additionalNotes || []), ...(note ? [note] : [])])];
    r.sources = [...new Map([...r.sources, ...sources].map(s => [s.url, s])).values()];
    r.resolvedIssues = [...new Set([...(r.resolvedIssues || []), ...resolvedIssues])];
    r.checkedAt = '2026-10-05';
    r.evidence = 'regional-batch-review-20261005.md';
    // The original remaining/current-consolidation limitations still apply.
  };
  add('CA-QC', 'confined', ['qcOxygenCause', 'trainingEvidence', 'rescueReadiness'], 'qcEntryUpdate', [
    source('CNESST · Espaces clos', 'https://www.cnesst.gouv.qc.ca/fr/prevention-securite/identifier-corriger-risques/liste-informations-prevention/espaces-clos',
      'Current guidance: >=18 years, trained entrants/attendants/rescuers, competent risk/rescue planning, investigate oxygen below normal air despite the 19.5% minimum. Other atmosphere criteria and RSST/CSTC scope remain distinct.', 'regulator-guidance'),
    source('Gazette officielle du Québec · 2025 amendment, articles 4 and 10', 'https://www.publicationsduquebec.gouv.qc.ca/fileadmin/gazette/pdf_encrypte/lois_reglements/2025F/85643.pdf',
      'Published 2025-05-21; RSST 302 oxygen minimum changed from 20.5% to 19.5%, effective 2025-06-05. Not a complete current consolidation or an automatic entry decision.'),
  ], ['qc-oxygen-minimum-2025-amendment']);
  add('CA-QC', 'hot', ['qcFumeSources'], null, [source('CNESST Réptox · Gaz et fumées de soudage et de coupage',
    'https://reptox.cnesst.gouv.qc.ca/Pages/fiche-complete.aspx?no_produit=13896&nom=Gaz+et+fum%EF%BF%BDes+de+soudage+et+de+coupage',
    'Qualitative fume-source mechanisms: base/filler metal, coatings, degreasers, shielding gases and confined-space asphyxiation. Older hygiene section is not evidence of current exposure limits or full fire-code compliance.', 'regulator-guidance')]);
  add('IT', 'electrical', ['itElectricalRoles'], 'itElectricalUpdate', [source('CEI Magazine · La normativa sulla sicurezza dei lavori con rischio elettrico, 8/2025',
    'https://ceimagazine.ceinorme.it/la-normativa-sulla-sicurezza-dei-lavori-con-rischio-elettrico/',
    'Final 2025 roles: GI, RI, GL, RLE, LAV, not draft RL/L. PES/PAV competence recognition is distinct from assignment and needs practical competence, not theory alone. Full paid standard/distances not verified.', 'standards-publisher-guidance')], ['it-electrical-2025-role-names']);
  add('IT', 'height', ['itRoofStrength'], 'itRoofNotice', [source('Ministero del Lavoro · Interpello 6/2019',
    'https://www.lavoro.gov.it/documenti-e-norme/interpelli/Documents/Interpello-Dlgs-81-08-n-6-2019.pdf',
    'Interprets art.111 collective priority/temporary removal and art.148 specific collective-protection duty for roof works; strength assessment considers workers and material. Not a 2026 consolidated act.', 'official-interpretation')], ['it-roof-specific-collective-protection']);
  for (const topic of ['height', 'confined', 'electrical', 'hot']) add('SA', topic,
    ['saPracticeValidity', 'trainingEvidence'], 'saPracticeNotice', [source('NCOSH · High-risk occupations regulation, articles 5–7 and 13–17',
      'https://www.ncosh.gov.sa/media/if1lxppg/rowhro-25-en.pdf',
      'Actual duties/exposure determine classification. Employer verifies valid required permits/evaluations/training, including contractor compliance. Occupational practice permit differs from site PTW and OSH-practitioner licence. Implementing workflows remain unverified.')], ['sa-employer-validity-and-training-check']);
  add('BR', 'height', ['brLadderInventory'], 'brLadderNotice', [source('MTE · Portaria 1.259/2026, articles 1–9',
    'https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/seguranca-e-saude-no-trabalho/sst-portarias/2026-1/portaria-mte-no-1-259-alteracao-do-anexo-iii-da-nr-35.pdf',
    'Grouped analysis only for similar characteristics/use conditions. Art.7 staged fixed-ladder adequacy: <=500 first year, 501–1000 second, >=1001 third, per unit/sector/activity; clause applicability and dated exemption evidence must be assessed. Header year discrepancy remains explicit.')], ['br-ladder-grouping-and-inventory-basis']);
  add('RU', 'hot', ['ruCrewBriefing', 'ruFireClearance', 'dailyReview', 'permitRecord'], 'ruFireScopeNotice', [source('MChS Tatarstan · Fire-safety rules 1479, snapshot saved 2026-02-02',
    'https://16.mchs.gov.ru/uploads/resource/2026-02-11/perechen-normativnyh-pravovyh-aktov-v-oblasti-pozharnoy-bezopasnosti_1770816913228588720.pdf',
    'Agency-hosted reproduction amended 2025-02-03: paras.356–363, 372 and appendix 5. At least 2-hour post-work watch under 363; separate sector rules may be longer. Daily admission, crew briefing, permit scope and electronic-signature-law conditions under 372. Clearance radius depends on height, not a universal distance. Later consolidation remains open.')], ['ru-1479-watch-and-permit-snapshot']);
  // Replace obsolete whole-source uncertainty notices with the narrower,
  // evidenced limitations. Keep the pending status and detailed remaining work.
  for (const [country, topic, note] of [['IT', 'electrical', 'itElectricalUpdate'], ['RU', 'hot', 'ruFireScopeNotice']]) {
    const r = result[country][topic];
    r.noteKey = note;
    r.additionalNotes = r.additionalNotes.filter(key => key !== note);
  }
  return result;
}
