# 국가별 출시 검토표 — 2026-10-01

이 표는 구현에 반영할 운영 요구사항의 초기 검토다. 법률 의견이나 전 세계 적법성 인증이 아니다. 서버 위치, 운영자 소재지, 실제 이용자 대상화, 사업 규모, 개인정보 종류, 광고 방식에 따라 적용이 달라진다. 다국어 UI가 있다는 사실만으로 특정 국가의 법령을 전부 충족하거나 전부 적용받는다고 단정하지 않는다. 지원 언어의 17개 경로도 17개의 서로 독립된 법체계는 아니다.

| 지역 | 출시 전 운영자가 확인할 사항 | 현재 구현과 남은 작업 |
|---|---|---|
| 한국 | 개인정보 처리자 신원·처리방침, 위탁/국외이전의 근거와 고지, 열람/정정/삭제 대응, 저작권·권리침해 게시물 절차. 실제 수익 모델에 따른 사업자등록·세무 판단. | 비공개 접수/사유/이의제기 기능. 신원·연락처·실제 보유기간·수탁자 명세는 미확정. |
| EU/EEA: 독일·프랑스·이탈리아·스페인 등 | GDPR 역외 적용, 처리 근거·권리·이전 보장·역외 대표자 필요성; DSA의 hosting/online platform 분류, 신고·조치와 사유, 접점/대표자·투명성 의무. 소규모 면제는 조항별로 확인. 회원가입을 강제하는 신고 방식의 적합성 검토. | 공개 제한·사유·기록 구현. 비회원 전자 신고, 규정상 필수 양식·연락 경로·기한·대표자·정기 보고 필요성 미확정. 독일 사업자 표시 등 국가별 추가 고지 검토. |
| 영국 | UK GDPR/PECR, Ofcom Online Safety Act 대상 서비스/UK links, 불법 콘텐츠 위험평가, 아동 접근 평가와 관련 의무. 성인 산업 종사자 대상이라는 문구만으로 아동 의무를 배제하지 않음. | 신고 기초 기능. 실제 서비스 분류·위험평가 기록·아동 접근 판단은 운영자 작업. |
| 미국 | 주별 개인정보법의 적용 문턱·권리·광고 opt-out/GPC, 아동 대상/실제 인지 여부에 따른 COPPA 검토. DMCA 면책을 원하면 지정 대리인 등록·공개, 통지/반론 형식과 처리, 반복 침해 정책 등 조건 확인. | 일반 저작권 접수는 있으나 DMCA 등록/완전한 반론 양식/법정 기한 처리 구현 완료가 아님. 새 유료 등록은 수행하지 않음. |
| 캐나다: 연방·AB·BC·ON·QC | PIPEDA와 주법 적용 구분. Alberta/BC 민간 개인정보법 및 Québec Law 25, 책임자, 국외처리 평가·계약. Québec 대상 프랑스어·계약 고지도 검토. ON 경로가 별도 포괄 민간 개인정보법 준수 인증을 뜻하지 않음. | 지역별 언어 경로 제공. Québec 국외이전 영향평가·수탁자 검토와 실제 운영 문서 필요. |
| 호주 | Privacy Act의 적용과 소규모 사업 예외/예외의 예외, APP, 해외 공개, 침해 통지; 온라인 안전·이용자 연령에 따른 별도 의무 검토. | 규모만으로 적용 제외 단정 금지. 개인정보 흐름·사업 형태 확인 필요. |
| 일본 | APPI 적용, 이용 목적·제3자 제공·외국 수령자 관련 정보/동의 또는 요건, 권리 대응과 사고 보고. | 일본어 접수 제공. 실제 해외 수탁자·보호 조치 고지 확인 필요. |
| 브라질 | LGPD 적용·처리 근거·권리·담당자 예외 여부, ANPD 국외이전 메커니즘과 사고 대응. | 포르투갈어 UI 제공. 법적 근거와 이전 계약/고지 검토 필요. |
| 사우디아라비아 | PDPL 역외 적용, 개인정보 처리·이전 규칙·민감정보·담당자 요건 등 해당성. 아랍어 제공만으로 충족하지 않음. | 자동 광고 비활성화. 별도 관할 검토 후 활성화 대상에 추가. |
| 러시아 | 개인정보 현지화·국외이전·관련 등록/통지 및 제재 영향의 현재 적용을 현지 전문가에게 확인. 기존 Supabase 단일 호스팅으로 충족한다고 단정하지 않음. | 지역 설정을 활성화하지 않음. 러시아어 UI와 실제 지역 서비스 허용은 별개이며 현재 기술적 지역 차단은 없음. |
| 그 밖의 국가 | 인도·중국·동남아 등 추가 대상 시장의 개인정보·중개자·소비자·산업 안전·광고 규정 검토. | 미검토 상태. ‘전 세계 준수 완료’ 표시 금지. 광고 허용 목록 기본값은 빈 배열. |

## 공통적으로 사람이 해야 하는 일

- UGC의 저작권·영업비밀·개인정보·안전성 신고를 판단할 책임자를 정한다. 공개 동의 체크박스는 작성자의 권한을 사실상 검증해 주지 않는다.
- 이용자의 업무상 JSA를 안전 인증·법정 작업허가·고용주의 위험성평가 의무를 대신하는 것으로 광고하지 않는다. 법정 의무나 고의·중과실 책임까지 일괄 배제하는 문구를 법률 검토 없이 사용하지 않는다.
- 요청 유형별 신원 확인, 처리 기한, 예외, 외부 통지, 보관기간을 관할별로 기록한다. 불필요한 신분증 수집을 기본값으로 하지 않는다.
- 공개 페이지 삭제와 이미 만들어진 사용자 사본·백업·감사기록의 삭제는 다르다. 정보 열람 JSON은 문서/프로필/요청 자료이며 전체 개인정보 열람 의무를 자동 완결하지 않는다.
- 게시글 품질과 광고 적합성을 별도로 검토한다. 조회수·재사용수·자동 noindex 기준은 Google 승인이나 안전성 심사 기준이 아니다.

## 공식 자료

- 한국: [개인정보보호위원회](https://www.pipc.go.kr/), [개인정보 보호법](https://www.law.go.kr/법령/개인정보보호법), [저작권법](https://www.law.go.kr/법령/저작권법), [산업안전보건법](https://www.law.go.kr/법령/산업안전보건법).
- EU: [GDPR 적용](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/application-gdpr_en), [DSA 공식 안내](https://digital-strategy.ec.europa.eu/en/policies/digital-services-act-package).
- 영국: [Ofcom 서비스 제공자 가이드](https://www.ofcom.org.uk/online-safety/illegal-and-harmful-content/guide-for-services?a=270826), [ICO](https://ico.org.uk/for-organisations/).
- 미국: [Copyright Office Section 512](https://www.copyright.gov/512/), [California Privacy Protection Agency](https://cppa.ca.gov/), [FTC COPPA](https://www.ftc.gov/business-guidance/privacy-security/childrens-privacy).
- 캐나다: [연방 개인정보 감독기구](https://www.priv.gc.ca/en/), [Québec 개인정보 국외 제공 안내](https://www.cai.gouv.qc.ca/protection-renseignements-personnels/information-entreprises-privees/utilisation-communication-renseignements-personnels).
- 호주: [OAIC 스타트업 안내](https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/organisations/start-ups).
- 일본: [PPC 외국 제3자 제공 지침](https://www.ppc.go.jp/personalinfo/legal/guidelines_offshore/).
- 브라질: [ANPD 국제 이전](https://www.gov.br/anpd/pt-br/assuntos/assuntos-internacionais/transferencia-internacional-de-dados/international-affairs).
- 사우디: [SDAIA 개인정보 플랫폼](https://dgp.sdaia.gov.sa/). 러시아: [Roskomnadzor 개인정보 포털](https://pd.rkn.gov.ru/).
- 광고: [Google EEA/영국/스위스 CMP 요구](https://support.google.com/adsense/answer/13554020?hl=en), [UGC 책임](https://support.google.com/adsense/answer/1355699?hl=ko), [게시자 콘텐츠 정책](https://support.google.com/publisherpolicies/answer/11112688?hl=ko).

유럽의 비개인화 광고도 쿠키·기기 저장 접근 및 관련 법적 근거 검토를 생략할 수 있다는 뜻은 아니다. Google 요구사항과 개인정보 법령은 각각 만족해야 한다. 정책 URL·요건은 출시 직전에 재확인한다.
