# 기본 블록으로 쌍자음·복합 모음 만들기

- id: 20261014-korean-basic-block-composition
- domain: phonics
- status: integrated
- updated: 2026-10-14
- base: c650667bb
- branch: codex/storybook-learning-ui
- worktree: C:/Users/kil21/.codex/worktrees/platform-ui-v2/tangobook
- integration: 0ae04d49a 로컬 main fast-forward 통합
- delivery: 이번 작업 미푸시·미배포

## 사용자 결정

블록게임에 쌍자음 전용 조각을 표시하지 않고 같은 기본 자음 두 개를 놓아 만든다. 복합 모음도 기본 모음 조각을 회전·조합해 만든다. 앞선 현재 단원까지 자음 누적·ㅣ/ㅏ/ㅑ 세 회전 모음 결정은 유지한다. 눌러 배우기/획순/합성 콘텐츠의 학습 대상 그림이나 음원은 블록 선택지와 다른 역할이며 제거하지 않는다.

## 확인한 현재 구현

TRAY_CHO는 쌍자음5조각을 이미 제외하고 TRAY_JUNG는 기본3조각만 표시한다. 기본 자음14단원만 별도 누적 트레이, 쌍자음/복합모음 단원은 기존 트레이로 연결된다. compose.ts의 mergeDoubles/PLUS_I/COMPOUND가 같은 기본 자음 두 개와 기본 모음2~3조각으로 완성 음절을 읽는다. BLOCKS의 쌍자음 정의는 기존 인식용이므로 삭제하지 않는다. 카메라 인식기/실물 치수/운영 책은 수정하지 않는다.

실제 회전된 기본 조각 치수와 트레이 ID를 사용해 쌍자음5·복합모음11종 전수 조합 회귀를 추가하고 실제 고급 단원 트레이·동일 블록 반복 배치·모음 합성을 검수한다.

## 검증 결과

- 기존 실행 코드가 사용자 결정과 일치해 제품 런타임은 수정하지 않았다. compose.test.ts에 실제 기본 조각/회전/치수 기반 전수16조합 회귀를 추가하고 게임 지침을 명시했다.
- 3파일59회귀 통과(기존 누적/회전/드래그 포함), client 타입 검사·변경 테스트 lint 오류0/경고0. 실행 코드·의존성·자산 변화가 없어 production build는 재실행하지 않았다.
- 실제1280×720 `kr-h3-u01/game-korean-block`: 기본13자음+3모음이고 쌍자음 버튼 없음. ㄱ2개+ㅣ를 반복 배치 가능,ㅌ+회전ㅗ+ㄱ2개+ㅣ로 토끼 정답/진행1/4 확인.
- 실제 `kr-h4-u01/game-korean-block`: 복합 모음 버튼 없음. ㅏ를ㅓ로 회전 후ㅣ를 추가해ㄹ/ㅓ/ㅣ 배치·읽기 버튼 활성 확인. ㅔ 자체 조각은 사용하지 않는다.
- 증거: `C:/Users/kil21/.codex/visualizations/2026/10/11/01a12b90-4491-7c02-b97d-b867f6ec4b02/korean-basic-{double,compound}-blocks-20261014.png`. 전체 고급 단원 완주·모바일 실기기·카메라 실시간 인식 검증은 아니다.
- 기존 미커밋 쓰기 테스트 줄바꿈과 미추적 출력/자산 보존. 이번 작업 push 요청 없음.
