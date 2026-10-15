# 한영 지도·활동 공통 학습 공간

- id: 20261015-persistent-learning-workspace
- domain: phonics
- status: integrated
- updated: 2026-10-15
- base: 6dd519a60 및 최신 origin/main 통합
- branch: codex/phonics-word-journey
- worktree: C:/Users/kil21/.codex/worktrees/phonics-word-journey/tangobook
- integration: 작업 커밋을 로컬 main fast-forward로 통합
- delivery: 이번 push/배포 미요청

## 요청과 완료 조건

한영 모두 지도와 같은 공통 학습 틀 유지, 왼쪽 현재 챕터 활동 내비게이션 접고 펴기, 활동 시작 기본 접힘, 오른쪽에서 학습/게임 실행. 학습 중 목록을 펼쳐도 판/글자 크기·중앙이 바뀌지 않는 overlay. 최초 순차/완료 복습·자유 선택의 기존 권한은 보존. 실제 챕터 완료 후 지도 복귀와 다음 챕터 잠금 해제. 화면 직접 검수.

## 읽은 기억과 범위

공유 인계·MEMORY/작업 지도·phonics BRIEF/MEMORY, PLATFORM/디자인 시스템/기능 CLAUDE, 기존 커리큘럼 보드·순차/완료 전환·자유모드 계약을 확인했다. 현재 map/study는 AppShell 안, activity는 바깥 route로 갈라지고 각 player가 fixed 전체 화면을 소유한다. 공통 route/layout에서 같은 지도 인스턴스와 실행 영역을 유지하며 재사용을 우선한다. 낱말 연결·실물 인식은 의미/규칙을 바꾸지 않는다.

## 결정과 진행

- 사용자 구조 승인. 지도에서는 목록 펼침, 학습 시작 시 접힘. 펼치는 동작은 활동 크기 변경/재마운트 없이 overlay.
- 별도 후속 자음 찾기 게임 요청도 함께 진행하며 신규 게임의 자음 풀은 현재 단원까지로 한정한다.
- origin/main 추가2커밋은 승인 영상 자산/기록이었다. 코드 겹침 없고 공유 MEMORY의 두 머리 추가만 충돌하여 양쪽 기록을 모두 보존해 merge했다. 과거 로컬8커밋도 보존·원격 push 없음.

## 검증

- PhonicsWorkspaceLayout은 language/profile/mode별 같은 지도 인스턴스에 실제 활동 Outlet을 얹는다. 활동은 경로별 기본 접힘, 지도 복귀는 펼침. 기존 자산/권한 게이트는 자식 route에 유지한다.
- 한글 쓰기/자음 찾기와 영어 글자 배우기/그림 짝 찾기의 실제 UI를 열었다. native dialog 탐색창은 ESC/바깥/닫기 지원, 같은 현재 활동 선택은 재시작하지 않는다. 기존 실물 블록·재시작 도구를 남기고 독립 동화 게임은 바꾸지 않는다.
- 한글 쓰기판 목록 전/후 bounds 동일: PC1280×720에서 x450/y198.104/380×380. 화면 좌표/상태 보존을 브라우저와 mount-count 회귀로 확인했다.
- 완료 전환은 **별도5188 origin 로컬 fixture**의 실제 마지막 완료 콜백→1.4초 안내→같은 지도→한영 다음 인접 챕터 unlock을 직접 관찰했다. 실제5187 학습 기록 초기화나 실제 챕터 완주 검증과 구분한다. 검수 HTML은 배포/커밋 제외.
- PC1280×720, 태블릿1024×768, 폰 가로568×320 브라우저 크기로 자음 찾기/목록/지도 복귀를 검사했다. 소형 조각 최소 약67×58px, 목록 내부 스크롤·지도 버튼 가로 유지. 실기기/아이 사용자 실험은 아니다.
- 파닉스48파일420검사, 게임48파일299검사 통과. 게임군 기존 jsdom 네트워크 stderr는 있었지만 실패 없음. 최종 ㅇ/지도 선택 동기화 변경 뒤 관련6파일67검사 재통과. 타입·변경 TS/TSX lint·client production build 확인. 기존 lottie eval/번들 크기/번역 청크 경고는 남는다.
- 지도 선택을 paint 전에 경로와 맞추고 활동 중 배경 하나를 미리 받아 지도 복귀의 빈 바탕을 줄인다.
- 로컬 증거: output/persistent-workspace-20261015/korean-writing-navigation.png, english-activity-navigation.png, korean-fixture-unlock.png, english-fixture-unlock.png. output 커밋 제외.

## 다음 행동

이번 변경은 로컬 통합까지. push/배포 미요청. 모든 개별 게임·실물 인식·실기기 실시간/아이 학습 효과를 검증했다는 의미가 아니다.
