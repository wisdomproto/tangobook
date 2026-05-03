# Phase 0 — 기존 자산 처리 결정

**Date:** 2026-05-03
**Status:** Decided (구현 미실행)
**선행조건:** `2026-05-03-phase1-learning-system-design.md` 와 함께 읽을 것
**Source:**
- 사용자 v1 설계 문서: `C:\Users\101024\Downloads\탱고북_학습시스템_설계_v1.docx`
- 2026-05-03 설계 세션 정제 (4 라운드 대화)

---

## 0. 왜 Phase 0가 필요한가

사용자 v1 문서가 새 학습 시스템(3축 분리 + 도감 메타)을 확정했으나, **기존 가동 중인 시스템이 그린필드처럼 누락**됨. v2 부채 케이스(`memory/library-v1-unification.md`)처럼 두 시스템 공존 → 노출 누락 / 사용자 혼란 / 코드 부채로 이어짐.

→ Phase 1 본 작업 진입 전, **기존 자산 21+종 게임 / 6 아케이드 / 7 Playground / 호리방 / 별 / Missions 처리 결정 박아둠**.

## 1. 결정 코드

| 코드 | 의미 |
|---|---|
| 🟢 **유지** | 새 설계에 그대로 들어감 (코드/노출 변경 X) |
| 🟡 **이전** | 부분 적합, 새 설계 용어/구조에 맞게 리매핑 |
| 🔵 **격리** | 3축 메인 플로우에서 분리 (제작 도구 / 부모용 / 마케팅) |
| ❌ **OFF** | Phase 1 미노출 (코드 보존, 라우트 가드 + 메뉴 제거) |
| 🔴 **폐기** | 새 설계와 충돌 또는 좀비 코드 (코드 삭제) |
| ⚪ **보류** | 다음 세션 결정 (파닉스 트랙 등) |

**"❌ OFF (코드 보존)" 정의:**
- 라우트는 살아있되 `<Route>` 가드로 노출 차단 (직접 URL 입력해도 차단)
- AppShell / 메인 메뉴 / 네비에서 진입점 완전 제거
- 백엔드 데이터 인프라(Supabase 테이블, RPC, trigger)는 그대로 유지
- 베타 데이터(D7 리텐션 등) 측정 후 ON 또는 영구 폐기 결정
- **이유**: Phaser4 자산, 호리방 5 슬롯 × 14 stub 등 매몰비용 보존 + 베타 데이터 기반 결정

## 2. A. 동화 트랙 영역

| 시스템 | 현재 상태 | 새 설계 매핑 | 결정 | 비고 |
|---|---|---|---|---|
| R2 동화책 211권 | 명작 49권 × variation = 114권 + 생활/자연/일반 ~100권 | §2 동화 트랙 | 🟡 **선별 이전** | 명작 49권 + 생활/자연 30권 선별. 나머지 ~130권 archive (R2 그대로, library 노출 X) |
| Viewer + 호리 마스코트 | Khan Kids × 곰돌이푸 톤, 자막 시스템 | §2.1 인터랙티브 그림책 | 🟢 **유지** | **글로우 펄스 + 단어 카드 팝업 신규 추가** (forced alignment 파이프라인 필요) |
| 그림체 variation | `__styleId` suffix, styleAssets map | (영향 없음) | 🟢 **유지** | 도감/게임은 base book 단위라 variant 무관 |
| 사물 모으기 | 없음 | (제거됨) | 🔴 **폐기** | 숨은그림찾기에 자연 흡수 (사용자 결정 2026-05-03 round 3) |
| 숨은그림찾기 | 없음 | §2 동화 트랙 게임 | 🆕 **신규 제작** | **동화 톤 UI 전용**. 학습 톤 컴포넌트 X (FeedbackOverlay/GameProgressBar/GameResultScreen X) |
| 틀린그림찾기 + 변신 컷씬 | 없음 | §2 동화 트랙 게임 | 🆕 **신규 제작** | 변신 구조 30~40권만. AI 변형 일러스트 파이프라인 검토 |

## 3. B. 어휘 트랙 영역 — 학습 게임 21 register

**사용자 결정 (2026-05-03 round 3): 글자 블록/따라쓰기/어휘-그림 매칭은 책 직후 노출하면 학습 모드 전환이 갑작스러움 → 어휘 트랙 전용으로 격리.**

### B-1. 노출 게임 (10종, 한/영 페어 + connect-the-dots)

| 게임 ID | 현재 상태 | 새 설계 매핑 | 결정 |
|---|---|---|---|
| `korean-block` | 노출, ㄱ+ㅏ+ㅁ→감 조립 | §3.2 한글 블록 | 🟢 **유지** |
| `english-block` | 노출, 영어 자모 조립 | 어휘/파닉스 트랙 후보 | 🟡 **이전** (파닉스 트랙 후보, 다음 세션) |
| `korean-word-writing` | 노출, 손가락 필기 | §3.2 따라쓰기 | 🟢 **유지** |
| `english-word-writing` | 노출 | §3.2 따라쓰기 (영어) | 🟢 **유지** |
| `korean-line-matching` | 노출, 그림↔단어 드래그 선긋기 | §3.2 단어 맞추기 | 🟢 **유지** |
| `english-line-matching` | 노출 | §3.2 단어 맞추기 (영어) | 🟢 **유지** |
| `korean-story-image` | 노출, 음성→그림 4지선다 | §3.2 단어 맞추기 변형 | 🟢 **유지** |
| `english-story-image` | 노출 | §3.2 변형 (영어) | 🟢 **유지** |
| `connect-the-dots` | 노출, 점잇기 (언어 중립) | 어휘 트랙 — 단어 그림 그리기 | 🟢 **유지** |

### B-2. Hidden / 보류

| 게임 ID | 현재 상태 | 결정 | 비고 |
|---|---|---|---|
| `korean-speaking` | hidden, Azure 도입 대기 | ⚪ **보류** | Azure 재공개 시 어휘 트랙 4번째로 검토 |
| `english-speaking` | hidden | ⚪ **보류** | 위 동일 |

### B-3. 좀비 게임 — 폐기

(register/player/config 코드는 살아있으나 인스턴스 일괄 삭제됨. 새 설계와 충돌하므로 코드도 삭제.)

| 게임 ID | 비고 |
|---|---|
| `word-writing` (legacy) | korean/english-word-writing으로 대체됨 |
| `vocabulary-matching` | 4-23 단순화 시 제거 |
| `word-quiz` | 위 동일 |
| `picture-sequence` | 위 동일 |
| `odd-one-out` | 위 동일 |
| `storybook-quiz` | 위 동일 |
| `word-image-matching` (파닉스) | 위 동일 |
| `blending-listening` (파닉스) | 위 동일 |
| `letter-sound` (파닉스) | 위 동일 |
| `word-listening` (파닉스) | 위 동일 |

→ **모두 🔴 폐기**: register / player / config / shared 타입 정의 정리.

### B-4. Vocabulary Unit (Cambridge Pre-A1 16 토픽)

| 시스템 | 결정 | 비고 |
|---|---|---|
| Cambridge 16 토픽 (KeyObject 1:N) | 🟡 **이전** | Cambridge = 영어 학습 표준 (어휘 트랙), 도감 카테고리 6개 = narrative. **둘 다 살리되 역할 분리** |
| KeyObject (358권 마이그) | 🟢 **유지** | 새 도감 단어 카드 데이터 직결 |

## 4. C. 도감 / 별 / 콜렉션 영역

| 시스템 | 현재 상태 | 결정 | 비고 |
|---|---|---|---|
| Stars 백엔드 (Supabase trigger / star_ledger / RPC 9개) | 자동 적립 가동 중 | 🟢 **유지** | **도감의 데이터 엔진**. Phase 1 ON 필수 |
| 별 카운터 (아이 화면) | 일부 화면 노출 | 🟢 **ON** | 도감 카테고리별 누적 currency로 표시. **가게/가격표 X** (transactional X) |
| 별 그래프 (부모 대시보드) | Learning Reports 일부 | 🟢 **ON** | 학습 진척 시각화 |
| Collection (167장 카드, 8 카테고리) | locked→silhouette→owned→active | 🟡 **이전/확장** | 167 → **1,200단어**. 카테고리 8 → 6 (동물/음식/마법/사람/자연/집) 리매핑 |
| Word Mastery 4단계 | learning_events 자동 산출 | 🟢 **유지** | 어휘 트랙 "오늘의 단어 5개" 추천 로직 |
| **호리방 꾸미기 (5 슬롯 × 14 stub)** | `/hori-room` 가동 중 | ❌ **OFF (코드 보존)** | 라우트 가드 + 메뉴 제거. 베타 D7 측정 후 결정 |
| **Weekly Missions** | 미션 시스템 가동 중 | ❌ **OFF (코드 보존)** | 위 동일 |

## 5. D. 파닉스 영역

| 시스템 | 결정 | 비고 |
|---|---|---|
| Phonics 71권 (한/영) | ⚪ **보류** | 다음 설계 세션에서 게임 메커니즘 결정 |
| 파닉스 4종 좀비 게임 | 🔴 **폐기** | (B-3 표에 포함) |

## 6. E. 부수 시스템 (3축 외부)

| 시스템 | 현재 상태 | 결정 | 비고 |
|---|---|---|---|
| **Hori Arcade 6종** (Phaser4) | `/games/*` 라우트 | ❌ **OFF (코드 보존)** | 라우트 가드 + 메뉴 제거. 베타 D7 < 25%면 Phase 3 검토 |
| **Playground 7게임** | word-memory 1 출시 + 6 stub | ❌ **OFF (코드 보존)** | word-memory는 v1 §10 "단어 짝꿍 폐기"와 충돌하나 **코드는 보존** (사용자 결정 2026-05-03 round 6) |
| 롱폼 영상 (ffmpeg) | YouTube 업로드 가동 | 🔵 **격리** | 마케팅 트랙 |
| 오디오북 (Remotion) | YouTube 업로드 가동 | 🔵 **격리** | 마케팅 트랙 |
| Marketing 블로그/카드뉴스 | 가동 중 | 🔵 **격리** | 제품 외부 도구 |
| 자료실 마스터 페이지 | 정적 HTML 3개 | 🔵 **격리** | 내부/부모용 |
| Editor / Editor2 | 콘텐츠 제작 도구 | 🟢 **유지** | 변신 구조 마킹 UI 추가 필요 |
| Auth (Supabase 부모+자녀+PIN) | 86 tests PASS | 🟢 **유지** | 그대로 |
| Learning Reports (4탭) | 활동/동화책/파닉스/어휘 + 그림체 분포 | 🟡 **확장** | 도감 진척 탭 추가 |

## 7. Phase 1 진입 ON/OFF 체크리스트

| 영역 | Phase 1 | 비고 |
|---|---|---|
| 동화 트랙 (숨은그림 + 틀린그림) | ✅ ON | 동화 톤 UI 신규 |
| 어휘 트랙 (블록/쓰기/매칭/그리기 한·영) | ✅ ON | 노출 게임 9종 그대로 |
| 도감 1,200단어 (카테고리 6개) | ✅ ON | 167장 → 1,200 확장 |
| 별 백엔드 (trigger/ledger/RPC) | ✅ ON | 도감의 데이터 엔진 |
| **별 카운터 (아이 화면)** | ✅ ON | 카테고리별 currency 표시. **가게/가격표 X** |
| 부모 대시보드 (Learning Reports + 별 그래프) | ✅ ON | 4탭 → 도감 진척 추가 |
| **호리방 꾸미기** | ❌ OFF | 코드 보존 |
| **호리 아케이드 6종** | ❌ OFF | 코드 보존 |
| **Weekly Missions** | ❌ OFF | 코드 보존 |
| **Playground 7게임** | ❌ OFF | 코드 보존 |
| Speaking 게임 (한·영) | ❌ OFF | hidden 유지, Azure 도입 시 검토 |

## 8. 폐기 작업 (Phase 0 실행 시)

| 항목 | 추산 | 비고 |
|---|---|---|
| 좀비 게임 10종 (word-writing legacy + 9종) | 0.5일 | register/player/config/타입 삭제 |
| 사물 모으기 관련 v1 docx 텍스트 | 본 spec에서 정정 | 코드 영향 없음 (구현 안 됨) |
| ❌ OFF 라우트 가드 추가 | 0.5일 | hori-room / hori-arcade(6) / weekly-missions / playground / playground/* |
| 메뉴/네비 진입점 제거 | 0.5일 | AppShell / Library / Reports |
| **합계** | **약 1.5~2일** | (v1 추산 4~7일에서 단순화됨, 사용자 round 3 결정으로 🟡 이전 작업 대거 축소) |

## 9. 다음 액션

1. 본 spec 사용자 컨펌 → 메모리 등록 (`memory/phase0-asset-cleanup.md` 포인터)
2. Phase 1 spec(`2026-05-03-phase1-learning-system-design.md`) 함께 컨펌
3. 폐기/OFF 작업 PR 분리 (Phase 1 본 작업 진입 전 코드 청소)
4. PoC 1권 (신데렐라 풀세트) — Phase 1 본 작업의 첫 검증

---

**문서 끝.**

작성: 길중님 ↔ Claude (Anthropic) 설계 세션 (2026-05-03, 6 라운드 대화)
다음 업데이트: Phase 1 PoC 검증 후 / 베타 데이터 측정 후
