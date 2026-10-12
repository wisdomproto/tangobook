# 파닉스 누락 삽화·본문 TTS 보완

- id: 20261012-phonics-missing-assets
- domain: phonics
- status: ready
- updated: 2026-10-12
- branch: codex/library-content-audit
- worktree: C:/Users/101024/.codex/worktrees/changjak-narration-main/tangobook
- integration: superseded by approved unused-zodiac removal
- delivery: 운영 누락 채우기 승인, 이번 작업 main push 미요청

사용자가 `누락된거 다 채워. 이미지는 skill 써서 하고`라고 요청했다. 운영71개 파닉스 단원을 fresh GET한 결과 한글32단원256쪽 중 삽화11쪽 누락, 한글 TTS는 전부 존재한다. 영어39단원505쪽은 삽화와 기본 본문 TTS 모두 없다. 기존 콘텐츠를 유지하고 이516장/505개를 보완한다. 일반 동화책37권403개 TTS는 별도 작업에서 생성·운영 등록·CDN 해시 검증을 모두 마쳤다.

imagegen/gpt-image 스킬과 실제 기존 그림을 읽었다. 모델 선택을 선택형 질문으로 제시했으며, 답변 전에는 사용자 AGENTS의 로컬 Qwen-Image-2.1 기본값을 적용한다. GPU는 RTX4070 12GB여서 Qwen 이미지와 Voicebox TTS를 동시에 돌리지 않는다. 원본 스냅샷과 실제 참조는 `generated-images/phonics-missing-20261012`, 음원 계획은 `D:/tangobook-audio/phonics-missing-20261012`에 저장했다. 원본 JSON·개인 로그·PNG 후보는 커밋하지 않는다.

한글 단원의 오래된 characters 메타데이터보다 실제 본문/장면/승인 삽화를 우선한다. 영어 단원은 영어 본문과 장면 설명의 불일치가 있어 영어 본문 자체와 실제 책 characters를 기준으로 한다. 영어 본문을 다른 기획안으로 교체하지 않는다. 낭독은 원래 영어 text 그대로이며 Editor2 기본 ttsUrl과 영어 번역 음원 연결을 함께 확인한다.

Qwen 초기 후보 kr-h4-u01-p07/p08은 펠트 그림체를 유지했지만 이전 참조의 빵/고래 생각풍선을 복사하여 본문 행동과 달랐다. 미등록·실패 후보로 보존했다. 자체 worker만 중단하고 Comfy 작업을 완료시켰으며 다른 queue는 건드리지 않았다. 승인 캐릭터 시트를 실제로 다운로드하고 짧고 구체적인 영어 장면 지시로 v2 시험 생성한다. 육안 통과한 파일만 업로드한다. 모델 출력만으로 등록을 자동 승인하지 않는다.

도구: `prepare-phonics-missing-assets.py`(읽기 전용 원본/참조/계획), `generate-phonics-qwen-assets.py`(재개 가능한 로컬 후보, 운영 쓰기 없음), `library-missing-tts.py`(기존 승인 영어 프로필/속도/MP3 형식 재사용), `library-missing-tts-register.mjs --root=... --native-english`(검사 통과 후 누락 필드만 등록). 원문/기존 자산 보존, 동시 수정 거부, 실제 CDN 해시 검증을 유지한다.

완료 기준은516장 장면/글자/캐릭터 검수·등록과505개 원문 기반 낭독 검사·등록, 전체 운영 재조회다. 계획 작성이나 후보 생성은 완료가 아니다.

2026-10-12 후속 결정: 사용자가 `image 는 그냥 skill 로 해`라고 명시하여 남은 이미지 생성은 GPT 이미지 스킬의 구독 포함 native image_gen으로 전환한다. 대기 중이던 자체 Qwen 이미지 continuation PID33588을 확인 후 중단했으며 TTS 생성·검사·등록 프로세스는 유지했다. 이미 검수·등록한 한글11장과 영어 en-b1-u01 p1은 유지한다. 남은 영어 삽화504장은 실제 영어 본문과 각 책 캐릭터, needlefelt 승인 그림체를 기준으로 만든다. TTS는 이 시점73/505 생성 중이며 완료 수는 실제 등록 상태를 따로 확인한다. 관련 검증은 content-audit 5개, 음원 필드 보존3개, 기존 TTS 검사2개 통과했다.

2026-10-12 사용자 반증 및 삭제 지시: 영어 본문은 사용하지 않는 12지신 버전이었다. 종전 영어 삽화505/TTS505는 필수 보완 범위라는 판단을 취소한다. 생성/등록 followers PID38660/22744를 확인 후 중단했다. 사용자가 `헷깔리면 안되니까 12지신 컨텐츠는 아예 다 지우자`라고 승인했다. 영어39단원의 구형 이야기/캐릭터/전용 자산과 캐릭터 라이브러리12개를 제거하되 실제 음가·블렌딩·낱말 카드/단원 ID는 유지한다. 한글32단원의 실제 호리 본문/삽화/음원은 삭제하지 않고 오래된 cast/표지 프롬프트를 정리한다. 삭제 전 fresh 원본·삭제 URL과 공유 참조 판정을 외부 로컬 경로에 보존한다.

후속 삭제 검증 완료: [미사용12지신 삭제](20261012-unused-zodiac-removal.md). 영어505쪽은 제거했으며 생성한 전용 이미지/TTS도 공유 참조 검사 후 삭제했다. 실제 한글 호리256쪽은 전수 불변, 누락 보완11장만 유지된다.
