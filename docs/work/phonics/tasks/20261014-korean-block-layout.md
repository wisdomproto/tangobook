# 한글 블록 트레이 이동·판 여백·문제 단어 정리

- id: 20261014-korean-block-layout
- domain: phonics
- status: ready
- updated: 2026-10-14
- base: bda78718b
- branch: codex/storybook-learning-ui
- worktree: C:/Users/kil21/.codex/worktrees/platform-ui-v2/tangobook
- integration: 미통합
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
