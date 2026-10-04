# 라푼젤 한국어·영어 롱폼·숏폼

- id: 20261004-video-rapunzel-four-videos
- domain: video
- status: active
- updated: 2026-10-04
- branch: codex/video-rapunzel
- base: b7ae9dcc
- output: D:/tangobook-video/rapunzel-20261004/
- delivery: 제작 착수, 새 작업의 운영 등록/main push 미요청

사용자 “좋아. 다음은 라푼젤 하자”. 승인 MiniMax H3/Qwen-Image-2.1/Voicebox/로컬 FFmpeg로 한·영 가로16:9 2~3분과 세로 숏폼 네 편을 만든다. 큰 overlay 자막·언어별 타임라인·원속도 native-duration·실제 그림/동작 검수를 유지한다. 앞 작업 push 요청은 새 작품에 확대하지 않는다.

운영 후보3권 확인 후 paper-craft 책1777272102062(그림체2) 선택. 본문15쪽/라푼젤·마녀·왕자 참조/BGM을 보존한다. 원문의 밧줄 탈출·하얀 말·성 결말을 따르고 머리 절단·추락·실명·마녀 대결은 추가하지 않는다. 첫 사건은 “마녀가 오기 전에 빨리 가야 해!” 숲 탈출. 탑으로 돌아가 마녀 호출→왕자가 듣는 노래→머리 사다리→초대→밧줄→말→성. 머리와 밧줄을 혼동하지 않게 검수한다.

로컬 BRIEF/STORYBOARD·24롱폼/8숏폼×한영64개 대본 준비. Comfy8190 시작 큐 비어 있음, Voicebox17493 healthy/CUDA/model unloaded 확인. 기존 승인 KO/EN 프로필로 새 나레이션 생성/ASR 후 Qwen/H3를 직렬 처리한다. 위험도가 높은 머리/등반/달리는 말은 원본 확인 후 시험 컷부터 검수한다. 현재 완성 영상 없음.

원본 15쪽/참조3장의 contact3장을 실제 확인했다. 3~4쪽 마녀는 다른 캐릭터보다 사실적이고 14쪽 말은 각진 종이접기 표현이 강해 Qwen으로 동일 캐릭터의 둥근 페이퍼아트 장면을 재구성한다. 1·8쪽 탑의 문처럼 보이는 하부 개구부는 본문의 “문/계단 없음”과 충돌해 새 탑 구도로 제거한다. 13쪽 달리기 손잡기 대신 각자의 자연스러운 손을 분리한 앵커를 만들고, 머리/밧줄/말의 세로 구도도 별도로 생성한다. 아직 새 후보는 승인하지 않았다.

한국어32개 음원 생성 완료: 기본 간격 포함 롱폼140.56초/숏폼34.64초, 실제 최종은 fps 정렬/종료 간격으로 달라진다. 영어 생성 진행. Voicebox 완료 후 모델 메모리만 정상 unload하고 Qwen 후보·CPU ASR로 이어지는 worker를 준비했다. Comfy Python에는 faster-whisper가 없어 기존 설치된 Python3.13 실행 환경으로 CPU ASR을 시작했다(신규 패키지 설치 없음). 실패한 최초 embedded Python 호출을 전사 통과로 취급하지 않는다.

MiniMax 노드 실제 length schema는24fps 학습 범위124~362를 명시한다. 연속 같은 구도의 노래/왕자 반응, 세계 설명/초대, 성/결말은 실제 양 언어 합산 길이가 이 범위 안일 때 한 native source로 연결하고 서로 다른 편집 offset을 사용한다. tiny punch-in을 넣지 않는다. CPU BGM331초 crossfade master 준비. 독립 대본/음원을 만든 것을 영상 완성으로 보고하지 않는다.

한영64개 음원 생성 완료. 기본 간격 기준 KO140.56/34.64초, EN137.76/33.92초. 한국어32개 CPU ASR·자막 폭/2줄/원고 일치 검사 통과(최저 ASR0.875, ‘탑 아래’ 등의 연음 표기를 인식기가 다르게 분할한 기록 유지). 숏폼 ‘올라왔지요/멈췄어요’ 단독 자막을 의미 단위로 교정했다. 영어 ASR 진행 중. Voicebox 정상 POST/models/unload 성공 후 Comfy8190 Qwen 후보17장 직렬 생성 시작, 첫 tower-interior prompt890a6367-705f-4be9-a4e7-9617ff8a9430. H3 --plan-only 검증으로29개 source, 마지막 성/결말 continuous345프레임을 포함해 전부 학습 범위 안. 이미지·영상의 자동 승인은 없다.

영어32개 ASR 정규화 대조 전부1.0, 한영64개147캡션의 폭/2줄/원고 전수 preflight 통과. 영어 숏폼 tower 단독/3줄 위험 및 롱폼 now 단독을 의미 단위로 교정했다. Comfy embedded Python의 script-dir 미자동추가로 caption_utils import가 실패한 호출은 sys.path에 제작 폴더를 명시해 수정, 실제64개 preflight 재통과.

새 tower-interior/horse-reaction 원본을 직접 확인하고 SHA 승인. hair-drop 후보에서 마녀에게 왕자의 초록 망토/금색 잠금이 섞인 반증으로 보류했다. 스타일 참조 p10에 왕자가 함께 있고 전역 외형 문구도 green cape를 넣던 것이 원인 후보다. 스타일 참조를 p10의 라푼젤만 있는 부분으로 바꾸고 등장인물별 외형 지시를 분리해 재생성한다. 오류 PNG/graph/history는 rejected/reference-style-v1에 보존. 우리 후보 제출 Python PID만 확인해 중지했고 Comfy 계산은 취소하지 않았다. 이미 제출된 prince-call ae539001-c780-4f7e-8ef9-c0c97ecac821은 resume_refs.py가 history로 회수한 뒤 재개해 중복 제출을 피한다. 아직 H3 source/완성본 없음.

보류한 caller v1도 회수 후 직접 확인: 왕자의 머리가 회색으로 오염되어 제외. 캐릭터별 지시로 재생성한 brown-haired caller와 손/얼굴이 온전한 16:9 close crop를 확인해 승인했다. 수정 hair-drop도 보라색 마녀/회색 머리/한 가닥 braid를 실제 확인해 승인. 새 숲 탈출 이미지도 원래 두 캐릭터·분리된 손·꽃 머리·종이 질감 유지로 승인했다. 승인5장, 나머지 Qwen 직렬 생성 중.

H3 prince-climb 첫 시험141프레임은 0.25초 간격25샘플/contact3장 전부 직접 검사해 실패 판정: 1초부터 원래 왕자 외에 왕자 한 명이 생겨 숲에서 떠다니며 접근한다. rejected/prince-climb-v1에 source/metadata/prompt/graph와 이유 보존. 기존 왕자 한 명이 제자리에서 미세하게 힘을 주는 동작과 끝 프레임 guide로 v2 시험 제출(9ee495a6-4cf9-4d64-b16e-9c674aabf454), 실제 opening escape 시험도 제출(e5a01e32-7cb4-4a7c-b817-176f9de11a6f). 아직 motion 승인/완성 영화 없음. UTF-8 리뷰 문구가 늘어난 뒤 cp949 기본 read_text 오류가 드러나 제작 스크립트 JSON 읽기 encoding을 명시했다.

H3 prince-climb v2는25개 샘플/contact3장을 전부 직접 확인해 승인했다. 한 명만 유지하고 창가에서 미세한 어깨/시선/눈 깜빡임과 망토/잎 동작이 있음. 전체 높이 등반이 아니라 창가에서 힘주는 짧은 컷임을 review에 명시했다. 새 tower도 직접 확인: 하부의 작은 빈 창 두 개는 지면 위이고 문/계단은 없음, 캐릭터·braid 보존. 검수된 앵커 기반 tower/hair/caller/rope/surprise와 연속 song/world/castle source 배치72709 시작; 생성 결과는 아직 승인 전.

Escape source141프레임도0.25초25샘플/contact3장 전부 직접 검사해 승인: 두 캐릭터의 교대 걸음·머리/망토/잎 실제 동작, 얼굴/사지 coherent, 복제/떠다님/씬 전환 없음. 빠른 질주보다는 조심스러운 느린 달리기/걸음이다. KO5.208초/EN5.167초 첫 비트 native-preview를 자막/VO/BGM 합성, 둘 다 전체 decode 통과. 실제 KO960x540/EN480x270 자막 프레임을 확인하고 도입 시안으로만 사용자에게 표시했다(화질 향상/전체 본편 아님).

Qwen witch-call v2 실제 확인에서 사실적 주름 얼굴과 ground-level door 반증 발견, rejected/witch-call-v2로 PNG/graph/history 보존해 제외. 승인된 doorless tower를 scene anchor로 바꾸고 원래 grey curls/purple moon-star 의상은 유지하면서 종이 캐릭터의 단순한 눈/볼을 명시해v3 후보 재생성(실제 prompt02c5ccc6-4336-4566-824b-116630ff3fcd). 현재 source2개 motion 승인, 전체 영화0개.
