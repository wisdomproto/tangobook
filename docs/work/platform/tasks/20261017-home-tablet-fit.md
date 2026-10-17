# 태블릿 홈 한 화면 배치

- id: 20261017-platform-home-tablet-fit
- domain: platform
- status: integrated
- updated: 2026-10-17
- base: b047e3c5f
- branch: codex/phonics-word-journey
- worktree: C:/Users/kil21/.codex/worktrees/phonics-word-journey/tangobook
- delivery: 59a9537c8 운영 프런트 배포 success·태블릿 홈7크기/동작 검수 완료

## 요청·범위

태블릿 가로 홈 /library에서 한글·영어 과정, 실제 이어하기, 바로 놀기4개/언어 선택, 추천3권을 한 화면에 보이게 한다. 클릭 동선/문제 선별/추천 기능은 유지한다. 기존 WebP/공용 디자인을 재사용하고 글자를 무조건 축소하거나 overflow hidden으로 숨기지 않는다.

## 검수 계획

1024×768·1180×820·1280×800과 짧은1024×650, 기존 PC/휴대폰에서 확인한다. 신규·한영 둘 다 이어하기가 있는 테스트 상태를 구분한다. 실제 기기 대신 독립 headless viewport 검수이며 기존 사용자 캐시/진도를 지우지 않는다. [병목 작업](../../phonics/tasks/20261017-block-preload-bottleneck.md)과 같이 진행한다.

## 구현·화면 검수

- 기존1024×768 신규 홈은 문서963px·추천 책 끝922px였다. 가로 태블릿900~1400px/높이600~1000px에서는 제목 여백·과정 그림판·별도 이어하기·4놀이 그림 높이를 맞추고 추천 제목/셔플/모두보기를 표지3장 왼쪽에 둔다. 768~899px 긴 세로에서는 남는 높이를 써 놀이 그림/추천 표지를 크게 유지한다.
- 전체 언어판 Link·밖의 이어하기·바로 놀기 한영/4직접 링크·골라 놀기·추천 셔플/3표지 유지. 화살표는 제목 옆, 장식 자모는 판 높이 안으로 맞췄다. 고정 높이/overflow hidden/transform 축소로 내용을 숨기지 않는다. 조작44px 이상, 제목22~28/과정28/놀이20/활동14px 이상 유지.
- 격리 QA의 한영 둘 다 시작한 상태(완료/성취 주입 없음), 최종 책 끝: **1024×768=718px, 1180×820=757px, 1280×800=751px, 1366×768=742px, 1024×650=626px, 1024×600=591px**. 모두 문서=뷰포트 높이/가로 넘침0. 768×1024 세로는 책 끝846px로 전체 노출. 이미지 decode 뒤 실제 캡처를 육안 확인했다.
- 1536×864 PC/844×390 폰은 기존 스크롤 배치 유지·가로 넘침0. PC/폰도 억지로 한 화면에 축소하지 않는다. 긴 다국어/큰 글꼴은 자연스러운 스크롤 허용. 실제 기기/FPS 전수 검수는 아니다.
- 관련53회귀·client 타입/변경 lint·최종 build46.71초 통과. 기존 WebP만 재사용, 새 자산/엔진·언어별 동선·추천/학습/운영 설정 변경 없음. 스크린샷/geometry는 worktree output/preload-home-20261017에 미추적으로 보존한다. 새 push 없음.
- 최종 built preview5194에서도1024×768·두 이어하기·추천3권을 재검수: 문서768px/책 끝718px, pageerror0. home-built-1024x768.png를 저장·육안 확인했다. 개발 CSS에만 맞고 실제 번들에서 빠지는 경우를 구분했다.

## 로컬 통합

5e5c3d96a와 함께 로컬 main fast-forward 통합 완료, 훅/추적 상태·diff check 확인. root output/preload-home-20261017에도 주요 스크린샷/계측 사본을 보존했다. 새 push/배포는 하지 않았다.

2026-10-17 사용자 후속 요청으로 main push 승인. [전달 범위와 검증](../../phonics/tasks/20261017-block-preload-bottleneck.md#메인-푸시-요청). 기존 검수 이후 제품 변경은 없으며, push와 실제 운영 배포 완료는 구분한다.

## 운영 배포·태블릿 검수

- 59a9537c8/Railway061bbc51 프런트14:03:35Z success·새 index-CWZAoTSe·health ok를 확인했다. [블록/캐시·배포 근거](../../phonics/tasks/20261017-block-preload-bottleneck.md#최종-운영-결과).
- 실제 운영 /library, 별도 headless Chromium·Asia/Seoul·새 guest QA 컨텍스트에서 한영 시작 flag만 켜 두 이어하기가 나타나게 했다(완료/성취/사용자 프로필 수정 없음). 이미지/폰트 준비 뒤 각 viewport 캡처·geometry 검수. **1024×768/1180×820/1280×800/1366×768/1024×650/1024×600/768×1024 모두 문서=뷰포트 높이, 가로 넘침0, 이어하기2·놀이4·추천3, 깨진 이미지0**.
- 책 끝은 차례로718/757/751/742/626/591/846px. 1024×768·1024×600 실제 캡처를 육안 재확인해 배경/글자/책 표지 잘림 없이 한 화면에 보임을 확인했다. 실물 iPad/Android/FPS/실제 사용자 브라우저 검수로 보고하지 않는다.
- 운영 한영 놀이 선택→4개 모두 lang=en 링크/블록 이름 동기화, 추천 셔플→책3개 변경 정상. 이 턴은4게임 전체 완주가 아니라 홈의 기존 도구 동작·배치 확인이다. pageerror0. 실제 사용자 캐시·진도 삭제, 운영 설정/콘텐츠 수정 없음.
- 증거는 root output/production-preload-tablet-20261017/home-*.png·layout.json·home-controls.json. 이번 운영 검수만 로컬 기록·커밋하고 새 push는 하지 않는다.
