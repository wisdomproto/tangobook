# Rive ㄱ과 ㅏ의 만남

- id: 20261012-video-rive-hangul-meeting
- domain: video
- status: completed
- updated: 2026-10-12
- base: 0737d233e
- branch: main
- worktree: C:/project/tangobook
- integration: 독립 Rive 시안 원본·코드·기억 로컬 main 보존, 제품 코드 변경 없음
- delivery: 로컬 제작·검수 완료, 미푸시·미배포

## 요청·결정

사용자는 이전 ㄱ 춤을 “ㅋㅋㅋ 귀엽다”라고 승인한 뒤 “이제 ㄱ 이랑 ㅏ 만나는거 만들어보자”라고 요청했다. 기존 Rive·image skill 지정은 유지한다. 인사하고 다가와 하이파이브한 뒤 손을 잡고 나란히 가를 만들며 함께 뛰는9초 무음 반복 시안으로 구체화했다. 게임 구현 요청으로 확대하지 않는다.

## 제작·검수 진행

- 공통·video 인수인계, 이전 [ㄱ 시안](20261012-rive-hangul-character.md)과 제작 스크립트, 프로젝트 AGENTS 지침을 읽었다. 최신 플랫폼 방향을 변경하는 작업은 아니다.
- 기존 ㄱ 몸통은 그대로 복사했다. 내장 imagegen으로 같은 스타일의 민트색ㅏ 몸통을 생성했다. 세로획 중앙에서 오른쪽으로 한 획만 나오는 정확한ㅏ 형태와 RGBA 투명도를 육안 확인했다. 생성 원본은 C:/Users/kil21/.codex/generated_images/01a12e96-109b-7e71-9a4c-750a759e338c/exec-69ebe4de-35ed-4d35-be92-82b58be4028f.png. workspace output/rive-hangul-meet-20261012/a-body.png 및 image-prompt.txt에 보존했다.
- 기존 output/rive-hangul-20261012는 보존하고 별도 프로젝트를 생성했다. 두 이미지 몸통·native 얼굴/관절/학습 식으로 실제 RML을 작성했다. 두 손의 목표 지점에 맞춰 관절을 계산했고 부모 회전·스케일까지 반영했다.
- 첫 보행 키프레임 간격15frame은2Hz 다리 움직임의 영점만 표본화하여 보행이 약했다. 간격10frame으로 수정하고 실제 보행 렌더에서 다리 교차·기울기 변화를 확인했다. 이전 렌더를 중단하고 수정본 전체를 다시 렌더한다.
- 현재 최종 CLI verify0 errors/0 warnings, inspect problems[]; ImageAsset2, Node32, Shape95, keyframes1755, timeline/state machine 각1. `.riv`1,043,773bytes. 처음/하이파이브/최종가/보행 렌더를 육안 검수했다.
- 최종 실제 Rive180프레임 렌더(서로 다른 SHA179개), 960×720/20fps/9.000초 MP4346,666bytes 및640×480 반복 GIF2,745,204bytes 제작 완료. 12장 contact-sheet에서 인사/보행/하이파이브/손잡기/가완성/점프 구간을 육안 검수했다.
- 최종46개 keyed property 첫/끝 수치 일치. 두 손을 맞댄35개 키프레임의 손 중심 최대 간격0.000172px, 보행 다리 회전 범위0.4rad 초과를 검증했다. 키 사이 모든 순간의 완전 접촉을 증명한 것은 아니며 실제 렌더 표본에서 연결을 확인했다.
- advance1↔541 루프 경계 실제 PNG 평균 RGB 차이 각0.000097/255 이하. 미세 antialias 차이가 있으므로 byte 일치로 보고하지 않는다. 전체 MP4 decode 통과. 두 몸통1254×1254 RGBA alpha0~255, 기존ㄱSHA 동일. verification.json에 원본/RML/.riv/MP4/GIF 해시와 결과 보존.
- `.riv` SHA25622c95b1b1eebc4a4fed07ae4315e46b45edf239092939adcf6cfb63fe2fa5de3. a-body.png SHA2565150a0d493004b8c3414e64cf20588b6cae6b5cbfaaa418761b279b3fc384904. 생성 alpha·픽셀 보정 없이 사용했다.
- 제작 Python3개 py_compile, 문서·diff 검사 통과. 제품 코드 변경이 없어 monorepo 전체 테스트는 실행하지 않았다. git fetch origin으로 최신 기준을 확인했고 다른 원격 변경을 merge/push하지 않았다.

## 범위·인계

scripts/rive-hangul/build_meeting.py 및 verify_meeting.py를 추가하고 render_preview.py에 프로젝트·시간·fps 인자를 추가했다. 기존 인자 없는 ㄱ6초 렌더 기본값은 유지한다. 새 원본은 output/rive-hangul-meet-20261012, 프리뷰는 동일 이름-review 폴더다. Rive native 미리보기는 PID17456으로 한 번 실행했다. 계정 업로드·.rev·운영 등록·앱 연동·push 없음. 기존 다른 output/tmp/worktree는 보존한다.
