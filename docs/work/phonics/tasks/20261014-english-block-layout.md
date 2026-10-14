# 영어 블록 한글과 배치 통일

- id: 20261014-english-block-layout
- domain: phonics
- status: integrated
- updated: 2026-10-14
- base: 432efae44
- branch: codex/storybook-learning-ui
- worktree: C:/Users/kil21/.codex/worktrees/platform-ui-v2/tangobook
- integration: 8ada415ca 최초·6d36ce3ac 영어 전용 조합/PC 크기 후속 로컬 main fast-forward 통합
- delivery: 2026-10-14 사용자 요청으로 origin/main 9e8bab5dd push 확인·운영 배포 완료 미확인

## 사용자 결정

영어 블록도 태블릿/휴대폰에서 확인하고 한글과 통일한다. 최종 한글 기준은 태블릿/PC 상단 그림·검정 타겟/아래 판, 짧은 가로 왼쪽 목표·오른쪽 판, 행동은 판 아래, screen/camera는 게임 전 선택이다. 영어 알파벳 순서·단원 panelLetters·자동 정답/발음/진도·실물 인식은 유지한다.

## 현황과 구현

기존 영어는 그림/단어/슬롯/다음이 하나의 질문 패널에 모였으며 휴대폰에서 알파벳 두 줄+가로 스크롤바와 헤더 실물 토글이 섞였다. 공용 BlockInputGate로 기존 한글 게이트를 일반화하고 영어에도 연결, 명시 initialInputMode는 재선택하지 않는다. 영어도 상단 목표/판/트레이/하단 편집·확인/다음으로 분리. 확인은 놓인 글자를 읽으며 정답은 기존 자동 판정을 유지한다.

알파벳은 한 줄 민트 그림 프레임+큰 좌우 화살표/끝 비활성/native pan-x로 표시한다. 글자 순서는 그대로이며 영어에 한글 모음 고정/조각 회전을 적용하지 않는다. 마우스는6px drag, 터치는 세로6px 활성/가로8px 이동시 drag 취소하여 좌우는 native scroll·위로는 배치로 구분한다. 되돌리기는 실제 placement/삭제/초기화 이력을 복원하고 다음/재시작에서 이력을 비운다. 실제 센서/인식기/보드 형판 변경 없음.

## 검증

- 6파일31회귀 통과: 공용 한영 진입 선택10·알파벳 트레이2·영어 조작/자동 정답/제한 선택지/가로 touch 취소4·기존 한글 판9·영어 tutorial 배치4·어댑터2. client typecheck/production build·영어/공용 신규 TSX lint 오류0/경고0, 함께 수정한 한글 import 파일에는 기존 미사용2경고. 기존 Browserslist/Lottie eval/i18n import/큰 chunk 빌드 경고 유지. jsdom에 ResizeObserver가 없어 최초 테스트 실패했고 resize event fallback을 추가해 해결, 기대값은 유지.
- 실제 Book2 en-b2-u01:1024×768 상단 목표/판/한 줄 트레이/하단 행동, 목표 높이226.48px·판432.97px·행동 bottom743.28px. native mouse drag로 b를3칸에 배치·undo 제거, pan/cat 탭 정답1/4·자동 다음 문제 man 이동 확인. 알파벳 좌우 이동은 글자를 배치하지 않는다.
- 812×375·568×320: 타겟 좌측/판 우측·행동44px 높이/화면 밖 잘림 없음, 작은 화면 본문 scrollWidth568/행동 bottom306. 트레이 안쪽210.41px에서 큰44px 화살표/단일 행 유지. DOM computed touchAction=pan-x 확인. 합성 touch 횡이동 취소는 실제 기기 관성/손가락 native pan 검증으로 보고하지 않는다.
- Book5 en-b5-u01 seed4칸/동화책 신데렐라 영어 wand4칸 진입/태블릿 배치 확인. 기존 언어/메뉴/portal 연결 보존. 공용 게이트 전환 후 한글 kr-h3-u01도 한국어 제목·모음3개·기존 휴대폰 배치 확인. 실물 화면의 두 칸 비율은 기존1:1 유지하며 타겟 글자 크기를 칸에 맞춘다. 실제 카메라/튜토리얼 영상/모든 판 완주 검수 아님.
- 증거: `C:/Users/kil21/.codex/visualizations/2026/10/11/01a12b90-4491-7c02-b97d-b867f6ec4b02/english-block-unified-{tablet,812,568,book5,storybook}-20261014.png`. 임시 viewport·2검수 탭 정리. 새 자산/의존성/서버·인식 수정 없음·이번 push 요청 없음. 대표 태블릿1024×768/폰568×320은 실제 기기 캡처가 아닌 browser viewport 검수다.

## PC 빈 판·블록/타겟 크기 후속

사용자 반증: PC 가운데 입력 영역이 너무 비어 보인다. 후속 결정으로 하단 알파벳과 상단 타겟 단어도 키운다.1920×1080 실측 기존 판1804×404.21px 안 슬롯 전체318×124px로 비율이 작았다. 폭1200px 이상·높이601px 이상·hover/fine pointer PC 화면에서만 판의 전체 폭 외곽선을 제외하고 슬롯에 맞는 크림 받침 프레임, 큰 입력칸88~136px/높이104~156px를 표시한다. 하단 알파벳은72×84px·상단 타겟 최대176px/삽화25vh(상한280px). 태블릿/폰의 기존 크기와 순서, 카메라 화면/채점/드래그 좌표계는 유지한다. 후속 사용자 결정: 영어는 한 줄 글자 몇 개만 놓으므로 큰 한글 판 레이아웃을 그대로 쓸 필요가 없다. 높이700px 이상 가로 화면은 큰 빈 두 패널을 제외하고 그림/타겟·그 바로 아래 슬롯 크기 받침·가까운 알파벳/하단 도구를 가운데 모은다. 높이/폭 제약이 큰 폰과 카메라 레이아웃은 보존한다. 실제1920×1080: 타겟176px·삽화270px·알파벳72×84px, 슬롯 받침500.52×199.72px/입력칸134.40×151.20px로 목표 바로 아래 표시. native mouse drag로 b를1칸 배치·undo 제거 확인.1366×768/1024×768 전체 구성 잘림 없음,568×320 기존 좌측 타겟·행동 bottom306 유지. CSS Prettier/diff 검사 통과. CSS만 바뀌어 직전31회귀·타입/build는 반복하지 않았다. 증거는 기존 검수 폴더 english-block-compact-{pc-1920,pc-1366,tablet}-20261014.png. 임시 viewport/탭 정리·이번 push 요청 없음.
## main 전달

2026-10-14 사용자 ‘메인에 푸시’ 요청. fetch 후 origin/main...HEAD는0/4이며 대기4개는 영어 입력 게이트/트레이/태블릿·폰 통일 및 영어 전용 작은 조합/PC 확대·검수 기록으로 확인했다. 일반 push432efae44→9e8bab5dd 성공, 원격 ls-remote와 로컬 SHA 일치·0/0 확인. 이 전달 기록도 후속 push한다. 기존 쓰기 테스트 줄바꿈/미추적 출력·자산은 stage하지 않았다. 코드 재변경/테스트 반복 없으며 운영 배포 성공은 별도 확인하지 않았다.