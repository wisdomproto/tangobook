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

2026-10-01 10:50: 기존 배치가 70/80 생성·시험판 반영까지 진행 중. PID50736/queue prompt 확인, 실행 중인 runner 보존. 명작 여우 수정 요청 두 건은 같은8190 queue에서 순서대로 처리했으며 첫 후보 기각/두 번째 검수 교체. 전래 manifest를 직접 수정하거나 runner를 중단하지 않았다. 전래 우선6장 수정과 나머지 원본/플레이/음원 검수는 남음.

2026-10-01 11:32 재개: 전래40권80장 배치는 generated-review-pending으로 정상 종료, PID50736 없음/lock0/Comfy8190 queue 비어 있음을 확인했다. 80장 생성·흑백·해시 통과 및 같은 시험판 반영 완료. 생성 runner는 재시작하지 않았다. 사용자의 “전래동화 원본 자체가 단순해서 색칠 공부에 딱”이라는 판단을 작업 기준에 추가: 원본의 단순한 구도를 살리고 잔무늬만 덜어낸다.

80장 전부 contacts/000-006~078-080으로 원본/선화를 대조하고 review.json에 장별 인물·행동·소품·난이도 판단과 검토 SHA를 기록. 20장은 작은 면/핵심 요소 누락/군중·잎 무늬/추가 소품 등 구체적 후속 검수 또는 수정 대상, 나머지도 실제 플레이 승인 대기. 필수0칸0장, 면적5%미만10장(기각한 개와고양이7쪽은 제외)이다. 1색 여부만으로 실패 판정하지 않는다. 고양이9쪽 기존 실제 플레이 증거는 playEvidence로 보존. 전래의80장 원본 비교는 완료됐지만 원본 색 대응/실제 색칠/나레이션·BGM 전수 승인과는 다르다.

임금님귀8쪽 대나무가 빠진 선화에 Qwen으로 줄기3개·큰 잎을 복원해 인물/행동 유지·유색0 확인 후 첫 후보를 현재 도안으로 반영. 기존image/graph/history/job은 revisions/story-clue에 보관. 실제 엔진7칸1색3.2%이고 주요 옷이 칠해지지 않아 needs-color-alignment-repair로 남김. 후속 원본 좌표 수정 요청이 이전 그래프의 선화를 참조하는 도구 오류를 발견해 repair-classic-coloring.py를 고쳤다. 실제 sourceFile을 input에 복사하고 LoadImage를 지정; 이후 제출 그래프와 원본 SHA 일치 확인. 유색/잘못된 참조 후보는 기각 보존. 원본 참조 후보2칸1색0.8%, 큰 한복 한 면 후보8칸1색4.4%도 종이색만 읽혀 적용하지 않았다. 현재 첫 대나무 복원본의 원본 색 대응은 여전히 미승인이며 좌표/작은 패널 최소 면적 진단이 다음 단계. 판정을 낮춰 통과시키지 않는다.

명작 곰3마리 오류 수정과 현재 대나무 첫 후보를 sync-scene-coloring-preview.mjs로 같은 tests 경로에 공개. validation-20261001.json으로 명작288+전래80 원본/도안736파일 SHA와 저장된 흑백 결과, 선택된 실제 쪽의 illustrationUrl/text/ttsUrl/translations/책BGM 연결을 재검사: 불일치0, 한국어 TTS 누락0. 음원 URL 매핑 검증은 실제 청취 증거가 아니므로 BGM/읽어주기 전수 재생은 남음. 사용자 승인된 시험판 이외 운영 데이터/main push 변경 없음.
