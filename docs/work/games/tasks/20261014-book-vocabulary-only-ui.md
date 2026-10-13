# 책 읽기·어휘 게임 선택 단순화

- id: 20261014-book-vocabulary-only-ui
- domain: games
- status: ready
- updated: 2026-10-14
- base: 2b2e036a4
- branch: codex/storybook-learning-ui
- worktree: C:/Users/kil21/.codex/worktrees/platform-ui-v2/tangobook
- integration: 미통합
- delivery: 미푸시·미배포

## 요청과 완료 조건

책 상세의 스스로 읽기 선택을 없애고 읽어주기/어휘 게임으로 줄인다. 동화 내용 게임 선택을 없애며 게임 진입 시 어휘 게임만 바로 보여준다. 사용자 후속 지시: 예시 단어·설명·중간 그룹 화면 없이 깔끔한 게임 버튼만.

## 결정과 범위

- 2026-10-14: 기존 학습자 UI 테마를 이어 큰 구름 버튼에 게임별 그림/이름만 제공. 기존 WebP를 재사용한다.
- 책 내용 게임은 학습자 책 메뉴와 기존 viewer 게임 링크에서 제외. 저작 데이터·게임 플레이어·파닉스 게임은 삭제하지 않는다.
- 선택 언어/그림체, 어휘게임 가용성·학습 이벤트·권한 게이트는 보존한다. 읽어주기는 autoplay=1. 뷰어 내 재생/일시정지 조작은 보존.
- 운영 콘텐츠 변경·새 이미지 생성·원격 push 요청 없음.

## 검증

- 새 책 선택/어휘 메뉴/음원 언어 회귀3파일12개 통과. 읽어주기 autoplay, 선택 언어/그림체 전달, 권한 게이트, 직접 어휘 메뉴·예시/이야기 제거, 게임 복귀, 비활성 가용성 확인.
- 기존 뷰어 언어 필터/설정/쪽 텍스트/게임 종료4파일16개 통과. 기존 GameListViewer 테스트의 jsdom 외부 요청 AggregateError 로그는 있지만 assertion 실패는 없음.
- client typecheck·변경 파일 ESLint(오류/경고0)·client build 통과. 빌드의 기존 대형 chunk/정적+동적 locale import/lottie eval 경고는 유지. 전체 서버/전체 client 테스트는 이번 메뉴 변경 범위에서 재실행하지 않음.
- native CUA 브라우저: 신데렐라 책 상세2메뉴 → 어휘4버튼, 한국어/영어 변경, 영어 색칠 게임 열기/닫기, 기존 viewer ?mode=games의 어휘 URL 이동(언어/그림체 유지), 공용 /games/vocab도 같은4버튼 확인.
- 1280×720 실제 화면과568×320 가로 화면 육안 검수. 초기 재사용 그림의 불필요한 책/블록 장식 중복을 발견해 무장식 구름 CTA sprite로 교체. 작은 가로 책 상세가 세로로 쌓이는 문제를 표지/두 메뉴 병렬+선택 도구 전체 폭으로 수정. 어휘4버튼 bottom282px, 책 두 메뉴 bottom314px·가로 넘침0 확인.
- 어휘 화면에서 책 상세로 돌아올 때 선택 영어가 한국어로 초기화되던 기존 문제 발견: URL lang으로 책 상세 초기 상태 복구, 회귀 추가.
- 새 래스터/데이터 생성 없음. 기존 WebP/atlas만 재사용하며 장면 색칠 count/catalog 조회를 어휘 메뉴에서 제거.
- 검수 증거(저장소 밖): C:/Users/kil21/.codex/visualizations/2026/10/11/01a12b90-4491-7c02-b97d-b867f6ec4b02/의 vocabulary-game-list-20261014.png, vocabulary-game-list-small-20261014.png, book-two-actions-20261014.png, book-two-actions-small-20261014.png.
- 전체 책/게임 완주·실기기 터치·운영 배포는 미확인.

## 다음 행동

관련 코드/기억 로컬 커밋 후 main 통합 상태를 갱신한다. 원격 push는 이번 작업에 요청되지 않았다.
