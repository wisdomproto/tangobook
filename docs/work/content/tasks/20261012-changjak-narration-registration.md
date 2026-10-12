# 창작동화 01~19 Qwen 한영 나레이션 등록

- 작업 브랜치: `codex/content-changjak-01-10-tts`
- 사용자 결정: 2026-10-12 전체 생성 완료 확인 후 "등록해". 850권의 한글·영어 음원과 검토한 영어 번역을 운영 책에 연결했다. 후속 "메인에 푸시해줘"로 main 통합과 일반 push를 승인했다.
- 생성 완료: 한글 8,500 / 영어 8,500 MP3, 총 17,000개. CPU ASR 검사 완료, 일치 12,946 / 실제 청취 검토 후보 4,054 / 검사 대기 0. 청취 검토 완료와 구분한다.

## 등록 방법과 보존 범위

`scripts/changjak-voicebox-register.mjs`의 `audit → apply → verify`를 사용한다. audit는 운영 850권의 본문·제목·캐릭터와 생성 원본, 영어 검토 상태, 17,000개 MP3와 생성/ASR receipt 해시를 대조한다. apply는 파일별 SHA256이 포함된 새 R2 키 `tts/changjak-qwen-v1/<book>/<lang>/pNN-<sha256>.mp3`로 업로드하고 CDN에서 다시 내려받아 같은 해시인지 확인한다.

책에는 `pages[].ttsUrl`, `pages[].translations.en.{text,ttsUrl}`, `titleTranslations.en`, `languages`의 ko/en만 반영한다. 기존 삽화·표지·게임·공개 상태 및 다른 필드는 등록 전후 전체 객체 비교로 보존한다. Editor2는 같은 운영 책을 읽으므로 별도의 데이터 복제는 없다. BGM 자료실에 17,000개 파일이 들어가지 않도록 BGM 등록을 수반하는 일반 오디오 업로드 API를 쓰지 않는다.

운영 GET 백업, 업로드 해시 증명, 책별 저장 결과는 Git 밖의 `D:/tangobook-audio/changjak-series-01-19-20261004/registration-20261012/`에 보관한다. 중단 후 apply 재실행 시 완료 파일은 건너뛰며, 응답을 잃은 저장은 새 GET으로 조정한다. 동시 수정된 책은 덮어쓰지 않고 중단한다. 운영 자격증명은 기존 서버 환경에서만 읽으며 기록·커밋하지 않는다.

## 진행과 검증

850권 audit 및 apply/verify 완료. 한글 8,500 / 영어 8,500 음원을 R2에 업로드·CDN SHA256 검증하고, 운영 850권을 다시 GET해 모든 페이지 연결과 기존 필드 보존을 확인했다. 퐁이 01권을 먼저 등록하고 운영 GET의 전체 필드와 CDN 음원 해시를 확인했다. Editor2에서 KO/EN 선택, 영어 번역 본문, 양쪽 음원 재생 버튼을 확인했다. 영어 10개 audio 요소 모두 readyState 4이며 유효한 길이를 가진다. 화면 증명은 등록 폴더의 `editor2-en-proof.webp`다.

업로드 속도를 높이기 위해 처음 64권 이후 파일 전송을 권별 4개, 책 8권 병렬로 조정하고 기존 receipt에서 재개했다. Qwen 추론 재실행은 없다. 최종 applied 850개이며 재개 이후 출력하는 REGISTERED 수는 이번 실행에서 새로 저장한 권 수로 전체 완료 수와 다르다. 완료 수는 applied 파일과 verify 결과로 확인한다. 스크립트 `node --check`와 `git diff --check` 통과. 제품 런타임 코드는 변경하지 않았다.

최종 완료 증명은 위 폴더의 `complete.json`을 확인한다. 4,054개 청취 검토 후보는 등록 여부와 별도로 남는다.

## main 전달

최신 origin/main `144b89741`에서 `codex/content-narration-main` 통합 브랜치를 만들었다. 원본 작업 브랜치 전체를 merge하지 않고,850권 영어 JSON·번역 README·TTS/번역 도구7개·해당 작업 기록4개만 가져와 main의 공유 메모리/목록에 최신 완료 상태를 더한다. 다른 기능과 삽화 생성/등록 도구는 이번 통합에 포함하지 않는다. 기존 작업 폴더와 미추적 생성 파일을 보존한다.

번역850권/8,500쪽은 실제 낭독·등록에 사용한 D 폴더 번역과 전체 JSON 일치를 확인했다. TTS 회귀5개,스크립트 구문 검사,번역 파일 형식/개수와 diff 검증을 수행한다. 데이터 등록은 이미 운영에서 완료했으므로 push를 위해 다시 업로드하거나 책을 덮어쓰지 않는다. push 직전 origin/main...HEAD 분기를 확인하며 일반 push만 사용한다. Railway 배포 성공 여부와 Git push 성공은 구분한다.
