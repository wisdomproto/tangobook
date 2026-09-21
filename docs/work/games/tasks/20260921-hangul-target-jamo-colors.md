# 한글 블록 예시 단어 자모 색상

- id: 20260921-games-hangul-target-jamo-colors
- domain: games
- status: integrated
- updated: 2026-09-21
- base: 2106623ee
- branch: codex/hangul-target-colors
- worktree: C:/projects/tangobook/.codex/worktrees/hangul-target-colors
- integration: main 로컬 통합
- delivery: 미푸시·미배포

## 요청과 완료 조건

한글 블록 게임 상단 예시 단어도 실물·화면 블록과 같은 색 규칙으로 표시한다. 초성·받침은 주황색, 모음은 녹색이어야 하며 세로·가로 모음과 받침이 있는 음절에서도 조합 관계를 알아볼 수 있어야 한다.

## 읽은 기억과 변경 범위

[게임 MEMORY](../MEMORY.md), [블록 놀이 작업](20260921-blocks-analog-digital-hub.md), 루트·게임 기능 지침과 디자인 시스템을 확인했다. `KoreanBlockPlayer`, `TangoBoard`의 실물 블록 색상과 예시 단어 표시만 변경하며 인식·조합 로직은 건드리지 않는다.

## 결정과 진행

- 완성형 한글 글리프 내부에는 초성·중성별 CSS 색상을 줄 수 없으므로, 음절 모양을 유지하는 자모 격자 표시를 사용한다.
- 자음·받침은 화면 블록의 주황색, 모음은 화면 블록의 녹색 상수를 공유한다.
- 오른쪽 모음은 초성과 나란히, 아래 모음은 초성 아래에 놓고 받침은 마지막 줄에 둔다. 정답 타이핑 효과와 스크린리더용 완성 단어도 유지한다.

## 검증

- `ColoredHangulWord.test.tsx`와 기존 판 조합 테스트: 2파일 16개 통과. 초성·받침 주황색, 중성 녹색과 옆/아래 모음 배치를 확인했다.
- 클라이언트 `tsc --noEmit`과 Vite 프로덕션 빌드 통과.
- 로컬 Vite를 `DISABLE_PUBLISH_SCHEDULER=1`, 운영 API 읽기 전용 프록시로 실행하고 1680×1050에서 `나무`와 받침 단어 `집`을 확인했다. 색상은 각각 `rgb(240, 158, 92)`, `rgb(89, 184, 158)`이며 판·버튼과 겹치지 않았다.

## 다음 행동

사용자 요청이 있으면 main을 원격에 push하고 배포 화면에서 한 번 더 확인한다.

## 인계·통합

코드와 이 기록을 같은 로컬 커밋으로 묶어 main에 통합한다. 현재 요청에는 main push가 포함되지 않아 원격 배포는 하지 않는다.
