# 낱자 쓰기 이어쓰기와 공통 탐색

- id: 20261017-writing-pause-navigation
- domain: phonics
- status: integrated
- base: b775c6f07
- branch: codex/phonics-word-journey
- worktree: C:/Users/kil21/.codex/worktrees/phonics-word-journey/tangobook
- delivery: 새 push 요청 없음

## 사용자 결정

- ㄱ 두 획 여부 질문: [국립국어원 답변](https://www.korean.go.kr/front/onlineQna/onlineQnaView.do?mn_id=27&pageIndex=1&qna_seq=319090)의 ㄱ1회 설명을 확인해 안내했고 사용자가 한 획 유지에 동의했다. 굽은 가로·세로를 별도 획으로 쪼개지 않는다.
- 한영 따라쓰기는 약90% 쓰고 떼어도 완료되도록 관대하게. 미달이어도 지금까지 채운 잉크를 지우지 말고 이어 쓴다.
- 한영 학습/게임에서 뒤로가기·지도 이동이 잘 드러나야 한다. 기존 그림 아이콘 재사용.
- 왼쪽 놀며 익히기 등 접힌 가지를 펼치면 새로 나온 활동이 보이도록 목록 내부 자동 스크롤.

## 구현 진행

- StrokeTraceCanvas 공용: 한영 softTurns/softEnd,90% 도달 시 남은 꼬리+손가락 옆 오차를 함께 허용. 반쪽/역방향/굽은 획 지름길/점 전진/취소 자동 완료는 금지한다.
- pointer-up 미달/취소는 현재 획의 accepted path/ink를 유지하고 초록 끝점과 이어 그리기 안내. 그 끝점 근처로 다시 누르면 누적 이동/순서를 유지해 계속 쓴다. 원래 시작점을 누르면 현재 획만 재시도 가능. 다른 위치 클릭은 기존 잉크를 지우지 않는다. 새 글자/회차/이탈 후까지 미완성 획을 영구 저장하는 기능은 아니다.
- 공통 ActivityShell/GameHeader/ColoringPlayer: 왼쪽 돌아가기 그림 버튼과 활동 목록 버튼 분리, 오른쪽 학습 지도는 compass 그림+이름. 모음/영어 글자 탭이 길어도 지도는 가로 스크롤 바깥에 고정. 작은 폭600 이하만 지도 이름 숨김, 접근성 이름/44px 유지. standalone 게임은 기존 홈과 onBack 보존.
- WorkspaceTreeBranch: 실제 사용자 펼치기 후 다음 frame에 목록 안에서만 scrollBy. 긴 가지는 제목+첫 활동, 짧은 가지는 새 내용 전체를 노출. 초기 표시/접기에는 자동 스크롤하지 않는다. reduced-motion은 즉시 이동.

## 검증 진행

- 관련7파일 고유68테스트 통과: 획추적/실제 Canvas 포인터/학습공간/가지 펼침/게임 헤더/모음 쓰기/영어 쓰기. 새 ㄱ90%+옆 오차·대각선 지름길 거절, 한영 중단/취소 잉크 보존·재개/잘못된 위치 클릭·다음 획 차단을 확인했다. 독립 연습의 기존 ‘시작점에서 다시’ 기대는 사용자 승인된 ‘초록 점에서 이어서’ 동작으로 갱신했다.
- client typecheck, 변경 TS/TSX ESLint·포맷, git diff --check 통과. client build35.87초 통과(기존 Browserslist/lottie eval/청크 경고 유지).
- IAB 실제 ㄱ: 가로 부분 native drag→손 떼기, 초록 잉크/이어서 안내 유지→그 끝에서 세로약90% native drag/떼기→나머지 깔끔한 전체 ㄱ/완료한 획1/쓰기1회 확인. 단원3회 전체를 완료시킨 것은 아니다.
- IAB 자유 ㄱ 지도: 놀며 익히기 펼치기 전 list.scrollTop0,325px 높이/551px 내용→펼친 뒤 scrollTop495.33/839px 내용, 제목/자음찾기 등5게임 노출. 실제 지도에서 뒤로가기/학습 지도 모두 같은 챕터로 복귀 확인.
- IAB 영어 D: 첫 세로획 native drag 후 들어올린 잉크/끝점 유지, 그 자리에서 이어서90% 부근에 떼면 첫 획 완료/두 번째 획 안내. D/d 전체 또는 전52자 native 완주는 아니다.
- 실제 PC1280×720 한글 ㄱ/자음찾기/낱말 만나기/블록과 영어 Dd, 가로844×390 한영 블록/색칠 전용 toolbar·활동 목록 확인. 영어 Book3 활동 중 drawer에서 놀며 익히기 펼침→scrollTop446/높이178/내용627으로 제목/두 게임 노출, 닫은 뒤 같은 cake 블록 본문 보존. viewport는 검수 뒤 reset한다. 전 챕터/실기기 전수 검수는 아니다.
- 증거: C:/project/tangobook/output/writing-navigation-20261017/. 미완료 잉크와 완료 화면을 구분해 저장.
- 로컬5193/Vite·기존 운영 API 읽기 프록시 사용. 운영 배포나 데이터 변경이 아니며 새 push 미요청.

## 로컬 통합

- a5193ccbe를 로컬 main에 fast-forward 통합, code+기록 포함·훅 ESLint/Prettier·tracked clean 확인. 추가로1024×768 ㄱ 쓰기 정렬·844×390 한영 색칠/ㄱ 쓰기·console error0 확인, viewport reset. 원격 push/배포는 하지 않았다.
