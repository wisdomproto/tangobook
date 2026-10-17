# 한영 모드 선택 그림 구분

## 요청·결정

- 사용자 승인: 재검토3번 모드 선택 그림 교체. 커리큘럼은 학습 길, 자유모드는 여러 놀이 선택. 한글·영어 공통 적용 및 실제 화면 검수.
- 같은 동화책 디오라마 그림체의 새 그림2장. 커리큘럼은 소리→블록→쓰기→책의 연결된 길, 자유모드는 블록/노트·연필/팔레트/돋보기 네 놀이. 소재는 선택 의미의 상징이며 실제 챕터 교육 순서를 새로 정의하지 않는다.
- 언어별 글자를 그림에 굽지 않아 한영이 같은2장을 공유한다. 제목/모드명/한 줄 안내와 전체 카드 Link 유지.
- 지정 로컬 ComfyUI 설치 없음,8188/8189/8190 서버 없음. 사용자에게 알리고 imagegen 스킬의 내장 도구 사용. [자산·프롬프트 기록](../../../../packages/client/public/images/phonics/mode-entry-v2/README.md).

## 구현

- PhonicsLearningModes: mode-entry-v2 960×640 WebP2종, intrinsic size 명시. 합203,108 bytes(약198KiB), 기존v1 보존.
- CSS: 기본3:2. 작은 가로 contain, 세로 휴대폰은 그림44%/문구56% 가로 카드로 전체 그림과 클릭 영역 보존.
- 커리큘럼 resume=1 팝업, 자유 지도, 실제 진행·잠금·자녀 격리 정책은 보존. 입구 새 버튼/이어하기/설명 추가 없음.

## 검증

- PhonicsLearningModes.test.tsx **31개 통과**, client typecheck 및 build 통과. 기존 Browserslist/청크 크기/lottie eval 경고는 남는다.
- 변경 TSX ESLint, TSX/CSS Prettier check 및 git diff --check 통과.
- IAB 실제 한영 각각 PC1280×720, 태블릿1024×768, 가로844×390, 세로375×812 화면 육안 검수. 제목·두 선택·화살표 정렬 정상, 휴대폰 주요 그림 전체 표시. 가로/세로 overflow 없음, 이미지 naturalWidth960 확인. 실기기 터치 검수가 아니다.
- 한영 커리큘럼 카드 클릭→해당 언어 현재 활동 이어하기 팝업. 자유 카드 클릭→해당 언어 자유 지도. 학습 완료 기록 생성/초기화 없음.
- 검수 탭 console error0. 증거: C:/project/tangobook/output/mode-choice-20261017/의 korean/english-desktop, tablet, landscape, portrait.png.
- 로컬 Vite5193, DISABLE_PUBLISH_SCHEDULER=1 / 운영 API 읽기 프록시. 운영 배포 검수가 아니다. 새 main push 요청 없음.
