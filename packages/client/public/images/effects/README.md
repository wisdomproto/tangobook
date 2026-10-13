# 학습용 말랑한 이펙트 atlas

2026-10-12 imagegen 스킬과 내장 이미지 도구로 생성. 로컬 Qwen/ComfyUI 리스너가 없어 확인·안내 후 내장 도구를 사용했다. 외부 그림 복제 없음. 원본은 Codex generated_images의 `01a12b90-4491-7c02-b97d-b867f6ec4b02`에 보존하고 실행 자산은 아래 WebP로 저장했다.

| 파일                            | 원본                                          | 프레임 / 크기                                   |
| ------------------------------- | --------------------------------------------- | ----------------------------------------------- |
| learning-cute-atlas-v2.webp     | exec-11247460-aebe-46d5-be19-47d6f631e3af.png | bubble / spark / brush / heart, 512×512·28,548B |
| learning-cute-companion-v1.webp | exec-65313c5a-7960-46dc-81bd-e863ed083859.png | flower / note / leaf / ribbon, 512×512·30,872B  |

각 atlas는 2×2, 셀256px, 투명 알파를 보존한 WebP다. 프레임 순서는 좌상→우상→좌하→우하. 생성 명세: 유아 학습용 말랑한 입체 장식, 살구·민트·버터 노랑, 네 개의 서로 떨어진 정면 소재, 충분한 셀 여백과 투명 배경. 1세트는 거품·둥근 네 꼭짓점 별·민트 붓결·분홍 하트, 2세트는 살구 꽃·민트 음표·잎·분홍 리본. 글자/사각 판/테두리/로고/캐릭터 얼굴/금속 크리스털/폭죽 제외. 프롬프트는 고정 화면이 아니라 animation용 독립 소재를 요구했다.

그림을 띄우는 것에 그치지 않고 Phaser의 곡선·scale·overshoot·stagger·회전·fade로14장면을 만든다. 정답 리본춤·꽃피기·하트물결, 듣기 음표, 합성 두색 리본, 짝찾기 하트 만남 등을 구분한다. 45ms trace throttle·객체 상한·1.6초 idle·자산 실패 폴백을 사용한다.

초기 `exec-775bc197-6a98-4e4b-9af2-a34208f072af.png` 금빛/RPG 시안은 사용자 반증으로 **런타임에서 제외**했다. 로컬 output의 `rejected-rpg-atlas.png`와 이전 `correct-animation.gif`는 기각된 이력이다.

효과음은 `public/sounds/learning/{tap,correct,retry,complete}.mp3` 총24,955B. `scripts/generate-learning-sounds.mjs`가44.1kHz stereo 원본 합성 후 FFmpeg libmp3lame으로 압축한다. 목재/마림바 envelope, peak.16–.32, PCM clipping 없음. 외부 샘플·학습 발음 생성 없음. 실물 iPad 청취/자동재생은 별도 검증 필요.

로컬 Vite `/learning-effects-preview.html`은 제품 route가 아닌 검수 entry다. TTS 생성·계정·진도 요청 없이 실제 공통 렌더러/쓰기 캔버스/피드백/효과음을 사용한다.

[작업 기록](../../../../../docs/work/phonics/tasks/20261012-learning-game-effects.md)
