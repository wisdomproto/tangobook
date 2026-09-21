# 책 읽기·학습 기록 담당 지침

읽기 경험과 학습 이력 담당. 로그인은 account, 공통 오디오는 platform과 조율한다.

## 시작

[공통 절차](../README.md) → [영역 기억](MEMORY.md) → [작업 목록](tasks/README.md)을 읽고 실제 Git 상태와 대조한다. 구체적인 요청이면 기능 선택을 다시 묻지 않는다.

## 코드·자료 진입점

- [viewer](../../../packages/client/src/features/viewer)
- [continuous](../../../packages/client/src/features/continuous)
- [learning](../../../packages/client/src/features/learning)
- [ebook-mosquito](../../../packages/client/src/features/ebook-mosquito)
- [packages/client/src/features/viewer/CLAUDE.md](../../../packages/client/src/features/viewer/CLAUDE.md)
- [packages/client/src/features/learning/CLAUDE.md](../../../packages/client/src/features/learning/CLAUDE.md)

서버 관련 route → controller → service → repository/provider와 shared 타입을 따라 영향 범위를 확인한다. 위 목록은 독점 수정 허가가 아니며 공통 파일 변경은 다른 진행 작업과 조율한다.

## 전문 역할

별도 실행 에이전트 등록 없이 이 BRIEF를 담당 역할 지침으로 사용한다.

기존 에이전트 파일의 도구명은 해당 런타임에 종속된다. 현재 사용 가능한 도구와 위임 규칙을 따르고, 지침을 읽었다는 이유만으로 에이전트를 실행했다고 보고하지 않는다.

## 작업 원칙

iOS에서는 실제 재생 요소를 제스처에서 해금하고 재사용한다. 책 ID 변경은 학습 기록 호환성과 함께 검토한다.

## 검증·인계

페이지 전환·나레이션 취소·연속재생·종료 기록·게스트/로그인 복귀를 확인한다.

중간 결정은 작업 기록에 즉시 남기고, 통합 시 MEMORY에 근거와 다음 행동을 반영한다. 아직 검증하지 않은 결과는 미확인으로 적는다.
