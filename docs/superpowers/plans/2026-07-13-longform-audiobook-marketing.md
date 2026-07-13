# 롱폼 오디오북 마케팅 영상 — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** editor2 동화책의 오디오북을 (그림체 × 언어) 조합별 1080p/30fps 롱폼 영상으로 렌더하고, 제목·캡션·태그 자동생성 + 다국어 자막 + 디자인 썸네일과 함께 마케팅 롱폼 탭(`mkt_youtube_contents`)에 등록·표시한다. 첫 산출물 = 개구리 왕자 × paper-craft × ko 샘플.

**Architecture:** 기존 Remotion `Audiobook` 컴포지션과 `AudiobookService` 렌더/메타/자막 로직을 재사용한다. 그림체 인식은 shared 순수 빌더(`buildStyledAudiobookRenderData`)로만 추가하고 컴포지션은 무변경. 서버 배치 스크립트(`render-book-reels.ts` 미러)가 렌더→R2→메타/자막 생성→`mkt_youtube_contents` upsert 를 수행. 클라이언트 롱폼 탭은 씬 편집기를 걷어내고 영상+메타+자막+썸네일 패널로 교체.

**Tech Stack:** TypeScript, pnpm workspaces, Remotion v4(`@remotion/bundler`/`renderer`), Gemini(TTS/텍스트), Cloudflare R2, Supabase(`mkt_*`), vitest, React 18 + TanStack Query.

**Spec:** `docs/superpowers/specs/2026-07-13-longform-audiobook-marketing-design.md`

---

## File Structure

신규:
- `packages/remotion/src/compositions/LongformThumbnail.tsx` — 16:9 디자인 썸네일 still
- `packages/server/scripts/render-book-audiobooks.ts` — 배치 렌더 파이프라인
- `packages/server/src/services/reel/longform-publish.ts` — 마케팅 등록(upsert) + 순수 조합매칭
- `packages/server/src/utils/youtube-meta-prompt.ts` — 메타 프롬프트 순수 빌더(+ getPageText 이동)
- `supabase/migrations/2026-07-13-youtube-video-settings.sql` — `video_settings jsonb` 컬럼
- `packages/client/src/features/marketing/components/content/LongformPanel.tsx` — 롱폼 탭 패널(YoutubePanel 대체)
- 테스트: `audiobook-props.styled.test.ts`, `youtube-meta-prompt.test.ts`, `longform-publish.test.ts`, `srt-translator.test.ts`

수정:
- `packages/shared/src/utils/audiobook-props.ts` (+ `buildStyledAudiobookRenderData`)
- `packages/server/src/utils/srt-translator.ts` (`LANGUAGE_NAMES` + vi/th)
- `packages/server/src/services/audiobook.service.ts` (메타 프롬프트 헬퍼 호출로 리팩터)
- `packages/remotion/src/Root.tsx` (LongformThumbnail 등록)
- `packages/client/src/features/marketing/types/database.ts` (`YoutubeContent.video_settings`)
- `packages/client/src/features/marketing/components/content/ContentTabs.tsx:247` (YoutubePanel → LongformPanel)

---

## Chunk 1: Shared + 서버 순수 유닛

### Task 1: 스타일 인식 렌더 빌더 (shared)

**Files:**
- Modify: `packages/shared/src/utils/audiobook-props.ts`
- Test: `packages/shared/src/utils/audiobook-props.styled.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
// audiobook-props.styled.test.ts
import { describe, it, expect } from 'vitest';
import { buildStyledAudiobookRenderData } from './audiobook-props';
import type { Storybook } from '../types/storybook';

const book = {
  id: 'b1',
  title: '개구리 왕자',
  coverImage: 'https://x/base-cover.webp',
  languages: ['ko', 'en'],
  pages: [
    { pageNumber: 1, text: '한글1', ttsUrl: 'https://x/ko1.mp3', illustrationUrl: 'https://x/active1.webp',
      translations: { en: { text: 'EN1', ttsUrl: 'https://x/en1.mp3' } } },
    { pageNumber: 2, text: '한글2', ttsUrl: 'https://x/ko2.mp3', illustrationUrl: 'https://x/active2.webp',
      translations: { en: { text: 'EN2', ttsUrl: 'https://x/en2.mp3' } } },
  ],
  styleAssets: {
    'paper-craft': {
      coverImage: 'https://x/pc-cover.webp',
      primaryCoverByLang: { en: 'https://x/pc-en-cover.webp' },
      pageIllustrations: {
        '1': { illustrationUrl: 'https://x/pc1.webp', illustrationHistory: [] },
        '2': { illustrationUrl: 'https://x/pc2.webp', illustrationHistory: [] },
      },
    },
  },
} as unknown as Storybook;

describe('buildStyledAudiobookRenderData', () => {
  it('그림체축=이미지, ko는 base 텍스트/tts', () => {
    const d = buildStyledAudiobookRenderData(book, { artStyle: 'paper-craft', language: 'ko' });
    expect(d.slides.map((s) => s.imageUrl)).toEqual(['https://x/pc1.webp', 'https://x/pc2.webp']);
    expect(d.slides[0].subtitleText).toBe('한글1');
    expect(d.slides[0].ttsUrl).toBe('https://x/ko1.mp3');
    expect(d.aspectRatio).toBe('16:9');
    expect(d.fps).toBe(30);
  });

  it('언어축=translations, 표지=primaryCoverByLang', () => {
    const d = buildStyledAudiobookRenderData(book, { artStyle: 'paper-craft', language: 'en' });
    expect(d.slides[0].subtitleText).toBe('EN1');
    expect(d.slides[0].ttsUrl).toBe('https://x/en1.mp3');
    expect(d.cover?.imageUrl).toBe('https://x/pc-en-cover.webp');
  });

  it('표지 폴백: primaryCoverByLang 없으면 styleAssets.coverImage', () => {
    const d = buildStyledAudiobookRenderData(book, { artStyle: 'paper-craft', language: 'ko' });
    expect(d.cover?.imageUrl).toBe('https://x/pc-cover.webp');
  });

  it('그림체에 페이지 이미지 결측 시 그 페이지 스킵', () => {
    const partial = JSON.parse(JSON.stringify(book));
    delete partial.styleAssets['paper-craft'].pageIllustrations['2'];
    const d = buildStyledAudiobookRenderData(partial, { artStyle: 'paper-craft', language: 'ko' });
    expect(d.slides).toHaveLength(1);
    expect(d.slides[0].imageUrl).toBe('https://x/pc1.webp');
  });

  it('그림체 전체 결측 시 빈 slides (throw 아님 — 호출부가 처리)', () => {
    const d = buildStyledAudiobookRenderData(book, { artStyle: 'nonexistent', language: 'ko' });
    expect(d.slides).toHaveLength(0);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm --filter @tangobook/shared exec vitest run src/utils/audiobook-props.styled.test.ts`
Expected: FAIL — `buildStyledAudiobookRenderData is not exported`

- [ ] **Step 3: 최소 구현 추가** (`audiobook-props.ts` 하단)

```ts
export function buildStyledAudiobookRenderData(
  storybook: Storybook,
  opts: { artStyle: string; language: string }
): AudiobookRenderData {
  const { artStyle, language: lang } = opts;
  const styleAsset = (storybook.styleAssets ?? {})[artStyle] as
    | { pageIllustrations?: Record<string, { illustrationUrl?: string }>;
        primaryCoverByLang?: Record<string, string>;
        coverImage?: string }
    | undefined;
  const pageIllos = styleAsset?.pageIllustrations ?? {};

  const slides: AudiobookSlideData[] = (storybook.pages ?? [])
    .map((page) => {
      const styled = pageIllos[String(page.pageNumber)]?.illustrationUrl;
      if (!styled) return null; // 그 그림체에 이미지 없는 페이지 스킵
      const isTr = lang !== 'ko' && page.translations?.[lang];
      const text = isTr ? page.translations![lang].text : page.text;
      const ttsUrl = isTr ? page.translations![lang].ttsUrl : page.ttsUrl;
      return { imageUrl: styled, ttsUrl, ttsDuration: undefined, subtitleText: text };
    })
    .filter((s): s is AudiobookSlideData => s !== null);

  const coverImageUrl =
    styleAsset?.primaryCoverByLang?.[lang] || styleAsset?.coverImage || storybook.coverImage;
  const cover = coverImageUrl
    ? { imageUrl: coverImageUrl, title: storybook.title || '', duration: 3, showTitle: true }
    : undefined;

  return {
    slides,
    aspectRatio: '16:9',
    cover,
    bgmUrl: storybook.backgroundMusicUrl,
    bgmVolume: 30,
    subtitleStyle: { fontSize: 24, color: '#ffffff', backgroundColor: '#00000080', position: 'bottom', wordsPerGroup: 2 },
    enableParticles: true,
    fps: 30,
  };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm --filter @tangobook/shared exec vitest run src/utils/audiobook-props.styled.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: 커밋**

```bash
git add packages/shared/src/utils/audiobook-props.ts packages/shared/src/utils/audiobook-props.styled.test.ts
git commit -m "feat(shared): add buildStyledAudiobookRenderData (artStyle-aware audiobook render data)"
```

---

### Task 2: SRT 번역 언어명 vi/th 추가

**Files:**
- Modify: `packages/server/src/utils/srt-translator.ts`
- Test: `packages/server/src/utils/srt-translator.test.ts`

- [ ] **Step 1: 실패 테스트 작성** — `LANGUAGE_NAMES` 를 export 하고 vi/th 검증

```ts
import { describe, it, expect } from 'vitest';
import { LANGUAGE_NAMES } from './srt-translator';

describe('LANGUAGE_NAMES', () => {
  it('vi/th 포함 (다국어 자막 대상)', () => {
    expect(LANGUAGE_NAMES.vi).toBe('Vietnamese');
    expect(LANGUAGE_NAMES.th).toBe('Thai');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm --filter @tangobook/server exec vitest run src/utils/srt-translator.test.ts`
Expected: FAIL — `LANGUAGE_NAMES` 미export

- [ ] **Step 3: 구현** — `const LANGUAGE_NAMES` 를 `export const` 로 바꾸고 항목 추가

```ts
export const LANGUAGE_NAMES: Record<string, string> = {
  ko: 'Korean', en: 'English', ja: 'Japanese', zh: 'Chinese',
  es: 'Spanish', fr: 'French', de: 'German',
  vi: 'Vietnamese', th: 'Thai', ms: 'Malay', id: 'Indonesian',
};
```

- [ ] **Step 4: 통과 확인** — 같은 vitest run → PASS

- [ ] **Step 5: 커밋**

```bash
git add packages/server/src/utils/srt-translator.ts packages/server/src/utils/srt-translator.test.ts
git commit -m "fix(srt): add vi/th (and ms/id) to translateSrt LANGUAGE_NAMES"
```

---

### Task 3: 메타 프롬프트 순수 빌더 추출

**Files:**
- Create: `packages/server/src/utils/youtube-meta-prompt.ts`
- Modify: `packages/server/src/services/audiobook.service.ts` (해당 프롬프트 조립을 헬퍼 호출로 대체)
- Test: `packages/server/src/utils/youtube-meta-prompt.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
import { describe, it, expect } from 'vitest';
import { getPageText, buildYoutubeMetaPrompt } from './youtube-meta-prompt';

const book = {
  title: '개구리 왕자', category: '세계명작',
  pages: [{ pageNumber: 1, text: '한글', translations: { en: { text: 'English page' } } }],
} as any;

describe('youtube-meta-prompt', () => {
  it('getPageText: 비-ko는 translations 우선', () => {
    expect(getPageText(book.pages[0], 'en')).toBe('English page');
    expect(getPageText(book.pages[0], 'ko')).toBe('한글');
  });
  it('buildYoutubeMetaPrompt: 언어 지시 + 제목 포함', () => {
    const p = buildYoutubeMetaPrompt(book, { language: 'en', aspectRatio: '16:9', userPrompt: 'kids audiobook' });
    expect(p).toContain('개구리 왕자');
    expect(p).toContain('English'); // "content is in English"
    expect(p).toContain('kids audiobook');
  });
});
```

- [ ] **Step 2: 실패 확인** → FAIL (module 없음)

- [ ] **Step 3: 구현** — `audiobook.service.ts` 의 `getPageText`(라인 47) 와 `generateYouTubeMeta` 내부 `storybookInfo`/`geminiPrompt` 조립부를 그대로 이 파일로 이동. 시그니처:

```ts
import type { Page, Storybook } from '@tangobook/shared';

export function getPageText(page: Page, lang: string): string {
  if (lang !== 'ko' && page.translations?.[lang]?.text) return page.translations[lang].text;
  return page.text;
}

export function buildYoutubeMetaPrompt(
  storybook: Storybook,
  opts: { language: string; aspectRatio: string; userPrompt: string }
): string {
  const { language: lang, aspectRatio, userPrompt } = opts;
  const pages = storybook.pages ?? [];
  const storybookInfo = [ /* audiobook.service.ts 기존 storybookInfo 조립 그대로 */ ].filter(Boolean).join('\n');
  return [ /* 기존 geminiPrompt 배열 그대로, prompt→userPrompt 로 */ ].join('\n');
}
```

그 다음 `audiobook.service.ts.generateYouTubeMeta` 는:
```ts
const geminiPrompt = buildYoutubeMetaPrompt(storybook, { language: lang, aspectRatio: project.aspectRatio, userPrompt: prompt });
```
로 축약하고, 로컬 `getPageText` 정의는 삭제 후 `import { getPageText } from '../utils/youtube-meta-prompt.js'`. JSON 파싱/반환(`privacy` 포함)은 **그대로 유지**.

- [ ] **Step 4: 통과 + 회귀 확인**

Run: `pnpm --filter @tangobook/server exec vitest run src/utils/youtube-meta-prompt.test.ts`
Expected: PASS
Run: `pnpm --filter server typecheck` (또는 `pnpm --filter @tangobook/server exec tsc --noEmit`)
Expected: 에러 없음

- [ ] **Step 5: 커밋**

```bash
git add packages/server/src/utils/youtube-meta-prompt.ts packages/server/src/utils/youtube-meta-prompt.test.ts packages/server/src/services/audiobook.service.ts
git commit -m "refactor(audiobook): extract buildYoutubeMetaPrompt/getPageText as pure helpers"
```

---

### Task 4: 마케팅 행 조합매칭 (순수)

**Files:**
- Create: `packages/server/src/services/reel/longform-publish.ts` (이 태스크는 순수 `matchYoutubeRow` 만; upsert 는 Task 7)
- Test: `packages/server/src/services/reel/longform-publish.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
import { describe, it, expect } from 'vitest';
import { matchYoutubeRow } from './longform-publish';

const rows = [
  { id: 'r1', video_settings: { artStyle: 'paper-craft', language: 'ko' } },
  { id: 'r2', video_settings: { artStyle: 'pixar-3d', language: 'ko' } },
  { id: 'r3', video_settings: null },
];

describe('matchYoutubeRow', () => {
  it('artStyle+language 동일 행 반환', () => {
    expect(matchYoutubeRow(rows, 'paper-craft', 'ko')?.id).toBe('r1');
  });
  it('없으면 null', () => {
    expect(matchYoutubeRow(rows, 'paper-craft', 'en')).toBeNull();
    expect(matchYoutubeRow(rows, 'collage', 'ko')).toBeNull();
  });
});
```

- [ ] **Step 2: 실패 확인** → FAIL

- [ ] **Step 3: 구현** (`longform-publish.ts` 시작부)

```ts
export interface YoutubeRowLike { id: string; video_settings: Record<string, any> | null }

export function matchYoutubeRow<T extends YoutubeRowLike>(
  rows: T[], artStyle: string, language: string
): T | null {
  return rows.find(
    (r) => r.video_settings?.artStyle === artStyle && r.video_settings?.language === language
  ) ?? null;
}
```

- [ ] **Step 4: 통과 확인** → PASS

- [ ] **Step 5: 커밋**

```bash
git add packages/server/src/services/reel/longform-publish.ts packages/server/src/services/reel/longform-publish.test.ts
git commit -m "feat(longform): matchYoutubeRow pure combo matcher for one-row-per-(style,lang)"
```

---

## Chunk 2: 서버 인프라 (마이그레이션·썸네일·등록·파이프라인)

### Task 5: DB 마이그레이션 — `video_settings jsonb`

**Files:**
- Create: `supabase/migrations/2026-07-13-youtube-video-settings.sql`
- Modify: `packages/client/src/features/marketing/types/database.ts` (`YoutubeContent`)

- [ ] **Step 1: 마이그레이션 파일 작성**

```sql
-- 롱폼 오디오북 영상: (artStyle, language, captions) 등을 mkt_youtube_contents 에 JSONB 로 저장.
ALTER TABLE mkt_youtube_contents
  ADD COLUMN IF NOT EXISTS video_settings jsonb;
```

- [ ] **Step 2: 타입 추가** — `YoutubeContent` 에 `video_settings: Record<string, unknown> | null;`

- [ ] **Step 3: 라이브 DB 적용** — Supabase MCP `apply_migration`(name=`youtube_video_settings`) 또는 SQL 실행. 적용 후 `list_tables` 로 컬럼 확인.

- [ ] **Step 4: 커밋**

```bash
git add supabase/migrations/2026-07-13-youtube-video-settings.sql packages/client/src/features/marketing/types/database.ts
git commit -m "feat(db): add video_settings jsonb to mkt_youtube_contents"
```

---

### Task 6: 디자인 썸네일 컴포지션 (Remotion still)

**Files:**
- Create: `packages/remotion/src/compositions/LongformThumbnail.tsx`
- Modify: `packages/remotion/src/Root.tsx`

- [ ] **Step 1: 컴포지션 작성** — props schema(zod): `{ title, heroImageUrl, lang, styleLabel? }`. 1280×720. 배경 `<Img heroImageUrl>` (🔴 한글 URL `encodeURI`) cover + 반투명 그라디언트 패널 + 제목 큰 글자(언어별 폰트 = `@tangobook/shared` `cover-fonts` 참조, 없으면 시스템 폴백) + 우하단 "탱고북" 워드마크. `AdThumbnail.tsx` 를 레퍼런스로.

```tsx
export const LT_W = 1280, LT_H = 720;
export const LongformThumbSchema = z.object({
  title: z.string(), heroImageUrl: z.string(), lang: z.string(), styleLabel: z.string().optional(),
});
export const LongformThumbnail: React.FC<z.infer<typeof LongformThumbSchema>> = ({ title, heroImageUrl }) => { /* ... */ };
```

- [ ] **Step 2: Root 등록**

```tsx
<Composition id="LongformThumbnail" component={LongformThumbnail} schema={LongformThumbSchema}
  durationInFrames={1} fps={30} width={LT_W} height={LT_H}
  defaultProps={{ title: '개구리 왕자', heroImageUrl: 'https://placehold.co/1280x720', lang: 'ko' }} />
```

- [ ] **Step 3: 스튜디오/타입 확인**

Run: `pnpm --filter @tangobook/remotion exec tsc --noEmit`
Expected: 에러 없음. (시각 확인은 Task 9 dry-run 에서 still 렌더로.)

- [ ] **Step 4: 커밋**

```bash
git add packages/remotion/src/compositions/LongformThumbnail.tsx packages/remotion/src/Root.tsx
git commit -m "feat(remotion): LongformThumbnail 16:9 designed thumbnail still"
```

---

### Task 7: 마케팅 등록 upsert 서비스

**Files:**
- Modify: `packages/server/src/services/reel/longform-publish.ts` (Task 4 파일에 upsert 추가)

- [ ] **Step 1: 구현** — `reel-publish.ts` 의 `resolveMarketingTarget`(memo=`storybook:<id>`)·`resolveOwnerUserId` 만 import(둘 다 export 됨). 🔴 `requireAdmin` 은 reel-publish 에서 **비-export(private)** 이므로 import 불가 → `getSupabaseAdmin()` + null 체크를 인라인(reel-publish 의 requireAdmin 과 동일 패턴). 함수:

```ts
import { getSupabaseAdmin } from '../../providers/supabase-admin.provider.js';
import { resolveMarketingTarget, resolveOwnerUserId } from './reel-publish.js';

export async function connectLongformToMarketing(input: {
  bookId: string; artStyle: string; language: string; aspectRatio: string;
  videoUrl: string; thumbnailUrl: string;
  meta: { title: string; description: string; tags: string[]; categoryId: string };
  captions: Record<string, string>; ownerUserId: string;
}): Promise<'updated' | 'inserted' | 'skipped'> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('Supabase admin 미설정 (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY 필요)');
  const target = await resolveMarketingTarget(input.bookId);
  if (!target) return 'skipped';
  const { data: rows } = await sb.from('mkt_youtube_contents')
    .select('id, video_settings').eq('content_id', target.contentId);
  const existing = matchYoutubeRow(rows ?? [], input.artStyle, input.language);
  const now = new Date().toISOString();
  const payload = {
    video_url: input.videoUrl, thumbnail_url: input.thumbnailUrl,
    video_title: input.meta.title, video_description: input.meta.description,
    video_tags: input.meta.tags, video_category: input.meta.categoryId,
    target_duration: 'long', status: 'draft',
    video_settings: { bookId: input.bookId, artStyle: input.artStyle, language: input.language,
                      aspectRatio: input.aspectRatio, captions: input.captions },
    updated_at: now,
  };
  if (existing) {
    const { error } = await sb.from('mkt_youtube_contents').update(payload).eq('id', existing.id);
    if (error) throw new Error(`youtube 행 갱신 실패: ${error.message}`);
    return 'updated';
  }
  const { error } = await sb.from('mkt_youtube_contents').insert({
    ...payload, content_id: target.contentId, user_id: input.ownerUserId, created_at: now,
  });
  if (error) throw new Error(`youtube 행 생성 실패: ${error.message}`);
  return 'inserted';
}
```

- [ ] **Step 2: 타입/빌드 확인** — `pnpm --filter @tangobook/server exec tsc --noEmit` → 에러 없음. (매칭 로직 테스트는 Task 4 에서 이미 커버.)

- [ ] **Step 3: 커밋**

```bash
git add packages/server/src/services/reel/longform-publish.ts
git commit -m "feat(longform): connectLongformToMarketing upsert into mkt_youtube_contents"
```

---

### Task 8: 배치 렌더 파이프라인

**Files:**
- Create: `packages/server/scripts/render-book-audiobooks.ts`

- [ ] **Step 1: 스크립트 작성** — `render-book-reels.ts` 를 골격으로. 인자 `--book --style --lang [--dry-run] [--force] [--owner-email]`. 절차:
  1. `fetchStorybook(bookId)` (reel-targets 재사용) 
  2. `buildStyledAudiobookRenderData(book, { artStyle, lang })` → renderData
  3. TTS/BGM 길이 probe (audiobook.service `probeTtsDurations` 로직 인라인 또는 `getAudioDuration` 사용)
  4. bundle(`entry.ts`) → `selectComposition('Audiobook', renderData, browserOpts)` → `renderMedia({ codec:'h264', imageFormat:'png', scale:1.5, crf:16, timeoutInMilliseconds:600000, concurrency:1, chromiumOptions:{gl:'angle',headless:true} })` → faststart(ffmpeg)
  5. `selectComposition('LongformThumbnail', { title, heroImageUrl, lang })` → `renderStill` → png (heroImageUrl = `styleAssets[style].pageIllustrations['1'].illustrationUrl` ?? cleanCoverImage ?? cover)
  6. `--dry-run` → 로컬 mp4/png 경로 출력 후 종료
  7. R2 업로드: `mkt/{projectId}/longform/{bookId}-{style}-{lang}-{ts}.mp4`, `...-thumb-...png` (projectId = `resolveMarketingTarget(bookId).projectId`; 없으면 등록 skip 이므로 경고 후 로컬만)
  8. 메타: `buildYoutubeMetaPrompt(book,{language,aspectRatio:'16:9',userPrompt:DEFAULT})` → `generateTextWithGemini` → JSON 파싱. 🔴 파싱은 `audiobook.service.generateYouTubeMeta` 와 동일 견고성 유지: ```` ```json ```` 펜스 제거 + **폴백**(`title ?? book.title`, `categoryId ?? '27'`, `tags` 배열 아니면 `[]`, `privacy` 무시). 악성 JSON 에 빈 제목 행 삽입 방지.
  9. 자막: base = `generateSrt(renderData)`; 타깃 = `book.languages` 전체 → `translateSrt` → `{lang:srt}` (base 언어는 그대로)
  10. `--force` 아니고 기존 행에 video_url 있으면 렌더 스킵(멱등)
  11. `connectLongformToMarketing({...})`

- [ ] **Step 2: 타입 확인** — `pnpm --filter @tangobook/server exec tsc --noEmit` → 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add packages/server/scripts/render-book-audiobooks.ts
git commit -m "feat(longform): render-book-audiobooks batch pipeline (render+thumb+meta+captions+register)"
```

---

### Task 9: 샘플 실행 + 검증 (개구리 왕자 × paper-craft × ko)

**Files:** (실행만, 코드 변경 없음)

- [ ] **Step 1: dry-run** — 로컬 서버(`pnpm --filter server dev`) 없이 스크립트 단독 실행:

```bash
pnpm --filter @tangobook/server exec tsx scripts/render-book-audiobooks.ts \
  --book=1772009873865 --style=paper-craft --lang=ko --dry-run
```
Expected: 로컬 mp4 + 썸네일 png 경로 출력, R2/Supabase 쓰기 없음.

- [ ] **Step 2: 산출물 육안 확인** — 생성된 mp4 재생(해상도 1920×1080, 자막/타이밍), 썸네일 png 확인. 문제 있으면 해당 Task 로 돌아가 수정.

- [ ] **Step 3: 실제 실행** — dry-run 제거:

```bash
pnpm --filter @tangobook/server exec tsx scripts/render-book-audiobooks.ts \
  --book=1772009873865 --style=paper-craft --lang=ko
```
Expected: R2 업로드 + 메타 자동생성 + ko·en·vi·zh·th SRT + `mkt_youtube_contents` `inserted` 로그.

- [ ] **Step 4: DB 확인** — Supabase 에서 해당 content 의 youtube 행: `video_url`, `thumbnail_url`, `video_title`, `video_settings.captions` 5개 언어 존재 확인.

---

## Chunk 3: 클라이언트 롱폼 패널

### Task 10: fetchContentGraph video_settings 노출

**Files:**
- Modify: `packages/client/src/features/marketing/api/queries.ts` (youtube contents select 에 `video_settings` 포함 — `select('*')` 면 자동, 명시 select 면 컬럼 추가)

- [ ] **Step 1:** `queries.ts` 의 youtube contents 쿼리가 `select('*')` 인지 확인. 명시 컬럼이면 `video_settings` 추가. `select('*')` 면 Task 5 타입 추가로 충분 — 변경 없음(그 경우 이 태스크는 no-op, 다음으로).

- [ ] **Step 2: 커밋 (변경 있을 때만)**

```bash
git add packages/client/src/features/marketing/api/queries.ts
git commit -m "feat(marketing): expose youtube video_settings in content graph"
```

---

### Task 11: LongformPanel 컴포넌트

**Files:**
- Create: `packages/client/src/features/marketing/components/content/LongformPanel.tsx`

- [ ] **Step 1: 구현** — props `{ content: Content; project: Project }` (YoutubePanel 과 동일 시그니처). 데이터: `fetchContentGraph` 캐시의 `youtubeContents`(배열). 파생:
  - 존재하는 `(video_settings.artStyle, video_settings.language)` 조합 목록 → **그림체 서브탭** (언어는 상단 언어 탭 = 부모의 selected language 사용)
  - 현재 (style, lang) 셀 = `matchYoutubeRow`(클라 재구현 or 인라인)로 행 선택
  - 표시: `<video src={video_url}>` (없으면 빈 상태 안내), 썸네일 미리보기(`thumbnail_url`), 메타 편집 폼(`video_title`/`video_description`/`video_tags` → `useUpdateYoutubeContent` 디바운스 저장), 자막 뱃지(`video_settings.captions` 언어별 유무 + 복사/다운로드)
  - 씬 편집기/AI 대본/카드 관련 요소 없음
  - reels 패널의 빈 상태·`<video>` 스타일 재사용

- [ ] **Step 2: 타입 확인** — `pnpm --filter client exec tsc --noEmit` → 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add packages/client/src/features/marketing/components/content/LongformPanel.tsx
git commit -m "feat(marketing): LongformPanel — video + auto meta + multilang captions"
```

---

### Task 12: 롱폼 탭 배선 + 브라우저 검증

**Files:**
- Modify: `packages/client/src/features/marketing/components/content/ContentTabs.tsx:247`

- [ ] **Step 1:** import 교체 + 렌더 교체 — `<YoutubePanel content={content} project={project} />` → `<LongformPanel content={content} project={project} />`. `YoutubePanel` import 제거. (씬 편집기 파일 `YoutubePanel.tsx`/`YoutubeCardItem.tsx` 등은 미사용 보존 — 삭제 안 함.)

- [ ] **Step 2: 타입 + 빌드**

Run: `pnpm --filter client exec tsc --noEmit`
Expected: 에러 없음 (미사용 import 정리)

- [ ] **Step 3: 브라우저 검증** — @preview_tools 절차: `preview_start`(client dev) → `/marketing` → 개구리 왕자 콘텐츠 → 롱폼 탭. 확인: 영상 재생, 제목/캡션/태그 표시, 자막 언어 뱃지 5개, 썸네일. `read_console_messages` 에러 없음. 스크린샷 첨부.

- [ ] **Step 4: 커밋**

```bash
git add packages/client/src/features/marketing/components/content/ContentTabs.tsx
git commit -m "feat(marketing): swap 롱폼 tab to LongformPanel (remove scene editor)"
```

---

## 완료 기준

- [ ] 순수 유닛 테스트 전부 통과 (Task 1·2·3·4)
- [ ] 샘플 mp4 = 1920×1080/30fps, 자막·타이밍 정상 (Task 9)
- [ ] `mkt_youtube_contents` 에 개구리왕자 paper-craft/ko 행 + 5언어 자막 (Task 9)
- [ ] 롱폼 탭에서 영상·메타·자막·썸네일 표시, 씬 편집기 사라짐 (Task 12)
- [ ] 기존 오디오북 탭 메타/자막 생성 회귀 없음 (Task 3 typecheck + 기존 동작)
