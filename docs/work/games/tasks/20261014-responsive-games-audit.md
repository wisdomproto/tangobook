# 전체 학습 게임 PC·태블릿·휴대폰 반응형 점검

- id: 20261014-responsive-games-audit
- domain: games
- status: planned
- updated: 2026-10-14
- base: 59d955d2d
- branch: codex/storybook-learning-ui
- worktree: C:/Users/kil21/.codex/worktrees/platform-ui-v2/tangobook
- integration: 미통합
- delivery: 미푸시·미배포

## 요청·점검 기준

한영 블록 이외 게임도 PC1920×1080, 태블릿1024×768, 휴대폰 가로568×320 기준으로 제목/문제/입력판/행동 크기와 잘림·조작을 점검한다. 브라우저 viewport 검증과 실기기 손가락/카메라/음성 검증을 구분한다.

## 현재 진행

기억·게임/파닉스 지침 및 실제 router 검토, 별도 QA 탭에서 `/library/activities` 확인. 실제 플레이 화면 행렬 검수·수정은 아직 시작 전이며 완료로 보고하지 않는다. 서버5186 실행 worktree는 위 경로, production API read proxy를 사용한다. 사용자 진도는 QA로 변경하지 않는다.

실제 활성 점검 후보: 한영 점 잇기/낱말 쓰기/그림 짝, 모음 듣고 고르기/찾기/기억, 복습 letter-hunt/review-flip/review-syllable-listen/review-match/review-word-listen/review-write, 동화책 어휘 짝/쓰기/블록/색칠/숨은그림/장면색칠. 한영 블록은 기존 검수 후 회귀 spot check. 각 유형이 실제 제공되는 메뉴·활동키를 확인 후 실행한다.

`/games/hori-*`, `/playground/word-*`는 현재 router에서 `/library`로 redirect한다. 레거시 arcade 설명을 활성 게임 근거로 사용하거나 게임을 재활성화하지 않는다. 이야기 내용/쪽 순서 게임도 현재 학습자 메뉴에서 제외되어 있다.

## 다음 행동

홈 개편과 커리큘럼 보드 논의 요청이 이어져 함께 처리 중이다. 실제 활성 화면 목록 확정 → 각 크기 스크린샷/DOM 치수 증빙 → 관찰된 문제만 수정 → 관련 게임 회귀·타입/build → 코드와 기억 로컬 커밋. 현재 새 push 승인 없음.
