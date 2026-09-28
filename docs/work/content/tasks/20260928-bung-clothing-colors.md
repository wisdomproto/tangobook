# 붕이 캐스트 의상 식별색

- id: 20260928-content-bung-clothing-colors
- domain: content
- status: integrated
- updated: 2026-09-28
- branch: main
- worktree: C:/projects/tangobook
- delivery: 프롬프트 로컬 반영·시트 4장 운영 교체 완료. Git push 미요청.

## 사용자 결정과 원인

사용자가 `bung-plan.html` 캐릭터들의 옷 색이 비슷하여 읽을 때 혼동된다고 했다. 주황/노랑/자주/남색 배정을 제시한 뒤 **프롬프트와 캐릭터 시트 4장까지 변경**을 선택했다. 기존 시트 4장을 실제 조회하니 모두 초록 윗옷이었다. 캐스트 규격도 모두 LEAF였고 공통 앵커는 두 색판만 허용하며 보라·빨강·노랑을 금지했다.

## 반영

- 붕이 윗옷: 벽돌빛 주황 `#C85A36`.
- 또리 윗옷: 밝은 노랑 `#F2C94C`.
- 엄마 옷·머릿수건: 자주 `#984C78`.
- 할아버지 윗옷·동그란 모자: 남색 `#435B91`.
- 캐스트·앵커·설계와 생성된 core/plan에 동기화했다. 목판 평면 표현과 기존 배경·소품 팔레트는 유지하고 의상만 별도 색판을 허용한다. 옛 초록 옷 참조보다 새 색 배정이 우선함을 명시했다. 청록 코끈·발목 방울 끈은 유지한다.
- 기존 등록 시트를 실제 첨부한 imagegen 편집으로 옷 색을 변경하고 외형·포즈·옷 형태·기존 마젠타 배경을 유지했다. 엄마의 기존 긴 옷도 그대로다. 원본 백업, 새 PNG, 업로드 영수증은 로컬 `output/imagegen/bung-colors/`에 보관했다.
- `POST /api/comic-assets/bung-plan`의 `bung`, `ddori`, `mom`, `grandpa` 네 키를 새 PNG로 교체했다. 기존 본문 삽화는 변경하지 않았다. 운영 시트는 즉시 적용되며 프롬프트 파일은 push/배포 후 적용된다.

## 검증

- `build-series-html.mjs bung`: 50권·500컷. 변경 생성물은 core/plan뿐이며 회차 HTML과 원고/SCENE은 불변.
- VM에서 4종 시트 규격 전달과 500컷 실제 `composeBatchPrompt`의 네 색/`@image1` 포함, 폐기한 색 금지 문구 부재 확인.
- `sync-anchor-to-core.mjs bung --check`, `node --check packages/client/public/bung-core.js`, `git diff --check` 통과.
- 이미지 4장 육안 검토 후 등록 manifest·HTTP 200·다운로드 SHA256 원본 일치 확인. 브라우저 렌더 및 새 본문 생성 검증은 하지 않았다.
