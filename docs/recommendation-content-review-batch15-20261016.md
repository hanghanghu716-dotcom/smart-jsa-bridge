# 3번 내용 검수 — 15차 기록 (2026-10-16)

**누적 진행: 72/180 → 123/180개 검토.** 이번에는 남은 기술 24건과 번역·용어 27건, 총 51건을 한 묶음으로 검토했습니다. 초안 27개 중 23개를 교정했습니다. 남은 57건은 모두 지역 적용성 검수입니다.

| 검수 영역 | 완료 | 남음 |
| --- | --- | --- |
| 기술 | 60/60 | 0 |
| 지역 | 3/60 | 57 |
| 번역·용어 | 60/60 | 0 |
| 합계 | 123/180 | 57 |

완료는 정확한 내용·출처 해시에 대응하는 AI 문서 검수 기록이 있다는 의미입니다. 독립 전문가·원어민 인증, 현장 준법 확인, 배포 승인은 아닙니다. 기존 완료 72건의 내용·출처 해시는 유지했습니다. 지역 검수 27건을 이번에 추가 조사했지만, 필요한 현행 법령·관할·설비 분류 대조가 끝나지 않아 완료로 세지 않았습니다.

## 이번 교정

- 정비·필터: 정지, 물리적 잠금, 잔류 에너지의 방출·구속을 구분했습니다. 프랑스 필터에는 배출음이 없다는 사실만으로 배출 경로가 정상이라고 판단하지 않도록 보완했습니다.
- 용접: 출처가 제시하는 제거·대체, 국소배기·일반환기, 배출 위치와 잔여 노출의 호흡 보호를 복구했습니다. 도장·도금 제외 대상이 용접 모재임을 명확히 했습니다.
- 독일 정비: 출처 FBHM-127이 다루는 고장 제거 범위로 한정했습니다. 루마니아 3개 초안의 밀폐공간 표현을 구체화했습니다.
- 사례 기반 3개: DB의 정확한 en-US 원문 지문을 대조했습니다. 트럭 교체 중 시야·신호 상실 시 절삭까지 중지하는 조건을 복구하고, 필터의 개인 잠금을 명시했습니다.
- 브라질 2개와 사우디아라비아 1개는 기존 기술 검수 본문을 변경하지 않고 번역·용어 영역만 추가 검토했습니다. 스페인 필터는 내용 수정 없이 기술·용어 대조를 완료했습니다.

## 사례 출처 검증

세 사례의 sourceRowId, locale, caseGroupId 및 CASE_SOURCE_FIELDS 지문이 현재 DB 원문과 모두 일치했습니다. DB는 읽기 전용으로 조회했습니다. 사례 본문은 AI가 작성한 교육 자료이며 전문가 승인 근거로 취급하지 않았습니다. OSHA 후진 안전 자료와 용접 자료, CCOHS 가스 자료는 사례의 기술적 설명을 별도로 대조하는 데 사용했습니다.

- [OSHA 후진 안전](https://www.osha.gov/preventing-backovers/solutions): 신호 합의·시선 유지·시야 상실 시 정지, 작업장 동선.
- [OSHA 용접 흄·가스](https://www.osha.gov/sites/default/files/publications/OSHA_FS-3647_WELDING.pdf): 오존·아르곤, 산소 치환과 환기.
- [CCOHS 용접 흄·가스](https://www.ccohs.ca/oshanswers/safety_haz/welding/fumes.html): TIG 오존과 차폐가스의 산소 부족 위험.

## 초안별 검토 결과

### regional-au-maintenance

**기술:** Shutdown, personal locks and tags now precede stored-energy release or restraint. The unsuccessful-restart warning preserves the separate test for stored pressure.

**번역·용어:** Personal lock and identification tag have different functions; release or restrain covers energy that cannot simply be discharged. State/territory checking is a prerequisite, not an assertion of nationwide adoption.

**지역 미완료 사유:** The Victorian page and national model Code have different authority. Identify the governing state/territory, adoption, amendments and applicable industry before regional closure.

### regional-sg-maintenance

**기술:** The machinery guidance supports stopping moving parts, isolating sources, dissipation/retention, lockout and verification. Controls are returned off/neutral after a prescribed try-start test.

**번역·용어:** Lock-out remains physical isolation; an identification tag alone is insufficient. Stop, isolate and verify are separate actions, and the conditional test is not permission for energized access.

**지역 미완료 사유:** Reconcile the machinery guideline edition with current Singapore subsidiary legislation, workplace scope and applicable exceptions.

### regional-de-maintenance

**기술:** Energy separation, residual-energy restraint and linked-machine restart prevention are retained. The revised step and scope now match FBHM-127 fault rectification instead of all maintenance.

**번역·용어:** Störungsbeseitigung is fault rectification; Instandhaltung is broader. Gespeicherte Energie sichern preserves restraint, and the area stays closed if safe isolation is unverified.

**지역 미완료 사유:** DGUV information is technical guidance. Compare current BetrSichV/TRBS scope, responsibilities and exceptions for the bounded fault-rectification task.

### regional-fr-maintenance

**기술:** ED 6109 separation, condemnation/locking and identification are explicit. Retention is an alternative where dissipation is impossible, including parts that may fall; verification still precedes access.

**번역·용어:** Consignation is the overall energy-control process; condamnation physically secures a separation device. Retenir is not translated as dissipate, and the no-access condition remains mandatory.

**지역 미완료 사유:** INRS technical guides and restart advice do not establish current Code du travail applicability, required authorizations or exceptional intervention conditions.

### regional-it-maintenance

**기술:** Shutdown was missing from the compact control and is now explicit. Isolation/blocking, residual-energy dissipation or restraint and reaccumulation checks agree with INAIL technical context and OSHA comparison.

**번역·용어:** Arrestare, isolare/bloccare and verificare remain distinct. Trattenere preserves restraint of stored energy; the competent-person condition is not a qualification certificate.

**지역 미완료 사유:** INAIL research description plus US technical comparison is insufficient to close Italian legislative applicability, including D.Lgs.81/2008 and relevant exceptions.

### regional-es-maintenance

**기술:** The correction expands NTP 1117 consignación into separation, blocking/identification, dissipation/restraint and verification. No-access and no-tag-only controls remain explicit.

**번역·용어:** Consignación is not merely stopping; retener energy differs from dissipating it. Antes de acceder and impedir el acceso preserve the mandatory sequence and hold.

**지역 미완료 사유:** NTP 1117 is technical guidance from 2018. Reconcile current Spanish equipment law, responsibilities and task exceptions before counting regional completion.

### regional-ro-maintenance

**기술:** The archived HG 1146 text supports stopped maintenance and energy separation. Personal physical locks/tags come from the cited CCOHS technical guidance; they are not asserted as a Romanian statutory quotation.

**번역·용어:** Spațiu confinat replaces the overbroad spațiu închis. Izolare, blocare and etichetă remain separate; rețineți safely covers energy restraint rather than automatic dissipation.

**지역 미완료 사유:** The ILO archived HG 1146 text is not a verified current consolidation. Check the official current text, scope and exceptions; foreign lockout guidance is not Romanian law.

### regional-ca-qc-welding-fume

**기술:** The fixed-station condition matches the CNESST source. The correction includes make-up air and worker/capture positioning, retaining local capture, rechecks and residual respiratory protection. It does not impose a blanket recirculation ban absent from that source.

**번역·용어:** Captage local is distinct from general ventilation and apport d’air neuf. Métal de base revêtu avoids confusing coated electrodes with coated workpieces. Fixed station remains a required condition.

**지역 미완료 사유:** Reconcile current RSST fixed-station, recirculation, exposure limits and respiratory provisions; the CNESST explanatory page alone is not a complete Quebec applicability review.

### regional-au-pressure-filter

**기술:** Personal lockout now secures all identified inlet/outlet/bypass/drain paths. Housing stays closed when depressurization is unverified; failed restart alone does not establish pressure safety. No Parker sequence or torque is generalized.

**번역·용어:** Supply/backfeed and trapped pressure describe different hazards. Authorised and depressurisation use Australian English; the no-loosening prohibition and non-air exclusions are preserved.

**지역 미완료 사유:** Identify the state/territory and pressure-equipment classification. National model guidance, Victorian isolation guidance and a Parker example cannot establish that classification.

### regional-sg-pressure-filter

**기술:** Explicit physical lockout supplements complete pressure tracing and safe relief. The machine-integrated condition keeps the machinery guideline within its scope, and pressure-return checks remain required.

**번역·용어:** Machine-integrated filter is a scope prerequisite, not every pressure vessel. Tag-only isolation remains rejected; pressure return and depressurisation are not confused with closing one valve.

**지역 미완료 사유:** Compare current Singapore machinery and pressure-equipment provisions and determine the filter classification; a machine-guideline scope condition does not settle pressure-equipment obligations.

### regional-de-pressure-filter

**기술:** The revised securing phrase prevents repressurization specifically. Competent/appointed personnel, actual manufacturer procedure, pressure-return checks and a closed housing until verified remain intact.

**번역·용어:** Druckfreiheit is a verified state, not just a closed valve. Rückspeisung and erneute Druckbeaufschlagung preserve downstream return and renewed pressure; Gehäuse lösen remains prohibited as a test.

**지역 미완료 사유:** BetrSichV section 10 is only part of the applicable equipment regime. Check pressure-system classification, inspection duties and current technical rules before regional closure.

### regional-fr-pressure-filter

**기술:** ED 6109 supports the added safe purge route and check for effective communication. No noise/flow may indicate blockage, so it cannot release the housing-opening hold. No unsafe flange loosening is introduced.

**번역·용어:** Purge, dépressurisation and vérification remain separate. Condamner means physically secure; ne pas desserrer and ne pas ouvrir retain prohibitions, not suggestions.

**지역 미완료 사유:** Technical consignation guidance does not settle the filter pressure-equipment regime, workplace authorization or current French legal provisions.

### regional-es-pressure-filter

**기술:** No content correction was necessary: complete pressure paths are isolated/blocked, safe relief precedes opening, reaccumulation is checked and loosening the housing to test pressure is prohibited.

**번역·용어:** Derivación is bypass, realimentación/reaparición is renewed pressure, and carcasa is the housing. The machine-integrated condition and non-air/breathing-air exclusions preserve scope.

**지역 미완료 사유:** Current machinery and pressure-equipment classification remains unresolved; NTP 1117 and foreign technical comparisons do not complete Spanish applicability review.

### regional-ro-pressure-filter

**기술:** Physical lockout and tags now secure the complete boundary. The pressure-verification and reaccumulation hold remains; HG 1146 is not presented as a complete filter-opening procedure.

**번역·용어:** Intrare într-un spațiu confinat narrows the entry exclusion correctly. Lacăt and etichetă have distinct roles; mențineți carcasa închisă and nu slăbiți retain mandatory holds.

**지역 미완료 사유:** Verify current HG 1146 consolidation and the filter’s pressure-equipment/ISCIR classification and duties; the archived source cannot resolve those points.

### regional-au-welding-fume

**기술:** The correction restores lower-emission options, local exhaust, safe external discharge and no recirculation from the captured model Code. Residual-risk respiratory protection and stop-on-failure remain; no universal capture speed is imposed.

**번역·용어:** Source extraction is now local exhaust ventilation. Coated base metal is distinguished from consumables, and respiratory protection supplements rather than replaces effective capture.

**지역 미완료 사유:** Confirm current Australian model guidance, governing state/territory adoption, exposure limits and respiratory requirements for the actual welding process.

### regional-sg-welding-fume

**기술:** Continuous local exhaust is retained, with explicit respiratory protection for exposure not adequately controlled. The metalworking-shop scope and conditional site hot-work permit are not generalized to all workplaces.

**번역·용어:** Throughout the work preserves continuous operation. Any required permit is conditional and distinct from a claim that a permit has been issued. The coating exclusion concerns base metal.

**지역 미완료 사유:** The captured metalworking guidance dates from 2012. Reconcile current Singapore legal scope, welding exposure limits, ventilation and respiratory duties.

### regional-de-welding-fume

**기술:** DGUV FBHM-077 control hierarchy is restored: lower-emission process/consumable, source capture, room ventilation and residual respiratory protection. Performance rechecks and stopping remain without generalizing a capture-speed range.

**번역·용어:** Absaugung an der Entstehungsstelle differs from Raumlüftung. Zusatzwerkstoff and Grundwerkstoff remain distinct, preventing the coating exclusion from inadvertently excluding consumable coatings.

**지역 미완료 사유:** Review current GefStoffV/TRGS 528, exposure limits and respiratory provisions; the DGUV technical information is not a complete legal determination.

### regional-fr-welding-fume

**기술:** The source supports lower-emission options, local capture plus general ventilation and external discharge away from intakes without indoor recirculation. The draft does not copy obsolete transitional exposure-limit values from the captured page.

**번역·용어:** Captage and ventilation générale are complementary. Métal de base revêtu identifies the workpiece; residual respiratory protection is not permission to continue with failed extraction.

**지역 미완료 사유:** Current Code du travail exposure limits, carcinogen provisions and respiratory duties must be checked. Historical/transition limits in the captured page are not accepted as current.

### regional-it-welding-fume

**기술:** INAIL’s carcinogen hierarchy supports substitution/closed process where feasible, local plus general ventilation and trained use of residual respiratory protection. These are bounded controls, not a complete welding specification.

**번역·용어:** Sistema chiuso is conditional on technical feasibility, not a blanket requirement for every weld. Aspirazione localizzata and ventilazione generale remain distinct; coating means metallo base.

**지역 미완료 사유:** Reconcile D.Lgs.81/2008 chemical/carcinogen provisions, current limits and respiratory programme applicability; a general INAIL prevention page does not settle them.

### regional-es-welding-fume

**기술:** NTP 494 supports close-to-source capture and exhaust away from clean-air intakes. The electric-arc prerequisite is retained, as are exposure-based respiratory protection and the stop-on-ineffective-extraction hold.

**번역·용어:** Extracción localizada and campana retain the same control. Metal base recubierto distinguishes coatings on the workpiece from coated electrodes used in arc processes.

**지역 미완료 사유:** NTP 494 is historical technical guidance. Confirm current exposure limits and chemical/carcinogen and equipment requirements for Spain.

### regional-ro-welding-fume

**기술:** Elimination/substitution precedes local capture. The correction adds reassessment when process/conditions change, consistent with HG 1218 assessment and effectiveness duties; a working fan alone is not proof of controlled exposure.

**번역·용어:** Captare locală is source capture; reevaluarea expunerii is broader than checking the hood. Spațiu confinat and metal de bază clarify exclusions without weakening the stop condition.

**지역 미완료 사유:** Check current HG 1218 consolidation, applicable carcinogen rules, exposure limits and respiratory protection requirements for the actual process.

### regional-br-maintenance

**번역·용어:** NR-12 actor distinctions in capacitado, qualificado ou legalmente habilitado and formalmente autorizado are preserved. Máquina parada, bloqueio and downstream residual-energy controls are not collapsed into shutdown; special-mode and thermal-inertia exclusions remain explicit. No edit was needed.

**지역 미완료 사유:** Reconcile the consolidated NR-12 text with DOU amendments, applicability and the specific exceptions before regional completion.

### regional-br-pressure-filter

**번역·용어:** Corpo/carcaça both refer to the filter housing here; despressurização is verified pressure relief, not simply closing the inlet. The prohibition on loosening, pressure-return checks, machine circuit condition and non-air/breathing-air exclusions agree in meaning. No edit was needed.

**지역 미완료 사유:** Confirm current NR-12 and pressure-equipment/NR-13 applicability to the identified filter, including classification and exceptions.

### regional-sa-welding-fume

**번역·용어:** The Arabic labels distinguish low-carbon uncoated steel, welding materials, confined-space entry and absent/ineffective extraction. أبخرة اللحام is read in its conventional welding-fume context, not as proof that only vapour is present. The extraction/recheck/stop and exposure-based respiratory meanings agree with the technical comparison.

**지역 미완료 사유:** Confirm the edition and authority of the HRSD guide and current Saudi ventilation, exposure and respiratory obligations. An Arabic terminology review does not resolve legal applicability.

### compressed-air-filter-backfeed

**기술:** The exact en-US DB source fingerprint matches. Stages 2-3 and the silent-drain case support the inlet/outlet/bypass/drain boundary and no-opening hold; OSHA/Parker corroborate isolation and pressure relief. Explicit personal locks close a compact-control omission.

**번역·용어:** US depressurization spelling is consistent. Backfeed is not merely inlet supply; no drain noise is not zero pressure. All seven exclusions and the general-industry prerequisite remain conditions, not proof of completed checks.

**지역 미완료 사유:** Compare actual Federal OSHA/State Plan scope and the filter pressure classification. The AI-authored case is an educational extraction source, not independent professional or legal validation.

### asphalt-milling-truck-exchange

**기술:** The exact DB source stages 2/5/6 and lost-visibility scenario support the vehicle gap, sweep, two-driver sight lines and safe spotter position. Milling is now included in the hold. OSHA backing guidance independently corroborates signals, visual contact and immediate stopping.

**번역·용어:** Spotter/signaling follow US usage while retaining the source signaller role. Each driver’s sight line is not satisfied by visibility to only one driver; resume only after restoration remains mandatory.

**지역 미완료 사유:** Determine applicable construction, Federal/State Plan and road-authority requirements. OSHA backing solutions are informational; the case’s site sequence is not a universal legal specification.

### aluminum-tig-air-exposure

**기술:** The exact DB stage 4, ozone/argon explanation and hood-moved hold match. OSHA’s welding fact sheet and CCOHS independently corroborate ozone and oxygen displacement; capture and shielding must both be effective, and low visible fume is not proof of safe air.

**번역·용어:** Ozone exposure and oxygen deficiency are different hazards; shielding gas is not described as inherently safe. Hood movement triggers holding and rechecking both protections, while confined-space entry remains excluded.

**지역 미완료 사유:** Determine general-industry versus construction/other scope, Federal/State Plan requirements, current exposure limits and respiratory duties. The case is not independent professional validation.

## 검증과 다음 작업

로컬 검사 **33건 통과, 실패 0건**. 정확한 완료 영역의 중복 여부, 이전 완료 해시 유지, 교정 이력의 복원 가능성, 적용 조건·제외 조건의 일치 및 게시 불가 상태를 자동 검사로 확인했습니다. 57개 지역 초안의 기존 출처 연결과 3개 사례의 DB 지문을 별도로 확인했습니다.

다음에는 3번의 지역 검수 57건을 이어서 처리합니다. 판본·관할·업종·적용 예외와 설비 분류를 확인해 완료 조건을 충족한 항목만 집계합니다. 4번 원본 충돌 정리로 넘어가지 않았습니다.
