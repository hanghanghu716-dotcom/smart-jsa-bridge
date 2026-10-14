# 개발·빌드·운영 환경

## 확인된 연결 (2026-10-14)

| 항목 | 확인 결과 |
| --- | --- |
| GitHub | `hanghanghu716-dotcom/smart-jsa-bridge`, 공개 저장소, 기준 브랜치 `main` |
| 조사 기준 커밋 | `13637aa17655663ce089e5f38e66518148a5e0af` (한국시간 2026-10-14 15:42) |
| 기존 PC 코드 | `C:\Users\ljh90\OneDrive\Desktop\smart-jsa-bridge` |
| 기존 PC의 main 참조 | `78c72abd4287576e2ebb502ec64c3511fb3e7fbd` (한국시간 10월 8일). 조사 기준 GitHub main보다 20개 커밋·119개 변경 파일 뒤처짐 |
| 프런트엔드 | React 19, Vite (`rolldown-vite`), npm lockfile |
| 운영 Supabase | 프로젝트 ref `aajvezmhyrdawxxbulqz` |
| Vercel 프로젝트 | 연결 계정 `hanghanghu716-dotcom`에서 `smart-jsa-bridge` 조회 확인. 프로젝트 `prj_veLQ9Xx7lJ6iLr3Qu6iC8KeoQxCJ` |
| 배포 | GitHub Actions `Vercel Production Deployment` → 검증 → 사전 빌드 → 운영 배포 → 운영 응답 검증 |
| 최신 운영 배포 | [38523756599](https://github.com/hanghanghu716-dotcom/smart-jsa-bridge/actions/runs/38523756599), 위 기준 커밋, 성공 |
| DB 변경 파일 | GitHub에 27개, 기존 PC에 22개. 실제 DB 적용 이력과 같다는 뜻은 아님 |
| 검색 통계 수집 | 10월 14일 한국시간 08:45 실행에서 Google `SUCCESS (90 daily records)`, Bing `NOT_CONFIGURED`. 90은 클릭/문서 수가 아닌 일별 집계 행 수 |

기존 PC 폴더의 미커밋 변경 전체는 검증하지 못했습니다. 폴더를 덮어쓰거나 강제 초기화하지 말고 GitHub Desktop 또는 해당 폴더에서 `git status`를 먼저 확인합니다. 조사 작업은 별도 사본에서 수행했습니다.

## 로컬 실행과 접속 대상

CI 재현용 `.nvmrc`는 Node 22(최소 22.12)입니다. 후속 Vercel 조회에서 프로젝트 Node 설정은 `24.x`로 확인됐으며 로컬 테스트도 Node 24.13.1에서 통과했습니다. CI와 프로젝트의 버전 차이는 향후 통합 검토 항목입니다. `npm ci`로 잠금 파일의 의존성을 설치합니다. 운영 Vercel의 Node 버전 설정은 이 변경에서 수정하지 않습니다.

```powershell
$env:PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = "true"
npm ci
npm run doctor
npm run dev
```

현재 운영 호환성을 위해 환경변수가 없으면 기존 운영 Supabase를 사용합니다. 이번 변경이 별도 테스트 DB를 생성하거나 운영 데이터를 복제하지는 않습니다. `doctor`에 운영 DB 경고가 나오면 저장·삭제도 운영에 반영될 수 있습니다.

별도 프로젝트가 준비되면 `.env.local`에 다음 두 값을 함께 설정합니다.

```dotenv
VITE_SUPABASE_URL=https://your-test-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_test_project_key
```

- 브라우저, 공개 서버 API, 사이트맵 생성은 공통 설정 검증을 사용합니다.
- 둘 중 하나만 설정하면 실패합니다. 다른 프로젝트의 URL에 운영 키를 자동으로 섞지 않습니다.
- publishable 키 또는 기존 anon JWT만 허용합니다. secret/service-role 키는 실패 처리하며 오류에 키 값을 출력하지 않습니다.
- URL은 경로·쿼리·인증정보 없는 HTTPS origin이어야 합니다. 로컬 Supabase는 `http://127.0.0.1:54321` 등 loopback 주소를 허용합니다.
- 환경변수 우선순위: 프로세스 환경 > `.env.[mode].local` > `.env.[mode]` > `.env.local` > `.env`. 값은 직접 적으며 `${VARIABLE}` 치환은 사용하지 않습니다.
- Vite 개발은 `development`, 일반 배포 빌드 및 서버 기본값은 `production`입니다. Vercel에는 같은 두 이름을 환경별로 함께 등록해야 합니다. 프런트 변경 후 재빌드도 필요합니다.
- 검색 지표 수집 작업의 `SUPABASE_*`·Google/Bing 설정과 관리자용 일괄 수정 스크립트는 별도 운영 작업입니다. 공개 앱의 환경변수가 이를 변경하지 않습니다.

공개 키가 코드에 존재하는 것은 관리자 비밀키 유출과 다릅니다. 실제 데이터 접근은 grants/RLS와 사용자 인증이 결정합니다. 공식 문서: [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys), [Vite 환경변수](https://vite.dev/guide/env-and-mode).

## 확인 명령

```powershell
npm run doctor
npm run doctor -- --mode production
npm run test:environment
npm run test:all
npx vite build
```

`doctor`는 네트워크 요청, DB 변경, git fetch/pull을 하지 않습니다. Git 비교는 마지막 fetch의 캐시 기준이며 실제 GitHub 최신 상태를 보장하지 않습니다. 마이그레이션 파일 개수도 적용 이력 검증이 아닙니다. 원본 작업을 보관한 뒤 `git fetch origin`으로 참조를 갱신하세요.

전체 `npm run build`는 공개 DB 읽기와 Chrome을 이용한 HTML/PDF 생성까지 수행합니다. 운영 사이트 점검은 `node scripts/verify-live-content.js`입니다. Vite 개발 서버/preview만으로 Vercel API 경로 검증을 대체할 수 없습니다.

## 다음 확인이 필요한 운영 항목

1. Supabase 관리 연결 후 실제 migrations 이력, 테이블별 grants/RLS, Storage 정책, Auth URL/리디렉션, 백업 상태를 읽기 전용으로 확인합니다.
2. 저장소에 `supabase/config.toml`과 전체 초기 스키마 기준선이 없어, 27개 migration만으로 새 DB를 완전히 재구성할 수 있다고 가정하지 않습니다. 기존 DB에 reset/push/전체 SQL 재실행을 하지 않습니다.
3. Vercel 프로젝트·운영 배포·Node 설정은 후속 조회로 확인했습니다. 환경별 변수 이름·설정 여부, 최근 함수 오류는 추가 확인 대상입니다. 비밀 값은 보고서나 로그에 출력하지 않습니다.
4. GitHub 기본 브랜치 보호 및 필수 검사 설정은 현재 연결 권한으로 읽을 수 없어 미확인입니다. 검색 지표 연결의 기존 기록은 `docs/search-console-integration.md`를 참고하고, 현재 실행 결과를 따로 확인해야 합니다.
5. `scripts/syncKeywords.js`는 즉시 DB 수정하는 별도 수동 스크립트이며 이번 조사에서 실행하지 않았습니다. 재사용 전 dry-run, 명시적 관리자 인증, 전체 행 페이지네이션을 갖추는 후속 점검이 필요합니다.

정상으로 확인한 것은 저장소 연결과 위 Actions 배포 결과입니다. 운영 DB 보안·백업까지 정상 판정한 것은 아닙니다.

## 이번 변경 검증

- Node 24.13.1의 로컬 검증: 전체 자동 테스트 308개 통과, 신규 설정 테스트 5개 포함. CI의 Node 22 검사는 PR에서 별도 실행합니다.
- 프런트엔드 Vite 빌드 통과. 전체 네트워크 기반 HTML/PDF 생성은 로컬에서 실행하지 않았습니다.
- 테스트 프로젝트 환경변수를 주입하고 브라우저 클라이언트·Explore API·공개 상세 API·콘텐츠 읽기·빌드 설정이 같은 프로젝트를 선택하는지 확인했습니다. 네트워크는 mock으로 대체했습니다.
- 새 설정·점검 코드와 Vite 설정에 대한 ESLint 검사 통과.
- 이 변경은 운영 배포, 새 Supabase 프로젝트 생성, DB 이력 수정, 기존 PC 폴더 업데이트를 수행하지 않습니다.

## 후속 로컬 동기화 및 Vercel 확인 (17:13 KST)

- 기존 바탕화면 저장소는 현재 작업 환경에서 Git 접근이 거부되어 직접 pull하지 못했습니다. 원본 파일이나 미커밋 작업을 덮어쓰지 않았습니다.
- 쓰기 가능한 `C:\Users\ljh90\Documents\Codex\2026-10-14\new-chat-5\work\smart-jsa-bridge-main`에 원격 main과 동일한 별도 Git 저장소를 준비했습니다. 1,039개 파일의 blob SHA, 전체 tree `f80d4e7ff2b227797e45aaee8113240cc41038a7`, 서명된 commit `13637aa17655663ce089e5f38e66518148a5e0af`를 검증했습니다. `git fsck --full` 통과, 작업 트리 깨끗함, main이 origin/main을 추적합니다.
- 이 저장소는 현재 커밋만 보유한 shallow checkout입니다. 셸의 외부 Git 네트워크가 제한되어 GitHub API 자료로 정확한 Git 객체를 복원했습니다. 기존 `.env.local`, 미커밋 파일, 설치 의존성은 복사하지 않았습니다. 네트워크가 가능한 일반 터미널에서 필요하면 `git fetch --unshallow origin`으로 이전 이력을 가져올 수 있습니다.
- 기존 바탕화면 저장소는 GitHub Desktop에서 저장소와 main 선택 → Changes 확인 → Fetch origin → Pull origin 순서로 갱신합니다. 수정 파일은 보존하고 충돌 안내가 있으면 강제 초기화하지 않습니다. PR #23은 초안이므로 main pull에 포함되지 않습니다.
- Vercel은 명시적 teamId 조회에서 403이 발생했지만, 같은 인증 계정의 기본 범위에서 프로젝트 조회와 운영 배포 목록 조회에 성공했습니다. 계정 전환은 하지 않았습니다. 최신 배포 `dpl_ByTwEwfcuCmVZXNH8qAdMktXZ2Kk`는 `READY`이며 main의 `13637aa`와 일치합니다.
