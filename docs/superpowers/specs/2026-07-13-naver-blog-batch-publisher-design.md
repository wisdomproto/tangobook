# 네이버 블로그 이미지 포함 배치 발행기 — 설계

- 날짜: 2026-07-13
- 상태: 구현 중 (Chunk 1 진행)
- 관련: `features/blog`, `features/marketing`, `packages/server/scripts/render-book-reels.ts`(패턴 참조)

> ## ⚠️ 2026-07-14 소스 변경 (구현 중 실측으로 확정)
> 최초 설계는 발행 소스를 R2 `books/{bid}/marketing/blog/{postId}.json`(`BlogPostV2`)로 가정했으나, **실제 완비된 블로그 152개는 Supabase 마케팅 시스템**(`mkt_blog_contents` + `mkt_blog_cards`)에 있다(각 8섹션 = 1,216 카드, 이미지 720장, 전부 `status='draft'`·미발행). 따라서 **발행 소스를 Supabase 로 변경**한다.
> - **소스 테이블**: `mkt_blog_contents`(발행 단위: id·content_id·title·primary_keyword·secondary_keywords·status) + `mkt_blog_cards`(섹션: `card_type='text'`, `content` jsonb `{ text: HTML, url: 이미지, caption, alt }`, `sort_order`).
> - **본문이 이미 HTML**(`<h2><p><strong>`) → 주입 블록에 `html` kind 추가. heading/text 분리 불필요.
> - **이력 매핑**: `book_id = mkt_blog_contents.content_id`, `post_id = mkt_blog_contents.id`, `language = 'ko'` → §5.2 이력 테이블 스키마 **그대로 재사용**.
> - **유닛 경계 재조정**: `blog-source.ts`(Supabase I/O → `BlogSource`) → `blog-html.ts`(순수 `BlogSource → InjectionPlan`). §4·§5·§10 의 `BlogPostV2` 표현은 이 `BlogSource`(Supabase)로 대체해 읽는다.

## 1. 목적 (왜)

마케팅 시스템의 블로그 글(Supabase `mkt_blog_contents`/`mkt_blog_cards`, 위 소스 변경 참조)을 **네이버 블로그로 옮겨 발행**한다. 텍스트는 복붙으로 해결되지만 **이미지를 일일이 다운로드→업로드하는 수작업이 진짜 페인포인트**다. 이 도구의 핵심 가치는 **이미지 업로드 자동화**이며, 텍스트는 그와 함께 실려 들어간다.

규모: 공개 블로그 글 152개를 **대량·지속 발행**. 신간이 나올 때마다 새 글을 계속 밀어낸다.

## 2. 비목표 (YAGNI — 만들지 않는 것)

- **무인 서버 스케줄러 X** — 네이버는 로그인 IP·기기 지문·CAPTCHA를 검사한다. 무인 발행은 캡차가 뜨는 순간 멈추고 세션이 깨진다. 사람이 개입 가능한 로컬 실행으로 간다.
- **블로그 글 생성 X** — 글은 이미 `features/blog`가 만들어 R2에 저장돼 있다. 이 도구는 발행만 한다.
- **평문 ID/PW 자동 로그인 X** — 계정 탈취·자동화 탐지 위험. 사람이 1회 로그인한 세션을 재사용한다.
- **양방향 동기화/수정 반영 X** — R2 글이 바뀌어도 이미 발행된 네이버 글을 자동 갱신하지 않는다(1차 범위 밖).

## 3. 접근 결정 (브레인스토밍 결론)

| 항목 | 결정 | 이유 |
|---|---|---|
| 자동화 수준 | 반자동(세션 재사용) | 캡차·세션 무효화 회피, 계정 안전 |
| 실행 위치 | 로컬 배치 스크립트 | 로그인·발행 같은 IP → 세션 유지. 캡차 시 사람 개입 |
| 발행 소스 | `BlogPostV2`(책 blog 글) | 이미 완성된 콘텐츠 |
| 본문 주입 | 하이브리드(텍스트+이미지 파일 업로드) | 152개 무인 배치엔 클립보드보다 파일 input 주입이 안정적 |
| 최종 발행 게이트 | 기본 임시저장, `--confirm` 시 발행 | 152개 실수 일괄 발행 사고 방지 |
| 발행 이력 | Supabase 전용 테이블 신설 | 멱등성 + 마케팅 보드 노출 |

## 4. 아키텍처

로컬에서 실행하는 CLI 하나 + 순수 로직/부수효과 분리.

**브라우저 라이브러리**: repo 표준인 **puppeteer `^25.0.4`** 사용(현재 `packages/client`에만 존재, playwright 없음). `packages/server`에 동일 버전 puppeteer를 devDependency로 추가한다(서버의 R2·Supabase 유틸을 재사용해야 하므로 스크립트를 server에 두고, client의 .mjs 스크립트로 분리하지 않는다). ⚠️ Playwright의 `context.storageState()`는 puppeteer에 없다 — 세션 재사용은 §6처럼 쿠키 + localStorage 수동 추출/복원으로 구현한다.

```
packages/server/scripts/publish-naver-blog.ts   # 로컬 배치 CLI (엔트리)
  --login                # ① headed 브라우저로 사람이 1회 로그인(캡차 포함) → 세션 저장
  --book <bid>           # 특정 책만
  --post <postId>        # 특정 글만
  --limit N              # N개만
  --lang <code>          # 언어 필터(기본 ko)
  --dry-run              # 에디터 주입까지만, 저장/발행 안 함
  --confirm              # 실제 '발행'(기본은 임시저장까지만)
  --headed               # 브라우저 눈으로 보며 디버그(기본 headless)
  --delay-min N          # 글 사이 최소 지연 초(기본 8)
  --delay-max N          # 글 사이 최대 지연 초(기본 20)

packages/server/src/services/naver/
  naver-session.ts       # 세션 로컬 파일 로드/저장 (naver-session.json, gitignore)
                         #   = puppeteer page.cookies() + localStorage(evaluate) 를 직렬화/복원
  blog-html.ts           # 순수함수: BlogPostV2 → { title, blocks[] } (섹션 → 주입 블록) — TDD
  naver-blog-post.ts     # puppeteer: 글쓰기 페이지 열고 blocks[] 를 에디터에 주입하는 시퀀스
  naver-publications.store.ts  # Supabase 이력 CRUD (멱등 조회/기록)
```

### 4.1 유닛 경계

- **`blog-html.ts`** (순수) — 입력 `BlogPostV2`, 출력 주입 지시서(`{ title, blocks: Array<TextBlock | ImageBlock> }`). 부수효과 없음 → 단위 테스트 100%. "무엇을 넣을지"를 결정.
- **`naver-blog-post.ts`** (부수효과) — 주입 지시서를 받아 puppeteer page를 조작. "어떻게 넣을지". 셀렉터·타이밍이 여기 격리돼, 네이버 UI 변경 시 이 파일만 손댄다.
- **`naver-session.ts`** — 로그인 세션의 저장/로드/만료 판정만. puppeteer 컨텍스트에서 쿠키(`page.cookies()`)와 필요한 localStorage 키를 뽑아 JSON으로 저장하고, 새 실행 시 `page.setCookie(...)` + `page.evaluate(localStorage.setItem)`로 복원한다.
- **`naver-publications.store.ts`** — 발행 이력 조회(멱등)·기록. Supabase 접근 격리.
- **`publish-naver-blog.ts`** — 위 넷을 오케스트레이션 + CLI flag 파싱. 얇게 유지.

## 5. 데이터

### 5.1 소스 (읽기)
`books/{bid}/marketing/blog/{postId}.json` = `BlogPostV2`:
```ts
{ id, language, title, summary, tags[],
  sections: Array<{ id, header, text, imageUrl?, imageCaption? }> }
```
섹션 배열이 곧 발행 순서. 각 섹션 = 소제목 + 본문 + (선택)이미지 + 캡션. `imageUrl`은 R2 URL → 다운로드하여 임시 파일로 저장 후 에디터 파일 input에 주입. 섹션 `id`는 이미지 임시파일 이름·섹션별 로깅의 안정 키로 쓴다.

### 5.2 이력 (쓰기) — 신규 테이블
`mkt_publish_records`는 `content_id NOT NULL → mkt_contents(id)` FK라 book blog 글에 맞지 않는다. 오염 없이 전용 테이블을 신설한다.

```sql
create table mkt_naver_blog_publications (
  id            uuid primary key default gen_random_uuid(),
  book_id       text not null,
  post_id       text not null,
  language      text not null default 'ko',
  status        text not null default 'draft'
                check (status in ('draft','published','failed')),
  naver_post_url text,
  error_message text,
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (book_id, post_id, language)
);
```
- 서비스롤(로컬 스크립트)만 접근 → RLS는 최소(운영자 조회용 정책만, 서비스롤은 우회).
- `updated_at`은 앱(스토어 계층)이 write 시 명시적으로 세팅한다(별도 트리거 없음).
- 마케팅 발행 보드가 이 테이블을 읽어 네이버 발행 현황을 표시(“marketing 통합”의 실체).

### 5.3 멱등성 (mode-aware)
발행 전 `(book_id, post_id, language)` 조회. **skip 판정은 실행 모드에 따라 다르다**:
- **publish 모드**(`--confirm`): `status='published'` 존재 시 skip. `failed`/`draft`/없음 → 진행.
- **draft 모드**(기본, 임시저장): `status`가 `draft` **또는** `published` 존재 시 skip. `failed`/없음 → 진행.

→ draft 모드에서 draft도 skip하는 이유: 재실행 시 **네이버에 중복 초안이 쌓이는 것을 막기 위해서다.** 152개를 여러 번 나눠 돌리거나(권장) 24h 세션 만료로 끊겨 재실행하는 것이 일반 케이스라 필수. `failed`는 어느 모드든 재시도한다.

`--dry-run`(dry 모드): 이력 조회·기록 모두 안 함(검증 전용). 저장/발행도 안 함.
성공 기록: draft 모드→`status='draft'`, publish 모드→`status='published' + naver_post_url`.

## 6. 세션 관리
- `--login`: `--headed` puppeteer로 네이버 로그인 페이지를 띄운다. 사람이 직접 로그인(2FA·캡차 포함). 로그인 완료 감지 후 `page.cookies()` + 필요한 localStorage 키를 뽑아 `naver-session.json`(gitignore)에 JSON으로 저장.
- 발행 실행: 새 puppeteer 페이지에 저장된 쿠키(`page.setCookie(...)`)와 localStorage를 복원한 뒤 글쓰기 페이지로 이동. 로그인 페이지로 튕기면 = 세션 만료 → 명확한 에러로 `--login` 재실행 안내.
- 로그인·발행이 같은 로컬 머신·IP라 네이버 관점에서 동일 세션으로 유지된다.

## 7. 이미지 주입 전략 (유일한 실측 리스크)
스마트에디터 ONE은 iframe + 동적 셀렉터라 **실제 DOM을 실측하기 전엔 셀렉터를 확정할 수 없다.** 152개 무인 배치 기준 우선순위:

1. **파일 input 직접 주입** (1순위) — 에디터의 이미지 업로드 `<input type=file>` 핸들에 `elementHandle.uploadFile(localPath)`. 클립보드(전역 자원·포커스 의존)보다 배치에 안정적.
2. **클립보드 리치 붙여넣기** (2순위 폴백) — 텍스트+이미지 HTML을 클립보드에 넣고 Ctrl+V. 1이 막히면 검토.

두 경로 모두 PoC에서 실측 후 확정.

## 8. 단계 (구현 순서)

### Phase 0 — PoC 스파이크 (선행 필수, 폐기 가능 코드)
목표: **가정 3개를 실측으로 검증**한다. 이게 실패하면 나머지 설계가 헛일이므로 반드시 먼저 한다.
1. `--login`으로 세션 저장 → 재실행 시 세션이 유지되는가?
2. 글쓰기 페이지에서 제목·본문 텍스트가 프로그래매틱하게 들어가는가?
3. 이미지 1장이 파일 input 주입으로 에디터에 올라가는가(네이버 서버 업로드 완료)?
결과물: 셀렉터 맵 + 되는 이미지 주입 경로 확정. 임시저장까지만, 발행 안 함.

### Phase 1 — 본 구현
PoC 셀렉터를 `naver-blog-post.ts`로 정착 + `blog-html.ts`(TDD) + `naver-publications.store.ts`(이력·멱등) + CLI flag 전체 + Supabase 마이그레이션.

## 9. 에러 처리
- 세션 만료 → 즉시 중단 + `--login` 재실행 안내(재시도 무의미).
- 캡차/이상 화면 감지 → 스크린샷 저장 + 해당 글 skip, 배치는 계속(다음 글).
- 이미지 다운로드 실패(R2 404) → 그 이미지 건너뛰고 본문은 발행, 이력에 경고.
- 셀렉터 미발견 → 스크린샷 + 명확한 에러(어느 단계인지), 해당 글 failed 기록.
- 배치는 **한 글 실패가 전체를 멈추지 않음**. 실패는 이력에 `failed`로 남겨 재실행 시 재시도.

## 10. 테스트
- `blog-html.ts` — 순수함수 단위 테스트(TDD): 섹션→블록 변환, 이미지 없는 섹션, 빈 본문, 캡션 처리, 태그 매핑.
- `naver-session.ts` — 만료 판정 로직 단위 테스트(파일 mock).
- `naver-publications.store.ts` — 멱등 조회 로직(Supabase mock 또는 통합).
- `naver-blog-post.ts` — DOM 조작이라 자동 테스트 어려움 → PoC 실측 + `--headed --dry-run` 수동 검증으로 대체.

## 11. 리스크 & 완화
- **네이버 UI 변경으로 셀렉터 파손** → 셀렉터를 `naver-blog-post.ts` 한 곳에 격리, 파손 시 이 파일만 수정. PoC 스크린샷 로그로 조기 발견.
- **약관·계정 정지** → 하루 소량·사람 패턴 유지. `--confirm` 없이 임시저장 기본. 대량 발행 시 **글 사이 기본 지연 8~20초 랜덤 지터**(`--delay-min`/`--delay-max`로 조정), 1회 실행당 발행 상한 권장(예 `--limit`). 한 번에 152개를 몰아 발행하지 않는다.
- **세션 24h 만료** → 만료 감지 + 재로그인 안내. 배치 중 만료 시 남은 글은 다음 실행에서 멱등 skip 덕에 이어서.
- **캡차가 headless에서 발생** → `--headed`로 사람이 풀 수 있게. 배치 도중 캡차면 해당 글 skip + 스크린샷.

## 12. 열린 질문 (PoC에서 해소)
- 스마트에디터 ONE의 본문/이미지 셀렉터 실제 구조?
- 파일 input 주입 vs 클립보드 붙여넣기 중 무엇이 되는가?
- 임시저장 후 재편집 URL을 이력에 저장 가능한가(멱등 강화)?
- 이미지 캡션을 에디터에 넣을 수 있는가, 넣을 가치가 있는가?
