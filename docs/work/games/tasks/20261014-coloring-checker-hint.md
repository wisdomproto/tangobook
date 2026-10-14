# 색칠 체크무늬 원인 확인·공통 안내 교체

- id: 20261014-coloring-checker-hint
- domain: games
- status: integrated
- updated: 2026-10-14
- base: 4f817c0bf
- branch: codex/storybook-learning-ui
- worktree: C:/Users/kil21/.codex/worktrees/platform-ui-v2/tangobook
- integration: d506c52dc 코드·검증 기록 로컬 main fast-forward 통합 확인
- delivery: 사용자 승인 main push 완료(fd93f4884 원격 SHA 확인), 운영 배포 완료는 미확인

## 요청

신데렐라 장면 색칠에서 보이는 체크무늬를 없애고 다른 이미지에도 있는지 확인한다.

## 원인·결정

- 이전 메뉴 검수 때 원인 미분리로 남긴 말 영역 체크무늬는 ColoringPlayer가 선택한 색의 미완료 칸 위에 그리는16px 체크 안내다. 신데렐라6·9쪽/개구리 왕자3·8쪽 원본4장을 버전 SHA와 비교하고 육안 확인했으며 원본에는 체크무늬가 없다.
- 같은 플레이어를 쓰는 장면2430장/어휘/독후 활동/저작 미리보기에도 생길 수 있다. 원본 교체보다 공통 힌트 렌더링을 바꾸는 것이 맞다.
- 칸을 이미 칠한 것처럼 보이는 전체 면 채색도 피하고, 안쪽 가장자리의 은은한 색 안내로 바꾼다. 입력/정답색/90% 채움/영역/완료·읽어주기 흐름은 보존한다.
- 원본 CDN은 직접 요청403, 로컬 검수 Vite가 종료된 상태라5186 재시작(DISABLE_PUBLISH_SCHEDULER=1, 운영 API 읽기 프록시). 원본/다른 도안 비교를 계속한다.
- 이번 작업은 신규 그림 생성 또는 운영 R2 덮어쓰기가 필요하다고 단정하지 않는다. root/main 외 기존 미추적 파일과 ReviewWriteActivity.test.tsx 줄바꿈 변경은 보존한다.

## 검증 결과

- 공통 힌트 알고리즘을 `lib/coloring-hint.ts`로 추출. 기존 전체 칸 체크 채색을 안쪽 경계로 교체하고 내부 픽셀은 투명하게 유지한다. 추가 이미지 다운로드/외부 라이브러리 없음. 현재 선택/칠한 칸 제외/밝은 물감 대비/기존 pulse는 유지한다.
- 관련3파일15테스트 통과(신규 경계 힌트3회귀 + 기존 장면 영역/저작 회귀). 전체 내부·16px 셀 위치 투명, 이전 선택/완료 칸 제외, 얇은 칸·캔버스 모서리·인접 칸 누출 방지를 검증했다.
- client typecheck, 변경 TS/TSX ESLint, client build 통과. build의 기존 Browserslist/lottie eval/동적·정적 import/큰 chunk 경고는 남아 있다.
- 실제 localhost5186 메뉴에서 신데렐라6쪽 물감 전환→보라색 망토 붓질→다시 초기화 검수. 체크 패턴 없이 안쪽 선만 안내하며 직접 칠한 붓자국과 초기화가 정상이다. 신데렐라 어휘 계단/개구리 왕자3쪽도 체크 없이 렌더링 확인했다.
- 원본4장 육안 검사와 실제 대표3화면 검수다.2430개 원본 전수 육안 검사/모든 게임 완주/실기기 검증으로 보고하지 않는다. 공통 플레이어 교체는 모든 장면·어휘 caller에 적용된다. 운영 원본/R2/책 데이터 수정 없음.
- 원본 증거: worktree `output/coloring-hint-checker-20261014/`(미추적). 화면 증거: `C:/Users/kil21/.codex/visualizations/2026/10/11/01a12b90-4491-7c02-b97d-b867f6ec4b02/{cinderella,vocabulary,frog-prince}-coloring-outline-20261014.png`.

## 전달

코드·관련 기록7파일을 d506c52dc에 로컬 커밋하고 root main에 fast-forward, 동일 HEAD와 tracked clean 확인. 기존 미추적 출력과 다른 쓰기 테스트 줄바꿈 변경을 보존했다. 이번 작업의 main push 요청은 없으므로 원격에는 전달하지 않았다. Vite5186은 검수 후 유지하고 임시 검수 탭만 닫았다.

2026-10-14 후속 `메인에 푸시하자` 승인으로 fetch 후 origin/main...HEAD=0/2와 대상2커밋을 확인했다. 일반 push로4f817c0bf→fd93f4884 전달, ls-remote main/로컬 HEAD 일치·0/0 확인. 위 미푸시 문구는 당시 상태다. 이 전달 기록도 함께 push한다. Railway 배포 완료는 별도 미확인.
