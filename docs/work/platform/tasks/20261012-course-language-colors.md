# 한글·영어 과정 색 통일

- id: 20261012-course-language-colors
- domain: platform
- status: completed
- updated: 2026-10-12
- base: 1144423ab
- branch: codex/platform-ui-v2
- worktree: C:/Users/kil21/.codex/worktrees/platform-ui-v2/tangobook
- delivery: 미푸시·미배포

## 사용자 결정과 범위

홈의 한글 살구색(peach-200/코랄 강조), 영어 민트색(mint-200/짙은 민트 강조)을 수용하고 “다른화면에서도 한글 영어 색 통일해줘”라고 요청했다. 콘텐츠 언어별 공통 테마를 만들어 탐색·과정/단원·활동 선택·책/어휘 언어 선택·부모 리포트에도 적용한다. UI 번역 언어와 학습 언어를 혼동하지 않는다.

정답/오답·완료 체크·음소/블록/색칠 팔레트는 별도 의미다. 일반 콘텐츠 카드와 게임판은 중립 바탕을 유지한다. 학습 순서·진도·음성·채점·접근 권한·운영 데이터는 변경하지 않는다.

## 진행과 검증

기존 첨부 worktree를 재사용한다. 원격 fetch 후 로컬 main/작업 브랜치 상태 확인, 루트 미추적 자료 및 다른 worktree 보존. 변경 범위의 기존 회귀 테스트·client typecheck/build·파일 lint 및 모바일/태블릿 대표 화면 검수 후 관련 파일만 로컬 커밋·main 통합한다.

## 실제 변경

- 공용 `courseTheme.ts`에 콘텐츠 언어별 surface/selected/badge/hover/text/action/ring/focus와 CSS accent를 정의했다. 홈의 시작/이어 하기, 상단/하단 탐색, 과정 선택, 한글/영어 제목·단원·진도·번호, 공용 활동 제목/번호/hover/초점을 연결했다. 영어 활동의 ABC 예시도 민트 강조다.
- 책 상세의 선택된 언어 칩과 모바일 select, 공용 어휘 언어 select, 부모 리포트 LanguageTabs·기본 요약 언어 select·파닉스 이어 하기에도 같은 기준을 적용했다. LanguageTabs는 aria-pressed·44px 클릭·이름 있는 초점을 보완했다.
- 일반 활동 카드/게임판은 white/cream, 완료 체크와 정답/오답은 기존 상태 의미를 유지한다. 음성·게임/교육 데이터·접근 게이트·사용자 UI 언어 설정 변경 없음.
- 현재 디자인 기준과 구현 안내를 갱신했다. root CLAUDE의 옛 학습=peach/게임=mint 설명은 현재 원본을 가리키도록 보완하고, phonics CLAUDE의 과거 설계는 기록임을 명시했다.

## 검증 결과

- client typecheck·production build 통과. 기존 Browserslist/eval/청크 경고는 유지한다. 변경 TS/TSX16개 ESLint0오류/0경고.
- 기존 AppShell·ParentReportsPage·LearningOverview·PhonicsSummaryCard 회귀4파일27테스트 통과. 새 스타일을 그대로 비교하는 테스트는 추가하지 않았다. 서버/전체 게임 전수 테스트는 이 색 수정에 반복하지 않았다.
- production preview에서 영어 과정1280px·한글 과정887px·모바일375px의 과정/활동/선택 상태, 모바일 단원 dialog320px의 mint-200/mint-700 선택, 열기/닫기·과정 전환 확인. 가로 넘침 없음.
- 실제 책 상세에서 한국어→English 선택 시 제목·aria-pressed와 mint-200/2px mint-700 ring 동기화,375px select의 영어 민트/한국어 살구 바탕·테두리·전환 확인. 책 읽기/나레이션 실행 없이 공개 GET 기반 화면만 검수했다.
- 색 대비: white/mint-700 6.79:1, mint-700/mint-200 4.91:1. coral-700/peach-200은4.12:1이어서 작은 번호·탭 글자만 coral-800으로 보완했다. 한글 CTA coral-700/white는5.29:1. 색만으로 선택/완료를 설명하지 않고 활성 경로·윤곽·aria-pressed·체크를 유지한다.
- 캡처는 루트 output/ui-v2-20261012/course-{korean,english}-colors.jpg. 운영 데이터 쓰기·가입/결제·실물/실기기 검증·push/배포는 없음.
