# 영어 획순 쓰기·한글 자음5회 충전 통일

- id: 20261015-english-strokes-consonant-charge
- domain: phonics
- status: complete
- updated: 2026-10-15
- base: 7dd6b074c
- branch: codex/phonics-word-journey
- worktree: C:/Users/kil21/.codex/worktrees/phonics-word-journey/tangobook
- integration: 코드 b3ccc3db3 로컬 main fast-forward 통합 완료
- delivery: 2026-10-15 원격 main 코드 fb2decbc8까지 일반 push·SHA 일치·0/0 확인, 운영 배포 완료는 미확인

## 사용자 결정

2026-10-15 사용자 ‘좋아. 메인에 푸시하자’ 요청으로 원격 최신을 fetch한 뒤0 behind/6 ahead와 관련 파닉스 커밋만 포함됨을 확인했다. 일반 main push 성공 후 ls-remote/HEAD가 fb2decbc823a0a2694c636670a6c4bdd53fb0d11로 일치하고0/0임을 확인했다. 아래 검증은 앞선 구현 검증이며 push 때문에 반복 실행하지 않았다.

영어도 획순대로 쓰기로 전환, 한글 자음 누르기도 모음과 같은5회 충전으로 통일하고 실제 화면까지 확인한다. 앞선 영어 미적용/자음3장×3회 보존은 이 승인으로 대체한다. 블렌딩·낱말 쓰기에 획 가이드를 붙이지 않는 기존 결정은 보존한다.

## 구현 범위

영어52자는 system-ui 실제 폰트 경로, i/j 마지막 점은 선 긋기와 구별한 점 찍기. Book1 대소문자 쓰기/써보기 모달/단일 알파벳 복습에 공통 획 쓰기. 기존 그림 보상·음원 종료·실제 완료 후 이동 유지. 한글 기본/쌍자음은 큰 자모 하나에5회 성공 발음 후 완료, 실패·연타·이탈은 진행 아님. 낱말 소개는 뒤의 낱말 만나기에서 수행한다.

## 검증

구현·92자 실제 폰트 경로/대표 UI 및 반응형 입력 검수 완료. 사용자127.0.0.1 진도를 초기화하거나 가짜 완료를 만들지 않았다.


## 구현·반증

- 실제 영어 system-ui bold700 폰트로 초기화하고52자 기존 경로를 재사용. i/j의 마지막 점만 dot로 명시해 이전 획 완료 뒤20px 반경의 누름/뗌으로 인정한다. 취소·다른 위치·지나가는 긴 선은 점 완료 아님. 한글 짧은 획은 dot로 바꾸지 않는다.
- Book1 대소문자 페이지·써보기 모달·en-b1의 단일 글자 복습 및 공용 VowelWrite 영어 낱자를 StrokeTraceCanvas로 연결. 블렌딩/낱말/한글 받침/다른 언어 paint99%는 보존. 복습 최종 글자는 handleWordDone만 호출해 음원이 중복되지 않는다.
- compact 영어 도구는 종이 안을 가리지 않게 아래44px 재생 버튼·획 번호 한 줄.568×320에서 처음 하단도구 bottom326.9px로 잘린 반증을 발견해 제목/간격/종이 비율을 줄여 bottom292.8px/버튼높이44px 확보.1024×768과1280×720 대소문자 판 정렬 확인.
- 이전 모달은 closing state 변경으로1200ms 완료 타이머가 cleanup되는 문제를 확인해 ref로 고쳤다. 낱말 예약 발음도 useGameAudio의 취소 가능한 scheduler로 옮겼다.
- 한글 자음19종(기본14/쌍5)은 한 큰 글자·살구색 충전·5회 발음 종료 후 완료. 기존 words prop은 호출 호환만 유지하며 낱말 소개는 낱말 만나기가 담당한다. 연타 ref 잠금·성공한 소리만 count·중복 ended/praise·이탈을 방어한다.

## 최종 검증

55파일486회귀·타입/변경TS lint 통과. 마지막 복습 Book1 한정/모달 scheduler·완료 ref 정정 후 관련3파일11회귀·타입/변경TS lint 재통과. 최종 client production build26.00초 성공. 기존 Browserslist/i18n 혼합 import/lottie eval/큰 청크 경고는 남는다. 검수용 dev-preview2파일은 output에 보존하고 제품 경로에서 제거했다.

실제 localhost origin에서 ㄱ5회·칭찬 후 letter-write 진입, 실제 영어A3획 완료→그림 보상 확인. i는 학습 기록 없는 검수판의 실제 공용 컴포넌트에 native drag로 몸통을 쓰고 click으로 점 완료. 실제700 한글40/system-ui 영어52 전수 경로는 정확/8px 흔들림 입력·dot tap/픽셀 소유권 모두 성공. 경로 모의 검사와 실제 전체92자 손 입력은 구분하며 실기기FPS/모든 영어 글자 완주는 미수행.

출력 증거는 output/english-strokes-charge-20261015/의 all-92-paths.json, i-dot-complete.png, english-two-strokes.png, consonant-four-of-five.png, consonant-charge-complete.png, english-mobile-568.png. 기존127.0.0.1 사용자 진도는 수정/초기화하지 않고 localhost 실제 입력 검수만 진행했다. 이전 localhost 완료 기록이 있어 새 커리큘럼 잠금 해제 입증으로 확대하지 않는다.

## 영어 학습 기준

사용자 후속: 영어 획순은 어려울 수 있으니 신경 써서 적용한다. [Oxford Owl 공식 handwriting 지침](https://home.oxfordowl.co.uk/english/primary-handwriting/)의 글자 시작점·이동 방향·끝점과 일관된 형태 사용을 참고했다(2026-10-15 확인). 인쇄체 스타일마다 획순이 달라질 수 있어 유일한 표준이라는 주장은 하지 않는다. 기존 인쇄체에 맞춘 곡선/꺾임/교차를 유지하고, 흔들린 추적에는32px 허용 범위를 두면서 순서·방향·끝 도달을 확인한다. i/j 점만20px 점찍기로 예외이며 일반 짧은 획의 점 통과는 허용하지 않는다. 안내 재생 버튼으로 현재 획을 다시 볼 수 있고, 실패 점수 없이 같은 획을 다시 시도한다. 영어 반복 횟수를 임의로3회로 늘리거나 낱말/블렌딩에 획 가이드를 추가하지 않았다.
