# 플레이탱고 인식판 전용 3D HTML

- id: 20261006-hardware-board-only
- domain: hardware
- status: integrated
- updated: 2026-10-06
- base: 782fd8b79
- branch: main
- worktree: C:/project/tangobook
- integration: main 로컬 커밋
- delivery: 미푸시·미배포

## 요청과 완료 조건

예전 플레이탱고 3D 모델을 찾고 인식판만 보여주는 HTML 제작.

## 읽은 기억과 변경 범위

공통 인수인계·hardware BRIEF/MEMORY·루트 CLAUDE의 보드 절·디자인 시스템·2026-08-26 보드 설계 문서를 확인했다. 기존 NX 추출 mesh의 board/frame을 그대로 사용했다.

## 결정과 진행

원본 인식판에는 오른쪽 조작부 형상도 포함되어 있다. board/frame만 인라인으로 담은 tango-board-only.standalone.html을 추가했다. 한글 블록·카메라·학습 기능 없이 원형을 보여준다. 외부 의존성 없는 WebGL2 뷰어이며 회전·휠/핀치 확대·기본/위/아래 보기 제공. file:// 직접 실행 가능.

## 검증

Node로 스크립트 구문 검사 및 내장 데이터 키 board/frame 확인. Chrome headless file:// 1200×850 실제 렌더 스크린샷 육안 확인: 격자·외곽·오른쪽 조작부가 보이고 블록은 없다. 화면 증거는 Codex visualizations의 tango-board-only.png. 터치 실기기 조작은 미검증.

## 다음 행동

파일을 직접 열어 사용. 원본 NX CAD는 C:/project 검색에서 찾지 못했다.

## 인계·통합

HTML과 기록을 main에 로컬 커밋. 원격 push·배포 요청 없음.

## 2026-10-06 후속: 16×16 격자와 베젤

사용자 요청으로 기존 외곽/조작부를 제거하고 안쪽 격자만 16×16칸으로 변경했다. 원본 NX 메시의 내부 15mm 한 칸을 삼각형 클리핑 후 반복하여 돌기/홈 형상을 유지했다. 후속 요청에 따라 사방에 15mm 폭 평면 베젤을 추가했다. 안쪽 240×240mm, 전체 270×270mm. 기존 HTML 동일 경로에 반영.

Node 스크립트 구문 검사와 Chrome headless file:// 1200×850 렌더 육안 확인 완료(tango-grid16-bezel.png). 이 결과는 3D 보기용 메시이며 출력용 CAD/워터타이트 검증은 하지 않았다. 터치 실기기 검증·원격 push·배포 없음.

## 2026-10-06 후속: 네 모서리 라운드

사용자 요청으로 외곽 네 귀퉁이를 R15mm로 변경. 기존 베젤 메시를 둥근 외곽으로 클리핑하고 곡면 옆면을 추가했다. 16×16 격자/15mm 베젤/270mm 전체 크기 유지. Node 구문 검사 및 Chrome file:// 렌더 육안 확인(tango-grid16-rounded.png), 로컬 커밋. 출력용 CAD 검증·push 없음.
