import { createBrowserRouter, Navigate, Outlet, useParams } from 'react-router-dom';
import { ErrorBoundary } from '@/design-system';
import { AppLayout } from '../components/AppLayout';
import { AppLayoutV2 } from '../components/AppLayoutV2';
import { AppShell } from '../components/AppShell';
import LibraryPage from '../pages/LibraryPage';
import GamesHubPage from '../pages/GamesHubPage';
import RandomBlockGamePage from '../pages/RandomBlockGamePage';

function EditorV2BidRedirect() {
  const { bid } = useParams();
  return <Navigate to={`/editor2/${bid}`} replace />;
}
import BookDetailPage from '../pages/BookDetailPage';
import BookSeoPage from '../pages/BookSeoPage';
import CurriculumMasterPage from '../pages/CurriculumMasterPage';
import LibraryMasterPage from '../pages/LibraryMasterPage';
import LetterStrokeBulkEditorPage from '../pages/LetterStrokeBulkEditorPage';
import ViewerPage from '../pages/ViewerPage';
import NotFoundPage from '../pages/NotFoundPage';
import LoginCallback from '../pages/LoginCallback';
import LoginPage from '../features/auth/components/LoginPage';
import { AuthProvider } from '../features/auth/context/AuthContext';
import ParentHomePage from '../features/auth/pages/ParentHomePage';
import ParentReportsPage from '../features/auth/pages/ParentReportsPage';
import ParentProfilesPage from '../features/auth/pages/ParentProfilesPage';
import ParentSettingsPage from '../features/auth/pages/ParentSettingsPage';
import { VocabularyHubPage, VocabularyStudyPage } from '../features/vocabulary-unit';
import {
  PhonicsLandingPage,
  KoreanPhonicsStudyPage,
  KoreanPhonicsActivityPage,
  EnglishPhonicsStudyPage,
  EnglishPhonicsActivityPage,
} from '../features/phonics-learner';

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    ),
    children: [
      { index: true, element: <Navigate to="/library" replace /> },
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
      { path: 'login', element: <LoginPage /> },
      { path: 'login/callback', element: <LoginCallback /> },
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
        // 학습 리포팅 (2026-05-19): PIN 게이트 제거 — 사용자 정책상 비밀번호 없이 진입.
        // 로그인 자체는 여전히 필요 (auth context 가 보장).
        element: <ParentHomePage />,
        children: [
          { index: true, element: <Navigate to="/parent/profiles" replace /> },
          { path: 'reports', element: <ParentReportsPage /> },
          { path: 'profiles', element: <ParentProfilesPage /> },
          { path: 'settings', element: <ParentSettingsPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
