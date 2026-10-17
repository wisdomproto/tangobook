# 한글 블록 준비 병목 후속

- id: 20261017-phonics-block-preload-bottleneck
- domain: phonics
- status: integrated
- updated: 2026-10-17
- base: b047e3c5f
- branch: codex/phonics-word-journey
- worktree: C:/Users/kil21/.codex/worktrees/phonics-word-journey/tangobook
- delivery: 59a9537c8 원격 main·운영 프런트 배포 성공, 준비 시간/캐시/게이트 검수 완료

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

## 운영 배포·직접 검수 진행

- 59a9537c8 원격 main push/SHA 일치 완료 후 사용자 요청으로 운영을 검수한다. 프런트 GitHub/Railway status는13:56:30Z pending, 서버는13:56:28Z watched paths 미변경 skip success, health는13:58:32Z ok였다.
- CUA 연결은 이번에도 kernel assets 경로 오류. 기존 사용자 브라우저/캐시를 우회 제어하지 않고 독립 headless Chromium·1280×720·Asia/Seoul·같은 QA 세션의 캐시 유지 전후 비교를 수행한다. 운영 구번들 index-DxChuRhN의 비계측 워밍 뒤5회1831/2350/2285/2340/2321ms, 중앙값2321ms. 앞선 IAB1.54초/로컬dev3.26초와 측정 환경이 달라 섞지 않는다.
- 배포 성공 뒤 새 번들 확인/동일5회·실제 게이트/ㅎ배치·브라우저 네트워크 캐시 관측·운영 태블릿 홈을 확인할 예정이다. 자료는 root output/production-preload-tablet-20261017에 미추적 저장한다. cache 비활성화/기록 삭제/운영 설정 변경 없음.

### 최종 운영 결과

- 59a9537c8의 GitHub/Railway 프런트 status가 **2026-10-17T14:03:35Z success**(`Success - tangobook.co.kr`, 배포061bbc51)로 전환했다. 서버는 watched paths 미변경 skip success. health14:04:31Z ok, 실제 운영 entry **index-DxChuRhN → index-CWZAoTSe**를 확인했다. Railway 로그인 대시보드의 Active를 직접 읽은 검수는 아니며 통합 status/새 자산/실제 기능으로 배포를 확인했다.
- 성공 뒤 같은 QA 브라우저·1280×720·캐시 유지·같은 단원4문항/model에서 새 번들 비계측1회 뒤 reload5회: **1980/1809/1779/1759/1772ms**, 중앙값 **2321→1779ms(약23% 감소)**. 전후 범위가 일부 겹치고 표본5회·현재 네트워크/별도 headless Chrome 관측이므로 보편적23%/실기기 보장은 아니다. 앞선 IAB1.54초/로컬dev2.66초와 섞지 않는다. 각5회 모두 자기 phase의 동일 entry였다.
- 미디어 이벤트에서도 새 버전의 선택 장면 첫 로드는 항상 마지막 core 정답 loadeddata 뒤였다. 준비 중73% 게이트/바로 시작 버튼·트레이 미노출을 캡처했고, 준비 후 듣기→ㅎ 선택/판 배치1개→되돌리기 정상. pageerror0. 첫 자동검수는1280폭에서1024폭용 상대 좌표를 써 판의 레터박스 여백을 눌렀고 되돌리기가 비활성이라 timeout했다. 제품 실패로 숨기지 않고 유효 판 중앙/실제 배치 표시를 기다리도록 고쳐 재검수 통과했다. 이 실패는 앞서 저장된 같은 세션 전후 시간 표본에 영향을 주지 않는다.
- 기능/캐시/홈 후속은 새 별도 QA 컨텍스트에서 수행했다. 이미지·효과음/일부 CDN 자산의 재진입 CDP 응답102개 중95개에 disk 또는 SW 캐시 flag가 있었다(두 flag는 중첩 가능하며 전역 캐시 적중률로 일반화하지 않는다). 이미지44개 중39개 캐시 재사용. 별도로 **R2 음절14개·정답8개, 총22개 media 재진입 응답 모두 fromDiskCache=true**를 확인했다. 사용자 프로필/캐시를 초기화하거나 cache-disabled/네트워크 지연을 적용하지 않았다. Range 요청은 기존대로 SW가 아닌 HTTP 미디어 캐시를 사용한다.
- HTTP 별도 재검증: 블록ㅎ/되돌리기 WebP7일·새 해시JS1년immutable, 모두 조건부304/본문0B. 운영sw.js는 로컬과 동일 SHA256(8a57abbf…5b389). 게이트 core 준비/6초 cap/250ms 표시/스킵 계약은 배포 코드/기존53회귀에 근거하며 운영에서 인위적 timeout/실패를 주입하지 않았다. 실제 스피커 청취·iOS 실기기·전체 정답 완주는 이번 범위가 아니다.
- root output/production-preload-tablet-20261017의 before/after.json·deployment.json·gate.png·block-input.png·post-summary/cache-observations/phonics-cache/cache-probes·태블릿 화면을 보존한다. 운영 콘텐츠/설정/코드 수정 없이 검수 기록만 로컬 커밋하며 테스트/build를 반복하거나 새 push/재배포하지 않는다.
