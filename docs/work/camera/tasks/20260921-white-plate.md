# 흰색 판 카드 인식 수정과 남은 진단

- id: 20260921-camera-white-plate
- domain: camera
- status: paused
- updated: 2026-09-21
- base: edb40a3c
- branch: fix/board-white-plate-contours
- worktree: .claude/worktrees/board-white-plate (현재 존재 여부와 HEAD 재확인)
- integration: 1822d143 수정은 main 통합 완료; 남은 진단은 미착수
- delivery: 1822d143 원격 main push 확인; 실제 배포·실기기 검증 미확인

## 요청과 완료 조건

흰색 판에서 한글·영어 실물 블록 인식을 재검증한다. 동일 프레임 비교를 유지하고 미해결 입력을 구분한다.

## 읽은 기억과 변경 범위

[영역 기억](../MEMORY.md), [상세 입력·결과·재현 방법](../../../handoff/board-camera.md), [board-vision](../../../../.claude/agents/board-vision.md).
인식 코드는 packages/client/public/tango-reco.js. 실험실 HTML과 앱이 같은 원본을 쓴다.

## 결정과 진행

2026-09-21: RETR_EXTERNAL 대신 RETR_LIST와 연결성분별 가장 큰 윤곽을 사용하여 흰 판 내부 카드 윤곽을 유지했다. 보내기 결과는 동영상이 아니라 R2의 p/s JPEG 쌍이다.

## 검증

node --check 통과. 수정 전 edb40a3c / 수정 후 1822d143을 같은 형판·grab/read 경로로 비교했다.

- p1789951690972: 카드 7/자모 7/댲굽 → 카드 8/자모 8/댲굽바.
- p1789951473662: 카드 7/자모 6/댜굽, 개선되지 않음.
- 기존 한글 11장·영어 2장의 출력과 검출 수 불변. 기존 실패도 포함한다.
- 획 블록 전체와 실기기 연속 인식은 미검증. 이번 문서 이관 때 인식 테스트를 다시 돌린 것은 아니다.

## 다음 행동

09:44 입력 p1789951473662의 카드 누락과 글자 거절 원인을 분리한다. 상세 인수인계의 입력 방향·형판·버전을 확인한 뒤 이전 결과를 재현하고 새 수정과 비교한다. 임시 하네스가 없으면 기록된 R2 키와 앱 경로로 재구성한다.

## 인계·통합

기존 수정은 main에 포함되어 있다. 남은 작업을 시작할 때 옛 worktree가 최신 main을 포함하는지 먼저 확인하고 재사용 또는 새 분리를 결정한다. 인식 실패 하나를 고친 사실을 전체 문제 해결로 요약하지 않는다.
