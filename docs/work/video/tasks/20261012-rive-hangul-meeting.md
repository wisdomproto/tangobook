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

2026-10-12 최종 시안에 “좋아. 이거 샘플만든걸 기록해두자. 다른 세션에서 해보게”라고 승인했다. 두 글자 만남 샘플은 완료된 참조본으로 보존한다. 다음 세션의 구체적인 변경 범위는 그 세션의 사용자 요청으로 정한다.

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

## 다른 세션에서 재개

제작 커밋은 첫 ㄱ 춤 `0737d233e`, ㄱ과ㅏ 만남 `91ead3bea`이며 현재 로컬 main에 있다. 원격에는 push하지 않았다. 다른 worktree는 이 커밋 포함 여부와 파일 존재를 먼저 확인한다. PID17456은 당시 실행 기록이며 다음 세션에서 실행 중이라고 가정하지 않는다.

| 참조 | 저장소 파일 |
|---|---|
| 승인한9초 샘플 영상 | [sample.mp4](../../../../output/rive-hangul-meet-20261012/sample.mp4) |
| 실제 Rive 런타임 파일 | [sample.riv](../../../../output/rive-hangul-meet-20261012/sample.riv) |
| 주요 동작12장 | [sample-contact-sheet.png](../../../../output/rive-hangul-meet-20261012/sample-contact-sheet.png) |
| 제작 당시 검수·해시 | [sample-verification.json](../../../../output/rive-hangul-meet-20261012/sample-verification.json) |
| 프로젝트 안내·제작 명령 | [README](../../../../output/rive-hangul-meet-20261012/README.md) |
| 편집 원본 | [scene.rml](../../../../output/rive-hangul-meet-20261012/scene.rml) |
| 몸통 참조·생성 프롬프트 | [ㄱ](../../../../output/rive-hangul-meet-20261012/giyok-body.png) · [ㅏ](../../../../output/rive-hangul-meet-20261012/a-body.png) · [프롬프트](../../../../output/rive-hangul-meet-20261012/image-prompt.txt) |
| 동작 생성·렌더·검수 코드 | [build_meeting.py](../../../../scripts/rive-hangul/build_meeting.py) · [render_preview.py](../../../../scripts/rive-hangul/render_preview.py) · [verify_meeting.py](../../../../scripts/rive-hangul/verify_meeting.py) |

이 컴퓨터의 실제 경로는 `C:/project/tangobook/output/rive-hangul-meet-20261012`다. 위 sample4개는 승인한 출력의 byte 그대로 복사한 Git 보존본이다. 원래-review 폴더의 GIF/180 PNG와 build 폴더는 로컬 출력이므로 새 checkout에는 없을 수 있다. 생성 이미지는 프로젝트 안에 이미 보존되어 있어 처음부터 재생성할 필요가 없다.

먼저 sample.mp4와 이 기록, 프로젝트 AGENTS.md를 읽는다. 그 다음 아래 명령으로 현재 RML을 확인한다. PowerShell에서 CLI 경로는 PATH에 등록되어 있다고 가정하지 않는다.

```powershell
Set-Location C:/project/tangobook
$riveSampleCli = Join-Path $env:USERPROFILE '.codex/tools/rive-cli/rive.exe'
& $riveSampleCli --version
& $riveSampleCli output/rive-hangul-meet-20261012 --verify
& $riveSampleCli inspect output/rive-hangul-meet-20261012 --summary
```

수정은 `build_meeting.py`에서 하고 `python scripts/rive-hangul/build_meeting.py`로 RML을 다시 생성한다. 생성된 RML만 수정하면 다음 실행에서 사라진다. 빌드 스키마는 CLI `schema`/`docs`로 조회한다. 검증 후 native preview를 백그라운드에서 한 번 실행하며, 이미 같은 프로젝트의 preview가 실행 중이면 재사용한다. `rive push`는 미리보기 명령으로 쓰지 않는다.

프리뷰를 다시 만들 때는 프로젝트 README의 render 명령 후 verify_meeting.py를 실행한다. 이 스크립트는 현재9초/20fps/180프레임 기준이므로 길이·fps·파일명을 바꿀 때 검수 기준도 함께 갱신한다. 원본 이미지는 RGBA로 보존하고 새 글자는 기존ㄱ/ㅏ를 스타일 참조로 제공한다. 사용자 지정 image skill을 이어 사용하는 경우 내장 imagegen을 쓴다.

보존할 모양은 ㄱ의 오른쪽 끝이 아래로 내려가는 획, ㅏ의 중앙에서 오른쪽으로 나오는 단 하나의 가로획, 가 결합 때 자음 왼쪽·모음 오른쪽 배치다. 음원·클릭 입력·State Machine 상호작용·앱 연결은 아직 구현하지 않았다. 샘플 승인만으로 후속 기능이나 외부 업로드까지 승인받았다고 해석하지 않는다.

다른 세션에 전달할 문장: **“docs/work/video/tasks/20261012-rive-hangul-meeting.md를 읽고, 승인한 Rive ㄱ+ㅏ→가 샘플을 이어서 작업해 주세요.”**

## 후속 논의: Rive와 Remotion으로 학습 영상

2026-10-12 사용자는 [토도한글 모음ㅡ 영상](https://www.youtube.com/watch?v=KHnjMPMT0GA)과 [ㅇ쓰기 쇼츠](https://www.youtube.com/shorts/x8hKK6g8Www)를 제시하고, Rive를 Remotion과 합쳐 이 정도 영상을 제작할 수 있는지 물었다. 두 영상의 브라우저 재생 표본을 확인했다. 첫 영상에는 textured 배경/손전등 소품/글자와 눈 등의2D 연출, 쇼츠에는 글자틀·손가락 이동·과일 순차 등장·제목 표시가 보였다. 전체 영상·음원의 전수 검수나 제작 도구 판별은 하지 않았다.

이 정도의2D 화면 구성은 Rive 캐릭터 동작과 Remotion 장면·쓰기 경로·자막·오디오·영상 합성으로 구현 가능하다는 기술적 판단이다. [공식 @remotion/rive](https://www.remotion.dev/docs/rive)와 [RemotionRiveCanvas](https://www.remotion.dev/docs/rive/remotionrivecanvas)는 Rive 애니메이션을 Remotion 시간에 맞춰 재생하며, [evolvePath](https://www.remotion.dev/docs/paths/evolve-path)는 SVG 획을 순차 표시한다. 단순 쓰기 장면은 Remotion/SVG로도 구성할 수 있고, Rive 캐릭터는 앱에서 재사용할 수 있다.

현재 packages/remotion에 Remotion 기반은 있지만 @remotion/rive 의존성·통합 컴포지션은 없다. 이 샘플의.riv 실제 브라우저 런타임 호환·Remotion 렌더·오디오 동기화는 아직 시험하지 않았다. 다음 구현 요청 시 짧은 연동 컷으로 먼저 검증하고, 글자별 쓰기 경로/표정·행동/낱말 삽화/명료한 발음과 박자를 제작한다. 이번 대화는 가능성·구성 검토이며 후속 영상 구현이나 플랫폼 방향 변경을 확정한 것이 아니다.
