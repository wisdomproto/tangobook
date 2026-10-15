# 알파벳 가이드 정리·90% 끝맺음·D/d/e 완주 검수

- id: 20261016-alphabet-guide-ending
- domain: phonics
- status: integrated
- updated: 2026-10-16
- branch: codex/phonics-word-journey
- worktree: C:/Users/kil21/.codex/worktrees/phonics-word-journey/tangobook
- delivery: 사용자 요청으로766a1ee9b·전달 기록ce715fc29 원격 main 일반 push. Railway8b84cbd8의ce715fc29 successful/Active와 운영 e 가이드·직선90% 입력 확인(아래 운영 검수).

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

## main 전달 — 2026-10-16

사용자가 이번 가이드/90% 마무리 수정의 main push를 요청했다. fetch 후 origin/main 대비0/2·tracked 미커밋 없음·관련 diff와 검수 기록을 확인했다. 일반 push c37940e76→766a1ee9b 성공, ls-remote SHA 일치·0/0 확인. 미추적 자료와 다른 worktree는 보존했다. 위 미푸시는 구현 당시 상태이며 새 운영 배포 성공과 운영 실제 입력 확인은 별도다.

## 운영 배포·e 가이드·90% 검수 — 2026-10-16

- Railway 최신 배포 `8b84cbd8-abf3-4423-b10a-286a647fca85` Details에서 GitHub 커밋 `ce715fc298f28da968101a2e3c6bf553bd6ba7f3`·Deployment successful·Active를 직접 확인했다. 첫 확인 때는 빌드 중이었으며, 완료 후 운영 화면을 새로 열었다. 새 entry는 `index-DqjnfmM4.js`, 획 컴포넌트 번들은 `WordListenChooseActivity-Ctae5z6o.js`다.
- 실제 운영 `/library/phonics/english/en-b1-r1/review-write`의 첫 무작위 카드가 e여서 숨은 상태/입력 이벤트 조작 없이 e에 접근했다. 가로 오른쪽→위 반시계→아래 오른쪽의3방향 화살표와1번 시작점, ‘e 쓰는 순서’ 실제 클릭 후 ‘쓰는 순서를 봐요’ 시연을 확인했다. 복습 첫 글자는 무작위이므로 이 URL이 항상 e로 시작한다고 안내하지 않는다.
- 실제 운영 `en-b1-u02/letters-write`에서 D 세로196px의50% native drag 후 진행0/2·다시 시작 안내, 같은 획90%에서 손을 떼니 진행1/2·2번째 획 안내로 바뀌었다. 폰트 외곽 안에서 세로획 끝까지 깔끔하게 채워진 화면도 확인했다. D 전체 완주나 e 곡선 native 완주로 확대하지 않는다.
- 운영 공개 번들의 실제 순수 판정 함수와 pointer-up `completionRatio:.9` 연결을 추출해 운영 DOM e SVG(길이500.73px)로33개 모의 검사했다. 정확90/95/100%·몸통8/12/16px 흔들림+90% 끝점은 통과하고,50/75/85%·역방향·지름길·제자리 탭은 거절, 기대 불일치0. 브라우저 이벤트·진도·DB를 조작하지 않았다.
- 초기 추가 진단에서90% 기준점 자체에도 흔들림을 더한 입력 일부는 실제 투영 진행86~89%여서 거절됐다. 이는90%에서 떼기와 다른 입력임을 원본 `offset-endpoint-diagnostic.json`에 보존했다.90% 끝점을 고정하고 마지막10샘플 흔들림을 줄인 명시적 조건으로 분리했으며 제품 판정/기존 테스트 기대값은 바꾸지 않았다.
- 두 운영 탭 console error0, `/health` ok. e 곡선 전체를 손으로 그리는 native 도구는 현재 API에 없어 해당 검증은 미완료다. 운영 UI 관찰·직선 native 입력·배포 순수 함수 모의 검사를 구분해 사용자에게 보고한다.
- 증거: `C:/project/tangobook/output/production-e-guide-20261016/`의 e-guide.png, D-native-90.png, deployment-active.png, production-guides.json, deployed-results.json, verify-deployed.mjs. 코드 수정/새 push/배포 조작 없음. 검수 기록만 로컬 커밋한다.
