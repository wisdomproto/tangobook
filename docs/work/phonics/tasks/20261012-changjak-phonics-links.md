# 창작동화 공개와 파닉스 장면 연결

- id: 20261012-changjak-phonics-links
- domain: phonics
- status: complete
- updated: 2026-10-12
- base: f9d465e99
- branch: codex/library-content-audit
- worktree: C:/Users/101024/.codex/worktrees/changjak-narration-main/tangobook
- integration: 로컬 커밋, main 미통합
- delivery: 공개 상태는 운영 반영. 파닉스 코드 미푸시·미배포.

## 요청과 결정

사용자는 한글/영어 파닉스와 동화 어휘 연결을 확인하고, 특히 창작동화를 연결하되 동음이의어를 주의하라고 지시했다. 이어서 창작동화를 모두 공개하라고 명시했다. 이전의 비공개 유지 방침은 이 후속 지시로 변경했다.

공통 인수인계, phonics/content 작업 지도와 기억, 루트 및 phonics/phonics-learner/vocabulary-unit/games 지침을 읽었다. 1,310건 운영 책과 R2 목록을 읽기 전용으로 수집했다. 창작 850권은 모두 비공개였고 기존 장면 인덱스는 공개책만 수집하여 창작 연결이 0건이었다.

## 변경

- 19개 시리즈 850권을 최신 운영 JSON에서 `isPublic`만 true로 변경했다. 저장 후 책별 재조회로 updatedAt을 제외한 모든 다른 필드의 동일성을 검증했다. 재개 가능한 pending/applied 저널은 저장소 밖에 보존한다.
- 개별 저장 완료 직후 서재 목록은 마지막 20권이 캐시로 늦게 반영됐다. 추가 수정 없이 기다려 목록 API에서도 850/850 공개를 확인했다(2026-10-12T06:44:30Z).
- Library Master snapshot은 창작 850행 공개 상태만 갱신했다. 다른 콘텐츠 통계 및 기존 자산 검사 시각은 그대로이며 새로운 전수 자산 검사로 보고하지 않는다.
- 파닉스 카드 설명과 전체 본문 문맥을 비교한 창작 128장면(한글36/영어92), 기존 공개책6장면을 검토 목록에 기록했다. 131단어·134장면, 창작19시리즈가 포함된다. 기존 비모호 단어의 다른 동화 후보는 유지한다.
- 가위바위보의 가위, rose의 동사, cap의 버섯 갓, plant/dress의 동사, 장난감·비유·가상 대체물 등 혼동 후보를 제외했다. 모호한 기존 낱말 후보는 검토된 장면만 허용하고 없으면 기존 단원 장면 폴백을 사용한다.
- 생성 시 실제 공개 상태·파닉스 정답 단어·검토 본문 SHA·삽화·해당 언어 TTS를 검증한다. 실행 시에도 공개 상태와 검토 본문·삽화·언어 TTS를 확인해 본문 의미가 바뀌면 연결을 거부한다. 영어 대문자 정답도 인덱스를 찾는다.

## 조사 한계와 남은 항목

창작 어휘3,957개와 일치하는 삽화 URL3,957개가 있다. 영어 어휘 이름은 0개이므로 창작 자체 영어 어휘 게임은 여전히 별도 보완 대상이다. 이번 영어 파닉스 연결은 영어 본문/TTS를 사용하며 영어 어휘 이름을 채운 작업이 아니다.

한글32단원128개·영어39단원388개 정답 사용에는 카드 삽화/키포인트가 있다. 한글128개 및 영어25개는 저장된 단어 음원이 없으나 라이브러리 폴백이 있으므로 실제 음성 실패로 단정하지 않았다. 모든 게임·모든 그림 육안·음원 청취 전수 검증은 하지 않았다. 이번 의미 검토는 본문과 카드 설명 대조이며 모든 장면을 육안 검수했다는 뜻이 아니다.

기존 `build-phonics-word-scenes.mjs`는 철자/굴절형 자동 검색이므로 공개된 창작850권을 무검토 재수집하는 용도로 쓰지 않는다. 새 연결은 아래 검토 목록과 source-bound builder로 재생성한다.

## 검증과 재현

- 증거: `D:/tangobook-inventory/20261012-vocabulary-links/`, `D:/tangobook-inventory/20261012-changjak-publish/{pending,applied,complete.json,books-after-publish.json}`.
- `node scripts/publish-changjak-books.mjs <journal-root> <books.json>`: 완료850, 운영 목록850공개, 관련 없는 필드 보존 검증 통과. GET 일시404만 재시도하며 POST는 저널 대조 후 재개한다.
- `node scripts/build-changjak-word-scenes.mjs <books-after-publish.json>`: 131단어/134장면/19창작시리즈. 검토 원본은 [references](20261012-changjak-word-scene-references.json).
- Node builder4테스트, client 관련3파일11테스트 통과. preload→영어 장면→음원→만난 책 기록, 대문자, 비공개/본문 의미 변경/언어 불일치 거부를 검증했다.
- client typecheck, 변경 TS ESLint, production build 검증. 기존 Browserslist/큰 번들/Lottie 경고가 있다.

## 인계

공개는 운영 API에 이미 반영되어 코드 배포를 기다리지 않는다. 파닉스 변경은 로컬만이며 이 작업의 main push 요청은 아직 없다. 별도 누락 TTS 생성·등록 배치는 계속 실행 중이고 완료로 간주하지 않는다.
