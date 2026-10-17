# 영어 블록 준비된 오디오 재사용

- id: 20261018-english-prepared-audio
- domain: games
- status: integrated
- base: 1b4ec515e
- branch: codex/phonics-word-journey
- worktree: C:/Users/kil21/.codex/worktrees/phonics-word-journey/tangobook
- delivery: b102ed23f 로컬 main 통합·검증 완료, 2026-10-18 사용자 main push 승인

## 요청·기준

영어 블록에서 이미 준비된 실제 오디오 객체를 재사용해 같은 탭 재진입을 줄인다. HTTP/SW 캐시·로딩 게이트·실제 준비 확인·4초 media/6초 core 상한·진도/음원 재생 체인을 유지한다. 기존 운영 동일문제 SPA복귀3회 중앙626ms, 새 Audio4개 준비303~395ms였다. page.goto 전체 문서 재시작 수치와 구분한다.

원격 fetch 후 main0/2(이전 운영/재진입 검수 문서만 로컬)·추적 clean 확인. 같은 작업 worktree를1b4ec515e로 fast-forward했다. 타 worktree/output/tmp 보존. 재사용은 영어 블록 core에 opt-in하며 기존 default warm 경로·장면·다른 게임은 바꾸지 않는다. 실제 muted/preload Audio를 제한 개수/유효 시간 안에 보유하고 매 호출 src/currentSrc/error/paused/seeking/readyState/buffered를 검사한다. 오류/시간초과/소스 변경/실제 준비 소실/만료는 버리고 다시 실제 준비한다. iOS의 해금된 공유 재생 요소는 바꾸지 않으며 준비 객체를 재생 채널로 사용하지 않는다.

## 구현·안전 계약

- `prepared-audio-cache.ts`는 최대24개의 실제 준비 요소를 준비 시점부터5분 보유한다. 접근은 LRU 순서를 갱신하지만 유효 시간을 연장하지 않는다. 만료 타이머/퇴출 시 pause→src 제거→load로 자원을 반환한다.
- 재사용은 error 없음·paused·seeking 아님·currentTime<=.05·src/currentSrc 일치·readyState>=2·buffered 시작<=.05/끝>0을 매번 확인한다. 이미 받았다는 persisted flag를 성공으로 삼지 않는다. 이벤트 성공 뒤에도 실제 조건이 맞아야 보유하며 error/4초 timeout은 보유하지 않는다. [readyState](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/readyState), [buffered](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/buffered).
- 같은 URL의 진행 중 준비는 기존처럼 Promise를 공유하고, 영어 core가 합류하면 완료 요소 보유만 opt-in한다. 다른 호출/게임/배경 장면은 기존 기본 경로다. coreKey/6초/250ms/스킵·HTTP/SW 캐시·top100 후순위/공유 재생/학습 판정은 유지한다.

## 검증

- 회귀5파일46검사: 실제 준비 대기/준비 소실9조건/오류·상한/5분 만료/LRU24/동시 호출·default 격리와 기존 core/음원 체인/영어 player 검사를 통과했다. client typecheck·변경5파일 ESLint·최종 build45.97초 통과. 기존 Browserslist/lottie eval/i18n 혼합 import/large chunk 경고 유지.
- baseline1b4ec515e는 별도 baseline-dist37.34초/preview5195, 후보는 worktree dist/기존 preview5194. 같은 원격 읽기 API·고정 난수·설치 격리 Chrome1024×768·캐시 enabled로 baseline→후보→후보→baseline 네 context를 실행하고 각 최초 준비 뒤 실제 **놀이 선택→브라우저 뒤로**3회씩 측정했다. 성능 계측 중 빌드/다른 QA는 실행하지 않았다.

| 같은 탭·같은 문제 SPA 복귀 | 6회(ms) | 중앙값 |
| --- | --- | --- |
| 이전 | 294 / 249 / 253 / 261 / 330 / 280 | 270.5ms |
| 후보 | 120 / 109 / 112 / 123 / 116 / 125 | 118ms |

- 모든12회 document요청0/단원GET0/pageerror0. 이전은 매 복귀 정답 TTS4개 src/loadeddata, 후보는 **새 정답 TTS 준비0개**였다(양쪽 공통 공유 재생 요소의 data 무음 해금 src1개는 정답 준비와 분리). 두 버전 모두 이 로컬 표본에서는250ms 지연 gate가 노출되지 않았다. 이전 운영626ms와 다른 로컬 환경이므로 개선율을 직접 연결하거나 운영/실기기 보장으로 해석하지 않는다. 실제 다른 무작위 URL/만료/리로드는 별도 준비가 필요하다.
- 별도 실제 미디어 검수: 첫 진입 gate0%/tray0→준비 요소4개/실제 화면, core 전top100 요청0·ready 뒤100개 유지. 준비된 무음 요소 중1개를 **격리 QA에서만 의도적으로 src 해제**한 뒤 해당 요청을700ms 지연하자 gate88%/tray0으로 복귀했고 실제 새 준비 뒤 화면으로 돌아왔다. 사용자/운영 캐시나 기록을 수정한 검사가 아니다.
- 소리 듣기→공유 unmuted 요소id1의 실제 bake 음원 play성공/ended를 확인했다. 준비 무음 요소는 play하지 않았다. 첫 QA의 ended 조건이 UI tap도 허용했던 것을 발견해 **tts-cache 음원만** 기다리도록 고친 후 재검수했다. 기존 무음 해금의 pause에 따른 interrupted promise는 포착됐지만 실제 TTS는 끝까지 정상, pageerror0. 실제 스피커 청취·iPad 해금 실기기 검수는 아니다.
- a배치→되돌리기/복구 후 게임 화면 정상,1024×768 저장 gate/입력/복구 화면을 직접 육안 확인했다. 전체 문서 리로드에서는 새 준비 요소4개를 만들고 정답 음원4응답은 모두 disk cache여서 HTTP 캐시는 유지된다. CUA kernel assets 오류 때문에 사용자 프로필 대신 격리 개발 QA Chrome를 사용했다. 운영 데이터/학습 완료 쓰기 없음.
- 증거 `C:/project/tangobook/output/english-prepared-audio-20261018/`: reentry.cjs/json, verification.json/verify.cjs, baseline/candidate-ready.png, block-gate/input/restored.png, lost-buffer-gate.png. 임시 baseline preview5195만 종료하고 기존5186/5193/5194는 보존한다. 새 push/배포 요청 없음.

## 사용자 후속: 전체 데이터를 종류별로 압축·첫 접속 때 전부 준비할지

2026-10-18 최종 사용자 결정: **선로딩 구조 개편은 기능 개발이 거의 마무리된 뒤 전체 작업을 정리하면서 다시 검토한다. 지금은 보류한다.** 현재 구현·검증한 캐시/로딩 게이트/영어 블록 준비 음원 재사용은 보존한다. 아래 챕터 단위 준비는 제안 기록이며 지금 추가 구현하거나 자동으로 후속 작업을 시작하지 않는다.

## 메인 푸시 요청

2026-10-18 사용자 “지금까지 한 거 메인에 푸시하자” 승인. root main 추적 clean·fetch 후 origin/main...HEAD0/5 확인. 기존 운영 검수/SPA 측정 기록0289971f5·1b4ec515e, 영어 블록 실제 준비 요소 재사용b102ed23f, 통합 기록a87005db0, 구조 개편 보류f0fef71c0와 승인 기록을 일반 push한다. 관련46검사/타입/lint/build·실제 화면/입력/음원ended·캐시/게이트 검수 뒤 동작 source 변경이 없어 반복 검사는 생략한다. 미추적 output/tmp와 타 worktree는 보존한다. 전체 선로딩은 계속 보류이며 원격 main SHA/동기화는 push 후 확인, 운영 배포 완료/속도는 별도 확인한다.

논의 요청이며 **전체 선로딩/ZIP 전환은 구현 승인으로 해석하지 않았다**. 현재 검수의 반복 준비 병목과 전체 다운로드 용량 문제는 분리한다. 권장안은 공통 UI/효과음 최소 묶음→선택한 현재 챕터의 실제 그림·음원→다음 활동/다음 챕터 백그라운드 준비→다른 권/동화는 선택 시다. 파일 종류별 전체 묶음보다 사용 단위 manifest/URL 중복 제거·변경 파일만 갱신하는 캐시가 적절하다는 제안이며 확정 플랫폼 방향 변경은 아니다.

WebP/MP3는 이미 압축된 형식이므로 일반 ZIP 재압축 이익은 제한적이고, JSON/코드는 HTTP Brotli/gzip 설정을 검토할 대상이다([MDN compression](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Compression)). 불필요한 자산을 뒤로 미루는 접근은 [lazy loading](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Lazy_loading)과 부합한다. 브라우저 저장소는 [용량/퇴출](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)이 있으므로 첫 다운로드가 영구 저장/즉시 재생을 보장한다고 설명하지 않는다. 전체 원격 라이브러리 바이트 총량은 이번에 전수 조사하지 않았다. 다음 구현 전 현재 챕터 묶음 용량/실제 첫 대기·히트 재준비를 계측해 범위를 정한다.
