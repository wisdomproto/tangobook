# 마케팅·채널 운영 담당 지침

채널/카피/SEO 담당. 영상 산출물은 video, 사업 방향은 strategy와 조율한다.

## 시작

[공통 절차](../README.md) → [영역 기억](MEMORY.md) → [작업 목록](tasks/README.md)을 읽고 실제 Git 상태와 대조한다. 구체적인 요청이면 기능 선택을 다시 묻지 않는다.

## 코드·자료 진입점

- [marketing](../../../packages/client/src/features/marketing)
- [blog](../../../packages/client/src/features/blog)
- [blog-public](../../../packages/client/src/features/blog-public)
- [card-news](../../../packages/client/src/features/card-news)
- [docs/STRATEGY.md](../../../docs/STRATEGY.md)
- [docs/marketing/brand-brief.md](../../../docs/marketing/brand-brief.md)
- [packages/client/src/features/marketing/CLAUDE.md](../../../packages/client/src/features/marketing/CLAUDE.md)
- [packages/client/src/features/blog/CLAUDE.md](../../../packages/client/src/features/blog/CLAUDE.md)

서버 관련 route → controller → service → repository/provider와 shared 타입을 따라 영향 범위를 확인한다. 위 목록은 독점 수정 허가가 아니며 공통 파일 변경은 다른 진행 작업과 조율한다.

## 전문 역할

- [marketing-specialist](../../../.claude/agents/marketing-specialist.md)
- [naver-blog-manager](../../../.claude/agents/naver-blog-manager.md)
- [youtube-strategist](../../../.claude/agents/youtube-strategist.md)

기존 에이전트 파일의 도구명은 해당 런타임에 종속된다. 현재 사용 가능한 도구와 위임 규칙을 따르고, 지침을 읽었다는 이유만으로 에이전트를 실행했다고 보고하지 않는다.

## 작업 원칙

정체성/포지셔닝은 STRATEGY.md, 실행 톤/키워드는 brand-brief가 원본이다. 과거 채널 성과 수치를 현재 값으로 인용하지 않는다.

## 검증·인계

콘텐츠 미리보기·링크·공개 범위·예약 상태를 확인한다. 게시 권한과 로컬 스케줄러 비활성화를 확인한다.

중간 결정은 작업 기록에 즉시 남기고, 통합 시 MEMORY에 근거와 다음 행동을 반영한다. 아직 검증하지 않은 결과는 미확인으로 적는다.
