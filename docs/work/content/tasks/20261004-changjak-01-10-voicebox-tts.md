# 창작동화 01~10 한글·영어 Voicebox TTS

- id: 20261004-changjak-01-10-voicebox-tts
- domain: content
- status: active
- updated: 2026-10-04
- base: b7ae9dcc
- branch: codex/content-changjak-01-10-tts
- worktree: C:/Users/101024/.codex/worktrees/changjak-01-10-tts/tangobook
- integration: 미통합
- delivery: 영어500권/5,000쪽 완료·01~19 통합 TTS 배치로 재개·main push 미요청

## 요청과 범위

사용자는 창작동화1~10시리즈의 한글·영어 TTS를 Voicebox로 만들며 기존 Qwen TTS를 찾으라고 요청했다. 번호는 `_series-config.mjs`의 no가 기준이다: 퐁이·코코·메이·도도·브루노·쌍둥이·미오·피포·노노·룰루,각50권/10쪽. 붕이는11번이므로 대상이 아니다. 기존 정상 음원 유지/전체 재제작 선택 질문은 선택사항이며,현재 요청 범위는 정상 기존 자료를 보존하고 부족한 음원을 제작하는 것으로 진행한다.

## 확인한 사실

운영500권을 GET해 원본을 백업했다. 한국어 본문5,000쪽 존재,한글 TTS0·영어 본문0·영어 TTS0. Voicebox SQLite를 읽기 전용으로 조회한 결과 현재 원문과 정확히 일치하는 승인 KO 프로필의 완료 음원도0개다. 바탕화면 voicebox_samples에는 유치원/탐험/전래 자료가 있지만 이 창작 시리즈 전용 자료는 발견하지 못했다.

기존 승인 프로필은 Tangobook Narrator KO(b8f4b383-9598-4ca4-bfad-daf8917cf30d),EN(391dcc3c-f1b7-472a-9b14-77ed29f98b21). 기존 Qwen1.7B 클론 프로필을 재사용하며 언어별 프로필을 섞지 않는다. 역사적 승인 레시피는 KO atempo=0.85,EN rubberband=tempo=0.85(피치 유지),로컬 FFmpeg에 rubberband 있음. 목소리 재학습/프로필 수정 없음.

Voicebox가 꺼져 있어 기존 venv Python으로 backend.main을127.0.0.1:17493에 Hidden 실행(PID81916)했다. health healthy/CUDA/모델 다운로드 완료·미로드 확인. 다른 GPU 작업/프로필/음원을 종료하거나 덮어쓰지 않는다. 로컬 자료는 D:/tangobook-audio/changjak-series-01-10-20261004에 원본/검사/생성 receipt를 보관한다.

초기 재고 검사에 붕이를 잘못 넣고 룰루를 누락한 것은 번호 원본을 확인해 바로 교정했다. 초기 붕이 백업50개는 지우지 않고 대상 manifest에서 제외한다. 교정된 inventory가500권/5,000쪽 기준이다. 운영 쪽 번호는 `page_number`이며 500권 모두1~10 연속 번호를 확인했다(`pageNumber` 아님). 번호 정본은 `packages/client/scripts/_series-config.mjs`다.

운영 `/api/translation/page`는 HTTP402 Payment Required를 반환했다. 잔액 제한을 우회하거나 결제하지 않았다. Voicebox 내장 Qwen3-4B를 정상 다운로드해 로컬 번역 시안을 비교했다. 첫 퐁이01 시안은 다리→leg(bridge 오역), 거위 할아버지→농장 발명, "여기로 오면 안 젖어"의 대사 의미 반전이 발생했다. SCENE 문맥 포함2차도 대사 반전이 남아 두 시안을 거절했다. 4B 초안을 영어 낭독에 바로 사용하지 않는다.

퐁이01 영어10쪽은 원문과 직접 대조해 새로 번역하고 reviewed=true로 저장했다. 별도 영문 원고 위치 질문은 선택사항이며 한글 제작은 계속한다. 한글 첫 시안은 ffmpeg 디코딩/atempo0.85/24kHz mono96kbps MP3 변환을 통과했다. CPU faster-whisper-medium 역전사 정규화 비교1.000. 이는 음성 인식 검사이며 실제 청취 검수 완료와 구분한다.

`scripts/changjak-voicebox-tts.py`는 inventory의 정확한500권 집합·쪽 번호·원문 검증 후 로컬 생성한다. KO는 원문 그대로, EN은 동일 sourceSha256의 reviewed 번역만 허용한다. 쪽별 deterministic seed·레시피·원본WAV·MP3해시/길이 receipt를 저장하고 재개 시 해시가 맞는 완료 파일만 건너뛴다. TTS와 번역4B는 모델 메모리를 서로 해제해 GPU 중복 로드를 피한다. OS 잠금은 작업 중복 실행을 막고 종료 시 자동 해제된다. 운영 DB/R2 업로드 없음.

대표 퐁이01 한글·영어20쪽 생성 완료 후 전체 배치를 Hidden 실행했다(생성 PID50324,검사 PID864). `generate-job.json`/`progress.json`/생성 로그가 실제 상태 근거이며 기록된 PID가 현재 실행 중이라는 뜻은 아니다. 재개 명령: `python -X utf8 scripts/changjak-voicebox-tts.py generate --languages ko,en`; CPU 검사: `python -X utf8 scripts/changjak-voicebox-audit.py --follow`. 생성 작업이 종료될 때까지 검사기가 새 파일을 발견해 전수 디코딩/역전사를 기록한다. 현재 영어 원문 대조 번역은 퐁이01~11의110쪽이며,다른 영어는 미확정이라 낭독을 건너뛴다. 한글5,000쪽·영어5,000쪽 전체 완료는 아니다.

medium이 잘못 인식한 퐁이01 KO4~6쪽은 large-v3로 모두1.000 확인됐다. large-v3도 짧은 끝 무음에0.38초짜리 "자세히 알아보세요" 같은 환청을 만들었다. Silero VAD(250ms)·쪽별 독립 문맥으로 검사하며 원문과 비교하기 위해 기대 본문을 ASR 프롬프트에 넣지 않는다. `audit-large-v3-vad-v1`이 현재 검사 경로이고 이전 검사도 보존한다. 95% 미만은 실제 발음 오류와 ASR 오류를 구분해 추가 확인할 후보이며 자동 재생성/검수 통과로 처리하지 않는다. KO01p1은 원문1.000 일치한 최초 pilot(seed104001)을 재사용하고 후속 약한 take/검사 기록은 rejected에 보존했다. `seed-overrides.json`이 재개 레시피를 고정한다.

## 진행과 다음 행동

사용자 후속 "1-19까지 한글/영어 tts 만들자"로 전체 범위를 확장해 재개했다. 현재 상태와 실행 명령은 [01~19 통합 TTS 작업](20261004-changjak-01-19-voicebox-tts.md)이 원본이다. 아래 번역 우선 배치 중지 기록은 그 이전 상태이며,기존 D 폴더의 음원/검사 기록은 그대로 보존한다.

사용자 후속 "영어 번역부터 해줘"에 따라500권 전체 영어 번역을 먼저 완료한다. PID50324/864의 실제 명령줄이 이 작업의 생성/검사 스크립트임을 확인한 뒤 두 작업만 종료했고 모든 생성 음원/검사 기록은 보존했다. `generate-job.json`을 stopped-for-translation으로 기록했다. 기존 모델의 의미 반전 사례 때문에 직접 원문을 대조해 번역한다. 병렬 번역 워커3명 분담 여부는 현재 세션의 위임 제한 때문에 사용자에게 선택형으로 확인 중이며 답변 전에도 직접 번역을 이어간다. 추가로 코코·메이·도도·브루노·쌍둥이01권 각10쪽과 영어 제목을 번역했다. 원본 한국어 및 운영 책 수정 없음.

현재 퐁이·코코·메이·도도·브루노·쌍둥이·미오·피포·노노·룰루01~50 전체:500권/5,000쪽의 영어 제목·본문 직접 번역/원문 대조 완료. `scripts/changjak-translation-review.py --export` 전수 검사에서 expectedBooks=500,translatedBooks=500,translatedPages=5000,각시리즈50권,status=translation-files-complete를 확인했다. 대상 ID·sourceSha256·쪽 번호1~10·영어 완전성·제목 검사를 통과했고 D 작업 폴더에 `english-review.html`(한국어/영어 비교)과 `translation-status.json`,저장소에 `docs/changjak-books/translations/en/{bookId}.json`500개가 있다. 검토 화면의 inline JS는 `node --check`로 검사한다. 이 형식/해시 검사는 의미 검토를 대신하지 않으며,번역 과정에서 쪽별 원문을 읽고 직접 대조했다. 한국어/R2/DB는 변경하지 않았다.

전체 원문에 대한 친족 호칭 검색으로 **퐁이는 여자아이**(32권p2·41권p8 등 동생의 "누나")임을 확인했다. 초기 퐁이 영어 he/his는 잘못 추정한 것이며 원문에 맞춰 she/her로 모두 고쳤다. 동생은 little brother로 통일했고 아빠/할아버지의 남성 대명사는 유지했다. 남은 모든 he/his/him 문장을 직접 읽어 지시 대상을 확인했다. 이전 영어 초안은 D의 translations-before-gender-fix 및 v2에 보존했다. 원고 근거상 도도는 누나/무무는 남동생,닐스·피포·노노·레오는 형아,리리는 언니다. 성별 근거 없는 캐릭터는 이름 또는 중성 they를 사용한다. 또한 퐁이13의 우유병(SCENE 근거)과21의 금간 돌 밟기를 교정했다. 영어 본문 변경과 맞지 않는 저장 음원27개는 파일을 지우지 않고 translation-status.json에 재생성 대상으로 기록했다.

영어 번역 우선 단계는 완료했다. 다음 TTS 단계에서는 기존 레시피와 달라진27쪽의 이전 음원을 보존·버전 분리하고,기존 승인 KO/EN 프로필로 생성/역전사 후보 확인과 실제 청취 검수를 이어간다. 현재 TTS/검사 배치는 재개하지 않았다. 번역 완료·음원 완료·운영 등록·main push 상태를 혼동하지 않는다. 기존 본문/삽화/음원/책의 다른 필드는 보존한다.

원문 자체의 연결이 어색한 곳은 번역으로 사건을 발명해 고치지 않았다. 예: 메이49의 수량 연결,브루노07의 작은 양동이로 큰 통을 채우는 장면,브루노43 p3/p8의 이동 거리,미오33의 다섯 색/세 색 언급,피포35의 식전 치즈와 "식사 먼저" 대사는 원문 그대로 유지했다. 형아/언니는 돌봄 역할일 수 있어 피포48·쌍둥이49·노노49에 생물학적 형제 관계를 추가하지 않았다. 생활습관 편의 건강 관련 문장도 동화 원고를 그대로 옮겼고 새로운 효능이나 조언을 덧붙이지 않았다.
