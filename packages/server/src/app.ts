import path from 'path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'url';
import express from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { corsMiddleware } from './middleware/cors.middleware.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { downloadFromR2 } from './providers/r2.provider.js';
import storybookRoutes from './routes/storybook.routes.js';
import imageRoutes from './routes/image.routes.js';
import ttsRoutes from './routes/tts.routes.js';
import translationRoutes from './routes/translation.routes.js';
import quizRoutes from './routes/quiz.routes.js';
import audiobookRoutes from './routes/audiobook.routes.js';
import phonicsRoutes from './routes/phonics.routes.js';
import gameRoutes from './routes/game.routes.js';
import phonicsLibraryRoutes from './routes/phonics-library.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import systemSoundsRoutes from './routes/system-sounds.routes.js';
import characterLibraryRoutes from './routes/character-library.routes.js';
import artStyleLibraryRoutes from './routes/art-style-library.routes.js';
import vocabularyDbRoutes from './routes/vocabulary-db.routes.js';
import marketingRoutes from './routes/marketing.routes.js';
import promptPresetRoutes from './routes/prompt-preset.routes.js';
import longformRoutes from './routes/longform.routes.js';
import youtubePresetRoutes from './routes/youtube-preset.routes.js';
import { speakingRouter } from './routes/speaking.routes.js';
import bookV2MigrationRoutes from './routes/book-v2-migration.routes.js';
import bookV2Routes from './routes/book-v2.routes.js';
import horiRoutes from './routes/hori.routes.js';
import playgroundRoutes from './routes/playground.routes.js';
import vocabularyUnitRoutes from './routes/vocabulary-unit.routes.js';
import libraryConfigRoutes from './routes/library-config.routes.js';
import vocabOverridesRoutes from './routes/vocab-overrides.routes.js';
import styleGenreMapRoutes from './routes/style-genre-map.routes.js';
import letterStrokeLibraryRoutes from './routes/letter-stroke-library.routes.js';
import koreanJamoStrokeLibraryRoutes from './routes/korean-jamo-stroke-library.routes.js';
import mktRoutes from './routes/mkt.routes.js';
import { metaAuthRouter } from './routes/meta-auth.routes.js';
import blogPublicRoutes from './routes/blog-public.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import opsRoutes from './routes/ops.routes.js';
import comicFeedbackRoutes from './routes/comic-feedback.routes.js';
import comicAssetsRoutes from './routes/comic-assets.routes.js';
import saenghwalStatusRoutes from './routes/saenghwal-status.routes.js';
import saenghwalMemoRoutes from './routes/saenghwal-memo.routes.js';
import changjakTextRoutes from './routes/changjak-text.routes.js';
import contentApprovalRoutes from './routes/content-approval.routes.js';
import contentPipelineRoutes from './routes/content-pipeline.routes.js';

export function createApp() {
  const app = express();

  // 미들웨어
  app.use(corsMiddleware);

  // ⚠️ COOP/COEP(credentialless) 헤더는 설정하지 않는다 — cross-origin iframe(토스 결제창·YouTube 등)을
  // "연결을 거부했습니다"로 차단한다. 클라 SharedArrayBuffer(ffmpeg.wasm) 사용처가 없어 불필요.
  // (vite.config.ts dev 서버에서도 동일 이유로 제거됨. 다시 추가하면 배포 결제창이 깨진다.)

  /**
   * 보안 헤더 — 감사에서 **하나도 없는 것**으로 나왔다(2026-08-27 실측: `/`·`/admin`·`/ops`·
   * `/members`·`/marketing` 전부 `Server`·`x-powered-by` 말고는 없음).
   *
   * 🔴 **CSP 는 일부러 안 넣는다.** 이 사이트는 jsdelivr(폰트)·Google Fonts·gtag·
   *    메타 픽셀·Supabase·R2·토스를 부른다 — 목록을 대충 적으면 결제창이나 폰트가 조용히 죽는다.
   *    위 COOP/COEP 주석과 같은 종류의 사고다. CSP 는 Report-Only 로 한참 재 본 뒤에 켤 것.
   * ⚠️ `X-Frame-Options: SAMEORIGIN` 은 **남이 우리를 iframe 에 넣는 것**만 막는다.
   *    우리가 토스·유튜브를 넣는 건 영향 없다(그 반대였으면 결제창이 깨진다).
   * ⚠️ HSTS 에 `includeSubDomains`·`preload` 는 안 붙였다 — 서브도메인 전수를 모르는 채
   *    붙이면 되돌릴 수 없다(preload 목록은 제거가 몇 달 걸린다).
   */
  app.use((_req, res, next) => {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    next();
  });

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // 헬스 체크
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 디버그 로그 조회 (프로덕션에서 원격 디버깅용)
  app.get('/api/debug/logs', (_req, res) => {
    import('./utils/log-buffer.js').then(({ getLogBuffer }) => {
      const lines = parseInt(_req.query.lines as string) || 200;
      res.json({ success: true, data: getLogBuffer(lines) });
    });
  });

  // API 라우터
  app.use('/api/storybooks', storybookRoutes);
  app.use('/api/images', imageRoutes);
  app.use('/api/tts', ttsRoutes);
  app.use('/api/translation', translationRoutes);
  app.use('/api/quiz', quizRoutes);
  app.use('/api/audiobooks', audiobookRoutes);
  app.use('/api/phonics', phonicsRoutes);
  app.use('/api/games', gameRoutes);
  app.use('/api/phonics-library', phonicsLibraryRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/system-sounds', systemSoundsRoutes);
  app.use('/api/character-library', characterLibraryRoutes);
  app.use('/api/art-style-library', artStyleLibraryRoutes);
  app.use('/api/vocabulary-db', vocabularyDbRoutes);
  app.use('/api/marketing', marketingRoutes);
  app.use('/api/prompt-presets', promptPresetRoutes);
  app.use('/api/longform', longformRoutes);
  app.use('/api/youtube-presets', youtubePresetRoutes);
  app.use('/api/speaking', speakingRouter);
  app.use('/api/admin/book-v2', bookV2MigrationRoutes);
  app.use('/api/v2/books', bookV2Routes);
  app.use('/api/hori', horiRoutes);
  app.use('/api/playground', playgroundRoutes);
  app.use('/api/vocabulary-units', vocabularyUnitRoutes);
  app.use('/api/library-config', libraryConfigRoutes);
  app.use('/api/vocab-overrides', vocabOverridesRoutes);
  app.use('/api/style-genre-map', styleGenreMapRoutes);
  app.use('/api/letter-stroke-library', letterStrokeLibraryRoutes);
  app.use('/api/korean-jamo-stroke-library', koreanJamoStrokeLibraryRoutes);
  // Marketing Phase 0+ — NEW namespace (never collides with /api/marketing)
  app.use('/api/mkt', mktRoutes);
  // Meta OAuth (top-level — FB top-level redirect + callback + data-deletion)
  app.use('/api/auth/meta', metaAuthRouter);
  // 공개 블로그 (발행된 self_hosted 내부 블로그 외부 노출)
  app.use('/api/blog', blogPublicRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/ops', opsRoutes);
  app.use('/api/comic-feedback', comicFeedbackRoutes);
  app.use('/api/comic-assets', comicAssetsRoutes);
  app.use('/api/saenghwal-status', saenghwalStatusRoutes);
  app.use('/api/saenghwal-memo', saenghwalMemoRoutes);
  app.use('/api/changjak-text', changjakTextRoutes);
  app.use('/api/content-approval', contentApprovalRoutes);
  app.use('/api/content-pipeline', contentPipelineRoutes);

  // R2 프록시 — pub-xxx.r2.dev CORS 미지원 우회
  // GET /api/r2-proxy?key=storybooks/xxx/scene.mp4
  app.get('/api/r2-proxy', async (req, res, next) => {
    try {
      const key = req.query.key as string;
      if (!key) {
        res.status(400).json({ error: 'key required' });
        return;
      }
      const buffer = await downloadFromR2(key);
      const ext = key.split('.').pop()?.toLowerCase();
      const contentTypes: Record<string, string> = {
        mp4: 'video/mp4',
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        png: 'image/png',
        jpg: 'image/jpeg',
      };
      res.setHeader('Content-Type', contentTypes[ext ?? ''] ?? 'application/octet-stream');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(buffer);
    } catch (err) {
      next(err);
    }
  });

  // 프로덕션: 클라이언트 정적 파일 서빙 (개발 모드에서는 Vite가 처리)
  if (process.env.NODE_ENV === 'production') {
    const clientDist = path.join(process.cwd(), 'packages/client/dist');

    // 비-www → www 301 (중복 호스트 SEO 신호 제거 — sitemap/canonical 은 www 기준)
    app.use((req, res, next) => {
      const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || '';
      if (host === 'tangobook.co.kr') {
        res.redirect(301, `https://www.tangobook.co.kr${req.originalUrl}`);
        return;
      }
      next();
    });

    // 서비스워커는 no-cache 로 — 브라우저가 매번 최신 sw.js 를 확인해 업데이트가 전파되게.
    app.get('/sw.js', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(clientDist, 'sw.js'));
    });

    /**
     * 광고 랜딩 옛 주소 → 루트 `/` **301**.
     *
     * 🔴 **도착지가 `/intro` 에서 `/` 로 바뀌었다**(2026-08-21 사용자: "이거 메인 페이지로
     *    연결하자") — 소개 페이지가 곧 루트라, 같은 내용을 `/intro` 로도 두면 색인이 갈린다
     *    (GSC 「중복 페이지」로 이미 두 번 겪었다). `/intro` 자신도 여기서 흡수한다.
     * 🔴 클라이언트 `<Navigate>` 로만 두면 **크롤러는 200 + 빈 셸**을 본다 — 색인이 두 주소로
     *    갈리고, `/hangul`·`/intro` 는 이미 사이트맵·블로그·광고에 나가 있다. 서버에서 301 로 모은다.
     * 🔴 라우터에도 같은 이동이 남아 있다(앱 안에서 눌렀을 때) — **둘 다 필요**하다.
     */
    for (const old of ['/hangul', '/english', '/intro']) {
      app.get(old, (_req, res) => res.redirect(301, '/'));
    }

    // SEO SSR-lite — about/블로그/허브 페이지에 meta/JSON-LD/본문 주입 (네이버 Yeti 등
    // JS 미실행 크롤러 대응). 실패 시 SPA 폴백. 상세 → seo-ssr.service.ts.
    let cachedIndexHtml: string | null = null;
    /**
     * 🔴 build 가 `{ redirect }` 를 주면 301 — 그 언어 변형이 없다는 뜻이다.
     *
     * 예전엔 null 만 있었고 그때 `next()` 로 SPA 셸을 200 으로 내보냈는데, catch-all 이
     * 그 셸에 **self-canonical** 을 박아서 `/en/library/:id/about` 같은 URL 이 "고유 페이지"라고
     * 주장했다. 내용은 모든 셸과 같으니 구글은 "중복 — 사용자와 다른 표준 선택"으로 떨궜다.
     * 번역이 없으면 ko 원본으로 신호를 모으는 게 맞다.
     */
    const sendSeo = async (
      res: express.Response,
      next: express.NextFunction,
      build: () => Promise<
        import('./services/seo-ssr.service.js').AboutSeo | null | { redirect: string }
      >
    ) => {
      try {
        const seo = await build();
        if (!seo) {
          next(); // SPA 가 404 UI 처리
          return;
        }
        if ('redirect' in seo) {
          res.redirect(301, seo.redirect);
          return;
        }
        const { injectAboutSeo } = await import('./services/seo-ssr.service.js');
        if (!cachedIndexHtml) {
          const { readFile } = await import('node:fs/promises');
          cachedIndexHtml = await readFile(path.join(clientDist, 'index.html'), 'utf-8');
        }
        // 🔴 SSR 경로에도 Link 를 붙인다 — 블로그에서 오는 사람이 도착하는 게 바로 이 책 페이지다.
        if (cachedIndexLink === null) cachedIndexLink = linkHeaderOf(cachedIndexHtml);
        if (cachedIndexLink) res.setHeader('Link', cachedIndexLink);
        res
          .setHeader('Cache-Control', 'public, max-age=300')
          .type('html')
          .send(injectAboutSeo(cachedIndexHtml, seo));
      } catch (err) {
        // 🔴 조용히 삼키면 "SSR 이 되는 줄 알았는데 안 되는" 상태를 아무도 모른다.
        // 폴백은 유지하되(SEO 주입이 서비스를 죽이면 안 된다) 이유는 남긴다.
        console.warn(`[seo-ssr] ${res.req.originalUrl} 폴백:`, (err as Error).message);
        next();
      }
    };

    // 언어별 about — ko 는 bare, 그 외 /:lang 프리픽스. 번역(가이드) 있는 언어만 렌더.
    const aboutHandler =
      (langFromPath: boolean) =>
      (req: express.Request, res: express.Response, next: express.NextFunction) =>
        sendSeo(res, next, async () => {
          const { renderAboutSeo, hasAboutLang, missingLangVariant } =
            await import('./services/seo-ssr.service.js');
          const { StorybookService } = await import('./services/storybook.service.js');
          const lang = langFromPath ? String(req.params.lang) : 'ko';
          const storybook = await StorybookService.getById(req.params.id as string);
          if (!storybook) return null;
          // 책은 있는데 그 언어 번역만 없다 → ko 원본으로 301 (ko about 은 언제나 있다).
          if (!hasAboutLang(storybook, lang))
            return missingLangVariant(lang, `/library/${storybook.id}/about`, true);
          return renderAboutSeo(storybook, lang);
        });
    app.get('/library/:id/about', aboutHandler(false));
    app.get('/:lang/library/:id/about', aboutHandler(true));
    // 책 상세(앱) 페이지 — 자체 SEO 서피스가 아니라 /about 으로 신호를 통합한다.
    // aboutHandler 재사용 시 canonical 이 /library/:id/about 로 주입돼(renderAboutSeo)
    // 크롤러가 이 URL 을 /about 의 중복으로 인식하고 색인을 /about 에 몰아준다.
    // 존재하지 않는 id 는 null → next() → catch-all(self-canonical) 폴백.
    app.get('/library/:id', aboutHandler(false));

    // 언어별 블로그 — ko 는 bare, 그 외 /:lang 프리픽스 (about 과 동일 규칙).
    const blogListHandler =
      (langFromPath: boolean) =>
      (req: express.Request, res: express.Response, next: express.NextFunction) =>
        sendSeo(res, next, async () => {
          const { renderBlogListSeo } = await import('./services/seo-ssr.service.js');
          const { listPublishedBlogs, blogListLangs } =
            await import('./services/mkt/blog-public.service.js');
          const lang = langFromPath ? String(req.params.lang) : 'ko';
          const posts = await listPublishedBlogs(lang);
          if (langFromPath && posts.length === 0) return null; // 번역 없는 언어 → SPA 404
          return renderBlogListSeo(posts, lang, await blogListLangs());
        });
    app.get('/blog', blogListHandler(false));
    app.get('/:lang/blog', blogListHandler(true));

    const blogHandler =
      (langFromPath: boolean) =>
      (req: express.Request, res: express.Response, next: express.NextFunction) =>
        sendSeo(res, next, async () => {
          const { renderBlogSeo } = await import('./services/seo-ssr.service.js');
          const { getPublishedBlog, blogLangs } =
            await import('./services/mkt/blog-public.service.js');
          const lang = langFromPath ? String(req.params.lang) : 'ko';
          const slug = String(req.params.slug);
          const post = await getPublishedBlog(slug, lang);
          if (!post) {
            const { missingLangVariant } = await import('./services/seo-ssr.service.js');
            const koExists = lang !== 'ko' && Boolean(await getPublishedBlog(slug, 'ko'));
            return missingLangVariant(lang, `/blog/${encodeURIComponent(slug)}`, koExists);
          }
          return renderBlogSeo(post, lang, await blogLangs(post.slug));
        });
    app.get('/blog/:slug', blogHandler(false));
    app.get('/:lang/blog/:slug', blogHandler(true));

    const hubHandler =
      (langFromPath: boolean) =>
      (req: express.Request, res: express.Response, next: express.NextFunction) =>
        sendSeo(res, next, async () => {
          const { renderHubSeo, HUBS, hubLangs, missingLangVariant } =
            await import('./services/seo-ssr.service.js');
          const hub = HUBS[req.params.hub as keyof typeof HUBS];
          const lang = langFromPath ? String(req.params.lang) : 'ko';
          if (!hub) return null;
          if (!hubLangs().includes(lang))
            return missingLangVariant(lang, `/guide/${req.params.hub}`, true);
          const { StorybookService } = await import('./services/storybook.service.js');
          // sitemap 과 동일한 공개 기준: variant(__L\d) 제외 + storybook 타입 + 공개
          const books = (await StorybookService.list()).filter(
            (b) =>
              !/__L\d+$/.test(b.id) &&
              (b.type ?? 'storybook') === 'storybook' &&
              b.isPublic !== false
          );
          return renderHubSeo(hub, books, lang);
        });
    app.get('/guide/:hub', hubHandler(false));
    app.get('/:lang/guide/:hub', hubHandler(true));

    /**
     * 파닉스 단원 SEO — 학습 화면과 **다른 주소**다.
     *
     * 🔴 감사에서 나온 제일 큰 구멍: 홈 제목이 「한글 파닉스 32단원 · 영어 파닉스 39단원」인데
     *    sitemap 1,882개 중 파닉스 URL 이 **1개**였고 그 페이지 본문은 133자 내비 껍데기였다.
     *    동화책의 `/library/:id/about` 에 해당하는 서피스를 파닉스에도 판다(71단원 + 트랙 2).
     * 🔴 **학습 라우트(`/library/phonics/:track`)는 손대지 않는다** — 프리렌더 대상이라
     *    정적 파일로 나가고, 아이 화면이라 글이 원래 적은 게 맞다.
     * ⚠️ 세그먼트 수가 달라(`/library/:id/about` 은 3, 이건 4~5) 기존 라우트와 안 부딪힌다.
     */
    app.get('/library/phonics/:track/about', (req, res, next) =>
      sendSeo(res, next, async () => {
        const { renderPhonicsTrackSeo, isPhonicsTrack } =
          await import('./services/seo-phonics.service.js');
        const track = String(req.params.track);
        return isPhonicsTrack(track) ? renderPhonicsTrackSeo(track) : null;
      })
    );
    app.get('/library/phonics/:track/:unitId/about', (req, res, next) =>
      sendSeo(res, next, async () => {
        const { renderPhonicsUnitSeo, isPhonicsTrack } =
          await import('./services/seo-phonics.service.js');
        const track = String(req.params.track);
        return isPhonicsTrack(track)
          ? renderPhonicsUnitSeo(track, String(req.params.unitId))
          : null;
      })
    );

    // 언어별 진입 링크(/en·/vi·/zh·/th·/ko) — 소셜 공유 미리보기 OG 를 그 언어로 주입.
    // SPA(LangEntry)가 브라우저에서 그 언어 설정 후 라이브러리로 리다이렉트한다.
    for (const lc of ['en', 'vi', 'zh', 'th', 'ko']) {
      app.get(`/${lc}`, (_req, res, next) =>
        sendSeo(res, next, async () => {
          const { renderLandingSeo } = await import('./services/seo-ssr.service.js');
          return renderLandingSeo(lc);
        })
      );
    }

    // 🔴 저작도구 문서(기획서·회차 HTML·core.js·index/refs json)는 캐시하지 않는다.
    //    파일명이 고정이라 해시 무효화가 없고, 응답에 Cache-Control 이 없으면 Cloudflare 가
    //    Browser Cache TTL(4시간)을 붙인다 — 고쳐서 배포해도 4시간 동안 옛 화면이 뜬다.
    //    실제로 붙여넣기 버그를 고친 뒤에도 캐시된 옛 core.js 가 돌아 「아직도 실패」로 보였다.
    //    내부 저작 화면이라 트래픽이 없고, no-cache 는 ETag 재검증이라 대역폭도 거의 안 쓴다.
    const SERIES_AUTHORING = /^\/[a-z][\w-]*-(plan\.html|core\.js|index\.json|\d{2}\.html)$/;
    const AUTHORING =
      /^\/(changjak|saenghwal|jeonrae|yuchiwon|tamheom|hangeul-tree|abc-tree)[\w-]*\.(html|js|json)$/;
    app.use((req, res, next) => {
      // 🔴 창작동화 **시리즈** 저작 파일은 이름을 나열하면 안 된다 — 위 AUTHORING 목록에
      //    시리즈 16개가 통째로 빠져 있었고(kota·pongi·coco·…), 그 탓에 `kota-index.json` 이
      //    7일 캐시로 나가 회차를 새로 써도 사이드바에 안 떴다(2026-08-31 실측 max-age=604800).
      //    시리즈가 늘 때마다 목록을 고치는 대신 **생성기가 만드는 파일 모양**으로 잡는다 — 472개 일치.
      if (AUTHORING.test(req.path) || SERIES_AUTHORING.test(req.path)) {
        res.setHeader('Cache-Control', 'no-cache');
      }
      next();
    });
    /**
     * 프리렌더된 HTML 우선 서빙 — **첫 화면이 번들보다 먼저 그려지게 한다.**
     *
     * 🔴 CSR 라우트는 1MB 짜리 entry 번들이 도착해야 비로소 첫 글자가 나온다
     *    (모바일 4G·cold cache 실측 FCP 10.5s, 같은 조건 SSR 책 페이지는 1.7s).
     *    `scripts/prerender.mjs` 가 빌드 때 구워 둔 `dist/<route>/index.html` 을 그대로 보내면
     *    번들 도착 전에 화면이 뜬다. React 는 마운트하며 그 DOM 을 갈아끼운다(빈 화면 → 내용이
     *    아니라 내용 → 내용이라 깜빡임이 아니다).
     * 🔴 **`express.static` 보다 먼저** 둔다 — static 은 `/library` 를 디렉터리로 보고
     *    `/library/` 로 301 을 쏜다(왕복 하나 + URL 변경).
     * 🔴 매니페스트가 없으면(=프리렌더 안 돌았으면) 이 블록은 통째로 비활성 — 예전 동작 그대로다.
     */
    const prerendered: Record<string, string> = {};
    try {
      const routes: string[] = JSON.parse(
        readFileSync(path.join(clientDist, 'prerendered.json'), 'utf-8')
      );
      for (const r of routes) {
        // 🔴 루트만 산출물 자리가 다르다 — `dist/index.html` 은 **SPA 폴백**이라 프리렌더가
        //    덮지 않고 `dist/home/index.html` 에 쓴다(`prerender.mjs`). 여기서 그 자리를
        //    모르면 `/` 는 구워 놓고도 빈 셸을 내보낸다(2026-08-21 실측 11.6KB).
        const dir = r === '/' ? 'home' : r.replace(/^\//, '');
        prerendered[r] = readFileSync(path.join(clientDist, dir, 'index.html'), 'utf-8');
      }
      console.log(`[prerender] ${routes.length}개 라우트 정적 HTML 서빙: ${routes.join(' ')}`);
    } catch {
      /* 프리렌더 산출물 없음 — SPA 폴백 */
    }
    /**
     * `Link: rel=preload` 헤더 — **Cloudflare Early Hints(103)의 재료**.
     *
     * 🔴 Early Hints 는 대시보드에서 켜는 것만으로는 아무 일도 안 한다. Cloudflare 는 **원본 응답에
     *    담긴 `Link` 헤더를 모아** 다음 방문자에게 103 으로 먼저 보낸다. 헤더가 없으면 보낼 게 없다.
     * 🔴 이게 노리는 것 = **왕복 하나를 통째로 없애기**. 지금은 HTML 을 받아 파싱해야 CSS 를
     *    발견하고, 그제서야 또 한 번 왕복한다(실측: HTML 첫 바이트 0.7s → CSS 도착 2.7s).
     *    103 을 먼저 받으면 브라우저가 HTML 을 기다리는 동안 CSS·JS 를 받기 시작한다.
     * 자산 목록은 HTML 에서 뽑는다 — 빌드마다 해시가 바뀌므로 적어 두면 곧 썩는다.
     */
    const linkHeaderOf = (html: string): string =>
      [
        ...new Set(
          [...html.matchAll(/(?:href|src)="(\/assets\/[^"]+\.(?:js|css))"/g)].map((m) => m[1])
        ),
      ]
        /**
         * 🔴 `crossorigin` 필수. vite 는 `<script type="module" crossorigin>` 로 내보내는데,
         *    preload 힌트에 이게 없으면 **CORS 모드가 달라 캐시가 안 맞아 같은 파일을 두 번 받는다**
         *    (1MB 번들을 두 번 = 고치려던 것보다 나빠진다). 스타일시트도 `crossorigin` 이라 동일.
         * ⚠️ Cloudflare Early Hints 는 `preload` 와 `preconnect` 만 103 으로 보낸다 —
         *    `modulepreload` 로 적으면 무시된다.
         */
        .map(
          (h) => `<${h}>; rel=preload; as=${h.endsWith('.css') ? 'style' : 'script'}; crossorigin`
        )
        .join(', ');

    const prerenderedLink: Record<string, string> = {};
    for (const [r, html] of Object.entries(prerendered)) prerenderedLink[r] = linkHeaderOf(html);
    let cachedIndexLink: string | null = null;

    app.use((req, res, next) => {
      const html = req.method === 'GET' ? prerendered[req.path] : undefined;
      if (!html) return next();
      // 🔴 해시 붙은 자산을 참조하므로 캐시하면 배포 후 깨진 자산을 가리킬 수 있다 → 매번 재검증.
      res.setHeader('Cache-Control', 'no-cache');
      if (prerenderedLink[req.path]) res.setHeader('Link', prerenderedLink[req.path]);
      res.type('html').send(html);
    });

    /**
     * 🔴 **해시 붙은 자산은 영구 캐시**(2026-08-04). `/assets/index-Cwgs879A.js` 처럼 파일명에
     *    내용 해시가 있어 **내용이 바뀌면 이름이 바뀐다** — 즉 재검증할 이유가 원리상 없다.
     *    그런데 우리가 헤더를 안 줘서 Cloudflare 가 기본 4시간을 붙였고, 실측 `cf-cache-status`
     *    가 `REVALIDATED` 였다 = 엣지에 있어도 **매번 원본까지 왕복**(요청당 ~700ms).
     *    `immutable` 을 주면 HIT 로 바뀌어 그 왕복이 사라진다. 첫 페인트가 CSS 왕복을
     *    기다리고 있으므로(실측 CSS 도착 2.7s) 여기가 지금 가장 큰 남은 병목이다.
     * ⚠️ `/assets` 밖(폰트·이미지·저작 문서)에는 주지 않는다 — 그쪽은 이름이 고정이라
     *    영구 캐시하면 고쳐도 안 바뀐다(위 AUTHORING no-cache 주석과 같은 이유).
     */
    app.use(
      '/assets',
      express.static(path.join(clientDist, 'assets'), { immutable: true, maxAge: '1y' })
    );
    /**
     * 🔴 **`public/` 자산에 캐시 수명을 준다**(2026-08-27). 기본값이라 여태
     *    `Cache-Control: public, max-age=0` 이 나갔고(실측 `/sounds/ui/tap.mp3`), 그래서
     *    재방문마다 전부 재검증했다(PSI 「Use efficient cache lifetimes」 254KB).
     *    효과음 풀이 같은 파일을 4번 받던 것도 이 헤더가 거들었다.
     * 🔴 **`immutable` 도 1년도 아니다** — 이 파일들은 해시 이름이 아니라서(`/logo/...`,
     *    `/icons/...`) 영구 캐시하면 고쳐도 안 바뀐다. 해시가 붙는 `/assets` 만 1년이다.
     * 🔴 **자주 바뀌고 크롤러가 읽는 것은 빼야 한다** — `sitemap.xml` 을 7일 캐시하면
     *    새 책을 올려도 구글이 옛 목록을 본다. `sw.js` 는 위에서 이미 no-cache 다.
     */
    app.use(
      express.static(clientDist, {
        maxAge: '7d',
        setHeaders: (res, filePath) => {
          /* 🔴 저작·진단용 HTML 도 no-cache 다(2026-09-01). 7일 캐시면 고쳐서 배포해도
           *    폰이 **옛 빌드를 계속 본다** — 그걸 모르고 「아직도 안 고쳐졌다」와
           *    「고쳤는데 왜 그대로냐」를 서로 다른 원인으로 쫓게 된다(실측: 레고 판
           *    인식을 고친 뒤에도 폰만 옛 동작이었고, 주소에 `?v=N` 을 붙여야 바뀌었다).
           *    해시 이름이 아니라서 캐시가 길면 못 갱신되는 건 아이콘·로고와 같은 사정인데,
           *    이쪽은 **매일 고치는 파일**이라 수명을 아예 안 준다. */
          if (
            /(index\.html|robots\.txt|sitemap\.xml|llms\.txt|manifest\.json)$/i.test(filePath) ||
            /[\\/](tango-board-3d|letter-fill-demo|vocabulary-table-ko|vocabulary-master|key-object-editor)\.html$/i.test(
              filePath
            )
          ) {
            res.setHeader('Cache-Control', 'no-cache');
          }
        },
      })
    );
    // catch-all — SPA index.html. 단, 정적 index.html 의 canonical 은 홈 고정이라
    // 비-홈 라우트가 전부 "홈 복사본"으로 색인에서 빠진다. 비-홈 경로는 canonical 을
    // 자기 자신으로 재작성해 서빙(selfCanonicalizeHtml). 실패 시 원본 index.html 폴백.
    app.get('/{*path}', async (req, res) => {
      // 🔴 빌드 자산(/assets/*)이 없으면 **404** 다 — SPA 폴백으로 index.html 을 돌려주면
      //    `200 + text/html` 이 나가고, 브라우저는 그걸 JS 모듈로 파싱하려다
      //    "Failed to fetch dynamically imported module" 로 죽는다(2026-08-05 실측: 배포 후
      //    옛 탭이 사라진 청크를 요청한 경우). 정직한 404 여야 클라의 자동 새로고침 폴백도 돈다.
      if (req.path.startsWith('/assets/')) {
        res.status(404).type('text/plain').send('Not Found');
        return;
      }
      /**
       * 🔴 **파일처럼 생긴 경로는 SPA 라우트가 아니다 — 200 이 아니라 404 다**(2026-08-27).
       *    여기까지 왔다는 건 `express.static` 이 그 파일을 못 찾았다는 뜻인데, 여태 SPA 셸을
       *    200 으로 돌려줬다. 감사에서 `wp-sitemap.xml`·`sitemap_index.xml` 이 **200 + HTML**로
       *    나온 게 그 증상이다(sitemap 파서는 "DOCTYPE is not allowed"로 실패). 존재하지 않는
       *    주소가 전부 성공으로 보이면 구글이 죽은 URL 을 떨굴 신호가 없다.
       * 🔴 **확장자 있는 경로만** 이렇게 한다 — SPA 라우트(`/library/123/about`)에는
       *    확장자가 없다. 라우트 목록을 손으로 적으면 새 라우트를 낼 때마다 404 를 만든다.
       */
      try {
        const { selfCanonicalizeHtml, looksLikeMissingFile } =
          await import('./services/seo-ssr.service.js');
        if (looksLikeMissingFile(req.path)) {
          res.status(404).type('text/plain').send('Not Found');
          return;
        }
        if (!cachedIndexHtml) {
          const { readFile } = await import('node:fs/promises');
          cachedIndexHtml = await readFile(path.join(clientDist, 'index.html'), 'utf-8');
        }
        if (cachedIndexLink === null) cachedIndexLink = linkHeaderOf(cachedIndexHtml);
        if (cachedIndexLink) res.setHeader('Link', cachedIndexLink);
        res.type('html').send(selfCanonicalizeHtml(cachedIndexHtml, req.path));
      } catch {
        res.sendFile(path.join(clientDist, 'index.html'));
      }
    });
  }

  // 에러 핸들러 (catch-all 뒤에 등록)
  app.use(errorMiddleware);

  return app;
}
