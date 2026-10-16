# 홈 바로 놀기

- id: 20261016-home-free-play
- domain: platform
- status: integrated
- updated: 2026-10-17
- base: 141b05991
- branch: codex/phonics-word-journey
- worktree: C:/Users/kil21/.codex/worktrees/phonics-word-journey/tangobook
- integration: 23e0c9c53 로컬 main fast-forward 포함 확인
- delivery: ad0fc843b 원격 main push·Railway c6c5c341 successful/Active·운영 홈4종 실제 진입 확인

## 사용자 결정

커리큘럼 없이 하기 좋은 한글 블록·낱말 쓰기·색칠하기·숨은그림찾기를 메인에 독립된 놀이 입구로 제공한다. 후속 선택은 **쉬운 문제를 무작위로 바로 시작**이다. 중간 모드/책/난이도 선택을 추가하지 않는다. 한글 모드 입구에도 반복할지 질문에는 홈에서 먼저 제공하고 두 모드 선택은 유지하자는 의견을 설명했다. 한글 페이지의 같은4버튼 추가는 승인되지 않았다.

## 방침

- 기존 준비된 공개 책/도안과 실제 플레이어·낱말 음원·장면·게임 기록을 재사용한다. 챕터 완료·커리큘럼 이어하기/잠금을 변경하지 않는다.
- 홈은 기존 개별 도구 삽화 WebP를 재사용하고4개의 명확한 큰 선택지로 구성한다. 새 API/이미지 생성·R2 데이터 수정은 하지 않는다.
- 한글 낱말은 짧고 받침/쌍자음/복잡한 모음 없는 단어, 숨은그림은2~3가지 대상으로 시작한다. 쉬운 난이도 flag만 넘기고 실제 분량/문제를 그대로 두는 구현은 피한다.

## 검증

- 홈의 두 과정 입구와 실제 이어하기를 보존하고 추천 도서 앞에4개 바로 놀기를 추가했다. 넓은 화면의 제목/과정/이어하기를 압축하고 중복 소개 문장을 덜어 일반 PC에서4개 이름까지 첫 화면에 보이게 했다. 한글/영어 모드 선택 페이지는 수정하지 않았다.
- lightweight metadata/홈 그림만 eager, 실제 게임·data-builder는 lazy route다. 기존 alpha WebP4개 합159,222byte 재사용이며 새 그림/엔진/서버 API·운영 콘텐츠 배치 수정은 없다.5로케일로 홈/준비/오류 안내를 연결했다.
- 시작 시 공개 책 목록과 준비된 도안 catalog만 조회하고 실제 책 공개/종류/숨김을 다시 확인한다. 블록·쓰기는 기존 랜덤 블록과 같은 세계 명작에서1~2음절·받침/쌍자음/복잡한 모음 없는 그림 낱말을 최대3개 고른다. 처음의 자연관찰 피부 등은 쉬운 자유 쓰기에 낯설어 세계 명작 정책을 유지하는 것으로 보완했다. 색칠은 낱말 도안 한 장, 숨은그림은 원본2~3개 장면 우선/큰 장면은3낱말만 고르며 같은 낱말의 여러 hitbox를 유지한다.
- 한 판은 책 한 권이며 기존 실제 책 ID/낱말 음원/삽화/장면·storybook source 로그를 보존한다. 커리큘럼 완료/현재 권/이어하기/잠금을 바꾸지 않는다. 기존 word-learning의 independent=true·assessment·firstAttempt·hintUsed 평가 조건을 추가로 만들지 않는다. 새 입장 무작위, 판 안 다시하기는 같은 판 복습으로 맞췄다.
- 실제 localhost5187 홈에서4종 모두 중간 선택 없이 열기→홈 복귀를 확인했다. 작은568×320에서도 각각 진입/복귀했으며 숨은그림 실제 블랙홀 클릭에서0→1개 완료/남은3→2 반응을 확인했다. 쓰기/블록 전체 정답·게임4종 완주나 실물 카메라 검증으로 보고하지 않는다.
- PC1280×720 및1024×768/844×390/568×320/375×812에서 홈 육안·DOM 배치 확인:4카드 모두 그림/이름 겹침0·카드 밖0·페이지 가로 넘침0, 이름 행44px. 짧은 가로도4열/세로폰2열. 작은 게임판은 원본 이미지 완전 로딩 뒤 따로 캡처했다. 실제 모바일 손가락/FPS 검사는 아니다.
- 중간 그림의 intrinsic grid 최소 크기가120px 부모를 넘어 이름을 가리는 것을 실제 캡처에서 발견해 별도 높이/absolute object-contain으로 수정했다. 로딩 중 빈 이미지를 최종 화면으로 판단하지 않고 complete/naturalWidth를 확인했다.
- 회귀는 문제 선별/공개·숨김/출처·2~3개 hitbox·직접 route4종/복귀/오류·빈 목록/반복·진도 불변 및 기존 다국어 어휘/숨은그림을 검사했다. 최종 실행 결과·전달 커밋은 인계에 기록한다. 테스트 fixture의 필수 메타데이터·discriminated union 타입 누락을 고쳤으며 제품 기대값을 낮추지 않았다.
- 증거: C:/project/tangobook/output/home-free-play-20261016/ 의 home-pc.jpg, home-크기.jpg4개, layout-audit.json, blocks-568.jpg/writing-568.jpg/coloring-568.jpg/hidden-568.jpg/hidden-found-568.jpg. 이전 빈 로딩 캡처를 완전 로딩 캡처와 구분한다.
- 브라우저에서 기존 BookCover의 React18 fetchPriority 개발 경고를 확인했다. 해당 공용 표지 코드는 이번 diff에 없고 페이지 실행을 막지 않는다. 콘솔0으로 보고하지 않는다.

## 인계

최종6파일53검사·client 타입·변경TS/TSX ESLint·build28.70초 통과. 기존 Browserslist/Lottie eval/혼합 import/큰 청크 경고는 남는다. 코드/기억23e0c9c53을 로컬 main에 fast-forward 통합하고 ancestor·tracked clean을 확인했다. 이번 변경 push/배포는 요청받지 않았다. 기존 DISABLE_PUBLISH_SCHEDULER=1인client Vite5187/공개 API 읽기 proxy를 재사용했고 사용자 미추적 output/tmp는 보존했다.

## main 전달 — 2026-10-16

후속 사용자 요청 “좋아. 메인에 푸시하자”로 홈 바로 놀기 변경의 원격 main 전달을 승인받았다. fetch 후 origin/main...HEAD는0/2이며 코드23e0c9c53과 통합 기록3acae38f9만 앞서 있다. tracked clean과 변경 범위를 확인했고 기존 미추적 output/tmp는 보존한다. 제품 코드 변경이 없어 기존53검사·타입/lint/build·화면 검증을 유지하며 전달 기록만 추가해 일반 push한다. Railway 운영 배포 성공과 운영 화면 확인은 push 성공과 별도로 확인해야 한다.

## 운영 배포·바로 시작 검수 — 2026-10-17

- 사용자 요청으로 배포 상태와 운영 홈4버튼의 즉시 시작·한영 선택 여부를 검수했다. 원격 main은 ad0fc843bfca7e2e52c263950d7a653a74c88464, fetch 후0/0. [Railway 배포](https://railway.com/project/b469e171-479c-400a-80bc-8ab4273c25de/service/0019800b-d014-4464-8638-60dcf283677e?environmentId=9d29baf7-1890-453a-956e-94bc329ef98d&id=c6c5c341-263c-444d-a6af-2ae525adb51e#details)의 successful·Active와 GitHub commit 링크가 해당 SHA임을 직접 확인했다. 배포 표시 시각은10월16일23:50 GMT+9, 검수는 자정을 걸쳤다.
- 운영 `/library`를 새로고침해 한글 블록·낱말 쓰기·색칠하기·숨은그림찾기4개 그림/이름·진입 링크를 확인했다. 각 버튼을 실제 클릭해 중간 책/모드 선택 없이 준비 로딩 뒤 실제 플레이 화면으로 이동하고 홈 복귀까지 확인했다. 실제 무작위 문제는 블록 바다, 쓰기 피리, 색칠 셔츠, 숨은그림 토끼와 거북 장면의 나무/숲이었다.
- 색칠 도안에 직접 클릭해 물감 표시, 숨은그림 나무를 직접 클릭해 완료0→1/남은2→1 반응을 확인했다. 블록·쓰기 전체 정답이나4게임 전체 완주 검증은 아니다. 실제1280×720 브라우저 확인이며 실기기/새 반응형 전수 검사는 아니다.
- 현재 홈 바로 놀기는 **모두 한글 전용**이다. 화면에 한영 선택이 없고 코드도 KoreanBlockPlayer·KoreanWordWritingPlayer·ko/language:korean 및 한글 쉬운 낱말/숨은그림ko를 사용한다.5개 UI 번역 로케일은 게임 학습 언어 선택 지원을 뜻하지 않는다. 사용자에게 미지원 사실을 알렸으며 이번 검수에서 새 선택 UI나 영어 문제를 구현한 것으로 보고하지 않는다.
- 최종 홈의 두 과정 이어하기 링크는 검수 전후 같은 활동으로 유지됐다. 수집한 해당 운영 탭 console error0, `/health` status ok(2026-10-16T15:01:10.584Z). 숨은그림 찾기1개 입력은 일반 게임 플레이이며 학생 진도를 임의로 주입하지 않았다. 운영 콘텐츠/설정·재배포·새 push는 수행하지 않았다.
- 증거: `C:/project/tangobook/output/production-home-play-20261016/`의 home.png, blocks.png, writing.png, coloring.png, hidden-object.png, hidden-object-found.png, railway-deployment.png. 검수 기록만 로컬 커밋한다.
