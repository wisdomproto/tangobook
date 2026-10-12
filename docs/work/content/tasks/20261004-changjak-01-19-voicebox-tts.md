# 창작동화01~19 한글·영어 Voicebox TTS

- id: 20261004-changjak-01-19-voicebox-tts
- domain: content
- status: completed
- updated: 2026-10-12
- base: 91e85916
- branch: codex/content-changjak-01-10-tts
- worktree: C:/Users/101024/.codex/worktrees/changjak-01-10-tts/tangobook
- integration: 최신 main 기준 번역·TTS 도구 통합,사용자 일반 push 승인
- delivery: 17,000개 생성/CPU 검사·운영 등록 완료; 청취검토 후보4,054 별도

최신 완료 상태와 전달 범위는 [2026-10-12 등록·main 통합 기록](20261012-changjak-narration-registration.md)을 따른다. 아래 중지/재개 기록과 등록 미요청 표기는 해당 시점의 이력이다.

## 요청과 완료 조건

사용자 "좋아. 1-19까지 한글/영어 tts 만들자". 앞선 Voicebox 승인 KO/EN Qwen1.7B 프로필을 재사용한다.850권/8,500쪽×2언어=17,000쪽 MP3를 생성하고 쪽별 본문/레시피/해시·디코딩·역전사 대조를 검사한다. 영어는 원문 대조 완료 JSON만 사용한다. 전체 생성과 ASR 검사는 실제 청취 검수와 구분한다. 이번 범위는 로컬 제작이며 운영 DB/R2 등록과 main push는 요청되지 않았다.

## 결정과 진행

01~10 영어500권 및11~19 영어350권 완료(91e85916)를 이어 같은 worktree를 사용한다. 이전 생성/검사 프로세스는 실행 중이 아니고 기존 Voicebox127.0.0.1:17493은 healthy다. 승인 KO b8f4b383-9598-4ca4-bfad-daf8917cf30d,EN391dcc3c-f1b7-472a-9b14-77ed29f98b21과 언어별6개 샘플을 확인했다. 프로필 수정/재학습 없음. KO atempo0.85,EN rubberband tempo0.85 및24kHz mono96kbps MP3를 유지한다.

`scripts/changjak-voicebox-prepare.py`가 운영850권을 GET 재검증하고 기존 영어 sourceSha256 일치를 확인했다. 새로운 통합 작업 폴더 D:/tangobook-audio/changjak-series-01-19-20261004에 현재 원본·850개 번역·inventory를 저장한다. 기존 두 D 폴더는 읽기 전용으로 보존한다. 기존179쪽 중152쪽은 현 본문/레시피/WAV·MP3해시가 같아 복사 재사용했고27쪽은 달라져 이전 파일 위치를 preparation.json에 기록하고 새 통합 폴더에서 재생성한다. 기존 값과 충돌하는 출력은 덮어쓰지 않는다.

TTS 생성기의 scope를01~10(기본)/11~19/01~19로 확장했다. inventory중복 ID도 거부하며,850권 전수 준비가 끝나기 전 전체 생성은 시작하지 않는다. 완료 receipt가 없는 WAV는 요청 일치 시 변환을 재개한다. 중단 직후 receipt 없는 MP3는 해당 WAV 재변환 바이트까지 일치할 때만 복구한다. WAV는 partial→rename,쪽별 request/seed/hash/길이/생성 시간 receipt로 재개한다.

`scripts/changjak-voicebox-batch.py`는 생성기와 CPU large-v3 VAD 역전사 검사기를 감독하고30초마다 batch-status.json에 실제 생성/검사/검토 대기 수를 집계한다. 일시적 연결/HTTP50x는 제한 재시도하며 신원/본문/레시피/파일 불일치는 무시하지 않는다.17000receipt가 없으면 완료로 표기하지 않는다. 낮은 ASR 일치율은 실제 발음 오류 또는 ASR 오인식 후보이며 자동 청취 완료로 취급하지 않는다. Voicebox/GPU 실행은 단일 생성 프로세스,ASR은 CPU6스레드다. 다른 앱 프로세스·이미지 생성 작업은 종료하지 않는다.

## 검증과 다음 행동

2026-10-06 Gemini 시안이 크레딧 소진 HTTP402로 거절된 뒤 사용자가 "qwen 으로 계속 하자"로 결정했다. 중복 배치가 없고 기존 Voicebox healthy/CUDA/1.7B 로드 상태를 확인해 같은 전체 감독기를 Hidden 실행(PID39116)했다. 기존3,145개(KO1,574/EN1,571)를 보존하고 잔여13,855개 생성/CPU검사를 재개한다. 로그는 batch-qwen-continue-20261006.stdout.log/stderr.log. 아래 두 번째 중지 결정은 이 재개 요청으로 갱신한다.

2026-10-06 사용자 "잠깐 멈춰봐자" 요청으로 다시 일시중지했다. 명령/부모 PID 확인 후 감독기60548·생성기37940·CPU검사기30348만 중지하고 프로세스 부재를 확인했다. 최종 완료3,145개(KO1,574/EN1,571), ASR일치2,505/청취후보638/검사대기2, 잔여13,855개. batch-status.json 및 generate-job.json을 paused로 저장하고 이전 상태를 타임스탬프 백업했다. 파일 보존, 후속 재개 요청 전 실행하지 않는다. 아래 재개 기록은 이 중지 요청으로 갱신한다.

2026-10-06 사용자 "재개하자" 요청으로 일시중지 결정을 해제했다. 기존 배치 프로세스가 없고 Voicebox health healthy/CUDA/1.7B 로드 상태임을 확인한 뒤 같은 전체 감독기를 Hidden 재개(PID60548)했다. 기존3,109개 완료 결과를 보존하며 누락13,891개부터 생성·CPU 역전사 검사를 이어간다. 로그는 batch-resume-20261006.stdout.log/stderr.log, 현재 상태는 batch-status.json을 확인한다.

2026-10-06 사용자 "잠깐 멈추자" 요청으로 감독기52188·생성기14428·CPU 검사기56464의 명령/부모 PID를 확인한 뒤 이 배치만 중지했다. 완료 receipt 재집계는3,109개(KO1,558/EN1,551), ASR 일치2,480/청취후보628/검사대기1개, 잔여13,891개다. batch-status.json과 generate-job.json에 paused와 사용자 요청 사유를 기록하고 이전 상태도 별도 보존했다. 음원·참조·진행 기록은 삭제하지 않았다. 사용자 재개 요청 전 자동 재시작하지 않는다. 향후 재개 시 위 전체 명령을 사용해 기존 해시/레시피 일치 결과를 건너뛴다.

2026-10-06 재확인: 생성 2,456쪽(KO1,231/EN1,225), ASR 일치1,997/청취후보459에서 중단 상태였다. 마지막 상태 갱신은 10월5일16:36 KST, 연결 거부(WinError10061)가5회 재시도 후에도 지속됐다. Voicebox listener 및 감독기/생성기/검사기 프로세스는 모두 없었다. OS 마지막 부팅은9월27일로 재부팅 원인은 배제되지만, Voicebox 로그에 종료 traceback/사유가 없고 해당 시간대 Windows 이벤트에도 관련 충돌·메모리 부족 증거가 없어 서버 종료 원인은 미확정이다. Windows Update 관련 System Restore 실패 이벤트만으로 종료 원인이라고 단정하지 않는다.

기존 venv의 backend.main을 같은 C:/projects/voicebox/data·127.0.0.1:17493으로 Hidden 재실행(PID33100/실제 Python 자식29248)했다. health healthy/CUDA/기존 모델 다운로드 및 승인 KO/EN 프로필 두 개 존재 확인 후 기존 17,000쪽 감독기를 Hidden 재개(PID52188, 생성기14428)했다. 이번 서버/감독기 시작 로그는 통합 D 폴더의 *-recovery-20261006.*.log에 보존한다. 기존 완료 음원은 해시/레시피 검사 후 건너뛰고 누락 분량만 이어 생성한다. PID는 시작 시점 기록이며 실행·증가 여부는 현재 batch-status.json과 새 생성 로그로 확인한다.

2026-10-05 상태 확인: 1,796쪽(KO901/EN895),ASR일치1454/청취후보342에서 생성기가 WinError10061 연결 거부로 중단했고 Voicebox17493의 listener/기존 프로세스가 없었다. 서비스 종료 원인은 미확인. 한국어 Windows 오류 문자열 때문에 감독기의 영어 메시지 재시도 판별이 놓친 사실을 확인했다. WinError10061/10054/10060 코드도 제한 재시도로 처리하도록 수정하고 본문/해시 오류는 재시도하지 않는 회귀 테스트를 추가했다(5 tests 통과). 기존 Voicebox venv/backend.main을 동일 데이터 폴더/포트에 Hidden 재시작하고 완료 receipt를 보존해 전체 배치를 재개한다. 현재 PID/성공 여부는 D 폴더의 recovery 로그와 batch-status.json을 확인한다.

시안: 달이01 p1 한글/영어처럼 긴 쪽을 먼저 생성해 디코딩과 역전사 검사. 전체850권 현재 원문 해시 일치·각10쪽·기존152개 재사용/27개 보존 제외 확인. `python scripts/test-changjak-voicebox-tts.py`로 범위 경계/중복 ID/원문 변경 차단/이전 레시피 호환을 검사한다.

달이01 p1 시안 실제 생성: KO19.2초/EN13.4초 MP3,둘 다 full decode 통과. CPU large-v3 VAD EN1.000,KO0.940. KO 차이는 원문 "달이" 두 번을 ASR이 "다리"로 적은 것뿐이다(정규화 diff 확인). 이는 같은 발음의 이름 철자 후보이며 임의로 음원을 불량/청취 완료로 처리하지 않고 기존95% 기준에 따라 needs-listening-review로 보존한다. 4회귀 테스트와 Python 구문 검사 통과. 전체850권/17,000쪽 입력 및현재 저장154쪽(KO91/EN63)의 레시피/MP3해시 재검증 통과. 운영850권의한글/영어TTS는 각각0개임을 새 GET으로 확인했다.

전체 감독기 Hidden 시작 PID70908. PID/생성 수는 시점 기록이며 실제 상태는 통합 D 폴더 batch-status.json·generate-job.json·batch-generation.stdout.log·batch-audit.stdout.log를 확인한다. 시안2쪽과기존152쪽은 전체 배치가 건너뛰고 누락/수정된 쪽을 생성한다. 처음부터 전체850권 한글/영어가 모두 큐에 포함되며 11~19가 별도 수동 명령을 기다리지 않는다. 기존1~10의 이전 생성/검사 기록과 번역 파일을 보존한다.

전체 재개 명령: `python -X utf8 scripts/changjak-voicebox-batch.py --root D:/tangobook-audio/changjak-series-01-19-20261004`. 실행 PID만으로 완료를 판단하지 않고 batch-status.json/generate-job.json 및생성/검사로그를 함께 확인한다. 실제 완료 시17000개 receipt·본문/MP3해시·영어/한국어8500개씩·검토 대기 후보를 점검하고 필요한 재생성과 청취 대조를 이어간다.

2026-10-09 Voicebox終了로11812개에서 연결 거부,감독기 재시도5회 소진 후 needs-attention 종료 확인. 사용자 "니가 켜" 요청으로 기존 venv Python/CUDA 서버를 동일127.0.0.1:17493·data 폴더로 Hidden 재시작(PID65224),health healthy 확인. 중복 배치 부재 확인 후 기존 전체 감독기를 Hidden 재개(PID33952/생성42896/CPU검사74456). Qwen1.7B 로드 성공 및 딩딩41권 영어p1 새 receipt로11813개 증가 확인. 기존 음원·승인 프로필 유지,단일 생성 방식 유지. 로그 voicebox-recovery-20261009.stdout/stderr.log 및 batch-recovery-20261009.stdout/stderr.log. 서버 종료 원인은 미확정,운영 등록/main push 없음.

2026-10-09 야간11812→12234개 진행 후 Voicebox/배치 프로세스 종료와 타로12 영어p2 연결 거부를 확인했다. Voicebox를 Hidden 재시작(PID15580),사용자 "다시 실행해" 후 healthy 확인 및 중복 배치 부재 확인 뒤 감독기18048/생성10548/CPU검사14408로 재개했다. 기존 설정·단일 생성 유지. 타로12 영어p3~p5 새3개 progress 및batch집계12236 갱신 확인(집계30초 간격). 로그 voicebox-recovery-20261009-late 및batch-recovery-20261009-late stdout/stderr. 반복 종료 원인 미확정,기존 음원 보존,운영 등록/main push 미요청.

2026-10-10 사용자 "잠깐 하던거 멈춰보자" 요청으로 일시중지. 명령/부모 PID 확인 후 감독기18048·생성10548·CPU검사14408만 중지,프로세스 부재 확인. receipt 재집계13940개(KO6971/EN6969),ASR일치10803/청취후보3137/검사대기0,잔여3060. batch-status 이전 상태 타임스탬프 백업 후 batch-status/generate-job을paused로 기록. 기존 음원 보존,Voicebox 서버/다른 앱은 종료하지 않았다. 사용자 재개 요청 전 배치를 실행하지 않는다.

2026-10-10 사용자 "하던거 계속 하자"로 중지 결정을 해제. Voicebox healthy/CUDA/1.7B로드 및 기존 배치 부재 확인 후 동일 감독기 Hidden재개(PID37428/생성31176/CPU검사33704). 기존13940개 보존,잔여3060개. 재개 로그 batch-resume-20261010.stdout/stderr.log. 완료 파일 점검 후 유키47 영어p9 요청 및서버 추론 시작 확인. 프로필/단일 생성/운영 미등록 유지.
