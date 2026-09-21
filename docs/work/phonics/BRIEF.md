# 파닉스·어휘 담당 지침

교육 순서와 활동 구현 담당. 공용 게임은 games, 인식 엔진은 camera와 조율한다.

## 시작

[공통 절차](../README.md) → [영역 기억](MEMORY.md) → [작업 목록](tasks/README.md)을 읽고 실제 Git 상태와 대조한다. 구체적인 요청이면 기능 선택을 다시 묻지 않는다.

## 코드·자료 진입점

- [phonics](../../../packages/client/src/features/phonics)
- [phonics-learner](../../../packages/client/src/features/phonics-learner)
- [vocabulary](../../../packages/client/src/features/vocabulary)
- [vocabulary-unit](../../../packages/client/src/features/vocabulary-unit)
- [packages/client/src/features/phonics/CLAUDE.md](../../../packages/client/src/features/phonics/CLAUDE.md)
- [packages/client/src/features/phonics-learner/CLAUDE.md](../../../packages/client/src/features/phonics-learner/CLAUDE.md)
- [packages/client/src/features/vocabulary-unit/CLAUDE.md](../../../packages/client/src/features/vocabulary-unit/CLAUDE.md)

서버 관련 route → controller → service → repository/provider와 shared 타입을 따라 영향 범위를 확인한다. 위 목록은 독점 수정 허가가 아니며 공통 파일 변경은 다른 진행 작업과 조율한다.

## 전문 역할

- [phonics-builder](../../../.claude/agents/phonics-builder.md)
- [game-reviewer](../../../.claude/agents/game-reviewer.md)

기존 에이전트 파일의 도구명은 해당 런타임에 종속된다. 현재 사용 가능한 도구와 위임 규칙을 따르고, 지침을 읽었다는 이유만으로 에이전트를 실행했다고 보고하지 않는다.

## 작업 원칙

콘텐츠 언어와 UI 언어를 구분한다. 영어 블록게임은 Book 2~5이며 Book 1에는 다시 넣지 않는다. 언어별 교육 순서를 보존한다.

## 검증·인계

활동 진입부터 정답·소리·완료까지 플레이한다. 음원 프리워밍과 취소/재생 이벤트를 확인한다.

중간 결정은 작업 기록에 즉시 남기고, 통합 시 MEMORY에 근거와 다음 행동을 반영한다. 아직 검증하지 않은 결과는 미확인으로 적는다.
