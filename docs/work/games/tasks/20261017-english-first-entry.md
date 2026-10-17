# 영어 블록·그림짝 첫 진입 후속 병목

- id: 20261017-english-first-entry
- domain: games
- status: ready
- base: a01e45464
- branch: codex/phonics-word-journey
- worktree: C:/Users/kil21/.codex/worktrees/phonics-word-journey/tangobook
- delivery: 로컬 작업·새 push 요청 없음

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

- 같은 단원 GET은 각 입장 **1회**. 단원 요청 시작은 baseline626~721ms에서 candidate150~162ms로 실제 앞당겨졌다. 기존 query가 별도 재요청하지 않고 진행 중 결과를 받는다. 이 비교는 직전 top100-only/효과 실험/운영 결과와 구분한다. 원본 전부 output/english-first-entry-20261017/에 남겼다.
- 최종 built preview1024×768 새 context: 두 게임 준비 중 progressbar(0~13%)·tray0/card0, 준비 뒤 정상 화면. gate 전 background phonics mp3 **0개**, 준비 이후2초 관찰에서 기존 top100 **100개** 시작. map 조회·필수 core를 생략하거나 백그라운드 캐시를 제거하지 않았다.
- 실제 소리 듣기→a배치→되돌리기, 그림짝 선택 강조 정상. 재진입의 실제 정답 음원은 각4응답 모두 disk/SW 캐시 재사용, gate는 실제 상태를 다시 확인한다. pageerror0. 실행 화면과 gate 캡처를 육안 확인했다. 전체 게임 완주/실기기 터치·스피커 청취·운영 반영 검증은 아니다.
- 최종 관련8파일47검사 통과(기존7파일39 + loader1파일8, 중복 합산 없음). 최종 client typecheck·변경 source ESLint·build40.51초 통과. 이전45.91초 빌드는 top100-only,79초 빌드는 제외한 효과 실험이라 혼동하지 않는다. 기존 Browserslist/lottie eval/i18n static+dynamic/large chunk 경고는 남는다.
- 증거 `final-loader.json`(최종 교차), `alternate.json`(top100-only 교차), `experiment-effects-focused.json`(제외한 실험), `before/final-focused.json`(이전 순차 표본), `verification.json`(최종 gate/캐시/실제입력), `*-gate.png`, `*-input.png`. 로컬 보조 preview5195는 검수 뒤 종료하고 기존 서버/작업 폴더/기존 output은 보존한다.

## 전달

로컬 검증 완료, main 통합 대기. 현재 요청은 최적화이며 새 push/배포는 승인하지 않았으므로 하지 않는다. 남는 첫 진입 비용은 원격 단원/코어 이미지·음원/화면 코드와 폰트의 실제 다운로드이며, 캐시 플래그나 게이트 단축으로 숨기지 않는다.
