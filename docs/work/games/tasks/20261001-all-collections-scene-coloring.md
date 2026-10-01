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
