# Qwen Image 2.1 로컬 인어공주 삽화 비교

- id: 20260928-content-qwen21-mermaid-local
- domain: content
- status: integrated
- updated: 2026-09-28
- branch: main
- worktree: C:/projects/tangobook
- base: 2ab21124
- integration: main에 시험 결과 기록; 기능 코드 변경 없음
- delivery: 미푸시·미배포, 운영 책 변경 없음

## 요청과 범위

사용자가 Qwen-Image-2.1 양자화 구동 조사를 요청한 뒤 다운로드와 실행을 승인했다. 테스트 소재는 우리 인어공주 삽화이며, 추가로 Pruna 가속 LoRA를 확인하도록 요청했다. 기존 운영 삽화 교체나 외부 게시 요청은 없다.

## 결정과 진행

- RTX 4070 12GB, RAM 32GB. C드라이브 공간을 아끼기 위해 모델은 기존 D:/ComfyUI-models 하위, 출력·프롬프트·재현 스크립트는 D:/ComfyUI-output/qwen21-mermaid-test에 저장한다.
- Comfy-Org의 INT8 ConvRot 생성 모델·INT8 인코더·BF16 VAE 약 17.28GB, Pruna 8스텝 ComfyUI 변환 LoRA 약 336MB를 선택했다. 파일별 출처·revision·SHA256은 출력 폴더 manifest에 보관한다.
- Pruna v0.1은 원본보다 화질이 낮다고 제작자가 명시한다. 8스텝, CFG 1, 강도 1, 지정 sigma를 사용한다. 비공식 ComfyUI 변환은 alpha/rank 스케일을 보존하는 NidAll 배포본이다.
- 기존 C:/ComfyUI_windows_portable/ComfyUI는 76135e55에서 지원 버전 v0.37.4(8ff6dc38)로 전환, requirements 설치. Torch 2.11.0+cu130은 유지. extra_model_paths.yaml 및 기존 모델·커스텀 노드는 보존했다. 시험 서버는 127.0.0.1:8189, 커스텀 노드 비활성화로 실행했다.
- 업데이트 시 ComfyUI 자체 DB 마이그레이션이 asset catalog를 재구축했다고 로그에 기록했다. 이전 DB는 C:/ComfyUI_windows_portable/ComfyUI/user/comfyui.db.bkp에 자동 보관됐다. 이전 태그·메타데이터 등의 실제 사용 여부는 미확인이다.
- 운영 API에서 책 1772181399388(인어 공주_그림체2, paper-craft)을 읽기 전용 조회했다. 첫 장면과 주인공 참조 시트를 내려받았다. 오래된 description은 금발이지만 등록 시트와 삽화는 분홍 머리이므로 실제 이미지에 맞춘다.
- 동일 시트·장면 프롬프트·seed 20260928로 기본 INT8 25스텝과 Pruna 8스텝을 비교한다. 양쪽 모두 양자화 모델이므로 BF16 대비 손실을 검증하는 실험은 아니다.

## 검증과 다음 행동

모델 4파일 모두 배포 SHA256과 일치했다. 참조 기반 1376×768 RGBA PNG를 기본/Pruna 각각 2장 생성했다. 두 구성 모두 첫 실행과 재실행의 RGB 픽셀이 동일했다. 오류·OOM·LoRA 미적용 경고 없이 완료됐다.

| 구성 | 캐시 초기화 후 서버 실행 시간 | 표본 최고 GPU 메모리 |
|---|---:|---:|
| 기본 INT8, 25스텝 | 75.753초 | 11,256MiB |
| INT8 + Pruna, 8스텝 | 55.536초 | 11,256MiB |

두 측정 전 `/free`로 모델·노드 캐시를 비웠으며 history의 execution_cached가 빈 배열인 것을 확인했다. 시간은 execution_start→execution_success, 모델 로딩·참조 처리·저장 포함. 각각 1회이며 OS 디스크 캐시·드라이버 커널 캐시까지 초기화한 실험은 아니다. 이번 샘플에서 Pruna가 약 26.7% 짧았다. VRAM은 nvidia-smi를 약 3초마다 읽은 전체 보드 사용량으로 다른 앱도 포함되며 순간 피크를 보장하지 않는다.

최초 기본은 70.309초, 직후 Pruna는 참조 인코딩 등 노드 1~5를 재사용하여 23.634초였다. 이를 공정한 3배 가속으로 보고하지 않는다. 로딩·참조 인코딩이 차지하는 고정 시간이 커서 스텝 감소율이 전체 시간 감소율과 같지 않다.

육안: 기본은 분홍 머리, 청록/보라 비늘, 진주 장식, 종이공예 질감과 얼굴 인상을 잘 유지했다. Pruna는 같은 요소를 유지하지만 얼굴이 더 옆을 향하고 몸이 가늘어지며 인물 크기·머리카락 모양·배경 배치가 달라졌다. 본 실험은 단일 장면·seed이며 책 전체 일관성, 한글 렌더링, BF16 대비 양자화 손실을 검증하지 않았다.

출력: `D:/ComfyUI-output/qwen21-mermaid-test/mermaid_base25_00002_.png`, `mermaid_pruna8_00002_.png`. 폴더에 source JSON, 참조, 원본 페이지, prompt.txt, API 워크플로우, run-test.py, 결과 JSON, 로그, manifest, Start-Qwen21.ps1 및 README를 보관한다. 종료 시 모델·노드 캐시를 해제했고 테스트 서버는 8189에서 유지했다. 운영 R2/DB에는 쓰지 않았다.

다음에는 다른 페이지의 인물·구도 유지와 2K 출력의 이득을 별도 평가한다. 시안에는 Pruna, 이번 장면의 최종 품질에는 기본 25스텝을 우선 추천한다.

## 후속: 캐릭터 참조를 넣은 추가 장면

사용자가 몇 장 더 생성하도록 요청했다. 같은 인어공주 시트를 실제 이미지 입력으로 연결하고 기본 INT8 25스텝으로 밤바다, 왕자 구출, 산호 정원 3개 장면을 생성한다. 얼굴·머리·의상을 고정하면서 호기심/걱정/즐거운 놀람과 자세·조명을 변경한다. 왕자는 별도 참조 없이 텍스트로 지정한 시험 캐릭터다. 재현 스크립트는 로컬 출력 폴더의 `run-more.py`, 장면별 입력과 실행 기록은 `more-*-api.json`/`more-*-result.json`이다.

세 장 모두 1376×768 생성 성공, 육안 확인 완료. 출력은 `mermaid_more_night_00001_.png`, `mermaid_more_rescue_00001_.png`, `mermaid_more_garden_00001_.png`. 서버 실행 시간은 각각 79.404/52.254/50.917초. 첫 장은 노드 캐시 없음, 이후 두 장은 모델·시트 로더와 모델 캐시를 재사용했으므로 이전 냉시작 비교와 구별한다. 표본 전체 GPU 사용 최고 11,674MiB, OOM 없음.

세 장에서 분홍 머리·청록 눈·왕관·청록/보라 비늘·종이 질감이 이어진다. 구출 장면은 걱정하는 눈썹과 열린 입으로 감정 지시를 반영했고 인물 두 명의 팔이 구분된다. 얼굴 비례와 세부 장식 위치는 조금 변한다. 밤바다의 꼬리 끝은 물 아래로 가려지며, 산호 정원은 얼굴·의상 식별에 유리하다. 책 전체 일관성을 보장하는 검증은 아니다.

종료 `/free`는 성공했으나 빈 HTTP 응답을 JSON으로 읽던 실행기의 마지막 단계에서 오류가 났다. 이미지 3개는 이미 history success로 저장됐으며 모델 해제 뒤 GPU 사용 2,320MiB를 확인했다. `run-more.py`의 해제 요청은 빈 응답을 허용하도록 수정했다. 운영 데이터 변경 없음.

## 출처

- https://huggingface.co/Comfy-Org/Qwen-Image-2.1
- https://huggingface.co/PrunaAI/Pruna-Qwen-Image-2.1
- https://huggingface.co/NidAll/pruna-image-2.1-comfyui-loras
