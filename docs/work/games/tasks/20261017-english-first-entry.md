# 영어 블록·그림짝 첫 진입 후속 병목

- id: 20261017-english-first-entry
- domain: games
- status: integrated
- base: a01e45464
- branch: codex/phonics-word-journey
- worktree: C:/Users/kil21/.codex/worktrees/phonics-word-journey/tangobook
- delivery: aef75d0c1 main push·2026-10-18 운영 배포/첫 진입/캐시/게이트 검수 완료, 후속 검수 기록은 로컬
- integration: 93d13a669 로컬 main fast-forward 통합

## 요청·기준

영어 블록·그림짝 첫 진입을 더 줄일 수 있는 병목을 찾고 손본다. 기존 HTTP/SW 캐시, 실제 미디어 준비 대기, core6초/media4초 상한,250ms 지연 표시, skip·학습/판정 흐름을 보존한다.

직전 운영 검수에서 최초 중앙값3.32/3.16초·재진입1.30/0.76초였다. 낱말 준비가 긴 경우 phonics map의1.5초 지연 top100 다운로드와 겹쳤지만 원인을 확정하지 않았었다. 현재 필수 core 준비 중에는 불필요한 top100이 시작되지 않게 하는 방안을 먼저 검증한다. 효과 엔진의 늦은 JS/폰트 준비도 관찰하되 근거 없이 앞당겨 미디어와 다시 경쟁시키지 않는다.

## 시작

- root main/기존 worktree 추적 clean 확인, fetch origin, 같은 작업 worktree를 a01e45464로 fast-forward했다. 다른 untracked output/tmp·worktree 보존.
- 설치된 격리 Chrome와 production build preview5194로 동일 URL/같은 실제 낱말을 새 context에서 반복 측정한다. 기존 사용자 캐시/학습 기록을 지우지 않는다. 실기기/스피커 검수와 구분한다.

## 구현·검증 진행

- `usePhonicsMap`은 목록 조회와 top100 프리페치를 분리할 수 있는 선택적 세 번째 인자를 받는다. 기존 caller 기본값true/1.5초/세션1회·force-cache/no-cors는 유지. 영어 core 준비 중에는 false로 map만 즉시 준비하고 ready 뒤 true로 바꿔 background 경쟁을 미룬다. 필수 음원 대기 자체는 생략하지 않는다.
- 실제 trace에서 effect engine chunk(Phaser 포함)가 core 뒤에 요청되는 것도 확인했다. 영어 두 게임은 core와 함께 모듈 코드만 준비하고 host의 기존 prepare/입력에서만 renderer를 만든다. 공유 Promise는 모듈 코드에 한정하며 미디어 ready flag와 다르다. 실패한 import는 후속 실제 진입에서 재시도, reduced motion은 speculative import도 생략한다.
- 최초 회귀5파일28검사 통과: background를2500ms동안 막아도 필요한 map/캐시/ready 정상, core 뒤1500ms/1회·기존 실패 재시도, core 대기/상한/오류, effect 코드 준비 중 renderer 생성 없음·실제 진입 후1개 생성/이탈 파괴/reduced-motion. 타입/lint/build와 built preview 전후 측정은 진행 중이다.

### 효과 코드 선행 실험 제외

동일 새 context3회 baseline 블록3228/3053/2618ms·그림짝2307/3180/3104ms. 효과 코드까지 앞당긴 실험은 블록3716/3616/2721ms·그림짝2873/2766/2661ms였다. 코드 요청 자체는2.5~3.0초→1.2~1.5초로 앞당겨졌지만 블록 중앙이 오히려3053→3616ms로 늘었다. CPU/미디어와 경합 가능성이 있어 **loader/host/코드 사전 로드 변경과 관련 시험은 전부 제외**했다. `experiment-effects-focused.json`에 결과를 보존한다. 최종은 top100 준비 시점만 조절하며 효과 엔진/애니메이션은 원본 그대로다.

효과 실험 제외 후 실제 caller/소리 회귀까지7파일39검사 통과. 최종 타입/lint/build와 단독 재계측을 진행 중이다.

### 단원 데이터 직렬 대기

top100 조절만 남긴 전후 순차 표본에서는 블록3053→2208ms·그림짝3104→2090ms 중앙이 나왔지만 단원 API 시작 자체가 앞당겨진 환경 차이가 있었다. 원인을 과장하지 않으려고 root의 변경 전 a01e45464를 별도 outDir/preview5195로 빌드하고 새 context로5195/5194를 번갈아3회 비교했다. 그 결과 블록 baseline3381/2657/3043·candidate3105/3190/2982ms, 그림짝2742/2594/2767·2586/2858/2851ms로 범위가 겹쳤다. **top100 제어만으로 일반 회선 첫 진입이 빨라졌다고 주장하지 않는다**. 최초 전후/교차 결과를 모두 보존한다.

현재 React 화면 마운트 이후에 시작하던 단원 조회를 라우트 진입에서 먼저 시작하는 조정을 추가했다. 영어 실제 블록/듣고블록/그림짝3키에만 non-blocking loader를 붙여 기존 TanStack Query의 ['storybook',unitId]·기본 신선도/중복 공유를 재사용한다. 접근 게이트/미디어 게이트/진도는 그대로이며 학습 화면을 기다리게 하는 새 loader 데이터는 없다. 없음/다른 활동 no-op, 실패는 기존 query 경로, 단원 캐시 재사용·동시 요청1회·즉시 return8검사 통과. 최종 타입 확인 전에 테스트 fixture의 Storybook 타입을 명시했다.

## 최종 검증

- 최종 source는 **top100 시점 제어 + 영어 게임 단원 데이터 조기 조회**만이다. 효과 엔진/소리·학습 판정·기존 HTTP/SW 정책은 변경하지 않았다.
- 기존 구현 a01e45464를 root의 별도 baseline-dist/preview5195에 빌드했다. candidate는 worktree built preview5194. 두 frontend 모두 같은 운영 API를 읽고 같은 설치 Chrome1280×720·고정 난수·새 context를 써 캐시는 켠 채로 번갈아3회 측정했다. 한 쌍은 candidate를 먼저 실행해 순서 편향도 줄였다. 환경/포트/로컬 빌드 차이가 있으므로 운영 속도 보장은 아니다.

| 첫 진입 | baseline3회(ms) | candidate3회(ms) | 중앙값 |
| --- | --- | --- | --- |
| 영어 Book3 블록 | 3058 / 2374 / 2407 | 2205 / 2214 / 2285 | 2407→2214ms |
| 영어 Book2 그림짝 | 2331 / 2280 / 2312 | 2200 / 1723 / 1746 | 2312→1746ms |

- 같은 단원 GET은 각 입장 **1회**. 단원 요청 시작은 baseline620~721ms에서 candidate150~170ms로 실제 앞당겨졌다. 기존 query가 별도 재요청하지 않고 진행 중 결과를 받는다. 이 비교는 직전 top100-only/효과 실험/운영 결과와 구분한다. 원본 전부 output/english-first-entry-20261017/에 남겼다.
- 최종 built preview1024×768 새 context: 두 게임 준비 중 progressbar(0~13%)·tray0/card0, 준비 뒤 정상 화면. gate 전 background phonics mp3 **0개**, 준비 이후2초 관찰에서 기존 top100 **100개** 시작. map 조회·필수 core를 생략하거나 백그라운드 캐시를 제거하지 않았다.
- 실제 소리 듣기→a배치→되돌리기, 그림짝 선택 강조 정상. 재진입의 실제 정답 음원은 각4응답 모두 disk/SW 캐시 재사용, gate는 실제 상태를 다시 확인한다. pageerror0. 실행 화면과 gate 캡처를 육안 확인했다. 전체 게임 완주/실기기 터치·스피커 청취·운영 반영 검증은 아니다.
- 최종 관련8파일47검사 통과(기존7파일39 + loader1파일8, 중복 합산 없음). 최종 client typecheck·변경 source ESLint·build40.51초 통과. 이전45.91초 빌드는 top100-only,79초 빌드는 제외한 효과 실험이라 혼동하지 않는다. 기존 Browserslist/lottie eval/i18n static+dynamic/large chunk 경고는 남는다.
- 증거 `final-loader.json`(최종 교차), `alternate.json`(top100-only 교차), `experiment-effects-focused.json`(제외한 실험), `before/final-focused.json`(이전 순차 표본), `verification.json`(최종 gate/캐시/실제입력), `*-gate.png`, `*-input.png`. 로컬 보조 preview5195는 검수 뒤 종료하고 기존 서버/작업 폴더/기존 output은 보존한다.

## 전달

코드/검수 기록93d13a669을 로컬 main에 fast-forward 통합했다. 추적 파일 clean 및 커밋 훅 후 실질 source 변경 없음 확인. 현재 요청은 최적화이며 새 push/배포는 승인하지 않았으므로 하지 않는다. 남는 첫 진입 비용은 원격 단원/코어 이미지·음원/화면 코드와 폰트의 실제 다운로드이며, 캐시 플래그나 게이트 단축으로 숨기지 않는다.

## 메인 푸시 요청

2026-10-18 사용자 “좋아. 메인에 푸시하자” 승인으로 전달 상태를 갱신한다. fetch 후 origin/main...HEAD는0/3, 추적 파일 clean이며 a01e45464 운영 검수 기록·93d13a669 최적화/검증·898d35202 통합 기록이 대상이다. 기존47검사/타입/lint/build·브라우저 검수 뒤 source 추가 변경이 없어 반복 실행하지 않는다. 승인 기록만 추가 커밋하고 일반 main push 후 원격 SHA/0대0을 확인한다. 운영 배포 완료·운영 속도 검증은 별도다.

## 운영 후속 검수 진행

2026-10-18 사용자 요청으로 aef75d0c1의 운영 배포·영어 블록/그림짝 첫 진입·캐시/로딩 게이트를 검수한다. 원격 main과 로컬0/0·추적 clean 확인. 00:04 KST 현재 Railway 프런트85fe5515는 pending, 서버 watched paths 미변경 skip success·health ok다. CUA/컴퓨터 사용 runtime 모두 kernel assets 경로 오류로 초기화 실패하여 기존 사용자 탭/캐시/학습 기록을 건드리지 않는 격리 Chrome로 측정한다. 이전과 같은 두 단원·고정 난수·1280×720, 새 context 첫 접속과 같은 context 재진입을 나누고 실제 entry로 배포 전후를 구분한다. 증거는 output/production-first-entry-20261018/. 실기기/스피커 청취·게임 완주와 구분하며 운영 데이터를 수정하지 않는다.

## 운영 최종 결과

- 프런트 Railway 배포 **85fe5515-d2c5-4dc9-9f3a-0d0deee2790d**가 **2026-10-18 00:08:06 KST**(2026-10-17T15:08:06Z) success. 배포 대상 aef75d0c1, HTML entry **index-CsFY1E6x.js → index-Mch36lEq.js**, health ok 확인. 서버는 watched paths 미변경 skip success다.
- 같은 설치 Chrome1280×720·운영 URL·고정 난수로 각 게임 새 context3회 첫 접속, 매번 같은 context에서1회 재진입했다. 캐시는 끄지 않았다. 이전 표본 전부 CsFY1E6x, 이후 전부 Mch36lEq라 배포 전환 표본을 섞지 않았다. 성능 검수끼리/빌드와 동시 실행하지 않았다.

| 운영 준비 시간 | 이전3회(ms) | 새3회(ms) | 중앙값 |
| --- | --- | --- | --- |
| 영어 Book3 블록 첫 접속 | 4864 / 4320 / 4578 | 3810 / 3131 / 3734 | 4578→3734ms |
| 영어 Book2 그림짝 첫 접속 | 3501 / 4128 / 3603 | 3136 / 3476 / 3171 | 3603→3171ms |
| 영어 블록 캐시 있는 재진입 | 2428 / 2103 / 2450 | 1601 / 1514 / 1530 | 2428→1530ms |
| 그림짝 캐시 있는 재진입 | 1829 / 1655 / 1551 | 1008 / 969 / 1006 | 1655→1006ms |

- 단원 GET 시작은 첫 접속 기준 기존2019~2325ms → 새670~1044ms, 재진입 기존780~1146ms → 새255~316ms로 앞당겨졌다. 각 입장 같은 단원 GET은 **1회**이며 화면에서 중복 요청하지 않았다. 이번 표본에서는 개선됐지만 배포 전후 순차·3회·단일 PC/회선 표본이므로 기기별 보장 수치/원인별 기여도로 해석하지 않는다. 이전 날짜 수치보다 이번 baseline 자체가 느린 변동도 모두 보존한다.

### 실제 캐시·게이트·입력

- 새 번들1024×768 검수에서 두 게임 모두 core progressbar **0%·tray0/card0** 이후 실제 게임 화면 표시. 필수 준비 전에 게임이 보이도록 게이트를 제거하지 않았다. 준비 완료까지 background phonics mp3 **0개**, 완료 후2초 관찰에서 기존 top100 **100개** 예열했다. 기존 map/background cache 준비를 없앤 것이 아니다.
- 각 게임 재진입 정답 음원4개 모두 실제 src 설정/loadeddata4회와 CDP disk cache4응답 확인. 성능3회 재진입의 두 게임 정답 음원 **24응답 전부 disk cache**. 새 Audio 준비는 캐시된 본문의 실제 준비 확인이며 재다운로드와 다르다.
- WebP2종200·`public,max-age=604800`, 새 hashed JS200·`public,max-age=31536000,immutable`, 각각 ETag 조건부 **304/0B**. SW production/local SHA256 **8a57abbf06177dd4ad78335778e3bbcd38849dae07f206d3f5a533196bc5b389** 동일. 기존 HTTP/SW 정책 유지.
- 블록 소리 버튼→a배치→되돌리기, 그림짝 카드 선택 강조 정상. core 대기 화면·입력 화면을 직접 육안 확인했다. 성능/입력 검수 pageerror0. 전체 판 완료/학습 진도 조작·실기기 터치·스피커 청취 검증은 하지 않았다.
- 대기 중 추가한 `baseline-gate/` 검수는 배포 전환을 걸쳤다. 블록은 구번들(bgBefore100/bgAfter0), 그림짝은 **신번들**(0/100)이므로 이를 모두 baseline으로 묶지 않는다. 본 결과/속도표는 별도 `before-focused.json`/`after-focused.json`과 신번들 `verification.json`을 사용한다.
- 증거: `deployment.json`, `before/after-focused.json`, `summary.json`, `verification.json`, `cache-before.json`, `cache-probes.json`, `block/matching-gate.png`, `block/matching-input.png`. 제품 코드·운영 R2/DB·사용자 캐시/학습 기록 변경 없이 검수 기록만 로컬 커밋한다. 새 push는 하지 않는다.
