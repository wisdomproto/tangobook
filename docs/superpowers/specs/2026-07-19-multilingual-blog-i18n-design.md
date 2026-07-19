# 마케팅 블로그 다국어화 (en·vi·zh·th) — 설계 + 실행 런북

> 상태: **준비 완료 / 미실행**. 다른 세션이 이 문서만 보고 처음부터 끝까지 실행할 수 있도록 작성.
> 작성일: 2026-07-19

## 1. 목표 / 범위

- 현재 마케팅 블로그(`self_hosted` 내부 블로그)는 **한국어 전용 196편**. 전부 발행됨.
- 이를 **en·vi·zh·th 4개 언어**로 확장 → 언어당 196편 = **총 784편 신규**.
- 방식: **기존 ko 블로그를 Claude 직접 번역** (신규 집필 아님).
- 발행: 언어 변형 전부 발행 상태로 공개.
- 대상 카테고리: 세계명작 + 자연관찰 + 호리 생활동화 (= 현재 존재하는 블로그 196편 전부).

### 비목표 (YAGNI)
- 언어별 신규 키워드 리서치·재집필 X (직역/현지화 번역만).
- 삽화 재생성 X (ko 삽화 그대로 재사용).
- 네이버/외부 발행 X (내부 self_hosted 블로그 + SEO SSR 만).
- url_slug 현지화 X (ko 슬러그 공유 — about 페이지가 book id 공유하는 것과 동일).

## 2. 현재 구조 (검증된 사실)

| 항목 | 사실 |
|---|---|
| 블로그 소스 | `packages/server/scripts/_data/marketing/blogs/<storybookId>.json` (196개) |
| 소스 스키마 | `{ storybookId, seo_title, primary_keyword, secondary_keywords[], url_slug, meta_description, sections[] }` |
| section 스키마 | `{ text_html(<h2>…), image_prompt, alt, caption }` |
| DB 본문 | `mkt_blog_contents`(글 메타, 1행/블로그) + `mkt_blog_cards`(섹션, card_type='text', content jsonb `{text,url,alt,caption,image_prompt,image_style}`) |
| `mkt_blog_contents` 컬럼 | id, user_id, content_id(FK→mkt_contents), title, seo_title, seo_score, seo_details, naver_keywords, meta_description, url_slug, primary_keyword, secondary_keywords[], search_intent, heading_structure, channel, status, published_url, published_at, created_at, updated_at — **`lang` 컬럼 없음**, unique 제약은 PK(id)뿐 |
| 발행 판정 | `mkt_publish_records`(channel='self_hosted', status='published', **content_id 기준**) — 현재 196 content 전부 발행 |
| 삽화 | ko 카드 content.url 에 실제 책 삽화 URL 채워져 있음(`fill-blog-illustrations.mjs` 산출) |
| 서빙(SSR) | `app.ts`: `GET /blog`, `GET /blog/:slug` → `seo-ssr.service` `renderBlogListSeo`/`renderBlogSeo`, 데이터 `blog-public.service` `listPublishedBlogs()`/`getPublishedBlog(slug)` |
| 서빙(SPA) | `router/index.tsx`: `blog`, `blog/:slug` → `BlogListPage`/`BlogPostPage`, 데이터 `features/blog-public/api` (`/api/blog`, `/api/blog/:slug`) |
| 다국어 선례 | `/:lang/library/:id/about`, `/:lang/guide/:hub` 이미 라이브 (SSR+SPA+sitemap+hreflang). `langPrefix(lang)`=`ko?'':'/'+lang`, `hasAboutLang()` 술어로 hreflang·sitemap 자동 derive |
| sitemap | `generate-sitemap.mjs` — `/api/blog` fetch 해서 blog URL 생성, about 은 언어별 `/${lang}/library/${id}/about` 자동 |

## 3. 아키텍처 결정

### 3.1 데이터 모델 — "같은 content_id 아래 lang 행 추가"

`mkt_blog_contents` 에 `lang` 컬럼을 추가하고, 언어 변형을 **같은 `content_id`** 아래 별도 행으로 저장한다.

```
content_id X ─┬─ blog_content(lang='ko')  ─── cards(ko)
              ├─ blog_content(lang='en')  ─── cards(en, 삽화 url = ko 복사)
              ├─ blog_content(lang='vi')  ─── cards(vi, …)
              ├─ blog_content(lang='zh')  ─── cards(zh, …)
              └─ blog_content(lang='th')  ─── cards(th, …)
```

**핵심 이점 — 발행이 자동**: `mkt_publish_records` 는 `content_id` 기준이라, ko 가 이미 발행돼 있으면 그 content_id 의 **모든 lang 변형이 자동으로 "발행됨"** 판정된다. → 언어 변형용 발행 레코드 삽입 불필요. "한꺼번에 발행"이 공짜로 충족.

**대안(기각)**: (B) `mkt_blog_contents`/`mkt_blog_cards` 에 `translations` jsonb 필드 — 행 수는 적지만 서빙 코드 전부가 flat 필드를 가정하므로 침습적. 스토리북 콘텐츠 i18n 과 유사하나, 여기선 (A) 가 발행 자동 상속 + 기존 쿼리 최소 변경이라 우위.

### 3.2 URL / 서빙

- ko: `/blog`, `/blog/:slug` (기존 그대로, bare)
- 그 외: `/:lang/blog`, `/:lang/blog/:slug` (about 과 동일 규칙)
- slug 는 **언어 공유** (같은 url_slug). 쿼리 = `url_slug + lang`.
- hreflang: 번역 존재하는 언어 상호 링크 + x-default(ko). about 의 `hasAboutLang` 대응 술어 `blogLangs()` 사용.

## 4. 구현 컴포넌트 (파일별)

### C1. 마이그레이션 — `lang` 컬럼 + 유니크 인덱스
새 파일 `supabase/migrations/2026-07-19-blog-lang.sql`:
```sql
alter table mkt_blog_contents add column if not exists lang text not null default 'ko';
-- 같은 (content_id, channel, lang) 중복 방지 (self_hosted 재시드 멱등 보장)
create unique index if not exists mkt_blog_contents_content_channel_lang_uidx
  on mkt_blog_contents (content_id, channel, lang);
```
- 기존 196행은 default 로 자동 `lang='ko'`.
- ⚠️ 적용은 **prod Supabase**(`fxzwigjkbsptvsjraqwa`). MCP `apply_migration` 또는 SQL 에디터.

### C2. 번역 파이프라인 — 신규 스크립트 + 워커
산출 위치: `packages/server/scripts/_data/marketing/blogs/i18n/<lang>/<storybookId>.json`

번역 대상 필드(값만 번역, **HTML 태그·구조 보존**):
- `seo_title`, `meta_description`, `primary_keyword`
- `secondary_keywords[]` (각 항목)
- `sections[].text_html` (태그 유지, 텍스트만), `sections[].alt`, `sections[].caption`
- 번역 안 함: `storybookId`, `url_slug`, `image_prompt`, `image_style`

**실행 = 배치 서브에이전트 워커** (스토리북 번역 파이프라인 패턴 재사용):
- 오케스트레이터가 언어×블로그를 배치로 나눠 워커 서브에이전트에 분배.
- 🔴 워커 프롬프트 필수 문구: **"너는 번역 워커다. Agent 도구 쓰지 말고 직접 Read/Edit(Write)로 파일을 만들어라"** (오케스트레이터 환각 방지 — memory `translation-pipeline-i18n-2026-05-30` 교훈).
- 멱등: 산출 파일 이미 있으면 skip.
- 번역 품질: 유아 학부모 타겟 자연스러운 현지 표현, 한국 고유 요소(전래동화 등)는 의미 전달 우선.
- (선택) 검증 스크립트 `verify-blog-i18n.mjs`: 각 lang/<id>.json 이 ko 와 sections 수 동일 + 필수 필드 존재 + text_html 태그 개수 유사 확인.

### C3. 시드 확장 — `seed-marketing-blogs.mjs`
`--lang <code>` 플래그 추가:
- `code==='ko'`(기본): 기존 동작.
- 그 외: 소스를 `blogs/i18n/<code>/<id>.json` 에서 로드.
  - `upsertBlogContent` 에 `lang: code` 포함, 조회 키를 `(content_id, channel, lang)` 로 변경.
  - `replaceBlogCards`: 번역 텍스트로 채우되 **각 섹션 삽화 url 은 ko 카드에서 sort_order 로 복사** (ko blog_content 의 cards 를 먼저 읽어 url 매핑).
- 사용: `--lang vi --all` (언어별 1회).

### C4. 서빙 데이터 — `blog-public.service.ts`
- `listPublishedBlogs(lang = 'ko')`: `mkt_blog_contents` 쿼리에 `.eq('lang', lang)` 추가. published 판정은 content_id 그대로.
- `getPublishedBlog(slug, lang = 'ko')`: url_slug/content_id 조회에 `.eq('lang', lang)` 추가.
- 신규 `blogLangs(): Promise<string[]>` 또는 특정 blog 의 존재 언어 파생 — hreflang 용. (단순화: 지원 언어 상수 `['ko','en','vi','zh','th']` 중 해당 slug 의 lang 행 존재하는 것.)

### C5. 서빙 SEO(SSR) — `seo-ssr.service.ts` + `app.ts`
- `renderBlogSeo(post, lang='ko')`, `renderBlogListSeo(posts, lang='ko')` 에 lang 인자:
  - `canonical` = `${SITE_URL}${langPrefix(lang)}/blog/...`
  - `inLanguage: [lang]`, 내부 링크(`/blog`, `/library/:id/about`)도 `langPrefix` 적용.
  - `alternatesHtml`: about 과 동일 hreflang 블록 생성 (해당 slug 의 존재 언어 + x-default).
- `app.ts`: about 의 `aboutHandler(langFromPath)` 패턴 복제 →
  - `app.get('/blog', blogListHandler(false))` / `app.get('/:lang/blog', blogListHandler(true))`
  - `app.get('/blog/:slug', blogHandler(false))` / `app.get('/:lang/blog/:slug', blogHandler(true))`
  - lang 미지원/번역없음 → null (기존 404 흐름).

### C6. 서빙 SPA — `router/index.tsx` + `features/blog-public/api`
- 라우트 추가: `:lang/blog`, `:lang/blog/:slug` (about/guide 라우트 옆).
- `BlogListPage`/`BlogPostPage`: `useParams().lang` 읽어 API 에 전달.
- api: `/api/blog?lang=`, `/api/blog/:slug?lang=` (controller/service 에 lang 쿼리 전달). 미지정 시 ko.
- ⚠️ `:lang` catch 라우트(`LangEntry`)보다 정적/구체 라우트가 우선 매칭되는지 확인 (기존 about 이 동작하므로 동일 패턴이면 안전).

### C7. sitemap — `generate-sitemap.mjs`
- 블로그 URL 생성부에서 언어별로 `/api/blog?lang=<code>` fetch → `${SITE_URL}/${lang}/blog/${slug}` 추가 (ko 는 bare 유지).
- 실행 후 `indexnow` 로 신규 URL 제출.

## 5. 실행 런북 (다른 세션이 순서대로)

```bash
# 0) 브랜치
git checkout -b feat/multilingual-blogs

# 1) 마이그레이션 적용 (prod Supabase fxzwigjkbsptvsjraqwa)
#    supabase/migrations/2026-07-19-blog-lang.sql 를 apply_migration 또는 SQL 에디터로 실행

# 2) 코드 구현 (C3~C7) — 시드/서빙/SEO/sitemap. typecheck+테스트.
pnpm typecheck && pnpm --filter server test

# 3) 번역 배치 (C2) — 언어별로. 멱등이라 중단 후 재개 가능.
#    오케스트레이터가 워커 서브에이전트 분배 (워커=직접 Read/Write, Agent 금지).
#    산출: _data/marketing/blogs/i18n/<lang>/<id>.json  (언어당 196개)
node packages/server/scripts/verify-blog-i18n.mjs   # (선택) 무결성 확인

# 4) 시드 — 언어별 1회 (dry-run 먼저)
export SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...
for L in en vi zh th; do
  node packages/server/scripts/seed-marketing-blogs.mjs --lang $L --all --dry-run
  node packages/server/scripts/seed-marketing-blogs.mjs --lang $L --all
done

# 5) 발행 확인 — 별도 작업 불필요 (content_id 발행 레코드가 lang 변형 자동 커버).
#    라이브 검증: curl 로 /vi/blog/<slug> 200 + 번역 본문 확인.

# 6) 배포 후 SEO
pnpm --filter server sitemap
pnpm --filter server indexnow            # 신규 언어 URL 색인 요청
git add -A && git commit && git push
```

## 6. 테스트 / 검증

- 서버 유닛: `blog-public.service` lang 필터, `seo-ssr` blog canonical/hreflang(lang별), sitemap 언어 URL.
- 시드 멱등: 같은 `--lang` 2회 실행 → 행 중복 없음(유니크 인덱스), 삽화 url ko 와 일치.
- 라이브: `/blog/<slug>`(ko) 불변, `/en|vi|zh|th/blog/<slug>` 200 + 번역 본문 + hreflang 상호링크 + 삽화 동일.
- 회귀: ko 블로그 서빙/ sitemap ko URL 불변.

## 7. 리스크 / 미결

- **번역 볼륨(784편)**: 최대 비용/시간 소요 지점. 배치·멱등·재개로 흡수. 언어 우선순위 두려면 en→vi→zh→th 순.
- **HTML 무결성**: 번역 시 `<a href>` 교차링크·태그 훼손 주의 → verify 스크립트로 태그 수 대조.
- **교차 블로그 링크(sanitizeCrossLinks)**: 본문 내 `/blog/<slug>` 링크는 lang 프리픽스 없이 저장돼 있음 — lang 페이지에서 링크 클릭 시 ko 로 감. 1차 범위에선 허용(죽은 링크는 아님). 필요 시 후속에서 lang 프리픽스 주입.
- **published_at 정렬**: 목록 정렬은 content_id 발행시각 공유 → 언어별 목록 순서 ko 와 동일 (문제 없음).
- **slug 충돌**: 언어 공유 slug + lang 필터라 충돌 없음. 단 `getPublishedBlog` 의 content_id 폴백 조회도 lang 필터 필수(안 하면 ko 반환).

## 8. 착수 시 첫 명령

다른 세션은 이 문서를 읽고 → **§5 런북 1)번(마이그레이션)** 부터 시작. 코드(C3~C7)는 소규모라 한 세션에서 구현 가능하고, 번역 배치가 별도 장시간 작업.
