# 홈 언어 입구·추천 도서 개편

- id: 20261014-home-course-portals
- domain: platform
- status: integrated
- updated: 2026-10-14
- base: c0daa533b
- branch: codex/storybook-learning-ui
- worktree: C:/Users/kil21/.codex/worktrees/platform-ui-v2/tangobook
- integration: 2c753ef03 로컬 main fast-forward 완료
- delivery: 미푸시·미배포

## 요청

홈 한글/영어 박스 전체를 버튼으로 만든다. 안의 이어하기/새 시작/모드 선택은 제거하고 언어 입구로 연결한다. 단조로운 언어 버튼과 추천 도서3개 구성을 다른 유아 플랫폼 참고로 다시 디자인한다. 언어 안에서 모드를 나누는 기존 결정을 유지한다. 아래 초기 조사는 적용 전 기록이며 현재 승인 후속과 검증은 아래를 따른다.

## 조사·현재 코드

LearningHomePage가 진행 상태에 따라 활동 직접 링크와 모드 선택을 만든다. home-recommendations는 공개 동화·그림체 중복 정리·일별 카테고리 추천을3권으로 제한한다. 전체 카드 Link로 변경할 때 중첩 링크를 없애고, 추천 확대 시 공개/중복/편집 순서를 보존한다. 기존 테스트의 이어하기 기대는 제품 결정 변경으로 수정해야 한다.

공식 참고: [Lingokids 섹션 안내](https://help.lingokids.com/hc/en-us/articles/9563170182801-What-sections-can-I-find)는 추천·주제·인기·새 활동의 콘텐츠 행과 별도 Lessons 경로를 설명한다. [Khan Kids 학습 화면 안내](https://khankids.zendesk.com/hc/en-us/articles/360014856151-Learning-Topics-Using-Khan-Academy-Kids-in-Educational-Settings)는 큰 시작 행동과 자유 선택 도서관을 설명한다. 로그인 앱 직접 사용이 아니라 공식 설명 조사다.

## 초기 검토의 다음 행동 — 후속 구현 완료

현재 홈 육안 확인 → 언어별 삽화 입구·더 풍부한 표지 행 구성 → 필요한 자산은 기존 것을 먼저 검토하고 생성 모델 정책 적용 → PC/태블릿/폰 실제 화면 및 관련 회귀 검증. 마지막 사용자 커리큘럼 논의 요청을 먼저 다루고 있으며 이 작업은 완료로 보고하지 않는다. 새 push 요청 없음.

## 구현 승인 후속

사용자 현재 요청으로 두 언어 박스 전체 Link·내부 이어하기/모드/새 시작 제거·언어 내부 모드 입구 연결을 실제 적용한다. 기존 코랄 가/민트 Aa WebP 그림을 크게 사용하고 받침/입체 눌림·언어색으로 버튼 역할을 강화한다. 새 그림 생성 없이 기존 자산 재사용. 추천은 현재3권 유지, 제목 옆 랜덤 아이콘 클릭으로 새 추천을 뽑는다. 기존 공개/그림체 중복 정리/카테고리·편집 순서를 유지하고 직전3권은 가능한 한 모두 제외, 부족한 카탈로그만 남은 칸 재사용. 기존 추천 수 확대·별도 콘텐츠행 제안은 이번 사용자 구체적 범위에 포함하지 않는다. 커리큘럼/자유모드·진도는 언어 안에서 유지하고 홈에서는 표시하지 않는다. 이번 작업 push 요청 없음.

## 구현·검증

- LearningHomePage 두 언어 판은 각 하나의 Link로 한글/영어 내부 모드 입구에 연결. 새/기존 진도와 무관하게 같은 경로, 중첩 링크·이어하기/새 시작/모드 선택·활동 제목 제거. 실제 진행/이어하기는 언어 안의 경로에서 유지한다. 자녀 key와 원래 진도 저장은 그대로, 홈의 진행 조회 구독·journey import는 제거.
- 기존 StorybookSprite의 코랄 가/민트 Aa WebP를 큰 그림으로 재사용. 언어색/깊이 있는 받침·정적 타원/언덕·누름/hover·focus 및 reduced-motion. 새 이미지·엔진/의존성/원격 데이터 쓰기 없음. 세로 홈은1열, 태블릿/PC2열, 짧은 가로폰은2열120px 및 설명/작은 방향 화살표 배치. 제목 단어 잘림은 keep-all·모바일 안쪽 여백으로 보완.
- 추천 제목 옆44/46px 셔플 도구. crypto.randomUUID로 새 무작위 seed, 직전 추천3ID를 제외한 공개·동화·그림체 그룹 대표 풀을 우선 사용한다. 새로운 책3권이 부족하면 그 새 책부터 고른 뒤 기존 책으로 빈 칸만 채우며 중복/가짜 책은 없다. daily 기본은 유지, 탭 안의 상태만 바꿔 API 재요청/페이지 재로드/학습 기록 변경 없음. aria-label/title·갱신 aria-live·loading/error/빈목록 비활성·5로케일.
- 관련2파일11회귀 통과: 각 전체 Link/실제 이동·신규/진도있음 동일 입구·progress 불변·여러 번 재추천/네트워크 refetch 없음·빈/로딩 비활성·private/phonics 제외·그림체 중복·daily안정·새3권/짧은 풀 fallback. client typecheck·scoped ESLint·production build20.79s 통과. 초기 테스트 타입의 Testing Library에 없는 exact 옵션은 제거 후 타입 재확인; 기대/검증 범위를 줄이지 않았다. 기존 Browserslist/lottie eval/i18n/큰 chunk 경고 유지.
- 실제 브라우저1920×1080·1024×768·568×320·375×812: 제목/글자/카드·단일 링크·설명 overflow0·전체 페이지 가로 overflow0. 568의 카드 하단236.67px/탭 상단247.33px으로 콘텐츠 안전 여백 확인, 셔플44px. 한영 카드 클릭→각 언어의 커리큘럼/자유모드 선택 확인. 실제 다시뽑기 피노키오/견우와 직녀/14번→정글북/콩쥐 팥쥐/04번으로 갱신 확인. metadata 읽기·UI 상태만 확인, 학습 완료/정답/서버 이벤트/외부 콘텐츠 쓰기 없음. 실기기 터치·FPS 측정 아님.
- 중간 검수 탭이 연결 오류 data page로 바뀌어 URL policy에 막혔다. 서버는5186 listen/HTTP200 정상 확인, 새 정상 localhost 탭으로 복구하고 최종 검수를 완료. 보안 interstitial 우회/설정 변경 없음.
- 실제 화면 PNG: C:/Users/kil21/.codex/visualizations/2026/10/11/01a12b90-4491-7c02-b97d-b867f6ec4b02/home-portals-20261014/ 의 pc/pc-shuffled/tablet/phone-landscape/phone-portrait.png.
- 이번 홈/추천 셔플은 로컬 커밋·main 통합하며 원격 push 요청은 없다. 과거 추천 수 확대/추가 행 구상과 다른 게임 전수 반응형 점검은 이번 구현 완료로 확대하지 않는다.

## 로컬 main 통합

2c753ef03 코드·기억17파일을 로컬 main에 fast-forward 완료. 커밋 훅 ESLint/Prettier 통과, 기존 쓰기 테스트 줄바꿈/미추적 자산·자료 보존.5186 개발 서버/읽기 API proxy 유지. 이번 작업 원격 push/배포 요청 없음.
