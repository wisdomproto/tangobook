# 피포네 돌담 목장 캐릭터 레퍼런스 진단

- id: 20260921-content-pipo-reference-audit
- domain: content
- status: paused
- updated: 2026-09-21
- base: e3fdc859
- branch: main
- worktree: C:/projects/tangobook
- integration: 진단 기록만 main 반영; 생성 코드 변경 없음
- delivery: 운영 데이터 GET만 수행; 미푸시·미배포

## 요청과 확인 결과

사용자는 프롬프트를 그대로 가져가 그린 그림이 만들어 둔 캐릭터 레퍼런스를 따르지 않는다고 지적했다. 사용한 생성 경로와 이미지 첨부 여부는 아직 확인되지 않았다.

- `packages/client/public/pipo-core.js` 및 원본 `_series-core.template.js`의 `composeBatchPrompt`는 `@imageN` 범례를 글로 만든다. `copyText`는 `navigator.clipboard.writeText`만 호출한다. 시트 이미지는 복사에 포함되지 않으며 기획서 시트 조회는 화면 썸네일 표시용이다. 외부 생성기에 실제 이미지를 따로 첨부해야 한다.
- `packages/client/scripts/draw-changjak.mjs`의 `refFor`는 완료 권 중 가운데 권의 p10 한 장을 선택한다. 캐릭터 시트를 읽지 않는다. 코드 주석의 “시트는 pongi에만 있다”는 현재 데이터와 맞지 않는다. 참조를 찾거나 다운로드하지 못하면 레퍼런스 없이 작업을 생성할 수 있다.
- 운영 `GET /api/comic-assets/pipo-plan`에서 `pipo`, `mom`, `sheep`, `goose`, `horse`, `cast-sheet`, `anchor`가 확인됐다.
- 현재 `pipo-plan/pipo.png`와 `pipo-02/p1.webp`를 직접 열어 비교했다. 시트는 짙은 회색 몸·짧게 접힌 귀·둥근 얼굴이고, 기존 삽화는 흰 몸·길게 늘어진 귀·길쭉한 주둥이다. 실제 외형 불일치가 있다. 사용자가 이번에 생성한 결과를 확인한 것은 아니다.
- 앵커는 여전히 `SHADING IS ZERO`, 경계 없는 눈 등 현재 시트와 어긋나는 지시를 포함한다. 시트를 첨부한 경우에도 충돌 가능성이 있지만 이번 생성의 원인으로 확정하지 않는다.

## 과거 결정과 다음 행동

[기존 검수 기록](../../../changjak-books/_ART-FLAGS.md)의 9월 10일 결정은 기존 렌더에 앵커를 맞추되 배치 종료 후 변경하는 것이었다. 이번에는 현재 시트를 참조하지 않는다는 사용자 지적이므로 기존 결정을 근거로 시트를 무시하거나 앵커를 임의 수정하지 않는다.

생성 경로와 실제 첨부 여부를 확인해 수정 범위를 정한다. 외부 복사 경로라면 시트 파일 전달과 인물 매핑을, 배치라면 장면 등장인물별 시트 첨부를 다룬다. 기존 삽화 일괄 재생성·운영 데이터 변경은 수행하지 않았다. 코드 실행 및 새 이미지 생성 검증은 하지 않았다.
