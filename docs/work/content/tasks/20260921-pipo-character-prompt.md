# 피포 캐릭터 프롬프트를 본문 삽화에 맞춤

- id: 20260921-content-pipo-character-prompt
- domain: content
- status: ready
- updated: 2026-09-21
- base: c6dbb850
- branch: codex/content-pipo-character-prompt
- worktree: C:/projects/tangobook/.worktrees/pipo-character-prompt
- integration: 검증 완료; main 통합 대기
- delivery: 미푸시·미배포; 이미지 재생성·운영 데이터 변경 없음

## 사용자 결정

사용자가 “캐릭터 프롬프트를 페이지 피포와 동일하게” 요청했고, 기준을 **동화 본문 삽화의 흰 몸·긴 귀 피포**로 명시했다. 기획서의 짙은 회색·짧은 귀 시트를 따라가는 것이 아니다. [앞선 진단](20260921-pipo-reference-audit.md)을 이어간다.

## 변경

- `docs/art-direction/pipo-cast.md`: 피포 외형을 `pipo-02/p1.webp`의 흰 털, 긴 검은 귀, 앞으로 나온 둥근 주둥이, 작은 눈, 짧게 위로 휜 검은 꼬리, 노란 목도리로 구체화. 서 있거나 바라보는 장면에 강제로 웅크림·소품을 넣지 않도록 수정.
- `docs/art-direction/pipo-anchor.md`: 같은 외형을 장면 공통 규격에 반영. 흰색 금지·명암 금지·경계 없는 눈 규칙과 충돌하지 않도록 피포에 한해 명시적 예외를 둠. 다른 인물 규격은 유지.
- 빌더로 `pipo-core.js`, `pipo-plan.html`에 반영. 기획서의 오래된 앵커 본문도 현재 원본과 동기화됨. 빌더가 덤으로 갱신한 회차별 SCENE HTML은 이번 변경과 무관한 기존 생성물 차이여서 해당 파일들만 HEAD로 되돌림.

## 검증

- `node packages/client/scripts/build-series-html.mjs pipo`: 50권/500컷 생성. 기존 `[등장] 빈 쪽 21`은 이번 외형 수정과 별개.
- `node --check packages/client/public/pipo-core.js`, `sync-anchor-to-core.mjs pipo --check`, `git diff --check` 통과.
- Node VM에서 실제 생성된 `sheetPrompt('pipo')`, `composeBatchPrompt` 실행: 흰 털·긴 검은 귀·돌출 주둥이 포함, 이전 짧은 귀 지시 제거, @image1 피포 매핑 확인. 기획서 HTML에도 같은 규격 확인.
- 새 그림 생성·육안 결과 검증은 하지 않음. 프롬프트 텍스트 변경만 검증함.

## 남은 일

기획서에 저장된 회색 피포 시트 이미지는 그대로다. 새 시트를 만들 때 본문 피포 그림을 실제로 첨부해야 한다. 프롬프트 복사에 이미지가 자동 첨부되지 않는 기존 동작과 배치 러너의 참조 선택 로직은 이번 범위에서 바꾸지 않았다.
