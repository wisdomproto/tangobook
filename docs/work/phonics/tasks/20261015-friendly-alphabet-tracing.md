# 영어 알파벳 흔들림·끝맺음 판정 보완

- id: 20261015-friendly-alphabet-tracing
- domain: phonics
- status: complete
- updated: 2026-10-15
- base: 3977b8b4e
- branch: codex/phonics-word-journey
- worktree: C:/Users/kil21/.codex/worktrees/phonics-word-journey/tangobook
- delivery: a033b07e6 운영 successful/Active 확인. 운영 d UI·배포 판정 코드의 d/q 곡선 모의 검사 확인, native 곡선 완주는 미확인.

## 요청과 원인

사용자가 d/q도 아이가 대략 따라 쓰면 통과하도록 고치고 다른 알파벳을 전수 확인하도록 요청했다. 앞선 검수의 d/q 확인 필요를 이어받는다. 실제 system-ui 글꼴 가이드를 fixture로 보존했다(개인 데이터/진도 없음).

d/q는 손끝이 끝점에서32px 이내이고 경로 밖 이동0인데도, 가장 가까운 체크포인트 기준 남은 길이가16/19px여서 기존16px 끝맺음 조건에 걸렸다. 확장 검사로 Z/z 꺾임과 h 연결부의 폰트 투영 굴곡, g 끝부분, G/t 짧은 획도 확인했다. 좁은32px 전방 탐색이 폰트 투영의 작은 우회 구간에 멈추고 이후 올바른 입력까지 경로 밖으로 누적하기도 했다.

## 구현

- `moveTrace`의 영어 전용 softTurns는 앞으로64px 경로까지 살핀다. 실제 손끝과 경로 간 허용 폭32px는 유지한다. 반대 방향/큰 원의 먼 구간으로 임의 이동하지 않는다.
- `tracePassed`의 영어 전용 softEnd는 남은 경로가 최대64px/전체45% 이내이면서 **남은 모든 경로 점이 현재 손끝의32px 안에 있을 때만** 끝맺음을 허용한다. 끝점·전체 이동량62%·경로 밖 비율 조건도 유지한다. 반쪽이나 덜 그린 큰 굴곡은 거절한다.
- 짧은 가로획은 시작/끝 흔들림이 길이의 큰 부분을 차지하므로 전진량을 chord와32px 오차에 맞춰 판단한다. 최소4px 전진과 기존 전체 이동량/남은 경로 조건이 함께 필요하다. 제자리·역방향을 완료로 취급하지 않는다.
- 두 옵션은 StrokeTraceCanvas에서 영어일 때만 켠다. 한글·점(dot) 판정·취소·진도 조건은 기존대로다. 검수 페이지도 같은 영어 옵션을 사용한다.
- 52자 검수판은 기존636개 기본 검사에, 몸통105획 각각8/12/16px 진폭 × 간격1/3/5 × 변화율.15/.25 × 위상4종 =7,560개를 추가한다. 실패한 확장 입력은 표에 표시하고 전체 JSON으로 내보낸다. 기대값을 바꾸어 실패를 감추지 않는다.

## 검증

- Windows system-ui 실제52자/107획(몸통105·점2), 기본636 + 확장7,560 =8,196개 결과에서 기대 불일치0. 역방향105·반쪽105·큰 곡선 지름길30·점45px 외부2 모두 거절. 작은/직선 지름길75건은 기존처럼 참고로 분류하며 무조건 거절을 기대하지 않는다.
- 원래 실패하던 d/q12px 입력 통과. 추가로 드러난 G/Z/g/h/t/z도72개 흔들림 변형/획을 통과한다. 저장한 실제 경로 기반 회귀와 d/q 컴포넌트 pointer 재생에서 취소/반쪽은0획, 정상 곡선은 다음 획, 최종 완료는1회 호출을 확인했다. 컴포넌트 pointer 재생은 native 손 입력이 아니다.
- 파닉스57파일506테스트 통과(`vitest run … --maxWorkers=2`). 첫 고병렬 실행은 무관한 커리큘럼 전환 테스트1개가5초 timeout(505통과)였고, 기대값/제한시간 수정 없이 작업자2개로 전체 재실행해 전부 통과했다.
- client 타입·변경 TS lint 통과, production build28.34초 성공. 기존 큰 청크/Browserslist 등 경고는 유지. 경로/판정은 시뮬레이션·컴포넌트 회귀 범위이며52자 아이 손가락/실기기 native 완주나 운영 배포로 확대하지 않는다.

증거: output/alphabet-writing-check-20261015/dq-fix/before.json, soft-end.json, after.json, q-fixed.png. 실제 폰트 실패 경로는 components/__fixtures__/english-{curve-ends,turn-paths}.json. 로컬 검수 페이지는 localhost5187/alphabet-writing-check.html. 새 사용자 push 요청 전 운영에는 반영되지 않는다.

## main 전달 — 2026-10-15

사용자의 ‘좋아. 메인에 푸시하자’ 요청으로 fetch했다. 원격069a80aa3에 배경음악 관련12커밋이 추가돼12 behind/2 ahead였으며 공통 조상cbef06ba7을 확인했다. 원격 이력을 정상 merge하고 공유 MEMORY 한 곳의 양쪽 기록을 모두 보존했다. 파닉스 코드와 음악 코드는 겹치지 않았고, 원격 대비 최종 diff는 이번 검수판/영어 획 판정·관련 기록14개 파일뿐이다. 강제 push/이력 재작성/미추적 산출물 추가는 하지 않았다.

통합 후 client 타입과 전체 pnpm build(최종 client25.39초)를 확인했고 훅 lint/format도 통과했다. 기존 파닉스506회귀/실제 폰트8,196검사는 구현 검증 결과로 유지하며, 배경음악 전체 수동 재검수나 운영 배포 완료로 확대하지 않는다. merge ba1b70dbd4bd93e91b5970e31656c412b5539a4e를0 behind/3 ahead에서 일반 push한 뒤 ls-remote SHA 일치·0/0을 확인했다. 아래와 이전 task의 미푸시 표현은 당시 상태이며 검수 HTML 자체는 DEV 전용이어서 운영 앱에 노출되지 않는다.

## 운영 배포·d/q 후속 확인 — 2026-10-15

사용자의 운영 확인 요청으로 Railway 배포 c52d3877-3d26-478a-b82a-abc73d9b79e1 Details에서 **a033b07e6be806986e543cdc360fbb6e918b3626의 Deployment successful/Active**를 직접 확인했다. 다른 후속 작업의 Building과 구분했다. 실제 운영 d 자유모드(`/library/phonics/english/en-b1-u02/letters-write`)의 엔트리는 `/assets/index-BqWiUxHc.js`. 쓰기 판·획순 시연이 표시되고, 첫 곡선의 시작→끝을 직선으로 가로지른 native 입력은0/2 유지·시작점 재안내로 거절한다. 해당 탭 console error0, health ok(2026-10-15T14:25:49.879Z).

이번에는 로컬 소스만 재검사하지 않고 실제 운영 엔트리의 공개 import를 따라 `/assets/WordListenChooseActivity-CEBTN4WO.js`를 읽었다(SHA256 `63f889c49e3c4324a9baa46f85dfd51c64ad4253b6d57cfb0c51f28dcb36cd08`). 컴파일된 컴포넌트가 영어 정규식 결과를 softTurns/softEnd 양쪽에 전달함을 확인했다. AST로 실제 배포된 makePath/begin/move/passed와 의존 거리·guidePoints 함수만 추출하고, DOM/학습 상태/네트워크 쓰기가 없는 별도 Node VM에서 모의 입력했다. 전체 앱 번들을 실행하거나 브라우저에 이벤트/진도를 주입하지 않았다.

- d 첫 곡선: 운영 DOM SVG가 저장된 실제 폰트 fixture와 일치함을 먼저 확인했다.
- q 첫 곡선: 같은 Windows system-ui로 저장한 fixture를 사용했다. 운영 q 화면을 직접 완료한 증거가 아니다.
- 각각8/12/16px × 간격1/3/5 × 변화율.15/.25 × 위상4 =72개 올바른 흔들림은 통과, 역방향/반쪽/지름길3개는 거절. **총150개 기대 불일치0**.
- 원래 d/q12px 입력은 기본 끝맺음에서 남은16.386/18.941px로 미통과지만, 실제 배포된 영어 옵션에서는 동일 입력이 통과한다. 허용 폭 밖으로 나간 거리는0이다.

native drag 도구는 직선 두 점만 지원한다. 운영에서 d/q 곡선을 손으로 끝까지 쓰고 두 번째 획까지 완료한 검증은 하지 못했으며, 위 운영 UI 관찰·배포 코드 모의 검증과 구분한다. 검수 페이지는 여전히 DEV 전용. 기록만 로컬 커밋하며 새 push/배포는 하지 않는다.

증거와 재현: `output/production-dq-20261015/{production-guides.json,d-production.png,strokes.js,extracted-pure-functions.js,deployed-results.json,verify-deployed.mjs}`. 실제 내려온 공개 자산과 순수 검증 스크립트를 로컬에 보존했다. 재실행은 `node output/production-dq-20261015/verify-deployed.mjs`.
