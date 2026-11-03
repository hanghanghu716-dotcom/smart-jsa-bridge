# Official job connections without business registration

Reviewed 2026-11-03. Scope: all 15 supported countries / 19 locale routes.
This is a provider-by-provider access and publication review, not a claim that every vacancy or every national job market is covered. Existing JSA, Case Study, news and authoring content are unchanged.

## Connections selected for this release

| Country | Official source and coverage | Free individual access / reuse evidence | Live adapter check |
| --- | --- | --- | --- |
| Australia (`en-AU`) | Queensland Government Smart jobs, Occupational Health & Safety group only | Public list, no account/key. Its own footer links to [Queensland copyright](https://www.qld.gov.au/legal/copyright/): CC BY 4.0 with attribution; exceptions for third-party content/logos. Only the state's listing metadata is selected, not descriptions, attachments, logos or linked third-party sites. | 3 occupational-safety listings. Source supplies explicit `+10:00` closing timestamps. |
| Spain (`es-ES`) | Junta de Castilla y León public employment, **regional**, not nationwide | [Dataset](https://jcyl.opendatasoft.com/explore/dataset/convocatorias-de-empleo-publico/information/) and its public API metadata explicitly identify the Junta as publisher and CC BY 4.0. No key/account. | 7 matching safety/hygiene records, **all already closed** on review date. Connected does not mean new/open vacancies exist. |
| Russia (`ru-RU`) | Rostrud, Работа России open vacancy API; bounded occupational/industrial-safety sample | Production [API documentation](https://trudvsem.ru/opendata/api) and [dataset terms](https://trudvsem.ru/opendata/datasets). The dataset explicitly links the government [model open-data terms](https://data.gov.ru/information-usage); the same approved model terms, including commercial reuse with source attribution, are reproduced by the [Ministry of Education](https://opendata.edu.gov.ru/usloviya-ispolzovaniya/). No key/account. | Two official queries, 100 records each; 200 distinct records in the live check. No application deadline supplied: `hireDate` is deliberately ignored and original-source confirmation remains visible. |

New sources are seeded disabled. Production activation is a separate operator-authorized action after the attribution UI is deployed. Evidence expires after 90 days, as with existing sources. Runtime activation and first import are verified separately from this reproducible migration.

The public metadata fields are title, employer, location, source URL and deadline where supplied. No applicant data, contacts, copied descriptions, images or attachments are stored. Each new source has its own visible attribution/licence note on both the homepage and job list; initial HTML has the same note. No government endorsement is implied.

## Other supported countries checked

| Country / locales | Findings and decision |
| --- | --- |
| Korea (`ko`) | Existing **나라일터** approved development/operation account remains connected: [official API](https://www.data.go.kr/data/15156780/openapi.do), free, unrestricted-use scope. Work24 corporate API stays disabled. See [Korean connection record](narailter-connection.md). |
| US (`en-US`) | Existing **USAJOBS** registered individual connection remains active. Federal roles only. [API terms](https://developer.usajobs.gov/apirequest/index). No new account/key or payment. |
| Canada (`en-CA`, AB, ON, BC, QC routes) | [Job Bank job-seeker terms](https://www.jobbank.gc.ca/termsofuse-seeker.xhtml) are not a verified commercial syndication grant. A [Niagara Falls open-job dataset](https://www.niagaraopendata.ca/dataset/niagara-falls-job-postings) is a possible Ontario-only alternative, but a current official feed, licence scope and deadline mapping were not all verified. **No automatic import activated**. Do not copy Canadian national or Ontario-only vacancies into Alberta, BC or Quebec. |
| UK (`en-GB`) | Current [GOV.UK vacancy standards guidance](https://www.gov.uk/government/publications/open-standards-for-government/publishing-vacancies-online-standards-profile--2) specifically says Civil Service Jobs offers data under OGL. However the live [Civil Service Jobs](https://www.civilservicejobs.service.gov.uk/csr/index.cgi) entry returned a human verification screen; no stable approved machine endpoint was verified. An older Crown-copyright page has different wording and is not used as blanket clearance. **Disabled pending official feed/access**, not because a company is universally required. DWP private-employer listings have separate rights. |
| Singapore (`en-SG`) | Both [MyCareersFuture](https://www.mycareersfuture.gov.sg/terms-of-use/) and [Careers@Gov](https://www.careers.gov.sg/terms-of-use/) require prior written permission for republication/linking. **Disabled**, no scraping or link republication workaround. |
| Germany (`de-DE`) | [BA terms](https://www.arbeitsagentur.de/nutzungsbedingungen) describe rights for selected cooperation partners; the [HR-BA-XML description](https://www.arbeitsagentur.de/unternehmen/arbeitskraefte/stellenangebot-online-aufgeben) is not permission to extract all listings. Official ministry RSS candidates exist, but commercial reuse of current vacancy metadata was not cleared. **Disabled**, no unofficial Jobsuche API. |
| Japan (`ja-JP`) | [Hello Work provider eligibility](https://www.hellowork.mhlw.go.jp/provide/provide_top.html) is limited to local authorities, training institutions and permitted/notified employment-placement providers. [FAQ](https://www.hellowork.mhlw.go.jp/help/question07.html) ties use to placement services. This individual-operated directory has not established eligibility. **Disabled**, public browsing does not override redistribution restrictions. |
| France (`fr-FR`) | [DGAFP / Choisir le service public dataset](https://www.data.gouv.fr/datasets/les-offres-diffusees-sur-choisir-le-service-public) is free under [Open Licence 2.0](https://www.data.gouv.fr/pages/legal/licences/etalab-2-0), including commercial reuse with source/update-date credit. A promising eligible source, but its current CSV is about 124 MB; catalogue analysis reports `File too large to download` and the tabular conversion is older than the current CSV. **Not activated with stale tabular data** and not downloaded on every visitor request. Needs a separately bounded weekly/conditional bulk import or a current small official feed. France Travail's [API catalogue](https://www.data.gouv.fr/dataservices/api-offres-demploi) currently reports distribution/reuse review and restricted access. |
| Italy (`it-IT`) | [inPA legal notice](https://www.inpa.gov.it/note-legali-app/) mentions CC BY 3.0 but its text also refers to a different departmental site. Current vacancy-feed/API scope was not established. **Disabled**; do not use third-party repackaged CSVs as official permission evidence or reverse-engineer an undocumented private endpoint. |
| Saudi Arabia (`ar-SA`) | [HRDF open-data terms](https://www.hrdf.org.sa/en/about/e-participation/open-data/open-data-usage-policy/) and [request process](https://www.hrdf.org.sa/en/about/e-participation/open-data/data-request/) allow individual open-data requests. A current per-vacancy Jadarat feed/licence was not verified; statistics are not job advertisements. **Disabled**. Nationality/eligibility requirements must not be erased. |
| Brazil (`pt-BR`) | The [SINE/RJ open-data page](https://www.rj.gov.br/trabalho/dados_abertos) points to 2020–2022 historical vacancy files, not a verified current nationwide machine feed. **Disabled**; historic data is not presented as current recruitment. |
| Romania (`ro-RO`) | [ANOFM](https://www.anofm.ro/) and [official diaspora guidance](https://diaspora.gov.ro/sprijin-ro/angajabilitate-munca) identify vacancies and Posturi.gov.ro, but a usable current feed plus explicit republication terms were not both verified. **Disabled**. ANOFM Moldova (`anofm.md`) is not the Romanian source; vacancy-count press releases are not individual jobs. |

For a disabled candidate, “not verified” means this review did not establish all necessary conditions, **not** that no lawful/free source exists anywhere in that country. No request for paid access or business registration was made.

Australia alternative excluded: [Jobs ACT's own copyright page](https://www.jobs.act.gov.au/copyright) restricts reuse beyond personal/internal non-commercial use without permission. The broader ACT government's CC BY page must not be substituted for this more specific statement. APS Jobs remains an unverified separate provider.

## Operating bounds and lifecycle

- Reuse the existing once-daily `government-jobs-daily` schedule. No per-visitor collection or new paid services/API keys.
- Six prepared adapters, maximum **13** external list calls/run if all six are enabled: Work24 2 (disabled), USAJOBS 2, Korea 5, Queensland 1, Castilla y León 1, Russia 2. Currently five intended active sources: maximum 11. Each response capped at 2 MiB and each call at 12 seconds. No detail-page fan-out.
- Six claims maximum, locked atomically, 20-hour source cooldown. Independent sources run concurrently; each failure preserves other sources and existing records. Invocation timeout 100 seconds, below the Edge free-plan 150-second wall limit.
- Maximum 200 minimal records/source/import. Database upsert preserves operator withdrawal. No paid bulk downloads or AI translation.
- API access is free; hosting still depends on total project usage. These limits do not promise unlimited free hosting.
- Date-only Spanish deadlines keep their original date label and expire after that date in Europe/Madrid, including DST. The original notice governs any earlier exact time. Future application-start dates are not shown early.
- Russian API has no verified closing date; source rechecks and 48-hour stale handling apply. Missing items in a bounded result are not immediately declared closed. Actual withdrawal/earlier closure can precede the next source check; users must verify the original.
- Do not turn the metadata link directory into JobPosting schema, applicant processing or a full-text mirror.

## Checks

`node --test scripts/open-government-jobs.test.js scripts/jobs.test.js scripts/narailter-jobs.test.js scripts/resource-hub.test.js scripts/resource-collection.test.js`

`node scripts/jobs-browser.js` (isolated fixtures; all external traffic mocked)

`scripts/jobs-security.sql` and `scripts/international-jobs-security.sql` run in rollback transactions. They cover admin/MFA, private-table grants, service credentials, source approval expiry, six-source claim/cooldown, country isolation, attribution ID, deadlines and withdrawal retention.
