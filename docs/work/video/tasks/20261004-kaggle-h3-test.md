# Kaggle 무료 GPU MiniMax H3 시험

- id: 20261004-video-kaggle-h3-test
- domain: video
- status: complete
- updated: 2026-10-05
- base: 54261355
- branch: codex/video-rapunzel
- output: D:/tangobook-video/kaggle-h3-test-20261004/
- integration: 미통합
- delivery: 시험 평가 완료(클라우드 제작 적합성 미확인), main push/운영 영상 변경 없음

## 요청과 완료 조건

사용자는 로컬 RTX4070과 Kaggle에서 장면을 나눠 생성하고 덜 압축된 H3도 검토하자고 했으며, 로그인/인증 완료 후 실제 테스트를 요청했다. 무료 GPU에서 기존 H3 장면을 생성하고 시간·메모리·출력 검증을 기록한다. 성공 이후 W6A8 비교를 진행한다. 실행 전 호환 가능성을 성공으로 보고하지 않는다.

## 읽은 기억과 변경 범위

영상 BRIEF/MEMORY, 라푼젤 완료 기록, 루트 CLAUDE의 영상 진입점, longform-video CLAUDE, video-producer 및 browser/agent-reach/hyperframes 진입 지침 확인. 기존 제작 파이프라인의 GPU 시험이며 HTML 영상 프레임워크로 옮기지 않는다. 제품 코드·완성 영상·R2·DB는 변경하지 않는다.

## 결정과 진행

- 사용자 후속 “라푼젤 말고 잭과 콩나무로 가자”에 따라 GPU 시험 장면을 잭과 콩나무로 변경한다. 라푼젤 그래프/참조 셀 실행 전 Run All을 취소했고 모델 다운로드만 재개한다. 실제 운영 잭 책/캐릭터 참조와 그림체 확인 후 동일 Jack 입력으로 로컬/원격을 비교한다. 라푼젤 완성 네 편은 보존한다.
- 후속 제작의 도입 후보는 실제 원고13쪽 “엄마, 빨리 도끼를 주세요! 거인이 내려와요!”의 위기다. 현재 등반 시험 컷은 중간 장면용이며 완성 영상의 초반 훅으로 정하지 않았다.
- 잭 운영3권을 읽기 전용 조회, 페이퍼아트1772510956605의5쪽/7쪽/12쪽/13쪽과 기존 잭 시트 contact를 실제 확인했다. 5쪽 잭의갈색머리·초록patch tunic·베이지바지·갈색부츠·콩나무와종이질감 유지로 시험 참조 선정. 참조를 새로 그리거나 그림체를 바꾸지 않는다.
- 잭5쪽 콩나무를 두 걸음 조금 오르는 1024×576/141frames/24fps/8steps/seed610450 그래프 작성. local Comfy8190 queue 비어 있음 확인 후644c8ba5-bcdd-4dbc-9b0b-a0a188f3ccef 제출, RTX4070 실제GPU89%/메모리10766MiB 관찰. D:/tangobook-video/kaggle-h3-test-20261004/local-test-state.json에 상태를 기록하며 원격 동일 입력 비교 전 실행 성공을 단정하지 않는다.
- P100은 Kaggle 공식 공지상 2026-09-15 종료. 오래된 notebooks 사양 문서에 아직 남아 있으므로 선택 가능하다고 판단하지 않는다.
- 처음 연결된 Codex 브라우저는 비로그인. 사용자가 일반 Chrome에서 인증했다고 알려준 뒤 Codex 브라우저에도 로그인했고 실제 계정 세션 확인.
- Kaggle 시험 노트북: https://www.kaggle.com/code/kiljoongkim/tangobook-minimax-h3-gpu-test/edit . GPU T4 x2 선택 가능, 활성화 안내에서 무료 30시간 잔여 확인. P100 옵션 없음. Internet on.
- 기존 로컬 라푼젤 escape 참조 PNG 한 장과 그래프를 비공개 시험 노트북에 포함. 책 전체 JSON/나레이션/완성본/토큰은 업로드하지 않는다.
- 비교 입력은 1024×576, 141프레임/24fps, 8steps, seed610450. diffusion W4A8, Qwen3VL32B NVFP4 AWQ, 원래 FP16 video VAE/FP32 audio VAE, 기존 Turbo v4 LoRA의 동일 AdaLN 호환 필터.
- ComfyUI는 로컬 검증 revision8ff6dc384ba5c410266b40e137799e049459d4f2에 고정. T4는 native BF16/FP4가 없으므로 FP16 및 PyTorch attention을 명시하고 양자화 fallback 실동작을 확인한다. GPU0 한 장부터 시작하며 두 장의 메모리가 자동 합쳐진다고 가정하지 않는다.
- scripts/build-kaggle-h3-test.py로 7cell 노트북 작성. 모델은 공개 Hugging Face 원본에서 임시 디스크에 다운로드하고 revision/SHA/크기를 기록한다. Comfy API는 loopback만 사용하며 public tunnel/유료 서비스 없음.
- 최소40GiB 임시 디스크 확인, 단일 생성60분 제한, 실패/성공 모두 Comfy 시험 프로세스 종료. Kaggle 세션은 결과 보존 후 별도로 정지해야 무료 시간이 더 소모되지 않는다.
- 실제 할당 preflight: PyTorch2.11.0+cu128 / CUDA12.8, 시스템RAM31.3468GiB, TeslaT4 두 장 각각14.5622GiB·compute capability7.5. 최소 디스크/GPU 검사 통과. Share에서 Private 라디오 선택 확인. 환경 설치 실행 중.
- 모델5개(11.77GB diffusion/15.69GB encoder/5.21GB videoVAE/0.605GB audioVAE/0.780GB LoRA) 다운로드/SHA 및 동일 LoRA 호환 필터 완료. 기존 Rapunzel 참조셀을 Jack5쪽 PNG와 Jack climb 그래프로 교체·DOM에서Jack 포함/Rapunzel 미포함 확인 후 참조셀부터실행. Comfy서버32.252초 후 READY, prompt58ca21b7-0180-4f78-ac93-fc1163ce06a1 생성 시작. 0.5분 표본T4 GPU0 메모리6791MiB/연산43%, GPU1 미사용. 두 환경 동시 생성 중이며 아직 결과미디어/품질 확인 전.
- 로컬 ComfyUI0.37.4 및 comfy-kitchen0.2.35 소스에 W6A8 처리 이름이 없어 W6A8은 이 런타임에 모델 파일만 추가하는 방식으로 시험하지 않는다. 필요한 호환 런타임 업데이트를 별도로 확인해야 한다.
- 로컬 history 조회가 한 번60초 timeout으로 종료됐지만 Comfy 작업은 유지됐다. receipt의 기존 prompt ID를 재사용해 조회만 재개하도록 local runner를 고쳤다. 새 prompt를 중복 제출하지 않았다. notebook builder도 일시적인 history 조회 지연을 재시도하도록 보완했으며 기존 실행 중 셀은 중단하지 않는다.
- 표준 Kaggle 로그를 보존해 실제 FP32 fallback을 확인했다. H3 원본의 supported_inference_dtypes는 BF16/FP32뿐이다. --fp16-unet을 줘도 T4에서는 manual cast가 FP32가 된다. 두 단계에 24분55초(단계당 약747.52초)가 걸렸으며 완료 가능성을 GPU100%만으로 판단하지 않는다. 시험을 중단하고 로그 ZIP을 로컬에 저장했다.
- Kaggle 임시 Comfy 소스의 H3 dtype 선언에만 FP16을 추가하는 별도 실험을 시작했다. 컴파일 기능을 끄고 같은 PNG/그래프/8steps/seed로 재시험한다. 원본 소스 SHA·수정 소스 SHA·플래그를 report에 기록한다. 로컬 모델/코드에는 dtype 변경을 적용하지 않는다. 이 설정은 정식 지원이나 장면 품질 보증이 아니며 전체 decode·검은 프레임·육안 검수 전에는 성공으로 취급하지 않는다.
- 로컬 첫 결과 jack-climb-local-w4a8.mp4 저장·전체141프레임 decode 완료. 원본 log의 총 실행39분17초, 첫 샘플32분31초, 이후 단계 약45초. HTTP listener에서 WinError64가 발생하여 최종 파일의 수정 시각 기준2358.25초와 SHA를 기록하고 파일로 회수했다. 이 지연 포함 수치를 평소 생성 속도 또는 하드웨어만의 차이로 해석하지 않는다.
- Voicebox qwen-tts-1.7B loaded를 확인했다. /tasks/active의 generations가 비어 있는 것을 확인한 뒤 일반 unload를 요청했으나 지연됐고, 첫 영상 완료 후 모델별 unload가 성공하여 loaded 모델0개를 확인했다. 초기 지연이 반복되므로 Voicebox 하나만 원인이라고 단정하지 않는다.
- 로컬25개 동작 표본(0.25초 간격 및 마지막 프레임)을 실제 확인했다. 단일 잭/기존 종이 질감, 손을 뻗고 발을 옮기는 동작, 구름/잎 움직임이 보이며 검은 프레임/인접 동일 프레임0개다. 고정 카메라 지시와 달리 콩나무를 도는 카메라 연출이 나타나므로 제작 후보와 정확한 프롬프트 준수를 구분한다. 최종 네 영상 또는 사용자 승인 상태가 아니다.
- 첫 파일 보존 후 기존 인자의 Comfy8190 listener를 복구했다(자동 브라우저 열기만 비활성). 음성 모델이 내려간 조건에서 같은 Jack 그래프를 새 e01f87c4-7d35-4ecd-a28b-65900979ef17로 재시험 중이다. cold 초기화 지연이 반복되는지와 후속 계산을 구분한다.

- 사용자 질문에 따라 LoRA 동일성 확인: 로컬/Kaggle 원본 Turbo v4 step600 EMA의 SHA256이 모두 5f3a626cd72c93a8b9318d6760c510bc5092d2ab13aaba1f932c5bab07a416d3으로 일치한다. 두 환경 모두 강도1.0·8steps 및 동일 AdaLN102tensor 제외/416tensor 유지 필터를 사용한다. 로컬 필터 결과 SHA256은 dd9a480189cb799423d6e2b4d8e9ef860df0631ab76403f49019c89a3f2d056a이며 Kaggle 결과 export에도 최종 파일 해시 기록을 추가했다. 최종 필터 파일의 클라우드 해시는 생성 종료 후 회수할 예정이다. T4 FP16/컴파일 비활성 실험은 LoRA 교체가 아닌 계산 환경 변경이다.

## 최종 결과 (2026-10-05)

- 로컬 clean 재시험은 receipt1701.24초(28분21초 polling 포함), Comfy log28분04초에 저장 완료. 1024×576/24fps/141프레임 전체 decode, 검은 프레임·인접 동일 프레임0개. 25동작 표본 실제 확인: 종이 질감·잭 캐릭터·등반 유지, 후반 뒷모습 및 카메라 orbit. 저장 위치 jack-climb-local-clean-w4a8.mp4, SHA cfced91b572426b42e6727f8858be918c7d26ecca2b523f61fd416e48745eec7.
- Kaggle FP16 실험은8steps34분14초, 전체36분50초 후 SaveVideo 오디오 avcodec_send_frame ArgumentError22. 남은18554byte MP4는141프레임 decode 가능하지만 모두 RGB0 검은 화면이다. 단순 오디오 mux 문제로 판단하거나 무음 저장만으로 해결됐다고 주장하지 않는다. FP16 수치 실패의 정확한 내부 원인은 미확인이다.
- kaggle-fp16-results.zip에 source hashes·설정·history·logs·실패 MP4 회수. 최종 LoRA 파일 SHA는 로컬과 다르지만 metadata/원본/필터 규칙 및 모든416tensor의 이름·dtype·shape·raw bytes digest가 86ec6837e97dd825575095ce511acfe42063b603652d6bb2f7d8aeb1dc1efef6으로 일치한다. 파일 직렬화 차이는 가중치 차이로 해석하지 않는다.
- W6A8은 정상 기준 출력 미확보로 실행하지 않았다. T4에서 H3를 제작용 병렬 자원으로 쓰거나 더 좋은 모델의 영상 품질을 확보했다는 결론은 내리지 않는다. 표준 FP32의 전체8step 품질도 미검증이다.
- Kaggle QuickSave는 원본 embedded PNG 때문에 source1MB 제한에 한 번 실패했다. 참조 셀을 /kaggle/working/jack05_h3_climb.png 재업로드/동일 SHA 검증 방식으로 변경 후 Version1 저장 확인. 원본 PNG/전체 embedded notebook은 로컬에 보존한다. 다음 세션 실행 전에 원본 PNG를 해당 경로에 올려야 한다. 실제 시험 입력은 바뀌지 않았다.

- 로컬 결과/로그 ZIP 보존 및 Version1 Successful 확인 후 Kaggle 세션 종료. UI의 Start session 버튼으로 정지 확인, kaggle-stopped.png 저장. 무료 할당 UI 사용량 약1시간39분. 더 이상 시험 GPU가 돌고 있지 않다.

## 검증

- 노트북 생성 후 모든 Python cell compile 성공. 실제 GPU 결과는 위 최종 결과 참조. 클라우드 실패 파일도 전체 decode하여 검은 화면을 확인했다.
- 성공 조건: 저장 MP4 전체 decode 및1024×576/141frames/24fps, 이후 실제 동작 표본 육안 확인. 생성 시간은 모델 다운로드/환경 구성 시간과 구분한다.

## 다음 행동

T4 FP16 설정을 제작에 적용하지 않는다. 추가 클라우드 시험은 BF16 지원 GPU 또는 별도 수치 안정성 해결 후 검토한다. 기존 로컬 후보와 사용자 작품별 컨펌 규칙을 유지한다.
