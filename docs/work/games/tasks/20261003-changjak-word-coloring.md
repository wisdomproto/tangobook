# 창작동화 핵심단어 삽화 색칠공부

- id: 20261003-changjak-word-coloring
- domain: games
- status: complete
- updated: 2026-10-03
- base: 3e950b3f
- branch: codex/games-changjak-word-coloring
- worktree: C:/projects/tangobook/.worktrees/changjak-word-images
- integration: 미통합
- delivery: 미푸시·미배포

사용자는 완성된 창작동화 핵심단어 삽화의 색칠공부 콘텐츠를 image skill로 요청했다. 범위 질문에 답이 없어서 1~19 전체로 진행한다고 알렸다. 기존 850권의 단어 연결 3,957개에 쓰인 고유 삽화 1,371종/237시트가 대상이다. 새 작업 main push는 미요청이다.

## 생성 결과와 원본 보존

imagegen 및 GPT 이미지 skill에 따라 subscription-native image_gen으로 승인된 원본을 실제 첨부해 선화를 생성했다. Qwen/API로 전환하거나 원본을 자동 추적·이진화하지 않았다. 네 시트를 6×4 참조 배치로 합쳐 생성하고 원래 3×2 시트 및 낱장으로 잘랐다. 최종 PNG 크기는 기존 카드와 같은 488 또는 500 정사각이다. 검은 윤곽/흰 내부이며 질감과 명암을 줄였다.

237시트 전체를 원본과 육안 비교했고, 개별 50종은 native 추가 보정 후 SHA/pass를 기록했다. 열린 손·꼬리·나뭇가지·모래의 큰 칸과 그림자/물 위 반사상 누락을 보정했다. 그림자 단어는 실제 대상이므로 지우지 않는다. 선이 카드 경계에 닿는 340종은 이미 생성된 경계선을 보존하는 crop 범위를 사용했다. Python은 참조 배치·분할·리사이즈·분석 미리보기만 처리했다.

원본 단어 카드/본문/캐릭터 시트/음원과 Editor2 keyObjectImages를 변경하지 않는다. 원본 WebP를 정답 색 출처로 재사용하며 별도 정답 이미지를 생성하지 않는다. 이전 두 registration 및 books-before 자료로 원본 SHA/850권 연결을 검증한다. 해당 책들은 모두 비공개이므로 공개 활동 목록으로 발행하지 않는다.

퐁이 손가락 개별 보정 두 건은 native output moderation의 sexual 판정으로 HTTP400 거절되었다(request cb6ecd3f-d662-436d-984e-5d376c80147c, a666f2b1-a58e-43a2-baa2-193866000158). 성공/승인으로 기록하지 않았다. 다른 생성 경로로 우회하지 않고 기존 성공한 전체 시트에서 실제 경계선을 보존해 자른 결과를 검수했다.

## 파일·등록·연결

로컬 생성 자료는 `generated-images/changjak-word-coloring/`에 있다. `jobs.json`, `native-*.json`, `reviews.json`, `geometry.json`, `cropped.json`, `measurements.json`으로 원본·생성·보정·분할 SHA를 추적한다. `cards/*.png`가 최종 낱장이고 `index.html`에서 원본과 도안을 나란히 비교/다운로드한다. `preview.png`는 여섯 도안 예시다. 대량 생성 자료는 Git에 넣지 않는다.

`scripts/changjak-word-coloring.py`는 준비/배치/분할, `scripts/changjak-coloring-check.mjs`는 실제 shared 영역 및 client 색 정책 검사, `scripts/changjak-coloring-register.mjs`는 현재 SHA 검증 후 신규 `cw-*` 키만 운영 이미지 저장소에 등록하고 CDN 바이트 검증을 수행한다. 기존 asset 키·카탈로그는 그대로 보존한다. 업로드는 SHA 원장으로 재개 가능하며 충돌 자산을 덮어쓰지 않는다.

연결 대상은 로컬 `coloring-plan-data.json`의 19그룹/850권 섹션, `coloring/manifest.json`의 3,957개 책별 항목, `coloring/book-index.json`이다. 같은 도안을 여러 책에서 재사용하므로 활동 키에는 책 번호를 붙인다. manifest builder, shared URL 파서, 공개 활동 builder도 `cw-*`를 책 활동으로 처리한다. 공개 목록은 비공개 책을 제외하며 기존 파일을 유지한다. 운영 이미지 등록과 로컬 카탈로그 변경/배포는 다른 작업이다.

운영 이미지 1,371장 업로드와 CDN 전수 바이트 SHA 검증, 기존 asset URL 보존 검사, 로컬 카탈로그 연결을 완료했다. 완료 원장은 `registration.json`, 연결 집계는 `integration.json`, 기존 목록 백업은 `catalog-before.json`이다. 기존 manifest 항목 2,379개는 그대로 유지하고 3,957개를 더해 총 6,336개가 됐다. `audit-catalog.mjs`로 전수 책별 URL 키/원본·선화 URL/색칠 단어/비공개 여부 및 기존 목록 동일성을 확인했다. 공개 activity-data 파일도 변경 없음.

기존 `build-coloring-plan.mjs`는 책들을 재정렬해 `bk-*` 번호를 다시 부여하므로 이번 연결에 사용하지 않았다. 이 작업의 `cw-*` 카탈로그는 등록 스크립트로 기존 목록에 추가한다. 전체 작업판을 다시 생성할 경우 이번 항목을 보존하고 기존 번호를 바꾸지 않는 별도 점검이 필요하다.

## 검증과 한계

1,371종 모두 최신 선화/보정/원본/crop SHA와 승인 기록, 색칠 칸·팔레트 존재 및 흑백 조건을 통과했다. 칠할 칸 없는 도안은 0개다. 진단 플래그 356종은 복잡도·작은 면적·흰 동물/눈·가는 물방울 등 후보이며 전부 결함으로 해석하지 않는다. 49종 큰 대상 후보를 원본/분석 색칠 미리보기로 비교해 35종을 추가 생성했다.

원본 색 그룹에서 작은 꼭지의 갈색이 큰 사과의 빨강을 덮는 문제를 수정했다. 넓은 칸부터 유사색을 묶으며 라벨/입력 순서가 달라도 큰 면의 색을 유지하는 회귀 테스트가 있다.

- client: answer-colors/scene-coloring-regions/catalog 3파일 19 tests 통과.
- shared activity-catalog: 11 tests 통과.
- client/shared typecheck, shared build, client production build 통과.
- 변경 TS ESLint, Node 스크립트 구문 및 Python AST 통과.
- `audit-delivered-regions.mjs`로 최종 PNG의 실제488/500 크기 그대로 전수 shared 영역 분석:1,371장,0칸 도안0개. 512px 생성 분석과 구분한 추가 증거는 `delivered-regions.json`.
- 실제 ColoringPlayer 브라우저에서 신발/사과 물감 표시·붓질·초기화 확인. 증거 `review/player-shoes-stroke.png`, `player-apple-stroke.png`, `player-apple-reset.png`.

로컬 플레이 시험은 `scripts/serve-changjak-coloring.mjs`로 실행한다. Vite만 부팅하며 DISABLE_PUBLISH_SCHEDULER=1을 설정한다. 포트 기본 5199, `/play?id=...`에 등록된 카드만 이미지로 제공한다. 전체 1,371장의 플레이 완료·음원 검증을 했다고 주장하지 않는다. shared/Sharp 분석은 브라우저 보간과 동일 픽셀 증거가 아니며 일부 작은 칸의 색 대응은 추가 조정 여지가 있다.

## 전달 상태

콘텐츠 생성·검수·등록·로컬 연결 완료. 관련 코드/기록/카탈로그만 로컬 커밋하며 대량 생성 원본과 다른 작업의 변경을 보존한다. 운영 이미지는 등록됐지만 새 목록과 코드의 main push/배포는 미요청이다.
