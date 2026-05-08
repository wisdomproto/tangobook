import { createBrowserRouter, Navigate, Outlet, useParams } from 'react-router-dom';
import { ErrorBoundary } from '@/design-system';
import { AppLayout } from '../components/AppLayout';
import { AppLayoutV2 } from '../components/AppLayoutV2';
import { AppShell } from '../components/AppShell';
import LibraryPage from '../pages/LibraryPage';

function EditorV2BidRedirect() {
  const { bid } = useParams();
  return <Navigate to={`/editor2/${bid}`} replace />;
}
import BookDetailPage from '../pages/BookDetailPage';
import CurriculumMasterPage from '../pages/CurriculumMasterPage';
import ViewerPage from '../pages/ViewerPage';
import NotFoundPage from '../pages/NotFoundPage';
import LoginCallback from '../pages/LoginCallback';
import LoginPage from '../features/auth/components/LoginPage';
import { AuthProvider } from '../features/auth/context/AuthContext';
import { RequireAuthedWithPin } from '../features/auth/guards/RequireAuthedWithPin';
import ParentHomePage from '../features/auth/pages/ParentHomePage';
import ParentReportsPage from '../features/auth/pages/ParentReportsPage';
import ParentProfilesPage from '../features/auth/pages/ParentProfilesPage';
import ParentSettingsPage from '../features/auth/pages/ParentSettingsPage';
import { VocabularyHubPage, VocabularyStudyPage } from '../features/vocabulary-unit';

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
          { path: 'library/phonics', element: <LibraryPage type="phonics" /> },
          { path: 'collection', element: <Navigate to="/library" replace /> },
          { path: 'collection/book/:bookId', element: <Navigate to="/library" replace /> },
          { path: 'collection/:categoryId', element: <Navigate to="/library" replace /> },
          { path: 'hori-room', element: <Navigate to="/library" replace /> },
          { path: 'vocabulary', element: <VocabularyHubPage /> },
          {
            path: 'vocabulary/:unitId',
            element: (
              <ErrorBoundary>
                <VocabularyStudyPage />
              </ErrorBoundary>
            ),
          },
          { path: 'playground', element: <Navigate to="/library" replace /> },
          { path: 'games', element: <Navigate to="/library" replace /> },
        ],
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
        path: 'curriculum-master',
        element: (
          <ErrorBoundary>
            <CurriculumMasterPage />
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
        element: (
          <RequireAuthedWithPin>
            <ParentHomePage />
          </RequireAuthedWithPin>
        ),
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
