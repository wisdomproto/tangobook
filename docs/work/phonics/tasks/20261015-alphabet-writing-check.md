# 알파벳 쓰기 전용 검수 페이지

- id: 20261015-alphabet-writing-check
- domain: phonics
- status: complete
- updated: 2026-10-15
- base: cbef06ba7
- branch: codex/phonics-word-journey
- worktree: C:/Users/kil21/.codex/worktrees/phonics-word-journey/tangobook
- delivery: 로컬 검수 페이지 구현·검증, 새 push/배포 없음

## 요청·구성

사용자가 운영 i/j/n 확인 도중 알파벳 모의 검사용 페이지를 요청했다. 자유모드에서도 챕터의 쓰기 활동에 직접 들어갈 수 있다는 사용자 지적을 수용한다. 별도 검수판은 앞 글자를 완주하지 않고 A~Z/a~z 한 글자와 종이 크기를 골라 반복 검사하는 용도다.

`http://127.0.0.1:5187/alphabet-writing-check.html`에서 실행한다. client 루트 HTML이 DEV에서만 src/dev/AlphabetWritingCheck.tsx를 읽는다. 실제 앱 라우터·진도 저장·서버 API·커리큘럼은 변경하지 않았다. 운영 배포 확인용 페이지로 오해하지 않게 LOCAL QA와 실제 손 입력/모의 입력을 구분했다. 일반 Vite build 산출물에 이 HTML과 검수 모듈은 포함되지 않는다.

- 왼쪽: 실제 StrokeTraceCanvas, 획 가이드/시연/점 버튼, 108/192/300/384px 종이, 다시 쓰기, 수동 완료 상태.
- 오른쪽: 같은 실제 system-ui 폰트 마스크·getLetterGuideStrokes·stroke-tracing 순수 함수로 획별 입력 재생. 글자 배경도 같은 Canvas 마스크의 PNG를 써 SVG baseline 차이로 가이드가 어긋나지 않게 했다.
- 정확,12px 흔들림,3포인트 간격 흔들림,역방향,반쪽,직선 지름길,점45px 외부. 직선/작은 굴곡의 지름길은 참고 결과이며 무조건 실패 기대를 붙이지 않는다.
- 현재/52자 전체 검사, 정상·확인 필요 표식과 획별 기대/실제/남은 길이, JSON 저장. 검사 사이에 animation frame으로 양보한다. 글자/획/입력 변경 시 이전 재생을 취소한다. HMR 시 기존 React root 해제.

## 검증·반증

타입·변경 TS lint 통과. client build26.90초 성공(기존 큰 청크 경고 유지), dist에 검수 HTML 없음 확인. 브라우저에서52자 검사·i 실제 native 몸통 드래그→44px 점 버튼→클릭 완료 확인(가장자리 클릭도 통과). j 몸통/점의 정확·흔들림/외부 점 거절 및 n 두 번째 곡선의 정확/흔들림/희소 입력 통과·역방향/반쪽/큰 직선 지름길 거절을 모의 검사에서 확인했다. n 희소 입력 재생 완료는 남은 경로0/경로 밖0.

새 촘촘한 흔들림의 위상을 .25로 둔 검사에서 d·q 첫 곡선이 끝부분을 놓쳐 미통과한다(d 남은 길이 반올림16px). 이전 .15 촘촘한 검사와 .25 희소 검사는 통과하므로 이전 보고를 확대하지 않는다. **새 반증은 확인 필요로 표시하고 별도 후속 대상**으로 남긴다. 이 요청에서 제품 채점 기준을 느슨하게 바꾸거나 기대값을 낮추지 않았다. 실제 아이 손 입력/전체52자 native 완주로 보고하지 않는다.

증거: output/alphabet-writing-check-20261015/{overview.png,i-complete.png,n-sparse-simulation.png,n-results.txt,production-j.png}. 산출물은 로컬 보존하며 커밋 제외.
