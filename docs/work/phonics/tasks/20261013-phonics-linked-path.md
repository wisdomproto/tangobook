# 전체 학습 경로와 활동 전환 통일

- id: 20261013-phonics-linked-path
- domain: phonics
- status: integrated
- updated: 2026-10-13
- base: e4c7f3325 (fetch 후 origin/main과4/14 갈림, 원격의 별도 활동/캐릭터 수리는 보존하고 이번 요청에 자동 merge/push하지 않음)
- branch: codex/phonics-linked-activities
- worktree: C:/Users/kil21/.codex/worktrees/platform-ui-v2/tangobook
- delivery: 로컬 main 통합·미푸시·미배포
- integration: 733fa2c32 코드·생성 자산·활동 전환·게임 지도 검증 기록을 로컬 main에 fast-forward 통합

## 사용자 결정

활동 완료 후 다음 활동 그림/큰 다음 버튼의 공통 연결을 한영 전체 커리큘럼에 적용한다. 작업 중 사용자는 기본 화면을 전체 학습 경로로 교정했다. 완료/현재/잠금 챕터를 길 위에 보여주고 완료/현재만 눌러 진입한다. 마지막 활동 완료 후 경로로 돌아와 다음 챕터 잠금 해제를 보여준다. 현재 위치부터 보이도록 내부 스크롤하며 사용자가 앞뒤 경로를 탐색할 수 있다. 이는 이전 ‘현재 한 챕터만 기본 표시’의 명시적 후속 변경이다. 배경 절제, 모음 하나씩, 언어 내부 자유/커리큘럼 분기는 유지한다.

## 구현 원칙

공통 GuidedRun에서 완료와 이동을 분리한다. 실제 소리/칭찬 종료 뒤 다음 그림과 동일한 다음 버튼을 제공하고 다음 활동만 실제 진입한다. 챕터 마지막은 경로 복귀 버튼. 재학습은 단원 내 순서대로 반복하되 잠금 해제 재연출/미래 진도 조작은 하지 않는다. 자유모드/쓰기99%/원래 음원 및 오답 기록은 보존한다. 새 완료 화면 타이머로 성공을 만들지 않는다. 순서 마지막의 onMarked+자동 onBack 호출도 중앙에서 끊김 없이 처리한다.

## 후속 시각 요청

사용자는 기본 연결/경로를 승인한 뒤 유료 서비스 수준으로 버튼·사이 길·배경·아이콘을 imagegen 스킬로 만들고 게임처럼 고급화하도록 요청했다. 이어 Book 안에 있다는 구분을 분명히 하고 유아용 게임 사례를 재확인하라고 했다. 기본 기능을 유지하면서 실자산과 Book 헤더/권 사이 문을 적용한다.

기본 로컬 Qwen은8188과 기록된8190이 모두 연결되지 않고 기록된 템플릿도 없어 내장 image_gen으로 전환한다고 알렸다. imagegen SKILL.md/프롬프트 지침을 읽고 프로젝트용 새 atlas/길 재질/배경을 생성한다. 글자/번역 텍스트/권번호는 이미지에 굽지 않는다. transparent atlas의 alpha 보존, WebP 변환·CSS sprite crop과 기본/현재/완료/잠금의 클릭 semantics를 유지한다.

## 검증

- 최종 관련9파일64테스트 통과: 한영 안내의 실제 활동 종류별 공통 결과→다음/경로 연결, mark 뒤 자동 back 차단/배경 mounted·inert/포커스, 순수 탐색으로 완료 생성 안 함, 재학습/replay·최종 Escape 복귀, 미래 직접 진입 가드·옛 링크·모음 진도 호환, 영어 듣기/놀이/쓰기 끝 연결, 전체 길/현재 정렬/Book1→2 문맥/부모 관찰/전 과정 종료·인접 잠금/거짓 완료 query·reduced-motion, 발음/칭찬 종료 대기, 그림 짝 찾기 커리큘럼 완료·자유 결과 유지.
- client 타입, 변경 TS/TSX ESLint, 최종 Vite build 통과. 전체 ESLint 배치에는 LineMatchingPlayer의 기존 phonicsApi/handleHintStart 미사용 warning2가 남으며 새 컴포넌트 lint는 warning0이다. 기존 Browserslist/locale static+dynamic import/lottie eval/큰 chunk 빌드 warning 유지.
- imagegen4원본 모두 육안 검수. 버튼/책8종·아이콘12종은 alpha atlas, 돌길 재질·가장자리 정원 배경을 포함해4 WebP 총374664bytes. SVG geometry에 길 재질을 입히고 Sprite CSS가 단일 JSON crop 창을 읽는다. SHA256/크기/alpha/crop 경계를 재검증했다. CTA 문자는 진한 잉크색으로 조정하고 생성 버튼의 중앙 표면 영역 대비를 원본 WebP에서 샘플링했다(코랄7.61/민트7.33; 전체 사이트 인증/모든 위치 측정은 아님). 이미지에 글자/번역/권번호/진도를 굽지 않으며 새 게임엔진/상시 캔버스/자동 소리 없음. [자산·출처·생성 명세](../../../../packages/client/public/images/phonics/path-premium-v1/README.md).
- 실제5186: 현재ㅑ 게임으로 노드 클릭 진입/뒤로 경로 복귀, 한영 Book1 표시/생성 자산, 한영320 및 한글375 확인.320 문서 높이740/가로320,375 문서 높이812/가로375로 넘침 없음. 한글320 footer 아래646.7px/375 아래718.7px. 현재 복귀 버튼으로 내부 정렬, 잠긴 챕터는 실제 disabled. QA 때문에 자녀 진도를 쓰거나 지우지 않았다.
- dev-previews/phonics-activity-flow.html과 업그레이드한 phonics-chapter-unlock.html은 가상 progress props/MemoryRouter만 쓰는 개발 미리보기다. 공통 완료 그림·다음 버튼→챕터 완료→경로/닫힌 잠금 프레임·해제 안내/이후 이어하기 복귀를 시각 검수했다. 실제64테스트의 완료 이벤트 검증과 가상 시각 검수는 구분한다. 최초 단독 로드에서 완료 그림 공용 CSS 누락을 발견하여 PhonicsActivityFinish가 learning-layouts.css를 직접 import하도록 고쳤다.
- 기본 viewport와 실제 한글 경로로 복원하고 가상/타사 참고 탭을 닫는다. 최종 실제 화면 증빙: C:/Users/kil21/.codex/visualizations/2026/10/11/01a12b90-4491-7c02-b97d-b867f6ec4b02/tangobook-premium-learning-path-applied.png.
- 한영 콘텐츠 모든 문제의 실앱 완주/소리 청취·저사양 실기기 FPS·숙달/자동 보충 판정은 이번 증거가 아니다. 필수 활동 연결 계약과 대표 실제 UI/범용 게임 예외를 확인했다. 외부 데이터/R2/음원/쓰기99% 기준 수정 없음.

## 유아 게임 공식 참고와 Book 표현

[Duolingo ABC 공식2022 scope/sequence](https://lit-lessons-cdn.duolingo.com/resources/duolingo_abc_scope_and_sequence_english.pdf)는 Level을 건물, 안의 학습을 길 위 steps, unit 경계를 doorway로 설명한다. 공식 웹사이트를 브라우저로 열어 큰 선택 대상/짧은 과제 예시를 육안으로 확인했다. 공개 소개/문서를 본 것이며 최신 앱 전체를 플레이한 검수는 아니다. [Endless Learning Academy](https://www.originatorkids.com/endless-learning-academy/)의2–6세 퍼즐·애니메이션 개념, [Reading Eggs Junior](https://readingeggsjunior.com/about/activities/)의 세 놀이 영역/반복 가능한 여러 부분 활동도 공식 본문으로 확인했다. 공식 제한 이미지 검색은 결과가 없고 일부 App Store/web 열기는 실패했다. 타사 이미지를 내려받아 탱고북에 쓰지 않는다.

탱고북은 Book=큰 과정/정원, chapter=그 안의 글자·복습 단계다. 헤더에 현재 Book 번호/이름과 생성된 책 그림을 두고 전체 길의 각 권 경계에 Book 표지를 놓는다. 길은 이어지며 현재/완료만 학습할 수 있다. 현재 근처 초반 정렬에서 Book 표지가 어중간하게 잘리는 경우는 작은 offset을0으로 맞춘다. 탐색 중에도 현재 Book 문맥은 헤더에 유지된다. 자유모드·홈의 역할은 바꾸지 않는다.

## 후속 반증: 게임 화면과 지도 이동

사용자가 실제 적용 화면을 다시 보고 디자인이 여전히 별로이며 스크롤도 게임처럼 바꿔야 한다고 반증했다. 생성 재질만으로 해결된 것이 아니고 웹 메뉴·둥근 내부 스크롤 박스·native scrollbar·Book 이중 헤더가 문제임을 실제 화면에서 확인했다. 전체 화면 지도/작은 HUD/Book 이동 레일/현재 복귀·이동 화살표/터치 관성·마우스 grab을 적용하고 재검증한다. Fast Phonics 공식 공개 overview의 실제 월드·디딤돌 이미지도 브라우저로 육안 확인했다(앱 직접 플레이는 아님).

## 게임 화면 재검증

- 웹 shell 메뉴와 둥근 내부 viewport/native scrollbar를 제거하고 fixed 전체 화면 지도에 생성 배경·길·단계 버튼을 배치했다. Book HUD는 하나로 줄이고 카메라가 바라보는 권을 표시한다. Book 레일/위아래 화살표/현재 복귀 나침반은 지도 탐색만 하며 완료를 만들지 않는다. 다음 챕터 실제 unlock/완료·현재 링크/미래 disabled는 유지한다.
- usePathCamera는 native touch inertia/휠·키보드를 보존하고8px 뒤 마우스 grab으로 전환한다. pointer capture·드래그 직후 마우스 클릭 차단/다음 정상 tap·키보드 활성화·reduced-motion 이동을 검증했다. RAF는 scroll 이벤트가 있을 때만1회 예약하고 항상 cleanup한다.
- imagegen으로 읽기 정원 풍경6종 atlas를 추가했다. 자연 비율/alpha 보존,5 WebP 총500422bytes·26 crop의 hash/크기/alpha/bounds 검증. 나무·꽃/다리·집·책 쉼터·덤불을 작은 정적 장식으로 사용한다.
- 실제 임시 탭320×740/375×812 한글 및375 영어를 육안 확인.320 document size320×740, scrollbar-width none, 가로/세로 넘침 없음. native mouse drag로 map scrollTop290 이동하면서 URL/진도는 그대로 유지. Book5 탐색·현재 복귀·마지막 단계 확인, 상단 Book HUD도 탐색 권을 따름. 개발 미리보기에서는 실제 진도 저장 없이 closed→open 프레임/해제 안내를 확인했다. 실제 오디오 완주/실기기 FPS 증거와는 구분한다.
- 최종 관련10파일68 unique 회귀 통과(기존52 계약+지도·카메라16 재실행). Book 점프 높이 테스트에서 다른 권 HUD가 남는 문제를 찾아 viewport 비례 offset으로 수정했다. 타입/변경 source ESLint/build 통과. 기존 lottie/locale import/Browserslist/큰 chunk 빌드 warning만 남는다.
- 공개 Fast Phonics overview의 실제 월드·디딤돌 화면을 CUA로 확인했다. game-frame 안의 play/down arrow와 밝은 현재/흐린 미래 단계가 참고다. 타사 앱 완주/현재 drag 구현을 검증했다고 주장하지 않는다.
- 최신 실제 한글 증빙: C:/Users/kil21/.codex/visualizations/2026/10/11/01a12b90-4491-7c02-b97d-b867f6ec4b02/tangobook-game-map-applied.png. 이전 premium-learning-path 증빙은 사용자가 거절한 중간 화면이다.
