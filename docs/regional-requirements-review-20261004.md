# ② 세부 요건 · ③ 전문용어 추가 검수 — 2026-10-04

이번 코드 버전: `2026-10-04.1`. 대상 목록은 기존과 같은 **14개국·18개 국가/지역·10개 언어**다. ⑤의 계정·화면 시험을 먼저 확대하지 않고, 기존 양식의 근거와 용어부터 수정했다.

이번에 **16개 국가/지역의 17개 작업 조합에 32개 현장 입력란**을 추가했다. 해당 안내와 입력란은 10개 언어로 제공한다. 이는 아래 표의 조항·안내 범위를 검수한 결과이며, 18개 관할 × 4개 작업의 모든 업종·예외·자격·현행 개정사항을 검수 완료했다는 뜻은 아니다. 사우디·러시아는 자료를 재확인했지만 확정할 수 없는 허가 요건을 새로 넣지 않았다.

## 현재 단계

| 단계 | 현재 상태 |
|---|---|
| ① 지원 범위 | 완료, 18개 설정 유지 |
| ② 세부 요건 | 이번 표의 추가 대조·양식 수정 완료. 아래 미해결 조항과 관할별 나머지 작업의 세부 검수는 진행 중 |
| ③ 전문용어 | 이번 변경 문구와 역할 구분 검수·10개 언어 반영 완료. 기존 전체 용어의 전수 검수 완료는 아님 |
| ④ 저장·복제·출력 연결 | 추가 입력값 초기화, 근거·버전·복제 독립성 회귀시험 통과. 실제 출력 배치 재검증은 남음 |
| ⑤ 실제 사용 | 이번 작업에서는 재개하지 않음. 앞선 계정 검증 결과는 유지하되 국가별 최종 사용 검증 완료로 계산하지 않음 |

## 확인한 차이와 양식 반영

| 관할 / 작업 | 확인 내용과 코드 반영 | 공식 근거 |
|---|---|---|
| 한국 / 밀폐 | 제619조 사전 확인 내용의 출입구 게시·종료 시점 입력. 제626조 등의 예외를 일괄 배제하지 않음 | [안전보건규칙 제619조제3항, 시행 2026-03-02](https://www.law.go.kr/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1028543703) |
| 영국 / 밀폐 | GB/NI 관할·현장 절차 입력. NI도 L101 제3판을 승인했음을 반영하되 별도 법령 유지 | [HSENI, 2022-03-21부터 L101 승인](https://www.hseni.gov.uk/news/hseni-approves-two-revised-acops-l101-and-l113-use-northern-ireland) |
| 호주 / 밀폐 | 작업 완료·전원 퇴장 확인, 허가/평가 기록 담당·위치·보존·사고 여부 입력 | [SWA 모델 코드, 2024-11](https://www.safeworkaustralia.gov.au/sites/default/files/2024-11/model_code_of_practice-confined_spaces-nov24.pdf) |
| 싱가포르 / 밀폐 | authorised manager의 일일 재검토, 게시 확인. 일일 검토로 만료 허가가 연장되는 것처럼 표현하지 않음 | [WSHC Technical Advisory §7.6](https://www.tal.sg/wshc/-/media/tal/wshc/resources/publications/technical-advisories/files/cs2.ashx) |
| 싱가포르 / 전기 | 조선업 지침만으로 전기 면허를 설명하던 범위를 보완. LEW 면허 유효성·종류·전압·부하·감독 범위 입력 | [EMA, Engaging Licensed Electrical Workers](https://www.ema.gov.sg/consumer-information/electricity/engaging-licensed-workers) |
| 미국 / 밀폐 | 일반산업 1910.146의 감독자 서명 승인, 종료·취소 및 취소된 허가 최소 1년 보관 안내 | [OSHA 1910.146(e), (f), (j)](https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.146) |
| 캐나다 공통 / 밀폐 | 실제 연방·주 관할, 적용 허가 절차와 기록 보관 입력. 전국 공통 의무로 고정하지 않음 | [CCOHS, Confined Space — Program](https://www.ccohs.ca/oshanswers/hsprograms/confinedspace/confinedspace_program.html) |
| Alberta / 밀폐 | confined/restricted 분류, 적격자 서명, tending worker 구분. 기록 최소 1년, 사고·예기치 못한 사건 시 최소 2년 안내 | [OHS Code Part 5, §§47/56/58](https://search-ohs-laws.alberta.ca/legislation/occupational-health-and-safety-code/part-5-confined-spaces/) |
| Ontario / 밀폐 | 교대 전 적격자의 계획 대조. 서명·출입구 게시 자체를 법적 필수로 강제하지 않음. 별도 보존 기록란 추가 | [Entry permit](https://www.ontario.ca/document/guideline-working-confined-spaces/entry-permit), [Documents](https://www.ontario.ca/document/guideline-working-confined-spaces/documents) |
| British Columbia / 밀폐 | §9.13 허가 대상 확인, 인원·교대·책임 감독자 변경 시 재승인·서명, 최소 1년 보관 안내 | [WorkSafeBC Part 9, §§9.13–9.16](https://www.worksafebc.com/en/law-policy/occupational-health-safety/searchable-ohs-regulation/ohs-regulation/part-09-confined-spaces) |
| Québec / 밀폐 | 예상 밖 위험으로 중단한 뒤 적격자 재평가, surveillant와 구조 지휘자·통신·훈련 구분 | [공식 RSST PDF, §§308–309](https://www.legisquebec.gouv.qc.ca/fr/pdf/rc/S-2.1%2C%20R.%2013.pdf) |
| 독일 / 밀폐 | Freimessen의 전문성·지정 근거를 별도 입력. 이후 Sicherungsposten의 연속 감시와 동일 자격으로 취급하지 않음 | [DGUV 113-004, §§4.3.5.3–4.3.5.5](https://publikationen.dguv.de/widgets/pdf/download/article/915) |
| 일본 / 밀폐 | 제1종·제2종 분류, 작업주임자 교육 근거, 시작·재입장·이상 발생 시 재측정 기록 | [酸素欠乏症等防止規則 第11条](https://www.mhlw.go.jp/web/t_doc?dataId=74105000&dataType=0&pageNo=1) |
| 프랑스 / 전기 | 교육 이수와 고용주 발급 habilitation 구분. 기호·전압·설비·제한 입력 | [INRS Habilitation FAQ](https://www.inrs.fr/risques/electriques/habilitation-electrique-foire-aux-questions) |
| 이탈리아 / 밀폐 | 과거 교육 자동 인정 방지. ASR 59/2025 교육 내용 대조·인정 근거 기록 | [노동부 FAQ 2026-03-27, Q26–28](https://www.lavoro.gov.it/temi-e-priorita-salute-e-sicurezza/focus/faq-accordo-stato-regioni-27032026) |
| 스페인 / 전기 | 차단·복전의 autorizado, 고압의 cualificado 구분. 저압/고압·담당 역할 기록. 활선 승인으로 전용하지 않음 | [RD 614/2001, Anexo II A.1](https://boe.es/buscar/act.php?id=BOE-A-2001-11881) |
| 브라질 / 고소 | 일상/비일상 분류, AR/PT 연결, 교대/근무일 유효기간과 동일 조건·팀의 재승인, 최소 5년 보관 안내 | [NR-35, §§35.3.1(j), 35.5.7–35.5.8.2](https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-35-atualizada-2025-1.pdf) |
| 사우디 / 재검토 | HRSD 원문은 용접·정비·전기·추락 관련 일반 예방 지침. 국가 전체에 적용되는 밀폐공간 허가·면허 규정이라는 근거는 확보하지 못함. 기존 부분 검수 표시 유지 | [HRSD 원문 PDF](https://www.hrsd.gov.sa/sites/default/files/2023-02/30122022_0.pdf) |
| 러시아 / 재검토 | Минтруд의 902н 원 게시문은 여전히 과거 종료일을 표시. 최신 개정 공표 전문 접근 실패. 과거 날짜로 현재 무효/유효를 판정하지 않음 | [원 게시문](https://mintrud.gov.ru/docs/mintrud/orders/1810), [개정 공표 위치](https://publication.pravo.gov.ru/document/0001202505300025) |

## ③에서 수정한 번역·용어 문제

- 일본어로 작성한 외국 현장 문서에도 일본의 법적 `作業主任者`가 붙던 공통 역할명을 `作業責任者`로 수정했다. 일본 관할의 원어 용어줄에는 작업주임자를 유지한다.
- 공통 일본어 작업명은 `閉所作業`으로 수정했다. 문서 언어만으로 일본의 산소결핍 위험작업 해당 여부가 결정되지 않는다.
- 영어 공통 역할은 `entry supervisor` 대신 일반적인 `person in charge`를 사용한다. 미국 관할의 법정 역할줄에는 `entry supervisor`를 유지한다.
- 포르투갈어 공통 역할에서도 브라질 NR-33의 세 역할을 자동 지정하지 않는다. 브라질의 원어 역할줄에는 `trabalhador autorizado / vigia / supervisor de entrada`를 유지한다.
- 싱가포르 전기 원어 역할을 `Licensed Electrical Worker (LEW)`와 세 면허 종류로 구체화했다. 프랑스와 퀘벡의 `habilitation / consignation / cadenassage` 구분도 유지했다.
- 추가된 안내·입력 항목 36개 키를 한국어·영어·독일어·일본어·프랑스어·이탈리아어·스페인어·아랍어·포르투갈어·러시아어로 작성했다. 기계적인 누락 검사는 번역의 전문적 적합성 인증과 구분한다.

## 아직 확정하지 않은 구체적 항목

1. **호주**: 주/준주별 모델 코드 채택과 면허 조건. SWA 2024 모델 PDF의 허가 기록 보존 설명은 사고 후 기간의 기산점을 작업 종료로 적고, [SWA 현행 안내](https://www.safeworkaustralia.gov.au/duties-tool/construction/hazards-information/confined-spaces)는 사고 발생일로 설명한다. 지역 규정 대조 전 숫자·기산점을 자동 기본값으로 넣지 않았다.
2. **Ontario**: 공식 안내의 색인된 본문을 읽어 교대 확인·기록 보존을 확인했지만, 현행 통합 규정 직접 열람은 실패했다. 비건설은 작성 후 1년과 최근 두 기록 유지에 필요한 기간 중 긴 기간, 건설은 프로젝트 종료 후 1년이라는 안내를 근거 메타데이터에 남겼다. 프로그램·다중 고용주 조정 문서는 개별 허가서와 별도다.
3. **Québec**: 확보한 공식 통합 PDF는 2025-07-15 기준이다. 2026 현재 통합 HTML과 CSTC 건설업 차이의 전수 대조는 미완료다.
4. **브라질**: 파일명은 `2025`지만 본문 개정 이력에 Portaria 1259/2026이 포함된 것을 확인했다. PT 생명주기 조항은 반영했으나 새 교육 방식·수직사다리의 시행/경과조건 전체는 아직 확정하지 않았다. 이 때문에 고소 전체를 검수 완료 상태로 올리지 않았다.
5. **러시아**: 2025 개정 공표의 전체 내용을 공식 원문으로 확보하지 못했다. 다른 명령(예: 881н·882н)의 연장 사례로 782н·902н·903н을 추정하지 않는다.
6. **사우디**: HRSD 일반 예방 지침과 업종·면허·발주처별 의무 규정을 구별해야 한다. 작업허가 판정에 필요한 구체적 현행 근거 미확보 상태를 유지한다.
7. 이 표에 없는 작업/관할 조합과 기존 보고서의 업종·설비별 예외는 이번에 검수했다고 재표시하지 않는다. 다음 검수도 **②·③에서 이 범위를 먼저 좁히고**, 그 후 ④·⑤로 진행한다.

## 보존·검증

- 기존 DB 테이블을 그대로 사용한다. 신규 허가서에만 새 항목이 들어간다. 기존 양식·출력 당시 데이터는 덮어쓰지 않는다.
- 확인자·측정·서명·재승인·현장 기록은 매 작업 입력값이다. 재사용 값으로 모드를 바꿔도 저장 정리 과정에서 과거 값이 제거되는지 시험했다.
- 기존 자료 검수일 `2026-10-03`과 이번 추가 근거 검수일 `2026-10-04`를 구분한다. 양식 버전 갱신으로 모든 자료를 재검수했다고 표시하지 않는다.
- 자동시험 **152개 통과**, Vite 빌드 통과. 18개 관할 × 10개 문서 언어에서 추가 문구·국가별 항목의 적용을 확인했다. 국가 간 혼입, 신규 작업 값 초기화, 독립 복제, 출력 당시 근거 보존을 포함한다.
- 테스트 환경의 기존 HMR 포트·i18next 경고 및 기존 번들 크기 경고가 있었지만 실패한 검사는 없다. 이번에는 실제 PDF·실제 계정 검증을 새로 수행하지 않았다.
