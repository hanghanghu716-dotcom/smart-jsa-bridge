# 앨버타·BC·독일 기본 양식 12종 — 필드별 검수

검토일: 2026-10-05. 신규 양식 버전: 2026-10-05.14. 기존 작업용 기본 양식의 필드 구성을 대조한 기록이다. 현장의 법적 적합성, 특수 작업허가서, 사업장 전체 관리체계의 완료 인증이 아니다. Case Study·guideline·DB·운영 배포는 범위 밖이다.

## 공식 자료와 판단 범위

- [AB: OHS Code Part 2, 7–10](https://search-ohs-laws.alberta.ca/legislation/occupational-health-and-safety-code/part-2-hazard-assessment-elimination-and-control/): 평가·기록·재평가·참여·통제 순서에 대조. 긴급 대응 중의 기록 예외를 평상시 면제로 확대하지 않는다.
- [BC: 위험 평가](https://www.worksafebc.com/en/health-safety/create-manage/managing-risk/assessing-risks), [작업절차·교육](https://www.worksafebc.com/en/health-safety/create-manage/health-safety-programs/developing-health-safety-program), [일반 점검](https://www.worksafebc.com/en/health-safety/create-manage/workplace-inspections), [Part 3](https://www.worksafebc.com/en/law-policy/occupational-health-safety/searchable-ohs-regulation/ohs-regulation/part-03-rights-and-responsibilities): 3.1–3.3 및 3.5/3.7–3.10 확인. 3.2 대상 소규모 사업의 월례 회의를 모든 작업 전 회의에 강제하지 않는다. 점검 참여의 실행 가능 조건과 대표 선정 경로를 보존한다.
- [CCOHS JSA](https://www.ccohs.ca/oshanswers/hsprograms/job-haz.html), [회의](https://www.ccohs.ca/oshanswers/hsprograms/safety-talks-how-to.html), [점검](https://www.ccohs.ca/oshanswers/prevention/effectiv.html): 공통 양식 작성 방법을 보조한다. 캐나다 공통 안내만으로 주 법령 검수가 끝났다고 처리하지 않는다.
- 독일 [ArbSchG §5](https://www.gesetze-im-internet.de/arbschg/__5.html), [§6](https://www.gesetze-im-internet.de/arbschg/__6.html), [§12](https://www.gesetze-im-internet.de/arbschg/__12.html), [DGUV 작업지침](https://aug.dguv.de/arbeitssicherheit/wie-unternehmen-betriebsanweisungen-richtig-nutzen/), [설명·교육 방법](https://topeins.dguv.de/arbeitssicherheit/unterweisung-tipps-fuehrungskraefte/): 작업별 평가·조치·효과 기록과 현장 설명을 대조. 별도 Betriebsanweisung과 제조사 지침을 일반 작업순서표와 구별한다. 일반 점검표는 전문 설비검사나 사고대장이 아니다.

온타리오 공식 본문은 403으로, 독일 §3/통합법령 및 BAuA 일부 페이지는 시간 초과/403으로 접근하지 못했다. 이 자료들을 읽었다고 기록하지 않는다. 온타리오 양식은 이번 수정·종결에서 제외했다. 독일은 실제 읽은 개별 조문과 DGUV 자료에 근거한 일반 작업양식 범위를 대조했다.

## 개별 양식 대조

모든 문서에는 작업명·장소·날짜·담당자 등 기존 공통 머리말이 있다. `frameworkBasis`는 해당 업종·관할·판본을 이번 작업에서 기록한다. 아래의 새 확인란은 `verification/runtime`이며 이전 답을 자동 재사용하지 않는다.

| 양식 | 기존 필드와 공식 자료 대응 | 보완 및 한계 |
|---|---|---|
| CA-AB.risk_assessment | `scope`, 단계/위험/피해대상/대책 표, `assessmentDate`, `consultationRecord`, `controlReview`, `reviewPlan`, 평가자 | `currentRiskDecision`, `actionCloseout`, `abAssessmentCycle` 추가. 날짜·새 공정·변경·주요 증축을 반영하는 재평가 기록. 원본 점수와 신규 평가 분리. |
| CA-AB.method_statement | `scope/equipment/ppe`, 단계·절차·위험·대책·책임자 표, `competency/emergency/monitoring/consultation/approval` | `procedureChangeRecord/procedureAccess`로 근거·개정·설명과 현행본 접근을 기록. 임의의 현장 절차로 특수작업의 기술 조건을 대체하지 않는다. |
| CA-AB.toolbox_talk | 작업 주제·위험·대책, `changes/actions/emergency`, 참석·진행자 | `briefingScope/briefingUnderstanding/briefingFollowup`: 이해·신고·미해결 의견과 후속 전달. 회의 기록으로 교육 자격을 인정하지 않는다. |
| CA-AB.inspection | 점검 항목/결과/조치/담당기한 및 점검자 | `inspectionPlan/Location/Priority`, `actionCloseout`, `inspectionLimits/Review/Response/Scope`로 위치·계획·추적 보완. 위험과 지적사항에 맞춘 기한이며 법정 검사주기를 임의 설정하지 않는다. |
| CA-BC.risk_assessment | 위험·노출 대상·기존/추가 조치, 평가·재검토·협의·효과 | `currentRiskDecision/actionCloseout` 추가. 현장별 판단을 별도 기록하며 지침의 예시 등급이나 연간 검토 안내를 법정 만료일로 자동 계산하지 않는다. |
| CA-BC.method_statement | 작업순서·자원·역량·비상·변경·작업자 설명/승인 | `procedureChangeRecord/procedureAccess` 추가. 근로자가 현행 절차를 열람하고 이해했는지 기록. 전체 OHS 프로그램이나 특별 작업절차를 대신하지 않는다. |
| CA-BC.toolbox_talk | 주제·사건·조치·참석·진행 기록 | 일반 회의 보완 3개와 `bcMeetingBasis` 추가. 적용 프로그램, 회의 일정·기록보관을 확인하고 3.2 월례 조건을 명시. |
| CA-BC.inspection | 점검·조치·담당·확인 결과 | 가로 7열 결과표와 점검 계획/한계/검토/대응, `bcInspectionParticipation` 추가. 대표 참여·선정 기록, 일반/고장·사고 점검 및 즉시 시정 경로를 현장에서 구체화. |
| DE.risk_assessment | 작업 관련 위험/대책·평가일·기준·참여·검토·효과 기록 | `currentRiskDecision/actionCloseout` 추가. ArbSchG §5의 유해요인 범위는 현장 평가에 반영하며 의무 숫자행렬을 가정하지 않는다. |
| DE.method_statement | 순서·장비·보호구·역량·비상·설명·승인 | `procedureChangeRecord/procedureAccess/deProcedureScope` 추가. Arbeitsanweisung 초안, 별도 Betriebsanweisung, 제조사 지침의 기능을 구별. 필수 전문지침은 연결·확인 대상으로 남는다. |
| DE.toolbox_talk | 주제·위험·최근 변경·비상·참석/설명자 | `briefingScope/briefingUnderstanding/briefingFollowup` 추가. Sicherheitskurzbesprechung 기록이며 §12 교육과 관련 전문교육 전체를 자동 충족하지 않는다. |
| DE.inspection | 위험·통제 실행과 현장 결과·조치 확인 | 일반 점검 필드와 가로 7열 표 보완. §6의 조치 검토 결과에 연결하며 기계별 전문검사·검사자 자격·기한은 별도 절차로 확인. |

## ③ 문구 검수와 저장 동작

신규 5문구를 10언어에서 검수했다: `abAssessmentCycle`, `bcMeetingBasis`, `bcInspectionParticipation`, `procedureAccess`, `deProcedureScope`. 합리적 재평가 간격을 고정 주기로, 실행 가능한 참여를 무조건 참석으로, 조건부 월례 회의를 모든 회의로 번역하지 않았다. 절차 열람 위치는 작업 장소와, 현행본 승인은 과거 승인의 재사용과 구분했다. `Betriebsanweisung`은 문서 언어가 달라도 유지한다.

기존 497개 전문용어와 28개 양식의 검수 해시는 유지하는지 비교한다. 12종의 새 버전만 변경하며 기존 저장본의 필드·버전·출력본을 덮어쓰지 않는다. 재사용 작업내용은 남기되 이번 위험판단·점검결과·참여·서명은 새 작업에서 초기화한다. 해당 프로필의 특수작업 허가서 72조합과 기존 13개 부분 근거 상태는 이번 완료 처리 대상이 아니다.

## 검증

- 전체 자동검사 198/198 통과. 12종 × 10언어의 새 작업·복제 시 현장 판단 초기화, 재사용 내용 유지, 출처의 독립 복제, 이전 저장 버전 유지 및 허가서 범위 제외를 확인했다.
- 변경 파일 ESLint 및 Vite 프로덕션 빌드(862 modules) 통과. 기존 큰 번들 안내는 남아 있다.
- 격리된 브라우저 검증 3회 통과: CA-AB 영어, DE 독일어, CA-BC 아랍어. 모바일 편집, JSA 가져오기, 저장 요청, 현장 검토 확인, 출력 스냅샷 및 실제 PDF 생성을 검사했다. 실제 계정/운영 DB 접근권한 검증을 대신하지 않는다.
- 생성 PDF 28쪽(CA-AB 10, DE 9, CA-BC 아랍어 9)을 렌더링해 전체 페이지의 표·문자 잘림과 아랍어 오른쪽 배치를 확인했다. 확인한 표에 잘림은 없었다. 긴 양식은 여러 페이지에 걸치며 마지막 입력란만 다음 페이지에 놓이는 경우가 있어, 페이지 밀도 최적화까지 완료했다는 뜻은 아니다.
- 기존 497개 용어 및 28개 양식 검수 해시는 변경 없이 유지했다. 신규 12양식·5문구에만 검수 기록을 추가했다.
- 현재 집계: ② 349/483(72.3%), ③ 1512/1515(99.8%), 합계 1861/1998(93.1%). 남은 확인 항목은 ② 134개, ③ 러시아어 3개다. 작업 시간이나 법적 인증률이 아닌 동일 가중치 확인 항목 수다.
