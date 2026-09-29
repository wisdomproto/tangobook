# 피포 01 「첫 양몰이」 MiniMax H3 영상

- id: 20260929-video-pipo01-minimax-h3
- domain: video
- status: complete
- updated: 2026-09-29
- branch: main
- source: `changjak-pipo-01`, 본문 `docs/changjak-books/pipo/01-03.md`
- output: `D:/tangobook-video/pipo-01-h3/`

## 사용자 요청과 기존 흐름

피포 시리즈 중 한 권을 골라 MiniMax H3로 영상 한 편을 만들도록 요청했다. 사용자는 ComfyUI를 사용하고, 이전에 만들던 흐름을 이어 쓰라고 했다. 기존 정본 `D:/tangobook-video/pipeline/README.md`와 `C:/projects/comfy_test/.claude/worktrees/minimax-image-reference-video-322eac/scripts/minimax_r2v.py`를 확인했다. 로컬 ComfyUI `127.0.0.1:8189`에는 H3 Reference-to-Video 노드, int8 모델, turbo LoRA, 텍스트 인코더, 비디오·오디오 VAE가 있다. 이전 영상 프로젝트의 모델·스크립트를 재사용한다.

「첫 양몰이」를 선택했다. 퐁이네와 달리 피포의 기존 그림·캐릭터 시트가 운영에 모두 있고, 10쪽의 해질녘 양몰이 → 할아버지의 탕탕 소리 → 양 떼 흩어짐 → 피포가 앞장서 조용히 돌아옴 → 할아버지까지 줄 서는 결말이 영상 행동으로 이어진다. 운영 `changjak-pipo-01`의 본문 삽화는 10/10 연결돼 있다. 기존 참조 시트와 각 쪽 그림을 먼저 검수하고 짧은 시험 컷으로 외형·움직임을 확인한 후 10쪽 영상을 만든다. 외부 게시·운영 책 수정은 요청 범위가 아니다.

## 제작 진행

- 운영 원고와 삽화 10장, 피포·엄마·양 할아버지 캐릭터 시트를 `D:/tangobook-video/pipo-01-h3/`에 내려받고 참조 manifest와 해시를 기록했다.
- 기존 `minimax_r2v.py`를 `COMFY_URL=http://127.0.0.1:8189`로 사용한다. 832×480, 24fps, 124프레임, 8 steps, turbo LoRA, ref2va int8 모델. ComfyUI 출력 루트는 `D:/ComfyUI-output/qwen21-mermaid-test/`이다.
- 8쪽 시험 컷 `video/pipo01_h3_p8_pilot_00001_.mp4`를 생성했다. 0초·2초·4초 프레임을 실제 열어 피포 한 명의 귀·목도리·팔다리, 양 두 마리, 우리·돌담·일몰과 조용한 보행 연속성을 확인했다. 육안상 통과. 5.167초, H.264/AAC.
- 1~10쪽 순차 렌더를 시작했다. 중복 큐를 방지하려고 한 컷 완료 후 다음 컷을 제출하는 `render_book.py`를 출력 폴더에 두었다. 성공 컷을 건너뛰므로 중단 시 재개 가능하다. 8쪽은 통과한 시험 컷을 사용한다.
- 한국어 나레이션 10개를 Edge TTS `ko-KR-SunHiNeural`로 출력 폴더에 만들었다. 운영 DB에 TTS 링크를 쓰지 않았다. `assemble.py`는 내레이션 길이에 따라 영상을 조립하고 선택 가능한 한국어 자막을 넣는다.

## 검수와 결과

- 생성한 10쪽 모두 원문·원본 삽화와 시작·중간·끝 프레임을 직접 대조했다. 1쪽은 원본에 없는 큰 양·지팡이, 4·7쪽은 할아버지에게 잘못 생긴 노란 목도리, 10쪽은 양 할아버지 복제를 발견해 원본 한 장만 참조하는 전용 프롬프트로 재생성했다. 4쪽 첫 수정본은 지팡이 형태가 변해 다시 만들었다. 수정본도 1~5초 프레임을 열어 검수했다.
- 최종 선정 컷 10개와 각 SHA-256, 쪽별 검수 메모는 `D:/tangobook-video/pipo-01-h3/selected-manifest.json`에 있다. `final-qc/contact-sheet.jpg`로 최종 조립본의 쪽별 중간 프레임도 재확인했다.
- 완성 파일: `D:/tangobook-video/pipo-01-h3/pipo-01-minimax-h3.mp4` (93.152초, 1280×720, H.264/AAC, 한국어 `mov_text` 자막 10개, 35,724,377바이트). 전체 디코딩 성공. SHA-256 `b6407e0b09bb83020a2f866cd8cf317779fa81ce83e289280c4c4cac2aeb464b`.
- 원본 렌더 해상도는 832×480이며 최종본은 720p로 확대했다. 10쪽은 원문 결말에 맞춰 할아버지가 문턱에서 멈춰 피포를 보는 수정본을 채택했다. 4쪽은 큰 지팡이 휘두름 대신 형태가 안정적인 작은 탕탕 동작을 택했다. 약 5초의 H3 움직임 뒤 각 쪽 나레이션이 끝날 때까지 마지막 프레임을 유지한다.
- 이 결과는 로컬 시안이다. 운영 DB, R2, 유튜브에는 올리지 않았다.
