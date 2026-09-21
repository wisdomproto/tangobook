# 한글·영어 블록 놀이 공개 허브

- id: 20260921-games-blocks-analog-digital-hub
- domain: games
- status: complete
- updated: 2026-09-21
- base: 386883d9f903e0b552b365d8bd4f47316419ccfb
- branch: codex/blocks-analog-digital-hub
- worktree: C:/projects/tangobook/.codex/worktrees/blocks-analog-digital
- integration: main 로컬 통합
- delivery: 미푸시·미배포

## 요청과 완료 조건

활동지처럼 아날로그와 디지털을 잇는 공개 마케팅 표면을 블록 놀이에도 만든다. 한글과 영어 파닉스를 별도 페이지에서 소개하고, 각 페이지는 화면 블록과 실물 블록 카메라 연결을 모두 시작할 수 있어야 한다.

## 읽은 기억과 변경 범위

[게임 MEMORY](../MEMORY.md), [카메라 MEMORY](../../camera/MEMORY.md), 기존 `RandomBlockGamePage`, `KoreanBlockPlayer`, `EnglishBlockPlayer`, 공개 내비게이션·홈·활동지 허브, 서버 SEO 주입과 사이트맵을 확인했다.

## 결정과 진행

- 공개 `/blocks` 허브에서 한글과 영어를 나누고, 각 카드에 화면·카메라 시작 버튼을 둔다.
- 실제 플레이는 기존 `/blocks/hangul`, `/blocks/english`와 기존 플레이어를 재사용한다. 쿼리 `mode=screen|camera`는 첫 입력 모드만 정하므로 인식 엔진이 중복되지 않는다.
- 홈 활동지 영역과 `/activity`, 공개 내비게이션에서 블록 허브로 연결한다.
- 메인 내비게이션 바로 아래에 한글·영어 블록과 화면·카메라 방식을 알리는 전체 폭 배너를 두어 첫 화면에서 바로 진입할 수 있게 한다.
- `/blocks`와 언어별 페이지에 서버 SEO, 구조화 데이터, 사이트맵 경로를 제공한다.
- 예전 `/games/korean-block`, `/games/alphabet-block` 라우트는 기존 링크 호환을 위해 유지한다.

## 검증

- 클라이언트 타입 검사와 프로덕션 빌드 통과.
- 서버 타입 검사·프로덕션 빌드와 `seo-blocks.service.test.ts` 통과.
- 변경 파일 Prettier 검사와 `git diff --check` 통과.
- 브라우저에서 `/blocks` 데스크톱·390px 모바일 화면, 링크 구조, 가로 넘침 없음, `/blocks/hangul?mode=screen` 진입을 확인했다.
- 메인 상단 배너를 데스크톱·390px 모바일에서 확인했고, 가로 넘침 없이 `/blocks`로 이동하는 것을 확인했다.
- 축소된 임베드 화면에서 한글 블록 드래그 미리보기가 포인터와 어긋나는 문제를 수정했다. 미리보기를 transform 조상 밖 `document.body`에 그려 화면 좌표를 유지하며, 해당 회귀 테스트를 추가했다.
- 판 위 블록은 짧게 클릭하면 중심을 유지해 회전하고, 보드 바깥으로 끌어 놓으면 삭제되도록 조작을 보강했다. 드래그 중 삭제 상태 안내와 키보드 회전도 포함한다.
- 로컬 개발 서버에는 API 서버를 함께 띄우지 않아 게임의 단어 선택 이후 플레이와 실제 카메라 권한·인식은 이번 브라우저 검증에 포함하지 않았다. 해당 인식 엔진 코드는 변경하지 않았다.

## 다음 행동

main에 통합한 뒤 실제 배포 환경에서 한글·영어 각각 화면 모드 1회, 흰색 판과 실물 블록 카메라 모드 1회를 스모크 테스트한다. 이후 캠페인용 썸네일이나 전용 OG 이미지가 필요하면 마케팅 영역의 별도 작업으로 만든다.

## 인계·통합

코드와 이 기록을 같은 커밋으로 통합한다. 원격 push와 배포는 이번 요청 범위에 포함하지 않는다.
