# 교훈 (Lessons Learned)

개발 중 실수에서 얻은 교훈. 같은 실수를 반복하지 않기 위해 기록한다.

---

## [2026-02-25] API 엔드포인트 불일치

**사건**: 프론트엔드가 `/posts/:slug/view`를 호출했지만 백엔드는 `/posts/:slug/unlock`만 존재 → 글 조회 기능 전체 불능.

**근본 원인**: 프론트와 백엔드가 서로 독립적으로 URL 문자열을 하드코딩. 양쪽을 연결하는 계약이 없었음.

**교훈**:

1. **두 앱의 경계면(API)은 구현 전에 `packages/shared`에 먼저 정의한다.**
   - 엔드포인트 경로, 요청/응답 타입을 shared에 선언한 뒤 양쪽에서 import.
   - URL 문자열을 각 앱에 하드코딩하지 않는다.

2. **타입 시스템이 검증할 수 없는 영역(문자열 경로 등)은 항상 런타임 버그 후보다.**
   - 컴파일이 통과해도 연동이 깨져 있을 수 있다.
   - "각자 잘 만들었다"와 "함께 잘 동작한다"는 다르다.

3. **새 엔드포인트를 추가하거나 이름을 바꿀 때는 반드시 `packages/shared`부터 수정한다.**
   - shared를 수정하면 양쪽 앱에서 타입 에러가 발생하므로 누락을 컴파일 단계에서 감지할 수 있다.

---

## [2026-03-01] Docker 배포 시 ESM/CJS 충돌 + nx prune이 package.json 덮어쓰기

**사건**: Railway 배포가 반복 실패. 두 가지 독립적인 문제가 동시에 존재했다.

### 문제 1: Node.js 20에서 ESM-only 패키지 require() 불가

**증상**: `ERR_REQUIRE_ESM` — 컨테이너 시작 즉시 크래시.

**근본 원인**: esbuild가 `bundle: false` + `format: ["cjs"]`로 빌드하므로, 모든 외부 의존성은 `require()`로 로드된다. 그런데 `nanoid` v5와 `express-rate-limit` v8은 `"type": "module"` (ESM-only) 패키지여서, Node.js 20에서는 `require()`로 불러올 수 없다.

**수정**: Dockerfile의 베이스 이미지를 `node:20-slim` → `node:22-slim`으로 변경. Node.js 22.12+는 `require()`로 ESM 모듈 로드를 기본 지원한다.

### 문제 2: `pnpm nx prune backend`가 esbuild의 package.json을 덮어씀

**증상**: `Cannot find module 'express'` — express, cors 등 런타임 의존성이 node_modules에 없음.

**근본 원인**: `@nx/js:prune-lockfile` executor의 output이 `dist/apps/backend/package.json`으로 지정되어 있어, esbuild의 `generatePackageJson`이 소스 코드 분석을 통해 만든 정확한 런타임 의존성 목록을 빌드 도구 의존성 목록으로 덮어썼다. 이후 `npm install --omit=dev`가 이 잘못된 package.json을 읽어 엉뚱한 패키지를 설치.

**수정**: Dockerfile에서 `RUN pnpm nx prune backend` 제거. esbuild의 `generatePackageJson`만으로 충분하다.

**교훈**:

1. **`bundle: false` CJS 빌드에서는 ESM-only 의존성을 주의한다.**
   - esbuild가 `import`를 `require()`로 변환하므로, ESM-only 패키지는 런타임에 깨진다.
   - Node.js 22+ 사용 또는 해당 패키지의 CJS 호환 버전 사용을 고려한다.
   - 의존성 추가 시 `package.json`의 `"type"` 필드를 확인하는 습관을 들인다.

2. **빌드 파이프라인에서 파일을 덮어쓰는 단계가 있는지 확인한다.**
   - Nx의 `prune-lockfile`은 `dist/`의 `package.json`을 output으로 지정하여 esbuild 결과물을 덮어쓸 수 있다.
   - `pnpm install`을 쓸 계획이 아니라면 pruned lockfile은 불필요하다.
   - Docker 빌드 실패 시 `start.sh`에 `cat package.json`, `ls node_modules/` 등 디버그 출력을 추가하면 빠르게 원인을 파악할 수 있다.

3. **배포 문제는 여러 원인이 겹칠 수 있다.**
   - 하나를 고쳐도 다른 문제가 드러날 수 있으므로, 각 수정 후 반드시 로그를 확인한다.

---

## [2026-03-01] 리버스 프록시 뒤에서 trust proxy 미설정

**사건**: 배포 후 API 호출 시 `express-rate-limit`이 `X-Forwarded-For` 헤더 관련 `ValidationError`를 던짐.

**근본 원인**: Railway 같은 PaaS는 리버스 프록시(로드 밸런서) 뒤에서 앱을 실행한다. 클라이언트의 실제 IP는 `X-Forwarded-For` 헤더로 전달되지만, Express의 `trust proxy` 기본값은 `false`이므로 이 헤더를 무시한다. `express-rate-limit`은 이 불일치를 감지하고 경고를 던진다.

**수정**: `app.set('trust proxy', 1)` 추가. 첫 번째 프록시의 `X-Forwarded-For` 값을 신뢰하도록 설정.

**교훈**:

1. **리버스 프록시 뒤에서 Express를 실행하면 `trust proxy`를 반드시 설정한다.**
   - rate limiter, 로깅, `req.ip` 모두 이 설정에 의존한다.
   - 미설정 시 모든 요청이 프록시 IP로 인식되어 rate limit이 전체 사용자에게 공유된다.

2. **로컬에서 발생하지 않는 에러도 배포 환경에서는 발생할 수 있다.**
   - 로컬 개발 시 프록시가 없으므로 이 문제가 드러나지 않는다.
   - 배포 후 로그를 반드시 확인한다.

---

## [2026-03-01] railway.toml의 dockerfilePath가 모든 서비스에 적용됨

**사건**: 프론트엔드 서비스에 `RAILWAY_DOCKERFILE_PATH=apps/frontend/Dockerfile`를 설정했으나, `railway up` 시 백엔드 Dockerfile(`apps/backend/Dockerfile`)로 빌드됨.

**근본 원인**: `railway.toml`의 `[build] dockerfilePath`는 프로젝트 레벨 설정으로, `railway up` 실행 시 연결된 서비스와 무관하게 적용된다. 서비스별 `RAILWAY_DOCKERFILE_PATH` 환경변수보다 `railway.toml`이 우선한다.

**수정**: `railway.toml`에서 `dockerfilePath` 제거, 각 서비스에 `RAILWAY_DOCKERFILE_PATH` 환경변수로 개별 설정.

**교훈**:

1. **멀티 서비스 프로젝트에서 `railway.toml`의 `dockerfilePath`는 사용하지 않는다.**
   - `railway.toml`은 모든 `railway up`에 적용되므로 서비스별 분기가 불가능하다.
   - 대신 각 서비스의 `RAILWAY_DOCKERFILE_PATH` 환경변수를 사용한다.

2. **새 서비스 배포 시 빌드 로그를 반드시 확인한다.**
   - 잘못된 Dockerfile로 빌드되면 빌드 자체는 성공하지만 런타임에 실패한다.
   - 빌드 단계 이름(COPY, RUN 등)을 읽어 의도한 Dockerfile이 실행되는지 검증한다.

---

## [2026-03-07] TypeScript tsconfig `paths`는 `extends`해도 머지되지 않는다

**사건**: `apps/frontend/tsconfig.json`에 `@/*` alias를 추가하기 위해 `paths`를 선언했더니, `tsconfig.base.json`에 있던 `@private-board/shared` 경로가 사라져 빌드 실패.

**근본 원인**: TypeScript의 `extends`는 `paths`를 deep merge하지 않는다. 자식 tsconfig에서 `paths`를 선언하면 부모의 `paths` 전체가 덮어써진다.

**교훈**:

1. **자식 tsconfig에서 `paths`를 추가할 때는 부모의 `paths`도 함께 선언해야 한다.**
   - 또는 부모 `paths`에 의존하지 않는 구조를 만든다 (pnpm workspace symlink, `transpilePackages` 등).

2. **`paths`가 실제로 필요한지 먼저 확인한다.**
   - pnpm workspace로 패키지가 `node_modules`에 심링크되어 있으면 `paths` 없이도 TypeScript가 찾을 수 있다.

---

## [2026-03-07] shared 패키지를 UI 전용 상수의 거처로 오해

**사건**: `REPORT_REASON_LABELS` (한국어 표시용 매핑)을 `packages/shared`에 선언했다가 프론트엔드로 옮김.

**근본 원인**: `ReportReason` 타입이 shared에 있으니 관련 상수도 shared에 두는 게 맞다는 잘못된 판단. shared의 목적을 혼동.

**교훈**:

1. **`packages/shared`에는 프론트엔드와 백엔드가 실제로 둘 다 사용하는 것만 둔다.**
   - 타입, API 경로, 요청/응답 인터페이스 등.
   - UI 표시용 텍스트, 스타일 관련 상수 등 프론트 전용 코드는 shared에 두지 않는다.

2. **"같은 도메인"이라고 같은 패키지에 두는 게 아니다. "같은 소비자"일 때만 공유한다.**

---

## [2026-03-07] esbuild `bundle: false`에서 workspace 패키지가 런타임에 누락

**사건**: Railway 배포 후 `Cannot find module '@private-board/shared'` 에러로 백엔드 크래시. 로컬 빌드는 정상.

**근본 원인**: esbuild `bundle: false`는 각 파일을 독립적으로 트랜스파일만 하고 import를 따라가지 않는다. `require('@private-board/shared')`가 output JS에 그대로 남지만, `generatePackageJson`은 이 패키지를 의존성에 포함시키지 않는다. Docker 프로덕션 이미지에서 `npm install` 후 이 패키지가 없어 런타임 크래시.

**수정**: `bundle: true` + `tsconfig.base.json`에 `paths` 복원. esbuild가 tsconfig path를 로컬 파일로 인식해 shared 코드를 번들에 인라인으로 포함.

**교훈**:

1. **esbuild `bundle: false`는 "트랜스파일만" 한다. 모듈 해석이 없다.**
   - workspace 패키지처럼 `node_modules`에 없는 의존성은 런타임에 반드시 깨진다.
   - Docker 배포 시 생성된 `dist/package.json`에 모든 런타임 의존성이 있는지 확인한다.

2. **workspace 패키지를 번들에 포함시키려면 `bundle: true` + tsconfig `paths`를 함께 써야 한다.**
   - tsconfig `paths`로 로컬 파일을 가리키면 esbuild가 external 처리 없이 번들에 포함시킨다.
   - `node_modules`에 심링크로 존재하는 경우, esbuild의 `externalDependencies: 'all'`(기본값)이 자동으로 external 처리해버리므로 주의.
