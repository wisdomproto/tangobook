# 창작동화 1 퐁이네 장면 색칠

- 요청: 19개 창작동화 시리즈 중 1번의 각 책에서 주요 장면을 뽑아 색칠공부를 만들고 기존 HTML에 탭 추가. 사용자가 image skill을 지정했다.
- 범위: `01. 퐁이네 운하 마을`, `changjak-pongi-01`~`50`, 책당 2장 총 100장. 기존 6분류 730장은 보존한다.
- 브랜치: `codex/games-classic-scene-coloring`. 시작 HEAD `f2978ea9`. main push/운영 책 등록은 이번 요청에 포함하지 않는다.
- 생성: imagegen SKILL의 built-in 도구. ComfyUI/CLI 대체 실행 없음. 결과는 `generated-images/pongi-scene-coloring/lineart`에 복사한다.
- 작업 데이터: `D:/ComfyUI-output/classic-scene-coloring/changjak-pongi`. inventory, 원본 책 JSON, manifest, source-selection-review, imagegen-prompts, audit를 보존한다.
- 공개 대상: 기존 승인된 `https://assets.tangobook.co.kr/tests/classic-scene-coloring/20261001-review-1/index.html`의 같은 tests 경로만 사용한다.

## 원본 선정과 예외

읽기 전용 storybooks API에서 시리즈 50권을 실제 조회했다. 책 페이지의 `page_number`/`scene_description`을 사용한다. 책에 연결되지 않은 삽화는 기존 comic-assets에서 원본을 찾았다. 07권은 이전에 선정된 로컬 Qwen 삽화의 SHA를 대조했다. 29권 comic-assets의 토끼 그림은 시리즈가 달라 기각하고 기존 선정된 퐁이 원본 4/8쪽을 사용한다.

33권은 공개/기존 comic-assets 원본이 없어 본문 1/7쪽과 퐁이 캐릭터 참조로 새 컬러 원본 두 장면을 built-in imagegen으로 만들었다. 이를 기존 운영 삽화로 보고하지 않는다. 해당 원본도 workspace의 `source` 폴더에 보존한다.

## 검수 기준

원본 구도를 유지하는 흰 내부/검은 폐곡선 도안을 만든다. 원본 pixels로 현재 shared engine이 색을 추출한다. 정답색 굽기/밝기 보정/전역 median 변경 없음. 흑백/SHA/shared engine filled 비교와 실제 ColoringPlayer 붓질은 서로 다른 증거로 기록한다. 큰몸 색칠불가/인물 추가/주요 행동 변경만 수정하며 사소한 색 차이와 작은 흰면 때문에 반복 검수하지 않는다.

첫 1쪽은 2:1로 재구성된 시안에서 퐁이 몸이 흰색으로 읽혀 미적용했다. 16:9 원본 위치를 유지하는 두 번째 시안으로 수정했다. 모든 후속 프롬프트는 원본 외곽을 그 위치에서 따라 그리도록 지시한다.

제공된 퐁이 페이지에는 한국어 native TTS URL이 없어 읽기 fallback을 구분한다. native 음원 자연종료나 발화 전사를 검증했다고 확대하지 않는다.

## 완료 — 2026-10-04

- 50권 100장 선화 생성 완료. imagegen built-in reference edit 요청을 장면별로 실행했다. 최종 선화 100장은 `generated-images/pongi-scene-coloring/lineart`, 선택된 요청 100개는 같은 폴더의 `generation-requests.json`, 33권 신규 컬러 원본 두 장은 `source`에 보존한다.
- 100장 흑백 픽셀 검사 및 실제 source/lineart SHA 쌍 검증 통과. 원본/선화/shared engine filled의 20개 비교 시트(5장씩)를 전수 육안 대조했다. 01권 두 장면, 11권 이불, 37권 물속 몸의 큰 면 문제를 imagegen으로 수정하여 재대조했다. 11권은 캔버스 안쪽에서 이불 외곽을 완전히 닫아 큰 이불이 정상 색칠됨을 확인했다. 작은 흰 손발·주둥이와 사소한 색 차이는 빠른 검수 기준으로 허용하며 모든 작은 면의 정확한 색 복원으로 확대하지 않는다.
- 실제 ColoringPlayer 대표 검증은 **로컬 02권9쪽/11권4쪽/33권7쪽, 공개 01권8쪽**이다. 포인터 연속 붓질, 큰 몸/이불 색, 물감 완료 및 정확한 원본 쪽 본문 리빌을 확인했다. 33권 마지막 붓질 중 리빌 전환으로 shadow-root 오류가 났으나 후속 DOM에서 `색칠과 장면 읽기 완료`를 확인했다. 처음 폐기한 01권 시안의 플레이는 최종 도안 증거로 세지 않는다. 100장 전부를 실제 플레이하거나 native 음원을 검증했다고 보고하지 않는다. 장별 reset 반복은 이번 범위에 없다.
- 공개 HTML에 **창작동화 1 · 퐁이네** 일곱 번째 탭 추가. 실제 브라우저에서 50권·100/100장 및 각 장면의 게임 링크를 확인했다. 기존 6분류730장을 보존하여 총415권830장이다. 승인된 동일 tests 경로에만 sync했으며, 플레이가 사용하는 `?v=SHA` 원본100+선화100 URL을 실제 다운로드하여 200 SHA 전부 대조했다. Python HTTP 클라이언트는403을 받아 Node fetch로 검증을 완료했다.
- 공개 manifest를 editor2 catalog에 가져와 퐁이네50권을 책 ID와 쪽 번호로 추가 연결했다. 전체415권830장/권당2장/퐁이네01~50번의 개별 ID·버전 URL 연결 테스트5개 통과, client typecheck 통과. editor2 코드의 운영 배포/main push는 하지 않았다.
- 검수 증거는 `D:/ComfyUI-output/classic-scene-coloring/changjak-pongi/review-workspace`의 비교 시트, `local-game-evidence.json`, `public-game-evidence.json`, `public-image-sha.json`에 있다. 원본 선정/최종 manifest/review/공개 해시와 플레이 DOM 증거도 프로젝트 `generated-images/pongi-scene-coloring/review`에 복사하여 보존한다. 게임 엔진/색 추출/median/완료 기준 변경 없음.
- 임시 검수 서버5237은 `DISABLE_PUBLISH_SCHEDULER=1`, 사진 median 강제 적용 없음. 기존 서버와 사용자 시험판 탭을 보존하고 임시 검수 탭은 닫는다. 관련 코드/기록/선화만 이름으로 stage하여 로컬 커밋한다.

마지막 editor2 화면 추가 확인은 이전 로컬 서버5236이 종료되어 `ERR_CONNECTION_REFUSED`였으며, 이번 editor2 연결 증거는 catalog 테스트/typecheck다. 그 오류 페이지의 `data:` URL 때문에 Browser 도구가 임시 탭 닫기/다른 URL 이동도 차단했다. 사용자 갤러리 탭에는 조작하지 않았다. 임시 탭 정리는 미완료이며, 이를 닫았다고 보고하지 않는다.
