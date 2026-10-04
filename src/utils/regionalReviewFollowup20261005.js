// Follow-up evidence never upgrades a whole jurisdiction merely because a source opens.
const source = (title, url, scope, basis = 'regulation-publication') => ({ title, url, scope, basis, checkedAt: '2026-10-05' });
const saPublication = source('Umm Al-Qura · Adoption of high-risk occupations regulation, 2026-01-09',
  'https://www.uqn.gov.sa/details?p=28771',
  'Official Gazette publication date and commencement rule (180 days after publication) verified. Does not establish implementing workflows or sector PTW requirements.');
const saRegulation = source('NCOSH · High-risk occupations regulation, articles 9 and 15–19',
  'https://www.ncosh.gov.sa/media/if1lxppg/rowhro-25-en.pdf',
  'Occupational classification/practice permits are separate from site task permits. Gazette date is now evidenced separately; implementation and sector rules remain open.');
const itConversion = source('Gazzetta Ufficiale · Law 198/2025 and coordinated DL 159/2025, article 5',
  'https://www.gazzettaufficiale.it/eli/gu/2025/12/30/301/sg/pdf',
  'Printed p.137 (PDF page 141): final arts.113(2)/115, fixed vertical ladder over 5 m and over 75 degrees; priority among protection systems, anchorage and rope cross-references. Existing ladders installed by 2025-10-31: transition effective 2026-02-01. This is enacted amendment evidence, not a complete 2026 consolidation.');
const brOrder = source('MTE · Portaria 1.680/2025, ministry copy incorporating 1.259/2026',
  'https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/seguranca-e-saude-no-trabalho/sst-portarias/2025/portaria-mte-no-1-680-aprova-o-anexo-escadas-nr-35.pdf',
  'Order dated 2025-10-02, published 2025-10-03; article 6 gives 90-day commencement. Amended article 2 identifies exempt clauses and evidence. Annex text still contains older wording, so the amending order governs the reviewed change.');
const brAmendment = source('MTE · Portaria 1.259/2026, articles 3–7',
  'https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/seguranca-e-saude-no-trabalho/sst-portarias/2026-1/portaria-mte-no-1-259-alteracao-do-anexo-iii-da-nr-35.pdf',
  'Access-only fixed ladder risk analysis, routine-work procedure and periodic inspection criteria for structure, use frequency/criticality and design. Article 6 names Order 1.680/2025; heading year inconsistency is recorded, not silently corrected by the app.');

const appendSources = (old, added) => [...new Map([...old, ...added].map(s => [s.url, s])).values()];
export function applyReviewFollowup(records) {
  const result = structuredClone(records);
  for (const topic of ['height', 'confined', 'electrical', 'hot']) {
    const r = result.SA[topic];
    r.checkedAt = '2026-10-05';
    r.sources = appendSources(r.sources, [saRegulation, saPublication]);
    if (topic === 'confined') r.noteKey = 'saPracticeUpdate';
    else r.additionalNotes.push('saPracticeUpdate');
    r.fields = [...new Set([...r.fields, 'occupationPermitBasis', 'occupationClassification'])];
    r.partial = true;
    r.resolvedIssues = ['sa-gazette-publication-date'];
    r.remaining = 'Gazette date and 180-day commencement rule verified. Implementing licensing workflows and task/sector-specific duties remain unverified; occupational classification is not automatic.';
  }
  const it = result.IT.height;
  it.sources = appendSources(it.sources, [itConversion]);
  it.noteKey = 'itHeightUpdate';
  it.fields.push('fallSystemChoice', 'fixedLadderRecord', 'anchorCheck');
  it.resolvedIssues = ['it-2025-conversion-height-amendment'];
  it.remaining = 'Enacted December 2025 articles 113/115 compared. Full current consolidation and later amendments/sector exceptions remain open; no automatic ladder exemption.';

  const br = result.BR.height;
  br.checkedAt = '2026-10-05';
  br.sources = appendSources(br.sources, [brOrder, brAmendment]);
  br.additionalNotes.push('brLadderUpdate');
  br.fields.push('ladderInspectionSchedule');
  br.partial = true;
  br.resolvedIssues = ['br-order-1680-year-and-periodic-inspection'];
  br.remaining = 'Order 1680/2025 identified and periodic-inspection clause compared. Heading-year inconsistency and site-specific transition applicability remain explicit; full-topic closure remains open.';
  return result;
}
