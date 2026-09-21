# TangoBook — agent entry point

Claude Code와 Codex가 같은 프로젝트 지식으로 작업하기 위한 진입점이다.
사용자에게는 한국어 존댓말로 답한다. 현재 사용자 지시와 실제 코드/검증 결과가 오래된 메모보다 우선한다.

## 시작 순서

1. `git rev-parse --show-toplevel`, `git branch --show-current`, `git status --short`, `git worktree list`로 실제 작업 위치와 기존 변경을 확인한다. 폴더 이름이 main이라는 보장은 없다.
2. [인수인계](docs/handoff/README.md)와 [공유 메모리](docs/handoff/MEMORY.md)를 읽는다.
3. [CLAUDE.md](CLAUDE.md)의 해당 주제와 수정하는 기능 폴더의 `CLAUDE.md`를 읽는다. 파일 이름이 Claude라고 무시하지 않는다. 문서가 길면 제목을 검색해 필요한 절을 읽는다.
4. 카메라/블록 인식은 [보드 인수인계](docs/handoff/board-camera.md)와 [.claude/agents/board-vision.md](.claude/agents/board-vision.md)를 먼저 읽는다.
5. 과거 결정이 필요하면 [기존 메모리 목록](docs/handoff/legacy-memory-index.md)에서 관련 파일을 찾는다. 개인 폴더가 없는 환경은 저장소 문서와 코드로 진행하고, 확인하지 못한 과거 내용은 추정하지 않는다.

## Git와 외부 작업

- 최신 기준은 fetch 후의 `origin/main`이다. 이 저장소에는 이력 재작성 전후 브랜치와 미커밋 작업이 많다. ahead/behind 숫자만 보고 일괄 merge/reset하지 않는다.
- 기존 미커밋/미추적 파일과 다른 작업 폴더를 보존한다. `git add -A`, `git add .`, `git checkout .`, `git restore .`를 사용하지 않는다. 변경 파일을 이름으로 stage하고 커밋 직전 경로·브랜치·staged diff를 확인한다.
- 작업 완료 후 관련 변경만 로컬 커밋한다. main push/배포는 사용자가 해당 작업에 요청했을 때만 한다. 이미 받은 요청은 다시 묻지 않는다. 이전 작업의 push 요청을 새 작업에 확대하지 않는다.
- Railway 배포 브랜치는 원격 main이다. 요청된 push 전 `git rev-list --left-right --count origin/main...HEAD`를 확인한다. 갈라진 이력을 force-push로 덮지 않는다.
- 로컬 서버 실행 전 `DISABLE_PUBLISH_SCHEDULER=1`을 설정하고 코드가 이 옵션을 지원하는지 확인한다. 운영 자격증명이 있으면 부팅만으로 예약 콘텐츠가 발행될 수 있다.
- `.env`, `.env.*`, 키/토큰, 개인 세션 로그를 문서나 커밋에 옮기지 않는다. R2/Supabase 데이터 수정·배치 생성·외부 게시 작업은 현재 요청 범위를 확인한다.

## 코드와 실행

- pnpm monorepo: `packages/client`(React), `server`(Express), `shared`(타입/순수 로직), `remotion`(영상).
- 서버: routes → controllers → services → repositories/providers. 공통 응답·`AppError`·`asyncHandler`를 재사용한다.
- 프런트: TanStack Query는 서버 데이터, Zustand는 UI 상태. `api/* → hooks/* → components/*` 흐름을 따른다.
- 기존 R2 데이터와 호환되게 변경한다. 현재 책 모델은 한 책 = 한 그림체·한 레벨이다. 과거 `styleAssets`/레벨 사본 설계를 다시 도입하지 않는다.
- `shared`의 런타임 상대 import는 `.js` 확장자를 유지한다. tsc 성공만으로 Node ESM 실행 성공을 단정하지 않는다.
- 스타일 작업은 [디자인 시스템](docs/design-system.md), 제품/사업 판단은 [전략](docs/STRATEGY.md)을 참조한다. 기존 자산·공유 컴포넌트·현황 집계부터 찾는다.
- `.claude/agents/*.md`는 도메인 지침으로 읽을 수 있다. Claude 전용 도구명·자동 에이전트 호출을 Codex에서 실행된 것으로 간주하지 않는다. 실제 사용 가능한 도구와 현재 세션의 위임 규칙을 따른다.

## 검증

```powershell
pnpm install --frozen-lockfile
pnpm typecheck
pnpm --filter server test
pnpm --filter client test
pnpm lint
pnpm build
```

- 전부를 매번 실행하는 목록이 아니다. 변경 범위에 맞는 검증을 하고 결과와 한계를 보고한다. 문서만 변경하면 링크·경로·diff를 확인한다.
- 설치는 실제 작업 폴더에서 한다. 훅 도구가 없으면 의존성/실행 경로를 고치고 훅을 건너뛰지 않는다.
- 정적 인식 JS는 `node --check packages/client/public/tango-reco.js`와 동일 프레임 전/후 비교가 필요하다. 일반 lint-staged 설정은 이 JS를 검사하지 않는다.
- 제품 변경, 낡은 테스트 기대값, 환경/모킹 실패를 구분한다. 기존 실패를 감추려고 기대값을 낮추지 않는다.
- 저장된 이미지, 브라우저 자동화, 실기기 실시간 테스트는 서로 다른 증거다. 사진 재생 결과를 실시간 검증으로 보고하지 않는다.

## 지식 유지

새 사실·반증·미해결 사항은 해당 도메인 문서에 이유와 재현법을 적고 `docs/handoff/MEMORY.md`에서 연결한다.
`CLAUDE.md`와 기능별 문서는 공통 원본으로 유지하며, 같은 규칙을 여러 곳에 길게 복사하지 않는다.
