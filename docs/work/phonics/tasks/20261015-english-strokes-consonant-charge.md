# 영어 획순 쓰기·한글 자음5회 충전 통일

- id: 20261015-english-strokes-consonant-charge
- domain: phonics
- status: complete
- updated: 2026-10-15
- base: 7dd6b074c
- branch: codex/phonics-word-journey
- worktree: C:/Users/kil21/.codex/worktrees/phonics-word-journey/tangobook
- integration: 코드 b3ccc3db3 로컬 main fast-forward 통합 완료
- delivery: 2026-10-15 원격 main 0b60a12fe·Railway 배포 bcb44cd2 성공/Active 및 운영 영어 획 쓰기·ㄱ5회 완료→쓰기 이동 확인

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

## 운영 배포·실제 입력 검수 — 2026-10-15

사용자가 배포 여부와 운영 두 기능 확인을 요청했다. 처음 한국시간21:23경 운영은 이전 자음3장×3회/영어 면 채움 화면이었다. 기존 로그인으로 Railway 대시보드에 접속해 두 main push의 빌드가 진행 중이며 이전 배포가 Active인 것을 확인했다. 임의 재배포나 빌드 취소 없이 전환을 기다렸다.

Railway deployment bcb44cd2-780c-4fb1-b435-81dee3b27e88의 Details에서 Deployment successful·Active와 GitHub 커밋0b60a12fecf4faa46b0d4f284c769fd5faea3a77/main을 직접 확인했다. 프로젝트 b469e171-479c-400a-80bc-8ab4273c25de, service0019800b-d014-4464-8638-60dcf283677e, production이다. 이는 공개 기능만 보고 추정한 배포 상태와 다르다. 빌드/prerender 완료 뒤 배포 성공. prerender는2성공/2실패(SPA 모드 입구 내용량 기준)였으나 배포를 막지 않았고, 실제 아래 활동은 정상 로드됐다.

- 운영 `https://www.tangobook.co.kr/library/phonics/english/en-b1-u01/letters-write`: 새 StrokeTraceCanvas/획 진행/종이 아래 도구가 나타났다. 실제 native drag로 가로획부터 시도하면 진행0·시작점 재시도 안내, 올바른 첫/둘째 획은1→2와 해당 획 전체 채움, 마지막 가로획 뒤 A 통과/그림 보상 확인. 소문자a는 별도 미완료로 유지됐다. 대소문자52개 운영 완주나 i/j 점의 운영 실입력까지 확인했다는 뜻은 아니다(앞선 로컬 경로/점 검증 유지).
- 운영 `https://www.tangobook.co.kr/library/phonics/korean/kr-h1-u02/consonant-tap`: 큰 한 자음·충전5칸, 실제5회 개별 클릭으로 각 발음 종료 뒤0→1→2→3→4→5.4까지 미완료,5에서 완성/최고야 표시, 칭찬 후 같은 단원의letter-write로 자동 이동 확인. 정상 UI로 완료한 테스트이며 가짜 완료 주입/진도 초기화/데이터 삭제는 하지 않았다.
- 두 검수 탭 수집 console error0. 배포 전 script index-CkHYPFs5.js에서 배포 후 index-B2XgNVuh.js로 변경. `/health`는21:32:46경 status ok(UTC2026-10-15T12:32:46.320Z). Git fetch 후 origin/main과 로컬 main0/0을 확인한 뒤 기능 검수를 진행했다.

증거 `C:/project/tangobook/output/production-strokes-charge-20261015/`: english-A-two-strokes.png, english-A-completed.png, consonant-four-of-five.png, consonant-charge-complete.png, consonant-next-writing.png. 브라우저 기본1280×720, 실기기/전권/모든 글자/커리큘럼 새 잠금 해제 전수 검증은 아니다. 이번에는 코드·운영 콘텐츠·설정·자격증명을 변경하지 않았고 새 push/재배포 없이 기록만 로컬 커밋한다.
