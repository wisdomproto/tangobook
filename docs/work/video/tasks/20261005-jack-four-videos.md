# 잭과 콩나무 네 영상 로컬 제작

- id: 20261005-video-jack-four-videos
- domain: video
- status: ready
- updated: 2026-10-13
- base: d1af5ef2
- branch: codex/video-rapunzel
- output: D:/tangobook-video/jack-beanstalk-20261005/
- integration: 미통합
- delivery: 사용자 동작 피드백 반영한 한/영 롱폼 수정·검수·전달검증 완료, 숏폼 유지. 1차 네 편 보존·사용자 수정본 승인, 등록/push 미요청

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

## 같은 날 재개

사용자 “ㄱㄱ”로 중단 해제.8190/8189 두 큐0과 previous giant-chase 실행 중단 history, 삭제된 도입 수정 history 없음 확인. 해당 old receipt/graph/history를 history/paused-20261012로 보존한 뒤 새 H3 worker26628/QC10588로 재개. 첫 opening-v2 prompt265a5dbd-4230-4e96-804b-ab9a10055644. 기존64음원/16삽화 재사용. 최종본0, 실제 동작 검수 후 네 편 완성까지 진행.

재개 opening-v2 실제33표본/contact4장을 전부 봤다. 잭 한 걸음·대사/손짓은 개선되고 꼬리 정지는 줄었지만4.5초부터 거인이 없는 금속 도구를 새로 만들어 제외했다. history/opening-v2에 clip/정확한 graph/receipt/history/판정 보존. 전경 잭·엄마 두 명에 집중하고 거인은 다음 실제 추격 컷으로 넘기는 가로/세로 axe-call-v3 Qwen 제거 수정(worker35844). 두 새 앵커는 직접 확인 전 승인 금지. H3 main26628 client만 종료했고 backend giant-chase는 그대로 이어간다. 같은 prompt36d3ce92-2cd4-4e78-8f15-9f98c915c6af를 collector38144가 다시 기다려 저장하며 중복 제출 없음. QC10588 유지. 선택 도입 두 앵커/action/guideVersion을v3로 바꿨지만 다른 기존 참조 보존. 현재 승인 H3/최종본0.

giant-chase도 실제33표본/contact4장 전부 검사했다. 두 인물/하프는 안정적이나 요청한 내려오는 발동작이 없고 끝4초 정도 정지해 제외(history/giant-chase-v1 보존). 두 실제 pilot의 끝 guide 정지 꼬리를 근거로 모든 후속 source는 시작 image guide만 쓰는 jack-local-motion-v2로 변경, 실제 동작·캐릭터 유지 검수는 그대로다. 도입v3 가로/세로 Qwen 수정본을 각각 전체 이미지로 봐 잭·엄마 원형/빈 손/기존 그림체 유지와 거인 제거·빈 자리 복원을 확인하여 승인. 선택 신규16앵커(전체 승인 후보18) 유지. Voicebox TTS가 다시 loaded여서 active generations0/17493 established연결 없음과 Python client 없음 확인 후 해당 idle모델만 unload;8190비어있는 큐 모델 메모리 해제. H3 batch25820/QC10588, 새 첫 prompt27573fdc-3f81-4c46-a679-b9ab53cf4c9c. 아직 승인 H3/최종본0.

도입 axe-call-v3 H3 실제33표본/contact4장 전부 직접 봐 잭 실제 한 걸음·끝까지 대사/손짓·엄마 자연스러운 표정과 빈 손·없는 도구/추가 인물 없음 확인, 첫 source 승인. 모델의 약한 push-in은 실제 몸 이동과 함께 있으며 완벽한 fixed camera로 주장하지 않는다. ko long 1비트 native 미리보기 jack-ko-long-native-preview.mp4(6.958s/1920x1080/24fps/88px) 생성, 전체decode/A-V/음량/faststart 및 실제 모든3자막/2비트경계/phone 표본 검사 통과하고 사용자에게 inline 표시. 해상도 보강 전 한 장면 샘플이며 최종 네 편 완성 증거가 아니다. H3 batch25820/QC10588 계속, giant-chase-v2 생성 중.

giant-chase motion-v2 실제33표본/contact4장 검사에서 두 인물/통합 하프/그립·표정·줄기/구름 움직임 지속과 추가 사물 없음 확인해 추격 컷으로 승인. 원래 fixed-camera/두 하강 발걸음 지시는 모델에서 완전히 지켜지지 않았다(실제 camera track/roll와 grip/body motion이며 정확히 두 발 하강으로 주장하지 않음). 이 차이를 verified-clips.json 실제 증거 notes에 기록. 승인 source2개. ko long 2비트 native 미리보기를14.5s로 갱신, 전체 자동QC 및 실제 모든5자막/4비트경계/phone 표본 확인 후 사용자 inline 표시. 최종 영상·upscale 아직 없음.

question/poverty/trade 실제 contact2/2/3장(17/16/19표본) 전부 검사·SHA 승인하여 source5개. 창가 잭/밖 줄기 유지, 엄마·잭·소1/줄·손 유지, 노인·잭1/지팡이/원본 빛나는 콩 묶음·손/표정 유지 확인. trade는 원본의 여러 콩과 후반 generated palm push-in을 그대로 기록하며 단일 콩/완전 fixed camera라고 주장하지 않는다. 그립 바뀜·추가 인물/손 없음. anger 생성 중.

anger 첫 native19표본/contact3장 실제 전부 검사에서 창턱에 새 콩 무더기·4.5초부터 다른 엄마 손에 새 콩 무더기 생성 발견, 승인하지 않고 history/anger-v1에 clip/graph/receipt/history/판정 보존. 기존 p03에 떠 있는 작은 점만 제거하고 두 손·창턱을 비우는 Qwen anger-v2 worker24320을 같은 직렬 큐에 제출. H3는 콩을 놓은 직후의 빈손 follow-through와 잭의 실망 반응으로 수정(원 나레이션 유지), 실제 새 참조 확인 후 해당 native만 재생성. main25820의 남은 생성은 계속되며 현재 sprout. 승인 source5/최종본0.

sprout 실제19표본/contact3장을 모두 검사해 잭의 자연스러운 손/표정·같은 외부 줄기·잎/구름 움직임·추가 인물/줄기 없음 확인, source6개 승인. Qwen anger-v2 전체 이미지 실제 검사에서 두 원래 인물·두 빈손·깨끗한 창턱·동일 저녁 집 질감을 확인해 승인(선택 신규17장/전체 승인 후보19장). H3 해당 컷만 재생성 worker23272, main25820은 climb 생성 중이며 같은 Comfy 직렬 큐. QC10588 유지. 아직 upscale/최종본0.

## 남은 단계

음원64개/자막171개 준비·주참조17장/끝 자세3장 실제 승인 완료. 남은 H3 source 직렬 생성·전체 동작 검수→RealESRGAN x2/전후 검사→KO/EN 네 최종본1080p·큰2줄 자막/전체 decode·음량·caption/shot/phone 표본 검사→SRT/MP3/clean master/표지 보존→사용자 컨펌.

## 사용자 중단 (2026-10-05)

“멈추자. 나중에 다시 하는걸로”에 따라 즉시 후속 stage worker65196과 Voicebox client worker58560만 종료했다. 두 Python process 부재 및 Comfy8190 running/pending0개 확인. 기존 Voicebox/Comfy 공유 서버와 다른 작업은 유지했다. /generate/stream는 active generation 목록에 등록되지 않는 API이며 이미 보낸 한 구간의 backend 계산을 별도 ID로 취소할 수 없으므로 공유 서버를 강제 종료하지 않았다. 후속 신규 요청은 없다.

현재 저장된 KO 롱폼WAV9개,64구간 각색·본책 JSON·원본26이미지·수정한 identity crop·16개 Qwen 후보 지시·H3/검수/render 스크립트를 보존. 새로운 Qwen candidate/H3 source/최종 영화0개. 로컬 production-status.json/PAUSED.md에 명시적 중단·worker/PID·9음원 SHA·다음 행동 기록. 자동 재개 없음.

재개는 생성된9구간을 재사용하고 누락 구간부터 Voicebox를 이어서 만들기→음원 ASR·caption preflight→모델별 unload 확인→Qwen16앵커 생성→전수 직접 육안 검사/승인→로컬 H331~32source(실제 음성 길이에 따라 연속 oven 컷 병합 가능)→동작/화질/네 편 검수 순서다. 아직 실제 H3 plan-only를 실행할 완전한64음성 기록이 없어 source 수·최종 길이는 예상이다. 참조crop1차에 다른 view 일부 포함/oldman얼굴 잘림을 실제 확인하여 한 캐릭터 front 중심으로 수정했다. 새 생성 이미지 검수 전 자동 approve하지 않는다.

anger-v2 native 실제19표본/contact3장 전부 검사: 두 원래 인물·엄마 빈손 follow-through·깨끗한 창턱·잭 표정 유지, 새 콩 무더기 없음. source7개 승인. climb 원본은 후반 카메라가 잭 뒤로 돌아 얼굴을 가려 제외/history/climb-v1 보존. 다른 높은 정면 끝 자세 Qwen climb-end-v2 worker32536 생성 중; long climb만 서로 다른 시작/끝 guide와 end-anchor SHA gate로 수정, 나머지 컷 첫 guide만 유지. main25820 castle 진행, QC10588 유지. 최종본0.

castle 첫 native 실제19표본/contact3장 전부 검사에서3초 이후 원본에 없는 흰머리 두 번째 아이가 등장해 제외/history/castle-v1 보존. 잭1명/같은 문턱·카메라·빈 공간을 유지한 최소 끝 자세 Qwen castle-end-v2(worker7828)와 이동 대신 조심스러운 고개/기울임으로 수정. long castle도 다른 끝 guide/SHA gate 적용. climb-end Qwen32536 진행, main25820 hen은 Qwen 뒤 직렬 대기.

climb-end-v2 전체 신규/원본 이미지 직접 비교 승인: 같은 잭1·정면3/4 얼굴·두 손/두 부츠·약간 높은 자세, 구름 레이아웃 세부 차이는 원본과 같다고 주장하지 않고 native 연속성 검사 예정. H3 climb repair worker30068, prompt d4dc6664-a9e8-4c1b-93df-ad81035d6fca 제출; 현재 hen→castle end Qwen→climb 순서 직렬 큐. 실제 source7/최종본0 유지.

hen native 실제17표본/contact2장 전부 검사·SHA 승인. 앉아 깨어있는 원본 거인1·숨은 잭1·닭1·황금알1 유지, 거인 기존 음식으로 손 내림/시선·닭 눈/고개·빛 움직임 확인. 이 컷의 거인은 원본대로 깨어 있으며 다음 escape-hen에서 잠듦. 후반 약한 push-in은 숨기지 않음. 승인 source8개/최종본0.

castle-end-v2 신규 전체 이미지 실제 승인: 잭1·두 손/부츠·같은 문턱·거대한 문/왕좌/구름성·작은 앞으로 살핌 자세 확인. long castle H3 repair worker3416 제출. Qwen 신규 주참조17장과 추가 서로 다른 끝 guide2장 승인(전체 승인 후보21장). 실제 native8개/최종본0.

climb-v2 실제33표본/contact4장 전부 검사·승인: 전구간 잭 정면3/4 얼굴 유지·두 손/부츠·동일 줄기·표정/미세 몸/잎/구름 움직임. 명확한 완전 발판 한 걸음 증거나 완전 fixed camera로 주장하지 않으며 카메라 미세 drift·등반 자세의 작은 shift로 기록. 후반 뒷모습 문제 없음. source9개. ko native 7비트 미리보기49.958s 연결, 실제 모든4contact+phone 검사 후 ko-long-07 서/있었어요 분리 발견해 두 문장으로 override하고 전체171자막 preflight 통과. 재render/QC전체 decode·음량·31표본 통과, 수정contact/phone 실제 재확인 후 사용자 inline 표시. upscale/최종본0.

escape-hen 실제33표본/contact4장 전부 검사·SHA 승인. 잭1/닭1·원래 hush 손이 닭 받침으로 내려감·다리 미세 움직임·눈 감은 잠든 거인1/미세 호흡 유지, 깨어남/복제 없음. 초반 이후 카메라 push-in 동반·정확한 출구 방향 한 걸음으로 주장하지 않고 표정/닭 눈·고개 움직임을 기록. 승인 source10개/최종본0. castle repair 생성 중.

castle-v2 실제19표본/contact3장 모두 검사·승인: 전구간 원래 갈색머리 잭1·두 손/부츠·문/왕좌/구름성 유지, 흰머리 아이/새 인물 없음. 고개/눈/표정·작은 몸 기울임 있으나 카메라가 push-in 뒤 끝 wide로 돌아오는 실제 결과를 기록하고 fixed shot/발걸음으로 주장하지 않음. 승인 source11개/최종본0. main25820 home-hen 진행.

home-hen 첫 native 실제17표본/contact2장 검사에서2초 이후 원본에 없는 큰 하프가 식탁에서 생겨 제외/history/home-hen-v1 보존. H3 positive의 부정문에 하프 명시가 있던 점을 확인하고 이름 언급 자체를 제거(인과 확정 주장은 아님), 실제 기존 두 사람/닭/황금알/그릇/빵과 빈 표면 유지로 수정. 승인 home-hen-v2만 원본으로 쓴 다른 끝 자세 Qwen home-hen-end-v2 worker37700 생성. 이후 같은 ref와 다른 끝 guide/SHA gate로 home-hen만 재생성 예정. source11개 유지/최종본0.

coins 실제16표본/contact2장 모두 검사·SHA 승인: 잭1·한 큰 자루·두 손/팔·얼굴/의상·원래 금화더미 유지, 금화낙하/반짝임·표정/몸 기울임 확인. 지시의 잠깐 낙하 후 정착 대신 전구간7.3s 금화 stream인 실제 결과를 기록, 새 자루/사람 없음. source12개/최종본0. home-hen-end Qwen 진행, harp 뒤 순차 생성.

home-hen-end-v2 신규 전체 이미지 실제 승인: 앉은 잭/엄마2명·닭1·황금알1/그릇·빈 그릇/빵·원래 의상/종이 집 질감·비어있는 식탁 유지, 하프 없음. 다른 끝 guide 세 번째 승인(전체 신규 승인 후보22장). 해당 H3 repair worker10716 시작, 현재 harp 뒤 직렬 큐. source12개/최종본0.

harp 실제17표본/contact2장 전부 검사·SHA 승인. 잭1·눈 감은 잠든 거인1·황금/청록 하프1와 통합 파란 머리 얼굴/목 장식 유지, 별도 여자 몸/팔 생성 없음. 잭 손/표정·하프 눈/머리 움직임과 후반 camera push-in 실제 기록. source13개/최종본0. home-hen repair 진행, main alarm 대기.

home-hen-v2 새 SHA 일치17표본/contact2장 전부 검사·승인. 잭/엄마2명·닭1/날개깃·황금알/그릇/빵 유지, 두 사람 손/표정·닭 고개/눈/깃 움직임 지속. 전구간 하프/새 물체 없음 확인하여 조기 하프 등장 문제 수정 완료. source14개/최종본0, main25820 alarm 생성 중.

alarm 실제39밀집표본/contact5장 전부 검사·SHA 승인. 잭1 반응/손 내림·뒤 원래 거인1 입/눈 깨어난 표정·하프1 통합 파란 얼굴/입 열고 닫기/시선 유지, 별도 여자 몸/팔·새 인물·거인 근접 없음. 원본 종이조각/음표는 그대로인 실제 결과 기록. source15개/최종본0, run 생성 시작.

가로 climb의 실제 뒷모습 오류를 세로에서 반복하지 않도록 같은 앞얼굴 유지/다른 높은 끝 자세를 세로에도 적용하기로 했다. 승인 climb-portrait만 원본인 Qwen climb-portrait-end-v2 worker5124 제출, 실제 새 전체 이미지 승인 후 portrait guide에 추가하고 기존 H3 main client만 새 계획으로 교체(실제 실행/대기 GPU prompt는 보존·동일 graph receipt로 이어받음) 예정. 아직 기존 main25820 run 생성, QC10588 유지. source15개/최종본0.

run 새 SHA 일치39표본/contact5장 전부 검사·승인. 잭1 실제 전경 방향 교대 보폭/발 접지·두 손이 하프1 잡음·하프 파란 얼굴이 턱 아래 장식으로 유지, 얼굴 대체/별도 여자/거인 생성 없음. 문은 뒤에 유지. 후반 tracking/push-in으로 다리 가려지고 표정이 작은 미소로 완화되는 실제 결과를 기록, 전구간 fixed/긴박 표정이라고 주장하지 않음. source16개/최종본0. 세로 climb end Qwen 진행/descend 대기.

climb-portrait-end-v2 신규/원본 전체 이미지 실제 비교 승인: 동일 잭1 정면3/4 두 눈·두 손/부츠·약간 높은 자세·같은 황금 종이 하늘/집/줄기 확인. 끝 guide4장/전체 신규 승인 후보23장. 상대 경로 실행인 main25820는 psutil cwd와 cmdline으로 소유 확인 후 polling client만 종료, GPU 큐는 보존. 새 main15980(h3-current-plan-v3.log/.err)이16기존 source cache/SHA 검증 후 기존 descend prompt bbbe5bd1-96b7-4d63-971f-7c3953d32d92를 동일 graph receipt로 이어받음; 신규 중복 제출/계산 중단 없음. QC10588 유지, 세로 climb에 다른 끝 guide 계획 적용. 최종본0.

descend 첫 native33표본/contact4장 실제 검사에서3초 이후 큰 camera roll로 원래 대각 줄기가 수평처럼 변하고 잭의 한 손 grip이 풀려 팔을 늘어뜨리는 동작 확인, 제외/history/descend-v1 보존. 동일 구도/조금 낮은 foothold·한 손 줄기 grip/다른 팔 하프·거인 위쪽 분리를 유지하는 long/portrait 다른 끝 자세 Qwen2장 worker26968 생성. 같은 오류를 세로에서 반복하지 않도록 함께 보정. 두 새 앵커 실제 승인 후 H3 계획/클라이언트를 갱신해 빠진 descend부터 같은 durable receipt 방식으로 생성하며 현재 main15980 axe-return 진행은 유지. source16개/최종본0.

axe-return 실제33표본/contact4장과2s/4s 손-날 간격 추가 표본 확인·승인. 엄마 두 손이 같은 목재 손잡이 유지·살짝 앞으로/아래 움직임, 잭 빈 열린 손과 도끼 금속 사이 간격·얼굴/팔/옷 유지, 전달/손 엉킴/몸 관통/새도구 없음. source17개/최종본0. descend 끝 참조2장 생성, chop 대기.

descend-end-v2 전체 이미지 및 확대 harp detail 실제 검사에서 파란 머리 여성 얼굴 장식이 plain blue curl/frame으로 지워진 것을 확인해 rejected-anchors.json SHA 제외 기록. 두 인물/손·줄기 구도는 유지한 같은 후보를 첫 참조로, 원래 harp 참조만 추가해 얼굴/눈코입만 복구하는 descend-end-v3 Qwen worker37032 제출. 세로 end-v2 worker26968은 chop 뒤 직렬 대기 중. 아직 두 새 하강 끝 참조 승인0, source17개/최종본0.

chop 실제36밀집표본/contact4장 전부 검사·SHA 승인. 잭1이 실제 도끼 올림/내림 여러 cycle·두 손 한 목재 손잡이·두 팔/부츠 접지 유지, 오른쪽 은색 절단날이 줄기만 맞고 원래 notch/종이chip 커짐. 몸 관통/새팔/도끼/사람 없음. 정확히 한 번 대신 여러 번 찍는 실제 동작으로 기록하여 이야기의 벌목 동작으로 승인. source18개/최종본0. 현재 세로 descend end Qwen, 그다음 long end 얼굴 복구, fall은 대기.

세로 descend-portrait-end-v2 원본/전체 이미지 실제 비교 승인: 잭 아래/거인 위 분리·잭 한 손 줄기 grip/다른 팔 하프1·하프 통합 파란 얼굴·양쪽 부츠와 앞얼굴 유지. 원래 작은 미소 유지이며 정확한 낮은 foothold/긴박 표정이라고 주장하지 않음. 끝 guide5장. 가로 descend-end-v3 전체/확대 실제 검사에서도 얼굴이 사라져 제외(rejected SHA 기록); 실패 후보 반복 patch 대신 원본 p12+harp identity에서 최소 자세 변화 descend-end-v4 Qwen worker30020 제출. source18개/최종본0, H3 main15980 fall 진행·QC10588 유지.

fall 初回42밀집표본/contact5장 실제 검사 제외: 거인 제자리 유사 달리기와 잘린 줄기가 오히려 점점 upright해지는 반대 움직임. history/fall-v1 clip/meta/receipt/graph/history 보존. 원래 fall-v3를 유지하고 우측으로 더 쓰러진 녹색 줄기/오른쪽 멀어진 지면 거인을 별도 Qwen fall-end-v2로 생성, 실제 승인 후 end guide 적용 예정. source18개 유지, main15980 relief 진행.

descend-end-v4 전체/원본p12 실제 비교 승인: 잭 아래/거인 위·한 손 grip·다른 팔 하프1와 통합 파란 여성 얼굴(눈/코/입)/앞얼굴·부츠·대각 줄기 유지. 정확한 하강 거리는 주장하지 않음. 승인 끝guide6장. long/portrait descend end guide와 no-roll/constant-grip action 적용 후 소유검증한 polling main15980만 종료, 실제 relief prompt/큐 보존. main33220(h3-current-plan-v4.log/.err)이 fall만 제외한30jobs를 처리, 기존18 SHA 검증 후 새 descend 제출. fall-end-v2 worker35016 승인 후 fall별도 생성/리뷰 예정. QC10588 유지.

relief 실제20표본/contact3장 확인·승인: 잭 왼쪽/엄마 오른쪽2명·어깨 손/팔·얼굴/옷 유지, 표정/시선/눈 움직임·후반 앞 보기, 새인물/도구 없음. source19개. main33220가 descend 대기 중이라 동일 relief durable graph receipt를 재조회한 단발 client로 완료 clip을 회수(새 GPU 제출 없음), 메인 이후 cache 검증 재사용. fall-end-v2 전체 실제 확인에서 녹색 줄기 우측 기울기는 개선됐지만 짧은 통나무로 끝 잘림/두 발 들림, 미승인/rejected SHA. 같은 후보에서 줄기 오른쪽 화면 밖 연장/거인 한 발 접지만 Qwen fall-end-v3 worker38584 보정.

descend-v2 33밀집표본/contact4장 실제 검사 제외: 하프 얼굴은 복구됐으나6s 자유손 grip 해제·camera roll·7.25s 갑작스러운 wide 끝 프레임. 끝 guide만으로 수정 안 됨, history/descend-v2 보존. 이미 승인된 giant-chase의33표본/contact4장 전체 재확인에서 grip/인물/하프 유지·급격한 종료컷 없음 확인. 롱폼 descend는 동일 사건을 미리 보여준 도입의 giant-chase 승인 원본을 다시 사용하는 source-map으로 편집, 별도 신규생성 주장 없음.24롱비트 그대로, 고유 source30개(롱22/숏8), 기존 seed index를 job제거 전 고정해 모든 진행 receipt graph 보존.
fall-end-v3 전체 실제 승인: 우측 얕은 기울기 녹색 줄기·그루터기/잭 왼쪽·거인 오른쪽 한 발 접지/다른 발 들림 유지, framing변화와 유한 줄기 끝은 거인에 가림 그대로 기록(화면 밖 확실히 연장 주장 없음). native에서 실제 우측 넘어짐/거인 이동·줄기 shortening/morph 검사 필요. 승인 끝guide7장. fall seed610935/clockwise pivot+rightward travel/endguide 계획 적용; 소유확인 main33220 polling만 종료, 실행 ending prompt 보존. 새 main24284(h3-current-plan-v5.log/.err) 전체30jobs/19기존SHA 검증 후 fall repair 제출, 기존 ending 동일 stable seed graph로 이어받을 예정. QC10588 유지. 최종본0.

ending 전체20표본/contact3장 실제 검사에서3s 이후 엄마 fade/배경 야간별 변환·후반 잭 소실 확인. 추가0.25s 간격14표본/contact2장으로 안전부분0-2.75s만 승인(3.25s 엄마 ghost 시작). 원본 전체 미승인, verified usableRanges 명시. source19전체+1부분, 최종0. long23 relief는 home-hen0-7s와 필요 시 relief앞부분으로 잇고, long24 ending은 table0-2.75s→relief1.5s부터남은 길이로 닫음(앞 close와 중복구간 없음). source-map maxDuration/continuation을 render/nativepreview에 적용, render 기존 range guard 유지. prepare_enhancement는 부분source의 모든 사용 map이 승인범위내 명시maxDuration일 때만 허용; 화질comparison도 그 안전범위의 시작/중간/끝3표본으로 제한. 전체64음원/68edit segments source길이 preflight 통과. 기존영어음원 길이에 맞춰home-hen최대7s로 명시(8.5s 전체사용시원본부족 문제 예방). main24284 fall repair, QC10588 유지.

fall repair 실제42밀집표본/contact5장 전부 확인·승인: 같은 녹색 줄기/그루터기에서 실제 clockwise down/right 넘어짐, 잭 왼쪽 부츠/낮춘 도끼/두 팔 유지·거인 오른쪽 배경 교대 접지/달리기. 거인 net이동 작음/중간 줄기 foreground가 거인 상체 가림/끝 줄기 foreshortening으로 유한segment 그대로 기록, 큰 우측퇴각/원래길이불변 주장 없음. 거인 부상/압사/새 인물/팔/급격한 종료컷 없음. source20전체+부분1, 최종0. main24284 axe-call-portrait 시작; 이후8세로와 oven-continuous 남음.

axe-call-portrait 실제22밀집표본/contact3장 전부 확인·승인. 잭 실제 앞grounded step·두 빈손 gesturing/말하는 입·엄마 눈/입/손 반응, 원래2명/옷/부츠/콩줄기/집 유지, 새거인/도구/팔·정지tail 없음. 얼굴전체 유지/minor drift 기록. source21전체+부분1, 최종0. main24284 trade-portrait, QC10588 유지.

trade-portrait 실제12표본/contact2장 전부 확인·승인: 원래 잭 오른쪽/노인 왼쪽·지팡이/손바닥 콩cluster·얼굴/옷 유지, 잭 실제앞lean/눈/입반응·노인시선/빛움직임. 후반push로부츠가려짐/cluster그대로, fixedcamera/한알 주장 없음. source22전체+부분1, 최종0. main24284 climb-portrait 생성, QC10588 유지.

climb-portrait 실제28밀집표본/contact4장 전부 검사·승인. 잭1 전체앞3/4 두눈·표정/눈·원래두손 grip/부츠/굽힌무릎 유지하며 몸이줄기에대해조금상승, 원래황금종이하늘/집/옷 유지. 뒷모습전환/새팔/급격한종료컷 없음, minorframing drift/정확한새leaf한발주장없음 기록. source23전체+부분1, 세로3/8, 최종0. main24284 hen-portrait, QC10588 유지.

hen-portrait 실제12표본/contact2장 전부 확인·승인. 원래깨어있는거인1·닭1/황금알1/둥지 유지(가까운컷잭없음), 거인손pointer/눈/고개·닭눈/부리/원래날개깃 움직임, 새사람/알/손 없음. 실제산란/잠든거인 주장없음. source24전체+부분1, 세로4/8, 최종0. main24284 alarm-portrait, QC10588 유지.

alarm-portrait 실제28밀집표본/contact4장 전부검사·승인: 잭왼쪽/거인뒤/하프오른쪽1 통합파란얼굴·입열고닫기/시선, 잭손내림/눈/반응/후반왼쪽보기·거인눈커짐 유지. 별도여자몸/팔/새인물/갑작스러운씬전환 없음. source25전체+부분1, 세로5/8, 최종0. main24284 descend-portrait, QC10588 유지.

descend-portrait 실제25밀집표본/contact4장 전부검사·승인: 잭아래/거인위·앞얼굴/두부츠/옷/하프1통합파란얼굴 유지, 자유손2.25s부터cleargrip끝까지유지/다른팔하프·거인원래grip분리 유지, roll/orbit/급격한끝cut/손놓임 없음. 작은몸/다리shift·눈/고개·잎움직임, 원래작은미소와완전lowerfoothold증거없음그대로기록. source26전체+부분1, 세로6/8, 최종0. main24284 chop-portrait, QC10588 유지.

chop-portrait 실제28밀집표본/contact4장 전부검사·승인: 잭1 두손한손잡이/두팔/부츠·오른쪽날이같은줄기notch 실제여러번찍음, 새도끼/팔/인물/부상없음. 올릴때도끼가얼굴앞잠깐가림/짧은사이rest/후반closeframing 실제기록, 전구간얼굴노출/fixed/정확히1번 주장없음. source27전체+부분1, 세로7/8, 최종0. main24284 ending-portrait, QC10588 유지.

ending-portrait 전체12표본/contact2장과원본전체참조실제비교제외: 원래뒤오른쪽하프가앞으로이동하며2.5s이후엄마가림, 마지막이잭/엄마행복대신잭/하프가됨. history/ending-portrait-v1 clip/meta/receipt/graph/history 보존. 원본ending-portrait단일참조에서두사람앞얼굴/원래식탁배치/뒤오른쪽작은하프고정하는 Qwen ending-portrait-end-v2 worker39780 제출. 현재 H3 main24284 oven-continuous 진행, Qwen후순위/그후세로ending repair예정. source27전체+부분1 유지, 세로7/8, 최종0.

oven-continuous critical sampling 누락을 motion_qc에 추가해0.25s 62밀집표본/contact7장 전체실제검사·승인. 원래잭1 불없는오븐안/얼굴/옷/두팔/arch손·거인원래두부츠/다리 바깥real weightshift/발움직임/dust 유지, 같은거인손top부분등장·새인물/부츠/팔 없음, 전경가림은있지만침범/부상없음. 불은왼쪽별도hearth로유지, 연속15.083s/no loop·minorcamera drift/dusthaze 실제기록. source28전체+부분1, 최종0.
ending-portrait-end-v2 신규/원본전체실제비교승인: 잭왼쪽/엄마오른쪽 전체두얼굴/원래손식탁/닭1·알바구니/빵/과일·작은하프뒤오른쪽고정 유지, 새사람/앞으로움직이는하프없음. 끝guide8장. H3 main24284 자연종료(전체선택생성완료메시지는실제최종완성아님), Qwen39780도완료. 새 one-job H3 ending repair24848(h3-ending-portrait-v2.log/.err), seed610949/같은끝guide/식탁물체고정 적용. QC10588 유지; 이컷실제승인후 전체30source enhance 준비.

ending-portrait repair 실제12표본/contact2장 전부검사·승인. 잭/엄마두얼굴끝까지노출/서로고개·시선·눈/원래손/옷·식탁자리유지, 닭눈/깃조금움직임/알빵과일·하프뒤오른쪽작은얼굴고정, 엄마가림/앞하프/fade/새사람없음. source29전체+ending0-2.75부분1=30검수완료, 세로8/8, 최종0. QC10588 모든30전체decode/res/fps/frame/black검사완료후자연종료. H3 repair24848/Qwen39780도자연종료. prepare_enhancement30sources/hash/부분map limit검증통과. Comfy8189/8190두queueidle·Voiceboxtasks0+Python17493ESTABLISHEDstream없음확인후RealESRGANx2 worker실행(upscale-current.log/.err), 공유서버유지. 프레임수/FPS보존후각30화질전후실제표본비교와최종4편검수남음.

RealESRGANx2 worker31540(upscale-current.log/.err), CPUenhance QC39616(enhancement-qc.log/.err) 시작. 완성각source후decode대신프레임수/FPS/2x크기/sourceSHA와3시점전후비교추출, 실제검수는별도qualityreview필요. axe-call/giant-chase/question 전후3표본sheet 실제확인/face손옷종이색유지승인. 네최종render KOlong32404/KOshort9972/ENlong25820/ENshort37924 실행(새PID25820은이전H3client와다른renderprocess), 검수완료source만통과하고미검수는대기. 최종자동QC/shot추출worker31796(final-auto-qc.log/.err) 완료manifest SHA가생길때만실행, 직접최종contact/shot/phone검수전autoapproval없음. 최종본아직0.

화질 보정 전후 24/30 source 실제 3시점 비교 승인 완료. alarm/run/axe-return/chop/fall/relief/ending(0-2.75s만)/axe-call-portrait/trade-portrait/climb-portrait 추가 검사. 인물 얼굴/손/소품/종이질감 보존; ending 전후 표본은 승인된 사용 범위 안에서만 추출. 네 최종 render 검수된 source 대기/조립 중, 최종0. production-status 오래된 H3 PID/31개 카운트를 현행30개/upscale·render PID로 갱신.

RealESRGANx2 모든30source 보정·자동frame/FPS/2x크기 검사와3시점전후 실제비교완료, audit_enhancement 모든source/review SHA검증 통과. KOshort37.100초/ENshort38.033초 1080x1920/30fps 최종생성, 전체decode/black/음량/faststart 자동통과 및 각각전체 contact3장·shot2장·phone 실제검수/최종SHA검수기록 완료. 한국어17/영어19자막, 얼굴/소품/자막안전위치 확인. 롱폼 두편 최종render진행, 최종완성2/4·외부등록/push미수행.

## 2026-10-13 최종 네 편 검수 완료

| 영상 | 길이 | 크기/FPS | 자막 수 | 최종 화면 표본 | LUFS / true peak |
| --- | --- | --- | --- | --- | --- |
| 한국어 롱폼 | 177.958s | 1920×1080 /24 | 61 | 109+shot26+phone | -17.9 / -1.9dBFS |
| 영어 롱폼 | 179.250s | 1920×1080 /24 | 74 | 122+shot26+phone | -17.8 / -2.1dBFS |
| 한국어 숏폼 | 37.100s | 1080×1920 /30 | 17 | 33+shot8+phone | -18.0 / -4.8dBFS |
| 영어 숏폼 | 38.033s | 1080×1920 /30 | 19 | 35+shot8+phone | -18.0 / -2.4dBFS |

`jack-ko-long.mp4`, `jack-en-long.mp4`, `jack-ko-short.mp4`, `jack-en-short.mp4` 모두 전체decode/검은화면 없음/H264 yuv420p AAC48k stereo faststart/음량 검사 통과. 171자막과 모든 비트 시작·끝 299표본 contact 총33장, 편집68구간 shot14장, phone4장 실제 육안 확인. 기존 64Voicebox WAV 해시/문장ASR 검사와 고유30native 동작 밀집표본 검수, RealESRGANx2 전후90시점 실제 비교가 별도 근거다. 전체 영상을 모든 프레임 직접 시청하거나 전체 나레이션을 수동 청취했다는 주장은 하지 않는다.

롱폼의 도입 추격은 후반 같은 사건에서 다시 쓰며, 독립 long descend 재생성 성공으로 기록하지 않는다. ending은 검수된0–2.75초만 사용해 가족 relief close로 잇는다. 일부 climb/descend의 큰 공간 이동 및 fall 거인의 먼거리 이동은 제한적이며, 실제 확인한 손잡기/몸·발·잎 움직임과 넘어지는 줄기만 승인했다. 문제 컷/참조/history는 보존했다.

한글/영어 각 타임라인용 SRT·나레이션MP3·BGM포함 자막/나레이션 없는 clean 원본과 YouTube 썸네일/제목·설명 초안은 `delivery/`, 최종SHA/검수는 `final-review.json`, 전체 출처해시는 `delivery-provenance.json`. 30개 선택 H3 성공 실행 합계12770.197초(약3시간33분, 큐대기 제외·모델load/decode 포함, 실패재시도·Qwen/TTS/보정/검수시간 제외)는 `native-execution-times.json`; 전체 제작 경과시간으로 말하지 않는다. 모든 생성/보정/최종render/QC worker 자연종료 및 upscale lock 제거 확인. 공유 ComfyUI/Voicebox 서버 유지. 다음 책은 사용자 컨펌 후; DB/R2/Editor2/마케팅 등록/main push/발행 미수행.

전달 검증 최종통과: `validate_delivery.py`가 최종4편·clean4편·MP3 4개, 총12media 전체decode/길이/크기와 출처자산1008개 SHA/bytes 일치·published=false 확인. 실행시간 기록을 패키징 도중 추가해 처음 해시불일치가 났으며, 상태/기록을 먼저 고정한 뒤 package 재실행·전체 전달검사를 다시 통과했다. 최종 결과는 `delivery-validation.json`. 문서 링크경로/diff 공백 검사 통과, 해당3문서만 로컬 커밋; 사용자 컨펌 대기.

## 2026-10-13 사용자 동작 반증·수정

사용자: 하프를 들고 뛰는 잭이 걷는 느낌이고, 약2:35 콩나무가 무너질 때 거인이 어색함. 이전 run의 작은 cautious step과 후반close framing, fall의 boot cycle/제한적실제이동 승인은 사용자 기준을 충족하지 못했다. 기존 전체4편과 ledger/검수는1차본으로 보존. 로컬 Qwen2.1로 같은잭/하프의 전신 긴보폭 sprint 앵커 및 거인없는fall 시작·끝, 같은거인 단독전신 달리기 앵커를 생성해 실제검수 후 H3 재생성. 쓰러짐과 거인 도망은 분리편집하여 자연스러운 이동을 확보, KO/EN 롱폼 동시수정·음원/자막/숏폼 그대로. 운영등록/push미요청. repair_refs.py/repair-refs.log/.err, 새자료 repair-20261013/.

수정앵커 실제검수: run-fast 원래잭/하프 전신긴보폭(정면3/4이므로 H3도정면뒤tracking), fall-clean 거인없는원래줄기/잭, giant-flee 원래거인단독옆면긴보폭·오른쪽빈길, fall-clean-end-v2 동일위치/길게오른쪽프레임밖으로나가는줄기승인. 처음 end guide는짧은통나무/잭위치이동으로제외. Qwenextra 절대경로input파일명콜론오류를basename으로고쳐실행성공. refs검수SHA repair-20261013/verified-refs.json. 기존4편/전달/manifest/QC/ledger를 history/delivery-v1에복사하고해시일치확인. H3수정3개 run-fast9.417s/fall-clean5.167s/giant-flee5.167s 로컬8steps 같은LoRA/모델 설정 제출, CPU repair_qc38556은고유3파일decode/0.25s밀집표본만추출·자동승인없음. 예정한영컷분기KO158.458/EN157.500초로각언어거인비명시작직전도망컷, 오디오/자막길이그대로.

수정 run-fast 1차 H3는 실제contact01/02에서 긴보폭은 개선됐으나 파란구름/효과와환경변화가 생겨 제외·보존했다. 같은승인앵커로 효과/연기/색motion trail 없이 원래복도/전신 빠른달리기 run-fast-v2(seed611411) 별도worker7924/QC1840 재생성. 원래repairworker20924는변경없음. fall-clean 실제22표본/contact3장 검수: 거인없이 긴줄기오른쪽으로낮아져3.5초부터수평, 잭/도끼/부츠/원래정원유지, 잘린줄기와stump분리·끝약간뜬높이는실제기록. long사용첫4.5/4.625초승인. 운영미수행.

giant-flee 실제22밀집표본/contact3장 전부검수·승인: 원래거인1 옆면오른쪽긴airborne보폭/팔pump/망토, 길을오른쪽으로실제이동해3.5s쯤exit. 요청locked와달리카메라righttracking·2.25–3.25s새전경종이나무가자연가림, 끝empty path기록. 잭/도끼/추가팔다리/쓰러지는줄기없음. H320924/QC38556 자연완료, run-fast-v2/QC만진행.

run-fast-v2도실제contact01/02(0–4.25초)에서파란구름이재발해제외·보존. 완료H3/QC7924/1840, 아직롱폼최종교체없음. negative cloud단어만늘리는재시도대신 원래run-v2/Jack/harp identity로strict side profile·닫힌돌복도/전신60%·긴airborne보폭 run-side Qwenworker39344 생성. 이후positive-only H3 달리기와필요시같은구도끝guide, 원래목소리/시간유지. giant/fall현재승인유지.

run-side 시작/끝Qwen실제검수: 잭원래주근깨/머리/올리브패치옷/부츠·작은하프통합얼굴/두손, 오른쪽옆면긴airborne보폭/닫힌황갈색돌복도유지. 크기는요청60%보다큼·끝다리완전반대phase는아니며원래긴달리기자세유지로만승인. 2guide H3run-side seed611421 worker29264/QC24832, cloud관련단어를긍정설명에서완전히빼고옆tracking/빠른연속stride만지시. Qwen39344/39888 자연완료, 실패run-fast/v2보존·최종미반영.

run-side H3 실제39밀집표본/contact5장 전부검수·승인: 옆면오른쪽긴보폭/push-off/두발뜸/몸bounce·기둥/바닥이왼쪽으로지나가며실제전진, 원래잭/작은하프/두손/부츠/돌복도유지·파란구름/새인물없음. 전경기둥잠깐가림과빠른다리blur, 끝약0.5s airborne guidepose정착은기록. H329264/QC24832완료. map long18=run-side/22=fall-clean→giant-flee 및70편집구간길이검증/33source준비통과. GPU두queue0확인후upscale16964·새3개onlyQC5392, KOlong36660/ENlong10032·수정finalQC33292 시작, 실화질/최종검수전자동승인없음.

수정3개RealESRGANx2 완료(run59/fall34/giant33초), 동일프레임/FPS/2x크기/hash guards와각실제3시점전후comparison검수승인. run중간4.71s는기둥가림 그대로양쪽동일, giant끝은exit후빈길·중간전경나무가림이며native와일치. audit_enhancement 보존30+수정3=33전체등록/hash검사통과. upscale16964/QC5392 완료·lock정리, 한영final렌더진행. run caption시뮬레이션2s 실제원래88px자막/긴airborne보폭확인, 최종QA별도남음.

## 동작 수정본 최종 전달

한글/영어 롱폼의 18번 장면을 `run-side`로 교체했다. 옆면 긴 보폭과 반복 push-off/두 발이 뜨는 달리기, 왼쪽으로 지나가는 복도 기둥으로 빠른 이동을 확인했다. 22번 장면은 `fall-clean`에서 줄기가 오른쪽으로 쓰러진 뒤 원래 거인이 긴 보폭으로 달려 나가는 `giant-flee`로 연결했다. 전환 시점은 KO158.458초/EN157.500초로 각 언어 비명 시작 직전이다. 정면 재시도 두 버전의 파란 구름은 제외하고 증거를 보존했다. 전경 기둥·나무의 짧은 가림과 run-side 끝 약0.5초의 guide 자세 정착은 실제 관찰한 한계다.

수정본은 기존 경로 `jack-ko-long.mp4` 177.958초, `jack-en-long.mp4` 179.250초, 1920×1080/24fps/88px 자막이다. 두 롱폼 전체 decode/검은 화면·freeze 없음/A-V/faststart/음량 검사를 통과했고, KO109·EN122 자막/비트 표본(contact27장), 편집54구간(shot10장), 작은 화면2장 모두 실제 확인했다. 새 원본3개 동작83밀집표본(contact11장)과 보정 전후9시점 검수는 별도 증거이며 전체 프레임 수동 시청·전체 청취로 보고하지 않는다. 음량은 KO-17.9LUFS/-1.9dBFS, EN-17.8LUFS/-2.1dBFS로 유지됐다.

`repair-20261013/invariants.json`은 64음원 SHA, 171자막/ASS/SRT/길이·비트 타이밍, 다른 롱폼 장면과 숏폼 두 영상 SHA가 그대로이며 두 롱폼 인코딩 오디오도 1차본과 일치함을 확인한다. 보존 원본30+수정3의 검수/보정 증거33개, 현재 네 최종본이 실제 쓰는 고유 원본31개, 편집70구간을 구분한다. 이전 최종4편·검수·전달 파일은 `history/delivery-v1/`에 보존했다.

`jack-motion-fixes-preview.mp4`는 완성된 한국어 롱폼에서 바뀐 두 장면을 음성·자막과 함께 뽑은 약18초 확인용 영상이며 전체 decode를 통과했다. 한영 SRT·나레이션MP3·언어별 clean 원본도 갱신했다. 상태/검수/스크립트/안내를 먼저 고정한 뒤 `package.py`, `validate_delivery.py`를 실행해 최종4편+clean4편+MP3 4개 총12media 전체 decode/길이/크기 및1168자산 SHA/bytes 일치·published=false를 확인했다. 안내문은 해시를 만들기 전에 저장하도록 순서를 고쳤다. 완료 근거는 `delivery-validation.json`, `final-review.json`, `delivery-provenance.json`이다.

모든 이번 생성/보정/렌더/QC worker 자연 완료와 upscale lock 해제를 확인했다. 공유 ComfyUI/Voicebox 서버는 유지한다. 다음 책·DB/R2/Editor2/마케팅 등록/main push/외부 발행은 하지 않았다.

## 2026-10-13 사용자 승인

사용자가 “굿 좋다”로 동작 수정본을 승인했다. 수정한 한국어·영어 롱폼과 기존 숏폼 두 편을 합쳐 네 편을 확정본으로 기록한다. 전달 패키지의 상태 파일은 승인 전 고정된 검증 대상이며, 이후 승인 근거는 이 작업 기록에 남긴다. 운영 등록·main push·외부 발행과 다음 책 선택은 이번 승인 범위에 포함하지 않는다.
