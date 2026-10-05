# 학습 데이터와 부모 리포트 구현 기획

2026-10-05 · 코드 점검 기반 실행 초안. 브랜딩 문서 편집은 중단한다. 이번 산출물은 구현 기획과 화면 시안이며 제품 코드·운영 DB는 변경하지 않는다.

[모바일 우선 화면 시안](learning-report-prototype-2026-10-05.html) · [화면 폭별 비교](learning-report-preview-2026-10-05.html)

## 1. 구현할 경험

아이는 동화와 독후활동을 즐기고, 부모는 **무엇을 만나고 어떻게 연습했으며 다음에 무엇을 하면 좋은지** 이해한다. 파닉스·동화·어휘·독후활동의 기록은 아이별·언어별로 이어진다.

동화 → 독후활동 → 관련 파닉스 → 원래 독후활동 복귀를 지원한다. 읽는 중 파닉스로 보내는 경로를 중심으로 삼지 않는다. 활동에서 처음 만난 파닉스 타깃 어휘의 기존 기록을 확인해 선택 안내한다. 기록 없음은 아이가 현실에서 모른다는 뜻이 아니다.

정확한 기록, 활동별 해석, 간결한 화면을 동시에 설계한다. 학습도 하나를 크게 표시하기보다 노출·직접 연습·능력별 근거·파닉스 이력을 나눈다.

## 2. 현재 코드 점검 결과

아래는 로컬 main의 코드와 저장된 SQL을 읽은 결과다. 운영 DB의 현재 트리거·제약·실제 사용자 데이터까지 검증한 결과는 아니다. 운영 리포트는 브라우저에서 로그인 화면으로 이동해 실제 자녀 리포트 화면을 확인하지 못했다. UI 평가는 현재 컴포넌트 코드에 기반한다.

| 영역 | 확인한 동작 | 구현할 때 해결할 문제 |
|---|---|---|
| 원본 이벤트 | `learning_events`에 profile_id, event_type, word, storybook_id, game_type, metadata, created_at 저장 | 단어 문자열 외 공통 식별·세션·시도·중복 방지·규칙 버전 추가 |
| 게스트 단일 기록 | `useLogEvent`는 localStorage에 최대 2,000건 저장 | 잘림·저장 실패를 데이터 품질 상태로 관리 |
| 게스트 게임 기록 | `useLogEventsBatch`는 프로필 없으면 반환 | 게임 결과와 책의 어휘 노출이 누락될 수 있음. 단일/묶음 수집 경로 통합 |
| 게스트 이관 | `useAdoptGuestEvents`는 큐를 먼저 비우고 업로드, 실패 시 복원 | 확인 응답 전 삭제하지 않는 방식, 재시도 멱등성, 신규 기록과 복원 충돌, 자녀 선택 필요 |
| 로그인 기록 | insert 성공/실패를 일반 호출부가 사용하지 않음 | 전송 큐·실패 재시도·프로필 변경 시 귀속 고정 |
| 이벤트 조회 | 최근 5,000건 요청, estimated count, capped 플래그 | 기간/어휘별 조회와 전체 이력 집계 필요. 오류를 빈 배열로 바꿔 ‘기록 없음’처럼 표시하지 않기. 실제 서버 반환 상한도 확인 |
| 읽기 노출 | Viewer 페이지 진입에서 page_read와 페이지 key_objects의 word_exposed 기록 | 실제로 읽음/들음이 완료됐다는 판정과 구분. 빠른 넘김·재진입·언어 전환 판정 개선 |
| 언어 | Viewer는 en 이외를 ko로 축소, extractPageWords는 한/영 선택 | 글로벌 리포트에 실제 콘텐츠 언어 보존. UI 언어와 분리 |
| 출처 | 공통 게임 로거는 기본 storybook, vocabulary context 지원 | phonics context와 활동 위치를 명시적으로 전달. 파닉스 안 게임이 동화 활동으로 분류되지 않게 |
| 게임 결과 | 여러 플레이어가 게임 종료 시 묶음 전송 | 중단 전 이미 한 라운드도 보존. 첫 시도·재시도·최종 완료의 의미 통일 |
| 그림–단어 선긋기 | 종료 시 모든 항목 correct:true 전송 | 과제를 완성했다는 사실이며 첫 시도 정답률이 아님 |
| 한글 블록 | 정답 시 `isFirstTry`를 word 결과에 저장, 완료 후 묶음 전송 | 첫 시도 실패와 최종 성공을 별도 기록. 음절 분해 결과에 받침 전달 누락 점검 |
| 쓰기 | 일부 쓰기 플레이어는 finalPassed 배열로 최종 결과 전달 | 따라쓰기·초기 시도·재시도·정확도·힌트를 구분. 스스로 읽기 성공으로 해석하지 않기 |
| 기타 활동 | StoryImagePlayer는 전체 score/rounds 전달, ColoringPlayer 등은 이번 읽은 경로에서 공통 어휘 로거 확인 안 됨 | 등록기·호출 래퍼 포함 전 경로 검사. 의미 있는 어휘 판정이 없는 활동은 참여로만 기록 |
| 파닉스 방문 | PhonicsViewer는 진입 때 page_read/lastPage:true 기록 | 방문 ≠ 연습 ≠ 단원 완료 |
| 파닉스 완료 | 활동 페이지는 완료 시 unitId page_read 기록, 실제 활동 완료는 언어·단원 기준 localStorage에 저장(프로필 구분 없음) | 활동 ID별 완료를 아이 프로필 기준 서버에 동기화 |
| 파닉스 리포트 | readPhonicsUnitIds는 page_read 하나로 단원 방문 집계, Summary는 ‘마쳤어요’ 표현 | 단원 완료는 requiredActivities에 대한 실제 완료로 판단 |
| 어휘 노출 집계 | 클라이언트 exposed에는 정답·오답도 포함 | 보기·듣기 노출과 직접 시도 횟수를 분리 |
| 상태 기준 | 배지 익힘 ≥0.6, 타깃 익힌 단어 수 ≥0.85 | 같은 상태 이름·조건·분모를 단일 규칙으로 사용 |
| DB/클라이언트 | SQL word_mastery exposed는 word_exposed만, 클라 exposed는 시도도 포함 | 기존 두 집계의 정의·시간 경과·동작을 맞추거나 새 투영으로 전환 |
| 어휘 리포트 | VocabularyMasteryCard는 감쇠 점수를 %로 표시, 상위10을 ‘잘 알아요’로 표시 | 기록이 적은 상위 항목도 잘 아는 것으로 보이는 문제. 근거와 판단 보류 표시 |
| 부모 UI | 일반 부모는 동화/파닉스 탭, 어휘/활동은 개발자만 표시 | 전체 어휘를 부모 리포트의 중심 정보로 재구성, 공개는 데이터 검증 후 |
| 글로벌 날짜 | shared 집계는 KST 고정 | event UTC 보존, 조회 대상 아이의 IANA timezone으로 기간·날짜 계산 |

### 유지할 기존 좋은 설계

- 조회 대상 아이와 실제 활동 중인 activeProfile을 분리한다. 리포트에서 형제를 바꿔도 새 학습 기록의 주인이 바뀌면 안 된다.
- 오늘 한 일을 문장으로 설명하고 로딩 중 가짜 0을 보여주지 않는다.
- 추천 카드에 바로 실행 경로를 제공한다. 자모 격자 등 상세는 원하는 부모가 열어볼 수 있게 한다.
- 이미 있는 learning_events·프로필 RLS·어휘 자산·파닉스 커리큘럼을 재사용한다.

## 3. 데이터 의미부터 통일한다

### 세 개의 축

| 축 | 기록 상태 | 부모가 이해할 표현 |
|---|---|---|
| 어휘 경험 | 이력 확인 불가 / 알려진 이력 없음 / 노출 / 직접 연습 | 기록 확인 중 / 탱고북에서 아직 만난 기록 없음 / 만나 봄 / 직접 연습함 |
| 능력별 근거 | 소리–글자 연결, 뜻 매칭, 음절/철자 조합, 따라쓰기, 문맥 이해 | 블록으로 조합해 봤어요 / 그림과 낱말을 연결했어요 등 활동 근거 |
| 관련 파닉스 | 타깃 아님 / 타깃·관련 기록 없음 / 방문 / 연습 / 단원 완료 | 연결 학습 없음 / 파닉스 기록 없음 / 단원 방문 / 관련 놀이 연습 / 필수 활동 완료 |

색칠·장면 감상·소리 듣기는 노출/참여의 근거다. 단독 색칠 성공에 글자 읽기 점수를 주지 않는다. 그림–단어 선택이 음성을 함께 제공하면 ‘텍스트만 읽기’ 증거로 쓰지 않는다. 따라쓰기를 자발적 쓰기로 해석하지 않는다. 항목별 skill registry가 판정 가능한 범위를 선언한다.

### 학습 상태의 초안

V1은 **만나 봄 / 연습 중 / 연습이 안정됨**으로 표현한다. ‘연습이 안정됨’은 능력별로 표시하고 뜻을 읽는 능력 전반으로 확장하지 않는다. 기록 없음과 조회 불가를 별도 상태로 둔다.

초기 검토 규칙: 동일 능력의 유효 첫 시도 5건 이상·서로 다른 세션 3개 이상·서로 다른 날짜 2일 이상·최근 유효 10시도 중 무힌트 성공률 80% 이상이면 해당 활동의 ‘연습이 안정됨’. 힌트 유무가 미수집이면 해당 조건을 충족했다고 추정하지 않는다. 시도 부족은 연습 중/근거 부족이다. 이 수치는 내부 추천용 초기 제품 규칙이며 검증된 교육 평가 기준이 아니다. 파일럿에서 조정하고 ruleVersion을 남긴다.

오랫동안 활동하지 않으면 ‘다시 만나면 좋아요’라는 복습 신호를 별도로 둔다. 과거에 했던 학습·완료 이력을 없애거나 점수 하락을 퇴보로 설명하지 않는다. V1 화면에는 마스터리 %·수준 비교·동년배 순위를 넣지 않는다.

## 4. 공통 어휘와 타깃 연결

어휘 키는 `language + normalizedForm + senseId`로 설계한다. NFC, 영어 소문자·양끝 공백 등 언어별 정규화를 shared에서 정의한다. 한글 조사·영어 굴절형을 무조건 제거하지 않는다. 같은 표기의 다른 뜻은 같은 상태로 합치지 않는다. sense 미확정이면 provisional 키로 기록하고 추천에서 모호함을 표시한다.

‘오리’와 ‘duck’은 같은 concept으로 연결할 수 있지만 언어별 어휘 학습 상태는 별도다. 기존 vocabulary-db에서 뜻·이미지·책 연결을 재사용하고 처음부터 전 사전을 재구축하지 않는다.

`word_target_links`는 여러 어휘 ↔ 여러 단원/음절/패턴을 허용한다. 공유 커리큘럼 sampleWords에서 초안 생성 후 실제 공개 콘텐츠와 활동 주소를 대조한다. 연결 유형(target/incidental), 언어, unitId, activityId, skill, 공개 여부, curriculumVersion을 가진다. 영어 Book 1의 단어와 Book 2 이후 조합 활동을 같은 방식으로 보내지 않는다. 노출되지 않은 단원이나 잠긴 활동은 즉시 시작 버튼으로 제안하지 않는다.

어휘 전체를 안다고 관련 모든 음절을 익힌 것으로, 동화 활동 기록이 있다고 파닉스 단원 완료로 판정하지 않는다.

## 5. 이벤트 V2와 수집 계약

learning_events를 원장으로 유지하는 방향을 우선 검토한다. 새 테이블로 일괄 복사하거나 오래된 이벤트를 삭제하지 않는다.

| 필드 | 용도 |
|---|---|
| clientEventId / schemaVersion | 클라이언트 UUID, 이벤트 재전송 멱등성, V1/V2 구분 |
| profileId 또는 guestChildId | 생성 당시 아이 고정. 전송할 때 활성 프로필로 덮어쓰지 않음 |
| sessionId / activityRunId / roundId / attemptId | 세션·활동 실행·라운드·시도 구분 |
| occurredAt / receivedAt | 실제 시점 UTC와 서버 수신 시점, 오프라인·늦은 도착 처리 |
| language / lexemeId / wordSnapshot | 콘텐츠 언어와 공통 어휘, 원본 표시 문자열 |
| source / contentId / pageNumber / unitId / activityId | 콘텐츠 출처와 실제 활동 문맥 |
| eventKind / exposureMode | exposure, attempt, activity-start/complete/abandon, unit-visit/complete; 화면·듣기·직접 선택 구분 |
| skill / outcome | 판정한 능력, success/failure/participated/ungraded |
| attemptIndex / hintUsed / inputMode / responseMs | 첫 시도·도움·터치/실물·반응 시간. 미수집은 null |
| rubricVersion / contentVersion | 판정 조건과 콘텐츠 버전 |

`eventKind`는 의미상의 V2 필드다. 기존 event_type을 확장할지 metadata로 시작할지는 현재 DB 제약과 보상 트리거 조사 후 migration에서 결정한다. outcome 없는 노출에 정답을 만들지 않는다. 단어/음절 자식 증거는 parentAttemptId로 연결해 동일 시도를 여러 번 가산하지 않는다. 초성·중성·받침을 모두 보존한다.

### 노출과 활동 수집

- 페이지 진입은 page-view 기록이다. 노출은 대상 화면이 실제 표시된 조건을 명시하고 동일 run·page·word·exposureMode의 자동 재렌더를 중복 제거한다. 본문 key_objects 자동 추출은 passive-context로, 낱말 직접 선택은 active-word로 구분한다.
- audio-start와 audio-complete를 구분한다. 소리 시작을 끝까지 들음으로 표시하지 않는다. 단어별 완료를 알 수 없는 전체 나레이션에 word-listened 완료를 생성하지 않는다.
- 라운드마다 판정과 최종 완료를 별도 보존한다. 게임 끝까지 하지 않아도 이미 수행한 시도는 저장한다. 실물 활동은 확인 가능한 인식·판정 범위만 기록한다.
- 선긋기 최종 완성과 첫 시도 정답, 블록 첫 시도 실패와 재시도 성공을 분리한다.
- 부모 도움은 실제 수집 가능할 때만 기록한다. 아이가 ‘혼자 학습함’은 기록만으로 확정하지 않는다.

### 저장과 게스트

공통 writer → 로컬 outbox → 서버 저장 → ACK → ACK된 항목 제거. eventId를 재시도에도 유지한다. 게스트는 guestChildId로 기기 내 기록하고 가입 시 부모가 귀속할 아이를 선택한다. 한 기기 게스트의 여러 아이 기록을 한 아이에게 자동 합치지 않는다. 기기 내 목록/프로필 모델이 먼저 필요하다.

기기 저장 한도·브라우저 삭제로 사라질 수 있는 기록은 coverage 상태로 남긴다. 실패가 놀이를 막지는 않지만 동기화 대기·불완전 리포트임은 부모에게 설명한다. 이관 중 새 기록, 실패 복원, 앱 종료, 중복 ACK를 검증한다.

### 게스트 보관 기간 검토안 · 아직 미확정

사용자는 일주일 기록 후 삭제 안내를 제안했다. 권장안은 **기기에 최근 7일의 기록을 보관하고 가입하면 남아 있는 기록을 선택한 아이에게 누적 보관**하는 방식이다. 첫 이용 후 7일에 전부 삭제하는 것과 구분한다. 콘텐츠 이용을 차단하는 체험 만료와도 별개다.

삭제 안내는 아이 놀이 중 팝업 대신 부모 리포트 또는 활동 종료 안내에서 제공한다. “이 기기에는 최근 7일의 배움 기록이 남아요. 기록을 계속 보관하려면 가입해 주세요.” 구체적인 삭제가 가까울 때만 “오래된 기록 일부가 곧 지워져요”라고 실제 삭제 대상에 맞게 안내한다. 푸시·메일 발송이나 자동화 작업은 이번 범위가 아니다.

TTL 도입 시 expiresAt·oldestAvailableAt·coverageSince를 관리하고 이력 삭제 뒤 타깃을 ‘학습 안 함’으로 단정하지 않는다. 게스트에게는 “최근 7일 안에 관련 파닉스 기록이 없어요”로 범위를 밝힌다. 등록 이관에는 남아 있는 기간만 포함하고 이미 지운 데이터를 복원한다고 약속하지 않는다. 실제 기간·삭제 시점·안내 빈도·가입 후 보관 정책은 사용자와 후속 확정한다. 현재 제품의 2,000건 게스트 저장 로직은 변경하지 않았다.

## 6. 집계와 API

전체 lifetime 이벤트를 매 화면에서 내려받아 계산하는 구조를 줄인다. shared의 순수 집계/상태 규칙을 서버 투영과 클라이언트 예시에 공통 사용한다.

제안 투영: `child_word_progress`(경험/첫·최근 시점/언어/품질), `child_word_skill_progress`(능력별 시도·날짜·도움·상태), `child_unit_activity_progress`(visited/started/completed), `child_learning_daily`(기간별 고유 어휘·활동). 원장으로 재계산 가능하고 projectorVersion·event watermark·ruleVersion을 저장한다. 동일 이벤트 재처리가 카운트를 늘리지 않아야 한다.

보상·SR용 기존 word_mastery와 부모 리포트의 의미를 분리한다. 기존 SQL 트리거가 학습 이벤트마다 별·streak·마스터리를 갱신하므로 V2 부모 시도와 legacy word 이벤트의 중복 보상을 막는다. 병행 수집은 shadow projection부터 시작하고 기존 보상 경로는 하나만 사용한다.

| API 초안 | 반환할 내용 |
|---|---|
| GET /api/learning/profiles/:profileId/report?from&to&lang&timezone | 오늘/기간 요약, 기간 범위, 신규/직접 연습 고유 어휘, 추천, coverage·asOf |
| GET /api/learning/profiles/:profileId/words?lang&filter&cursor | 상태별 어휘 목록, 파닉스 배지, 커서 페이지네이션 |
| GET /api/learning/profiles/:profileId/words/:lexemeId | 언어·능력별 근거, 출처 이력, 파닉스 이력, 추천 이유 |
| POST /api/learning/events/batch | eventId별 accepted/duplicate/rejected·retryable, 수신 watermark |
| POST /api/learning/profiles/:profileId/words/lookup | 독후활동 어휘를 한 번에 조회해 타깃·관련 상태·가능한 활동 반환 |

라우트 → controller → service → repository, shared DTO와 기존 AppError/asyncHandler를 따른다. parentGate는 UI 진입 장치이며 데이터 접근 통제가 아니다. 서버/RLS에서 실제 계정의 child profile 소유 여부를 검사한다. 외부 프로필 ID 접근은 거부한다. 성공한 빈 결과·로딩·실패·부분 이력은 서로 다른 응답 상태다. estimated count를 정확한 전체 수처럼 표시하지 않는다.

UI 언어와 학습 언어는 별도 입력이다. 날짜 범위는 아이/가정 timezone으로 명시한다. UTC 원장을 현지 날짜로 집계하며, 이번7일/이전7일처럼 비교 기준을 맞춘다. 여러 나라의 ‘오늘’을 KST로 강제하지 않는다.

## 7. 독후활동 중 안내

활동 진입 시 관련 어휘를 batch 조회한다. 이번 활동의 첫 노출을 쓰기 **전의 상태**를 판단 기준으로 고정해야 ‘처음 보는 단어’ 조건이 자기 이벤트 때문에 사라지지 않는다. 서버 ACK 대기 이벤트도 로컬 중복 판단에 반영한다.

| 상태 | 안내 |
|---|---|
| 전체 기록 확인 완료 + 해당 어휘 이력 없음 + 공개 파닉스 타깃 | 탱고북에서 처음 만나는 낱말이에요. 관련 소리 놀이도 해볼까요? |
| 동화 기록 있음 + 해당 타깃의 파닉스 연습 이력 없음 | 전에 만난 낱말이에요. 이 낱말의 파닉스 놀이 기록은 아직 없어요. |
| 관련 놀이를 방문만 함 | 방문했지만 연습 기록은 아직 없어요. |
| 연습 이력 있음 + 특정 능력 복습 필요 | 연습했던 낱말이에요. 이 소리를 다시 만나볼까요? |
| 기록 불완전/조회 실패/타깃 모호/지원 활동 없음 | 미학습 단정 없이 원래 활동을 계속 제공 |

매 단어 팝업 대신 라운드 결과·활동 결과의 선택 카드에서 1–2개만 제안한다. ‘계속 놀기’가 항상 가능하다. 안내 dismiss를 기록해 같은 activityRun에서 반복 권유하지 않는다.

returnContext는 bookId·activityId·activityRunId·roundId·해당 입력 상태를 보존한다. 저장 가능한 화면 상태만 저장하고 복귀 시 중복 결과/보상이 없게 한다. 잠긴 파닉스로 이동시켜 전체 진도를 우회하지 않는다. 열린 짧은 낱말 놀이부터 연결하고 단원 이수와 분리한다.

## 8. 부모 리포트 UI/UX

모바일이 우선이다. 현재의 동화/파닉스 영역 구분을 통합 요약 아래의 상세 보기로 옮기고 **오늘의 배움 → 다음 놀이 → 만난 어휘**를 기본 화면으로 한다.

- 상단: 조회 대상 아이, 한국어/영어 등 학습 언어, 오늘/최근7일. 부모가 바꾸는 조회 대상은 활동 중인 아이를 바꾸지 않는다.
- 오늘 카드: 책과 활동을 연결한 문장 한 줄. 바로 아래 기간이 명시된 신규 어휘·직접 연습 어휘의 고유 수. 숫자 정의를 상세 설명에서 확인 가능하게 한다.
- 다음 놀이: 근거가 있는 카드 1개를 우선 제안한다. 부족한 증거가 있으면 원인을 설명하고 관심 소재로 고르게 한다.
- 어휘 목록: 그림·낱말·경험 상태·관련 파닉스 여부. 검색과 간단한 필터. 숫자가 많은 타일 대신 가로 행으로 읽기 편하게 만든다.
- 어휘 상세: 모바일에서는 아래에서 열리는 전체 높이의 상세 패널, PC에서는 중앙 대화상자. 노출·직접 연습·능력별 결과·파닉스 이력·최근 활동을 함께 보여준다.
- 자모/음가 격자: 파닉스 상세에 유지. 전체 화면에서 수십 회색 칸을 먼저 보여주지 않는다.
- ‘만난 어휘’는 처음 5개 정도를 실제로 보여주고 나머지는 목록으로 확장한다. 숨겨진 어휘 탭에서 찾아다니지 않게 한다.
- 로딩은 skeleton, 실패는 다시 확인, 기록 없음은 첫 놀이 안내, 일부 이력만 있으면 기간·누락 안내. 모두 0으로 치환하지 않는다.

### 모바일 적응형 규칙

320–430px 한 열, 태블릿 768px 이상 요약/추천 두 열, PC 1,080px 이상 기본 화면 2열·콘텐츠 최대폭 1,120px. 크고 긴 표를 모바일에 그대로 줄이지 않는다. 본문16px·메타14px 내외·터치 영역 최소44px, 좁은 폭에서도 한글·긴 영어 단어 줄바꿈을 허용한다. 상태는 색+문구로 전달한다.

어휘 상세 패널은 safe-area, 내부 스크롤, 닫기 버튼, Escape, 배경 스크롤 잠금, 포커스 복귀를 지원한다. 언어/아이 변경 시 이전 아이 데이터가 깜빡이지 않게 별도 cache key와 skeleton을 사용한다. 모바일 가로 넘침, 키보드가 검색/버튼을 가리는 문제, 200% 텍스트 확대를 점검한다.

기존 cream·coral·mint 팔레트와 호리를 활용한다. 부모 화면은 장식보다 정보의 우선순위와 여백을 강조한다. % 게이지·복잡한 원형 그래프·빨간 ‘약한 단어’ 목록 대신 활동 근거를 보여준다. 시안의 숫자와 자녀는 모두 가상 데이터다.

## 9. 구현 단계와 완료 조건

| 순서 | 작업 | 완료 조건 |
|---|---|---|
| 1 | 수집 계약·언어·출처·첫시도 정의, 공통 writer/outbox, 게스트 묶음 보존 | 게스트/로그인/중단/재시도에 사건 수·귀속이 동일. eventId 재전송 카운트 불변 |
| 2 | 노출/시도 분리, 단원 방문/활동 완료 구분, 구버전 adapter | 기존 기록 삭제 없이 의미 보존. 불확실한 이력은 unknown/partial |
| 3 | 타깃 어휘 매핑·능력별 집계·서버 projection | 선택 어휘·기간에 원장과 화면 수치 일치. 오래된 이력과 다국어 포함 |
| 4 | 모바일 리포트 기본/어휘 상세 구현 | 일반 부모가 어휘를 확인. 320/360/390/430/768/1280px 넘침 없음, 터치·키보드·상태 전이 통과 |
| 5 | 독후활동 안내·짧은 파닉스 연결·복귀 | 기존 활동 계속하기, 학습 상태 안내, 복귀와 중복 보상 방지 확인 |
| 6 | 파일럿·문구·상태 기준 조정 | 부모가 ‘무엇을 했고 다음 무엇을 할지’ 설명할 수 있고 수치 오류/오해를 수정 |

첫 배포는 한글·영어/대표 책과 블록·쓰기·선긋기 등 직접 근거가 있는 활동부터 시작한다. 저장 계약은 5개 학습 언어를 지원하고 미지원 언어를 ko/en으로 바꾸지 않는다. 나머지 활동은 participation 수집부터 확장한다. 기능 flag로 기존 화면 복귀 가능하게 하고 검증 전 마케팅에서 완성 기능으로 약속하지 않는다.

## 10. 이전 데이터와 검증 시나리오

V1은 legacy evidence로 별도 표시한다. 원래 없던 firstAttempt·hintUsed·실제 음성 완료·activityId·세션을 사후 생성하지 않는다. 기존 word 정답은 어떤 게임에서 어떤 의미로 기록됐는지 adapter로 분류한다. page_read만 있는 단원은 visited로 옮기며 completed로 backfill하지 않는다. 기존 localStorage 완료는 아이 귀속이 확인된 경우에만 imported evidence로 반영한다.

대표 시나리오:

1. 게스트가 책을 보고 블록1라운드 후 종료 → 둘 다 기기 기록 → 가입 이관 재시도 → 중복 없이 선택한 아이에 귀속.
2. 동화에서 오리 만남, 파닉스 미연습 → 독후활동 안내 → 선택 놀이 → 원래 라운드 복귀. 단원 완료는 여전히 별도.
3. 선긋기 재시도 후 완성 → 최종 완료는 성공, 첫시도 정답으로 보고하지 않음.
4. 색칠만 함 → 참여와 낱말 노출 표시, 읽기/음가 능력 안정 판정 없음.
5. 영어 Apple/apple 통합, 한국어 사과의 뜻은 혼합하지 않음, 오리/duck 별도 학습 이력.
6. 한글 받침 조합 → 초성·중성·받침 보존, 동일 단어 이벤트와 음절 이벤트 중복 시도 가산 없음.
7. 로그인 프로필 전환·형제 리포트 조회 → 기록의 실제 아이와 조회 대상 분리.
8. 5,000건 초과·조회 실패·서버 부분 범위 → lifetime 미학습/정확한0으로 표시하지 않음.
9. V1/V2 shadow 원장 비교·보상 트리거 확인 → 별1회, 단어1시도, replay 불변.
10. 베트남어/중국어/태국어와 현지 자정 → 실제 언어와 날짜 보존.

이번 점검은 코드 읽기와 새 시안 검수다. 위 기능 시나리오와 운영 DB 확인은 아직 수행하지 않았다. 운영 schema/trigger를 읽기 전용으로 확인한 뒤 migration 범위를 확정한다.

## 확인한 코드 진입점

- [이벤트 타입](../../packages/shared/src/types/learning-events.ts)
- [수집 훅](../../packages/client/src/features/learning/hooks/useLogEvent.ts), [게임 로거](../../packages/client/src/features/learning/hooks/useGameLogger.ts)
- [게스트 기록](../../packages/client/src/features/learning/lib/guest-events.ts), [이관](../../packages/client/src/features/learning/hooks/useAdoptGuestEvents.ts)
- [조회 API](../../packages/client/src/features/learning/api/events.api.ts), [집계](../../packages/client/src/features/learning/lib/aggregate.ts), [학습도](../../packages/client/src/features/learning/lib/mastery.ts)
- [부모 화면](../../packages/client/src/features/auth/pages/ParentReportsPage.tsx), [어휘 카드](../../packages/client/src/features/learning/components/VocabularyMasteryCard.tsx), [파닉스 요약](../../packages/client/src/features/learning/components/PhonicsSummaryCard.tsx)
- [파닉스 진행](../../packages/client/src/features/learning/lib/phonics-progress.ts), [기기 진척](../../packages/client/src/features/phonics-learner/lib/progress-store.ts)
- [읽기](../../packages/client/src/features/viewer/components/ViewerContainer.tsx), [한글 블록](../../packages/client/src/features/games/components/players/KoreanBlockPlayer.tsx), [선긋기](../../packages/client/src/features/games/components/players/LineMatchingPlayer.tsx)
- [저장된 보상 SQL](../../scripts/supabase-rewards-setup.sql), [초기 테이블/RLS](../../scripts/supabase-setup.sql)


## 이번 시안 검수 결과

- Browser에서 별도 정적 시안을 실제로 열어 확인했다. 운영 리포트의 로그인 뒤 실데이터 화면을 본 것은 아니다.
- iframe 실제 viewport를 320/360/390/430/768/1280px로 바꿔 검수했다. 콘텐츠 clientWidth는 스크롤바 제외 305/345/375/415/753/1265px였고, 각 폭에서 document 가로 넘침 없음. 모바일1열·태블릿/PC2열 확인.
- 모바일390px 기본 화면과 어휘 상세 패널을 스크린샷으로 확인. 제목 폭과 숫자 크기를 보완했다.
- 검색 cat, 한글→영어, 자녀 하린→준, 직접 연습 필터의 빈 결과, 상세 열기/닫기, 조회 실패/다시 확인/기록 없음 전이를 확인했다.
- embedded WebP decode, ID 중복, 기획 링크, 두 HTML 스크립트 node --check 통과.
- 실제 기기 키보드·스크린리더·200% 텍스트 확대·터치·실운영 데이터·동기화 기능 시나리오는 미검증. 시안은 실제 API 연결과 학습 판정 기능을 구현한 제품 화면이 아니다.
