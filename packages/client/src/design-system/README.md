# 탱고북 디자인 시스템 구현 안내

제품 경험·새 화면 기준은 [제품 디자인 시스템 v2](../../../../docs/design-system.md)를 따른다. v2는 2026-10-12 재정의한 기준안이며, **현재 코드가 모두 v2로 이전된 것은 아니다.** 문제와 적용 순서는 [점검 기록](../../../../docs/work/platform/tasks/20261012-platform-ui-ux-audit.md)에 있다.

## 현재 구성

tokens/에는 colors, radius, shadows, typography, motion과 barrel이 있다. primitives/의 public export는 Button, Card, Chip, Skeleton/SkeletonBookCard, StateScreen, ErrorBoundary, Mascot, AppIcon, PageHeader, BookCover, resolveCover다. 실제 props는 소스를 확인한다.

일반 스타일은 Tailwind 클래스로 사용한다. Canvas/SVG 등 런타임 값이 필요한 경우 tokens를 import한다. 비즈니스 데이터·판정·외부 API 호출은 feature에 둔다.

## 실제 토큰과 Tailwind

tailwind.config.ts가 토큰을 import한다. src/index.css의 CSS 변수는 별도 정의이므로 참조·동기 여부를 확인한다. typography.ts에는 현재 폰트 패밀리만 있으며 역할별 크기·줄간격 토큰은 아직 없다.

- cream: 50/100/200, peach: 50/100/200/300/500.
- coral: 50/100/200/300/400/500/600/700/800/900. **50과 900도 실제 정의되어 있다.**
- mint: 50/100/200/300/400/500/600/700.
- ink: 50/100/200/300/400/500/600/700/800/900.
- semantic: success, info, warn, danger, fun. 독서용 darkbg/darktext도 있다.
- radius: xs=8px, md=16px, lg=24px, xl=32px. 기본 2xl=16px, 3xl=24px와 크기 순서가 다르므로 이름으로 추측하지 않는다.

색 값의 원본은 colors.ts다. v2의 surface/text/action 의미 이름은 **추가 제안**이며 현재 export로 사용하면 안 된다. 브랜드 coral-500은 유지하되 흰 일반 글자의 주요 버튼은 대비가 충분한 조합으로 이전할 예정이다.

## 남아 있는 이전 과제

- Button 기본 coral-400→500/white 대비, focus-visible·loading 계약.
- Chip 기본 높이·선택 의미, Card interactive div의 키보드 동작.
- PageHeader 모바일 뒤로가기 이름과 공용 클릭 영역.
- 게임 완료 기록과 결과 닫기 분리, 짧은 가로 화면의 학습판 확보.
- 역할별 타이포·크기·의미 라운드, CSS 변수/토큰 중복 관리.

학습 UI는 공용 토큰·상태 표현을 사용한다. 표지·삽화·색칠 팔레트의 작품 색은 UI 색 제한과 구분한다. 마케팅 도구의 범위가 제한된 별도 테마도 존중한다. 쓰기 마스크·채점 기준을 UI 스타일과 함께 바꾸지 않는다.

프리미티브에는 재사용할 수 있고 비즈니스 로직·외부 API가 없는 요소를 추가한다. GameLoadingGate 등 도메인 의존 요소는 feature에 둔다. 신규 요소는 기존 계약과 대조하고 구현 범위에 맞게 추가한다.
