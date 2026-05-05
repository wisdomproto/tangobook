# 별/포인트/호리/놀이터 시스템 (Phase 1-5)

별 자동 적립 + 호리 꾸미기 + 어휘 게임 7종 인프라.

## Phase 1: 별 인프라 (2026-05-01)

- 데이터: Supabase `child_profiles.stars_total` + `star_ledger` 거래 원장. SQL: `scripts/supabase-rewards-setup.sql` (적용 완료)
- 신규 테이블: star_ledger / word_mastery / hori_inventory / weekly_missions (전부 RLS 자녀-자기-only)
- 신규 RPC: get_sr_word_pool / grant_game_perfect / purchase_hori_item / complete_weekly_mission
- 별 적립: Postgres trigger `handle_learning_event()` 가 `learning_events` insert 마다 자동 적립 + word_mastery upsert
- 적립 규칙: page_read +1 (마지막 페이지 +5) / word_correct +1 / daily_login +2 / 7일 streak +20. 등급 ×배율 (free 1.0 / plus 1.5 / family 2.0)
- 별 사용: `validate_star_spend` trigger 가 `hori_item`/`foil_card`/`season_costume` 만 허용 (DB 차원 enforce)
- 클라: `features/rewards/` — `useStarBalance` (TanStack Query, 5s staleTime + focus refetch). `StarCounter` 는 게이트된 라우트(Playground·HoriRoom)에서만 노출. AppShell/Vocab 학습 화면 헤더에서는 제거 (MVP simplification, 2026-05-06)
- GameResultScreen: 종료 후 1.2s refetch → "+N ⭐ 저장됨"
- 마지막 페이지 감지: ViewerContainer/PhonicsViewer 가 page_read metadata 에 `totalPages` + `lastPage` 포함

## Phase 4: 호리 꾸미기 (2026-05-01)

- 데이터: R2 `hori-catalog.json` (마스터 풀, 14 stub) + Supabase `hori_inventory` (per-user, RPC `purchase_hori_item` 으로 별 차감 + 인벤토리 추가)
- 5 슬롯: outfit 👕 / accessory 🎩 / background 🏠 / mood 😊 / season 🎅
- 별 사다리: 100★ 옷 / 300★ 액세서리 / 500★ 방 / 800★ 희귀 카드 / 2000★ 시즌 코스튬
- 자산: baseline 이모지 preview, 후속 실 이미지 점진 교체
- 별 사용: `validate_star_spend` trigger 가 `hori_item` source_type 만 허용 (DB 차원 enforce)
- 서버: `services/hori.service.ts` (R2 카탈로그 + 메모리 캐시 5min). routes: `GET /api/hori/catalog`, `POST /api/hori/items` (admin)
- 클라: `features/hori-room/`
  - api: server fetch + Supabase 직접 (inventory select / RPC purchase / equip update)
  - hooks: `useHoriCatalog`, `useHoriInventory`, `usePurchaseHoriItem`, `useEquipHoriItem`
  - `HoriRoomPage` (`/hori-room`)
- 진입점: LibraryPage `🦊 호리 방`
- 장착: 같은 slot 의 다른 아이템 자동 해제 후 새 아이템 장착 (한 slot=하나)

## Phase 5: 호리 놀이터 어휘 게임 (2026-05-01, 1 게임 시범)

- 데이터 흐름: 자녀 활성 시 Supabase RPC `get_sr_word_pool` (30/30/30/10 큐) → 서버 `/api/playground/word-pool/enrich` 가 vocabulary-cache 에서 imageList/sentences/회전 이미지 첨부 → `SrPoolItem[]`. 게스트/RPC 빈 결과 시 `/word-pool/sample` 로 vocabulary-db 무작위 fallback (이미지 보유 단어만)
- 서버:
  - `services/vocabulary-cache.service.ts` — vocabulary-db.json 메모리 캐시 5min + entryMap
  - `services/playground.service.ts` — enrich + sample
  - `utils/vocab-cross-link.ts` — `getAllImagesForWord` (storybook pageImages > key-object > vocabulary > phonics) / `pickImageForReview(entry, n)` (회전) / `getStorybookSentences` / `getTtsForWord`
  - routes: `POST /api/playground/word-pool/enrich`, `GET /api/playground/word-pool/sample`
- 클라: `features/playground/`
  - api: Supabase rpc + server enrich. profileId 가 uuid 아니면 즉시 sample fallback
  - hooks: `useSrWordPool` (TanStack Query, 60s staleTime)
  - `PlaygroundHubPage` (`/playground`): 7 게임 카드 + Daily Word stub + SR 안내
  - `WordMemoryPlayer` (`/playground/word-memory`): 6쌍 그림-단어 매칭, framer-motion flip
- 7 게임 메타 (`PLAYGROUND_GAMES` shared 상수): word-memory(✅) · word-pop · word-fishing · word-run · word-sort-cart · word-garden · word-shopping. 1 출시, 6 stub.
- 진입점: LibraryPage `🎪 놀이터`
- VocabSource 에 `pageImages?: { page, illustrationUrl, style? }[]` 옵셔널 추가
- 후속: 6 게임 점진 구현, vocabulary-db sync 보강 (pageImages 자동 수집), Daily Word 30초 미니 활동

상세: [memory/rewards-system.md](../../../../../memory/rewards-system.md), [memory/hori-room-system.md](../../../../../memory/hori-room-system.md), [memory/playground-system.md](../../../../../memory/playground-system.md)
스펙: [docs/superpowers/specs/2026-04-30-rewards-sr-collection-design.md](../../../../../docs/superpowers/specs/2026-04-30-rewards-sr-collection-design.md) (Collection 부분은 2026-05-06 MVP simplification 으로 폐기 — [docs/superpowers/specs/2026-05-06-mvp-simplification-design.md](../../../../../docs/superpowers/specs/2026-05-06-mvp-simplification-design.md) 참조)
