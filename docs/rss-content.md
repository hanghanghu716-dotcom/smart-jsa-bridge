# RSS 본문 제공

각 언어의 `/<locale>/feed.xml`은 최신 사례 글과 색인 가능한 공개 JSA의 본문을 RSS `description`에 HTML로 제공합니다.

- 공개 JSA: 공개 설명·적용 범위·출처, 모든 작업 단계와 상세 설명, 위험요인·분류·현재 대책·권고 대책·위험도.
- 사례 글: 상세 페이지와 같은 정제된 Markdown/표 본문. RSS 내부의 상대 링크는 절대 URL로 변환합니다.
- 공개 여부·재사용 허락·검토/중복 판정·원문 언어 필터는 유지합니다. 참여자·서명·현장 주소·비공개 메모·사용자 정의 항목을 추가로 내보내지 않습니다.
- 고정된 글 개수 제한 없이 최신순으로, UTF-8 기준 4 MB 미만으로 제공합니다. Vercel의 일반 응답 한도(4.5 MB)와 네이버 RSS 제출 한도(10 MB)를 함께 충족하기 위한 여유입니다. 용량을 넘는 글은 본문을 자르지 않고 해당 항목 전체를 제외하며, 전체 URL 발견은 사이트맵이 담당합니다.
- DB 스키마나 저장된 글은 수정하지 않습니다. 철회된 글이 남지 않도록 매번 공개 데이터를 다시 읽고 `private, no-store`를 유지합니다.

## 검증

`node --test scripts/rss-content.test.js scripts/live-content.test.js`는 전체 본문, HTML/XML 특수문자, 공개 범위, 철회, 언어 및 용량 제한을 검사합니다.

PR 검증은 `node scripts/render-rss-check.js` 후 `python3 scripts/verify-live-rss.py --candidate`로 실제 공개 데이터에서 생성한 한국어·미국 영어 RSS의 모든 항목을 상세 페이지 본문과 대조합니다. 운영 배포 후에는 `python3 scripts/verify-live-rss.py`로 실제 RSS 응답에 대해 같은 검사를 수행합니다. Python 표준 XML 파서로 문법도 확인합니다.

네이버 제출 주소는 `https://smartjsabridge.com/ko/feed.xml`, 사이트맵은 `https://smartjsabridge.com/sitemap.xml`입니다. RSS 변경은 검색엔진 관리자 화면의 소유확인·피드 제출이나 실제 색인 완료를 대신하지 않습니다.

근거: [네이버 RSS 및 사이트맵 제출 가이드](https://searchadvisor.naver.com/guide/request-feed), [Vercel 응답 한도](https://vercel.com/docs/functions/limitations).
