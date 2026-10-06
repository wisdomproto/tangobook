# 붕이 물 색상 통일

- id: 20260929-content-bung-water-colour
- domain: content
- status: integrated
- updated: 2026-09-29
- branch: main
- worktree: C:/projects/tangobook
- delivery: 프롬프트·생성 정적 파일 로컬 변경. 기존 이미지/운영 데이터 변경·push 없음.

## 사용자 결정

사용자가 물이 황토색·파란색·흰색으로 달라진다고 하여 통일을 요청했고, 선택 질문에 차분한 청회색 `#7FA6B2`를 명시적으로 선택했다.

## 원인과 변경

- 기존 공통 앵커는 RIVER #C08B3E를 물·흙·나무·바지·뿔 등에 함께 사용했다. 무대에는 천막 아래 물을 bare PAPER, 물통·컵의 물을 OVERLAP으로 그리는 별도 지시도 있었다.
- 물은 전용 WATER #7FA6B2로 분리. 강/장터/수로/물통/컵/따르는 물과 낮/밤/비/그늘에서 같은 단색을 사용한다. 흰 반짝임·그라데이션·황토/초록 물 금지. 날씨와 시간은 하늘·주변·등불로 표현.
- 기존 황토는 OCHRE #C08B3E로 이름만 바꾸어 나무·흙·바지·뿔·소품에 유지. 잠긴 물체는 OVERLAP, 그 위 물은 WATER, 드러난 진흙은 SILT로 구분.
- 앵커·개체 규격·무대/소품 시트·설계·SCENE의 기존 재질 토큰과 생성 core/plan/해당 회차 HTML 반영. 기존 캐릭터 의상 색은 유지한다.
- 구 레퍼런스에서 물 색이 달라도 새 WATER 규격을 따르되 인물/배/배치를 유지하도록 명시했다.
- 운영 이미지 확인을 위해 bung-01과 bung-20 목록을 조회했지만 두 목록 모두 비어 있었다. 등록 삽화 전체를 육안 검증했다고 보고하지 않는다. 이번 작업은 프롬프트 수정이며 이미지 생성·재색칠·삭제는 하지 않았다.

## 검증

- `node packages/client/scripts/build-series-html.mjs bung`: 50권·500컷.
- 실제 core의 합성 함수 500컷에 WATER #7FA6B2 포함 확인. 시트 4종에 기존 황토 부위/개체 규격 보존 확인.
- SCENE은 RIVER→OCHRE 재질명 변경 외 동일, 생성 HTML의 한국어 본문 500쪽 전후 동일.
- `node --check packages/client/public/bung-core.js`, `git diff --check` 확인.
- 별도 작업의 미커밋 `20260929-changjak-all-series-text-review.md`와 output 폴더 보존.
