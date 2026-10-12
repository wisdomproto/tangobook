# 전체 동화책 누락 한영 TTS 보완

- id: 20261012-library-missing-tts
- domain: content
- status: active
- updated: 2026-10-12
- branch: codex/library-content-audit
- worktree: C:/Users/101024/.codex/worktrees/changjak-narration-main/tangobook
- integration: local work in progress
- delivery: 생성·검증·운영 연결 진행, 이 후속 작업 main push 미요청

사용자가 삽화 작업 main push에 이어 `그리고 tts 누락된거 다시 만들고`라고 요청했다. 직전 전체 조사에서 확인한 KO/EN 누락을 대상으로 준비했다. 기존 승인 Qwen Voicebox 한글/영어 프로필,1.7B·언어별0.85속도·24kHz mono96kbps MP3를 사용하며 기존 음원은 보존한다.

운영37권 재조회: 한글35쪽(하마17/판다18), 영어368쪽(판다18/호리 유치원20권200쪽/호리 세상 탐험15권150쪽). 영어368쪽은 번역도 비어 있어, 원문 대조한 영어 번역을 먼저 만들고 source hash와 reviewed 표시가 맞는 쪽만 낭독한다. 작업 폴더 `D:/tangobook-audio/library-missing-20261012`에37권 원본과403개 job plan을 보존했다. Source hash는 본문·제목·캐릭터·장면을 묶고 기존 삽화/음원 변경에는 의존하지 않는다.

`scripts/library-missing-tts.py`는 기본 준비/로컬 생성만 하며 운영 등록을 하지 않는다. 승인된 기존 프로필 존재 확인, 단일 worker·OS lock, WAV/request/MP3 해시 receipt, 중단 후 일치 파일 재사용과 다른 파일 보존을 적용한다. 한글부터 생성하며 reviewed 영어 파일이 준비될 때 추가 생성한다. `scripts/changjak-voicebox-audit.py --root <new-root> --follow`를 재사용해 CPU large-v3 VAD 역전사/전체 디코딩 검사한다. 실행 시 Voicebox healthy/GPU 가용·모델 미로드 확인, 이전 생성기 없음 확인 후 Hidden 실행. 현재 진행은 generate-job.json과 generation/audit 로그로 읽는다. PID는 시점 기록이며 현재 실행·파일 증가로 검증한다.

이 작업의 완료 여부는403개 receipt·검사·운영 등록 후 검증으로 판단한다. 낮은 ASR 점수는 발음 오류 또는 철자 후보이므로 실제 내용을 대조하며 자동 청취 완료로 보고하지 않는다. 일반 오디오 업로드는 BGM 등록을 수반하므로 사용하지 않고 이전 나레이션 작업의 R2 content-addressed 업로드/최신 책 필드 보존 패턴을 사용한다.

## 생성·검사 진행 기록

영어36권·368쪽 번역을 모두 원문과 대조하고 [번역 파일](../../../library-books/translations/README.md)에 source SHA와 함께 보관했다. 운영 원문은 그대로다. 유치원13권 p3의 원문 짝꿍 관계가 앞뒤로 달라 보이는 부분은 번역에 원문대로 유지했으며, 본문 수정은 이번 TTS 범위에 넣지 않았다.

초기 한글35개 생성 후 하마 p4가 첫 문장을 실제로 누락한 것을 VAD 없는 재검사에서도 확인했다. 실패 후보를 별도 보존하고 seed 변경 후 전체 원문 ASR 일치 1.000을 확인했다. 판다 p6 `앞발/아빠`는 재생성 후 독립 medium ASR이 `앞발`을 복원해 1.000으로 확인했다. 판다 p13/p14는 누락 감탄사/의태어 발음이 불확실해 추가 재생성했다. 검수에 쓴 후보·근거·현재 파일 hash는 D 작업 폴더에 보존한다.

primary large-v3가 짧은 무음 끝에 유튜브 문구를 역전사한 사례가 있어, `scripts/library-missing-tts-secondary-audit.py`로 medium CPU int8·VAD 없음·기대 문장 prompt 없음의 독립 검사를 추가했다. 양쪽 모두 파일 hash를 묶는다. secondary 0.95 이상은 자동 근거 기록, 숫자 twelve/12·rustle/Russell 동음 철자·쑤욱/쑥 의태어 같은 제한된 표기 차이는 `manual-asr-review.json`에 페이지별 근거를 남긴다. 의미·문장 누락을 낮은 점수 허용으로 통과시키지 않는다. 이 검사는 사람의 전수 청취를 대신했다고 보고하지 않는다.

`scripts/library-missing-tts-register.mjs apply --follow`가 책별 모든 요청 음원의 source/receipt/ASR 또는 hash-bound 보완 검사를 확인한 뒤, immutable MP3 업로드·CDN SHA·최신 원문/다른 필드 보존을 검사하며 순차 등록한다. fresh GET 이후 다른 수정이 있으면 저장을 중단한다. pending journal을 보존해 성공한 POST의 재시도도 중복 덮어쓰지 않는다. 이미 다른 경로로 채워진 TTS는 유지한다. 37권 전체 등록이 끝나면 운영 재조회·CDN 전수 검사 후 `registration/complete.json`을 저장한다.

첫 등록 확인: 하마17개 한글 + 호리 유치원01권10개 영어, 합계27개·2권. 생성은 아직 진행 중이다. 모든 영어 번역 준비로 다음 책을 자동 생성할 수 있으며 등록기도 계속 실행 중이다.

검증: `python -X utf8 scripts/test-library-missing-tts.py` 2개 통과(미검토/변경 원문 번역 거부, 삽화/TTS 변경과 본문 변경의 source 판정). 생성/보완 ASR Python 문법, 등록기 `node --check` 통과. 전체 등록 후 현황 snapshot 재수집은 아직 남는다.

재개/현황 확인(동일 작업 중복 실행 금지):

```powershell
python -X utf8 scripts/library-missing-tts.py generate --follow
python -X utf8 scripts/changjak-voicebox-audit.py --root D:/tangobook-audio/library-missing-20261012 --follow
python -X utf8 scripts/library-missing-tts-secondary-audit.py --follow
node scripts/library-missing-tts-register.mjs apply --follow
```

Hidden 백그라운드 실행을 유지하고 `generate-job.json`, `registration/status.json` 및 각 stdout/stderr로 현재 상태를 확인한다. `stop-after-current.request`가 있으면 생성기가 현재 음원까지 완료하고 정지한다. 새 seed 보정 전에 이 정지를 사용하며, 기존 실패 파일을 다른 폴더로 보존한 후 flag를 제거하고 재개한다. ASR worker가 생성기 정지 시 끝났는지 확인해 필요하면 재시작한다. 원본·음원·로그·개인 세션/자격증명은 커밋하지 않는다.
