# 붕이·딩딩 기존 본문 삽화 초기화

- id: 20260929-content-bung-dingding-illustration-reset
- domain: content
- status: integrated
- updated: 2026-09-29
- branch: main
- worktree: C:/projects/tangobook
- delivery: 본문 삽화 연결과 작업판 쪽 이미지 제거 완료, 캐릭터 시트 유지, Git push 미요청

## 사용자 요청

새 캐릭터를 만든 뒤 `bung-plan.html`의 기존 동화책 삽화를 전부 지우고 다시 만들겠다고 요청했다. 이어 `dingding-plan.html`도 같은 처리를 요청했다. 기존 [붕이 의상·시트](20260928-bung-clothing-colors.md)와 [딩딩 의상·시트](20260928-dingding-character-colors.md)는 유지한다.

## 범위와 실행

운영 R2 읽기 전용 조회에서 `comic-assets/bung-01..50/p1..10` 쪽 이미지 240개와 딩딩 250개, 해당 `storybook-changjak-*-*.json` 100권의 `pages[].illustrationUrl` 490개를 확인했다. 100권 모두 비공개 10쪽이다. 캐릭터 시트는 `bung-plan`, `dingding-plan`의 별도 키이며 두 작업판에서 각각 4개였다.

[`clear-bung-dingding-illustrations.mjs`](../../../../packages/server/scripts/clear-bung-dingding-illustrations.mjs)를 dry-run으로 확인한 뒤 `--apply`했다. 원본 책 JSON 100개와 삭제 이미지 키 목록은 `D:/ComfyUI-output/changjak-bung-dingding-reset-20260929/`에 보관했다. 책의 `illustrationUrl`만 삭제하고 본문·콘티·나레이션·번역·책 상태는 그대로 뒀다. 이어 정확히 쪽 이미지 키 490개를 R2에서 삭제했다. 캐릭터/단역 시트와 `*-plan` 자산은 삭제 대상이 아니다.

## 검증과 주의

- 스크립트 재조회: 대상 책의 삽화 연결 0개, 쪽 이미지 R2 객체 0개.
- 운영 `GET /api/comic-assets/series/bung|dingding`: 각 작업판의 삽화 권수 0. `GET /api/comic-assets/bung-plan|dingding-plan`: 각 캐릭터 시트 4개 유지.
- CDN의 이전 이미지 URL 캐시는 잠시 남을 수 있으나 책 데이터와 작업판 목록에는 연결되지 않는다.
- 기존 링커 `link-changjak-series.mjs`의 `mergePage`는 새 이미지가 없으면 옛 URL을 보존한다. 이번에는 책 JSON에서도 옛 URL을 지웠으므로 재실행 시 옛 삽화가 되살아나지 않는다.
- PNG 원본은 별도 백업하지 않았다. JSON/키 목록만 복구 자료이므로 옛 이미지 자체는 삭제된 상태다.
