# 알파벳 가이드 정리·90% 끝맺음·D/d/e 완주 검수

- id: 20261016-alphabet-guide-ending
- domain: phonics
- status: integrated
- updated: 2026-10-16
- branch: codex/phonics-word-journey
- worktree: C:/Users/kil21/.codex/worktrees/phonics-word-journey/tangobook
- delivery: 9a2d94833 로컬 main 통합, 새 push/배포 요청 없음

사용자가 D/d 실제 완주 검수·가이드 직선 정리·약90%에서 떼어도 획 완성, 이어서 소문자 e 순서가 잘 안 보인다고 요청했다. 직선 native 입력만 가능한 현재 CUA/Windows API에서 곡선을 연속으로 직접 그리는 도구는 없음(API 정의 확인). 다른 입력 도구나 숨은 상태 조작으로 우회하지 않고 실제 공용 컴포넌트에 DEV UI의 곡선 pointer event 재생으로 완료/그림/음성을 확인하되 native 손 입력과 구분해 보고한다.

원인: fit의 직선 lock도±3px 투영을 허용해 2px 단위 계단이 남는다. e는 한 획으로 가로→윗곡선→아랫곡선이며 기존 방향 화살표는 전체 sample의55~65% 한 군데뿐이라 첫 가로 진행을 안내하지 않는다. 판정의 끝점32px 제한은 긴 곡선의90% 끝맺음을 막을 수 있다.

## 구현

- 영문 폰트 투영 뒤 실제 template의 직선 구간을 정확한 선분으로 재정렬한다. 수직/수평 축을 고정하며 대각선·L/Z 연결부도 최종 공통 끝점에 맞춘다. 곡선 픽셀 떨림은 끝점/꺾임을 보존한 작은 필터2회로 정리한다. 한글 경로는 변경하지 않는다.
- 경로 길이에 따른 방향 화살표: e처럼 긴 한 획은 가로 시작→위 반시계→아래 마무리3곳에 놓는다. 조각 개수로 고르던 기존55~65% 단일 표식을 대체하며 e를 임의의 여러 획으로 쪼개지 않는다.
- 공용 StrokeTraceCanvas의 pointer-up에서만 completionRatio0.9 적용(한글 낱자 포함, i/j 점 제외). 실제 경로상90%와 샘플 반올림2.5px를 검사하고 마지막 꼬리만 채운다. 이동량·방향·경로 이탈·끝부분 거리 제한은 유지한다. 기본 tracePassed 호출은 이전 동작을 유지한다.
- 직선 정리로 표본 수가 줄며 짧은 t 가로획(41px)의16px 양끝 흔들림 입력이 과도한 이동량 제한에 걸리는 것을 전수 검사에서 발견했다. 영어 짧은 직선에만 실제 전진/끝영역 조건을 유지한 최소 이동량을 적용, 반쪽/역방향/제자리 입력 거절 회귀도 추가했다.
- DEV 알파벳 검수판에 ‘90%에서 손 떼기’ 시나리오를 추가했다. 학습 진도/DB/운영 콘텐츠 변경 없음.

## 검증과 한계

- 실제 Windows system-ui52자/107획: 기본741(105몸통90% 시나리오 포함)+확장 흔들림7,560, 기대 불일치0. 마지막 Z 재정렬 뒤도 동일8,301검사 기대 불일치0 재확인했다.
- 57파일520회귀 통과. 이어서 Z의 모든 직선 구간 기하를 강화한 검사에서 작은 연결부 굴곡 재현→수정, 관련4파일55회귀 재통과. 기대값을 낮추지 않았다.
- 실제 DEV fixture는 운영 en-b1-u02 자료를 사용해 공용 AlphabetLetterWriteActivity를 D/E만으로 실행하고 진도 callback을 비웠다. 테스트용 pointer capture만 stub하고 pointer down/move/up을 재생했으며 합격 상태/진도/오디오 callback을 조작하지 않았다. D는 첫 세로획90%까지 native drag·두 번째 곡선90% 재생, d/e는 각 획90% 재생으로 완료→완성글자→desk/dog/elbow 그림/실제 오디오 종료→다음 글자까지 확인. E의4직선은 각각 native drag로 완주, egg 보상/칭찬 종료 후 전체 완료 callback도 확인했다. console error0.
- 위 곡선 재생은 synthetic pointer event 테스트다. 사용자가 요구한 native 곡선 손 입력은 도구가 지원하지 않아 여전히 미확인임을 사용자에게 미리 설명했다. 모의 검사를 직접 그려 본 결과로 보고하지 않는다.
- 증거는 worktree output/alphabet-guide-ending-20261016/{D-complete.png,d-complete.png,e-guide.png,e-complete.png,E-native-complete.png,flow-end.png,all52-results.json}. 임시 fixture HTML/TSX는 같은 output으로 옮겨 제품/커밋에서 제외했다.

최종 변경 TS eslint·client typecheck·build23.95초 성공. 기존 Browserslist/청크/i18n/lottie eval 경고는 이번 변경 범위 밖이다. 로컬 검수 서버5187 유지, 새 main push/운영 배포 없음.
