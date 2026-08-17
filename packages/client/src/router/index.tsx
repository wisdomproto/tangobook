import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet, useParams } from 'react-router-dom';
import { PhonicsUnitGate } from '../features/access/components/PhonicsUnitGate';
import { ErrorBoundary } from '@/design-system';
/**
 * 🔴 **저작도구 레이아웃은 lazy 다**(2026-08-04). `AppLayout`/`AppLayoutV2` 는 이름만 레이아웃이지
 *    실제로는 저작도구 전체(`EditorContent`·`EditorPanelV2`·`VocabularyUnitEditor`·편집 사이드바)를
 *    끌고 온다. 라우터 맨 위에서 정적 import 라 **아이가 동화책 한 권 열 때도 통째로 받았다**
 *    (dnd-kit 이 첫 화면 번들에 있던 것도 이 경로다). `/editor` `/editor2` 는 우리만 쓴다.
 */
const AppLayout = lazy(() =>
  import('../components/AppLayout').then((m) => ({ default: m.AppLayout }))
);
const AppLayoutV2 = lazy(() =>
  import('../components/AppLayoutV2').then((m) => ({ default: m.AppLayoutV2 }))
);
import { AppShell } from '../components/AppShell';
/**
 * 🔴 **마케팅 스튜디오는 lazy 다**(2026-08-04). 운영자 전용 화면인데 즉시 import 였고,
 *    TipTap 에디터·recharts·캔버스까지 통째로 **아이 첫 화면 번들에 실려** 왔다.
 *    4G·보급형 폰 실측: 단일 번들 1,205KB, 첫 글자 11.4초. 부모도 아이도 안 여는 코드다.
 */
const M = () => import('../features/marketing');
const MarketingLayout = lazy(() => M().then((m) => ({ default: m.MarketingLayout })));
const ContentPage = lazy(() => M().then((m) => ({ default: m.ContentPage })));
const SettingsPage = lazy(() => M().then((m) => ({ default: m.SettingsPage })));
const IdeasPage = lazy(() => M().then((m) => ({ default: m.IdeasPage })));
const PublishPage = lazy(() => M().then((m) => ({ default: m.PublishPage })));
const SiteAnalysisPage = lazy(() => M().then((m) => ({ default: m.SiteAnalysisPage })));
const MetaAnalyticsPage = lazy(() => M().then((m) => ({ default: m.MetaAnalyticsPage })));
const CompetitorsPage = lazy(() => M().then((m) => ({ default: m.CompetitorsPage })));
const StrategyPage = lazy(() => M().then((m) => ({ default: m.StrategyPage })));
const MonitoringPage = lazy(() => M().then((m) => ({ default: m.MonitoringPage })));
const AdsPage = lazy(() => M().then((m) => ({ default: m.AdsPage })));
const LandingsPage = lazy(() => M().then((m) => ({ default: m.LandingsPage })));
const FeedbackPage = lazy(() => M().then((m) => ({ default: m.FeedbackPage })));
const PipelinePage = lazy(() => M().then((m) => ({ default: m.PipelinePage })));
/**
 * 🔴 **첫 화면에 필요한 것만 즉시 import 한다**(2026-08-04).
 *
 * 여기 있는 것 = 블로그·광고에서 사람이 실제로 도착하는 곳(`/library`, `/library/:id`).
 * 나머지는 전부 `lazy` — 정적 import 였을 때 뷰어·게임·파닉스·저작도구·결제가 **전부 한 덩어리**로
 * 묶여, 책 한 권 열려던 사람이 3MB 를 받고 나서야 「책 읽기」를 볼 수 있었다.
 * 실측(4G·CPU 4배, 장수풍뎅이 책): SSR 줄글 2.1s → **버튼 등장 10.9s**.
 *
 * 🔴 `IntroPage`(광고 랜딩) 도 lazy 다 — 랜딩이 뷰어·게임 컴포넌트를 실제로 마운트해서,
 *    즉시 import 면 그 둘이 통째로 첫 화면 번들에 실린다.
 */
import LibraryPage from '../pages/LibraryPage';
const GamesHubPage = lazy(() => import('../pages/GamesHubPage'));
const RandomBlockGamePage = lazy(() => import('../pages/RandomBlockGamePage'));
const RandomVocabStudyPage = lazy(() => import('../pages/RandomVocabStudyPage'));

function EditorV2BidRedirect() {
  const { bid } = useParams();
  return <Navigate to={`/editor2/${bid}`} replace />;
}
import BookDetailPage from '../pages/BookDetailPage';
const BookSeoPage = lazy(() => import('../pages/BookSeoPage'));
const GuideHubPage = lazy(() => import('../pages/GuideHubPage'));
const CurriculumMasterPage = lazy(() => import('../pages/CurriculumMasterPage'));
const LibraryMasterPage = lazy(() => import('../pages/LibraryMasterPage'));
const LetterStrokeBulkEditorPage = lazy(() => import('../pages/LetterStrokeBulkEditorPage'));
const KoreanJamoStrokeBulkEditorPage = lazy(
  () => import('../pages/KoreanJamoStrokeBulkEditorPage')
);
const LetterFillDemoPage = lazy(() => import('../pages/LetterFillDemoPage'));
const ColoringDemoPage = lazy(() => import('../pages/ColoringDemoPage'));
const ConnectTheDotsDemoPage = lazy(() => import('../pages/ConnectTheDotsDemoPage'));
const ViewerPage = lazy(() => import('../pages/ViewerPage'));
import { LangEntry } from '../pages/LangEntry';
const BlogListPage = lazy(() => import('../features/blog-public/BlogListPage'));
const BlogPostPage = lazy(() => import('../features/blog-public/BlogPostPage'));
import NotFoundPage from '../pages/NotFoundPage';
import LoginCallback from '../pages/LoginCallback';
import LoginPage from '../features/auth/components/LoginPage';
import { RouteErrorScreen } from '@/components/RouteErrorScreen';
import { AuthProvider } from '../features/auth/context/AuthContext';
const ParentHomePage = lazy(() => import('../features/auth/pages/ParentHomePage'));
const ParentReportsPage = lazy(() => import('../features/auth/pages/ParentReportsPage'));
const ParentProfilesPage = lazy(() => import('../features/auth/pages/ParentProfilesPage'));
const ParentSettingsPage = lazy(() => import('../features/auth/pages/ParentSettingsPage'));
const VU = () => import('../features/vocabulary-unit');
const VocabularyHubPage = lazy(() => VU().then((m) => ({ default: m.VocabularyHubPage })));
const VocabularyStudyPage = lazy(() => VU().then((m) => ({ default: m.VocabularyStudyPage })));
// 🔴 lazy 필수: @tangobook/remotion(Player + loadFont 사이드이펙트 15개)을 통째로 끌고 와서
// 정적 import 시 메인 번들 비대 + 모든 페이지에서 Noto Sans KR 폰트 요청 124개 발생.
const MosquitoEbookPage = lazy(() => import('../features/ebook-mosquito/pages/MosquitoEbookPage'));
const PL = () => import('../features/phonics-learner');
const PhonicsLandingPage = lazy(() => PL().then((m) => ({ default: m.PhonicsLandingPage })));
const KoreanPhonicsStudyPage = lazy(() =>
  PL().then((m) => ({ default: m.KoreanPhonicsStudyPage }))
);
const KoreanPhonicsActivityPage = lazy(() =>
  PL().then((m) => ({ default: m.KoreanPhonicsActivityPage }))
);
const EnglishPhonicsStudyPage = lazy(() =>
  PL().then((m) => ({ default: m.EnglishPhonicsStudyPage }))
);
const EnglishPhonicsActivityPage = lazy(() =>
  PL().then((m) => ({ default: m.EnglishPhonicsActivityPage }))
);
const ChinesePhonicsStudyPage = lazy(() =>
  PL().then((m) => ({ default: m.ChinesePhonicsStudyPage }))
);
const ChinesePhonicsActivityPage = lazy(() =>
  PL().then((m) => ({ default: m.ChinesePhonicsActivityPage }))
);
const CO = () => import('../features/continuous');
const ContinuousHomePage = lazy(() => CO().then((m) => ({ default: m.ContinuousHomePage })));
const ContinuousBuilder = lazy(() => CO().then((m) => ({ default: m.ContinuousBuilder })));
const ContinuousPlayPage = lazy(() => CO().then((m) => ({ default: m.ContinuousPlayPage })));
const SubscribePage = lazy(() => import('../features/payment/pages/SubscribePage'));
const PaymentSuccessPage = lazy(() => import('../features/payment/pages/PaymentSuccessPage'));
const PaymentFailPage = lazy(() => import('../features/payment/pages/PaymentFailPage'));
/* 🔴 `ReferralRewardToast` 만 즉시 — 라우트가 아니라 루트에 상시 마운트되는 토스트다. */
import { ReferralRewardToast } from '../features/payment';
const PAY = () => import('../features/payment');
const InviteLandingPage = lazy(() => PAY().then((m) => ({ default: m.InviteLandingPage })));
const InviteFriendsPage = lazy(() => PAY().then((m) => ({ default: m.InviteFriendsPage })));
const IntroPage = lazy(() => import('../pages/IntroPage'));
/** 영어 파닉스 광고 랜딩 — 같은 이유로 lazy(뷰어·게임을 실제로 마운트한다). */
import { GlobalUiSound } from '../components/GlobalUiSound';
import { GuestEventAdopter } from '@/features/learning/components/GuestEventAdopter';
import { MetaPixelTracker } from '../components/MetaPixelTracker';
import { AnalyticsControl } from '../components/AnalyticsControl';
import { ParentGate } from '../features/auth/components/ParentGate';
import { RequireAuthed } from '../features/auth/guards/RequireAuthed';
const TermsPage = lazy(() => import('../pages/legal/TermsPage'));
const OpsDashboardPage = lazy(() =>
  import('../features/ops').then((m) => ({ default: m.OpsDashboardPage }))
);
const MembersDashboardPage = lazy(() =>
  import('../features/members').then((m) => ({ default: m.MembersDashboardPage }))
);
const PrivacyPage = lazy(() => import('../pages/legal/PrivacyPage'));
const RefundPolicyPage = lazy(() => import('../pages/legal/RefundPolicyPage'));

export const router = createBrowserRouter([
  {
    path: '/',
    // 🔴 배포 직후 옛 탭이 사라진 청크를 요청하면 여기로 떨어진다. React Router 기본 화면
    //    ("Unexpected Application Error!")은 아이·부모 누구에게도 뜻이 없고, 실제 해법은
    //    새로고침 한 번뿐이라 자동으로 한다. Vite 의 `vite:preloadError` 가 안 잡는 경로
    //    (정적 청크 그래프 실패)까지 덮으려면 이 자리가 필요하다.
    errorElement: <RouteErrorScreen />,
    element: (
      <AuthProvider>
        <Outlet />
        {/* 친구 초대 보상 축하 토스트 — 앱 어디서든 뜨도록 최상단에 마운트 */}
        <ReferralRewardToast />
        {/* 전역 UI 효과음 — 버튼 탭음 위임 리스너 + 프리로드 */}
        <GlobalUiSound />
        {/* Meta Pixel — SPA 라우트 이동 시 PageView 재발화 (초기 로드는 index.html base code) */}
        <MetaPixelTracker />
        {/* 트래킹 제어 — 내부계정 제외 + 앱 UI 언어를 GA4 유저속성으로 전송 */}
        <AnalyticsControl />
        {/* 게스트로 논 기록을 가입 후 프로필로 옮겨 붙인다 (앱 어디서 가입해도 걸리도록 최상단) */}
        <GuestEventAdopter />
      </AuthProvider>
    ),
    children: [
      { index: true, element: <Navigate to="/library" replace /> },
      // 광고 랜딩(상세페이지) — AppShell 밖 풀화면. 네이버·메타 광고의 도착지.
      // 🔴 게이트로 감싸지 않는다 — 광고를 눌러 온 사람에게 첫 화면이 가입 벽이면 그대로 나간다.
      //    본문 안 「직접 해보기」가 계정 없이 도는 것도 같은 이유다.
      {
        path: 'intro',
        element: (
          <ErrorBoundary>
            <IntroPage />
          </ErrorBoundary>
        ),
      },
      {
        // 🔴 예전 주소 — 광고·블로그·검색결과에 이미 나가 있다. 서버가 301 로 보내지만
        //    (`app.ts`), 앱 안에서의 이동은 여기서 받는다.
        path: 'hangul',
        element: <Navigate to="/intro" replace />,
      },
      {
        // 🔴 영어 랜딩은 `/intro` 에 합쳤다(2026-08-11 사용자: "요금제에 전부 포함인데 같이
        //    넣는 게 맞을 거 같긴 한데"). 광고·블로그에 이미 나간 `/english` 링크가 있을 수
        //    있으므로 라우트는 남기고 보낸다.
        path: 'english',
        element: <Navigate to="/intro" replace />,
      },
      // 친구 초대 랜딩 — AppShell 밖 풀화면 (따뜻한 환영 + 코드 저장 + 가입 CTA)
      {
        path: 'invite/:code',
        element: (
          <ErrorBoundary>
            <InviteLandingPage />
          </ErrorBoundary>
        ),
      },
      // 학습자 진입점 hub 페이지들 — AppShell (좌측 nav + 상단 헤더) 안에서 렌더
      {
        element: (
          <ErrorBoundary>
            <AppShell />
          </ErrorBoundary>
        ),
        children: [
          { path: 'library', element: <LibraryPage type="storybook" /> },
          { path: 'library/phonics', element: <PhonicsLandingPage /> },
          { path: 'collection', element: <Navigate to="/library" replace /> },
          { path: 'collection/book/:bookId', element: <Navigate to="/library" replace /> },
          { path: 'collection/:categoryId', element: <Navigate to="/library" replace /> },
          { path: 'hori-room', element: <Navigate to="/library" replace /> },
          { path: 'vocabulary', element: <VocabularyHubPage /> },
          { path: 'playground', element: <Navigate to="/library" replace /> },
          { path: 'games', element: <GamesHubPage /> },
          // 어휘 게임 — 사이드바 진입점이므로 AppShell 안 (2026-07-24, 동화책/파닉스와 통일).
          { path: 'games/vocab', element: <RandomVocabStudyPage /> },
          // 연속재생 홈 — 사이드바 있는 브라우즈 화면 (AppShell 안). 저장된 세트 목록 + 새 세트 만들기.
          { path: 'continuous', element: <ContinuousHomePage /> },
          { path: 'continuous/new', element: <ContinuousBuilder /> },
          { path: 'continuous/edit/:id', element: <ContinuousBuilder /> },
          { path: 'invite-friends', element: <InviteFriendsPage /> },
        ],
      },
      {
        // 학습 풀화면 — BookDetailPage 와 일관되게 AppShell 밖 (사이드바 없는 풀폭).
        path: 'vocabulary/:unitId',
        element: (
          <ErrorBoundary>
            <VocabularyStudyPage />
          </ErrorBoundary>
        ),
      },
      {
        // 공개 블로그 — AppShell 밖 풀폭 (동화·자연관찰 SEO 글, 외부 노출)
        path: 'blog',
        element: (
          <ErrorBoundary>
            <BlogListPage />
          </ErrorBoundary>
        ),
      },
      {
        path: 'blog/:slug',
        element: (
          <ErrorBoundary>
            <BlogPostPage />
          </ErrorBoundary>
        ),
      },
      {
        // 모기 그림책 인터랙티브 이북 — AppShell 밖 풀화면
        path: 'ebook/mosquito',
        element: (
          <ErrorBoundary>
            <Suspense fallback={null}>
              <MosquitoEbookPage />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        // 한글 파닉스 학습 모드 — AppShell 밖 풀화면 (좌 커리큘럼 + 우 unit body)
        path: 'library/phonics/korean',
        element: (
          <PhonicsUnitGate>
            <ErrorBoundary>
              <KoreanPhonicsStudyPage />
            </ErrorBoundary>
          </PhonicsUnitGate>
        ),
      },
      {
        // 한글 파닉스 학습 모드 — unit 선택 상태
        path: 'library/phonics/korean/:unitId',
        element: (
          <PhonicsUnitGate>
            <ErrorBoundary>
              <KoreanPhonicsStudyPage />
            </ErrorBoundary>
          </PhonicsUnitGate>
        ),
      },
      {
        // 한글 파닉스 액티비티 — 풀화면 (모음 듣기/쓰기, 게임). AppShell 밖.
        path: 'library/phonics/korean/:unitId/:activityKey',
        element: (
          <PhonicsUnitGate>
            <ErrorBoundary>
              <KoreanPhonicsActivityPage />
            </ErrorBoundary>
          </PhonicsUnitGate>
        ),
      },
      {
        // 영어 파닉스 학습 모드 — AppShell 밖 풀화면 (좌 Book1~5 + 우 unit body)
        path: 'library/phonics/english',
        element: (
          <PhonicsUnitGate>
            <ErrorBoundary>
              <EnglishPhonicsStudyPage />
            </ErrorBoundary>
          </PhonicsUnitGate>
        ),
      },
      {
        path: 'library/phonics/english/:unitId',
        element: (
          <PhonicsUnitGate>
            <ErrorBoundary>
              <EnglishPhonicsStudyPage />
            </ErrorBoundary>
          </PhonicsUnitGate>
        ),
      },
      {
        // 영어 파닉스 액티비티 — 풀화면. AppShell 밖.
        path: 'library/phonics/english/:unitId/:activityKey',
        element: (
          <PhonicsUnitGate>
            <ErrorBoundary>
              <EnglishPhonicsActivityPage />
            </ErrorBoundary>
          </PhonicsUnitGate>
        ),
      },
      {
        // 중국어 병음 파닉스 학습 모드 — AppShell 밖 풀화면 (좌 Level1~ + 우 unit body)
        path: 'library/phonics/chinese',
        element: (
          <PhonicsUnitGate>
            <ErrorBoundary>
              <ChinesePhonicsStudyPage />
            </ErrorBoundary>
          </PhonicsUnitGate>
        ),
      },
      {
        path: 'library/phonics/chinese/:unitId',
        element: (
          <PhonicsUnitGate>
            <ErrorBoundary>
              <ChinesePhonicsStudyPage />
            </ErrorBoundary>
          </PhonicsUnitGate>
        ),
      },
      {
        // 중국어 병음 파닉스 액티비티 — 풀화면. AppShell 밖.
        path: 'library/phonics/chinese/:unitId/:activityKey',
        element: (
          <PhonicsUnitGate>
            <ErrorBoundary>
              <ChinesePhonicsActivityPage />
            </ErrorBoundary>
          </PhonicsUnitGate>
        ),
      },
      {
        path: 'library/:id',
        element: (
          <ErrorBoundary>
            <BookDetailPage />
          </ErrorBoundary>
        ),
      },
      {
        path: 'library/:id/about',
        element: (
          <ErrorBoundary>
            <BookSeoPage />
          </ErrorBoundary>
        ),
      },
      {
        // 카테고리 허브 SEO 랜딩 (classics/nature) — 서버 SSR(seo-ssr) 짝 페이지
        path: 'guide/:hub',
        element: (
          <ErrorBoundary>
            <GuideHubPage />
          </ErrorBoundary>
        ),
      },
      {
        // 언어별 진입 링크 — /en·/vi·/zh·/th·/ko 로 UI+책 기본 언어 설정 후 라이브러리로.
        // 정적 라우트(library/blog/subscribe 등)가 이 :lang 보다 우선 매칭되므로 안전.
        path: ':lang',
        element: (
          <ErrorBoundary>
            <LangEntry />
          </ErrorBoundary>
        ),
      },
      {
        // 다국어 SEO 라우트 — ko 는 bare, 그 외 /:lang 프리픽스 (서버 SSR 와 동일 규칙)
        path: ':lang/library/:id/about',
        element: (
          <ErrorBoundary>
            <BookSeoPage />
          </ErrorBoundary>
        ),
      },
      {
        path: ':lang/blog',
        element: (
          <ErrorBoundary>
            <BlogListPage />
          </ErrorBoundary>
        ),
      },
      {
        path: ':lang/blog/:slug',
        element: (
          <ErrorBoundary>
            <BlogPostPage />
          </ErrorBoundary>
        ),
      },
      {
        path: ':lang/guide/:hub',
        element: (
          <ErrorBoundary>
            <GuideHubPage />
          </ErrorBoundary>
        ),
      },
      {
        path: 'curriculum-master',
        element: (
          <ErrorBoundary>
            <CurriculumMasterPage />
          </ErrorBoundary>
        ),
      },
      {
        path: 'library-master',
        element: (
          <ErrorBoundary>
            <LibraryMasterPage />
          </ErrorBoundary>
        ),
      },
      {
        // 알파벳 stroke 일괄 편집 — A~Z, a~z 한 페이지에서 점 위치 조정
        path: 'letter-stroke-editor',
        element: (
          <ErrorBoundary>
            <LetterStrokeBulkEditorPage />
          </ErrorBoundary>
        ),
      },
      {
        // 한글 자모 stroke 일괄 편집 — ~51 자모 + composeKoreanSyllable 자동 합성
        path: 'korean-jamo-stroke-editor',
        element: (
          <ErrorBoundary>
            <KoreanJamoStrokeBulkEditorPage />
          </ErrorBoundary>
        ),
      },
      {
        // Paint mode 데모 — LetterFillCanvas 검증 (한글/영어/일본어 글자 색칠)
        path: 'letter-fill-demo',
        element: (
          <ErrorBoundary>
            <LetterFillDemoPage />
          </ErrorBoundary>
        ),
      },
      {
        // 색칠공부 데모 (2026-08-17): 안내 색칠 — 도안 + 정답본으로 칸별 정답색 검증
        path: 'coloring-demo',
        element: (
          <ErrorBoundary>
            <ColoringDemoPage />
          </ErrorBoundary>
        ),
      },
      {
        // 점잇기 → 색칠 모드 데모 (2026-05-25): 다양한 polygon 모양으로 paint-fill 검증
        path: 'connect-the-dots-demo',
        element: (
          <ErrorBoundary>
            <ConnectTheDotsDemoPage />
          </ErrorBoundary>
        ),
      },
      // v1 저작도구 — 사이드바 + EditorContent (원래 그대로)
      {
        path: 'editor',
        element: (
          <ErrorBoundary>
            <AppLayout />
          </ErrorBoundary>
        ),
      },
      {
        path: 'editor/:bid',
        element: (
          <ErrorBoundary>
            <AppLayout />
          </ErrorBoundary>
        ),
      },
      // /editor2 — v1 업그레이드(레벨/그림체/언어 variation) 작업용. /editor 는 안전 백업으로 절대 건드리지 않음
      // AppLayoutV2 = TopBar/Sidebar 는 v1 그대로 + 우측 본문만 EditorPanelV2 (variant 탭)
      {
        path: 'editor2',
        element: (
          <ErrorBoundary>
            <AppLayoutV2 />
          </ErrorBoundary>
        ),
      },
      {
        path: 'editor2/:bid',
        element: (
          <ErrorBoundary>
            <AppLayoutV2 />
          </ErrorBoundary>
        ),
      },
      {
        path: 'editor2/vocab/:unitId',
        element: (
          <ErrorBoundary>
            <AppLayoutV2 />
          </ErrorBoundary>
        ),
      },
      // 구 /editor-v2 (별도 v2 editor) → /editor2 로 리다이렉트 (북마크 호환용)
      { path: 'editor-v2', element: <Navigate to="/editor2" replace /> },
      { path: 'editor-v2/:bid', element: <EditorV2BidRedirect /> },
      {
        path: 'viewer/:id',
        element: (
          <ErrorBoundary>
            <ViewerPage />
          </ErrorBoundary>
        ),
      },
      {
        // 연속재생 런타임 — 뷰어처럼 풀화면 (AppShell 밖)
        path: 'continuous/play',
        element: (
          <ErrorBoundary>
            <ContinuousPlayPage />
          </ErrorBoundary>
        ),
      },
      { path: 'login', element: <LoginPage /> },
      { path: 'login/callback', element: <LoginCallback /> },
      // 내부 운영 대시보드 — 비밀번호(서버 검증) 또는 DEV_EMAILS 로그인
      {
        path: 'admin',
        element: (
          <ErrorBoundary>
            <OpsDashboardPage />
          </ErrorBoundary>
        ),
      },
      { path: 'ops', element: <Navigate to="/admin" replace /> },
      // 회원 관리 — marketing 레이아웃 안으로 이동(/marketing/members). 옛 북마크 호환 redirect.
      { path: 'members', element: <Navigate to="/marketing/members" replace /> },
      // 법적 문서 — AppShell 밖 문서 페이지 (토스 가맹 심사 확인 대상)
      { path: 'terms', element: <TermsPage /> },
      { path: 'privacy', element: <PrivacyPage /> },
      { path: 'refund', element: <RefundPolicyPage /> },
      {
        path: 'subscribe',
        element: (
          <ErrorBoundary>
            <RequireAuthed>
              <ParentGate>
                <SubscribePage />
              </ParentGate>
            </RequireAuthed>
          </ErrorBoundary>
        ),
      },
      {
        path: 'payments/success',
        element: (
          <ErrorBoundary>
            <PaymentSuccessPage />
          </ErrorBoundary>
        ),
      },
      {
        path: 'payments/fail',
        element: (
          <ErrorBoundary>
            <PaymentFailPage />
          </ErrorBoundary>
        ),
      },
      {
        path: 'games/korean-block',
        element: (
          <ErrorBoundary>
            <RandomBlockGamePage lang="ko" />
          </ErrorBoundary>
        ),
      },
      {
        path: 'games/alphabet-block',
        element: (
          <ErrorBoundary>
            <RandomBlockGamePage lang="en" />
          </ErrorBoundary>
        ),
      },
      { path: 'games/hori-run', element: <Navigate to="/library" replace /> },
      { path: 'games/hori-catch', element: <Navigate to="/library" replace /> },
      { path: 'games/hori-whack', element: <Navigate to="/library" replace /> },
      { path: 'games/hori-memory', element: <Navigate to="/library" replace /> },
      { path: 'games/hori-simon', element: <Navigate to="/library" replace /> },
      { path: 'games/hori-jump', element: <Navigate to="/library" replace /> },
      { path: 'playground/word-memory', element: <Navigate to="/library" replace /> },
      { path: 'playground/word-pop', element: <Navigate to="/library" replace /> },
      { path: 'playground/word-fishing', element: <Navigate to="/library" replace /> },
      { path: 'playground/word-shopping', element: <Navigate to="/library" replace /> },
      { path: 'playground/word-run', element: <Navigate to="/library" replace /> },
      { path: 'playground/word-sort-cart', element: <Navigate to="/library" replace /> },
      { path: 'playground/word-garden', element: <Navigate to="/library" replace /> },
      {
        path: 'parent',
        // RequireAuthed(로그인) → ParentGate(경량 어른 확인: 곱셈, 15분 유지).
        // 아이가 설정/결제/계정삭제 도달 방지 + 미로그인은 /login 으로.
        element: (
          <RequireAuthed>
            <ParentGate>
              <ParentHomePage />
            </ParentGate>
          </RequireAuthed>
        ),
        children: [
          { index: true, element: <Navigate to="/parent/profiles" replace /> },
          { path: 'reports', element: <ParentReportsPage /> },
          { path: 'profiles', element: <ParentProfilesPage /> },
          { path: 'settings', element: <ParentSettingsPage /> },
        ],
      },
      // Marketing operator shell — auth-guarded, outside AppShell, full-screen
      {
        path: 'marketing',
        element: (
          <ErrorBoundary>
            <MarketingLayout />
          </ErrorBoundary>
        ),
        children: [
          { index: true, element: <Navigate to="/marketing/content" replace /> },
          { path: 'content', element: <ContentPage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'ideas', element: <IdeasPage /> },
          { path: 'publish', element: <PublishPage /> },
          { path: 'monitoring', element: <MonitoringPage /> },
          { path: 'site-analysis', element: <SiteAnalysisPage /> },
          { path: 'meta-analytics', element: <MetaAnalyticsPage /> },
          { path: 'competitors', element: <CompetitorsPage /> },
          { path: 'strategy', element: <StrategyPage /> },
          { path: 'ads', element: <AdsPage /> },
          { path: 'landings', element: <LandingsPage /> },
          { path: 'feedback', element: <FeedbackPage /> },
          { path: 'pipeline', element: <PipelinePage /> },
          { path: 'members', element: <MembersDashboardPage embedded /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
