# 검색 성과 자동 연동

관리자 커뮤니티 화면의 **검색 서비스 연동**에서 확인합니다. 사이트 소유권 확인과 API 수집 권한은 별개입니다. 소유권 확인이 이미 끝났다면 아래 API 설정만 추가합니다.

## 지원 범위

| 서비스 | 방식 | 집계 범위 |
| --- | --- | --- |
| Google Search Console | 공식 API, 매일 수집 | 웹 검색의 사이트 전체 / Explore·공개 JSA 각각 |
| Bing Webmaster Tools | 공식 API, 선택적으로 매일 수집 | Web·Chat·News·Images 등 API가 제공하는 사이트 전체 |
| 네이버 서치어드바이저 | 완료된 월의 수치 직접 입력 | 사이트 전체 클릭·노출, 출처·필터 함께 기록 |

네이버 검색 성과를 가져오는 일반 공개 API는 공식 문서에서 확인하지 못했습니다. 네이버 검색 API와 제휴 콘텐츠 수집 API는 Search Advisor 성과 조회 API가 아닙니다. 로그인 쿠키 저장이나 관리자 화면 스크래핑은 사용하지 않습니다.

Google의 라이브러리 범위는 `https://smartjsabridge.com/<언어>/explore` 및 `/public-jsa/<UUID>`입니다. Google 도메인 속성의 사이트 전체에는 하위 도메인·다른 프로토콜도 포함될 수 있지만, 라이브러리 필터는 위 HTTPS 정식 주소만 포함합니다. 사이트 전체와 라이브러리 수치는 합산하지 않습니다. 검색 당시의 클릭 기록이므로 현재 비공개가 된 문서의 과거 클릭도 포함될 수 있습니다. 기존 UTC 재사용 대시보드와 집계 기준이 다릅니다.

## Google 최초 연결

1. Google Cloud 프로젝트에서 **Google Search Console API**를 사용 설정합니다. 결제 계정이나 유료 상품을 추가할 필요가 생기면 진행하지 말고 설정을 확인합니다.
2. 전용 서비스 계정을 생성합니다. 프로젝트의 Owner/Editor 권한이나 도메인 전체 위임은 부여하지 않습니다.
3. Search Console의 해당 속성 → 설정 → 사용자 및 권한에 서비스 계정 이메일을 추가합니다. 성과 읽기에 필요한 권한만 사용하며 소유자로 등록하지 않습니다.
4. 서비스 계정 JSON 키를 생성해 **GitHub 저장소 Settings → Secrets and variables → Actions → Secrets**의 `GOOGLE_SERVICE_ACCOUNT_JSON`에 저장합니다. 채팅·소스코드·VITE 환경변수에 넣지 않습니다. 기존 다운로드 파일도 Git 저장소 밖에 보관합니다.
5. Actions의 **Variables**에 `GOOGLE_SEARCH_CONSOLE_PROPERTY`를 등록합니다. 등록된 속성과 정확히 맞춰 `sc-domain:smartjsabridge.com` 또는 `https://smartjsabridge.com/`을 사용합니다.
6. Secrets의 `SUPABASE_SERVICE_ROLE_KEY`에 이 프로젝트의 서버 전용 키를 설정합니다. 이미 동일한 키가 설정돼 있다면 재사용합니다. 이 키는 DB 관리자급 권한이므로 승인된 브랜치의 수집 작업에만 전달해야 합니다.

서비스 계정 키는 수집기에서 고정된 Google 토큰 주소로만 전송하며, `webmasters.readonly` 범위로 짧은 수명의 액세스 토큰을 발급합니다. JSON 파일의 임의 `token_uri`는 사용하지 않습니다. 키 유출 시 Google Cloud에서 폐기·재발급합니다.

## Bing 선택 연결

1. Bing Webmaster Tools에서 사이트 소유권을 확인합니다. Google에서 사이트를 가져오는 기능을 활용할 수 있습니다.
2. API Access에서 발급한 키를 GitHub Actions Secret `BING_WEBMASTER_API_KEY`에 저장합니다.
3. 사이트 주소는 `https://smartjsabridge.com/`입니다. 키가 없으면 Bing 수집만 건너뜁니다.

## 첫 실행과 예약

- `.github/workflows/search-console.yml`이 기본 브랜치에 있어야 예약 실행됩니다. 기능 브랜치에만 올려두면 일일 실행은 시작되지 않습니다.
- Actions Variable `SEARCH_SYNC_ENABLED=true`를 설정해야 실행됩니다. 연결 전에는 실행·과금 방지를 위해 비활성 상태입니다.
- Actions → **Sync search performance** → **Run workflow**에서 첫 회 `backfill=true`로 실행합니다. 이후 매일 UTC 20:23(한국시간 다음 날 05:23) 실행됩니다. GitHub 예약 작업은 지연되거나 비활성화될 수 있습니다.
- 기본 실행은 최근 45일을 다시 수집해 공급자 수정 수치를 반영합니다. 최초 backfill은 최근 12개월 범위에서 공급자가 제공하는 데이터만 가져옵니다. 연결 이전의 데이터를 임의 생성하지 않습니다.
- Node 내장 기능만 사용하므로 수집 작업에 npm 설치가 필요 없습니다. 별도의 유료 연동 서비스를 사용하지 않지만, GitHub Actions 사용량·저장소 요금제의 무료 한도는 확인하고 지출 한도를 0으로 유지하세요.
- 관리자 화면의 **마지막 성공**과 데이터 기간을 확인합니다. 장기간 갱신되지 않으면 Actions 실행 기록을 확인합니다. 화면의 새로고침은 저장된 통계를 다시 읽으며 공급자 API를 실행하지 않습니다.

로컬 실행은 저장소 밖에서 관리한 환경변수나 Git에서 제외되는 `.env.search.local`을 사용할 수 있습니다. `SUPABASE_URL=https://aajvezmhyrdawxxbulqz.supabase.co`도 필요합니다.

```powershell
node --env-file=.env.search.local scripts/sync-search-console.js --backfill
```

## 데이터 해석·보안

- Google은 Pacific 날짜와 확정 데이터만 사용하고 최근 3일을 제외합니다. Bing은 공급자 응답의 날짜를 유지합니다. 이번 달과 일부 기간의 합계는 완료된 월 전체 실적과 다릅니다.
- 날짜별 집계를 요청하므로 검색어·페이지별 상위 행 제한에 따른 손실을 줄입니다. 공급자 API의 자체 제한이나 데이터 지연까지 없애는 것은 아닙니다.
- 반환되지 않은 날짜는 0으로 저장하지 않습니다. Google은 성공한 재수집 범위만 교체하고 Bing은 반환된 날짜만 갱신합니다. 공급자 오류 시 기존 수치를 보존합니다.
- 클릭·노출의 집계값만 저장합니다. 사용자 ID, IP, 검색어, Google 토큰·API 키는 통계 DB에 저장하지 않습니다.
- 통계 테이블은 비공개 스키마·RLS를 적용합니다. 수집 RPC는 서버 역할만, 조회·네이버 입력 RPC는 현재 DB에서 확인한 관리자만 실행할 수 있습니다.
- 네이버는 완료 월만 입력합니다. 0은 실제 0일 때만 입력하며, 노출 수를 모르면 빈칸으로 둡니다. 기존 수동 Search Console 기록은 별도 보존하고 자동 통계와 합산하지 않습니다.
- Google 속성을 변경하면 `PROPERTY_CHANGED`로 거절합니다. 서로 다른 범위의 통계를 섞지 않도록 기존 데이터 처리 방침을 정한 뒤 변경해야 합니다.
- 키 미설정은 실제 연동 완료가 아닙니다. 성공한 첫 공급자 호출과 DB 저장을 확인한 후 활성화 완료로 판단합니다.

## 검증

`npm run test:all`, `npx vite build`. DB 소유자는 `scripts/search-console-rls.sql`로 권한·중복 방지·오류 시 보존·관리자 권한 회수 동작을 확인할 수 있습니다. 테스트 변경은 전부 롤백됩니다.

공식 참고: [Google Search Analytics](https://developers.google.com/webmaster-tools/v1/searchanalytics/query), [Google 서버 인증](https://developers.google.com/identity/protocols/oauth2/service-account), [Bing 통계 API](https://learn.microsoft.com/en-us/dotnet/api/microsoft.bing.webmaster.api.interfaces.iwebmasterapi.getrankandtrafficstats?view=bing-webmaster-dotnet), [네이버 서치어드바이저](https://searchadvisor.naver.com/).
