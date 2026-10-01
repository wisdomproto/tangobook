# 여섯 콘텐츠 분류 장면 색칠

- id: 20261001-games-all-collections-scene-coloring
- domain: games
- status: active
- updated: 2026-10-01
- branch: codex/games-classic-scene-coloring
- worktree: C:/projects/tangobook/.worktrees/classic-scene-coloring
- integration: 기존 tests 시험판 순차 갱신 승인, 운영 책/게임 등록/main push 미요청

## 사용자 결정

기존 명작·전래 작업에 호리 생활동화, 호리 유치원, 호리 탈것, 자연관찰 전체를 같은 방식으로 추가하도록 요청. 같은 HTML에서 탭으로 잘 구분하도록 명시. 책당 대표2장, 원본 기반 Qwen-Image-2.1, 사용자 승인한 단순한 인물/큰 소품/흰 면/검은 닫힌 경계, 색칠 후 정확한 원본 쪽 읽어주기와 책 BGM 유지. 기존 명작 수정과 전래 검수도 취소되지 않았음.

## 실제 목록과 탭

2026-10-01 운영 읽기 전용 API의 현재 책 목록 및 전체 본문/삽화/TTS를 조회: 호리 생활45권443삽화쪽, 유치원20권200쪽, 탈것15권150쪽, 자연관찰101권1831쪽. 추가181권/대표362장 예정. 기존184권368장과 합쳐365권730장 목표이며 새362장 생성 완료는 아님. 각 책은 현재 한 책=한 그림체·한 레벨 모델 그대로 취급.

scripts/scene-coloring-collections.json에 실제 category 매핑. 생활동화→호리 생활, 호리 유치원동화→호리 유치원, 호리 세상 탐험→호리 탈것. 자연관찰은 육지/바다/하늘 동물·공룡·곤충·식물·우주와 자연·우리 몸8분류를 한 탭으로 합침. inventory-scene-coloring-collections.py는 원본 책 JSON을 읽기 전용으로 수집, 운영 데이터 수정 없음. 출력 루트 D:/ComfyUI-output/classic-scene-coloring의 hori-life, hori-kindergarten, hori-vehicles, nature 하위에 books/inventory.json/page-texts.txt 보관.

https://assets.tangobook.co.kr/tests/classic-scene-coloring/20261001-review-1/index.html 에 여섯 탭 반영. 서버 브라우저 실제6탭 표시, 자연관찰 준비 상태→전래40권80장 전환 시 콘텐츠 혼합 없음 확인. 탭별 선택 상태/키보드 좌우·Home·End 전환, 모바일 줄바꿈, 분류 변경 시 검색/그림체 초기화 및 음원 정리. sync는 분류별 manifest/source/lineart 경로 접두어를 사용해 기존 콘텐츠 보존. 아직 준비 중인 새 분류는 생성 완료로 표시하지 않음.

## 새 분류 첫 시험 장면

각 첫 책 본문 전체를 읽고8개 원본을 실제 육안 확인:

- 생활 01 골고루 먹으면 무지개 힘:2쪽 호리가 팔짱 끼고 채소를 거부/엄마 숟가락,7쪽 호리가 당근 먹고 다람쥐 콩이가 기뻐함.
- 유치원 01 다들 어디 가:6쪽 자동차 든 호리의 시무룩한 단독 장면,9쪽 엄마와 포옹.
- 탈것 01 삐뽀삐뽀 불자동차:3쪽 소방차·호리·아빠·토토·소방관,8쪽 호리와 호랑이 소방관이 호스 잡고 물 쏨/토토와 아빠. 원본 소방관 종족이 쪽별 사람/호랑이로 다르므로 생성 시 현재 원본을 따라야 함.
- 자연 강아지:11쪽 사람 손의 간식을 올려다보는 실제 강아지 사진,13쪽 몸을 말고 잠든 실제 사진. 본문 손 명령 때문에 원본에 없는 앞발 들기를 추가하지 않음.

prepare-additional-coloring-pilots.py로 각 manifest2장/source SHA/TTS/BGM 준비. 생활·유치원·탈것·자연 순서8장 생성하는 PowerShell exec97806 실행 중, 첫 생활 batch PID46736. 각 루트 batch-status.json/lock/log와 실제 PID 및 Comfy8190 queue/history 먼저 확인, 중복 제출/중단 금지. 환경 SCENE_COLORING_IMAGE_ONLY=1, SCENE_COLORING_SYNC_PREVIEW=1, SCENE_COLORING_ROOT와 SCENE_COLORING_COLLECTION을 분류마다 지정, 기존 run-classic-coloring-batch.py --comfy-url http://127.0.0.1:8190 재사용. 기존21장 수정 후보 worker PID45576도 보존.

기존 장면 설명의 캐릭터 목록이 실제 원본과 다를 때 키다리 아저씨처럼 다른 장면이 생성되는 반증이 있었음. 새 IMAGE_ONLY 모드에서는 낡은 scene_description의 등장인물 요구를 빼고 실제 참조 이미지의 인물 수/종족/행동/소품/좌표만 보존하도록 지시. PARTIAL_SELECTION은 첫 시험 책만 준비하기 위한 명시 opt-in이며 기본 명작/전래 선택은 그대로. 호리는 원본 큰 얼굴/귀/입 주변 크림 면/꼬리/넓은 줄무늬 외형 유지, 자연은 실제 종/몸 형태/행동을 보존하고 불필요한 의인화 금지.

## 남은 일과 재개

1. 실행 중인 첫8장 및 기존21장 candidate 생성 상태/PID/queue/history 확인. 기존 명작·전래 task도 함께 읽음.
2. 첫8장 원본/선화/filled/흑백/SHA/실제 붓질/정확한 원본 쪽 TTS/BGM 검수, 필요 시 Qwen 수정. 생성 성공을 승인으로 보고하지 않음.
3. 나머지177권 대표2쪽을 본문과 원본 구도로 선정하고 각 분류 selection/manifest를 확장. prepare-additional-coloring-pilots.py는 최초 시험본 전용: 나머지 manifest를 확장한 뒤 다시 실행하면 축소될 수 있으므로 재사용하지 않음. 운영 목록 전체181권을 끝까지 처리.
4. 분류별 runner로362장 생성·원본 대조·색칠 후 재생 검수, 같은 tests 갤러리 순차 갱신. 자연 및 생활의 누락 삽화쪽은 다른 실제 쪽을 골라 원본/TTS 연결 유지.
5. 기존368장 품질 후속도 완료하고 전체730장 최종 승인 후 사용자 알림. 코드/기록만 이름으로 stage해 로컬 커밋. 운영 책/게임 등록·main push·다른 게시 없음.

새 로컬 인어2 후보는 얼굴/꼬리 대부분 색칠되지 않아 manifest.previewHold=true. sync는 이 항목의 기존 공개 버전/SHA를 보존하므로 미통과 교체본이 자동 게시되지 않음. 최신 굵은 경계 후보도2칸2색8.6%로 실패, 근본 경계/색 대응 수정 필요. 정글북2 유색/노이즈 후보들은 모두 기각·미게시. 상세는 명작 task.

첫 생활2쪽 실제 생성/공개 확인. 원본과 선화 인물2명·팔짱 거부 행동·숟가락 유지 및 흑백 통과. filled 검사22칸6색48.4%지만 입 주변 크림 면이 얼굴 주황과 합쳐지고 꼬리 색 대응 부족: hori-life/review.json에 needs-color-alignment/approved=false 기록. 생성 성공과 최종 승인을 구분하며 실제 붓질/쪽 음원 검수는 남음.

## 2026-10-01 13시 이후 검수·확장

첫8장 배치는 네 분류 모두 generated-review-pending으로 종료. 이전 PID46736/43656/45664/33320과 exec97806을 재시작하지 않음. 원본/선화/filled8장 대조 및 분류별 review.json 기록: 자연 강아지13쪽은 말린 몸·잠든 머리·발/꼬리와 넓은 갈색 면을 보존, 공개 실제 붓질 후 정확한13쪽 원본 리빌 확인. 로컬 동일 ColoringPlayer의 native TTS5.904초 playing/ended, 해당13쪽 URL·BGM0.16/loop playing 및 종료시 정지, 초기화 후3물감 복구/재색칠 확인. 1색 큰 붓질로 기존90% 완료에 도달하는 자연스러운 단색 동물은 실패 처리하지 않음. 이 장의 approved-source-and-play와 재생/초기화 증거는 nature/review.json 및 player-sleeping-dog-*.json에 저장. 음성을 문장별 전사한 검수는 아님.

생활7쪽은 공개7색 실제 붓질로 정확한7쪽 리빌, 로컬 native TTS16.632초 playing/ended와 BGM종료 확인(player-hori-p07-audio-events.json). 원본 무지개 꼬리/다람쥐 크림 면·줄무늬의 원본 색 대응은 여전히 미승인. 유치원6쪽 버스 삭제/자동차 제외,9쪽 검은 줄무늬·크림 경계/앞치마색, 탈것3쪽 아빠 얼굴/빨간 차체 제외·8쪽 물줄기/차체 축소 등 각 원본 근거 후속을 기록. 나머지7장도 생성 성공을 승인으로 바꾸지 않음.

자연11쪽 머리가 열린 선 때문에 칠해지지 않음. 실제 원본 기반 Qwen6px 후보는 머리를 닫아5칸3색22.7%로 개선했으나 손가락 간식 누락, 목줄 파랑 제외/몸통 분홍 대응이 남아 미적용. 원본/후보/filled/SHA/흑백은 nature/candidate-batches/20261001-dog-head/review-workspace에 보관. 단순 칸 수 증가로 교체하지 않음.

IMAGE_ONLY 모드의 다음 생성은 v6-reference-closed-regions: 실제 원본 위치/비율 유지·6px 연속 경계·호리 크림 얼굴/배 면·넓은 줄무늬/꼬리 폐곡선을 명시. 모델이 지시를 어기는 경우도 실제 확인했으므로 프롬프트 버전만으로 합격 처리하지 않음. 첫 추가 유치원2권6쪽도 입 주변/줄무늬/색 대응 후속이 남음. 원본 수집 완료와 생성/영역 검사, 실제 게임 승인은 별도다.

유치원 추가8권 본문 전체와 원본16쪽을 대조해 scripts/kindergarten-scene-selection.json에 최초 책 포함9권18쪽을 선정. 3권6쪽은 원본 인물이 너무 작아서 준비 단계에서2쪽의 큰 얼굴/가방 장면으로 대체, 미사용 source는 삭제하지 않음. selection-contacts/sources-0.jpg·sources-8.jpg 및 대체2쪽 실제 원본 확인. 두려움→선생님 손, 인사 어려움→친구 악수, 배 아픔→선생님 돌봄, 블록 붕괴→재건, 책 읽기→음악 놀이, 넘어짐→손도장 약속, 도깨비 물건→크레파스 되찾기, 참는 송이→친구 위로를 선택. 신규 준비는12권24장이고 남은169권338장의 대표 선정이 필요하다(전체365권730장 목표 유지).

유치원 확장 runner PID32836/exec52035 실행 중, hori-kindergarten/batch-status.json·batch.lock·batch.log와 실제 Comfy8190 queue/history를 먼저 확인. SCENE_COLORING_ROOT=hori-kindergarten 실제 절대 경로, COLLECTION=hori-kindergarten, IMAGE_ONLY=1, SYNC_PREVIEW=1, Comfy8190. 기존 첫2장 해시 보존하고 신규16쪽만 이어 생성. 현재manifest가9권18장으로 확장됐으므로 최초 prepare-additional-coloring-pilots.py 재실행 금지. 다음 대표 selection 확장도 해당 분류 runner 종료/lock/queue부터 확인해야 한다.

validate-scene-coloring-media.mjs를6분류 공통 설정에 연결. 준비된392장 기준 제공 전체 언어+BGM698개 읽기 전용 조회·전체 디코딩/비무음 통과, 실패0. 기존 음원 캐시/ETag/SHA를 재사용하며 이 결과는 실제 플레이/발화 문장 승인을 대신하지 않음. 생성 중 신규16쪽의 원본 대조/실제 플레이 후속, 다른169권 준비, 기존 명작/전래 후속 모두 남음.

## 2026-10-01 14시 이후 추가 검수

유치원 PID32836 배치는18장 generated-review-pending으로 정상 종료, 실제 PID 부재 및 Comfy8190 queue0/0 확인. 새16장 모두 review-contacts/comparison-0.jpg·comparison-6.jpg·comparison-12.jpg에서 원본/선화/실제 엔진 filled를 대조했고 source/lineart SHA와 개별 판단을 review.json에 기록했다. 준비392장 모두 생성됐지만 최종 승인 수와 다르다. 유치원18장 중 새 최종 승인은 없다.

원본과 다른 중요 실패: 09권9쪽은 의자 밑에 웅크려 바닥 노란 크레파스를 찾는 호리가 앉아 그림 그리는 모습으로 바뀌고 의자가 삭제됨; 같은 책4쪽 도깨비에 원본 없는 안경/송곳니 추가; 07권9쪽 손도장 판에서 큰 손도장이 삭제됨. 04권3쪽 음식46필수칸, 05권5/8쪽 다수 작은 블록은 승인 난이도에 맞게 단순화 후속. 나머지는 각 원본 인물·악기·행동 유지 여부와 크림 얼굴/옷/줄무늬 색 대응 문제를 장별 기록했다. 본문06권7쪽 방울과 달리 실제 원본 곰은 마라카스이므로 원본을 따른다.

scripts/diagnose-scene-coloring-gaps.mts는 활성 도안/제품 엔진을 바꾸지 않는 오프라인 실험. 생활2쪽·유치원02권6쪽·자연11쪽에 임계값192와 기존 엔진 기준으로 작은 경계 틈 닫기 반경0/1/2/3의12결과를 gap-diagnostic에 저장. 실제 filled 비교에서 생활/유치원 크림 얼굴의 주황 합침과 자연 머리 흰 면은 해결되지 않았고 굵은 검정 접점이 생겼다. 자연 목줄 한 면만 개선돼 범용 엔진 변경/후보 적용 근거가 아님. 임계값/검수 기대값을 낮추지 않았다.

09권9쪽 실제 원본을 --reference로 지정한 Qwen 수정 후보 promptId=8cb04f0f-4a5a-49f4-ad85-80abffd6e41f, exec29155 제출. candidate-batches/20261001-source-action-repair/status.json에 원본SHA/출력/상태 보관, 자동 적용/게시 없음. 재개 시 history와 exec 상태를 먼저 대조하고 중복 제출하지 않는다. 핵심 행동·의자·크레파스·원본 외형과 filled/붓질을 확인해야 교체 가능하다.

동 후보는 정상 종료/history success 대조 및 흑백·원본/후보SHA 통과. 의자 밑 웅크림/바닥 크레파스/두 동물·도토리/꼬리를 복원하고 안경을 없앴지만 배경 서랍·선반·크레파스 다수 때문에48필수칸11색58.1%, 얼굴 크림 합침/흰 줄무늬 제외/꼬리 단일 색이 남아 미적용·미게시. review-workspace/comparison-000.jpg 원본/후보/filled 실제 비교 및 candidateReview 기록 완료. exec29155를 재시작하지 않는다.

남은 유치원11권 본문 전체를 읽고22개 원본을 selection-contacts/remaining-0·6·12·18.jpg에서 대조. 12권9쪽 몽글이의 작은 떠나는 구도 대신6쪽 큰 단독 구도 선택, 20권9쪽 다수 가족/아이 단체 대신2쪽 선생님·호리 돌봄 큰 구도 선택. 대체 원본2개도 개별 육안 확인했다. 유치원 전체20권40쪽으로 selection/manifest 확장, 기존18개 생성본과 검수 기록 보존. 추가 선택은08[7,9],11[3,9],12[2,6],13[4,9],14[3,9],15[2,6],16[2,8],17[3,10],18[5,8],19[4,8],20[2,3]. 할머니 실제 원본은 호랑이 외형이므로 본문 토끼 할머니만으로 종족을 바꾸지 않는다. 원본 손의 실제 별 스티커/돋보기/아기인형/가위/쓰러진 물통 등 주요 소품 유지 후속 필요.

새 유치원22쪽 runner PID30004/exec76888 실행 시작, 첫08권7쪽 promptId=ed28962a-8182-41ca-aaf2-4d7d597375c8. 기존 v6 IMAGE_ONLY=1/SYNC_PREVIEW=1/Comfy8190 경로로 순차 생성, batch-status/lock/log 및 실제PID/queue/history 확인 후 이어간다. 신규 분류 대표 준비는23권46장, 전체 준비414장(현재 최소392생성), 남은158권316장 대표 선정 필요. 392장698음원 검증 범위를 신규22쪽까지 검증했다고 확대하지 않는다.

## 생활·탈것·자연 진행 누락에 대한 사용자 지적과 조치

사용자가 다른 세 분류는 왜 하다 말았는지 지적. 당시 실제 상태는 생활/탈것/자연 각각 첫1권2장 생성·후속 검수, 유치원만20권40장 준비/24장 생성이었다. 유치원에 집중하며 다른 세 분류 전체 확장을 미룬 일정 문제이며 기존 전체 범위가 취소된 것이 아니다. 앞으로 한 분류 검수에만 매달리지 않고 세 분류 원본 선정/제작도 함께 이어가야 한다.

생활02양치/03손씻기, 탈것02구급차/03순찰차, 자연 고양이/토끼 총6권 본문 전체와 원본12장을 실제 확인. 분류별 selection-contacts/next-four.jpg 증거. scripts/hori-life-scene-selection.json·hori-vehicles-scene-selection.json·nature-scene-selection.json 신규. 각 최초1권2장 보존 후3권6장으로 manifest 확장했고 기존 source/lineart SHA 모두 보존 확인. 생활 양치 거부→직접 칫솔질, 배 아픈 콩이→호리와 비누 거품; 탈것 실제 원본 사람 대원·경찰/호리·엄마·곰과 구급차/들것·산소마스크/운전석·핸들; 자연 실제 고양이 앞발 핥기/옆으로 잠, 긴 귀 토끼 단독/어미와 새끼3마리 총4마리를 유지해야 한다. 문장으로 원본에 없는 동작/종족을 추가하지 않는다.

D:/ComfyUI-output/classic-scene-coloring/continue-additional-collections.ps1 후속 순차 실행 PID28704/exec98482 연결 완료. additional-collections-order-status.json 현재 waiting-for-kindergarten. 기존PID30004 종료 및 generated-review-pending 확인 후 Comfy8190 큐가 비면 생활→탈것→자연을 순차 생성/같은 시험판 sync. 이미 실행 중인 분류 runner/Comfy 작업 발견 시 보존, 실패 시 상태 기록 후 정지하며 임의 중복/재제출 없음. 숨김 창 Start-Process는 자동 승인 검토에 차단돼 실제 실행하지 않았고 별도 창 없는 exec 방식으로 실행 성공했다. 후속 script 재시작 전 PID28704/각분류 runner/queue/history/status를 확인한다. 새12장 생성·육안/filled/실제붓질/정확한 쪽TTS/BGM 검수는 아직 완료 아님.

준비 전체426장, 신규29권58장. 유치원20권40장/생활3권6장/탈것3권6장/자연3권6장 준비, 남은152권304장 대표 선정 필요. 각 전체 범위 생활45권90장·탈것15권30장·자연101권202장·유치원20권40장은 그대로이며 기존 명작/전래368장 품질 후속도 유지한다.

## 사용자가 전체 범위 실행을 다시 명시

사용자: 탈것/자연관찰도 왜3권까지만 하는지, 전체를 해야 한다고 재차 지적. 3권은 제출 준비 분량이지 범위 제한이 아니지만, 이후 전체 선정/제작을 연결하지 않은 일정 문제가 반복됐다. 전 권을 먼저 작업 목록으로 확정하고 원본 선정부터 생성·검수까지 끝까지 이어가며, 일부 책 생성만으로 해당 분류 작업을 끝내지 않는다.

2026-10-01 기존 후속PID28704/exec98482와 유치원PID30004는 정상 종료, 추가 세 분류 각6장 생성 완료. 상태 additional-collections-order-status.json=generated-review-pending. 이 완료 runner를 재시작하지 않는다. 새 생성본12장과 유치원 나머지22장 게임 검수는 아직 남아 있다.

탈것 나머지12권 본문 전체와 실제 원본24장을 selection-contacts/all-remaining-0·6·12·18.jpg에서 육안 확인, scripts/hori-vehicles-scene-selection.json을 전체15권30장으로 확장. source-selection-review.json에 원본SHA/쪽별 핵심 소품·행동·원본에 따른 사람/동물 변경 주의 기록. 05권6쪽 공사장 배경은 복잡해 생성 시 단순화 후속,13권9쪽 실제 로켓은 작아 색칠 면 후속 필요. 기존 첫6장 해시 보존 후 전체30장 prepare, 신규24장 runner PID24124/exec31148 실행 시작. batch-status/lock/log 및 실제PID/Comfy8190 queue/history 확인, 중단/중복 제출 금지. 생성은 게임 최종 승인이 아니다.

D:/ComfyUI-output/classic-scene-coloring/production-plan.json은 명작144/전래40/생활45/유치원20/탈것15/자연101 전권365권730장 목록을 실제 inventory와 대조해 확정했다. preparedScenes와 generatedScenes는 계획 targetScenes와 구분. 탈것15권30장 준비, 자연101권202장 전권 목록 포함. 아직 원본 선정을 안 한 책은 본문 키워드로 만든 provisionalTextCandidates이며 실제 선정/승인이 아니고 자동 생성하지 않는다. 전체 준비450장, 아직 실제 선정 필요한 생활42권84장+자연98권196장=140권280장.

자연 남은98권196장 본문 후보 원본을 prefetch-nature-all-candidates.py/exec16243로 읽기 전용 수집 중. nature/all-candidate-source-status.json, selection-contacts/all-candidates.json·all-candidates-0/12/...jpg 저장 예정. 상태 collecting-original-candidates 또는 original-candidates-awaiting-visual-selection와 실제PID/exec부터 확인, 수집 중 중복 실행 금지. 다음 단계에서 전196후보의 원본과 본문을 실제 대조해 작은 동물/복잡한 군집/잘린 핵심 형태 등 필요한 쪽을 교체하고 nature-scene-selection.json 및 manifest를101권202장으로 확장한다. 후보 수집을 전수 원본 검수/생성 완료로 보고하지 않는다. 자연 종/실제 형태·행동을 유지하고 원본에 없는 의인화 금지. 생활 전체도 동일 범위 유지.


## 전365권730장 실제 대표 선정 및 전체 생성 연결 (2026-10-01 06:20 UTC)

자연 후보196장의 선택 쪽 본문과 실제 원본17개 all-candidates 시트를 전부 대조했다. 작은/빈 배경·과도한 군집·식물 줄기 확대만 있는 후보를 교체해 scripts/nature-scene-selection.json을 전101권202장으로 확장. replacement-proposal의 첫33원본과 round2 원본20장을 실제 시트에서 확인했고, 도마뱀/딱따구리/오리/참새 첫1쪽은 빈 배경이라 재기각 후 각각7/3/7/3쪽으로 대체. 코끼리2쪽8마리 군집을3쪽 큰 단독 전신으로 교체해 개별 원본도 확인. 호랑나비14쪽 원본은 제왕나비 외형이므로8쪽 실제 호랑나비 애벌레로 교체; 극지방 책은 본문이 사막과 극지방 모두 다루므로3쪽 낙타/6쪽 북극곰 선택. 악어6/8, 뱀8/11, 파리지옥2/7은 실제 종·형태 유지 후속. nature/source-selection-review.json에202쪽 원본SHA와 범위를 기록. 전98권 본문 전체 읽기로 확대하지 않는다.

기존 자연6장 상태·원본/선화SHA 보존 확인 후202장 prepare. 탈것 PID24124/exec31148은 생성30장·흑백/해시 검사 후 마지막 시험판 sync의 로컬 index.html 쓰기 UNKNOWN으로 exit1, 실제PID 종료 및Comfy8190 queue0/0 확인. 생성 재시작/재제출 없이 sync만 exec33576으로 재시도 exit0. 이후 탈것30장 흑백·원본/선화SHA·history success 재검증하고 batch-status를 generated-review-pending/previewSyncRecovered로 복구. 이 상태는 최종 게임 승인이 아니다.

자연196신규 runner PID38904/exec63100 실행, v6 IMAGE_ONLY=1/SYNC_PREVIEW=1/Comfy8190; 첫 강아지풀2쪽 prompt00e3e6fd-ac6d-4d65-a9cf-430440dd81bd. 해당batch-status/lock/log·실제PID/queue/history를 확인해 중복 생성하지 않는다.

생활 나머지42권84후보 읽기 전용 수집 exec13557 정상 종료. 후보 쪽 본문과 all-candidates-0/12/24/36/48/60/72.jpg 전7시트를 실제 대조. 배변/소풍준비/주사/횡단/지진대피/낯선어른거절/동생돕기/살살안기8권의 전체 본문을 읽고 실제 행동8원본 action-replacements.jpg 확인: 04[2,7],12[2,7],15[2,7],16[2,7],20[2,7],22[2,5],39[2,6],40[2,7]. 나머지는 문제·변화 구도 선택. 전45권 본문 전체 읽기로 확대하지 않는다. 생활16권7쪽 실제 원본은 손잡고 건너기로 손 번쩍은 없으므로 원본 밖 동작 추가 금지;15권 실제 코끼리 의사,22코알라/사탕/거절손,20책상·머리보호,39딸랑이 유지. 다수 친구5명이 있는26/33/34/35쪽은 생성 후 승인 난이도 검수 대상이다.

scripts/hori-life-scene-selection.json 전45권90장, source-selection-review.json 원본SHA/쪽별 선택 기록. 기존 생활6장 상태·원본/선화SHA 보존 후90장 prepare. D:/ComfyUI-output/classic-scene-coloring/continue-life-full-collection.ps1 PID38796/exec70913 실행, life-full-order-status.json=waiting-for-nature-full-batch. 자연PID38904 정상 종료 및 generated-review-pending, 큐 비움 확인 후 생활84신규 순차 생성. 자연 실패/종료 불확실/기존 생활runner 발견 시 기록 후 정지, 중복 제출하지 않는다. 재개 시 이 후속PID/status도 확인하며 실행 복제 금지.

production-plan.json 실제 전365권730장 대표 선정/준비 완료,06:20 UTC 생성455장(자연 진행 중)이며 최종730승인과 다름. 전체 범위를 첫3권으로 축소하지 않는다. 이후 우선 신규 생성본 원본/선화/filled 비교와 실제 색칠·색 대응·해당 쪽TTS/BGM을 검수하고 필요 결과만 원본 기반Qwen 수정. 기존 명작/전래368장 및 유치원40장 후속 실패/미승인 게이트 유지. 자연과 생활 기존12장 해시/상태 보존. 음원392장698개 기존 증거를 새730장 전체 검증으로 확대하지 않는다.
