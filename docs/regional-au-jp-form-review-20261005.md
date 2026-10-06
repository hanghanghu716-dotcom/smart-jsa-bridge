# ② 호주·일본 6종 양식 · ③ 54개 문구 검수 — 2026-10-05.10

검수 대상은 재사용 가능한 일반 작업용 기본 양식이다. 호주 RA·SWMS·Pre-start/Toolbox·점검표와 일본 RA·KY 기록의 필드별 검토를 수행했다. 기존 14종에 6종의 종결 기록을 추가한다. 일본의 절차서·허가서·점검표, 호주의 일반 허가서, 별도 고위험작업 72개 조합의 전체 검수가 이번에 완료된 것은 아니다.

## ② 공식 자료와 실제 필드 대조

2026-10-05에 아래 원문을 읽고 입력 필드·재사용 방식·출력 구조와 대조했다. 자료의 발행 시점과 적용 범위를 구분하며, 모델 지침이나 오래된 방법론을 현재의 전국 공통 법규로 표시하지 않는다.

| 양식 | 필드 범위 | 근거와 결정 |
|---|---|---|
| AU Risk Assessment | 공통 작업명·장소·날짜·부서, scope, hazard/persons/controls/further, matrix, assessmentDate, consultationRecord, reviewPlan, controlReview, verification, assessor | [SWA 모델 위험관리 코드, 2024-11](https://www.safeworkaustralia.gov.au/sites/default/files/2024-11/model_code_of_practice-how_to_manage_work_health_and_safety_risks-nov24.pdf) §§2–6. 위험 식별·평가·대책 우선순위·참여·실행과 효과 재검토를 연결한다. 주별 채택과 Victoria OHS 체계는 별도이며 특정 평가 행렬을 강제하지 않는다. |
| AU Risk Assessment | sourceRisk/residual/owner, currentRiskDecision, actionCloseout | 같은 코드 §§3–6. 원본 점수는 출처 기록으로 유지하고 이번 현장 위험 추정·우선순위·판단 근거와 조치 종료는 새로 기록한다. 전회 평가·서명·확인 결과를 자동 복사하지 않는다. |
| AU SWMS | scope, hrcw, equipment/ppe, 작업 순서·hazard/controls/further/responsible, competency/emergency, monitoring, consultation/approval | [SWA SWMS 정보지, 2014-12](https://www.safeworkaustralia.gov.au/system/files/documents/1703/information-sheet-safe-work-method-statement.pdf) pp.1–4 및 [WorkSafe Victoria SWMS, 2026-01-14 검토](https://www.worksafe.vic.gov.au/safe-work-method-statements-swms). HRCW 해당 여부를 명시적으로 선택해야 생성된다. 대상 고위험 건설작업, 위험, 대책, 실행·모니터링·검토의 네 요소를 포함한다. RA/JSA 자체를 SWMS로 간주하지 않는다. |
| AU SWMS | frameworkBasis/auDutyHolders, auSwmsLifecycle, auSwmsRecord | 위 두 자료. PCBU/principal contractor만 고정 표기하던 문구를 현지 책임 주체·근로자/HSR 협의·도급 조정 기록으로 바꿨다. Victoria의 employer/self-employed를 구별한다. 불이행 시 안전하게 중지, 검토·수정, 준수 가능한 상태 확인 후 재개를 기록한다. 현장 열람, 배포 대상/일자, 개정본, 적용 보관기간·기산 근거는 직접 입력한다. 2014 자료의 금액 기준·2년 예시를 전국 자동 규칙으로 이식하지 않는다. |
| AU Pre-start / Toolbox | scope, hazards/controls, changes, emergency, actions, attendance/leader, briefingScope/Followup | [SWA Consultation](https://www.safeworkaustralia.gov.au/safety-topic/managing-health-and-safety/consultation) 및 2024 위험관리 코드 §§4–6. 작업자·HSR의 의견, 동시 작업 조정, 논의 결과의 담당자·기한·후속 확인을 기록한다. 회의는 교육·자격을 대신하지 않으며 일률적 법정 시간·주기를 도입하지 않는다. |
| AU Pre-start Inspection | scope, inspectionPlan, 항목/위치/결과/개선/담당·기한/우선순위/actionCloseout, inspector, inspectionLimits/Review | 2024 위험관리 코드 §4.3·5·6의 유지관리·점검/시험·대책 효과·재검토 기록. 작업용 점검과 조치 이행 확인의 범위다. 설비별 법정 기술검사나 검사원 자격/주기를 지정하지 않는다. 7열 가로 양식으로 출력한다. |
| JP Risk Assessment | 공통 정보, scope, jurisdictionReview, hazard/persons/controls/further, matrix, assessmentDate, consultationRecord, controlReview, verification/assessor | [MHLW 위험성·유해성 조사 지침](https://www.mhlw.go.jp/content/11300000/001414377.pdf) §§8–11. 작업·위험 식별, 위험 추정, 우선순위와 실행한 대책의 기록이다. 수치 행렬만 허용하지 않으며 상대적 분류도 입력할 수 있다. 화학물질 전용 평가·현행 법령 전체의 적합성 인증으로 확대하지 않는다. |
| JP Risk Assessment | sourceRisk/residual/owner, currentRiskDecision, riskPriority, reviewPlan, actionCloseout | 같은 지침 §§9–11 및 기록·재검토 자료. 원본 점수와 현재 현장 판단을 구별하고 대책 우선순위·실행·잔여 위험 전달을 연결한다. 현장 확인값과 서명은 매 작업 새로 작성한다. |
| JP KY | scope, jurisdictionReview, 위험/대책 표, changes/emergency/actions, jpKyAction, briefingFollowup, attendance/leader, briefingScope | [MHLW 2008 자료](https://www.mhlw.go.jp/bunya/roudoukijun/anzeneisei14/dl/080201c_0014.pdf) 인쇄 pp.46–49. 당일 위험 인지, 중점 위험, 합의한 행동목표·指差呼称·실행 결과를 기록한다. 큰 위험·미해결 대책은 조직의 RA와 후속조치로 전달한다. 4라운드 방식이나 예시 평가주기를 법정 의무로 강제하지 않는다. |

AU 네 양식에 관할 근거와 현장 책임 주체·협의·조정 기록을 공통 제공한다. 주/지역 입력은 아직 해당 주의 전체 법령을 자동 선택하는 엔진이 아니다. 문서의 안내·원본 작업내용은 재사용하되, 실제 판단·작업자·측정·서명·완료 결과는 재사용하지 않는다.

일본 기존 출처 두 건의 이름도 바로잡았다. `001411913.pdf`는 인쇄·제본 작업의 RA 방법 예시다. `001413029.pdf`는 **ステップ7：実施状況の記録と見直し**이며 KY/RA 비교 자료가 아니다. 후자는 기록·재검토 근거로 유지하고, 실제 KY 비교 자료를 해당 양식에 추가했다. 과거 저장 문서의 메타데이터는 일괄 덮어쓰지 않는다.

## ③ 10언어 의미 대조

기존 `requirementReviewRemainingText20261005.js` 49개 중 이미 종결된 `sgMarineHotDetail`, `qcHotDetail`는 변경하지 않았다. 나머지 **47개**, 기존 `auJurisdictionNotice` **1개**, 신규 **6개**, 합계 **54개 × 10언어**를 읽고 조건·주체·행위·예외·숫자·확인 범위의 의미를 대조했다. 법규 조항의 새 전체 검수를 주장하는 기록이 아니라, [기존 조항 검수](regional-requirements-review-20261005.md)와 [후속 검수](regional-batch-review-20261005.md)에 명시한 범위를 보존하는 문구 검수다.

| 묶음 | 개별 키 | 확인·수정 |
|---|---|---|
| 공통 조건·현장 역할 | fallPlanTrigger, temporaryProtection, personalLockRegister, isolationHandover, weldingEquipmentCheck, occupationPermitBasis, personTaskAuthorisation, preventivePresence, hotAreaCheck, hotPermitTrigger, multiEmployerRoles, pesPavRecognition | 계획 적용 조건, 임시 방호 복구, 개인 잠금·교대 차단 확인, 용접 장비 사용 시 조건, 직업 허가와 현장 허가의 차이, 스페인 recurso preventivo, 이탈리아 PES/PAV 고용주 인정의 범위를 보존. FR의 발급기관을 단순 ‘발급’에서 ‘autorité émettrice’로 명확화. |
| 호주 | auJurisdictionNotice, auHeightDetail, auElectricalDetail, auHotDetail | 모델/주별 채택/Victoria OHS 구별, SWMS와 추락방호 적용 조건의 차이, 면허 범위 유지. IT/ES/PT/RU에서 빠졌던 ‘필요한 밀폐공간 출입허가와 별도로 화기작업 승인도 확인’을 복원. |
| 캐나다 일반·앨버타 | caHeightDetail, caEnergyDetail, caHotDetail, abHeightDetail, abEnergyDetail, abHotDetail | 주별 차이와 조건부 계획을 유지. 앨버타 높이 조건을 모든 추락방호의 시작 높이로 해석하지 않음. IT/ES/PT의 위험 장소 허가 문장에 화기작업임을 명시. |
| BC·온타리오·퀘벡 | bcHeightDetail, bcEnergyDetail, bcHotDetail, onHeightDetail, onEnergyDetail, onHotDetail, qcHeightDetail, qcEnergyDetail | BC 개인 잠금 제거 예외와 그룹 독립 확인을 구별하고 DE/FR/IT/ES/AR/PT/RU에 권한·연락·통지의 ‘근거’ 의미를 보강. IT의 온타리오 문장에 다수 작업자의 에너지 차단 확인임을 명시. RSST/CSTC 적용 범위·예외는 기존 검수 한계 그대로 유지. |
| 독일·프랑스 | deHeightDetail, deEnergyDetail, deHotDetail, frHeightDetail, frConfinedDetail, frHotDetail | 관할별 집단 방호·전기 차단·자격/허가 구별, 밀폐공간 체계·업종 제한을 유지. 허가 관행을 일률적인 법정 허가로 승격하지 않음. |
| 이탈리아·스페인 | itHeightDetail, itEnergyDetail, itHotDetail, esHeightDetail, esConfinedDetail, esHotDetail | 개정·현행 통합 규정 검수 한계, PES/PAV와 활선 적격 구별, recurso preventivo 역할 및 현장 적용 조건 보존. 번역 종결이 기존 부분 법적 검수 상태를 변경하지 않음. |
| 사우디·브라질·러시아 | saOccupationDetail, saElectricalDetail, saHotDetail, brPetDetail, brHotDetail, ruHotDetail | 직업 수행허가/현장 허가 구별, 통합 규정·업종 한계, 브라질 PET 조건부 연장과 24시간 상한, NR-34 조선업 범위, 러시아 감시시간 근거 충돌을 보존. ES 사우디 문법 수정. |
| 신규 양식 | auDutyHolders, auSwmsLifecycle, auSwmsRecord, currentRiskDecision, jpKyAction, jpKyScope | 책임 주체·HSR/도급 협의, 안전 중지/재개 확인, 개정·보관 근거, 현장별 위험 판단, KY 행동과 조직적 RA의 구별을 10언어로 대조. 실제 결과를 작성하는 필드는 verification/runtime. |

`saOccupationDetail`은 후속 안내 `saPracticeUpdate`로 대체된 보존용 사전 항목이다. 기존 후속 조사에서 [관보 공표일](https://www.uqn.gov.sa/details?p=28771)이 확인되었으므로 ‘공표일 미확인’이라는 오래된 문장은 10언어 모두 제거했다. 허가 시행 절차와 작업·업종별 요건의 미완료는 유지한다. 새로 사우디 전 분야의 법적 검토를 완료한 것으로 세지 않는다.

## 버전과 검증

- 새 AU/JP 기본 양식은 `.10`; 실제 필드 변경 또는 출처 식별 수정에 따른 버전이다. 별도 작업 안내도 `.10`. SG 네 양식 `.9`, 나머지 변경 없는 양식 `.8` 유지.
- 기존 14개 양식·338개 용어 종결의 해시를 먼저 검증한 뒤 새 6개·54개만 추가한다. 기존 기록의 해시를 새 값으로 교체하지 않는다.
- 새 작업·복제 시 현재 위험 판단, SWMS 재개 확인, KY 결과, 점검·승인 기록은 비운다. 사용자가 과거 확인값을 표준 내용으로 잘못 분류해도 확인/작업자 필드의 초기화가 우선한다. 원본 점수와 과거 저장 문서는 유지한다.
- 검증 실행 결과는 아래에 기록한다. 실제 계정/운영 DB 재검증, 운영 배포, Case Study와 guideline 수정은 이번 범위가 아니다.

### 실행 결과

- 전체 자동시험 **190개 통과**, Vite 제품 빌드 **858개 모듈**, 변경 JavaScript ESLint, 검수 목록·완료 해시 일치 검사 통과.
- 격리 브라우저에서 AU 영어·AU 아랍어·JP 일본어 묶음을 만들고 모바일 편집, 저장 요청, 검토 확인 전 출력 제한, 실제 PDF 생성과 출력 스냅샷을 확인했다. 원격 요청은 시험 데이터로 대체되어 운영 계정이나 DB에 저장하지 않는다.
- AU 영어 9쪽·AU 아랍어 9쪽·JP 일본어 7쪽, 총 **25쪽**을 Poppler로 렌더링하여 페이지 분리·표·긴 안내 문구·공란을 확인했다. 가로 넘침 검사 및 아랍어의 원본 점수 LTR 순서 검사도 통과했다. 모든 언어의 실제 PDF나 실물 인쇄까지 확인한 것은 아니다.
- 기존 14개 양식과 338개 용어의 종결 해시는 그대로 유지됐다. 누적 양식 종결 20건·용어 종결 392건. 확인 단계 지표는 ② 329/483(68.1%), ③ 1386/1491(93.0%), 합산 1715/1974(86.9%)다. 시간 추정이나 현장 법적 인증 비율이 아니다.
- 기존 대형 번들 경고와 구버전 Puppeteer의 Windows 종료 stderr는 남는다. 기능 검사는 PASS·종료 코드 0이며, 종료 경고 때문에 통과하지 않은 검사를 통과로 표시하지 않았다.
