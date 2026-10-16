# 홈 바로 놀기

2026-10-17 후속: 홈 제목 옆 한영 선택은 `playLang` URL, 게임은 `lang` URL·round cache key로 분리한다. 영어 블록/쓰기는 기존 English player, 자체 Cambridge Starters 시드 목록의2~4알파벳·최대3낱말이며 색칠은 실제 책 nameEn/ttsUrls.en으로 연결한다. 영어 번역 없으면 한글로 대체하지 않는다. 숨은그림은 기존 en builder/번역된2~3대상이다. GameHomeContext를 이 route에서만 제공해 공통 헤더 홈 버튼도 선택 언어를 유지한다. [확장 검수](../../../../../docs/work/platform/tasks/20261017-home-free-play-languages.md).

`LearningHomePage`는 lightweight `HomePlaySection`/free-play-options만 import한다. 게임/data-builder는 `/library/play/:kind`에서 lazy loading하며 홈으로 게임 엔진·카탈로그를 끌어오지 않는다.

- 홈의 한글 블록/낱말 쓰기/색칠/숨은그림4개. 사용자는 쉬운 무작위 문제로 즉시 시작하기를 선택했다. 중간 모드·책·난이도 선택은 넣지 않는다. 한글/영어 모드 입구에 같은4버튼을 반복하지 않는다.
- `useFreePlayRound` → 기존 storybook API 및 공개 activity catalog → 순수 makeFreePlayRound → 기존 player. 첫2종은 기존 랜덤 블록의 세계 명작 정책·한글1~2음절/받침·쌍자음·복잡한 모음 제외·최대3낱말, 나머지 그림 활동은 준비된 공개 책 전체다. 숨은그림은2~3개 대상으로 줄이되 같은 물건의 여러 정답 영역을 보존한다.
- 한 판은 실제 책 한 권으로 TTS/삽화/장면/게임 로그의 출처를 보존한다. catalog뿐 아니라 실제 책의 공개·종류·어휘 숨김을 확인한다. 표시할 데이터가 없거나 실패하면 재시도/홈을 제공하며 가짜 내용이나 더 어려운 낱말로 대신하지 않는다.
- 새 홈 입장은 새 무작위 판, 판 안 다시 하기는 같은 문제 복습이다. 블록 기본 화면 입력·목표 낱말의 자음만/기본 모음3조각. 카메라는 명시 실물 전환 때만 켠다.
- source는 storybook이며 커리큘럼 완료/이어하기/숙달 상태를 만들지 않는다. 기존 게임 로그와 독립 해결 평가 메타데이터를 혼동하지 않는다. 쓰기/색칠/블록의 기존 연습·채점·소리·장면·결과는 유지한다.

[작업·검수](../../../../../docs/work/platform/tasks/20261016-home-free-play.md).
