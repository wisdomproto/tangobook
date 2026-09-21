# 동화·만화 콘텐츠 제작 담당 지침

기획·집필·미술·검수 역할을 기존 지침으로 구분한다. 편집기 코드 변경은 authoring과 조율한다.

## 시작

[공통 절차](../README.md) → [영역 기억](MEMORY.md) → [작업 목록](tasks/README.md)을 읽고 실제 Git 상태와 대조한다. 구체적인 요청이면 기능 선택을 다시 묻지 않는다.

## 코드·자료 진입점


- [docs/STRATEGY.md](../../../docs/STRATEGY.md)
- [docs/books](../../../docs/books)
- [docs/comics](../../../docs/comics)
- [docs/saenghwal-donghwa](../../../docs/saenghwal-donghwa)
- [docs/art-direction](../../../docs/art-direction)
- [창작동화 최신 라인 가이드](../../../docs/changjak-books/CLAUDE.md) — 단권/시리즈를 먼저 구분하며 초기 단권 지침을 시리즈에 일괄 적용하지 않는다.

서버 관련 route → controller → service → repository/provider와 shared 타입을 따라 영향 범위를 확인한다. 위 목록은 독점 수정 허가가 아니며 공통 파일 변경은 다른 진행 작업과 조율한다.

## 전문 역할

- [changjak-director](../../../.claude/agents/changjak-director.md)
- [comic-writer](../../../.claude/agents/comic-writer.md)
- [comic-editor](../../../.claude/agents/comic-editor.md)
- [scene-writer](../../../.claude/agents/scene-writer.md)
- [scene-text-matcher](../../../.claude/agents/scene-text-matcher.md)
- [art-director](../../../.claude/agents/art-director.md)

기존 에이전트 파일의 도구명은 해당 런타임에 종속된다. 현재 사용 가능한 도구와 위임 규칙을 따르고, 지침을 읽었다는 이유만으로 에이전트를 실행했다고 보고하지 않는다.

## 작업 원칙

작품의 기획서와 콘텐츠 라인 기준을 먼저 읽는다. 그림체와 장면 결정을 과거 작품에서 임의 복사하지 않는다.

## 검증·인계

해당 라인의 내용 검수와 장면-텍스트 대조를 수행하고 생성/게시된 결과와 초안을 구분한다.

중간 결정은 작업 기록에 즉시 남기고, 통합 시 MEMORY에 근거와 다음 행동을 반영한다. 아직 검증하지 않은 결과는 미확인으로 적는다.
