# 파닉스 화면 시각 보완 · 모음 카드3개 · 소리 복구

- id: 20261012-phonics-playful-ui
- domain: phonics
- status: ready
- updated: 2026-10-12
- base: 5a00c3476
- branch: codex/phonics-playful-ui
- worktree: C:/Users/kil21/.codex/worktrees/platform-ui-v2/tangobook
- integration: 미통합
- delivery: 미푸시·미배포

## 요청과 반증

사용자가 Book 1 화면의 디자인을 대충 했다고 지적했다. 큰 상단 여백, 여러 박스에 같은 폰트 글자 반복, 만든 그림 자모 미사용, 단조로운 배경이 문제다. 단원 선택부터 실제 학습판까지 전체적으로 배경을 보완한다. Book 1은 모음 하나씩 유지하되 같은 모음 카드3개(ㅏ·ㅏ·ㅏ)를 나란히 놓고 하나씩 눌러 소리를 익히도록 후속 요청. 서로 다른 모음3개를 배우는 결정이 아니다.

소리 불러오기 실패도 사용자 확인. 기존 Vite5186 API_TARGET은 별도 Python static server5199여서 실제 API가 없었다. root의 기존 server 환경으로 스케줄러를 끈 API3500을 실행하고 프런트 연결을 복구한다. .env 복사·기록/운영 콘텐츠 생성/외부발행 없음.

## 범위와 원칙

PLATFORM/design-system·phonics/platform 기억·CLAUDE·이전 모음 Book1 기록 참조. 기존 ToyHangul 그림/폰트 쓰기/음원과 공용 컴포넌트 재사용. 학습 대상 위 장식·과도한 입자 반복을 피하고 배경은 입력/99% 마스크/기록을 소유하지 않는다. 기존 영문·한글 과정/활동에도 공통 표현 연결, reduced-motion 대응.

## 검증·진행

- 공용 `PhonicsBackdrop`: 정적 SVG 구름·해·언덕·잎/꽃, 입력을 가리지 않는 독립 배경 레이어. 한영 과정/선택, ActivityShell 및 source=phonics 게임에 연결. 다른 독후게임 배경 계약은 유지한다. 새 대형 이미지/엔진/의존성 없음. 같은 모음3카드 중 발음 중인 대상만 짧게 움직이며 reduced-motion에서는 움직임 생략.
- 과정 상단 여백·가로폭 조정, 단원 소개 영역은 그림 자모, 익히기 미리보기는 캐릭터/쓰기 미리보기는 종이칸·폰트로 구분. Book1 목록은2열 그림 카드, 모바일 dialog/전체10단원 개별선택 유지. 개발 도구 버튼은 VITE_QUERY_DEVTOOLS=true에서만 표시.
- 같은 모음3카드 순차 해금. 매 발음이 끝난 뒤 다음 카드, 세 번째 뒤 듣기 필수활동 완료. 이전 카드 재듣기/완료 멱등 보존, 서로 다른 모음 퀴즈/정오답 이벤트 없음. 마지막에는 써보기로 실제 write-1에 이동.
- root 기존 server 환경으로 API3500 실행(DISABLE_PUBLISH_SCHEDULER=1 로그 확인), worktree Vite5186 API_TARGET3500 연결. 기존 Python5199는 다른 작업이므로 보존. 한/영/중 낱음소 조회가 연결 실패의 빈 map을 세션 무음으로 캐시하지 않게 수정. playAudio의 선택 onError로 모음 재생 오류를 완료로 기록하지 않음; 기존 caller의 오류 fallback 체인은 보존.
- 로컬 `/api/phonics-library` GET: mod_korean3232·mod_english5288, ㅏ URL 조회. 실제 MP3 GET200/audio-mpeg/13,835B. 브라우저에서 0→1→2→3 실제 재생 ended와 다음 카드/완료/써보기 이동 확인(재생 오류 callback과 구별). 파일은 output/learning-effects-20261012/vowel-a-source.mp3로 보관하며 커밋하지 않음. 스피커 실제 청취/모든 음원의 내용 전수 검증/물리 iPad60fps와는 구분.
- 관련13파일55테스트·client typecheck·변경 TS ESLint0오류/0경고 통과. 3카드 마지막만 완료·다시 듣기·로드 실패 후 재시도/음원 map 재연결·오류/ended 분리·기존 multi-vowel/한영/쓰기·진행 회귀. client build28.86초 통과, 기존 lottie eval·dynamic/static·큰청크 경고 유지. 마지막 정적 flora/입구/개발 버튼 보완 뒤 typecheck도 통과.
- 실제375×812/1024×768: 모음3카드·원본비율·가로넘침0, 모바일 타깃 약108×135px, 한영 과정/실제 활동·모음 폰트 쓰기 확인. `output/phonics-playful-ui-20261012/`: korean-course-desktop/tablet.png, vowel-three-mobile/tablet/complete.png, vowel-writing-mobile.png, english-course/ activity-tablet.png. PNG는 브라우저 증거이며 전체 운영 게임 전수 플레이는 아님.

마지막 flora/입구/개발 버튼까지 반영한 최종 build32.13초 및 변경 소스 ESLint0오류/0경고 통과. 3카드 실제 종료→써보기→모바일 폰트 ㅏ 쓰기까지 재확인.

## 다음 행동

코드/기억을 로컬 커밋·main 통합. 기존 음원 서버와5186은 검수용으로 유지한다. 원격 push 요청 없음. 실제 태블릿 스피커/첫 진입속도 실측은 후속.
