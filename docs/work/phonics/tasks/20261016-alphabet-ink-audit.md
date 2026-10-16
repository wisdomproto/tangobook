# 알파벳 52자 획별 채움 전수 검수

- id: 20261016-alphabet-ink-audit
- domain: phonics
- status: integrated
- updated: 2026-10-16
- branch: codex/phonics-word-journey
- worktree: C:/Users/kil21/.codex/worktrees/phonics-word-journey/tangobook
- delivery: 2026-10-16 사용자 main push 요청, 아래 전달 기록 참조

사용자가 f/t 운영 확인 뒤 다른 알파벳도 획을 끝냈을 때 미채움이 남는지52자 전수 검수를 요청했다. 기존 판정8,301모의와 획별 최종 채움은 다른 증거다. ①획별 끝/교차점의 미채움 ②모든 획 완료 시 실제 폰트 픽셀의 미채움 ③완료 판정→다음 획 배선을 나눠 확인한다. 임의 글자 몇 개를 전체 검수로 확대하지 않으며 native 손 입력과 모의 재생/픽셀 검사를 구분한다.

## 반증과 수정

- Windows system-ui 실제 폰트 마스크52자107획에서, 먼저 끝낸 획의 중심이 아직 회색인 글자10개를 발견했다: **A/B/G/N/Y/a/d/g/q/u**. 다음 직선의 소유 영역이 앞선 대각선·고리의 끝/교차점을 가져가던 문제다. 전부 완료한 최종 글자는 원래도 미채움0이어서, 최종 모습만 확인하면 이 결함을 놓친다.
- 영어에만 `completeJoins`를 켰다. 초기 마스크 설정 시 경로에 수직인 실제 잉크 두께를 측정해 먼저 쓴 획의 연결부를 보존한다. 교차점에서 과도하게 커진 폭은 중앙값으로 제한해 뒤 획 전체를 미리 칠하지 않으며 폰트 외부 픽셀/알파는 바꾸지 않는다. 포인터 이동마다 추가 픽셀 조회를 하지 않는다. 한글은 기본 false를 유지한다.
- DEV `alphabet-writing-check.html`에 획별 중심 미채움 수·JSON `inkGaps`·확인 필요 집계를 추가했다. 기존의 경로 통과만으로 시각 채움 성공을 추정하지 않게 했다.

## 검증

- 실제 공용 `StrokeTraceCanvas`에 synthetic pointer down/move/up을 입력하는 임시 DEV 검수판으로52자107획을 각각 **길이90%에서 떼어** 완주했다. i/j 점은 실제 점 버튼을 눌렀다. 획별 진행도107회 일치·실제 완료 콜백52회, 완료한 경로 중심 미채움0·최종 폰트 미채움0·원래 마스크와 알파 불일치0·오류0.
- 실제 캔버스107장 전체 스크린샷을 육안 검토했다. 원본과 비교한 경로 중심 전수도10자 결함→0. 교차점의 작은 앞선 잉크 연장은 획 연결부이고, 뒤 획의 먼 부분은 회색으로 유지된다.
- 영문52자 경로8,301모의 기대 불일치0·107획 중심 미채움0. 관련57파일524테스트(`vitest ... --maxWorkers=2`)·client tsc·변경 파일 ESLint·client build27.11초 통과. 기존 Browserslist/Lottie eval/번들 크기 경고만 있다.
- 회귀 테스트: A 대각선/가로 교차부가 끝까지 채워지고 먼 가로획은 남는지, d형 고리 끝이 이어지고 윗기둥은 남는지 추가했다.

## 재현·증거와 한계

- 로컬 `/alphabet-writing-check.html` → 52자 전체 검사 → 획별 미리보기/JSON `inkGaps`를 본다. 이 페이지는 DEV 전용·학습 진도 기록 없음이다.
- worktree `output/alphabet-ink-audit-20261016/`: `before-results.json`, `results.json`, `component-results.json`, `path-ink-results.json`, `all107-component.png`. 임시 `AlphabetInkAudit.tsx`/HTML은 검수 뒤 이 폴더로 이동하여 제품 소스·빌드에는 포함하지 않았다.
- **52자 전체는 모의 포인터 입력을 통한 실제 컴포넌트/캔버스 검증이며 native 손으로52자 그린 결과가 아니다.** Windows system-ui 한 환경의 폰트 결과이며 실기기/다른 OS 폰트/운영 배포 확인과 구분한다. 새 push 요청은 없어서 원격/운영에는 미반영이다.

## 로컬 통합

코드·검수 기록 `ad81725d2`를 tracked 변경 없는 `C:/project/tangobook` main에 fast-forward 통합했다. 기존 미추적 산출물을 보존했고 공유/영역 메모리를 갱신했다. 원격 push/배포는 하지 않았다.

## main 전달 — 2026-10-16

사용자가 이번 수정의 main push를 요청했다. fetch 후 origin/main 대비0/3이며 미전달3커밋은 f/t 운영 검수 기록451628b76, 이번 잉크 수정ad81725d2, 통합 기록3e98d3851뿐이다. tracked 미커밋 없음·관련 diff 확인, 앞선524회귀/타입/lint/build 결과를 유지한다. 일반 push 대상으로 확정했으며, 실제 원격 전달은 Git SHA/좌우0·0으로 확인한다. 아래/위의 미푸시 문구는 당시 기록이며 새 Railway 배포 완료는 별도 미확인이다.
