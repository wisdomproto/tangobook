# 학습 UI v2 나머지 화면 통일

- id: 20261012-platform-ui-v2-continuation
- domain: platform
- status: integrated
- updated: 2026-10-12
- base: e4bcf03ec
- branch: codex/platform-ui-v2
- worktree: C:/Users/kil21/.codex/worktrees/platform-ui-v2/tangobook
- integration: 4e7de123c를 로컬 main에 fast-forward 통합 완료
- delivery: 미푸시·미배포

## 요청과 기준

사용자: “나머지도 쭉 개편해줘 통일감있게.” [1차 구현](20261012-platform-ui-v2-implementation.md) 이후 남은 과정·활동 선택·게임판/결과·읽기 도구·공용 UI 계약을 [디자인 시스템 v2](../../../design-system.md)로 통일한다. 학습 순서·데이터·채점 마스크/99% 기준·오디오 체인·카메라 인식과 사용자 독서 테마를 보존한다. 제작·운영 화면은 성인 작업 밀도를 유지한다.

## 진행

기존 첨부 worktree를 재사용한다. 시작 main/작업 브랜치 e4bcf03ec, origin/main보다 로컬 11개 커밋 앞이며 원격 뒤처짐 없음. 루트 미추적 PDF·시안·tmp 및 다른 worktree 보존. 운영 데이터 쓰기·push·배포 없음.

## 검증

변경 범위별 타입·기능 회귀·빌드 및 대표 화면의 375×812/812×375/1024×768 브라우저 검수를 기록한다. 화면 검수와 실제 음성·교구·실기기 검증은 구분한다.

## 실제 구현

- typography 역할 토큰(page/section/body/label/meta)을 Tailwind까지 연결했다. Card는 표시용 기본과 interactive role/tabIndex·Enter/Space를 구분하며 preventDefault·중첩 입력을 존중한다. 신규 과정 이동 카드는 실제 Link다.
- 한글/영어는 CourseActivitySection을 공유한다. cream 바탕·white 카드·간결한 번호/아이콘·완료 체크를 사용하며 실제 활동 순서·진도·제공 데이터 필터와 URL을 유지한다. English Book 1에 블록 게임을 다시 노출하지 않는다.
- CurriculumNavigation은 데스크톱 단원 목록, 모바일 native dialog를 공유한다. 제목·초점·Escape·닫은 뒤 버튼 복귀·배경 조작 차단을 제공한다. 상단/하단 탐색을 포함한 높이도 실제 헤더 높이에 맞춰 1px 페이지 넘침을 제거했다.
- 게임/과정 ActivityShell의 장식 배경은 공통 cream으로, 진행/로딩/결과는 간결한 white 카드로 정리했다. 문제 번호와 완성 수의 접근성 문구를 분리하고 5개 UI 언어를 갱신했다. 결과 칭찬/효과음·책 연결·명시적 다시 하기/확인은 유지한다.
- 한글/영어/다국어 블록·쓰기·색칠·소리 활동·튜토리얼의 팝 그림자/흰 글자 주색 버튼 대비를 정리했다. CVC·단어가족의 3칸 학습 구분과 실제 자모/알파벳/팔레트 색은 보존한다. WordFillCanvas는 외곽선·활성 표시만 바꾸고 B700/EB800·900 마스크와 99% 판정은 수정하지 않는다.
- 한글/다국어 쓰기는 영어와 같은 짧은 가로 안내/캔버스 배치를 사용한다. 쪽 순서는 남은 높이를 네 보기 격자에 나눠, 짧은 화면에서 그림이 가려지던 기존 배치를 수정했다. 보기 그림은 contain, 채운 슬롯 그림은 기존 표현을 유지한다.
- 어휘 단원/선택·기존 파닉스/퀴즈 메뉴·공개 활동/워크지/블록 허브·독서 도구/보상/낱말 공개의 바탕·카드·주색을 통일했다. 리더 도구 클릭 영역은 44px이다. 책 제목/삽화와 이미지 위 자막 대비 그라디언트·선택한 어두운 독서 테마는 유지한다.
- 로그인/프로필/부모 기록·설정/초대/구독 화면에 같은 CTA 대비·바탕·카드 기준을 적용했다. 소셜 로그인 브랜드·BETA_OPEN·결제/인증/개인 집계 조건은 수정하지 않는다.

## 검증 증거와 한계

- client typecheck 통과. 최종 전체 client 및 빌드 결과는 마감 절에 기록한다.
- 전체 client 중간 검증: 187파일 중 186통과/1실패, 1331테스트 중 1326통과/5실패. 실패는 1차 때 원본 main에서도 재현한 marketing/CreateContentDialog의 기존 기대값 5개이며 이 작업에서 변경하지 않았다. JSDOM의 기존 localhost XHR 연결 오류도 로그에 출력된다.
- 마지막 레이아웃 변경 뒤 관련 8파일/25테스트 통과: Card 3계약, 결과 유지·분리 1계약, PageOrderPlayer 재시작/완료/복귀, GameListViewer, 과정 쓰기, 프로필 선택, 부모 개요 회귀.
- 변경 TS/TSX ESLint 0오류, 기존 7경고(KoreanBlock 3, LineMatching 2, StoryImage 1, legacy WordWriting 1). 함수/힌트 구현을 지워 경고를 숨기지 않았다. 링크·Prettier·diff 공백 검사도 수행한다.
- 실제 로컬 앱+공개 조회 API로 한글/영어 과정의 375×812·1024×768 화면, 실제 게임 제공 카드와 영어 Book 1 게임 목록을 확인했다. 모바일 단원 메뉴 열기→닫기 버튼 초점→Escape→원래 단원 버튼 초점 복귀 확인. 페이지 가로/세로 넘침 0px.
- 임시 HTML에서 실제 결과/쪽 순서/한글·베트남어 쓰기/ViewerToolbar를 로컬 fixture로 렌더했다. 이 서버의 API 대상은 연결되지 않는 localhost:9로 격리하여 TTS prewarm의 운영 생성/저장을 막았다. 실데이터·운영 음원/채점 결과 검증이라고 보고하지 않는다. 임시 fixture 파일은 검수 뒤 제거하고 커밋하지 않는다.
- 812×375 결과의 다시 하기/확인(각 높이60px)이 모두 보임. 쪽 순서 보기 약380×95px 4개와64px 슬롯이 한 화면에 들어오며, 순서 선택0→1→2→3→4, 결과4/4 유지, 다시 하기0/4를 확인했다.
- 812×375 한글 쓰기 캔버스 약524×262px, 베트남어 약518×259px 확보·페이지 넘침0. 375×812 리더 도구의 9개 버튼은 모두44×44px, 양쪽 그룹과 전체 페이지 가로 넘침0.
- 원본 이미지를 저장하거나 브라우저에서 버튼을 누른 증거와 iOS 음성 청취·실물 카메라/종이쓰기·실기기 검증을 구분한다. 실제 가입/결제·계정 개인 데이터·운영 콘텐츠 수정·발행·원격 push/배포는 하지 않았다.

## 적용 범위와 다음 검증

이번 범위는 기존 학습자 진입 경로와 공통 활동/게임, 부모 관리 UI의 표현 통일이다. 개발용 중국어 과정 선택 화면, 별도 Nature/3D 몰입 학습 테마, 제작/운영 도구는 각각 목적·교육 표현에 맞는 별도 검토 대상으로 유지한다. 활동 수나 채점 기준을 바꾸지 않았으며 새 학습 리포트 V2 기능 구현도 포함하지 않는다. 남은 검증은 실기기 음성/교구와 개별 콘텐츠의 장문/삽화 경우다.

## 마감 확인

최종 client typecheck·production build 통과. 전체 client는 187파일/1331테스트 중 기존 마케팅1파일/5실패만 동일하며 186파일/1326테스트 통과(73.45초). 마지막 부모/리더/게임/공용 계약6파일/30테스트도 통과했다. 변경 TS/TSX113파일 ESLint0오류/기존7경고, Prettier와 로컬 문서 링크·git diff --check 통과. 빌드의 기존 chunk size/i18n import/Lottie eval/Browserslist 경고는 유지한다.

최종 production preview(5185)의 실제 영어 Book1 카드6개를 확인하고 루트 output/ui-v2-20261012/course-tablet.jpg(1024×768)를 저장했다. 게임 fixture 결과 캡처는 game-result-landscape.jpg다. 화면 캡처·임시 fixture·검증 로그는 커밋에서 제외하고, fixture 소스는 제거했다. UI v2 코드와 해당 영역 메모리를 4e7de123c로 함께 로컬 커밋하고 main으로 fast-forward 통합했다. 원격 push·배포는 요청받지 않았다.
