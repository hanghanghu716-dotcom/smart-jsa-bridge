# Community 운영 절차 — 2026-10-01

## 제공 범위와 비용

2026-10-01 플랜 표시 수정: 이용자에게는 **Community 무료 / Professional 무료 베타** 두 가지만 제공한다. Professional에는 현재 구현된 개인 개정 이력·회사 양식·구성원 권한·팀 문서·결재를 포함한다. 별도 Teams/Business/Enterprise 플랜 카드, 미구현 고급 AI·대량 내보내기 광고, 향후 유료 플랜 관심 등록은 표시하지 않는다. 기존 30일 베타 권한과 만료 후 열람 규칙은 유지하며 Community 핵심 기능에는 기한이 없다. 내부 `/business` 경로와 DB 식별자는 호환성을 위해 유지한다. 기존 관심 등록 자료를 삭제하거나 결제/구독을 생성하지 않는다.

개인 검색·작성·비공개 저장·재사용·공개·기본 PDF를 무료 핵심 기능으로 둔다. 기존 비공개 문서 3개 제한은 제거했다. 조직 권한·회사 문서·승인·이력은 별도 Business 영역으로 유지하며 결제는 켜지 않는다. 무제한 인프라를 보장하는 뜻은 아니다. 기존 Supabase/호스팅 무료 한도와 지출 제한을 운영자가 확인한다. 이번 변경은 유료 메일, 새 유료 서비스, 광고 계정 또는 결제 구독을 신청하지 않는다.

고객센터: `/{locale}/community`. 로그인 사용자의 일반 문의·기능 건의·개인정보·저작권·안전·스팸·이의제기·열람·삭제·정정 요청을 비공개로 받는다. 사용자당 24시간 최대 20건이며 답변은 화면의 처리 알림에 남는다. 이메일 알림/자동 긴급 감시는 구현되지 않았다. 운영자가 직접 접속해야 한다. 운영자 권한은 `auth.users.raw_app_meta_data.role=admin`을 DB에서 매번 확인한다. 브라우저 비밀코드 방식은 제거했다. 여기서 계정 삭제·법적 신고·외부 기관 통보는 자동으로 실행하지 않는다.

**출시 전 남은 항목:** 운영자 법적 신원/연락처 확정, 비회원 신고 접수 경로, 국가별 적용범위 판단, 처리방침의 실제 보관기간 및 국외이전 내역 확인. 로그인 접수함만으로 비회원 권리침해 신고 의무까지 충족했다고 표시하지 않는다. `support@`/`rights@`는 생성·수신 검증되지 않았으며 공개하지 않는다. 가비아 DNS/MX는 변경하지 않았다.

## 매일 수행할 업무

1. 운영 계정으로 고객센터 접수함을 연다. 현재 화면은 최근 200건을 표시하므로 미처리 건이 이를 넘으면 DB 조회를 통해 누락 없이 관리하고 페이지네이션을 확장한다.
2. 생명·신체 위해, 개인정보 노출, 신뢰할 만한 위법 신고를 우선 분류한다. 문의의 원문, 대상 URL, 접수 시각, 요청 범위와 증빙을 확인한다. 단순 불만과 법정 권리 요청은 처리 근거가 다를 수 있다.
3. 필요하면 공개 접근을 임시 제한하고 사유를 적는다. 사유는 작성자/신고자에게 전달되므로 신고자의 신분증·주소·연락처 등 비공개 증거를 넣지 않는다. 공개 제한은 직접 URL, 목록, 통계 조회에도 적용된다. 작성자는 자신의 문서를 열 수 있다.
4. 본문·출처·현장 적합성 및 제출자의 권한을 검토한다. 안전 전문가 검토 없이 ‘인증’, ‘승인’, ‘법적 준수 보장’이라고 표시하지 않는다. 긴급기관 신고가 필요한 경우 관할 법률과 사실관계를 별도로 확인한다.
5. 검토 중/처리 완료/기각/복구를 선택해 구체적 이유와 후속 절차를 알린다. 단순 문의에는 처리 사유 칸을 답변으로 사용한다. ‘처리 완료’는 개인정보 삭제가 실제 수행되었다는 자동 증명이 아니다.
6. 이의제기는 원결정·자료와 연결해 재검토한다. 저작권 반론통지처럼 형식·기한이 정해진 절차를 일반 이의제기 한 건으로 대체하지 않는다.

## 매주·매월 수행할 업무

- 주간: 미처리·기한 임박 요청, 반복 게시자, 위험한 내용, 중복/얕은 공개 자료, 비공개 식별정보 잔존, DB/호스팅 사용량을 확인한다.
- 월간: 관리자 권한, 백업 복구, 정책 번역, 데이터 보유·삭제 기록, 수탁자와 국외이전 목록, 적용 국가 변화, 광고 정책을 점검한다.
- 법적 보존이 필요한 자료와 불필요한 문의 원문을 구분한다. 보관기간을 확정하기 전 임의의 ‘90일/1년 뒤 완전 삭제’ 보장을 게시하지 않는다. 현재 자동 보존기간 만료 삭제 작업은 없다.
- 개인정보 사고가 발생하면 접근 차단·범위 확인·증거 보존·관할별 신고/통지 판단을 수행한다. 전 세계에 하나의 신고 기한을 적용하지 않는다.

## 공개와 재사용

새 공개 저장은 권한·개인정보 확인 체크박스를 직접 선택해야 한다. 서버가 동의 버전과 시각을 저장한다. 기존 배포 화면의 공개 저장은 호환성을 위해 허용하지만, 동의 필드가 없으면 재사용 허락과 시각을 부여하지 않는다. 새 화면에서 미확인 자료를 재사용하거나 검색엔진 색인 대상으로 삼지 않는다. 공개로 읽을 수 있는 본문의 수동 복사까지 기술적으로 막는 DRM은 아니다. 기존 공개 문서에는 새 허락을 일괄 적용하지 않는다. 작성자가 고객센터에서 본인 문서를 선택해 확인할 수 있다. 미확인 자료는 읽기/스크랩은 가능하나 새 재사용 동작은 제한한다. 기존에 개인이 보유한 사본은 자동 회수하지 않는다.

원본 링크, 내용 언어, 수정일, 공개 파생본 수, 선택 단계 가져오기를 제공한다. 원본이 비공개/제한 상태이면 공개 원본 링크를 숨긴다. TEST_ 접두 문서는 noindex 처리하며 지표나 단계 수가 안전 검증 점수로 해석되지 않도록 한다.

## 광고 활성화의 조건

`src/config/operations.js`의 광고 설정은 모두 꺼져 있다. 페이지 전체에서 AdSense/GA를 자동 삽입하던 코드를 제거했다. `adEligibility`는 운영자 연락처 검증, 지역 검토, 인증 CMP 연동, 허용 지역, CMP ID, 명시적 광고 동의, 만료일, 공개 경로가 모두 맞아야 한다. 현재 CMP 연동 자체는 제공되지 않으므로 설정 플래그만 바꾸어 출시하지 않는다.

1. 운영자의 사업·세무 의무와 광고 계약 자격을 확인한다. 소액/무료 서비스라는 이유로 면제된다고 단정하지 않는다.
2. CMP 제공자를 선택하고 계약·가격·Google 인증 상태를 확인한다. EEA/영국/스위스의 Google 요구사항을 검토한다. 언어 선택을 거주 국가로 취급하지 않는다.
3. 실제 CMP의 동의·철회·지역 판정·만료 이벤트를 연결한다. 동일 페이지 철회 후 요청 중단과 이미 로드된 SDK의 처리까지 검증한다. 현재 준비용 adapter 변수는 자체 CMP나 동의 증명의 대체물이 아니다.
4. 비동의/알 수 없는 지역/미성년자 정책 미확정/제한 게시물/오류 페이지에서는 광고를 요청하지 않는다. 공개 상세도 운영 검토된 콘텐츠에만 노출하는 추가 정책을 확정한다.
5. 로그인·편집·출력·고객센터에는 광고를 넣지 않는다. PDF/복사 전에 광고를 보게 하던 동작은 직접 실행으로 변경했다.

익명 조회에 쓰던 영구 브라우저 식별자는 새로 생성하지 않는다. 신규 조회수는 로그인 방문을 집계한다. 기존 익명 집계는 남아 있으므로 누적 숫자의 측정 기준 변경을 설명해야 한다. 요청 이벤트는 중복 제거용이며 개인 실명 분석이나 정확한 현장 사용 증명이 아니다.

## 검증과 남은 보안 점검

단위 검증: `npm run test:community`. 저장·Business·다국어 회귀 검증도 수행했다. Vite 번들 빌드는 성공했다. 전체 정적 페이지 사전 생성은 기본 Chrome 경로가 Linux용(`/usr/bin/google-chrome`)이라 Windows 기본 설정에서 완료되지 않는다. 배포 전 CI 또는 `PUPPETEER_EXECUTABLE_PATH`를 지정한 빌드에서 별도로 확인한다. 새 프런트엔드는 아직 운영 사이트에 배포하지 않았다. DB에는 community_operations와 community_release_compatibility를 적용했다.

`scripts/community-rls.sql`은 트랜잭션을 되돌려 권한·제한·알림·감사 기록·무료 저장·동의 요건을 확인한다. 테스트 신고/제한은 실제 데이터에 남기지 않는다. 비공개 스키마의 RLS 정책 없음은 전부 거부하려는 의도이며 직접 권한도 제거했다.

프로젝트에 원래 있던 경고: `handle_new_user`, `increment_risk_stats`의 search_path/공개 SECURITY DEFINER 실행권한, public 스키마 확장, 유출 비밀번호 검사 비활성화. 이번 기능 테스트 통과가 이 항목의 해소를 뜻하지 않는다. 기존 호출부·요금제 영향을 검토해 별도 수정한다. [Supabase 함수 권한 점검](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [비밀번호 보호](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
# Discovery, editorial review and monthly operations (2026-10-01)

Implemented in this release:
- `/:lng/explore` uses live anonymous server HTML, 24 documents per page, crawlable next/previous links, URL-preserved filters and strict sort allowlist. Search/tag/alternate-sort/empty/error results are noindex; DB failures return 503 instead of an empty successful catalog. Visibility is checked on every request; CDN caching is disabled.
- Public details include actual hazard/control entry counts, categories, saved likelihood/severity/risk scores, context, source title, up to 12 recent children, and up to 6 same-language tag-related JSA. Missing scores stay missing; counts are structured entries, not counts of sentences or certified protections.
- Only currently public, unrestricted documents enter lineage or duplicate comparison. Similarity uses normalized steps, hazards, controls and scores. Exact matches and trigram similarity >= 0.93 with at least 180 characters are conservative duplicate candidates; the older visible document remains the representative. This is an internal heuristic, not a Google rule or semantic/plagiarism classifier. Duplicate candidates remain readable/reusable but noindex and ineligible for ads. Distinctive content edits can remove the match; review rejection can keep an unsafe/low-value document noindex.
- New review/curation/analytics endpoints check the current administrator role in the database. No client-supplied admin flag is trusted. Decisions, links and search-total corrections leave an audit record. Private tables intentionally have deny-by-default RLS with no direct client policies.
- Ad eligibility now additionally requires indexable, nonduplicate public detail content and approval of its current revision. Content/form/layout edits invalidate approval. Search/list pages are not ad placements. All global release flags remain OFF; region/CMP/contact/legal readiness still must be completed before activation. No advertising or safety certification is implied by editorial approval.
- About, Business and support messaging share Community free / Professional 30-day free beta. No charge, checkout or automatic billing added.

Operator workflow at `/ko/community` (current admin account required):
1. In **콘텐츠 운영**, select a document and open its actual detail. Check rights, private information, safe wording, meaningful specificity and any duplicate candidate. Record a reason and approve or hold. Changes during review reject stale decisions; refresh and review again.
2. Link relevant Guide or Case Study entries in **함께 읽을 자료**. These are editorial choices, not automatically asserted expert recommendations. Links appear both on the JSA and the referenced reading page; remove them in the same panel. No test document has been endorsed or automatically linked.
3. Check the last 12 UTC months. Reused steps and distinct document/user/day reuse combinations come from actual engagement events; private, restricted and TEST-prefixed documents are excluded. Authors' own interactions were already excluded by the event collector. Counts represent retained events for documents public now, not historical public-state snapshots. Publication/derivation cohorts use document creation month, not first-publication time. A zero denominator displays —.
4. Use **검색 서비스 연동** for Google Search Console API and optional Bing daily aggregate metrics. Credentials and scheduler must be configured before live collection starts; see [setup](search-console-integration.md). Naver completed-month figures remain manual because a general public performance API was not confirmed. Old manual records are preserved separately. Library and site totals are not added together; absent values are not fabricated zeros. No new cookies, identifiers or third-party analytics scripts were added.

Static Guide/Case Study builds intentionally skip live UGC recommendations to avoid preserving withdrawn documents in static HTML. Their live UI fetches current public links. Dynamic JSA detail and Explore content use the live endpoints.

Validation: automated HTML/XSS/query/index/ad-gate/locale tests; transaction-rollback database checks for anonymous/member/admin access, duplicate/source visibility, revision invalidation, reverse links and monthly data; live anonymous API + HTML checks. Vite production compilation verified. Full prerender/deployment is separate; no production frontend deployment performed in this task.

Existing security advisor findings predate this change: mutable search paths / public SECURITY DEFINER access for `handle_new_user` and `increment_risk_stats`, public-schema extensions, and disabled leaked-password checks. New private deny-all tables produce expected RLS informational notices. See [function search paths](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable) and [public function access](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable). Existing unrelated performance-policy findings remain; new audit/reviewer foreign-key indexes are included.
