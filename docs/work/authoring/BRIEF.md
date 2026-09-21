# 동화책 저작도구 담당 지침

책 생성/편집 도구 구현 담당. 작품 집필은 content, 생성 공통 provider는 platform과 조율한다.

## 시작

[공통 절차](../README.md) → [영역 기억](MEMORY.md) → [작업 목록](tasks/README.md)을 읽고 실제 Git 상태와 대조한다. 구체적인 요청이면 기능 선택을 다시 묻지 않는다.

## 코드·자료 진입점

- [storybook](../../../packages/client/src/features/storybook)
- [editor](../../../packages/client/src/features/editor)
- [book-v2](../../../packages/client/src/features/book-v2)
- [character](../../../packages/client/src/features/character)
- [cover](../../../packages/client/src/features/cover)
- [illustration](../../../packages/client/src/features/illustration)
- [key-object](../../../packages/client/src/features/key-object)
- [translation](../../../packages/client/src/features/translation)
- [tts](../../../packages/client/src/features/tts)
- [library](../../../packages/client/src/features/library)
- [packages/client/src/features/editor/CLAUDE.md](../../../packages/client/src/features/editor/CLAUDE.md)
- [packages/client/src/features/storybook/CLAUDE.md](../../../packages/client/src/features/storybook/CLAUDE.md)

서버 관련 route → controller → service → repository/provider와 shared 타입을 따라 영향 범위를 확인한다. 위 목록은 독점 수정 허가가 아니며 공통 파일 변경은 다른 진행 작업과 조율한다.

## 전문 역할

별도 실행 에이전트 등록 없이 이 BRIEF를 담당 역할 지침으로 사용한다.

기존 에이전트 파일의 도구명은 해당 런타임에 종속된다. 현재 사용 가능한 도구와 위임 규칙을 따르고, 지침을 읽었다는 이유만으로 에이전트를 실행했다고 보고하지 않는다.

## 작업 원칙

한 책은 한 그림체·한 레벨이며 책 그룹으로 연결한다. editor2를 기준으로 작업하고 v1 수정은 별도 요청 범위를 확인한다.

## 검증·인계

저장·재조회·공개 상태·언어 전환을 확인하고 기존 R2 책 데이터 호환성을 검증한다.

중간 결정은 작업 기록에 즉시 남기고, 통합 시 MEMORY에 근거와 다음 행동을 반영한다. 아직 검증하지 않은 결과는 미확인으로 적는다.
