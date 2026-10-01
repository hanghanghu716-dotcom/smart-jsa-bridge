# Smart JSA Bridge

다국어 JSA 작성·재사용·문서 출력 및 공개 라이브러리입니다. 현재 서비스 구성은 **Community 무료 / Professional 무료 베타**입니다.

## VS Code에서 실행

Node.js 22 LTS 이상과 npm을 사용합니다. 기존 체크아웃은 수정 중인 파일을 먼저 보관하고 `phase-6-free-business-beta` 브랜치로 전환한 뒤 Pull합니다. 새로 내려받는 경우:

```powershell
git clone --branch phase-6-free-business-beta https://github.com/hanghanghu716-dotcom/smart-jsa-bridge.git
cd smart-jsa-bridge
code .
```

VS Code 터미널에서 실행합니다.

```powershell
# 이미 설치된 Chrome을 사용합니다.
$env:PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = "true"
npm ci
npm run dev
```

터미널에 표시되는 로컬 주소에서 `/ko/explore`, `/ko/community`, `/ko/business`를 확인합니다. 기본 포트는 5173이며 사용 중이면 Vite가 다른 포트를 선택할 수 있습니다.

**로컬 화면도 현재 연결된 Supabase 데이터를 사용합니다.** 저장·공개·삭제 테스트는 전용 테스트 계정과 테스트 문서로 진행하세요. 공개 저장은 다른 사용자에게도 보일 수 있습니다. 계정 비밀번호, `.env`, 개인 테스트 계정 파일은 GitHub에 포함하지 않습니다.

## 자동 검증

```powershell
npm run test:all
npx vite build
node scripts/check-live-discovery.js
```

- `test:all`: 로케일·저장·문서·공개 콘텐츠·광고 조건 등 자동 테스트.
- `vite build`: 프런트엔드 컴파일. 전체 배포 빌드와는 다릅니다.
- `check-live-discovery`: 공개 DB에서 Explore와 상세페이지 서버 HTML을 확인하는 읽기 전용 검사입니다. 현재 공개 테스트 문서가 있다는 전제입니다.

## 전체 배포 빌드 (Windows)

```powershell
$env:PUPPETEER_EXECUTABLE_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"
npm run build
```

Chrome이 다른 위치에 있으면 실제 경로를 지정합니다. 사이트맵 생성, 프런트 빌드, 정적 안내·사례 페이지 사전 렌더링, 생성 HTML 검증을 수행합니다. 네트워크와 공개 사례 DB 읽기 권한이 필요하며, 자동 배포하지 않습니다.

Vite 개발 서버와 `npm run preview`는 Vercel API 재작성 규칙을 실행하지 않습니다. 공개 목록·상세페이지의 서버 응답은 위 읽기 검사와 배포 환경에서 별도로 검증해야 합니다.

## 화면별 수동 테스트

1. **Explore**: 검색, 4개 태그 그룹, 초기화, 최신/스크랩/조회/활용 정렬을 조합합니다. 새로고침과 주소 공유 후 조건이 유지되는지 확인합니다.
2. **공개 상세**: 위험요인·대책 개수, 분류, 가능성·중대성·위험도를 확인합니다. 재사용 허락이 없는 자료는 재사용 버튼이 비활성화됩니다. 원본·파생·관련 자료가 없으면 빈 상태가 정상입니다.
3. **Info → Procedure → Analysis → Export**: 작성, 단계 조합, 대책 편집, 개인 비공개 저장, 재열기, 미리보기, PDF 출력을 확인합니다. 개인 비공개 문서 3개 제한은 제거됐습니다.
4. **문서 디자인**: 프로젝트 정보+결재 통합, 빈 보호구/고위험작업 공간, 긴 제목, 서명란, 여러 페이지 표를 확인합니다. 실제 PDF 프린터 출력도 별도 확인합니다.
5. **Business**: Community 무료 / Professional 무료 베타 안내와 기존 조직 권한·회사 템플릿·문서 승인 흐름을 확인합니다. 결제나 자동 청구는 없습니다.
6. **Community 일반 계정**: 본인 문의·신고·알림만 열리는지 확인합니다. 운영자 메뉴가 없는 것이 정상입니다.
7. **Community 관리자 계정**: 콘텐츠 운영 표, 검토 승인/보류, 편집 후 재검토, Guide/Case Study 연결·해제를 확인합니다. 검토 승인은 광고 승인이나 안전 인증이 아닙니다.
8. **다국어·좁은 화면**: 한국어, 영어, 아랍어 RTL 및 나머지 지원 언어의 입력·표·버튼을 확인합니다.

## 운영 지표와 조건

- 테스트 제목(`TEST_` 등), 비공개·차단 문서는 운영 지표에서 제외합니다. 테스트 문서만 있으면 표가 0인 것이 정상입니다.
- 재사용은 실제 이벤트를 기반으로 문서·사용자·일별 중복을 제거합니다. 본인 문서 재사용은 증가하지 않습니다.
- 공개 문서/파생 비율은 문서 생성월 기준이며 과거 공개 상태의 통계는 아닙니다.
- 검색 클릭은 Search Console에서 공개 JSA/Explore URL 범위의 월별 합계를 확인해 입력합니다. 자동 연결은 없으며 미입력과 0은 구분됩니다.
- Guide/Case Study 연결은 관리자가 직접 선택합니다. 테스트 자료를 자동 승인·연결하지 않았습니다.
- 광고는 전역 비활성화입니다. 운영 준비·지역·동의·콘텐츠 심사 조건을 갖추기 전에는 표시하지 않습니다.

## DB 검증과 변경 기록

`supabase/migrations`의 이번 변경은 기존 연결 DB에 적용됐습니다. 같은 DB에 파일을 다시 실행하거나 전체 초기화하지 말고 적용 이력을 먼저 확인하세요.

`scripts/community-rls.sql`, `scripts/discovery-rls.sql`은 트랜잭션 끝에서 롤백합니다. 같은 SQL 세션에서 전용 계정 UUID를 `test.owner` 및 (community 검사에서는) `test.reporter` 설정으로 먼저 제공해야 합니다. 예: `select set_config('test.owner', '<전용 테스트 계정 UUID>', false);`. 실제 UUID는 커밋하지 않습니다. 설정이 없으면 중단하며, 기존 관리자 계정이 있어야 관리자 경로도 검증됩니다. 이 파일은 `npm run test:all`에 포함되지 않는 DB 관리용 별도 검사입니다.

운영 방식은 [커뮤니티 운영 기록](docs/community-operations.md), 국가별 준비 사항은 [지역별 운영 준비](docs/community-regional-readiness.md)를 참고하세요.

## 업로드 시 검증 상태

- 전체 자동 테스트 86개 통과.
- 프런트 빌드와 공개 DB를 이용한 서버 HTML 읽기 검사 통과.
- DB 권한·중복/유사 판별·비공개 전환·승인 무효화·월별 지표 롤백 검사 통과. 업로드 전 개인 이메일은 세션 설정 방식으로 바꿨습니다.
- 전체 사전 렌더링·운영 배포 검증은 이후 단계입니다. 이 브랜치 업로드만으로 운영 사이트를 배포하지 않습니다.
- 개발 서버가 열린 상태에서는 일부 내부 Vite 테스트에서 24678 포트 사용 중 메시지가 나올 수 있습니다. 최종 테스트 수와 종료 코드를 함께 확인하세요.

문제 보고에는 페이지 주소, 언어, 계정 역할, 재현 순서, 기대 결과/실제 결과를 남깁니다. 비밀번호나 세션 토큰은 포함하지 않습니다.
