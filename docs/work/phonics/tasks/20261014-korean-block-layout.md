# 한글 블록 트레이 이동·판 여백·문제 단어 정리

- id: 20261014-korean-block-layout
- domain: phonics
- status: integrated
- updated: 2026-10-14
- base: bda78718b
- branch: codex/storybook-learning-ui
- worktree: C:/Users/kil21/.codex/worktrees/platform-ui-v2/tangobook
- integration: ccee0a9fd 최초 구현·b8d1e85d9 화살표 투명/영역 경계·46d26f6d8 중앙 그림 트레이·c43e915a8 테두리 안쪽 clip 후속 로컬 main fast-forward 통합
- delivery: 이번 미푸시·미배포

## 사용자 결정

슬라이딩 블록 목록에는 큰 좌우 화살표를 표시하고 판과 다음 버튼 사이 여백을 확보한다. 문제 단어는 자음/모음별 색과 수동 조합을 제거하고 검정색 폰트로 표시한다. 블록의 실제 자음/모음 색·회전/치수·합성/채점·음원은 유지한다. 이 공용 한글 블록판은 파닉스와 동화에서 함께 사용한다.

기존 트레이는 native 가로 스크롤뿐이고 xl 중앙 정렬 시 넘치는 시작 조각이 잘릴 수 있다. 안쪽 max-content 줄을 별도로 중앙 정렬하고 바깥 viewport를 스크롤한다. overflow 상태·현재 끝에 맞춰 큰 화살표를 활성화하고 ResizeObserver로 화면/조각 폭 변화를 따른다. reduced-motion은 즉시 이동, 기본은 부드러운 이동이다.

## 구현·검증

- TangoBoard의 공용 트레이에 기존 WebP next 그림을 재사용한60px 좌우 버튼/짧은 가로44px 버튼을 추가. 필요할 때만 표시, 끝 비활성/키보드 focus·native swipe 보존,75%씩 이동. 숨겨진 시작 조각 없이 안쪽 줄 중앙 정렬.
- KoreanBlockPlayer만 문제 h1을 검정 폰트 문자열로 변경. 성공 뒤 타이핑 문자열/소리 순서 유지, ColoredHangulWord 호출 제거(다른 기능/자산 삭제 없음). 오른쪽 확인/다음은 판과24~40px·작은 가로16px 간격으로 분리.
- 3파일60회귀 통과: 좌우 scrollBy/끝 비활성/선택 불변 및 기존 회전/드래그·5쌍자음11복합모음/누적 자음 필터 포함. client 타입/build 통과. lint 오류0·기존 KoreanBlockPlayer 미사용3경고. 기존 빌드 Browserslist/Lottie eval/i18n import/큰 chunk 경고 유지.
- 실제1280×720: 쌍자음 단원 검정 꿀벌·큰 화살표, 오른쪽 이동 후 끝 모음/오른쪽 비활성 확인. ㄱ단원4선택지는 overflow 없어 화살표 없음, native drag로 판에ㄱ 배치 확인.
- 812×375/568×320: 큰 좌우44px/판과 버튼16px 간격·잘림 없음, 작은 화면에서 여러 번 오른쪽 이동 후 모음3종/끝 비활성 확인. 기본 viewport로 복원하고 신데렐라 책 게임의 검정 시계·같은 화살표/여백 검수.
- 증거: `C:/Users/kil21/.codex/visualizations/2026/10/11/01a12b90-4491-7c02-b97d-b867f6ec4b02/korean-block-layout-{desktop,812,568,book}-20261014.png`. 카메라 실시간/전체 게임 완주/모바일 실기기 테스트로 보고하지 않는다. 판 좌표/인식기/문제 생성/채점은 변경 없음.
- 새 이미지·의존성 생성 없이 기존 공유 자산 재사용. 기존 미커밋 쓰기 테스트 줄바꿈·미추적 자산/출력 보존. 이번 push 요청 없음.

## 화살표 배경 반증

사용자 ‘화살표 뒤에 투명도가 없는 것 같다’ 반증. 사용 중 cloud-v1/icons.webp의 next 영역은 RGBA·alpha0~255/네 모서리alpha0이나, tango-tray-arrow의 불투명 #fff4dc 바탕·테두리·box-shadow가 사각 배경처럼 보였다. 이미지/atlas를 재생성하거나 공용 자산을 바꾸지 않고 해당 CSS 바탕/테두리/박스 그림자만 제거한다. 60/44px 클릭 영역은 유지하고 그림은48/38px로 키워 화살표 자체와 모양을 따르는 얕은 그림자만 표시한다.

후속 사용자 결정: 화살표 영역과 블록 영역 경계를 확실히 나눈다. 트레이의 좌우60/44px 전용 칸을 전체 높이로 분리하고 가운데 블록 목록과3px 세로 경계를 표시했다. 비활성은 그림만 흐려져 경계는 유지한다. 왼쪽은 수평 반전으로 그림 높이를 맞추고 sprite 하단 빈25%의 잡픽셀은 CSS clip으로 제외한다. 기본 바탕은 투명, 새 이미지/JS/채점/스크롤 로직 변경 없음.

CSS Prettier·diff 검사 통과, 실제1280×720/568×320 사각 바탕 없음·양쪽 구분선/클릭 이동·왼쪽 끝 비활성 확인. 증거는 같은 폴더 `korean-tray-arrow-zones-{desktop,568}-20261014.png`. CSS만 바뀌어 타입/build/회귀는 다시 실행하지 않았으며 위60회귀/타입/build는 직전 구현 결과다. 임시 viewport·탭 정리 완료.

## 중앙 그림 트레이 후속

사용자는 선만 그은 구분을 반증하고, 글자 블록 영역만 예쁜 사각형 배경으로 감싸도록 요청했다. 세로선/전체 공용 바탕을 제거하고 중앙 목록에 얇은 민트 테두리·크림 안쪽의 둥근 사각 그림 트레이를 적용한다. 화살표는 트레이 밖 양옆에 독립 표시한다. 로컬 Qwen ComfyUI 설정8190과8188은 응답하지 않아 imagegen 스킬의 내장 도구로 새 배경1종 생성 진행. 아트만 새로 만들며 글자/조작은 DOM, 회전·스크롤/채점은 그대로다.

- 생성 완료: 원본 `exec-56750f3c-683c-43b8-ac6e-12feab0f9442.png`는 Codex generated_images에 보존. 단순 crop[48,110,2124,613]/resize만 거쳐 `public/images/games/korean-block/tray-frame.webp` RGBA1024×248/21,270bytes로 export. 9-slice48·실제 테두리14px/짧은 가로10px로 모서리/테두리 형태를 유지한다. 원본 픽셀 재작화/alpha 덧칠 없음.
- 정확한 프롬프트·도구·crop·SHA는 같은 폴더 `tray-frame.json`. 핵심 프롬프트는 blank ivory inner tray / thin matte mint-sage hand-painted rim / one horizontal rounded rectangle / outside true alpha / no text, letters, icons, clouds, wood, compartments.
- 세로 구분선과 화살표까지 감싸던 바탕을 없애고 그림은 중앙 viewport에만 적용. 기존 블록 회전/드래그·좌우75% 이동·끝 비활성/검정 단어 보존.
- CSS/TSX Prettier·7판 회귀·client production build 통과. 기존 Browserslist/Lottie eval/i18n import/큰 chunk 빌드 경고 유지. 타입 로직 변경이 없어 타입 검사는 재실행하지 않았다.
- 실제1280×720/568×320: 민트 사각 트레이·바깥 양옆 화살표/세로선 없음·모서리/글자 잘림 없음 확인. 작은 화면은122px씩 이동 후 끝모음3종/오른쪽 비활성 확인, 기본 viewport/임시 탭 복원. `korean-tray-frame-{desktop,568}-20261014.png` 같은 검수 폴더. 전체 책/카메라/실기기 검수 아님.

## 테두리 침범 후속

사용자가 오른쪽ㅎ 카드의 그림 테두리 침범을 반증했다. 이전 ‘잘림 없음’ 관찰은 테두리 안전 영역 검증을 놓쳤다. border-image는14px/10px로 그리는데 실제 border는2px인 스크롤 viewport에 함께 적용해 콘텐츠가 두꺼운 그림 영역까지 드러났다. 그림 프레임을 바깥 별도 래퍼로 옮기고 기본12px/짧은 가로8px padding 안에 독립 viewport를 둔다. 안쪽에서 clip/스크롤하고 테두리에는 카드/글자가 겹치지 않게 한다. 이미지와 블록 치수·채점·스크롤 로직은 유지한다.

- 7판 회귀·TSX/CSS Prettier·diff 검사 통과. DOM 래퍼/CSS만 변경해 타입/build는 재실행하지 않았다.
- 실제1280×720 프레임x148.40~967.60/내부viewport162.40~953.60: 좌우14px 안전 영역.568×320 프레임193.27~360.00/내부203.27~350.00: 좌우10px. 초기 오른쪽ㅎ와 끝모음 이동·끝 비활성/테두리 침범 없음 확인. 중간 스크롤 카드 일부는 안쪽 viewport에서 잘리며 그림 테두리까지 나가지 않는다.
- 같은 검수 폴더 `korean-tray-inner-clip-{desktop,568}-20261014.png`. 기본 viewport/임시 탭 복원, 이번 push 요청 없음.

## 고정 모음·자음 스와이프 후속

사용자 결정: 모음 세 조각은 항상 표시하고 자음만 스크롤, 터치 스와이프 지원. 모음은 오른쪽 독립 고정 그림 트레이, 자음은 별도 그림 트레이/좌우 화살표로 분리한다. 작은 가로에서는 하단 목록을 판/행동 전체 폭에 걸쳐 둬 두 그룹을 함께 확보한다. 자음 touch-action pan-x와 방향 판별로 좌우 제스처는 native 스크롤, 위로 끌기는 판 배치, 탭은 선택/회전으로 구분한다. 모음 회전 시에도 고정 영역 버튼 폭은 유지한다. 카메라/영어/실물 치수·채점은 변경하지 않는다.

- 3파일62회귀 통과: 모음 그룹은 자음viewport 밖·스크롤해도3조각 유지. 합성 touch pointer 좌우/cancel은 capture/선택/배치하지 않음, 다음 탭 선택 가능·위로 touch drag는 최초 위치를 보존해 실제 판 좌표에 배치. 기존 회전/조합/누적 제한도 보존. client 타입/build·변경TSX/test lint 오류0/경고0, 기존 빌드 경고 유지.
- 실제1280×720에서는 기본13자음이 함께 보여 화살표 없이 모음3조각 독립 표시.568×320 자음 화살표 이동 전후 모음frame x366~530/폭164px 유지,ㅣ→ㅡ 회전 후에도 동일. native mouse drag로ㄹ 판 배치/되돌리기 활성 확인.
- `korean-fixed-vowels-{desktop,568}-20261014.png` 같은 검수 폴더. 터치 분기 테스트는 합성 이벤트이며 실제 기기 관성/손가락 native pan 검증으로 보고하지 않는다. 임시 viewport·탭 정리, 새 이미지/라이브러리 없음·이번 push 요청 없음.
