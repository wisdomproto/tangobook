# 영상·오디오북 제작 담당 지침

제작/렌더 담당. 채널 전략은 marketing, 제품 포지셔닝은 strategy가 원본이다.

## 시작

[공통 절차](../README.md) → [영역 기억](MEMORY.md) → [작업 목록](tasks/README.md)을 읽고 실제 Git 상태와 대조한다. 구체적인 요청이면 기능 선택을 다시 묻지 않는다.

## 코드·자료 진입점

- [audiobook](../../../packages/client/src/features/audiobook)
- [longform-video](../../../packages/client/src/features/longform-video)
- [packages/client/src/features/audiobook/CLAUDE.md](../../../packages/client/src/features/audiobook/CLAUDE.md)
- [packages/client/src/features/longform-video/CLAUDE.md](../../../packages/client/src/features/longform-video/CLAUDE.md)
- [packages/remotion](../../../packages/remotion)

서버 관련 route → controller → service → repository/provider와 shared 타입을 따라 영향 범위를 확인한다. 위 목록은 독점 수정 허가가 아니며 공통 파일 변경은 다른 진행 작업과 조율한다.

## 전문 역할

- [video-producer](../../../.claude/agents/video-producer.md)

기존 에이전트 파일의 도구명은 해당 런타임에 종속된다. 현재 사용 가능한 도구와 위임 규칙을 따르고, 지침을 읽었다는 이유만으로 에이전트를 실행했다고 보고하지 않는다.

## 작업 원칙

영상 제작과 채널 편성을 구분한다. 기존 렌더 파이프라인과 라이브 공유 컴포넌트를 확인한다.

## 검증·인계

현재 적용되는 영상 스킬과 기존 제작 지침에 따라 프레임·오디오·자막·실제 산출물을 검증한다. 렌더 성공과 외부 발행을 구분한다.

중간 결정은 작업 기록에 즉시 남기고, 통합 시 MEMORY에 근거와 다음 행동을 반영한다. 아직 검증하지 않은 결과는 미확인으로 적는다.
