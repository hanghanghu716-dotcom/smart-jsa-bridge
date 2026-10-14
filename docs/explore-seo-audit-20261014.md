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

이번 도구에서는 robots.txt/XML 직접 조회가 일관되게 성공하지 않아, 이 항목은 저장소와 위 운영 검증 결과를 근거로 작성했습니다. 36개 공개 문서의 현재 `assessment`·색인 메타·사이트맵 포함 여부 전체를 개별 대조한 것은 아닙니다.

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

IndexNow는 빙 갱신 알림을 위한 추가 개선 후보이며, 없다는 사실만으로 색인 불가인 것은 아닙니다. 구조화 데이터 추가도 검색 수집의 필수 조건으로 취급하지 않습니다.

## 참고한 공개 자료

- [Explore](https://smartjsabridge.com/ko/explore)
- [기술 실패 샘플](https://smartjsabridge.com/ko/public-jsa/02d352b7-16ec-4b03-9474-9c9490288c1b)
- [기록 인계 샘플](https://smartjsabridge.com/ko/public-jsa/06a10242-7959-404e-8c04-cb8fe14213f6)
- [Google JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Bing Webmaster Guidelines](https://www.bing.com/webmasters/help/bing-webmaster-guidelines-30fba23a)
- [네이버 검색엔진 최적화 가이드](https://searchadvisor.naver.com/guide/seo-basic-intro)
