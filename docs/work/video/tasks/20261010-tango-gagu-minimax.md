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

## 후속 · MiniMax 전체 조립 구간 생성 중

- 사용자 승인: 네 블록 조립 후 기쁜 반응을 MiniMax로 실사 영상화. imagegen으로 네이티브 각 안착 렌더의 시작/끝 사진을 제작, FL2VA int8·20step·640×800·124frame 구간별 생성.
- 사용자 반증: 실사 완성 사진의 ㅜ가 첫 가 그룹 아래로 이동. 해당 후보 `state-4-rejected.png` 제외. 둘째 ㄱ 바로 아래 같은 열로 위치 수정 후 좁은 직사각형 몸체까지 수정한 `state-4.png` 선택. 원본 Blender 좌표는 맞으며 사진 생성에서 이탈한 것.
- 추가 반증: 첫 두 영상은 foreground 오른손이 쉬고 far-left 왼손이 움직임. 완료본에서 제외. 본 작업만 대조 후 세 번째 prompt 취소, 네 번째 대기 prompt 삭제. 다른 GPU 작업/서버는 중단하지 않음.
- 재시도: imagegen 국소편집으로 far-left 왼손 끝만 지우고 기존 foreground 오른손 보존한 `right-state-0..4.png` 제작. 오른손 한 개만 보이는 구간으로 재생성. 배치뿐 아니라 손 집기/글자/블록 생성·소멸을 검수해야 한다.
- 반응은 `render_tango_reaction.py`로 별도65mm 근접 카메라의 native frame200/265 렌더. 같은 기존 가상 아이 사진을 identity로 imagegen 실사화. 보드가 crop 밖인 얼굴/양팔 컷이며 원본의 새로운 카메라 구도다.
- 작업 경로 `D:/ComfyUI-output/virtual-parenting-20261006/tango-minimax-sequence/`, 실행 그래프·prompt/keyframes/실패 후보 보존. 생성 중이며 최종 조립·음원·전체 검수는 아직 완료하지 않음.
- 한 손 참조만으로도 MiniMax가 far-left에서 새 조작손을 생성했음(`right-segment-1`). 단순 negative prompt로 손 identity 고정되지 않음. 오른손이 이미 해당 tile을 잡고 있고 같은 forearm이 bottom foreground로 연결된 `grip-state-0..3`으로 다시 시작/끝 제약. 구간 간 손 위치는 hard cut의 준비 자세이며 연속 한 테이크라고 보고하지 않는다.
- 반응 첫 후보 `right-segment-5`는 0.5~3.75초 공중 한글 block overlay를 생성해 제외. 보드가 crop 밖인데 prompt에 four blocks/가구를 언급한 것이 오해를 유발한 것으로 추정. 새 reaction prompt는 face/arms/room만, 글자/overlay/object 없음으로 생성.
- imagegen endpoint 편집 중 spare glyph/위치와 held body가 달라지거나 duplicate 발생. 원본 전체 CAD의 실측 일치가 보장되는 사진이라고 보고하지 않는다. 움직일 네 자모/board count/최종구의 세로 배치/손 수를 우선 검수하며 spare 부분의 미세 불일치는 별도 한계로 남긴다.

- grip 구간1..4 생성/전체decode/0.25초 간격 각21표본 검수: foreground 오른손 한 개만 움직이고 최종 board count1/2/3/4. 마지막ㅜ는 둘째ㄱ 아래 같은 열에 안착 후 유지. 실제 release 시각2.5/3.0/3.75/3.3초를 편집 후 sound onset 계산에 사용. reaction 새 후보만 아직 대기.

## 전체 시안 완성 및 사용자 반증

- 다섯 grip-segment1..5 선정, 첫 네 구간 1.5배속/마지막 반응 정상 속도로 19초·640×800·24fps·456frame 영상 조립. 실제 게임 음원 포함. `tango-minimax-sequence/tango-gagu-minimax-sequence.mp4`, SHA256 `6b513e3458a0224290b4dd9c90a1730d3dce720f7c1113d4924368168e69a03e`. 전체decode 및 0.25초 간격76표본, 반응 두 손/공중글자 없음 확인. 원본 렌더·사진·3D 세 칸 localhost5191/tango-minimax-sequence.html.
- 사용자 평가: 전체적으로 괜찮지만 컷 사이 어색함과 테이블 형태의 미세 차이를 지적. 독립 생성된 사진/영상의 공간 변화이며 전환 효과로 해결했다고 보고하지 않는다. 기존 19초를 시험본으로 보존.
- 이어 사용자 확정: 반응에서 별도 정면 카메라로 바꾸지 않고, 촬영하는 엄마 쪽으로 아이가 뒤돌아 웃으며 기뻐하기. 현재 detail camera는 얼굴이 crop 밖이고 아이 앞쪽이므로, 기존 native `Tango over-shoulder`를 기반으로 손·교구·머리가 함께 보이는 뒤 사선 구도로 수정. 마지막 블록 안착부터 반응까지 한 생성 구간으로 제작 중. 이전 세 컷의 테이블 변화까지 해결됐다고 주장하지 않는다.
- `render_tango_turnaround.py`: 원본을 보존한 별도 `tango-turnaround/native/fixed-camera-turnaround.blend`, camera37mm 위치(4.42,-.99,1.26)/target(3.88,-2.03,.65), 카메라 마커 전환 제거. 완성 후 팔은 테이블 휴식 위치 유지, head group이 엄마 카메라 쪽으로 회전·미소. frame153/197/270 원본 참고.
- 손 방향 사용자 재정정: 생성된 뒤 사선 사진에서 **화면 오른쪽에 보이는 손**이 블록을 조작해야 함. 담당자의 ‘화면 왼쪽이 오른손’ 설명은 사용자가 반증하여 폐기. image-left 조작으로 제출한 `a8630196-c4da-414a-b863-7c92f82430fb`만 실행 중 ID/filename 확인 후 interrupt, 완료본 제외. 사진과 동작 지시를 image-right 기준으로 수정.

## 완료 · 화면 오른쪽 손으로 마지막 블록 → 엄마 돌아보며 웃기

- 시작/끝은 같은 수정된 완성 사진의 imagegen 국소 편집. 최초 뒤 사진에서 네 블록 중 하나가 빠져 추가한 완성본을 기준으로 사용. 화면 오른쪽 손이 ㅜ를 든 시작 `exec-d2bdcca6-b304-4843-a598-0c45985a4304.png`, 엄마를 보고 웃는 끝 `exec-8dca5b02-a426-42d2-a6be-f2df78270271.png`. 반대손 시작은 제외. 원본/참조/선정 경로는 `tango-turnaround/source-ledger.json`, 생성 프롬프트 `prompt.txt`.
- MiniMax FL2VA int8·20step·LoRA 없음·seed202610502. 요청196frame에 실제 출력은209frame/8.708333초·640×800·24fps. 실행 `28ff2aa5-30e5-4e41-a670-dd088a639126`, 약11.5분. `tango-v8/video/tango_turnaround/final-tile-smile_00001_.mp4`, SHA256 `47e7ed7a366eb5854ff7c930ffca5be98c98b464ecfdcb56a4487f1400e63b45`.
- 전체decode와0.25초 간격35표본/3contact sheet 육안 검수. 화면 오른쪽 손만 ㅜ를 내려놓고2.75초에 release, 화면 왼쪽 손은 책상에 유지. 세 개→네 개, ㅜ는 둘째ㄱ 아래 같은 열. 약3.75초부터 머리·어깨가 돌아 약4.5초부터 카메라 눈맞춤/미소. 두 손·공중글자 없음, 마지막 블록부터 반응까지 같은 앵글·컷 없음. 사진/영상의 실제 CAD 치수·미세 글자 형상 일치까지 보장하지 않음.
- 기존 첫 세 컷과 연결한 수정본 `tango-turnaround/tango-gagu-turnaround.mp4`:19.083333초·458frame·H.264/AAC. SHA256 `5594f0530824d5f82775f743fe25101323011fb0915ffc0fea8dc7bf64a5c340`. 가5.458333초,구13.125초,정답13.673571초,가구14.173571초,칭찬15.244591초. 마지막 한 구간만 음원 포함 `final-tile-smile.mp4`. 앞 세 근접컷과 새 뒤 사선 장면 사이에는 전환/공간 차이가 남으며 전체를 한 테이크로 보고하지 않는다.
- Blender 원본은14초 단계 비교 `native-comparison.mp4`, 뒤 카메라 고정·테이블 위치 유지·엄마 방향 head 회전. 원본 mesh 이름의 left가 이 카메라에서 화면 오른쪽에 보이므로 해당 손을 움직이는 것으로 수정; legacy 명칭을 사용자 손 지시로 재해석하지 않음. packed blend의4K 재질 보존, GLB는1024px 웹 재질·36.6MB. 원본은 단순화된 인물 조형이며 사진급 인간 리그가 아님.
- localhost5191/tango-minimax-sequence.html: 수정 영상·원본 렌더·같은 GLB 카메라 세 칸, ‘ㅜ·구 완성’/‘아이 반응’/‘끝 모습’, 이전 다섯 컷 별도 페이지 보존. 실제 재생/음소거 해제,끝 모습19.033초/원본13.893초 동기화·3D·다운로드 확인. 기존 Python 기본 정적 서버의 seek 실패는 loopback byte-range 서버206 응답으로 수정, prefix/suffix range·브라우저 seekable 전체 구간 검증.
- 수정본 전체decode 성공,0.25초 간격76표본 추출·새 구간/경계 contact4..7 육안 검수; 처음 세 컷은 앞선 선정본 그대로. native14초 decode 성공. Python AST·HTML module `node --check`, 브라우저 재생 검수. 제품 코드 변경 없음으로 monorepo 테스트 생략. 검수 status/스크린샷/사진·영상·원본은 worktree `output/virtual-parenting/tango-turnaround`와 D드라이브 보존. 운영/R2 변경·외부 게시·push 없음.

## 두 블록 한 컷 · 원본 영상 참조 실험 시작

- 사용자 재반증: 수정본도 컷 사이가 이상함. 전체 공간 연속성 미해결. 사용자가 5초 두 블록 한 컷 시험을 승인(해봐).
- 설치 소스/object_info 확인: MiniMaxH3ReferenceToVideo는 ref_videos IMAGE batch와 VAE latent를 입력받음. 기존 FL2VA 첫/끝 사진 방식과 다름. FunControlNetApply 노드는 있으나 model_patches 가중치 없음. 원본 영상 참조는 soft conditioning이며 구조/동작 hard lock으로 보고하지 않음.
- 고정 뒤 사선 카메라·화면 오른쪽 손으로 ㄱ/ㅏ 놓기124frame 원본을 별도 Blender 파일로 생성. 기존 완성 사진을 외형 참조로 함께 사용하여 ref2va 시험 예정. 기존 전체 영상/원본 보존. 실제 결과 검수 전 성공 판단하지 않음.
- 원본 첫 렌더 검수에서 legacy 손 이름의 화면 방향 설명이 실제 투영과 달랐음을 확인. image-right는 native right mesh였으며 기존 요약의 반대 설명은 폐기. 첫 native 후보를 rejected-native-hand.png로 보존하고, 화면 오른쪽 팔을 실제 투영 확인 후 수정하여 다시 렌더. 생성 영상에 잘못된 원본을 사용하지 않음.
- 고정 원본124frame/5.166667초·512×640·24fps 생성/전체decode 및21표본 검수. 블록0→1→2, 같은 화면 오른쪽 손, 카메라/가구 고정. ref2va int8·20step·seed202610610 실행100df03c-3f89-4a48-9dab-bfd436e486ec 제출. MiniMax 출력은 아직 검수 전.
- 사용자 질문: MiniMax 시작/끝 이미지 지원 여부, 그리고 왜 다음 컷 시작을 앞 컷 마지막으로 이어도 튀는가. 실제 build_tango_minimax_sequence.py 확인 결과 첫 컷끝 right-state-1, 둘째컷시작 grip-state-1로 서로 다른 생성 사진이었다. 실제 출력 마지막 프레임을 다음 첫 프레임으로 재사용하지 않은 제작 누락을 사용자에게 명확히 인정. 컷경계 공간 변화의 직접 원인 중 하나. 향후 chaining은 실제 출력 끝 프레임 추출→다음 시작 동일 픽셀로 연결, 손 속도/방향 연속성은 별도 검수. 현재 승인된 한 컷 영상참조 시험은 계속 진행.

## 두 블록 한 컷 시험 결과

- MiniMax ref2va int8·20step·124frame·512×640·24fps, 약8분 생성. 실제 출력5.166667초/124frame. 원본 영상 전체가 ref_videos에서 VAE latent로 인코딩됐고 기존 완성 사진은 외형 참조. FL2VA 첫/끝 이미지 방식으로 바꿔치기하지 않음.
- 선정 시험 `tango-two-block-test/ai.mp4`, raw `tango-v8/video/tango_two_block_test/video-reference_00001_.mp4`, SHA256 `7bd1b7772b74982102e4d36a6bf5adcdf97dc4e02d31a0b51ba9a4040f97424c`. 원본/AI 전체decode 및 각각0.25초 간격21표본/2contact sheet, AI1.5/3.5/5초 full frame 검수. 빈 판→첫 블록→두 블록, 화면 오른쪽 같은 손 두 번 집기/놓기, 왼손 휴식, 컷 없음, 카메라/책상 안정성 확인. 원본의1.5/3.4초 배치에 가까운 두 번 조작이 반영됨.
- **부분 개선, 전체 정확도 미통과**: AI의 ㄱ/ㅏ 자모 획이 원본과 다르고 좁은 모음 블록도 정사각형에 가까워짐. 글자/교구의 정확한 CAD 재현이 아니며 native 재질/치수까지 동일하다고 보고하지 않음. 무음 동작 검증용. 이전19초 전체본 대체/최종 승인으로 취급하지 않음.
- 새5191/tango-two-block-test.html: 왼쪽 native 렌더/가운데 AI/오른쪽 같은 native GLB, 동시 재생·끝 상태 비교. GLB 원본37mm camera/124frame, script에서 고정 카메라를 자유시점 controls.update가 덮던 문제 수정. 원본/blend/GLB/graph/prompts/ledger/verdict/QA는 D드라이브와worktree output 보존.
- Python3개 AST, HTML module node--check, GLB36.5MB/카메라/20animation metadata 확인, 원본/AI ffmpeg전체decode 통과. 브라우저 두 영상5.166667초 seekable/동시 재생/끝 비교 검수. 기존 운영 제품/음원/R2 변경·외부 게시·main push 없음.
- 다음 판단: 한 컷 영상 참조로 연속 동작 개선 가능성이 확인됐으나 문자/하드웨어 정확성은 별도 해결 필요. 컷 제작 시 실제 출력 끝 프레임을 다음 시작에 재사용해야 함. 원본 전체 hard lock을 지원하는 모델/제어가 확인된 것은 아님.
- 브라우저 최종 비교에서 원본셋째블록이4.42초 이후 이전 전체조립 애니메이션을 따라 공중 이동하는 잔존동작 발견. native21표본 최초검수에서 놓친 문제. 5초내 두블록만 움직여야 하므로 셋째/넷째블록의 animation_data를frame1위치에서 제거하고124frame전수불변 assertion 추가. 최초시험 전체자산은 tango-two-block-test/v1 보존, 마지막28frame 재렌더/새native GLB·video 및 변경된파일명으로 ref2va 재생성. 이전부분개선 관찰은 최초후보이며 최종판은 재검수 전.

## 최종 선정 · 수정 원본 v2

- 셋째/넷째블록의 불필요한 애니메이션을 제거하고 원본 마지막28frame을 재렌더. 그 이전96frame은 해당 블록들이 움직이지 않는 구간이라 그대로 보존. 124frame전수 stationary assertion 통과. 원본native.mp4 SHA256 `6ac8d8d500a53d28ee4f58f3a09aa093b79f34ef29f2a6107340e0f8ca8b1d10`, native.glb36,516,136bytes/18animation. 첫시험과원본은 `tango-two-block-test/v1`에 보존.
- 수정 video input `tango_two_blocks_native_v2.mp4`로 실제새파일명을 사용하여 Comfy 캐시 오인 방지. 같은seed202610610/설정, 실행396f44f5-86ae-4dd1-92b9-6d553f883d3d,20step약6:51/전체약8분. 최종raw `tango-v8/video/tango_two_block_test/video-reference-v2_00001_.mp4`, 선정 `tango-two-block-test/ai.mp4`, SHA256 `e996fb0c65ffa713992a41277a6aa3a3c5da952aa040867d8261dd1523011e64`.
- 실제5.166667초/124frame/512×640/24fps. 전체decode와0.25초21표본/2contact sheet·끝5초full frame 검수. 첫시험과같이같은오른손으로두번조작·0→1→2블록·카메라/책상안정 확인. **자모획/모음블록형태 변형은남아정확한교구재현미통과**. 무음동작시험. 이전19초영상대체아님.
- 최종선정/수정원본/GLB/graph/ledger/verdict/검수/브라우저proof는worktree output과D드라이브. 두영상전체5.167초재생/끝비교·같은3D카메라 표시, Python AST3개/HTML module문법·diff검수. 로컬커밋만, 운영/외부게시/push없음.
