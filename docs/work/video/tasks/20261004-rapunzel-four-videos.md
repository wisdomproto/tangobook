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

사용자 “엥 근데 라푼젤이랑 왕자랑 같이 도망가는 장면이 있나?” 질문. 저장된 실제 책 본문12~14쪽을 재확인해 12쪽 밧줄 하강, 13쪽 “어? 마녀가 오기 전에 빨리 가야 해!” 두 사람 숲으로 달림, 14쪽 왕자의 하얀 말로 이동을 안내했다. 영상 첫 사건은 이 책13쪽의 배치를 앞으로 옮긴 것으로, 일반 원전과 동일하다고 주장하지 않았다. 사용자 취소/구성 변경 지시는 아직 없음.

사용자 “아 글쿠나 오키”로 우리 책13쪽 사건을 오프닝으로 옮기는 설명 수긍. 기존 각색을 계속한다. tower source192프레임은17개0.5초 표본/contact2장을 실제 검사해 얼굴/손/braid/그림체 유지와 표정·시선·blink 동작으로 승인. 새 witch-climb 실제 이미지도 두 캐릭터/분리된 손/벽 지지 발/한 가닥 braid 및 문 없는 종이 탑으로 승인. witch-call v3 생성 완료, 검수 전.

Hair source175프레임은16개0.5초 표본/contact2장 전수 실제 확인해 승인: 부착된 꽃 braid 끝이 실제 흔들리고 얼굴/손/다리/의상/종이 질감 유지. 새 horse 앵커도4개의 구분되는 다리/원래 앞뒤 rider/고삐와 분리된 손/얼굴로 직접 검수해 승인, horse H3 trial54f4d12c-6852-4029-bf8a-fbbf08889dc2 제출.

Witch-call v3은 나이 든 원래 마녀가 회색 머리 어린아이로 변해 rejected/witch-call-v3에 보존. 승인 witch-climb의 얼굴 crop를 추가하고 원래 성숙한 얼굴/긴 코/회색 곱슬/보라 의상을 명시한 v4(e34a6d9a-4a8d-4599-94a4-81b056ae0003)를 실제 확인해 승인: 종이 재질의 단순한 age creases, ground door 없음. 마녀 등반도 기존 두 인물의 제자리 작은 effort+끝 guide로 복제 방지 설정. 검수 앵커 기반 나머지 롱폼10source 배치76419 시작. 세로 Qwen8장 생성 중, 완성 영화0개.

사용자 전체 제작 순서/KOEN만/작품별 완성 컨펌 확정. [제작 큐](../PRODUCTION-QUEUE.md)의 현재 작품으로 계속한다. 라푼젤 네 편을 완성해 보여준 뒤 컨펌 전 다음 책을 시작하지 않는다. Prince-call source141프레임은13개0.5초 표본/contact2장을 실제 검사해 원래 왕자 한 명/분리된 손/얼굴/망토/호출 움직임으로 승인.

Horse source158프레임은28개0.25초 표본/contact4장 실제 검수해 승인:4개 다리 canter/고정 rider 순서/손·고삐/얼굴·braid 일관. 1.5/4.75초 근처 전경 나무가 잠깐 가리지만 재등장한 형태 정상인 자연스러운 parallax임을 review에 명시. KO11.458초 두 비트 native-preview 전체 decode/5캡션 실제 phone-size contact 검사 통과.

이 시안 대사 대조에서 “탑을 돌아보았어요/looked back”가 실제 말 컷의 전방 시선과 맞지 않아 그 마지막 절을 한영 모두 삭제했다. 원래 Voicebox 음원/WAV·JSON은 revisions/horse-narration-v1에 보존하고 ASR 단어 사이 경계로KO3.8/EN3.55초 잘랐다(끝25ms fade). 새 narration-edit-receipt에 원본/새 SHA·텍스트·경계 보존, 모델 재생성/동시 GPU 로드 없음. 최초 fade d=.025는 FFmpeg duration 파싱 실패해 원본에 쓰지 못했고 d=0.025로 실제 성공 후 CPU ASR2개 재검사 진행. 자막/previews 재조립은 새 audit 뒤에 한다. H3 기존 말 source는 더 긴 원속도 source라 새 대사에 충분하며 계획29개 유지.

삭제 절의 새 한영 음원 ASR 각각1.0, 전체64개145캡션 폭/2줄/원고 preflight 재통과. question source158프레임은15개0.5초/contact2장 실제 검사해 한 명의 작은 시선/몸 lean/braid/잎 움직임과 doorless tower로 승인. 한영 첫4비트22.500/22.083초 native-preview 조립, 양쪽 전체decode/A-V/FPS/codec/faststart/black/freeze/음량 자동 QC 통과. 각 언어16개 자막·비트 표본/contact2장 및phone preview 총6장 직접 확인: 글자/띄움/2줄/여백/캐릭터·그림체 정상. native-preview-review.json에 실제 SHA와 범위 기록. 전체 영화/AI향상본으로 보고하지 않는다.

Surprise source158프레임은15개0.5초 표본/contact2장 실제 검수해 승인: 두 인물·얼굴·분리된 손과 작은 surprise→smile/blink/왕자 호출 표현 안정. 새 hair-portrait도 직접 확인해 두 인물 얼굴/부착 braid/분리 grip/벽 지지 발과 기존 의상·종이 질감으로 승인. H3선정8개, Qwen 선정11개; 아직 전체 최종0개.

Escape-portrait source141프레임은25개0.25초 표본/contact4장 실제 검수 통과. 얼굴 온전히 frame 안/교대 footstep/팔/braid/망토/잎 실제 동작, 중앙 손 가까운 순간도 limbs fusion/새 인물 없음. KO4.900/EN4.600초 숏폼 첫 비트 native-preview 제작 및 전체decode/A-V/FPS/codec/faststart/black/freeze/음량 QC 통과, 실제 자막·비트 sheet와phone2종 총4장 검사로80px/2줄/얼굴 여백 확인. native-preview-review에SHA 기록, 본 숏폼 아님. 나머지 세로 hair source10d9085f-a746-4f7c-84e1-ceab85f37f5f 생성 대기. 현재 source9개 승인.

Witch-call source141프레임은13개0.5초/contact2장 실제 검수해 한 명의 성숙한 회색 곱슬 마녀/보라 의상/호출 손·얼굴과 종이 질감으로 승인. Rope source141프레임은25개0.25초/contact3장 실제 확인: 원래 두 인물의 분리된 갈색 밧줄·grip·벽 지지 발과 금색 braid 구분 유지. 제자리 작은 하강 준비/다리 움직임이며 탑 전체 높이를 내려왔다고 보고하지 않는다. Song-portrait Qwen 원본도 두 인물·왕자 갈색 머리/초록 망토·상부 창 라푼젤과 분리된 손/종이 질감으로 직접 승인. 현재29개 source 중11개 동작 검수, 새 앵커12개 승인, 전체 최종0개. 상태 스크립트는 단순 파일 존재와 실제 최종 SHA 검수 완료를 구분하도록 교정했다.

사용자 “계속 하고 있지?” 실제 상태 확인에서 Comfy8190 연결 거절/기존 라푼젤 생성 프로세스 부재를 발견했다. 중단 원인은 미확인이고 정상 진행으로 보고하지 않았다. 저장된 source는13개: 추가 hair-drop(16개0.5초/contact2장), hair-portrait(13개0.5초/contact2장)를 전부 실제 확인해 승인. Hair-drop은 생성 영상 자체의 한 번의 연속 push-in으로 마녀가 화면 밖으로 나가고 라푼젤의 머리 내리는 손/얼굴로 이어짐; 자동 중복 확대 분할이나 전원 화면 유지로 보고하지 않는다. Hair-portrait는 기존 두 인물/분리 grip/벽 지지 발·부착 braid 유지와 작은 effort/망토/blink 동작이며 탑 전체 높이 등반을 뜻하지 않는다.

ComfyUI를 기존8190/RTX4070으로 hidden 재시작해 system_stats 응답 확인. 완료 파일은 그대로 두고 검수 앵커가 있는 미완성 H3 source11개와 미완성 Qwen 세로 앵커5개만 로그를 남기는 로컬 background Python으로 재개했다. 실제 큐 running1/pending1 및 두 PID/제출 prompt를 확인했다. 실행 PID/로그는 로컬 current-workers.json에 갱신했고 이전 대화 exec session 번호를 활성 프로세스로 취급하지 않는다. H311개가 끝나도 나머지 세로5컷은 새 이미지 실제 육안 승인 후 생성해야 한다. 최종 네 영화0개, 이후 동작/향상/최종 검수·컨펌 필요. 외부 등록/push 없음.

후속 사용자 “잘되감?” 실제 확인: 재개 H3 worker는 정상 실행 중이며23/29개 source 저장, castle-continuous 마지막 가로 source 생성 중. Qwen 세로5후보 생성 완료. 전5이미지를 직접 확인해 surprise/rope/horse/ending 네 앵커 승인(새 선정 앵커16개), call-portrait는 원래 conical tower와 다른 평평한 crenellated roof가 보여 rejected/call-portrait-roof-v1에 PNG/graph/history/이유 보존. 승인 prince-call-close 이미지를 픽셀 변화 없는 lossless WebP 컨테이너로 참조해 roof가 frame 밖으로 빠지는 새 세로 caller를 요청했다. 승인4앵커의 H3 surprise/rope/ride/ending-portrait와 Qwen caller 재시도를 hidden background/log 방식으로 제출, 실제 prompt/queue 확인. 추가 생성10source는 아직 육안 승인 전이라 전체 motion 승인13개와 구분한다. 최종 네 영화0개, worker 정보/로그는 로컬 current-workers.json 참조.
