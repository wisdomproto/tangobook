import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet, useParams } from 'react-router-dom';
import { ErrorBoundary } from '@/design-system';
import { AppLayout } from '../components/AppLayout';
import { AppLayoutV2 } from '../components/AppLayoutV2';
import { AppShell } from '../components/AppShell';
import {
  MarketingLayout,
  ContentPage,
  SettingsPage,
  IdeasPage,
  PublishPage,
  SiteAnalysisPage,
  MetaAnalyticsPage,
  CompetitorsPage,
  StrategyPage,
  MonitoringPage,
  AdsPage,
  FeedbackPage,
  PipelinePage,
} from '../features/marketing';
import LibraryPage from '../pages/LibraryPage';
import GamesHubPage from '../pages/GamesHubPage';
import RandomBlockGamePage from '../pages/RandomBlockGamePage';
import RandomVocabStudyPage from '../pages/RandomVocabStudyPage';

function EditorV2BidRedirect() {
  const { bid } = useParams();
  return <Navigate to={`/editor2/${bid}`} replace />;
}
import BookDetailPage from '../pages/BookDetailPage';
import BookSeoPage from '../pages/BookSeoPage';
import GuideHubPage from '../pages/GuideHubPage';
import CurriculumMasterPage from '../pages/CurriculumMasterPage';
import LibraryMasterPage from '../pages/LibraryMasterPage';
import LetterStrokeBulkEditorPage from '../pages/LetterStrokeBulkEditorPage';
import KoreanJamoStrokeBulkEditorPage from '../pages/KoreanJamoStrokeBulkEditorPage';
import LetterFillDemoPage from '../pages/LetterFillDemoPage';
import ConnectTheDotsDemoPage from '../pages/ConnectTheDotsDemoPage';
import ViewerPage from '../pages/ViewerPage';
import { LangEntry } from '../pages/LangEntry';
import BlogListPage from '../features/blog-public/BlogListPage';
import BlogPostPage from '../features/blog-public/BlogPostPage';
import NotFoundPage from '../pages/NotFoundPage';
import LoginCallback from '../pages/LoginCallback';
import LoginPage from '../features/auth/components/LoginPage';
import { AuthProvider } from '../features/auth/context/AuthContext';
import ParentHomePage from '../features/auth/pages/ParentHomePage';
import ParentReportsPage from '../features/auth/pages/ParentReportsPage';
import ParentProfilesPage from '../features/auth/pages/ParentProfilesPage';
import ParentSettingsPage from '../features/auth/pages/ParentSettingsPage';
import { VocabularyHubPage, VocabularyStudyPage } from '../features/vocabulary-unit';
// 🔴 lazy 필수: @tangobook/remotion(Player + loadFont 사이드이펙트 15개)을 통째로 끌고 와서
// 정적 import 시 메인 번들 비대 + 모든 페이지에서 Noto Sans KR 폰트 요청 124개 발생.
const MosquitoEbookPage = lazy(() => import('../features/ebook-mosquito/pages/MosquitoEbookPage'));
import {
  PhonicsLandingPage,
  KoreanPhonicsStudyPage,
  KoreanPhonicsActivityPage,
  EnglishPhonicsStudyPage,
  EnglishPhonicsActivityPage,
} from '../features/phonics-learner';
import { ContinuousHomePage, ContinuousBuilder, ContinuousPlayPage } from '../features/continuous';
import SubscribePage from '../features/payment/pages/SubscribePage';
import PaymentSuccessPage from '../features/payment/pages/PaymentSuccessPage';
import PaymentFailPage from '../features/payment/pages/PaymentFailPage';
import { InviteLandingPage, InviteFriendsPage, ReferralRewardToast } from '../features/payment';
import { GlobalUiSound } from '../components/GlobalUiSound';
import { MetaPixelTracker } from '../components/MetaPixelTracker';
import { AnalyticsControl } from '../components/AnalyticsControl';
import { ParentGate } from '../features/auth/components/ParentGate';
import { RequireAuthed } from '../features/auth/guards/RequireAuthed';
import TermsPage from '../pages/legal/TermsPage';
import { OpsDashboardPage } from '../features/ops';
import { MembersDashboardPage } from '../features/members';
import PrivacyPage from '../pages/legal/PrivacyPage';
import RefundPolicyPage from '../pages/legal/RefundPolicyPage';

export const router = createBrowserRouter([
  {
    path: '/',
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
      </AuthProvider>
    ),
    children: [
      { index: true, element: <Navigate to="/library" replace /> },
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
          <ErrorBoundary>
            <KoreanPhonicsStudyPage />
          </ErrorBoundary>
        ),
      },
      {
        // 한글 파닉스 학습 모드 — unit 선택 상태
        path: 'library/phonics/korean/:unitId',
        element: (
          <ErrorBoundary>
            <KoreanPhonicsStudyPage />
          </ErrorBoundary>
        ),
      },
      {
        // 한글 파닉스 액티비티 — 풀화면 (모음 듣기/쓰기, 게임). AppShell 밖.
        path: 'library/phonics/korean/:unitId/:activityKey',
        element: (
          <ErrorBoundary>
            <KoreanPhonicsActivityPage />
          </ErrorBoundary>
        ),
      },
      {
        // 영어 파닉스 학습 모드 — AppShell 밖 풀화면 (좌 Book1~5 + 우 unit body)
        path: 'library/phonics/english',
        element: (
          <ErrorBoundary>
            <EnglishPhonicsStudyPage />
          </ErrorBoundary>
        ),
      },
      {
        path: 'library/phonics/english/:unitId',
        element: (
          <ErrorBoundary>
            <EnglishPhonicsStudyPage />
          </ErrorBoundary>
        ),
      },
      {
        // 영어 파닉스 액티비티 — 풀화면. AppShell 밖.
        path: 'library/phonics/english/:unitId/:activityKey',
        element: (
          <ErrorBoundary>
            <EnglishPhonicsActivityPage />
          </ErrorBoundary>
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
          { path: 'feedback', element: <FeedbackPage /> },
          { path: 'pipeline', element: <PipelinePage /> },
          { path: 'members', element: <MembersDashboardPage embedded /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
