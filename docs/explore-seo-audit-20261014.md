# Explore 검색 노출 점검 — 2026-10-14

대상: https://smartjsabridge.com/ko/explore 및 연결된 `/ko/public-jsa/<UUID>` 문서. 코드 기준은 `13637aa17655663ce089e5f38e66518148a5e0af`입니다.

## 판단

공개 HTML과 수집 경로를 제공하는 기본 구조는 갖춰져 있습니다. 다만 36개 문서 모두가 구글·빙·네이버에 색인됐거나 원하는 검색어에서 노출된다는 판정은 할 수 없습니다. 이 보고서는 코드·운영 배포 로그·공개 페이지를 확인한 결과이며 각 검색엔진의 URL 검사 결과가 아닙니다.

현재 공개 목록에는 운영자 문서 36건이 표시됩니다. 최신 운영 배포 브라우저 검사도 기본 통제 12·기술 실패 12·기록 인계 12개를 확인했습니다. 최초 검색 도구 응답에서는 과거 TEST_ 문서 12건이 나왔으나 최신 재조회에서는 36건과 새 본문이 확인되어, 이전 응답을 현재 상태로 사용하지 않았습니다.

## 확인된 기반

| 항목 | 근거와 범위 |
| --- | --- |
| 초기 HTML 본문 | `api/explore.js`, `api/public-jsa.js`가 목록·본문을 HTML로 렌더링. 실제 공개 샘플에서도 작업단계·위험요인·대책·관련 링크가 읽힘 |
| 크롤링 링크 | 카드·관련 자료·페이지 번호를 `<a href>`로 제공 |
| robots.txt | 저장소의 `public/robots.txt`는 일반 로봇을 허용하고 Explore를 명시적으로 허용. public-jsa 경로를 막는 규칙 없음. 현재 방화벽별 봇 차단은 미확인 |
| 제목·설명·대표 URL | 서버 HTML에 title, description, robots, canonical 생성. 공개 상세는 원문 언어 URL을 대표로 지정 |
| 색인 제외 | 비공개·테스트·내용 부족·중복 판정·일부 필터 URL을 제외하는 정책. 공개 상태만으로 모든 문서가 색인 대상이 되지는 않음 |
| 사이트맵 | `/sitemap.xml` → static/cases/public 하위 사이트맵. public은 적격 원문 문서만 수록하도록 구현 |
| 갱신 | DB에서 실시간 목록·문서·사이트맵·RSS를 읽으므로 새 공개 문서마다 프런트 재배포가 필수인 구조는 아님 |
| 운영 검증 | 아래 배포 로그에서 사이트맵/RSS·18개 언어 사례·존재하지 않는 문서 404·사이트맵에 포함된 Explore의 index 지시 검증 성공 |

[운영 배포 및 검증 로그](https://github.com/hanghanghu716-dotcom/smart-jsa-bridge/actions/runs/38523756599)

최초 점검에서 웹 조회 도구의 robots.txt/XML 접근이 실패해 코드·배포 로그를 사용했습니다. 후속으로 비밀키 없이 공개 GET 요청만 하는 `scripts/audit-explore-seo.js`를 GitHub Actions에서 실행해 실제 운영 응답을 전수 대조했습니다.

## 17:11 KST 운영 전수 점검 결과

[최종 실행 성공](https://github.com/hanghanghu716-dotcom/smart-jsa-bridge/actions/runs/38533230252), [36개 URL별 결과](explore-seo-live-20261014.json).

| 항목 | 결과 |
| --- | --- |
| 전체 목록과 상세 링크 | 2개 목록 페이지에서 36개 발견, 누락 없음. 두 번째 페이지의 실제 주소는 `?page=1` (0부터 시작) |
| 문서 HTTP 응답 | 36/36 HTTP 200 |
| 원문 색인 지시 | 36/36 `index,follow`, 색인 차단 X-Robots-Tag 없음 |
| canonical | 36/36 현재 원문 URL과 일치, 중복 태그 없음 |
| 제목·설명·본문 | 36/36 제목·설명·H1 및 서버 렌더링 본문 검사 통과 |
| public 사이트맵 | 36/36 포함, 루트 사이트맵과 robots.txt의 발견 경로 정상 |
| 한국어 RSS | 36/36 문서 URL 포함. RSS 본문 전체 제공 여부는 아래 별도 개선 항목 |
| robots.txt | 36개 상세 경로에 대한 Googlebot/bingbot/Yeti 허용 |
| User-Agent 표본 | 세 이름으로 목록과 상세 1개씩 요청, 6개 응답 검사 통과 |

User-Agent 이름만 사용한 요청은 실제 검색엔진 IP의 방화벽 통과나 색인 완료를 입증하지 않습니다. 검사 통과는 현재 HTML의 기술적 수집 가능성을 뜻합니다. 첫 실행은 점검기의 페이지 번호 해석을 수정한 뒤 위 최종 실행으로 대체했습니다.

## 검색엔진별 연결 확인

| 검색엔진 | 현재 확인 결과 | 남은 확인 |
| --- | --- | --- |
| Google | 10월 14일 08:45 KST 자동 수집에서 `google: SUCCESS (90 daily records)`. 사이트 속성은 `https://smartjsabridge.com/` | Explore 및 문서별 URL 검사, 선택된 canonical, 제외 사유, 실제 검색어/클릭/노출 |
| Bing | 같은 실행에서 `bing: NOT_CONFIGURED` | 통계 API 미연결은 확인됐지만 Webmaster 사이트 등록·색인 자체가 없다는 뜻은 아님. 사이트 등록·사이트맵 수신·URL 색인을 별도 확인 |
| Naver | 저장소는 월별 통계 수동 입력 방식. 확인 태그/HTML 파일을 소스에서 찾지 못함 | Search Advisor 소유확인·사이트맵/RSS 제출·수집/색인 보고서 미확인. 미등록이라고 단정하지 않음 |

[검색 통계 수집 로그](https://github.com/hanghanghu716-dotcom/smart-jsa-bridge/actions/runs/38486149921). 90 daily records는 일별 통계 행 수이며 90개 문서가 색인됐다는 뜻이 아닙니다.

## 개선 우선순위

1. **문서별 색인 상태를 먼저 확인**: 목록·대표 기본/기술/인계 문서의 URL 검사와 public 사이트맵 포함을 대조합니다. `assessment.checked`, `duplicate_of`, 검토 상태 때문에 제외되는 문서가 있는지 확인합니다. 중복 판정을 일괄 해제하지 않습니다.
2. **검색 제목 개선**: 목록 제목은 현재 `공개 JSA 라이브러리`, 샘플 상세 제목은 `가연성 가스 공급설비 누설 점검 [기술 실패]`입니다. 실제 제공 내용에 맞게 위험성평가/JSA/양식 등의 검색 의도를 제목·설명에 분명히 반영할 여지가 있습니다. 기존 URL은 유지합니다.
3. **문서 품질**: 기본·기술·인계가 독립 콘텐츠인 만큼 각 문서의 목적·본문·판단 기준을 충분히 구별합니다. 샘플 기록 인계 문서에서 `철거 순서을`, `중지 조치을`, `구역 인계을` 같은 조사를 확인했습니다. 문장 교정과 실질적 출처 보강이 필요합니다. 유사문서라는 이유로 검색엔진이 실제 제외했다는 뜻은 아닙니다.
4. **다국어 연결 일치**: Explore의 클라이언트 SEO는 기본적으로 전체 언어 alternate를 만들지만 사이트맵은 적격 국가만 포함합니다. 비어 있거나 noindex인 국가 목록을 alternate로 연결하는지 점검하고 서버/클라이언트/사이트맵 정책을 맞춥니다.
5. **네이버 RSS 보완**: `/ko/feed.xml`의 공개 JSA description은 현재 단계 제목 요약입니다. 네이버 공식 가이드는 최신글 본문을 포함한 RSS를 권장하므로 공개·적격 본문을 안전하게 제공할지 검토합니다. 현재 RSS가 무조건 거절된다고 단정하지 않습니다.
6. **성능**: 이번 프런트 빌드의 main JS는 약 5.26 MB, gzip 약 1.66 MB입니다. 초기 서버 HTML은 있으나 사용자 로딩 비용이 커질 수 있어 코드 분할을 후속 점검합니다. 실측 Core Web Vitals 불합격 판정은 아닙니다.

IndexNow는 빙·네이버 갱신 알림을 위한 추가 개선 후보이며, 없다는 사실만으로 색인 불가인 것은 아닙니다. 네이버도 공식적으로 지원하지만 접수 성공이 색인 보장을 의미하지 않습니다. 구조화 데이터 추가도 검색 수집의 필수 조건으로 취급하지 않습니다.

## 관리자 화면에서 실행할 순서

1. **Google Search Console**: `https://smartjsabridge.com/` 속성 → 사이트맵에서 `https://smartjsabridge.com/sitemap.xml` 접수 성공 여부를 확인합니다. 제출 기록이 없으면 제출합니다. 공개 문서만 별도로 추적하려면 `sitemap-public.xml`을 추가 제출할 수 있습니다. URL 검사에서 Explore와 기본/기술/인계 문서를 검사해 마지막 크롤링 시각·선택된 canonical·색인 상태를 확인합니다. 미색인 문서의 라이브 테스트가 정상이면 색인 생성을 요청합니다. 많은 URL은 사이트맵을 사용하며 등록 요청이 노출 보장은 아닙니다.
2. **Bing Webmaster Tools**: 기존 사이트가 있으면 그 속성을 선택합니다. 없으면 Google Search Console에서 사이트를 가져와 소유권을 확인합니다. Sitemaps에 같은 `sitemap.xml`을 제출하고 URL Inspection에서 공개 문서를 검사합니다. 관리자 통계 자동 수집까지 원할 때만 GitHub Actions Secret `BING_WEBMASTER_API_KEY`를 추가합니다. 이 통계 키는 검색 노출의 필수 조건이 아닙니다.
3. **네이버 서치어드바이저**: 웹마스터 도구에서 `https://smartjsabridge.com`의 소유확인을 확인합니다. 요청 → 사이트맵 제출에 `https://smartjsabridge.com/sitemap.xml`을 입력합니다. 대표 문서는 요청 → 웹 페이지 수집에서 신청하고 수집·색인 보고서를 확인합니다. RSS는 공개 본문 전체 제공을 보완한 후 `https://smartjsabridge.com/ko/feed.xml`을 제출합니다. 사이트맵 제출은 RSS 수정과 관계없이 진행할 수 있습니다.

실제 관리자 화면/URL Inspection 결과는 현재 미확인입니다. 연결 가능한 Google 검사 도구인 GSC Wizard는 아직 설치되지 않았고 브라우저 제어 시작 오류가 있어 로그인된 콘솔을 읽지 못했습니다. 사이트의 기존 Google 통계 자동 수집이 성공했다는 사실과 별개입니다. 비밀번호나 API 키를 채팅에 전달할 필요는 없습니다.

공식 절차: [Google URL 검사](https://support.google.com/webmasters/answer/9012289?hl=ko), [Bing 시작하기](https://blogs.bing.com/webmaster/2025/6/Start-Using-Bing-Webmaster-Tools-to-Improve-Your-Site-Visibility/), [네이버 사이트맵/RSS](https://searchadvisor.naver.com/guide/request-feed), [네이버 IndexNow FAQ](https://searchadvisor.naver.com/guide/indexnow-faq).

## 참고한 공개 자료

- [Explore](https://smartjsabridge.com/ko/explore)
- [기술 실패 샘플](https://smartjsabridge.com/ko/public-jsa/02d352b7-16ec-4b03-9474-9c9490288c1b)
- [기록 인계 샘플](https://smartjsabridge.com/ko/public-jsa/06a10242-7959-404e-8c04-cb8fe14213f6)
- [Google JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Bing Webmaster Guidelines](https://www.bing.com/webmasters/help/bing-webmaster-guidelines-30fba23a)
- [네이버 검색엔진 최적화 가이드](https://searchadvisor.naver.com/guide/seo-basic-intro)
