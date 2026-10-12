# 한글·영어 전체 활동 반응 점검

- 작업 ID: 20261012-phonics-all-performance
- 상태: 완료
- 브랜치: codex/phonics-all-performance
- 시작 기준: 9561d19d2 (로컬 main)
- 요청: 합성 속도 보완 후 “다 점검해봐”. 한영 익히기·합성·쓰기·복습 및 파닉스 게임의 입력/음원/전환을 점검한다. push 요청 없음.

## 점검 범위

한글·영어 5권씩의 공용 활동 템플릿 16종과 연결 게임을 코드로 점검했다. 단원마다 다른 모든 이미지·음원/발음 내용의 전수 검수와 실기기 FPS 검증은 아니다.

| 활동 | 점검과 결과 |
| --- | --- |
| ConsonantTap / ConsonantBlendListen | 기존 차례/발음 종료 체인·누르기·translate 이동 유지. 직전 듣기 합성 개선 보존. |
| ConsonantWrite | gap 레이아웃 이동 대신 고정 공간 translate, 500+550ms에서380+220ms. 늦은 URL/ended 취소. |
| VowelListen / VowelSyllablePicker | 동일 모음3카드와 순서/완료·공용 소리 체인 확인. |
| VowelWrite | 화면 완료 갱신은 URL 대기 전에, 선택/이탈 후 옛 음원 취소. |
| AlphabetLetterLearn / AlphabetLetterWrite | 발음과 실제 ended 연결 확인. 쓰기 그림1000ms는 그림 관찰 시간으로 유지. |
| CvcPatternLearn | 쓰기 URL/ended 경쟁 차단, 예문 준비가 낱말 발음 시작을 막지 않도록 분리. 완료 뒤 중복 쉼 제거. |
| CvcPatternWrite | 다음 글자 쓰기칸 즉시 열기. 마지막 글자 확인음과 고정600ms 완료 effect 경쟁 제거, 실제 ended 후 낱말. |
| WordFamilyLearn | 예문 준비와 낱말 재생 분리, 쓰기 조각(ak→ake 등)도 실제 발음 키로 순차 워밍. |
| WordListenChoose / ReviewFlipMatch / LetterHunt / Chant | 문제·카드·노래의 의도적 관찰/발음 간격 보존, 공용 타이머/소리·효과 정리 확인. |
| ReviewWrite | 부분 발음의 늦은 URL이 완성 낱말을 끊지 않도록 취소. |
| 파닉스 게임 | 한영 블록·그림짝·낱말쓰기·점잇기, 진입 게이트/결과/입력·효과 경로 확인. |

## 수정과 이유

- WordFillCanvas는 매 pointermove마다720×360 전체 픽셀 채점. 획은 입력마다 즉시 그리고 채점만 requestAnimationFrame당 한 번, pointerup은 즉시 판정. 리셋/이탈 때 예약 취소 및 재사용 시 완료 ref 초기화. 한영 낱말 쓰기·CVC·복습의 공유 경로에 적용.
- LetterFillCanvas 첫 획 뒤 진행률이 생기며 캔버스가 위로 움직임. 처음부터 진행률 공간을 확보해 쓰는 도중 좌표를 고정. 폰트/마스크/99% 채점 보존.
- 한글 쓰기 합성의 두 이동 래퍼를 유지하여 실제 translate 애니메이션이 진행되도록 했다. 812×375에서 안내와 음절 버튼이 겹치던 문제는 본문 최소 높이와 음절 탭 shrink 방지로 해결. 짧은 화면은 세로 스크롤.
- 공용 useGameAudio는 unmount 때 세대 무효화·예약 취소 및 소유 중인 오디오만 정리. 옛 훅 이탈이 새 훅의 발음을 끊지 않는다. useActivitySound와 쓰기 플레이어에도 늦은 URL/ended 취소 적용.
- 그림짝 한글 발음은 음절마다 new Audio 대신 iOS 해금된 공용 재생 요소로 순차 재생. 워밍 키도 실제 재생의 한글 음절/영어 낱말 규칙에 맞춘다.
- useGameEntryGuide의 once ref가 StrictMode 재입장에서 재생을 막아 안내가 중단됨. effect 재입장마다 재생하고 옛 ended/이탈 후 콜백을 무효화.
- 칭찬 음원 최초 다운로드로 약3.5초 대기 관찰. UI 언어와 영어의 다음 칭찬1개씩만 비동기 준비하며 실제로 그 준비한 음원을 사용한다. 재생 뒤 다음 것을 바꿔 준비. 책별 override 우선순위 보존, 전체 음원 목록을 받거나 진입 게이트를 늘리지 않음.
- 복습 카드가 같은 단원 데이터에 여러 useQueries를 만들어 Duplicate Queries 경고. 단원당1회 조회 후 카드별 글자/이미지 선택은 보존. TTS 텍스트도 순서 유지하며 중복만 제거.
- 발음 사이420~450ms, 오답 카드700ms, 점잇기 완성 관찰1100ms 등 학습용 쉼은 유지. 블록 타이핑/효과45ms throttle·객체 수 상한·idle sleep·지연 번들 로드 확인. 승인한 귀여운 연출은 보존.

## 검증

- `pnpm --filter @tangobook/client exec vitest run src/features/phonics-learner src/features/phonics/components/WordFillCanvas.test.tsx src/features/games/hooks/useGameAudio.test.ts src/features/games/hooks/useGameEntryGuide.test.tsx src/features/games/lib/collect-game-assets.test.ts src/features/games/effects`: 32파일223테스트 통과.
- 클라이언트 typecheck 및 Vite production build 통과. 변경 TS/TSX eslint 오류0, 기존 LineMatchingPlayer 미사용 경고2. 기존 Browserslist/Lottie eval/큰 chunk 빌드 경고 유지.
- 실제 IAB 대표 플레이: 영어 CVC 배우기 A9탭→B12탭→C쓰기 a/n/c→can 발음, 한글 ㄱ·ㅏ 쓰기→380ms 이동→읽기→다음 음절, 한영 복습 그림짝 정답 확인. 375×812 한글 쓰기와 영어 낱말가족 가로 넘침 없음. 812×375 한글 세로 합성의 탭/안내 겹침 수정 확인.
- 실제 한글 첫 획 전/후 캔버스 y=422.854px 동일(이동0). 쓰기 ㄱ/ㄱㅏ가 음원 request→playing 약53/50ms. 한글 그림짝 재검사 고/기 시작45/66ms, 준비한 칭찬56ms. 앞선 다른 판 준비한 칭찬42ms. 음원 이벤트 측정은 청취 품질/FPS 검증이 아니다.
- QA 자료: 로컬 `C:/project/tangobook/output/phonics-all-performance-20261012/`. 진단용 DOM/audio probe는 최종 코드에서 제거. 임시 viewport override도 해제.

## 남은 한계와 재현

- 앞선 한글 복습 그림짝(가구)에서 구 음원 request→playing10.316초 대기1회 관찰. 소스에 그 길이의 고정 대기는 없고 워밍은 오류/4초 상한 때 best-effort로 통과한다. 재검사 판은 고기여서 동일 구 자산의 재현/해소를 증명하지 않는다. 외부 R2 음원 지연 원인과 완전 해소는 미확인. 추후 같은 음절을 첫 콜드 재생하고 네트워크/미디어 시작 시간을 비교한다.
- 주소를 직접 새로 열면 브라우저가 첫 안내 autoplay를 NotAllowedError로 거절한 경우가 있었다. 버튼으로 입장한 대표 판/첫 입력 후 재생과 구분하며 자산404나 StrictMode 안내 중단으로 단정하지 않는다.
- 모든 책의 모든 음원·내용, iPad/iPhone 오디오 권한과 실기기60fps는 미검증. camera/Bluetooth 필기 검증도 수행하지 않음.
- 런타임에 연결되지 않은 LetterWriteModal 및 저작 획 편집기 LetterTracingCanvas는 학습 경로 전수 플레이 대상이 아님.
- 기존 ReviewWriteActivity.test.tsx의 CRLF 표시만 있는 변경을 보존하며 이번 stage에서 제외. 기존 output/tmp 및 타 작업은 보존.
- fetch 후 origin/main과 로컬 이력은4/26으로 갈라져 있음. 이번 작업은 로컬 main에만 통합, 원격 강제 변경/push/배포 없음.

## 통합

코드와 기록을 함께 로컬 커밋한 뒤 로컬 main에 fast-forward한다. 커밋 SHA는 Git 기록으로 확인한다.
