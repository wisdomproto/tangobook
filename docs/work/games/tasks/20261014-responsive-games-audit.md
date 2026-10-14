# 전체 학습 게임 PC·태블릿·휴대폰 반응형·디자인 점검

- id: 20261014-responsive-games-audit
- domain: games
- status: integrated
- updated: 2026-10-14
- base: aac4778dc
- branch: codex/storybook-learning-ui
- worktree: C:/Users/kil21/.codex/worktrees/platform-ui-v2/tangobook
- integration: 58ce47b21 로컬 main fast-forward 통합
- delivery: 미푸시·미배포 — 이번 작업 push 요청 없음

## 요청·결정

한영 블록 이외 게임도 PC1920×1080, 태블릿1024×768, 가로 휴대폰568×320의 크기·배치와 디자인 통일감을 점검한다. 사용자 후속 지시: 손볼 그림/아이콘/테두리는 이미지 스킬로 제작한다. 기존 자산과 입력/채점 로직을 유지하며 관찰된 문제를 수정한다.

초기 router inventory 뒤 홈/커리큘럼 후속 작업으로 보류했다가 aac4778dc 기준 재개했다. 현재 활성 학습자 메뉴를 근거로 검사했다. 레거시 /games/hori-_, /playground/word-_ redirect와 메뉴에서 제거된 이야기 내용/쪽 순서, 비노출 퍼즐 sample을 다시 활성화하지 않는다.

## 브라우저 점검 범위

| 실제 화면                                       | 대표 경로/자료                                                                      |
| ----------------------------------------------- | ----------------------------------------------------------------------------------- |
| 점 잇기/그림 그리기·낱말 쓰기·그림짝·블록       | kr-h1-u02, en-b1-u01, en-b2-u01의 game-\*                                           |
| 모음 듣고 고르기·찾기·기억                      | kr-v1-g01의 listen-game/hunt-game/match-game                                        |
| 낱말 듣기 탐색→퀴즈·글자 사냥                   | kr-h1-u02, en-b1-u01, en-b2-r1                                                      |
| 뒤집기·소리 선택·그림짝·그림 보고 쓰기          | kr-h1-r1, en-b1-r1, en-b2-r1의 review-\*                                            |
| 복잡한 모음/상위 영어 글자 변별                 | kr-h4-r1/letter-hunt, en-b5-r1/letter-hunt                                          |
| 동화책 한영 그림짝·쓰기·어휘/장면 색칠·숨은그림 | 신데렐라1772107608499, ko/en 실제 메뉴                                              |
| 일반 독후 게임 fullscreen portal                | /games/vocab 알라딘 실제 그림짝                                                     |
| 공개 색칠·숨은그림 크게 보기                    | 개구리 왕자 실제 /activity/... 메뉴                                                 |
| 결과 화면                                       | 실제 GameResultScreen 독립 미리보기, 앱 i18n·공통 CSS 포함; 완료 기록 없이 2/4 표시 |

각 유형은 위 세 viewport로 촬영·DOM 치수 확인했다. 총157캡처/34 URL에는 수정 전·후, 로딩 중 표본, 같은 URL의 동화책 게임 변형과 별도 결과 미리보기가 포함된다. 이를157개 게임/34개 유형 전수라고 해석하지 않는다. 로딩 표본은 실제 검수에서 제외하고 loaded/final 이름으로 재촬영했다.

증거: C:/Users/kil21/.codex/visualizations/2026/10/11/01a12b90-4491-7c02-b97d-b867f6ec4b02/games-responsive-20261014/matrix.json 및 PNG/contact-1~6.jpg. raw DOM outside에는 의도된 알파벳 트레이 스크롤과 portal 아래 부모 페이지/공개 목록도 포함된다. 화면 밖 원시 rect 개수를 실제 잘림 개수로 보고하지 않는다.

## 관찰·수정

- 휴대폰 낱말 듣기: 2×2 그림+라벨 카드가 퀴즈 CTA를 덮었다. 탐색 안내/듣기 놀이 버튼을 왼쪽, 카드 전체를 오른쪽으로 분리했다. 그림 라벨을 포함한 카드 높이와 글자 크기를 맞췄다. 기존 보기/정답/음원/기록 유지.
- 생성 듣기 놀이 아이콘과 기존 코랄/민트 CTA를 조합, 기본 🎯 퀴즈 문구 대신 듣고 맞춰보기 한 문구. 언어 구분은 실제 prop korean/english 기준.
- 어휘 색칠 정사각 도안이568×320에서 약539×155로 눌렸다. 모든 도안에 원본 비율을 적용하고 canvas는 절대 레이어로 종이 크기에 종속한다. 짧은 가로는 palette를 오른쪽2열로 옮겨 실제224×224 정사각 쓰기판을 확보한다. 장면 도안은 자기 원본 비율 유지. 물감 최소44px/원래1024×1024 canvas 좌표·영역/색/힌트/채점 유지.
- 동화책 따라 쓰기 PC/태블릿은 그림이 작게 위에 떨어져 있었다. 공통 그림+입력판 가로 배치로 파닉스와 맞췄다. 캔버스 폭은 부모 cqw+높이 상한, 같은 낱말/글꼴/마스크/99% 기준.
- 한글 폰 모음 버튼33px/자음41px를44px 이상으로 넓혔다. 모음 고정·자음 스크롤/스와이프 구조 유지. 영어 입력칸41px도44px 이상, 긴 낱말은 기존 슬롯 스크롤 유지.
- 생성 replay 아이콘을 색칠 reset/한영 블록 reset/결과 다시하기에서 공유한다. 결과의 🔄 이모지 중복 제거. 파닉스 GameHeader 진행 숫자는 언어 accent 사용.

## 이미지 자산

imagegen 스킬 읽고 적용. 기본 로컬 Qwen 서버8190/8188 queue 확인 모두 응답 없음 → 이미 허용된 내장 imagegen 경로로 새 투명 PNG2종 생성, 육안 확인 후160px alpha WebP로 변환.
packages/client/public/images/learning/game-ui-v2/replay.webp 6,876B / listen-play.webp 8,308B, 합15,184B. manifest.json에 원본/배포 SHA·크기·생성 경로 기록. 원본은 Codex generated_images에 보존. 이번 자산은 프로젝트에 저장하며 원격 업로드/외부 데이터 변경 없음.

## 검증·한계

- 초기 관련7파일28테스트 통과(듣기/기억/결과/매칭/한글블록/색칠 힌트/장면 영역).
- 추가6파일29테스트 통과(영어 블록·트레이 및 portal 회귀 포함). 중복 테스트를 합쳐57개 고유 테스트로 보고하지 않는다.
- 최종 결과·듣기·portal3파일14테스트, client typecheck, client build26.56초 통과. prettier/diff 확인. 초기 잘못된 language=en 비교는 타입 검사가 잡아 실제 english 값으로 수정했고 재검사 통과.
- 변경 TSX eslint0오류, KoreanBlockPlayer의 기존 unused composeHangul/isVowel2경고 유지. 기존 build i18n dynamic/static·대형 청크·lottie eval 경고는 이번 변경과 구분.
- 신데렐라 게임 열기/닫기, 언어 선택, 공개 크게 보기/닫기, 듣기 탐색→퀴즈 실제 UI 동선 확인. 사용자 프로필 완료/정답 기록을 만들지 않았다. 결과 화면은 실제 컴포넌트 독립 검수이며 실제 게임 완주 증거가 아니다. 임시 미리보기2파일/탭·viewport override 정리.
- 전체 책/전체 단원 콘텐츠 완주, 실제 터치/카메라/iPad 오디오/FPS, vi/zh/th 변형 플레이는 이번 검수 완료 범위가 아니다. 일반 브라우저 viewport 검수다. 기존 CRLF-only ReviewWriteActivity.test.tsx 및 모든 무관한 미추적 파일 보존.
