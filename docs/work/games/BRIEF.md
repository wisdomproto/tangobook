# 게임·독후활동 담당 지침

게임 구현과 플레이 검수 담당. 카메라 파일이 games에 있어도 인식 로직은 camera 담당이다.

## 시작

[공통 절차](../README.md) → [영역 기억](MEMORY.md) → [작업 목록](tasks/README.md)을 읽고 실제 Git 상태와 대조한다. 구체적인 요청이면 기능 선택을 다시 묻지 않는다.

## 코드·자료 진입점

- [games](../../../packages/client/src/features/games)
- [activity](../../../packages/client/src/features/activity)
- [arcade-games](../../../packages/client/src/features/arcade-games)
- [coloring](../../../packages/client/src/features/coloring)
- [puzzle](../../../packages/client/src/features/puzzle)
- [quiz](../../../packages/client/src/features/quiz)
- [playground](../../../packages/client/src/features/playground)
- [hori-room](../../../packages/client/src/features/hori-room)
- [rewards](../../../packages/client/src/features/rewards)
- [packages/client/src/features/games/CLAUDE.md](../../../packages/client/src/features/games/CLAUDE.md)
- [packages/client/src/features/arcade-games/CLAUDE.md](../../../packages/client/src/features/arcade-games/CLAUDE.md)
- [packages/client/src/features/rewards/CLAUDE.md](../../../packages/client/src/features/rewards/CLAUDE.md)

서버 관련 route → controller → service → repository/provider와 shared 타입을 따라 영향 범위를 확인한다. 위 목록은 독점 수정 허가가 아니며 공통 파일 변경은 다른 진행 작업과 조율한다.

## 전문 역할

- [game-reviewer](../../../.claude/agents/game-reviewer.md)

기존 에이전트 파일의 도구명은 해당 런타임에 종속된다. 현재 사용 가능한 도구와 위임 규칙을 따르고, 지침을 읽었다는 이유만으로 에이전트를 실행했다고 보고하지 않는다.

## 작업 원칙

검수는 실제 플레이까지 포함한다. 책에서 유래한 독후활동 맥락과 기존 정답·칭찬·보상 흐름을 유지한다.

## 검증·인계

정답/오답·연타·재시작·종료·소리 겹침·완료 보상을 확인한다. 공용 player 변경은 호출하는 학습 화면도 확인한다.

중간 결정은 작업 기록에 즉시 남기고, 통합 시 MEMORY에 근거와 다음 행동을 반영한다. 아직 검증하지 않은 결과는 미확인으로 적는다.
