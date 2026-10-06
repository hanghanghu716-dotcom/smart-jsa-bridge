# ② 싱가포르 양식 · ③ 44개 문구 검수 — 2026-10-05.9

대상은 작업별 서류 묶음의 일반 작업용 기본 양식이다. 기존 GB·US·CA 10종에 SG 4종의 필드별 종결 기록을 추가한다. 특수작업 72개 조합의 전체 종결, 사업장 법적 적합성 인증, 실제 계정 검증을 완료한 것으로 확대하지 않는다. Case Study·guideline·DB·운영 배포는 변경하지 않았다.

## ② 필드와 공식 근거

2026-10-05에 [WSHC Risk Management Code of Practice, 2021 3차 개정](https://www.tal.sg/wshc/-/media/tal/wshc/resources/publications/codes-of-practice/files/code-of-practice-risk-management-third-revision-2021.pdf)의 §§4–10, Appendix B·E와 아래 회의 자료를 대조했다. 기존 MOM/법령 출처는 유지하고 이번 출처의 범위·확인일을 별도 저장한다.

| 양식 | 실제 입력·출력 필드 | 근거 범위와 보완 |
|---|---|---|
| SG RA | 공통 작업명/장소/부서, scope, sgRiskScope, hazard/persons/controls/further, matrix, 평가팀·승인자, reviewPlan, sgRiskCommunication/Record, recordCustodian | §§4–6·8–10, Appendix B. 기존 범위·대책·기록 필드를 유지. sgAssessmentRegister에 평가 식별·검토일, sgApprovalRecord에 책임자의 직책·승인일·서명 보강. |
| SG RA | sourceRisk, 별도 sgInitialRisk/sgResidualRisk 표, owner, controlReview, actionCloseout | §§6.4·6.6·7. 원본 점수는 근거로 보존하고 현장 평가 두 칸은 공란. 적용 행렬에 따른 중대성/가능성/위험도를 새로 기록하며 조치 효과 확인을 연결. 5×5 행렬이나 승인 판정을 자동 강제하지 않음. |
| SG SWP | scope/equipment/ppe, sequence, competency, emergency, monitoring, consultation/approval, sgProcedureReview | §4.3.2·7.2, Appendix E. RA 연결, 절차 개정, 실행 확인자·확인일·다음 검토를 추가. 실제 순서·책임·보호구·비상조치와 함께 작성. |
| SG Toolbox Meeting | 오늘의 hazards/controls, changes, actions, attendance/leader, sgBriefingReadiness/Understanding, briefingFollowup | 아래 WSHC 자료의 준비·소통·피드백 범위. 이해 가능한 언어·통역·SWP 시연·질문·다음 회의 후속조치를 기록. 교육·자격을 대체하지 않음. |
| SG Inspection | scope, inspectionPlan, 항목/위치/결과/개선/담당·기한/우선순위/actionCloseout, inspector, inspectionLimits/Review | §7.2.5의 대책 실행·효과 확인을 위한 작업용 점검. 위치·조치 결과를 연결하고 누락 구역·미완료 조치를 추적. 법정 설비검사, 검사원 자격, 업종별 주기 또는 서식을 지정하지 않음. |

회의 근거: [ABC checklist](https://www.tal.sg/wshc/-/media/tal/wshc/resources/publications/checklists-and-articles/files/abc_checklist_effective_toolbox_meetings_english.pdf), [Guide to Effective Toolbox Meeting, 2017](https://www.tal.sg/wshc/-/media/tal/wshc/resources/publications/guides-and-handbooks/files/toolbox_meeting_guide.pdf). 오래된 가이드의 체온·음주 판별 예시와 일률적인 보호구 목록은 도입하지 않는다. 준비 상태 확인은 임상정보 수집이나 자동 적합 판정이 아니다. 안내된 회의 주기를 모든 업종의 법정 의무로 표시하지 않는다.

## ③ 문구별 의미 대조

`requirementReviewText20261005.js`의 기존 **36개 키 × 10언어**를 읽고, 기존 [조항 검수 기록](regional-requirements-review-20261005.md) 및 [싱가포르 후속 기록](regional-singapore-review-20261005.md)에 명시된 의미·범위와 대조했다. 새 `singaporeFormText20261005.js`의 **8개 키 × 10언어**도 포함한다. 이 44개만 새로 종결하며 새 키 때문에 ③ 분모가 483→491로 늘어난다.

| 검수 묶음 | 개별 키 | 의미 확인·수정 |
|---|---|---|
| 장비·차단·승인 | equipmentRelease, isolationVerification, restorationRelease, hotAuthorisation, watchCloseout | 확인자·역송전, 잠금 해제 권한자·예외 근거·통지 기록, 화기작업 구역의 의미를 FR/IT/ES/PT/RU에서 보완. 모든 번역의 점검·회수·재사용 및 실제 감시시간 확인. |
| 고소·용기·역할 | fragileSurface, fallingObjects, containerHistory, roleSeparation, permitCoverage | 독일어 취약 지붕의 식별을 명시. 낙하물 통제, 내용물 이력, 현지 역할 구분, 위치별 위험·유효기간 근거 유지. |
| 미국·영국·싱가포르 안내 | usHeightNotice, usIsolationNotice, usHotNotice, gbHeightNotice, gbIsolationNotice, gbHotNotice, sgHeightReviewNotice | 미국 일반산업, 600 V 초과 시험기 조건, 조건부 화재감시·서면 권장, 영국 집단방호·검전, 싱가포르 역할 겸임·7일 안내의 범위를 각 언어에서 보존. FR/ES/PT의 역송전 용어 명료화. |
| 한국·일본 개별 항목 | fallProtectionBasis, ladderConditions, anchorCheck, ropeWorkPlan, electricalEligibility, isolationSequence, lockRemoval, workLeader, restorationNotice, fireWatchBasis, fireBlanket, oxygenExclusion, jpIsolationChoice | 사다리 조건, 확인자, 설치 근로자의 해제, 지휘자, 적용 시 접지·화재감시, 산소 환기 금지의 조건을 유지. 한국 잠금 **및** 표지와 일본 잠금 **또는** 표시 **또는** 감시인을 혼합하지 않음. |
| 한국·일본 안내 | krHeightDetail, krElectricalDetail, krHotDetail, jpHeightDetail, jpElectricalDetail, jpHotDetail | 높이 미만 자동 안전 판정 금지, 국가별 잠금 제거·감시시간 차이, 일본 作業指揮者/作業主任者 구분을 보존. 법률 자체의 새 전수검수가 아니라 기존 검수된 안내의 10언어 의미 종결. |
| 신규 SG | sgAssessmentRegister, sgRiskEvaluation, sgInitialRisk, sgResidualRisk, sgApprovalRecord, sgProcedureReview, sgBriefingReadiness, sgBriefingUnderstanding | 평가·재평가·승인·검토·회의 이해의 차이를 10언어로 작성·대조. 문서 언어가 바뀌어도 관할과 RA/SWP 정체성 유지. |

한국 기본 RA/TBM 양식의 최종 종결은 이번 4종에 포함하지 않는다. [MOEL 2024-76 고시](https://www.moel.go.kr/info/lawinfo/instruction/view.do?bbs_seq=20241201150)와 [2026-461 행정예고](https://moel.go.kr/info/lawinfo/lawmaking/view.do?bbs_seq=20260900747)를 구분했으며, 개정안을 시행 규정으로 적용하지 않았다.

## 버전·검증 범위

- SG 신규 기본 양식 4종과 변경된 작업 안내의 버전은 `.9`. 변화 없는 타국 기본 양식은 `.8` 유지. 이전에 종결한 10개 양식의 내용·렌더러 해시는 그대로 통과해야 한다.
- 현재값·측정값·승인은 runtime/blank로 시작한다. 표준 내용으로 잘못 저장해도 새 작업과 복제에서 제거된다. 원본 점수·작업내용과 과거 저장본의 구조·버전은 보존한다.
- 필드·표·언어·근거·렌더러를 포함한 10언어 생성 결과를 종결 해시로 고정한다. 해시나 생성 시험만으로 의미 검수를 대신하지 않는다.
- 전체 자동시험 187개, Vite 제품 빌드(857개 모듈), 변경 JavaScript ESLint 및 검수 목록·해시 일치 검사를 통과했다.
- 격리 브라우저에서 SG 관할의 영어·프랑스어·아랍어 문서를 생성했다. 저장 요청, 모바일 편집, 검토 확인 전 출력 제한, 실제 PDF 생성과 출력 스냅샷을 확인했다. 각 9쪽, 총 27쪽을 Poppler로 렌더링하여 표 잘림·빈 페이지를 확인했다. 아랍어 점수의 LTR 방향과 모든 미리보기의 가로 넘침 검사도 통과했다.
- 영어 fixture는 RA 3쪽·SWP 2쪽·회의 2쪽·점검 2쪽으로 확인하여 이전 6쪽 기대값을 9쪽으로 갱신했다. 문서 언어를 화면/관할과 별도로 선택하는 브라우저 시험도 추가했다.
- 기존 번들 크기 경고와 구버전 Puppeteer의 Windows 종료 시 `Access denied` stderr는 남는다. 브라우저 기능 검사는 PASS·종료 코드 0이다. 실제 계정·운영 DB·실물 인쇄 검증은 이번에 반복하지 않았다.
