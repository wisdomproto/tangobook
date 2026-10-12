# 학습 플랫폼 UI v2 개편

- id: 20261012-platform-ui-v2-implementation
- domain: platform
- status: integrated
- updated: 2026-10-12
- base: ae07cbe0d
- branch: codex/platform-ui-v2
- worktree: C:/Users/kil21/.codex/worktrees/platform-ui-v2/tangobook
- integration: 97f3212cc를 로컬 main에 fast-forward 통합 완료
- delivery: 2026-10-12 origin/main 푸시 완료, Railway 배포 완료 여부는 미확인

## 요청·기준

사용자가 전체 점검 보고서와 v2 디자인 기준을 확인한 뒤 '좋아. 개편 시작하자'라고 구현을 요청했다. [점검 결과](20261012-platform-ui-ux-audit.md)와 [디자인 시스템](../../../design-system.md), 홈 V5를 따른다. 게임 P1 → 공용 UI → 홈·상위 탐색·서재 위계 순으로 실제 적용한다. 채점·콘텐츠·운영 발행은 유지한다.

## 진행

로컬 main의 문서 9개 미푸시 커밋을 포함한 ae07cbe0d에서 작업 폴더를 생성했다. 기존 학습 리포트/콘텐츠 worktree와 루트 미추적 자료를 보존한다. 실제 작업 폴더에서 frozen-lockfile 의존성을 설치한다.

## 검증

게임 완료/재시도와 반응형 판 크기, 홈 탐색/데이터/프로필, 접근성·타입·관련 테스트·빌드를 확인한 뒤 기록한다. 로컬 브라우저는 클라이언트만 실행하며 발행 스케줄러 비활성 환경을 설정한다. 운영 API는 공개 데이터 조회 범위에서 사용한다.


## 실제 변경

- `/library`는 학습 홈, `/library/books`는 서재, `/library/activities`는 게임·워크지·블록 진입. 기존 책/활동 URL·접근 게이트는 유지. 한글/영어 단원은 AppShell에 포함하고 활동은 풀화면 유지.
- 홈은 단순한 가/Aa 과정 카드, 프로필별 localStorage의 실제 최근 방문 단원, 공개 도서 추천 3권. 추천은 그림체 그룹 중복을 제거하고 카테고리별로 날짜에 따라 순환한다. 운영 LibraryConfig의 카테고리/책 순서를 사용하지만 개인화·AI 추천이나 새 운영 큐레이션으로 주장하지 않는다.
- 상단/하단의 같은 5개 탐색. 프로필 선택과 부모 리포트·초대·설정·건의·로그아웃 유지. 부모 메뉴는 native dialog로 초점/Escape/복귀 처리. 5개 UI 언어 번역 추가. 콘텐츠 언어는 책→어휘 URL의 lang으로 보존.
- Button/Chip/PageHeader/GameHeader에 대비·44px·초점·상태 의미 적용, surface/content/action·의미 radius 추가. Canvas용 폰트·팔레트·채점은 그대로.
- 독후활동 호스트의 완료와 닫기를 분리. 쪽 순서·숨은그림·장면 선택 결과에서 재시도/확인 가능. 짧은 가로의 장면 보기 2×2, 숨은그림 좌측 장면·우측 목표, 영어 26자 2줄과 6칸 한 줄, 쓰기 좌측 안내·우측 판 확보.
- 서재 상단 첫 안내를 제거하고 묶어 보기는 접음. 제목 번역까지 검색. 책 상세의 3단계 안내는 읽기 선택 아래에서 접고 읽기만 주색, 보조 모드는 중립 카드로 정리.

## 검증 결과·한계

- 작업 폴더에서 frozen-lockfile 설치 완료. client typecheck 통과.
- 관련 5파일 16테스트 통과: 실제 PageOrderPlayer 결과 유지→재시도→확인, 미완료 이탈, 기존 직접 완료 동작, 같은 5개 메뉴/현재 위치/부모 접근, 추천 공개·중복·날짜·소수 도서, 프로필별 진척 저장.
- 전체 client 185파일: 184통과/1실패, 1321통과/5실패. 실패는 수정하지 않은 marketing/CreateContentDialog의 낡은 문구·라벨 기대값이며 원본 main에서도 동일 5개 실패를 직접 재현. 이후 실제 결과 유지 테스트 1개 추가 통과. JSDOM 일부 기존 훅에서 XHR 연결 오류를 출력하지만 미처리 예외 실패는 없음.
- 수정 TS/TSX 29파일 ESLint 0오류/기존 6경고. client production build 통과(기존 chunk size/i18n 정적·동적 import/Lottie eval/Browserslist 경고). 마지막 소스 마감 뒤 최종 검증 결과는 아래 갱신.
- 실제 로컬 앱+공개 API 조회로 홈→한글 단원→홈의 이어 하기, 제목 검색 1권 및 책 상세, 부모 메뉴를 확인. 375×812·1024×768·812×375 브라우저 확인. 로그인 계정·개인 기록은 복제하지 않음. signed-in 부모 노출은 컴포넌트 테스트, 실제 계정 재로그인/전환은 미검증.
- 게임판은 임시 로컬 HTML에서 실제 플레이어를 fixture 이미지/6글자 데이터/무음 파일로 렌더했다. 812×375 장면 선택 네 보기 각 약273×152px, 숨은그림 약553×311px. 영어 26자·6칸·결과 버튼 모두 보임. 쓰기 안내와 약528×305px 판은 겹치지 않음. 1024×768 쓰기 판 약680×381px도 하단724px에 들어옴. 이는 저장 fixture/브라우저 증거이며 실시간 카메라·iOS Safari·실제 음성 청취 검증이 아니다. 임시 fixture는 커밋에서 제외하고 검수 후 제거한다.
- CSS import가 font-face 뒤에 있을 때 브라우저가 무시하는 사실을 실행 확인하여 main.tsx의 CSS import로 수정. Tailwind 뒤의 레이아웃 CSS 순서가 중요하다.

## 후속 범위

1차 적용은 학습 입구·공용 UI·서재/상세·게임 P1을 해결한다. 나머지 게임/과정 카드 표현의 일괄 이전, Card 키보드 계약·역할 typography, 실기기 음성/카메라 확인은 후속이며 전수 개편 완료로 보고하지 않는다. 운영 데이터 쓰기·학습 리포트 V2 구현·예약 게시·원격 push·배포 없음.


## 마감 확인

최종 client typecheck·관련 16테스트 통과. 수정 TS/TSX 30파일 ESLint 0오류/기존 StoryImage 힌트 경고 1개(주석 처리된 힌트 버튼의 기존 함수). 최종 production build 통과. 부모 메뉴를 Escape로 닫으면 원래 버튼으로 초점이 돌아오는 것을 실제 브라우저에서 확인했다. 코드·기억만 이름으로 stage하고 임시 game fixture는 제거했으며 검증 로그는 제외했다. 최종 홈 캡처는 루트 output/ui-v2-20261012/home-tablet.jpg에 보관한다. 97f3212cc를 로컬 main에 통합했으며 원격 push·배포는 요청받지 않았다.
