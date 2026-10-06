# 기본 양식 10종 — 필드별 요건 대조와 수정

검토일 2026-10-05. 범위는 기존 목록의 작업용 기본 양식이다. GB 4종, US 2종, CA 공통 4종을 대조했다. GB는 HSE의 Great Britain 범위이며 북아일랜드의 법적 요건을 종결한 것이 아니다. CA 공통 지침은 별도로 등록된 주별 프로필의 검수를 대신하지 않는다. 특수 작업의 기술적 허가 조건은 기존 72개 작업 조합에서 계속 검수한다. 범위를 새로 좁혀 법률 검수 완료로 계산하지 않는다. 이 기록의 종결 대상은 처음부터 선언된 **일반 작업용 초안의 필드 구성**이다.

## 근거와 필드 대응

| 양식 | 공식 근거·대조 범위 | 현재 입력·출력 대응 / 이번 보완 |
|---|---|---|
| GB.risk_assessment | [HSE 평가 양식](https://www.hse.gov.uk/simple-health-safety/risk/risk-assessment-template-and-examples.htm): 위험요인, 피해 대상, 기존·추가 조치, 담당·기한 | `scope`, 공통 작업명·장소·날짜, 표의 `step/hazard/persons/controls/further/owner`, `matrix/assessmentDate/reviewPlan/consultationRecord/controlReview/verification/assessor`. 조치별 상태·완료일·효과 확인 기록 `actionCloseout` 추가. 원본 점수는 재평가값으로 둔갑하지 않는다. |
| GB.method_statement | [HSE Method statements](https://www.hse.gov.uk/construction/safetytopics/admin.htm): 작업순서, 자원, 교육, 비상대책, 타 업체와의 연결 | `scope/equipment/ppe`, 순서표의 단계·절차·위험·조치·책임자, `competency/emergency/monitoring/consultation/approval`. `contractorCoordination` 추가. 철거·해체·구조 변경의 사전 서면조치 의무를 일반 작업 전체의 의무/면제로 확대하지 않는다. 건설단계계획은 별도 문서다. |
| GB.permit_to_work | [HSE PTW](https://www.hse.gov.uk/humanfactors/topics/ptw.htm): 범위·시간·역할, 상호 간섭, 전달, 교대·종료 | `permitType/permitProcedure/validity`, 위험·조치표, `isolation/ppe`, 측정표, `emergency`, 신청·현장확인·발행·인수 서명, `suspension/handover`. `competency/permitCoordination` 추가. 허가서가 위험성평가를 대체하거나 자동으로 작업을 허가하지 않는다. 시스템의 인력 배치·표시·감사 운영은 사용자 조직의 업무다. |
| GB.toolbox_talk | [HSE Toolbox talks](https://www.hse.gov.uk/construction/resources/toolboxtalks.htm), [근로자 참여](https://www.hse.gov.uk/involvement/consult/involveemployees.htm): 작업에 맞춘 짧은 주제·질문·의견 | `scope`, 위험·대책표, `changes/emergency/actions`, 참석·진행자·시각. `briefingFollowup`으로 미해결 질문·기한·결과 전달 기록, `briefingScope`로 교육 대체 불가 명시. |
| US.risk_assessment | [OSHA JHA worksheet](https://www.osha.gov/sites/default/files/Job_Hazard_Analysis_Worksheet.pdf), pp.1–3: 단계, 노출·원인·결과, 대책 우선순위, 참여·재검토 | 단계·위험·피해대상·조치 표, `controlReview/consultationRecord/reviewPlan/assessor`. 단계별 발생 조건과 원인을 구체화하는 `hazardScenario`, 조치 이행의 `actionCloseout` 추가. 작업 장소·날짜는 공통 머리말에 출력. 연방 일반 지침과 주·업종 요건 구분. |
| US.method_statement | 위 worksheet 및 [OSHA 3071](https://www.osha.gov/sites/default/files/publications/osha3071.pdf), 인쇄쪽 4–13: 작업 관찰, 절차화, 변경 전달·검토 | `scope/equipment/ppe`, 순서·방법·위험·조치·책임자 표, `competency/emergency/monitoring/consultation/approval`. 과거 자료는 방법론에만 사용하며 당시 주 계획 수나 현행 법령 목록을 인용하지 않는다. |
| CA.risk_assessment | [CCOHS JSA](https://www.ccohs.ca/oshanswers/hsprograms/job-haz.html), 단계·위험·예방조치와 Appendix A | 기존 평가 표·참여/검토 서명·평가일·재검토·효과 확인. `approval` 및 `actionCloseout` 추가. 작성·검토·승인은 각 역할을 기록할 수 있으며 저장값으로 승인 여부를 자동 판정하지 않는다. |
| CA.method_statement | 같은 CCOHS JSA의 작업절차 전달 부분 | 순서표 `step/procedure/hazard/controls/further/responsible`와 준비·역량·비상·변경 검토·설명/승인 서명. JSA를 토대로 작업방법을 기술할 수 있고 첨부/참고 JSA 제목은 기존 출력 머리말에 보존. |
| CA.toolbox_talk | [CCOHS Safety Talks – How To](https://www.ccohs.ca/oshanswers/hsprograms/safety-talks-how-to.html): 주제·내용·근로자 의견·출석 및 후속 조치 | 공유할 위험·조치, `changes/actions`, 참석·진행자·시각에 `briefingFollowup/briefingScope` 추가. 5분·매일 등 예시를 법정 시간·횟수로 강제하지 않는다. |
| CA.inspection | [CCOHS Effective Workplace Inspections](https://www.ccohs.ca/oshanswers/prevention/effectiv.html): 계획·위치·지적·우선순위·보고·추적 | 기존 `scope`와 `item/result/action/owner`, `inspector`. `inspectionPlan`, 표의 `inspectionLocation/inspectionPriority/actionCloseout`, `inspectionLimits/inspectionReview` 추가. 7열은 가로 출력. 우선순위 등급·주기는 현장 근거를 직접 기입하며 임의 고정하지 않는다. 법정 설비검사·주별 위원회 절차를 대체하지 않는다. |

모든 양식에는 기존 공통 머리말(작업명·장소·날짜·부서·책임자·작업자)이 출력된다. 문서의 실제 확인란은 runtime 또는 blank이며, 정해 둔 작업내용·절차와 구분된다. 이전 저장본에 새 필드를 강제로 삽입하지 않는다.

## 관할 혼입 오류 4개 조합 수정

온타리오 고소·전기·화기 및 사우디 밀폐공간의 `applicableFramework` 입력란이 퀘벡 전용 RSST/CSTC 문구를 재사용했다. 키는 기존 자료와 호환되게 보존하고 표시 문구만 `frameworkBasis`로 분리했다. 퀘벡 4개 조합에는 RSST/CSTC 명칭을 유지한다. 이 수정으로 사우디의 시행일·업종별 허가 요건 미해결 상태를 종결하지 않는다.

## ③ 10언어 의미 검수

신규 12개 문구를 한국어·영어·독일어·일본어·프랑스어·이탈리아어·스페인어·아랍어·포르투갈어·러시아어에서 대조했다. 대응 그룹은 `actionCloseout`, `permitCoordination`, `briefingFollowup`, `inspectionPlan`, `inspectionLocation`, `inspectionPriority`, `inspectionLimits`, `inspectionReview`, `frameworkBasis`, `hazardScenario`, `usBaseScope`, `briefingScope`다.

- 완료 **상태**와 실제 **완료**를 구분하며 승인이나 적합 판정을 자동 부여하지 않는다.
- 효과 확인자, 질문의 미해결 상태, 근로자에 대한 결과 전달, 작업 상호 의존성의 의미를 각 언어에 유지한다.
- 점검팀과 시간·범위, 미점검 구역, 즉시 위험에 대한 조치·보고, 반복 지적 여부를 생략하지 않는다.
- 법령/절차의 **판본**은 도면 개정번호와 다르고, 일반 관할 문구에 타국 법령 약자를 넣지 않는다.
- JHA의 노출 대상·원인·결과와 추상적 위험등급을 구분한다. 교육을 대신하지 않는다는 문구는 법정 교육의 면제나 회의 개최 의무의 추가 선언이 아니다.

## 확인 방법과 종결 기록

### 기존 전문용어 33개 추가 검수

위 신규 문구와 별도로 기존 `requirementReviewText.js`의 아래 33개 그룹을 10언어에서 대조했다. 해당 작업의 법령 적용 종결과 구분하여 문구 의미만 종결한다.

- 조정·평가·구조·측정·현장 절차 9개: `employerCoordination`, `assessmentEndorsement`, `planReference`, `rescueReadiness`, `atmosphericBasis`, `applicableFramework`, `jointHazardRecord`, `scaffoldInspection`, `siteProcedure`.
- 적용·시행·교육 증빙 5개: `stateCodeBasis`, `trainingDelivery`, `ladderAssessment`, `transitionEvidence`, `applicableEdition`.
- 허가·기록·역할·재검토 19개: `permitDisplay`, `countryProcedure`, `permitCloseout`, `permitRecord`, `dailyReview`, `licenceScope`, `entryAuthorisation`, `spaceClass`, `shiftVerification`, `permitTrigger`, `shiftAuthorisation`, `restartReview`, `rescueLeadership`, `measurementCompetence`, `trainingEvidence`, `retestTriggers`, `employerAuthorisation`, `voltageRole`, `routineClassification`.

실제 수정은 12개 키의 25개 언어별 문구다. 프랑스어·아랍어에서 Ontario `lead employer/constructor` 역할을 원어와 함께 보존했다. 구조 장비의 점검 **기록**, 평가자의 역량 증빙, 사다리 경과조치의 설치·설계승인·계약·시공 **날짜**를 복원했다. 독일어 주(州)를 국가와 구분하고 고용주 발급 작업권한을 일반 작업허가와 구분했다. 면허 유효성·출입허가 적용·기존 교육 인정의 대상을 더 명확히 했다. 프랑스어 전압 제거를 전체 consignation 절차와 동일시하지 않게 수정했고, 러시아어 비일상 작업을 비상/이상 작업으로 번역하던 표현을 수정했다. 나머지 21개 그룹은 조건·역할·시점·행위의 의미가 유지되어 문구 변경 없이 검수 기록만 추가했다.

전체 언어별 대조는 단순 번역 존재 여부가 아니라 위 의미 구분을 확인한 것이다. 날짜·기간을 정하는 각 국가의 법령 안내 문구 25개는 이번 33개에 포함되지 않는다.

`regional-form-review.test.js`는 10종×10언어의 실제 값 초기화·표 열 초기화·복제 독립성·이전 출력본 보존, 관할 분리, 출력 크기, 출처의 범위 보존을 검사한다. 전체 기존 회귀검사와 빌드도 수행한다. 소스/문구/입력 모드/출력 코드가 바뀌면 재검토가 필요하도록 양식 전체와 렌더러의 해시를 고정한다.

`regional-form-closures.json`의 10개 기록은 위 공식 근거에 대한 일반 양식 필드 대조의 종결이다. 국가별 특수 작업 72종과 미해결 법령 원문 13종의 진행 상태는 변경하지 않는다. 양식 종결 기록은 프로그램이 생성만 했다는 이유로 부여하지 않고 이 표의 개별 대조에 연결한다. 검수 해시는 변경 감지 수단이며 법적 인증이나 독립적인 현지 전문가 승인 표시가 아니다.

DB·공개 JSA·Case Study·guideline 콘텐츠·배포에는 변경이 없다.

## 검증 결과

- 자동검사 184개 통과, Vite 클라이언트 빌드 856개 모듈 통과, 변경 JS/테스트 ESLint 및 diff 검사 통과. 기존 번들 크기 안내는 남아 있다.
- 격리 브라우저: CA 기본 묶음, GB 기본 묶음+PTW의 저장 요청·모바일 편집·검토 체크·실제 PDF 바이트 생성·출력 스냅샷 보존을 확인했다. 외부 API와 저장소는 테스트 응답으로 대체했으며 실제 DB 쓰기는 수행하지 않았다.
- CA 가로 7열 점검표 전체 미리보기의 글자·표 배치를 확인하고 문서 가로 넘침 검사도 통과했다. 모든 국가·언어 PDF의 시각 검수나 실물 인쇄 검증을 완료한 것은 아니다.
- 브라우저 검증의 화면 진입 대기와 재렌더 중 버튼 찾기/클릭 경쟁 상태를 수정했다. 테스트 종료 후 기존 Puppeteer가 Windows에서 남기는 Access denied 메시지는 종료 정리 단계의 메시지이며 위 검증은 종료 코드 0으로 통과했다.
