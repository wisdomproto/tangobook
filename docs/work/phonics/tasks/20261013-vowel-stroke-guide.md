# 모음 따라쓰기 획순 안내

- id: 20261013-vowel-stroke-guide
- domain: phonics
- status: integrated
- updated: 2026-10-13
- base: f4a6a668d
- branch: codex/phonics-vowel-stroke-guide
- worktree: C:/Users/kil21/.codex/worktrees/platform-ui-v2/tangobook
- integration: f614ef8d9 로컬 main fast-forward 통합 확인
- delivery: 미푸시·미배포

## 요청과 완료 조건

사용자 획순/Rive 질문 뒤 제안한 3회 연습을 승인(ㄱㄱ). 한글 입문 모음 10종에서 첫 회 짧은 시범+시작점/방향, 둘째 회 작은 안내, 셋째 회 옅은 글자로 구성한다. 시범 다시 보기, 실제 폰트와 경로 정렬, 음원 종료/3회 완료/다음 경로 자동 연결을 보존한다. 획순 엄격 채점·음절 전체 확장·main push는 이번 요청에 포함하지 않는다.

## 읽은 기억과 변경 범위

공통 인수인계/작업 지도, phonics BRIEF/MEMORY/linked-path, 루트 및 phonics/phonics-learner CLAUDE, 디자인 시스템/PLATFORM 확인. 기존 자모 라이브러리 GET의 모음10종 순서 확인. LetterFillCanvas는 700 글꼴 마스크/99% 채움 평가이며 획순은 현재 없다.

## 결정과 진행

- 단순한 모음 직선은 SVG 시범/Canvas 입력으로 구현한다. 추가 엔진·상시 재생·런타임 stroke-library 요청 없이 렌더된 글자 마스크에 안내를 맞춘다. 기존 R2 편집 데이터 변경 없음.
- 획 안내는 다음 미완료 획을 도와주는 용도이며 순서/방향을 강제로 채점하지 않는다. 전체99% 통과는 기존 단일 기준 유지.
- 기존 ReviewWriteActivity.test.tsx의 unrelated CRLF 표시를 보존한다.

## 검증

- 클라이언트 7파일75테스트 통과: 글꼴 위치가 다른 모음10종 순서/방향·교차 획 구분, 시범/재생이 점수를 만들지 않음, 직접 입력 즉시 시범 중단,98% 미통과/100% 통과·99% 기준 유지, font load 이탈/실패, reduced-motion, 발음 중 회차/그린 글자 보존과3회 완료, 기존 GuidedRun/한영 페이지/모드 회귀.
- client typecheck·변경7 TS/TSX ESLint·client production build·git diff --check 통과. 기존 Browserslist/i18n 혼합 import/lottie eval/큰 chunk 경고는 유지.
- 실제5186의 별도 localhost origin에서 native drag로ㅏ 세로→가로를3회 쓰고1→2→3회차/마지막 경로 복귀 확인. 첫 획 뒤 힌트2로 이동(88%)/둘째 획 뒤100%, 둘째 회 작은 안내/셋째 회 안내 없음. 기존 localhost 완료 기록 때문에 마지막은replay=1이며 새 잠금 해제 실시간 검증으로 주장하지 않는다. 기존127.0.0.1 사용자 진도는 변경하지 않았다.
- 자유 경로에서10모음 actual 글꼴과 시작점/방향 표시 확인,3획 시범의 전체 path 순서도 DOM으로 확인. 568×320 및812×375에서 쓰기판/44px 다시 보기 버튼 잘림 없음. 휴대폰 실기기 청취/FPS 측정은 미수행.
- 캡처: C:/Users/kil21/.codex/visualizations/2026/10/11/01a12b90-4491-7c02-b97d-b867f6ec4b02/tangobook-vowel-stroke-guide.png. 검증 탭 종료/viewport 복원.

## 다음 행동

자음·합성 음절/영어 획순 확장은 별도 요청 시 정확한 획 데이터를 기준으로 진행. 사용자 main push 승인 미요청.

## 인계·통합

f614ef8d9 코드/기록18파일을 로컬 main에 fast-forward 통합했다. main의 tracked 변경 없음과 구현 커밋 포함 확인. 기존 untracked output/tmp와 worktree의 ReviewWriteActivity.test.tsx 표시를 보존했다. 원격 push/배포 없음.
