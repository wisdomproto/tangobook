# 사용하지 않는 12지신 콘텐츠 삭제

- id: 20261012-unused-zodiac-removal
- domain: phonics
- status: ready
- updated: 2026-10-12
- branch: codex/library-content-audit
- worktree: C:/Users/101024/.codex/worktrees/changjak-narration-main/tangobook
- integration: verified locally; not merged into main
- delivery: 운영 삭제 승인, main push 미요청

사용자가 구형 12지신 버전은 사용하지 않는다고 반증한 뒤 `헷깔리면 안되니까 12지신 컨텐츠는 아예 다 지우자`라고 명시했다. 누락 보완 시 영어39개 단원505쪽을 필수 콘텐츠로 분류한 판단은 취소한다.

단원 ID는 실제 학습카드·음가·블렌딩·쓰기·단어 게임도 함께 제공하므로 단원 JSON 전체를 삭제하지 않는다. 영어39단원의 구형 본문505쪽, cast, 표지/생성 설명과 전용 그림·본문 TTS를 제거한다. 한글32단원의 실제 호리 본문256쪽·삽화·TTS를 보존하고 캐릭터 메타데이터를 승인된 호리 라이브러리로 교체한다. 구형 이름이 섞인 예문·퀴즈·챈트도 제거하며 일반 낱말 `Fluffy cloud`는 고유명사로 오인하지 않는다.

`remove-unused-zodiac.py`는 운영1310건 fresh 조회와12개 구형 라이브러리 캐릭터를 근거로 dry-run 계획을 저장한다. apply 시 원본 동시변경 거부·저장 후 필드 검증, 순차 어휘 DB 동기화, 전체 책/캐릭터/어휘 DB/어휘 단원/음원 라이브러리 공유 URL을 다시 검사한 후 전용 객체만 삭제한다. URL의 r2.dev→CDN 자동 정규화는 동일 키로 비교한다. 삭제 계획/원본/영수증은 `D:/tangobook-inventory/20261012-remove-unused-zodiac`에 두며 Git에 원본 JSON과 자산을 넣지 않는다.

잘못된 영어 생성/등록 배치를 중단했고 두 plan을 retired로 표시했다. TTS 생성과 이미지 등록 스크립트에 retired 거부를 추가했다. 로컬의 사용하지 않는 이미지·음원 후보1054개를 지정 root 내부 경로 검증 후 삭제했으며 경로·SHA 영수증만 위 폴더에 보관했다. 한글 실제 자산은 유지했다.

코드에서는 구형12지신 테마·프로필·이름 매핑을 제거하고 한글은 승인된 호리 기본값, 영어는 캐릭터 기본값 없음으로 정리했다. 구형 라이브러리를 통째로 다시 올리는 seed-character-library.ts를 삭제했다.

검증: cleanup 의미/학습자료 보존/공유 CDN키 회귀3개, 기존 TTS 검사3개 통과. shared/server/client typecheck 통과. 운영 최종 대조:71단원 처리, 영어12지신505쪽 제거, 한글 호리256쪽 전체 원본 그대로, 구형 라이브러리12개 제거. 본문/캐릭터 전용 R2키321개 삭제 요청 성공(옛 PNG참조2개는 원래 없음, 실제 WebP2개 별도 확인해 삭제). 다른 책·어휘·음원 라이브러리 공유 키는 제외했다. 영어 음가/블렌딩 원본과 한영 핵심단어 카드의 word 목록 전수 불변 검증. 독립 verified-summary.json/receipt.json 확인. 단원 회귀38개 추가 통과. 로컬 코드·기록 커밋, main 미푸시.
