# 카메라·블록 인식 담당 지침

보드 인식과 카메라 연결 담당. 실물 도면은 hardware, 학습 화면 흐름은 games/phonics와 함께 검증한다.

## 시작

[공통 절차](../README.md) → [영역 기억](MEMORY.md) → [작업 목록](tasks/README.md)을 읽고 실제 Git 상태와 대조한다. 구체적인 요청이면 기능 선택을 다시 묻지 않는다.

## 코드·자료 진입점


- [docs/handoff/board-camera.md](../../../docs/handoff/board-camera.md)
- [packages/client/public/tango-reco.js](../../../packages/client/public/tango-reco.js)
- [packages/client/src/features/games/hooks/useBoardCamera.ts](../../../packages/client/src/features/games/hooks/useBoardCamera.ts)
- [packages/client/src/features/games/components/players/BoardCameraPanel.tsx](../../../packages/client/src/features/games/components/players/BoardCameraPanel.tsx)

서버 관련 route → controller → service → repository/provider와 shared 타입을 따라 영향 범위를 확인한다. 위 목록은 독점 수정 허가가 아니며 공통 파일 변경은 다른 진행 작업과 조율한다.

## 전문 역할

- [board-vision](../../../.claude/agents/board-vision.md)

기존 에이전트 파일의 도구명은 해당 런타임에 종속된다. 현재 사용 가능한 도구와 위임 규칙을 따르고, 지침을 읽었다는 이유만으로 에이전트를 실행했다고 보고하지 않는다.

## 작업 원칙

인식 원본은 tango-reco.js다. 사진 재생과 실기기 연속 인식은 다른 증거이며 보내기 결과는 R2 정지 프레임이다.

## 검증·인계

node --check와 동일 입력 전후 비교를 수행한다. 한글/영어·기존 실패를 구분하고 방향·형판·버전을 기록한다.

중간 결정은 작업 기록에 즉시 남기고, 통합 시 MEMORY에 근거와 다음 행동을 반영한다. 아직 검증하지 않은 결과는 미확인으로 적는다.
