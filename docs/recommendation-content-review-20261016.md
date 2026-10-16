# 3번 내용 검수 — 2026-10-16

**진행: 3/180 → 27/180개 검토.** 이번 대상은 직전에 근거를 재작성한 12개 초안입니다. 기술 12건과 번역·용어 12건을 완료하고 5개 초안을 수정했습니다. 지역 12건은 부분 검토 결과와 필요한 근거를 기록했으나 완료로 계산하지 않았습니다.

| 검수 영역 | 완료 | 미완료 |
| --- | --- | --- |
| 기술 | 15/60 | 45 |
| 지역 | 0/60 | 60 |
| 번역·용어 | 12/60 | 48 |
| 합계 | 27/180 | 153 |

완료는 정확한 내용·출처 해시와 판단 근거를 남긴 AI 문서 검토를 의미합니다. 작성한 AI가 수행한 자체 검토이며, 독립 전문가·원어민 인증이나 배포 승인으로 표시하지 않습니다. 영어 초안은 원문 의미와 영어 용어를 검토했습니다. 합성 자동 검사 결과는 검수 건수에 합산하지 않습니다.

## 이번 검수 대상

| 초안 | 기술 | 번역·용어 | 지역 | 수정 |
| --- | --- | --- | --- | --- |
| 온타리오 · 기계 정비 | 완료·한계 기록 | 완료·한계 기록 | 미완료 | 개인 잠금장치 사용을 명시 |
| 온타리오 · 압축공기 필터 | 완료·한계 기록 | 완료·한계 기록 | 미완료 | 격리 장치의 개인 잠금 조치를 명시 |
| 온타리오 · 용접 흄 | 완료·한계 기록 | 완료·한계 기록 | 미완료 | 필수 수정 없음 |
| 퀘벡 · 기계 정비 | 완료·한계 기록 | 완료·한계 기록 | 미완료 | 필수 수정 없음 |
| 퀘벡 · 압축공기 필터 | 완료·한계 기록 | 완료·한계 기록 | 미완료 | 각 작업자의 자물쇠 부착 책임 명확화, 퀘벡 용어 정리 |
| 이탈리아 · 압축공기 필터 | 완료·한계 기록 | 완료·한계 기록 | 미완료 | 필수 수정 없음 |
| 사우디 · 기계 정비 | 완료·한계 기록 | 완료·한계 기록 | 미완료 | 필수 수정 없음 |
| 사우디 · 압축공기 필터 | 완료·한계 기록 | 완료·한계 기록 | 미완료 | 필수 수정 없음 |
| 브라질 · 용접 흄 | 완료·한계 기록 | 완료·한계 기록 | 미완료 | 정식 밀착도 검사와 착용자 밀착 확인을 구분 |
| 러시아 · 기계 정비 | 완료·한계 기록 | 완료·한계 기록 | 미완료 | 필수 수정 없음 |
| 러시아 · 압축공기 필터 | 완료·한계 기록 | 완료·한계 기록 | 미완료 | 필수 수정 없음 |
| 러시아 · 용접 흄 | 완료·한계 기록 | 완료·한계 기록 | 미완료 | 전체 환기와 국소배기 모두 확인하고 고장 시 작업 중지 |

## 초안별 검토 결과

### 온타리오 · 기계 정비

`regional-ca-on-maintenance`

**기술:** Gravity restraint is explicit and does not treat isolation alone as removal of stored energy. The revised control names personally controlled locks; verification still prohibits access when isolation or stored-energy control is uncertain. All-energy scope, a machine procedure and a competent person are required; live work, confined entry and unknown boundaries are excluded.

**번역·용어:** English source-to-draft terminology review: unexpected motion, stored energy and gravity blocking retain their distinct meanings. The revision replaces the ambiguous secure the supplies phrase with an explicit locking action. If verification fails, keep personnel outside remains a prohibition; the text does not imply that switching off proves isolation.

**지역 미완료 사유:** Canadian technical sources do not establish the applicable Ontario sector rule or blocking-design duties. Confirm the sector and current Ontario requirements before closing regional review.

### 온타리오 · 압축공기 필터

`regional-ca-on-pressure-filter`

**기술:** Inlet, outlet, bypass and drain connections are assessed for pressure return; the revision makes personal locking explicit. Verification continues when pressure can reaccumulate; an uncertain boundary or depressurisation keeps the housing closed. No loosening-as-test or generic Parker valve/bowl sequence is adopted. The machine-integrated air-only condition bounds the task.

**번역·용어:** Backfeed, trapped pressure and depressurisation preserve separate pressure-path and residual-pressure concepts. Personally controlled locks makes secure specific without prescribing a product-dependent valve arrangement. The prohibition on loosening the housing as a test and the non-air/breathing-air exclusions retain their full force.

**지역 미완료 사유:** Ontario pressure-equipment and sector applicability remain unresolved. National/WSPS guidance and the foreign OSHA/manufacturer examples do not establish those duties.

### 온타리오 · 용접 흄

`regional-ca-on-welding-fume`

**기술:** The regular indoor uncoated-mild-steel scope is narrower than the construction guidance and does not import its natural-ventilation example as sufficient control. Source extraction, assessment-dependent respiratory protection and hood/performance rechecks form a coherent bounded control. The draft gives no universal airflow number and stops welding if extraction is ineffective; other welding hazards remain outside the card.

**번역·용어:** Source extraction, hood position and specified performance distinguish capture location from simply turning a fan on. Regular indoor and uncoated mild steel preserve frequency, location and material restrictions. Stop welding if extraction is ineffective is retained as an instruction; construction-work condition matches the stated scope.

**지역 미완료 사유:** IHSA’s captured manual cites an older CSA edition than the CCOHS page. Current construction requirements, relevant CSA edition and any pre-start-review duties still require reconciliation.

### 퀘벡 · 기계 정비

`regional-ca-qc-maintenance`

**기술:** The draft requires each entrant’s own lock and a machine-specific procedure; no unassessed alternative energy-control method is offered. The verification covers residual energy and blocks entry when isolation or the safe condition is unconfirmed. The narrow isolation step excludes live intervention, confined entry and unknown energy; it does not authorize repair or restart.

**번역·용어:** Démarrage imprévu and énergie résiduelle preserve unexpected starting and residual energy. Each person appose son cadenas is unambiguous; consignation in the step is broad, while the operative control explicitly specifies cadenassage. Interdire l’accès preserves the failed-verification stop; espace clos is the local exclusion term.

**지역 미완료 사유:** CNESST guidance supports the chosen method, but the current consolidated RSST, establishment versus construction scope and exception applicability have not been reconciled.

### 퀘벡 · 압축공기 필터

`regional-ca-qc-pressure-filter`

**기술:** The revised wording explicitly requires each person entering the danger zone to apply their own lock, removing the ambiguous collective phrasing. Pressure paths, safe depressurisation and continued checks on possible reaccumulation are covered; opening or loosening under uncertainty is prohibited. The machine-integrated, air-only scope does not turn a manufacturer illustration into a universal opening procedure.

**번역·용어:** Cadenassage replaces the broader consignation in the procedure condition, and espace clos aligns the exclusion wording. Chaque personne ... appose son cadenas states individual responsibility clearly. Dépressurisation, réalimenter and ne pas desserrer preserve pressure removal, return of supply and the no-loosening test prohibition.

**지역 미완료 사유:** Current RSST consolidation and pressure-equipment applicability remain unverified; the machine condition and CNESST guidance alone do not resolve both regimes.

### 이탈리아 · 압축공기 필터

`regional-it-pressure-filter`

**기술:** The operational chain comes from OSHA/manufacturer technical evidence; the INAIL page is used only for residual-energy context. The control covers supply/return paths and locking; the verification holds the housing closed under uncertain isolation or pressure. No universal torque, valve count or bowl-removal instruction is introduced; the procedure must belong to the equipment.

**번역·용어:** Riflusso, aria intrappolata and ripressurizzare retain backflow, trapped air and pressure return. Non allentarlo per verificare la pressione correctly prohibits loosening as a pressure test. The Italian limit explicitly distinguishes INAIL context from OSHA/Parker references and leaves Italian compliance unresolved.

**지역 미완료 사유:** The INAIL research page is not a prescriptive Italian maintenance rule. Applicable Italian machinery and pressure-equipment requirements remain to be checked.

### 사우디 · 기계 정비

`regional-sa-maintenance`

**기술:** The government O&M condition matches the EOM scope; personal locks, tags and stored pressure are included. The independent authorised verifier is distinct from the isolation implementer, consistent with the captured permit issue/execution section. No generic pipe-valve sequence is prescribed, and the equipment procedure must identify all other stored-energy controls.

**번역·용어:** عزل الطاقة, القفل الشخصي and بطاقات التحذير retain energy isolation, personal locking and warning tags. عامل مخوّل مستقل عن منفذ العزل clearly separates verifier from implementer. The Arabic coverage limit and required condition both restrict use to government facilities/projects O&M; they do not turn EOM into general law.

**지역 미완료 사유:** The captured EOM revision is 000 from 2020 and warns that printed copies may be outdated. The adopted current revision and applicable Saudi requirements remain unverified.

### 사우디 · 압축공기 필터

`regional-sa-pressure-filter`

**기술:** The pressure-path and no-opening checks remain equipment-specific, while EOM adds government O&M scope and independent verification. The wording does not impose EOM pipe isolation arrangements on every filter model. Non-air service, breathing-air certification, pressurised intervention and unknown media/boundaries are excluded.

**번역·용어:** التدفق العكسي and الهواء المحبوس distinguish return flow from trapped air. ولا تُرخِ الجسم لاختبار وجود الضغط preserves the prohibition on loosening the housing to test for pressure. The Arabic government O&M condition and مستقل عن منفذ العزل preserve the scope and independent-verifier requirement.

**지역 미완료 사유:** An adopted current EOM revision, permit roles and Saudi pressure-equipment applicability are not established by the 2020 captured guide. Regional review remains open.

### 브라질 · 용접 흄

`regional-br-welding-fume`

**기술:** The control follows elimination/reduction, engineering capture and assessment-dependent respiratory protection rather than treating a respirator as the first measure. The revision distinguishes the formal fit test from the wearer seal check, including a new check after readjustment. Hood movement/work change triggers rechecking and ineffective extraction stops the task; hazardous gases and other welding hazards remain separate.

**번역·용어:** Fumos, captação na fonte and zona respiratória preserve fume, capture and breathing-zone meanings. Ensaio de vedação and verificação de vedação now match the distinct Fundacentro concepts; the latter explicitly does not replace the former. Aço carbono sem revestimento plus the stainless/coated/unknown exclusion retains the bounded material scope.

**지역 미완료 사유:** Fundacentro 2016 technical guidance and foreign OSHA/HSE references do not verify current GRO/PGR duties, Brazilian exposure limits or respirator certification requirements.

### 러시아 · 기계 정비

`regional-ru-maintenance`

**기술:** The energy-control chain covers disconnection, prevention of restoration, residual pressure and adjacent-equipment hazards. 833n supplies stationary industrial-equipment repair context; CPC is only an operator example and CCOHS supplies general technical comparison. The draft excludes energised intervention even though the reproduced rule discusses special repair cases. Order 287n is temporal context, not a control source.

**번역·용어:** Остаточная энергия and остаточное давление distinguish energy from pressure; ошибочный пуск preserves unintended starting. The stationary-machine and repair-authorisation conditions remain visible in Russian. Не допускать людей expresses a firm no-entry hold; the coverage limit discloses that signed scans/current editions were not reconciled.

**지역 미완료 사유:** Current official 833n text and the effect of amendments, employer authorisation and special industrial-safety regimes remain to be verified; reproductions and CPC cannot close that review.

### 러시아 · 압축공기 필터

`regional-ru-pressure-filter`

**기술:** Pressure isolation, stored-pressure relief and verification remain separated; the housing cannot be opened or loosened when the safe condition is unconfirmed. The stationary industrial-equipment and permit-assessment conditions restrict the reproduced 833n context. 287n is excluded from technical-control reasoning; manufacturer instructions remain necessary for the actual opening operation.

**번역·용어:** Обратный поток, запертый воздух and повторное накопление preserve backflow, trapped air and reaccumulation. Не ослаблять корпус для проверки давления retains the no-loosening test instruction. The Russian limits retain stationary equipment, air-only service and unresolved signed/current legal text.

**지역 미완료 사유:** Official current 833n wording, amendment effects and any pressure/industrial-safety regime remain unresolved; the captured reproduction is insufficient for legal closure.

### 러시아 · 용접 흄

`regional-ru-welding-fume`

**기술:** The fixed-station control includes general and local ventilation; verification was corrected to check both rather than only the local hood. Stopping now covers failure of either required ventilation system; no numerical exposure limit is invented. The rule-8 hazardous-facility exclusion is a site condition, not a claim that a real site has been cleared. Foreign technical guidance remains distinguished.

**번역·용어:** Общеобменная and местная ventilation remain distinct in both control and verification after correction. The revised stop condition uses either failure, preserving the two-system requirement. The fixed-station, material and hazardous-facility restrictions remain visible; the source caveat retains the unverified current-edition status.

**지역 미완료 사유:** The current official 884n text, amendments and rule-8 applicability remain unverified. The reproduction’s ventilation exception is not a blanket permission to omit extraction.

## 남은 순서

다른 초안 48개의 미완료 검수와 위 12개의 지역 검수를 계속 진행합니다. 이전 기술 검수 3건을 제외한 미완료 검수는 총 153건입니다. 지역 검수는 현행 판본, 관할 및 업종 범위, 적용 조건과 예외를 확인해야 완료할 수 있습니다. 3번이 끝나기 전에 4번 원본 충돌 정리로 넘어가지 않습니다.

모든 초안은 draft 상태이며 배포 적격 0개입니다. 내용 수정 전후와 검토 결과는 `content-review-records.json`, 이전 3건은 `technical-review-records.json`에 있습니다. 원문 본문을 재배포하거나 근거를 새로 만들어내지 않았습니다.
