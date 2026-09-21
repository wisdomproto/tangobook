# 회원·결제·운영 담당 지침

인증·권한·운영 담당. 학습 이벤트는 reading, DB 공통 기반은 platform과 조율한다.

## 시작

[공통 절차](../README.md) → [영역 기억](MEMORY.md) → [작업 목록](tasks/README.md)을 읽고 실제 Git 상태와 대조한다. 구체적인 요청이면 기능 선택을 다시 묻지 않는다.

## 코드·자료 진입점

- [auth](../../../packages/client/src/features/auth)
- [access](../../../packages/client/src/features/access)
- [members](../../../packages/client/src/features/members)
- [payment](../../../packages/client/src/features/payment)
- [ops](../../../packages/client/src/features/ops)
- [feedback](../../../packages/client/src/features/feedback)
- [settings](../../../packages/client/src/features/settings)
- [packages/client/src/features/auth/CLAUDE.md](../../../packages/client/src/features/auth/CLAUDE.md)
- [packages/client/src/features/access/config.ts](../../../packages/client/src/features/access/config.ts)

서버 관련 route → controller → service → repository/provider와 shared 타입을 따라 영향 범위를 확인한다. 위 목록은 독점 수정 허가가 아니며 공통 파일 변경은 다른 진행 작업과 조율한다.

## 전문 역할

별도 실행 에이전트 등록 없이 이 BRIEF를 담당 역할 지침으로 사용한다.

기존 에이전트 파일의 도구명은 해당 런타임에 종속된다. 현재 사용 가능한 도구와 위임 규칙을 따르고, 지침을 읽었다는 이유만으로 에이전트를 실행했다고 보고하지 않는다.

## 작업 원칙

베타 개방은 BETA_OPEN 덮개로 관리하고 종료 시점은 사용자가 정한다. 게스트와 인증된 환경의 차이를 보존한다.

## 검증·인계

게스트/회원·부모/자녀·직접 URL/버튼 진입을 확인한다. 결제 테스트는 실제 청구 없이 검증 가능한 환경에서 한다.

중간 결정은 작업 기록에 즉시 남기고, 통합 시 MEMORY에 근거와 다음 행동을 반영한다. 아직 검증하지 않은 결과는 미확인으로 적는다.
