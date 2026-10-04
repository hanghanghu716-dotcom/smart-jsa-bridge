# ② 세부 요건 · ③ 전문용어 추가 검수 — 2026-10-04

이번 코드 버전: `2026-10-04.3`. 대상 목록은 기존과 같은 **14개국·18개 국가/지역·10개 언어**다. ⑤의 계정·화면 시험을 먼저 확대하지 않고, 기존 양식의 근거와 용어부터 수정했다.

누적 **18개 국가/지역의 22개 작업 조합에 50개 현장 입력란**을 추가했다. 해당 안내와 입력란은 10개 언어로 제공한다. 이는 아래 조항·안내 범위를 검수한 결과이며, 18개 관할 × 4개 작업의 모든 업종·예외·자격·현행 개정사항을 검수 완료했다는 뜻은 아니다. 사우디 비계 지침과 러시아 규정 연장 안내도 반영했지만, 해당 국가의 전체 허가 요건 검수를 완료한 것은 아니다.

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
| Ontario / 밀폐 | 허가서 교대 확인과 사전 평가서 서명·날짜를 구분. 다중 고용주 조정, 계획 참조, 교육, 즉시 구조 준비, 작업별 대기 기준 및 기록 보존 입력란 추가 | [현행 632/05](https://www.ontario.ca/laws/regulation/050632), [Entry permit](https://www.ontario.ca/document/guideline-working-confined-spaces/entry-permit) |
| British Columbia / 밀폐 | §9.13 허가 대상 확인, 인원·교대·책임 감독자 변경 시 재승인·서명, 최소 1년 보관 안내 | [WorkSafeBC Part 9, §§9.13–9.16](https://www.worksafebc.com/en/law-policy/occupational-health-safety/searchable-ohs-regulation/ohs-regulation/part-09-confined-spaces) |
| Québec / 밀폐 | 예상 밖 위험으로 중단한 뒤 적격자 재평가, surveillant와 구조 지휘자·통신·훈련 구분 | [공식 RSST PDF, §§308–309](https://www.legisquebec.gouv.qc.ca/fr/pdf/rc/S-2.1%2C%20R.%2013.pdf) |
| 독일 / 밀폐 | Freimessen의 전문성·지정 근거를 별도 입력. 이후 Sicherungsposten의 연속 감시와 동일 자격으로 취급하지 않음 | [DGUV 113-004, §§4.3.5.3–4.3.5.5](https://publikationen.dguv.de/widgets/pdf/download/article/915) |
| 일본 / 밀폐 | 제1종·제2종 분류, 작업주임자 교육 근거, 시작·재입장·이상 발생 시 재측정 기록 | [酸素欠乏症等防止規則 第11条](https://www.mhlw.go.jp/web/t_doc?dataId=74105000&dataType=0&pageNo=1) |
| 프랑스 / 전기 | 교육 이수와 고용주 발급 habilitation 구분. 기호·전압·설비·제한 입력 | [INRS Habilitation FAQ](https://www.inrs.fr/risques/electriques/habilitation-electrique-foire-aux-questions) |
| 이탈리아 / 밀폐 | 과거 교육 자동 인정 방지. ASR 59/2025 교육 내용 대조·인정 근거 기록 | [노동부 FAQ 2026-03-27, Q26–28](https://www.lavoro.gov.it/temi-e-priorita-salute-e-sicurezza/focus/faq-accordo-stato-regioni-27032026) |
| 스페인 / 전기 | 차단·복전의 autorizado, 고압의 cualificado 구분. 저압/고압·담당 역할 기록. 활선 승인으로 전용하지 않음 | [RD 614/2001, Anexo II A.1](https://boe.es/buscar/act.php?id=BOE-A-2001-11881) |
| 브라질 / 고소 | 일상/비일상 분류, AR/PT 연결, 교대/근무일 유효기간과 동일 조건·팀의 재승인, 최소 5년 보관 안내 | [NR-35, §§35.3.1(j), 35.5.7–35.5.8.2](https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-35-atualizada-2025-1.pdf) |
| 사우디 / 고소 | HRSD 비계 지침의 사용 전·매일 적임자 점검, 사용 제한과 현장 절차 확인란 추가. 일반 지침을 법정 허가·자격으로 승격하지 않음 | [비계 지침 PDF](https://www.hrsd.gov.sa/sites/default/files/2026-03/dlyl-astrshady-hwl-astkhdam-alsqalat-anjlyzy.pdf) |
| 러시아 / 고소·밀폐·전기 | 지방정부 고용센터 공지에서 782н·902н·903н 연장 확인. 실제 작업일의 적용 판본 기록란 추가. 개정 전문 검수 완료와 구분 | [공식 고용센터 공지](https://kanevskadm.ru/news/mintrud-rossii-prodlil-srok-deystviya-pravil-po-okhrane-truda/), [개정 공표 위치](https://publication.pravo.gov.ru/document/0001202505300025) |

## ③에서 수정한 번역·용어 문제

- 일본어로 작성한 외국 현장 문서에도 일본의 법적 `作業主任者`가 붙던 공통 역할명을 `作業責任者`로 수정했다. 일본 관할의 원어 용어줄에는 작업주임자를 유지한다.
- 공통 일본어 작업명은 `閉所作業`으로 수정했다. 문서 언어만으로 일본의 산소결핍 위험작업 해당 여부가 결정되지 않는다.
- 영어 공통 역할은 `entry supervisor` 대신 일반적인 `person in charge`를 사용한다. 미국 관할의 법정 역할줄에는 `entry supervisor`를 유지한다.
- 포르투갈어 공통 역할에서도 브라질 NR-33의 세 역할을 자동 지정하지 않는다. 브라질의 원어 역할줄에는 `trabalhador autorizado / vigia / supervisor de entrada`를 유지한다.
- 싱가포르 전기 원어 역할을 `Licensed Electrical Worker (LEW)`와 세 면허 종류로 구체화했다. 프랑스와 퀘벡의 `habilitation / consignation / cadenassage` 구분도 유지했다.
- 추가된 안내·입력 항목 58개 키를 한국어·영어·독일어·일본어·프랑스어·이탈리아어·스페인어·아랍어·포르투갈어·러시아어로 작성했다. 기계적인 누락 검사는 번역의 전문적 적합성 인증과 구분한다.

## 아직 확정하지 않은 구체적 항목

1. **호주**: 주/준주별 모델 코드 채택과 면허 조건. SWA 2024 모델 PDF의 허가 기록 보존 설명은 사고 후 기간의 기산점을 작업 종료로 적고, [SWA 현행 안내](https://www.safeworkaustralia.gov.au/duties-tool/construction/hazards-information/confined-spaces)는 사고 발생일로 설명한다. 지역 규정 대조 전 숫자·기산점을 자동 기본값으로 넣지 않았다.
2. **Ontario**: .3에서 공식 e-Laws API의 현행 632/05 전문을 확보하여 기존 접근 문제를 해소했다. 밀폐공간 관련 4–21조를 대조했으며, 예외 작업·타 작업 종류의 세부 검수까지 완료했다는 뜻은 아니다. 프로그램·다중 고용주 조정 문서는 개별 허가서와 별도다.
3. **Québec**: RSST는 2025-07-15, CSTC는 2025-09-01 기준 공식 색인본을 확인했다. 사업장/건설현장 구분과 공동 위험 확인을 추가했다. 2026 현재 통합 원문 확보와 전체 차이 대조는 미완료이므로 밀폐공간 상태를 부분 검수로 명시했다.
4. **브라질**: 아래 후속 검수에서 교육 방식·수직사다리 경과조치 원문을 확보했다. 기존 사다리 예외의 기준일 해석과 실제 현장별 증빙 충족 여부는 자동 판정하지 않는다. 고소 전체의 검수 상태는 여전히 부분 검수다. 미래 시행 NR-10은 시행일 구분을 반영했으며, 새 판본 전체의 상세 양식 대조까지 끝났다는 뜻은 아니다.
5. **러시아**: 지방정부 고용센터 공지가 782н·902н·903н 각각을 명시하여 연장 확인은 해소했다. 287н 전문과 후속 개정 전체 대조는 남아 있어 부분 검수 상태를 유지한다. 화기 항목은 이번 연장 안내 적용 대상에 넣지 않았다.
6. **사우디**: HRSD 비계 지침을 직접 검토하고 점검 항목을 반영했다. 업종·면허·발주처별 의무 규정과 구별하며, 국가 전체에 적용되는 작업허가 요건을 확정한 것으로 표시하지 않는다.
7. 이 표에 없는 작업/관할 조합과 기존 보고서의 업종·설비별 예외는 이번에 검수했다고 재표시하지 않는다. 다음 검수도 **②·③에서 이 범위를 먼저 좁히고**, 그 후 ④·⑤로 진행한다.

## 같은 날 후속 검수 — 버전 .2

- **브라질 NR-35**: 앞서 열리지 않았던 관보 대신 [MTE가 게시한 Portaria 1.259/2026 원문](https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/seguranca-e-saude-no-trabalho/sst-portarias/2026-1/portaria-mte-no-1-259-alteracao-do-anexo-iii-da-nr-35.pdf)을 직접 대조했다. 2026-07-16 시행, NR-35 대면교육과 초기교육 재이수/부족 대면시간 보완의 1년 경과조치를 구분한다. 사다리 위험성평가, SPIQ 전문가, 설치·프로젝트 증빙, 단위별 사다리 수·적용 기한을 기록하는 3개 항목을 추가했다. Art.7의 단계별 시행과 Art.6의 기존 사다리 예외는 자동 승인값으로 만들지 않는다. 원문 머리말은 1680의 연도를 2026으로 적지만 실제 개정 조문 Art.6은 2025로 적는다. 이 차이도 자동 날짜 판정을 피한 이유다.
- **브라질 NR-10**: [MTE 판본 안내](https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/norma-regulamentadora-no-10-nr-10)와 [Portaria 737/2026 Art.3·5](https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/seguranca-e-saude-no-trabalho/sst-portarias/2026-1/portaria-mte-no-737-nova-nr-10.pdf)를 확인했다. 기존 판본은 2027-05-31까지, 새 판본은 2027-06-01부터다. 기존 설비의 추가 유예는 10.6.4(e)에 한정되며 2028-06-01이다. 실제 작업일·판본·경과근거 입력란을 추가했다. 미래 규정의 비일상작업 PT 요건을 현재 의무로 자동 적용하지 않는다.
- **호주**: [SWA의 지역별 채택 안내](https://www.safeworkaustralia.gov.au/law-and-regulation/legislation)로 Victoria의 별도 OHS 체계와 다른 지역의 모델 변경사항 채택 여부를 구분했다. 실제 주·준주, 적용 법령·판본·조항·확인일 입력란을 추가했다. [Victoria 현행 게시 코드](https://www.worksafe.vic.gov.au/resources/compliance-code-confined-spaces)의 2019 PDF §144는 허가 보관을 작업 완료까지, 신고대상 사고 발생 시 완료일로부터 2년으로 설명한다. 이 내용을 전국 공통 기산점으로 넣지 않았다. NSW 현재 통합 법령 열람은 실패했고, 모든 주의 최신 규정 대조는 남아 있다.
- 추가된 5개 입력 항목·3개 안내를 모두 10개 언어로 제공한다. 총계는 **16개 관할, 18개 작업 조합, 37개 입력란, 44개 번역 키**다. 과거 저장 양식과 출력본은 유지한다.

## 같은 날 후속 검수 — 버전 .3

- **Ontario 공식 현행 원문 확보**: 일반 URL은 브라우저용 빈 HTML만 반환했지만, 그 페이지의 공개 앱이 사용하는 [공식 e-Laws 원문 API](https://www.ontario.ca/laws/api/v2/legislation/en/doc-search/regulation/050632)에서 `state=current`, 통합 시작 2016-07-01, 최종 개정 346/15인 원문을 확보했다. 조회일과 법령의 과거 개정일을 구분한다. §6(7) 평가자 서명·날짜, §10(3) 허가서 교대 확인, §4 다중 고용주 조정은 서로 다른 절차다. §11–12 구조 준비·장비 점검, §18–20 작업별 대기 기준·감시·퇴출, §21 기록 보존도 대조했다. 숫자 하나만으로 안전 판정을 자동 입력하지 않는다.
- **Québec**: [CSTC 공식 색인 PDF](https://www.legisquebec.gouv.qc.ca/fr/pdf/rc/S-2.1%2CR.4.pdf) §3.21.1의 maître d’œuvre·고용주 공동 서면 확인과 현장 비치를 반영했다. RSST 안내를 건설현장에 자동 적용하지 않도록 관할 체계 확인란과 안내를 넣었다. 최신 통합본 확보 실패를 감추지 않도록 `partial-source-review`로 표시한다.
- **사우디**: HRSD 비계 지침 6쪽을 직접 읽고 비계 식별·점검자 역량·당일 점검·결함·사용 제한, 현장 절차 기록란을 추가했다. 원문의 특정 거리·전압 수치를 모든 현장 기본값으로 넣지 않았다. 함께 읽은 Toolbox Talks 입문서는 회의 운영 안내이고 법정 PTW 근거가 아니므로 허가 요건으로 사용하지 않았다.
- **러시아**: 2025-09-03 공식 고용센터 공지의 782н·902н·903н 개별 명시와 2025-09-01 발효, 2031-09-01까지 연장을 확인했다. 근거 종류는 `official-notice`로 저장하고, 기존 `historical-publication`과 구분한다. 개정 전문을 읽었다는 상태로 바꾸지 않았다.
- 이번 추가분은 13개 입력란·14개 번역 키이며 누적 **18개 관할·22개 작업 조합·50개 입력란·58개 번역 키**다. 새 문서는 버전 `2026-10-04.3`을 사용한다.

## 보존·검증

- 기존 DB 테이블을 그대로 사용한다. 신규 허가서에만 새 항목이 들어간다. 기존 양식·출력 당시 데이터는 덮어쓰지 않는다.
- 확인자·측정·서명·재승인·현장 기록은 매 작업 입력값이다. 재사용 값으로 모드를 바꿔도 저장 정리 과정에서 과거 값이 제거되는지 시험했다.
- 기존 자료 검수일 `2026-10-03`과 이번 추가 근거 검수일 `2026-10-04`를 구분한다. 양식 버전 갱신으로 모든 자료를 재검수했다고 표시하지 않는다.
- 자동시험 **157개 통과**, Vite 빌드·수정 JavaScript ESLint 통과. 18개 관할 × 10개 문서 언어에서 추가 문구·국가별 항목의 적용을 확인했다. 국가 간 혼입, 신규 작업 값 초기화, 독립 복제, 출력 당시 근거 보존, 미래 시행일과 조항별 유예 범위 보존, Ontario 평가 서명/허가 교대 확인 분리, Québec·사우디·러시아의 근거 범위 구분을 포함한다.
- 테스트 환경의 기존 HMR 포트·i18next 경고 및 기존 번들 크기 경고가 있었지만 실패한 검사는 없다. 이번에는 실제 PDF·실제 계정 검증을 새로 수행하지 않았다.
