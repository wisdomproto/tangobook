# 전래동화 장면 색칠과 통합 테스트 탭

- id: 20261001-games-traditional-scene-coloring
- domain: games
- status: active
- updated: 2026-10-01
- branch: codex/games-classic-scene-coloring
- worktree: C:/projects/tangobook/.worktrees/classic-scene-coloring
- integration: 테스트 R2 공개, 제품 게임 등록/main push 미요청

## 요청과 현황

2026-10-01 10:32 이후 스냅샷: runner PID50736 실제 실행 확인, Comfy8190 queue의 저장 promptId 확인 후 중복 제출 없이 진행. 52/80에서 계속 진행해59/80까지 확인. 우선 낮은 면적6장(반쪽이9/서동요4/은혜 갚은 두꺼비3/의좋은 형제4·9/임금님 귀는 당나귀 귀8)을 원본/도안/filled로 대조하고 review.json에 개별 수정 사유를 남겼다. 주요 인물 열린 큰 면과, 이야기 핵심인 뛰어넘는 바위/비밀을 외치는 대나무가 전부 제거된 경우를 구별했다. 생성 성공은 승인으로 처리하지 않았다. priority-0.jpg/priority-1.jpg 증거 보관. 명작 라푼젤 수정을 공용8190 queue에 한 장 추가했으나 실행 중인 전래 runner/다른 요청을 중단하지 않았다.

사용자는 기존 테스트 HTML에 명작동화/전래동화 탭을 넣고 같은 방식으로 전래 콘텐츠도 만들도록 요청했다. 운영 읽기 전용 목록의 category=전래 동화는40권, 삽화513쪽이다. 현재 등록된 책 모델을 그대로 쓰며 과거 styleAssets 사본을 만들지 않는다. 본문을 읽어 책당 대표2쪽/총80쪽을 scripts/traditional-scene-selection.json에 선정했고 실제 원본 URL·본문·다국어 TTS·책 BGM·SHA256을 보관했다.

출력은 D:/ComfyUI-output/classic-scene-coloring/traditional. 명작 manifest와 분리하고 합성 공개 manifest에는 traditional/ 접두어를 붙인다. 명작288장의 기존 해시와 결과는 유지한다. 환경변수 SCENE_COLORING_ROOT/CATEGORY/SELECTION으로 기존 Qwen 생성·흑백 검사·영역 검사·복구 runner를 재사용한다. 기본값은 기존 명작 작업 그대로다.

개와 고양이7쪽 시험본은 원본 인물이 화면 아래 작게 있어 필수2칸1색/면적1.4%였다. 도안 자체도 큰 면 윤곽이 열려 있었으므로 최종 승인하지 않고 revisions/selection-too-small에 제출 기록 보존. 같은 책9쪽(구슬을 되찾는 고양이/생쥐)과13쪽(할머니가 고양이를 안는 결말)으로 변경했다. 9쪽5칸4색/면적33.2%, 실제 서버 브라우저4색 붓질→정확한9쪽 원본/본문 리빌 확인(player-cat-mouse-reveal.png). 13쪽17칸3색/면적34.9%, 원본 대조 검수 대상. 이후78장도 한 장씩 생성하는 runner가 실행 중이다. 생성 성공을 모든 장 최종 승인으로 보고하지 않는다.

## 서버 시험판

같은 URL https://assets.tangobook.co.kr/tests/classic-scene-coloring/20261001-review-1/index.html 에 두 탭을 반영했다. 실제 외부 브라우저 명작144권288장과 전래40권80장 예정/완료 수 분리 표시 확인. 전래 원본80장 업로드, 생성된 도안부터 색칠해 보기 링크가 나온다. sync-scene-coloring-preview.mjs는 해당 테스트 경로에만 새 이미지/manifest/HTML을 업로드하며 해시 ledger로 기존 파일 중복 업로드를 피한다. 비공개 로컬 생성 경로/제출 내역은 공개 manifest에서 제외한다. 변경된 index와 gallery-manifest.json은 캐시 없이 갱신한다. 사용자 요청은 이 시험판의 순차 업데이트를 허용하며 운영 책 등록으로 확대하지 않는다.

자료실은 별도 authoring 링크 작업에서 로컬 main에 “동화 장면 색칠 (테스트)”로 통합됐다. 운영 main push는 아직 하지 않았다.

## 실행·복구

PowerShell에서 SCENE_COLORING_ROOT=D:/ComfyUI-output/classic-scene-coloring/traditional, SCENE_COLORING_CATEGORY=전래 동화, SCENE_COLORING_SELECTION=이 worktree/scripts/traditional-scene-selection.json, SCENE_COLORING_SYNC_PREVIEW=1을 설정하고 `python scripts/run-classic-coloring-batch.py --comfy-url http://127.0.0.1:8190`을 실행한다. batch.lock/batch-status.json의 실행 PID와 저장 promptId/queue/history를 먼저 확인해 중복 runner/제출을 피한다. ComfyUI8190은 이전 작업에서 시작한 자체 서버다. 다른 진행 작업을 종료하지 않는다.

80장 색 검사·해시 확인 후 원본/도안/filled 대조, 실제 색칠·해당 쪽 나레이션/BGM 검수를 마쳐야 최종 완료다. 명작16장 우선 검수와 전수 대조도 이전 작업에서 계속 남아 있다. 갤러리 JS node --check, Python 구문 검사, 첫 서버4색 플레이를 확인했다.
