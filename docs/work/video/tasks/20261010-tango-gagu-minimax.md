# 탱고 블록 ‘가구’ 맞추기 · MiniMax

- 사용자 요청: 기존 가상 아이/집/최신 탱고 교구 사진으로 블록 단어 맞추기 영상을 MiniMax로 제작.
- 브랜치: `codex/marketing-virtual-parenting`; 앞선 자산 [Blender 장면](../../marketing/tasks/20261009-tango-native-scene.md).
- 로컬 ComfyUI MiniMax H3 ReferenceToVideo, 기존 `C:/projects/comfy_test/.claude/worktrees/minimax-image-reference-video-322eac/scripts/minimax_r2v.py` 재사용. 사용자 지정 모델이 우선하므로 HyperFrames 합성 인터뷰/새 프레임워크 도입 없이 생성 클립 자체를 제작한다.
- 한 컷, 세로512×640,24fps,약6.58초(158프레임). 오른손으로 마지막ㅜ를 살짝 들어 같은ㄱ아래에 놓는 단일 동작. 전체 네 자모를 연달아 옮기는 복잡한 동작은 시안에서 제외.
- 참조: `tango-v8/detail-photo-v5.png`; 같은 화면·교구·노란블록/흰스티커·검정글씨, 쉬는 왼손과 조작 오른손 두 개, 여분 블록 보존.
- 프롬프트: `scripts/virtual-parenting/tango-gagu-video-prompt.txt`. 로컬 출력: `D:/ComfyUI-output/virtual-parenting-20261006/tango-v8/video/`. 운영 데이터/외부 게시 변경 없음.
- 진행 중: 8188/8189 둘 다 꺼져 있어 기존 ComfyUI를 숨김으로8189에서 실행했다. 다른 GPU 프로세스는 중단하지 않았다. 생성 후 행동/문자/손/프레임 연속성 검수 필요.
- 첫 후보 w4a8 mixed 모델은 Turbo LoRA adaln_proj 가중치 shape 오류가 반복되어 해당 prompt만 interrupt했다. 실제 실행 서버0.37.4에서도 이 조합은 사용하지 않는다. 기존 검증 int8_convrot 모델로 재제출. 단순 버전 지원 여부와 LoRA 호환성은 다르다. 실행 그래프는 `tango-gagu-video-workflow.json`에 저장.
- int8 후보도 같은 Turbo LoRA shape 오류를 보여 본 작업 prompt만 interrupt했다. 최종 생성은 w4a8 mixed 기본모델·20step·LoRA 없음. 기존 Turbo8step 흐름은 현재 설치 버전과의 호환성 추가 수리 전 재사용하지 않는다. 두 취소 시각의 queue prompt ID를 대조해 다른 작업은 취소하지 않았다.
- 기본 R2V 6.583초는 약4분 생성, 전체decode/0.25초간격26표본 검수. 손의 집기/놓기 동작은 나왔지만 끝에서 네 블록이 가로 한 줄로 재배열돼 실패. `tango_gagu_base_00001_.mp4`를 실패본으로 보존한다. 원본 참조만으로 자모 구조 고정은 보장되지 않는다.
- 후속은 설치된 `MiniMaxH3ImageToVideo`의 first_frame/last_frame을 실측 object_info로 확인해 FL2VA int8 모델·20step·124frame(5.167초)·무음으로 변경. 마지막 사진은 imagegen 국소편집으로 작동 오른손/소매만 철수, 나머지 배치 유지 확인. 시작과 끝 이미지로 ㄱ 아래ㅜ를 고정하고 동작은 블록을 누른 뒤 손을 빼는 것으로 단순화. `tango-gagu-fixed-workflow.json`/`tango-gagu-fixed-prompt.txt`와 `video/end-frame.png` 보존. `run_tango_video.py`는 기존 runner의 schema검증/queue/run을 재사용한다.

## 완료 · 마지막 블록 눌러 완성하는 시안

- 선정: `D:/ComfyUI-output/virtual-parenting-20261006/tango-v8/video/tango-gagu-minimax.mp4`, 동일 사본 `output/virtual-parenting/tango-v8/video/tango-gagu-minimax.mp4`. SHA256 `cf1ec3dcc5ad9167dfca31263a524e22af89cc1eadd4c1df1c2be34d8d2126db`,177804bytes,512×640,H.264,24fps,124frame,5.166667초,오디오 없음.
- FL2VA 후보는 약3.5분 생성. 전체decode 성공; 0.25초간격21프레임의 2contact sheet 육안 검수. 0~2초 작게 누르기, 2.5~3.5초 오른손/소매가 화면 밖으로 나감, 끝까지 ㄱ아래ㅜ·네 자모/여분블록/가구 단어/그림 유지. 제3손/가로재배열은 보이지 않았다. ‘전체 단어를 처음부터 조립’하거나 ‘블록을 집어 이동’한 영상으로 보고하지 않는다. 카메라 고정 단일 동작 시안.
- 재생 페이지 `http://127.0.0.1:5191/tango-video.html` 생성. 브라우저 controls 재생·영상5초·다운로드 링크 확인. 기존 사진/3D 페이지 보존.
- 생성 재현: ComfyUI input에 `tango_gagu_detail_v5.png`와 `tango_gagu_end.png`를 넣고 `python scripts/virtual-parenting/run_tango_video.py scripts/virtual-parenting/tango-gagu-fixed-workflow.json`. 모델FL2VA int8·20step·LoRA없음. 검수는 `inspect_tango_video.py`, 선택본 반영은 `prepare_tango_video.py`.
- Python AST/실제 ComfyUI schema 검증, FFprobe/FFmpeg 전체decode, 사진 표본/브라우저 검수. 제품 코드 변경이 없어 monorepo 테스트는 실행하지 않았다. 외부 업로드/운영 데이터/게시/push 없음.
