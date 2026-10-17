# 한글 블록 준비 병목 후속

- id: 20261017-phonics-block-preload-bottleneck
- domain: phonics
- status: integrated
- updated: 2026-10-17
- base: b047e3c5f
- branch: codex/phonics-word-journey
- worktree: C:/Users/kil21/.codex/worktrees/phonics-word-journey/tangobook
- delivery: 로컬 작업, 새 push 요청 없음

## 요청·계약

운영 병렬화 이후 캐시 유지 각5회 중앙값1.61→1.54초로 큰 개선은 확인되지 않았다. 이번에는 데이터·URL resolve·실제 미디어 준비를 분리해 병목을 찾는다. 기존 캐시 정책·6초 상한·250ms 게이트 표시·모든 core 준비 확인·background 장면 계약은 유지한다. 태블릿 홈 배치는 [별도 작업](../../platform/tasks/20261017-home-tablet-fit.md).

## 진행

- 관련 handoff/phonics/platform 기억, 이전 운영/로컬 측정, 게임·학습자·free-play 지침을 읽었다. 기존 clean phonics worktree를 로컬 main b047e3c5f까지 ff했다.
- CUA와 computer-use node runtime 모두 kernel assets 경로 오류로 연결 실패. 사용자 브라우저/캐시를 우회 제어하지 않고 별도 headless 개발 검수 세션을 사용한다. 실기기/사용자 브라우저 검수와 구분한다.
- Vite5193은 DISABLE_PUBLISH_SCHEDULER=1·API_TARGET 운영으로 실행, 서버 부팅/스케줄러/운영 설정 변경 없음. 운영 API 호출은 정상 게임 진입 수준으로 제한한다.

## 병목·수정

- 별도 Chromium의 Audio 생성/loadeddata·API 완료 계측: core 음절 시작 약1.60초, 마지막 정답 음원 준비 약2.94초. 단원 API355ms, 낱말 concat URL 확인4개271~646ms가 남는다. 고정 게이트 대기는 아니다. 한글 합성 우선/기존 음원 정책은 유지했다.
- 선택 장면 음원이 core와 동시에 준비되고 같은 페이지 음원도 반복됐다. dev StrictMode까지 겹쳐 음절7종 Audio14개·장면 Audio8개 생성. **객체 생성 개수는 바이트 재다운로드 개수가 아니며, 운영에도14개라고 주장하지 않는다.** 핵심/선택 자산이 미디어 로드·디코드 자원을 함께 쓰는 순서는 운영에도 공통이다.
- warmAudioUrl은 **진행 중** 동일URL Promise만 공유한다. loadeddata/canplaythrough/error/기존4초 cap 뒤 Map에서 제거하고 재진입에서 실제 준비를 재확인한다. 영구 ready flag나 HTTP/SW 캐시 정책을 추가/변경하지 않는다. 완료 시 이벤트/타이머도 정리한다.
- 선택 장면 그림/나레이션은 기존 core 게이트가 열린 직후 중복 제거 후 준비한다. 게이트 대기에는 여전히 포함하지 않으며 외부 연결 동화책 preloadWordScenes/API는 유지한다. ready를 실제 coreKey에 귀속해 이전 판 ready가 새 판/장면을 먼저 열지 않게 했다. 모든 core/6초 상한·250ms 표시·바로 시작은 유지한다.

## 비교·검증

- 동일 단원/model·새 QA 컨텍스트·각 최초 dev모듈 진입 제외 reload3회: 전3759/3262/3088ms, 후2659/3039/2425ms, 중앙값 **3262→2659ms(약18%)**. core 시작→마지막 정답 loadeddata 중앙값 **1340→886ms**. 후 음절 Audio7개, 선택 장면 첫 시작은 core 완료 뒤였다. 적은 표본/dev StrictMode/Vite·프록시·네트워크 편차 포함으로 운영·실기기 보장이 아니며 앞선 운영1.54초와 섞지 않는다.
- 한글 실제 게이트 진행률/트레이0개→준비→듣기→ㅎ 선택/판 배치→되돌리기 정상. 영어 실제 듣기 후 a 입력→되돌리기 정상. pageerror0, 전체 정답/장면 완주·스피커 청취·실기기 검수는 아니다.
- 인접8파일 **53검사**, client typecheck·변경 ESLint·최종 build46.71초 통과. 기존 Browserslist/i18n mixed imports/lottie eval/큰 chunk 경고. 새 검사는 in-flight 공유/완료 후 재확인/실패/4초 cap·선택 장면 후순위/게이트 제외·새 타깃 ready 차단을 확인하고 기존6초/핵심 대기와 한영 입력·홈 흐름 회귀를 유지한다.
- 최초 홈 회귀1건은 기존 헤더 ‘골라 놀기’ 추가 전의 총 링크4개 기대값이 낡은 실패였다. 직접 게임4링크와 별도 선반 링크를 각각 검사하도록 맞췄고 기능/학습 기대값을 낮추지 않았다.
- CUA·computer-use runtime은 kernel assets 경로 오류로 연결 불가, 기존 사용자 브라우저를 우회 제어하지 않고 저장된 headless viewport 스크린샷을 육안 검수했다. 기존 사용자 캐시/진도 삭제 없음. worktree output/preload-home-20261017의 before/after-timing·interaction·english-input·스크린샷은 미추적/커밋 제외. 새 push/운영 배포 없음.
- 최종 production build를 localhost5194에서 별도로 열어 단원 진입→듣기→ㅎ 실제 배치(1개)까지 재확인, pageerror0. 새 coreKey/게이트가 실제 컴파일된 번들에서도 동작한다. 운영 배포나 사용자 실기기 검사로 해석하지 않는다.

## 로컬 통합

5e5c3d96a 코드·회귀·기록을 로컬 main fast-forward 통합했다. 커밋 훅 ESLint/Prettier 통과·추적 clean·diff check 확인. 기존 output/tmp·다른 worktree 보존, 주요 증거 사본을 root output/preload-home-20261017에도 보관했다. 새 push/운영 배포 없음.

## 메인 푸시 요청

2026-10-17 사용자 “좋아. 메인에 푸시하자”로 이번 블록 준비/태블릿 홈 main push 승인. fetch 후 origin/main...HEAD=0/3·추적 clean·diff check 통과. 5e5c3d96a 구현, fe091d4bb 통합 기록과 앞선 b047e3c5f 운영 검수 문서가 전달 범위다. 기존53검사/타입/lint/build·built preview 이후 제품 변경 없음. 관련 승인 기록만 추가하고 일반 push 뒤 원격 SHA를 대조한다. 운영 배포 성공은 별도 확인 대상이다.
