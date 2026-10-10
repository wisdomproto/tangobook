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

## 후속 · 처음부터 조립하는 Blender 동작 원본

- 사용자 반증: 기존 영상의 스티커 글자가 흐림. 글자 굵게, 빈 판에서 ㄱ→ㅏ→ㄱ→ㅜ를 하나씩 오른손으로 놓기, 실제 게임 음원, 완성 후 아이의 기쁜 반응 요청. 이전 눌러 완성 시안을 이 요청의 완료본으로 사용하지 않는다.
- 기존 `family-home-tango-v8.blend`를 읽어 별도 `family-home-tango-sequence.blend` 제작. 노란 몸체/흰 스티커/검정 Malgun Bold 유지, 벡터 획 offset 0.45mm·글자 크기21→26mm 설정 후 스티커 범위에 맞춤. 기존 집·CAD·가구 단어/그림 유지. 마지막ㅜ는 기존ㅏ 스티커 블록을90도 돌려 둘째ㄱ 아래 같은 열에 놓음.
- `build_tango_sequence.py`의 build/preview/render/export/validate 모드. 각 블록1.5/3.4/5.3/7.2초에 안착, 테이블에서 들어 이동해 내려놓음. 기존 손/손가락을 각각 한 root에 묶어 두 손 유지. 조작은 실제 오른쪽 어깨(world-X)에 연결. 쉬는 왼손은 집는 영역에서 이동. 근접 카메라38mm,8.208초에 정면 사선42mm 카메라 전환,9.35초부터 웃음 곡선·양팔 들기·작은 손 흔들기. 인물은 기존 단순화된 네이티브 조형이며 실사 인물 모델이 아니다.
- 실제 코드 확인: `KoreanBlockPlayer.tsx`는 새 음절을 읽고 마지막 음절을 정답 처리로 넘김. `useGameAudio.ts`는 마지막 음절 종료→정답 효과음→500ms→단어 발음 종료→한국어 칭찬 종료. `phonics-library.service.ts`의 한국어 단어는 음절 사이 무간격 연결.
- `fetch_tango_game_audio.mjs`는 기존 R2 음원만 읽음(GetObject/ListObjects). 가/구는 `phonics-library/mod_korean/가.mp3`, `구.mp3`; 칭찬은 기존 한국어 정답 pool의 `cm_positive_correct1.mp3`; 효과음은 repo `packages/client/public/sounds/game/correct.mp3`. 로컬에서 가+구를 무간격 WAV 연결, 새 TTS/원격 데이터 생성 없음. 음원 출처·SHA256은 로컬 `tango-sequence/audio/sources.json`.
- 음원 시작: 가3.4초,구7.2초,효과음7.748571초,가구8.248571초,칭찬9.319591초. FFprobe로 읽은 실제 길이에 따라 계산. 영상은800×1000,H.264,24fps,336프레임,14초,AAC음성. `prepare_tango_sequence.py`로 FFmpeg delay/mix/mux. SHA256 `24a0875d0a0217b2048cc5727a3760f1925738c49d88824d7ebbfdc702470069`.
- 결과 `D:/ComfyUI-output/virtual-parenting-20261006/tango-sequence/tango-gagu-3d.mp4`, 원본 blend는 상위 폴더. workspace `output/virtual-parenting/tango-sequence/`에도 영상/manifest/시작·반응 샷 복사. 이전 MiniMax 영상 보존.
- `http://127.0.0.1:5191/tango-sequence.html`: 왼쪽 음원 포함 원본 영상/오른쪽 동일 애니메이션 GLB, 재생 시간에 맞춰 동기화, 같은 촬영 카메라와 Orbit·카메라 프러스텀 보기. 카메라 검색은 기존 Carousel detail을 제외해 Tango 이름까지 대조. LoopOnce 종료 후 재시작이 멈추는 문제를 피하려고 시간 고정·마지막 프레임 clamp 사용.
- 검증: Blender 원본의13개 블록/두 손/각 안착 프레임 좌표/세로 구/스티커 글자 범위/최종 웃음·양팔 검사 통과. FFmpeg 전체 영상decode,0.25초 간격56프레임/5contact sheet 육안 검사. Python AST·Node 문법 검사. 제품 코드 변경 없음, monorepo 테스트 생략. 다음 실사화는 이 동작 원본의 시작/끝 프레임을 사용해 구간별로 검수해야 함. 아직 전체 동작 MiniMax 실사 영상이 완성된 것은 아님.
- 브라우저 검수: 실제14초 재생, 시작/완성 후 반응에서 좌영상·우GLB 동일 구도와 자세 확인. 종료 후 ‘처음부터 재생’ 시 영상/3D 모두 빈 판·원래 손 자세로 복귀. 사용자 출력 탭 보존.
