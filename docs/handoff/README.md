# Claude → Codex 인수인계

작성: 2026-09-21. 기능 코드 변경 없이 지침과 작업 기억의 진입점을 추가했다.

## 어디서 시작하는가

- [AGENTS.md](../../AGENTS.md): Codex용 시작 지침, 공통 작업 규칙.
- [MEMORY.md](MEMORY.md): 확인한 사용자 선호·현재 설계·운영 주의사항 요약.
- [board-camera.md](board-camera.md): 최근 흰색 판 수정, 프레임 검증 결과, 이어갈 일.
- [legacy-memory-index.md](legacy-memory-index.md): Claude 개인 메모리 300개 파일의 검색 목록. 전체 본문을 옮겼다는 뜻은 아니다.
- [CLAUDE.md](../../CLAUDE.md): 프로젝트 기능별 인덱스. 각 기능 폴더의 CLAUDE.md와 `.claude/agents/`는 계속 공통 참조한다.

Codex는 AGENTS.md를 프로젝트 지침으로 읽는다. 이 파일에서 기존 문서를 명시적으로 읽도록 연결했다.
Claude의 개인 memory나 에이전트 정의를 자동 실행/자동 로드한다고 가정하지 않는다.
동작 근거: [OpenAI 공식 AGENTS.md 문서](https://learn.chatgpt.com/docs/agent-configuration/agents-md).

## 이 컴퓨터의 작업 위치 — 2026-09-21 스냅샷

| 위치 | 확인한 상태 |
|---|---|
| `C:/projects/tangobook` | main으로 전환할 기본 개발 폴더. 전환 전 `claude/jeonrae-part2`의 변경은 로컬 보관 후 이동 |
| `C:/projects/tangobook/.claude/worktrees/board-white-plate` | 최근 작업 폴더. `fix/board-white-plate-contours`, 기준 커밋 `1822d143` |
| `origin/main` | 흰색 판 수정 `1822d143` push 확인. 실제 배포 완료는 별도 확인 필요 |

위 경로/브랜치를 영구 상수로 쓰지 않는다. 작업 시작 시 Git으로 다시 확인한다.
다른 컴퓨터에서는 정상적인 최신 main checkout에서 작업하면 된다.
전환 완료 후 이 루트에서 공통 AGENTS.md와 인수인계를 바로 읽을 수 있다.
전환/브랜치 보관의 정확한 상태·복구 지점은 공통 Git 디렉터리의 `codex-main-migration-20260921/` 기록을 확인한다.

## 확인한 기존 문서

- 최신 checkout의 루트 CLAUDE.md, 기능별 문서 목록과 게임/파닉스 관련 절, board-vision 지침.
- `C:/Users/101024/.claude/projects/c--projects-tangobook/memory/MEMORY.md`와 관련 주제 메모리.
- 이 디렉터리의 Markdown 파일은 300개(인덱스 포함)다. 파일 목록을 수집하고 주요 운영·설계·보드 주제를 읽어 요약했다. 300개 본문 전체를 검토하거나 복제한 것은 아니다.
- `c--projects-tangobook-0-1/memory/MEMORY.md`도 확인했다. 2026-03-20 이전 구조/작업 브랜치 기록이므로 현재 기준으로 사용하지 않는다.
- 개인 세션 대화 로그·환경변수·토큰은 이관 대상에 넣지 않았다.

## 기능별 참조

| 작업 | 먼저 읽을 문서 |
|---|---|
| 동화책/저작도구 | [storybook](../../packages/client/src/features/storybook/CLAUDE.md), [editor](../../packages/client/src/features/editor/CLAUDE.md) |
| 학습 게임/보드 | [games](../../packages/client/src/features/games/CLAUDE.md), [board-camera](board-camera.md) |
| 파닉스 | [저작](../../packages/client/src/features/phonics/CLAUDE.md), [학습자](../../packages/client/src/features/phonics-learner/CLAUDE.md) |
| 뷰어/소리 | [viewer](../../packages/client/src/features/viewer/CLAUDE.md), 루트 CLAUDE.md의 iOS 오디오 절 |
| 인증/학습 기록 | [auth](../../packages/client/src/features/auth/CLAUDE.md), [learning](../../packages/client/src/features/learning/CLAUDE.md) |
| 마케팅/블로그 | [marketing](../../packages/client/src/features/marketing/CLAUDE.md), [blog](../../packages/client/src/features/blog/CLAUDE.md) |
| 영상 | [audiobook](../../packages/client/src/features/audiobook/CLAUDE.md), [longform-video](../../packages/client/src/features/longform-video/CLAUDE.md) |
| 전략 | [STRATEGY.md](../STRATEGY.md), [ROADMAP.md](../ROADMAP.md), [.claude/agents/strategy-director.md](../../.claude/agents/strategy-director.md) |

기존 문서의 오래된 포트·워크트리·배포 완료·테스트 통과 숫자는 현재 사실로 인용하지 않는다.
포트는 `packages/client/vite.config.ts`, 서버 설정과 실제 실행 로그에서 확인한다.
특히 9월 17일 루트 checkout에서 실행한 전체 테스트 결과는 최신 main 결과가 아니다.

## 다음 작업

1. 보드: 09:44 흰색 판 프레임의 남은 실패를 별도 진단. 이미 고친 09:48 프레임과 한글/영어 표본 회귀 유지.
2. 실기기: push된 수정의 배포 버전과 실제 폰/태블릿 연속 인식 확인.
3. 저장소 정리: 오래된 브랜치는 복구 참조를 남겨 정리한다. 다른 작업 폴더의 미커밋 파일은 그대로 보존한다.
4. 과거 메모리의 중요 항목을 실제로 사용할 때 현재 코드와 대조하고, 필요한 결정만 공통 문서로 승격한다.
