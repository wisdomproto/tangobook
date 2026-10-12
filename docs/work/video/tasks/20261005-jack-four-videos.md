# 잭과 콩나무 네 영상 로컬 제작

- id: 20261005-video-jack-four-videos
- domain: video
- status: paused
- updated: 2026-10-12
- base: d1af5ef2
- branch: codex/video-rapunzel
- output: D:/tangobook-video/jack-beanstalk-20261005/
- integration: 미통합
- delivery: 사용자 명시적 재개, 저장 음원9개 재사용·최종본0개

## 사용자 결정

2026-10-12 “로컬로 잭과 콩나무 제대로 만들자”로 중단을 해제하고 같은 네 편 제작을 재개했다. 기존 9개 음원 해시를 대조해 재사용한다. Kaggle 재개·운영 등록·main push는 요청되지 않았다. 다른 Comfy8189 서버는 유지하며 비어 있는 큐를 확인한 뒤 모델 메모리를 해제하고 Voicebox 누락 구간 생성부터 이어간다. 기존8190 제작 서버는 현재 없으므로 음성 단계 후 별도 실행한다. 생성 전 descend 롱폼 앵커를 실제 콩나무 추격12쪽으로 바로잡는다.

“KAGGLE 은 포기하고, 로컬로 잭과 콩나무 제대로 만들자.” Kaggle 시험 종료 상태를 유지하고 로컬 H3/BF16 제작으로 전환한다. 앞서 합의한 한국어/영어16:9 롱폼 약2~3분 +9:16 숏폼 네 편, 큰 영상 자막/Voicebox 기존 승인 프로필/기존 캐릭터 참조/필요한 신규 Qwen2.1 삽화/RealESRGAN 검수 파이프라인을 적용한다. 이번 제작은 이전 라푼젤 완성본 승인이나 삭제가 아니다. 완성본을 사용자에게 보여 컨펌 후 다음 책. 운영 등록/main push/외부 발행 요청은 이번에 없음.

## 각색·원본 확인

페이퍼아트 책1772510956605의 실제15쪽 원문·한영 번역과 전체 삽화/캐릭터26이미지를 다운로드·contact5장 전부 직접 확인했다. 원래 characters의 최신 paper sheet가 실제 페이지와 일치하며 과거 characterImages의 매끈한3D 캐릭터/파란 엄마 드레스/다른 하프는 제외한다. 잭 olive patch tunic/ivory sleeves/beige patched trousers/brown boots, 엄마 burgundy dress/ivory apron/brown shawl, 검은 덥수룩 머리·수염/녹색 종이 망토 거인, 흰색/황금 깃털 암탉, 파란 머리 얼굴 황금 하프 유지. 책 메타 설명보다 실제 페이지 참조를 우선한다.

13쪽 “엄마, 빨리 도끼를 주세요! 거인이 내려와요!”→12쪽 흔들리는 콩나무 추격→마법 콩 회상으로 시작한다. 롱폼24비트/숏폼8비트,64새 Voicebox 나레이션 구간. 암탉→금화→하프의 세 번 방문과14쪽 거인 도망 결말 유지(거인 죽음 추가 없음). 이야기에 없는 등장인물·하프 외형·프롤로그를 넣지 않는다. 도입은 제자리 이미지 확대 분할 대신 실제 몸·줄기/잎 움직임으로 검증한다.

## 현재 상태

2026-10-12 재개 검증: Voicebox 누락 구간 worker37340, 후속 stage25804, 별도 Comfy8190 worker35728. 다른8189 공유 서버 유지. Comfy의 공용 DB 잠금 경고를 확인해8190만 별도 로컬 DB로 재실행했다. 모든 기존9WAV SHA 일치. KO32음원 저장, EN 생성 진행. CPU ASR 표본의 KO-long-12가0.844로 기준0.86 미달하여 전체64음원 검사 후 해당 음원만 같은 승인 프로필/새 seed로 최대3회 재생성·ASR 재검사하도록 구성했다. 이전 음원은 history에 보존하며 기준을 낮추지 않는다.

이후64음원 생성 완료. ASR 기준 미달3구간(ko-long-12/ko-short-06/07)은 전체 기대 문장 대신 작품 단어 목록만 제공한 재인식으로0.969/1.0/1.0 통과했다. 콩나무를/콩나물을 등 동음 표현·고유명사의 일반 ASR 혼동이었으며 실제 추가 TTS 재생성은 없었다.64음원 모두0.86 이상, 원본9음원 그대로 유지. 초기 자막 preflight에서 미인식 효과음의0길이와 EN-short-03의3줄 줄바꿈을 발견했다. 짧은 효과음 자막을 인접 문구와 묶고 폰트 실측의 두 줄 분할 가능성을 토큰 배치에 적용해64구간171자막 전부 대본·폭·2줄·양수 시간 검사 통과했다. 예상 길이KO long177.958s/short37.100s, EN long179.250s/short38.033s. H3 plan-only31개, 오븐 두 비트는 언어별 실제 여백 포함14.8초 구간을 하나의362프레임 연속 source로 묶었다. 이 수치는 생성 계획이며 영상 완성 증거가 아니다.

Qwen stage2068 진행 중, H3는 아직 시작 전. axe-call/axe-return/harp를 각각 실제 전체 이미지로 검사해 SHA 승인했다. home-hen 첫 후보는 잭2명으로 생성되어 rejected-anchors.json에 제외 기록. 같은 잘못된 후보만 참조해 가운데 중복 잭을 지우는 단일 참조 home-hen-v2를 별도 직렬 Comfy 큐로 생성(worker37372, 완료)하고 실제 전체 이미지에서 잭1/엄마1/암탉1/황금알1/빵과 원래 질감을 확인해 승인했다. H3 home-hen은 v2만 선택한다. axe-return은 엄마가 양손으로 도끼 손잡이를 안정적으로 잡고 가져오는 컷으로 승인, 동작은 그립을 유지한 채 살짝 내미는 것으로 보정했다. 화면에서 실제 손잡이를 건네는 동작으로 취급하지 않는다. 현재 승인 보완 앵커4장, 최종본0개.

생성 전 스크립트 대조에서 Qwen 출력 비율이 문장이 아니라 첫 참조 크기를 따른다는 현재 nodes_qwen.py 구현을 확인했다. 숏폼8앵커의 첫 참조를 세로 구도로 만들고 완전한 원본을 다음 참조로 함께 제공하며 실제 출력 가로/세로 비율을 검사한다. 캐릭터 참조는 한 인물/사물 전면 중심으로 재크롭 후 직접 확인. 복사된 caption_utils.py의 라푼젤 전용 수동 자막과 향상 검증의 고정29개 기대값을 제거하여 잭 대본과 실제 계획을 검증하도록 수정했다. 로컬 Python 전부 compile 확인, 아직 새 영상/새 Qwen 앵커 육안 승인 없음.

script.json/STORYBOARD.md/BRIEF.md 생성, 기존 제작/검수 runtime·fonts를 독립 로컬 폴더에 복사. 기존 책/영상/운영 데이터 변경 없음. Comfy8190 큐가 비어 있는 것을 확인한 뒤 모델 메모리 해제, 승인한 ko/en Voicebox 프로필로64구간 생성 시작. 새 영상은 아직 없음. Kaggle시험 컷은 품질 증거로 보존하되 본편source는 실제 대사 길이에 맞춰 검수한다.

추가 실제 전체 이미지 검사로 run-v2/relief/axe-call-portrait/trade-portrait/climb-portrait/hen-portrait/chop-v4/fall-v3 승인하여 신규 승인12장. run은 하프에 통합된 파란 머리 얼굴을 복구하고 복도 전경 방향 두 걸음으로 고정했다. chop 첫 두 후보는 날이 아래로 향해 제외; 기술적 도끼 방향 참조를 Qwen에 넣은 v3 뒤 크기/손잡이를 v4로 보정해 오른쪽 날·양손 그립·발 접지를 확인했다. fall 초기 별도 갈색 그루터기/짧은 공중 통나무 후보는 제외하고 v3의 같은 녹색 절단면·상단 프레임 밖까지 이어지는 거대 줄기·오른쪽 도망 거인을 확인했다. 거인의 달리기 중 짧은 공중 단계는 실제 착지하는 H3 두 보폭으로 검수하고 정지 부유로 승인하지 않는다. 아직 H3 제출0, Qwen 나머지 세로4장 생성 중. 로컬 watch_h3_qc.py는 source 전체 decode/규격/blackdetect와 밀집 motion contact를 만들 뿐 실제 육안 승인하지 않는다.

alarm-portrait/descend-portrait 실제 전체 이미지까지 승인하여 신규14장. descend는 원래 웃는 표정에서 긴박한 표정·아래 발판 시선으로 H3 동작을 지정했다. chop-portrait 첫 후보의 비스듬한 아래 날·둔한 부분 접촉을 제외, 승인된 가로 chop-v4 도끼 모양을 추가 참조로 Qwen chop-portrait-v2(worker3984)를 생성 중. 마지막 ending-portrait도 생성 중이며 모든 Qwen 완료/큐 비움/선택 앵커 SHA 승인 뒤 H3 시작한다.

선택한 신규16앵커 전부 실제 전체 이미지 검수·SHA 승인 완료(전체 책 원본 포함 선택29앵커). chop-portrait-v2에서 오른쪽 은색 절단날·한 손잡이/두 손 그립·발 접지 확인. Comfy8189/8190 두 큐 running/pending0 및 Voicebox Qwen TTS unload 확인, 비어 있는8190 Qwen 모델 메모리 해제 후 로컬 H3 worker22888와 CPU source-QC watcher27864 시작. 최초 axe-call prompt32f765c8-6466-4acb-b39c-8ac623fabbae, 192frames/1024x576/24fps. h3-resume-20261012.log/.err 및 h3-qc-20261012.log/.err 보존. 현재 최종본0개, 새 H3 생성 시작이며 source 동작 검수·해상도 보강·최종 편집 아직 남음.

최초 axe-call native 영상과33표본/밀집 contact4장을 실제 전부 봤다. 첫4초 손짓/입 움직임·캐릭터는 안정적이나 뒤 약3.5초가 정지하고 실제 발걸음이 없어서 승인하지 않았다. history/opening-v1에 clip/메타/정확한 graph·receipt/history/판정 보존 후 해당 컷만 끝 이미지 guide를 제거하고 지속 대사·실제 한 걸음을 지시하는 jack-opening-v2로 재생성(worker27024, prompt79837ed8-9609-4bc9-bfce-0171442d8cd6). 기존 main H3 worker22888는 현재 giant-chase를 생성하며 다른 source 생산을 이어간다. Comfy 하나의 직렬 큐에서 수정 컷이 순서대로 생성되므로 GPU 병렬 경합이 아니다. source-QC는 자동decode/표본 생성만 통과, 실제 움직임 승인0 및 최종본0 유지.

## 사용자 일시 중단 (2026-10-12)

“잠깐 스탑”에 따라 H3 main22888/도입 수정27024/QC27864만 종료했다. 실제8190큐에서 자기 running giant-chase72091a63-ed4e-4f6c-91c0-e92d23c5c483을 interrupt하고 pending 도입수정79837ed8-9609-4bc9-bfce-0171442d8cd6을 삭제했다. running/pending0 확인. 공유 Comfy/Voicebox 서버 유지.64음원/ASR·171자막 검사/선택 신규16앵커와 검수 증거 보존, 최초 H3 도입은 정지 꼬리로 제외하여 history/opening-v1에 보존. 승인 H3 source0/최종본0. production-status.json/PAUSED.md 중단·자동재개없음 기록. 재개 시 interrupted/deleted prompt receipt를 그대로 기다리지 말고 실제 history/queue 확인 후 이전 receipt를 보존하고 명시적 재개 요청 범위에서 새 제출해야 한다.

## 남은 단계

Voicebox 음성 ASR/대사·길이 확인→모델 unload→Qwen scene/portrait refs 생성·모든 이미지 직접 검사→로컬 H3 source 직렬 생성·동작 검수→RealESRGAN x2/전후 검사→KO/EN 네 최종본1080p·큰2줄 자막/전체 decode·음량·caption/shot/phone 표본 검사→SRT/MP3/clean master/표지 보존→사용자 컨펌.

## 사용자 중단 (2026-10-05)

“멈추자. 나중에 다시 하는걸로”에 따라 즉시 후속 stage worker65196과 Voicebox client worker58560만 종료했다. 두 Python process 부재 및 Comfy8190 running/pending0개 확인. 기존 Voicebox/Comfy 공유 서버와 다른 작업은 유지했다. /generate/stream는 active generation 목록에 등록되지 않는 API이며 이미 보낸 한 구간의 backend 계산을 별도 ID로 취소할 수 없으므로 공유 서버를 강제 종료하지 않았다. 후속 신규 요청은 없다.

현재 저장된 KO 롱폼WAV9개,64구간 각색·본책 JSON·원본26이미지·수정한 identity crop·16개 Qwen 후보 지시·H3/검수/render 스크립트를 보존. 새로운 Qwen candidate/H3 source/최종 영화0개. 로컬 production-status.json/PAUSED.md에 명시적 중단·worker/PID·9음원 SHA·다음 행동 기록. 자동 재개 없음.

재개는 생성된9구간을 재사용하고 누락 구간부터 Voicebox를 이어서 만들기→음원 ASR·caption preflight→모델별 unload 확인→Qwen16앵커 생성→전수 직접 육안 검사/승인→로컬 H331~32source(실제 음성 길이에 따라 연속 oven 컷 병합 가능)→동작/화질/네 편 검수 순서다. 아직 실제 H3 plan-only를 실행할 완전한64음성 기록이 없어 source 수·최종 길이는 예상이다. 참조crop1차에 다른 view 일부 포함/oldman얼굴 잘림을 실제 확인하여 한 캐릭터 front 중심으로 수정했다. 새 생성 이미지 검수 전 자동 approve하지 않는다.
