# 영어 게임 첫 진입 코드 대기 후속

- id: 20261018-english-entry-waterfall
- domain: games
- status: integrated
- base: c4a0d277f
- branch: codex/phonics-word-journey
- worktree: C:/Users/kil21/.codex/worktrees/phonics-word-journey/tangobook
- delivery: 751882150 main push·2026-10-18 운영 배포/첫 진입/캐시/게이트 확인, 후속 검수 문서는 로컬

## 요청·근거

영어 블록/그림짝 첫 진입을 더 줄일 병목을 찾아 수정한다. 기존 캐시·실제 미디어 게이트/상한/진행률·학습/판정 흐름을 유지한다. 이전 운영 첫 접속 중앙3.73/3.17초, 단원 query 조기 조회는 적용된 상태다.

운영 trace에서 workspace chunk 뒤 영어 activity chunk 요청이 직렬로 시작됐다(블록789→1015ms, 그림짝1099→1489ms). 영어 호스트의 정적 import가 같은 입장에서 쓰지 않는 ConnectedWordLearning/한국어 블록/색칠·쓰기·글자 활동까지 끌어온다. 효과 엔진 사전 로드는 지난 실험에서 느려져 제외한 상태이므로 되살리지 않는다. 우선 이미 필요한 영어 호스트 코드를 workspace와 함께 요청하고, 다른 활동 코드는 실제 선택 때만 받는 실험을 한다. 코드/미디어 캐시를 ready로 가정하거나 대기 상한을 줄이지 않는다.

## 시작

main/기존 worktree 추적 clean·fetch origin/main...main0/1(운영 검수 문서만 로컬) 확인. 같은 작업 worktree를 c4a0d277f로 fast-forward했다. 다른 output/tmp/worktree 보존. 이전 baseline build와 현재 source를 구분해 새 built preview 교차 측정한다. 기존 사용자 캐시/학습 기록/운영 데이터는 수정하지 않는다.

## 첫 실험 제외

ConnectedWordLearning만 lazy로 나누고 route loader에서 영어 호스트 import까지 먼저 시작한 후보는 블록 baseline3227/2414/2445→2669/2745/2850ms, 그림짝2168/2043/2007→2464/2321/2420ms였다. 요청 JS gzip 합계549518→523695B(블록 두 번째 표본, effect engine 제외)로 줄었지만 중앙은 두 게임 모두 느려졌다. 조기 코드 요청이 기존 workspace/단원·필수 준비와 경합할 수 있어 **host 코드 선행 helper/router/loader/관련 실험 검사는 전부 제거**했다. 원래 query loader/엔진/게이트 유지. `code-split.json` 보존. 이 실험으로 성능 개선을 주장하지 않는다.

trace의 실제 핵심 그림/음원은 assets.tangobook.co.kr인데 HTML preconnect는 예전 pub R2만 있었다. 다음 후보는 불필요한 ConnectedWordLearning import 분리만 유지하고 실제 assets 연결을 미리 준비한다. 새 콘텐츠 다운로드나 준비 생략이 아니라 DNS/TLS 준비 시점만 바꾼다.

## 최종 구현·검증

- 실제 source 변경은 **EnglishPhonicsActivityPage의 ConnectedWordLearningActivity 선택 시 lazy import/Suspense fallback**과 **HTML의 assets.tangobook.co.kr preconnect/dns-prefetch**뿐이다. router/기존 query loader/PhonicsGameGate/usePhonicsMap/useGameAssetPreload/엔진/HTTP·SW 캐시/학습 판정 변경 없음. 낱말 활동을 선택하면 실제 통합 활동과 기존 준비 게이트를 그대로 실행한다. hint는 브라우저 재량이라 연결 비용이 항상 사라진다고 가정하지 않는다([MDN preconnect](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/preconnect)).
- 이전 main c4a0d277f를 root 별도 baseline-dist(38.76초)/preview5195, 후보는 기존 worktree dist/preview5194로 빌드했다. 같은 운영 API·고정 난수·격리 설치 Chrome1280×720·매번 새 context·캐시 enabled로 이전/후보를 번갈아3회, 두 번째 쌍은 후보 먼저 실행했다. 계측 중 빌드/타입/다른 QA 동시 실행 없음. 코드 선행 실험43.07초 빌드와 최종45.09초 빌드를 혼동하지 않는다.

| 첫 진입 | 이전3회(ms) | 후보3회(ms) | 중앙값 |
| --- | --- | --- | --- |
| 영어 Book3 블록 | 2290 / 2060 / 2264 | 1717 / 2167 / 1653 | 2264→1717ms |
| 영어 Book2 그림짝 | 1635 / 1725 / 1656 | 1670 / 1673 / 1627 | 1656→1670ms |

- **블록에서는 줄었지만 그림짝 전체 시간 개선은 확인하지 못했다.** 단일 PC/회선·로컬 built preview·3회 표본의 순서 편향/원격 미디어 변동이 남아 운영 개선율이나 각 변경의 기여도를 보장하지 않는다. 이전 코드 선행 실험의 더 느린 수치도 모두 보존한다.
- 같은 입장에 요청한 JS+CSS(ready 이전 요청 시작·효과 엔진 제외)를 실제 파일별 gzip 산술 합산하면 **647610→618582B, 65→61개**였다(양쪽 게임 각3회 동일). 이는 wire byte의 실측이 아니라 비교용 파일 gzip 합이다. 새 두 게임에서는 ColoringPlayer/KoreanBlockPlayer/ConnectedWordLearningActivity 코드를 요청하지 않고, 낱말 block을 실제 선택하면 ConnectedWordLearningActivity JS/CSS를 받는다. 전체 entry만 보며 용량이 줄었다고 오판하지 않는다.
- 그림짝은 core 이미지4개가 약1.2~1.5초에야 준비되는 비용이 남는다. 정답/그림 게이트를 생략하거나 무작위 후보 전체를 중복 사전 다운로드하지 않는다. 새 이미지 변환/R2 수정·서버 API 축소·추가 전역 청크 재편은 이번 변경에 넣지 않았다.
- 기존 회귀 **5파일45검사**(영어 page·연결 낱말 흐름·기존 query loader·core gate·미디어 준비) 통과. client typecheck/변경 TSX ESLint·최종 build45.09초 통과. Browserslist/lottie eval/i18n 혼합 import/large chunk 기존 경고 유지. 새 reversible hint 전용 구현 복제 테스트는 추가하지 않았다.
- built1024×768 실제 두 게임 진입: core progress0% 동안 tray0/cards0 → 준비 후 실제 화면. background mp3는 core 전에0, ready후2초에 기존100개 예열. 재진입 정답 음원 각4개(총8응답) 모두 disk cache. 블록 소리 버튼→a배치/되돌리기·그림짝 선택 정상, pageerror0. 저장한 gate/입력 화면을 직접 육안 확인했다. 낱말 block의 실제 lazy 진입/화면·영어 Dd 쓰기 canvas도 확인했다. 전체 판 완주/실기기 터치·스피커 청취 검수는 아니다.
- 그림짝 입력 직후 캡처는 색 transition 중이라 연하게 보였다.400ms 뒤 이전/후보 border rgb(255,94,58)·동일 shadow를 비교해 선택 표시 스타일 회귀가 아님을 확인했다. 별도 QA의 쓰기 진입에서 범용 progressbar selector가 D/d 획 진행2개와 충돌한 것은 검사 스크립트 오류다. 게임 gate만 기다리도록 고친 후 실제 쓰기 화면 정상, 제품 코드를 수정한 오류로 집계하지 않는다.
- 증거 output/english-entry-waterfall-20261018/: code-split.json(제외 실험), connection.json/connection-summary.json(최종 교차/파일합), verification.json(게이트/캐시/입력), other-activities.json(실제 낱말 lazy/쓰기 진입), selected-style.json·입력/선택/쓰기 PNG. 기존 CUA kernel assets 오류 때문에 사용자 프로필 대신 격리 개발 QA Chrome를 사용했다. 사용자 탭/진도/캐시/운영 R2·DB를 건드리지 않았다.
- 최종 구현은 로컬 커밋/main 통합 대상으로 준비하며 새 push/배포는 이번 요청에 없다. 보조 preview5195는 검수 후 종료하고 기존 서버5194/5186·출력/다른 worktree를 보존한다.

## 로컬 통합

구현/검수 기록fa3084114를 root main에 fast-forward했다. ESLint/Prettier 커밋 훅 통과 뒤 TSX SHA256이 검증 당시와 동일(67eddf648cabd26f07bdbf1ef4994568cf887a6bc70d6990687fe4577fe1f13c)하고 추적 clean 확인. 현재 요청의 원격 push/운영 배포는 하지 않았다. 통합 기억만 후속 문서 커밋한다.

## 메인 푸시 요청

2026-10-18 사용자 “좋아. 메인에 푸시하자” 승인. fetch 후 origin/main...HEAD0/3·main 추적 clean이며 c4a0d277f 이전 운영 검수 기록, fa3084114 최적화/검수, b5dd89e0a 통합 기록을 일반 push한다. 기존45검사/타입/lint/build·실제 화면/입력·캐시/게이트 검수 뒤 source 추가 변경이 없어 반복 검사하지 않는다. 승인 기록을 커밋하고 원격 SHA/동기화를 확인한다. 운영 배포 완료와 운영 속도는 별도 확인한다.

## 운영 검수 진행

2026-10-18 사용자 요청으로751882150의 배포/영어 블록·그림짝 첫 진입/캐시/게이트를 확인한다. 원격 main SHA일치0/0·추적 clean.00:30 KST 현재 프런트 Railway4d8b2869는 pending, 서버는 watched paths 미변경 skip success, 운영은 이전 index-Mch36lEq.js·assets hint없음이다. 새 context 첫 접속3회+각 context 재진입1회를 이전과 같은 단원/고정 난수/캐시 enabled/1280×720 격리 Chrome에서 측정한다. 실제 entry로 전환 표본을 분리하고 운영 사용자 프로필/진도·R2/DB는 수정하지 않는다. 증거 output/production-entry-waterfall-20261018/.

## 운영 최종 결과

- Railway 프런트 **4d8b2869-564b-46ec-907e-31ff393f440c**, 대상 **751882150**, **2026-10-18 00:36:47 KST**(2026-10-17T15:36:47Z) success. 운영 entry **index-Mch36lEq.js → index-CxaDHpB9.js**, HTML assets.tangobook.co.kr preconnect 반영·health ok. 서버는 watched paths 미변경 skip success.
- 설치 Chrome1280×720·같은 운영 두 단원·고정 난수·캐시 enabled. 새 context3회 첫 접속+각 context 재진입1회를 전후 각각 측정했다. 아래 표의 전후 표본은 실제 entry로 전부 구분되며 전환 중 표본 없음. 단원 GET은 각 입장1회 유지.

| 운영 준비 시간 | 이전3회(ms) | 새3회(ms) | 중앙값 |
| --- | --- | --- | --- |
| 영어 Book3 블록 첫 접속 | 3251 / 2826 / 3597 | 3338 / 2808 / 2774 | 3251→2808ms |
| 영어 Book2 그림짝 첫 접속 | 2792 / 3304 / 3100 | 2791 / 2901 / 2642 | 3100→2791ms |
| 영어 블록 캐시 있는 재진입 | 1735 / 1434 / 1323 | 1463 / 1400 / 1152 | 1434→1400ms |
| 그림짝 캐시 있는 재진입 | 1455 / 1004 / 985 | 731 / 834 / 1130 | 1004→834ms |

- 이번 운영 표본에서 최초 중앙값은 두 게임 모두 줄었다. 단일 PC/회선·배포 전후 순차3회·범위 겹침이 있어 기기별 보장 수치/변경별 기여도를 단정하지 않는다. 이전 로컬 그림짝 차이없음 결과를 운영 개선으로 소급해서 바꾸지 않는다.
- 최초 기준 측정 일부가 보조 cache-probes/health 확인과 겹쳤다. `before-initial-focused.json`(최초 중앙 블록4225/그림짝3152ms) 보존 후 보조 검사 종료 뒤 전부 새 context로 **단독 재측정**한 `before-focused.json`을 위 표에 썼다. 이후 성능 비교 중 다른 검수/빌드 동시 실행은 없으며 cache/입력 검사는 성능 계측 완료 후 실행했다.
- 이전 두 게임 입장의 한국어 블록/색칠 JS 요청은 표본마다2개, 새 두 게임은 **0개**다(`assets-summary.json`). 페이지가 선택하지 않은 연결 낱말 활동을 먼저 가져오지 않도록 분리한 동작이 운영에서도 반영됐다. 새 HTML의 CDN hint도 확인했지만 힌트만의 기여도를 따로 주장하지 않는다.

### 캐시·게이트·실제 입력

- 새 버전1024×768에서 두 게임 모두 progress0% 동안 알파벳 tray0/그림 카드0 → 실제 준비 후 화면 표시. 스킵으로 대기를 우회하지 않았다. core 전 background phonics mp3 **0개**, ready후2초 관찰에서 기존 top100 **100개** 예열 유지.
- 성능 재진입의 정답 음원은 두 게임 합계 **24응답 전부 CDP disk cache**. 별도 실제 입력/재진입에서도 각4개 모두 캐시 재사용. 새 Audio 실제 준비를 확인하는 경로를 없애지 않았다.
- 별도 검수의 재진입700ms 수집에서는 그림짝 loadeddata가3개만 잡혀 원본을 verification-initial.json으로 보존했다. 준비 게이트/제품 코드를 바꾸지 않고 검수 관찰만2.5초로 늘린 verify-settled.cjs에서 두 게임 각각 loadeddata4회·disk cache4응답·pageerror0을 확인했다. 선택 강조도400ms transition 뒤 캡처해 확인했다. 이 후속 관찰은 위 성능 표본과 별개다.
- WebP2종 `public,max-age=604800`, 새 hashed JS `public,max-age=31536000,immutable`, 각각 ETag 조건부 **304/0B**. SW production/local SHA256 **8a57abbf06177dd4ad78335778e3bbcd38849dae07f206d3f5a533196bc5b389** 동일.
- 소리 버튼→a배치→되돌리기, 그림짝 선택 강조 정상. core 준비/입력 화면을 육안 확인했고 모든 성능/입력 pageerror0. 격리 QA Chrome이며 사용자 탭/진도/캐시를 건드리지 않았다. 전체 판 완주·실물 블록/실기기 터치·스피커 청취 검증은 아니다.
- 증거 output/production-entry-waterfall-20261018/: deployment.json, before/after-focused.json, before-initial-focused.json, summary.json, assets-summary.json, cache-before/cache-probes.json, verification.json 및 gate/input PNG. 제품 코드나 운영 R2/DB 변경 없이 검수 기록만 로컬 커밋하고 새 push하지 않는다.
