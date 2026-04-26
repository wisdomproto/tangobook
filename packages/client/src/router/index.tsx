import { createBrowserRouter, Navigate, Outlet, useParams } from 'react-router-dom';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { AppLayout } from '../components/AppLayout';
import LibraryPage from '../pages/LibraryPage';

function EditorV2Redirect() {
  const { bid } = useParams();
  return <Navigate to={`/editor/${bid}`} replace />;
}
import BookDetailPage from '../pages/BookDetailPage';
import CurriculumMasterPage from '../pages/CurriculumMasterPage';
import EditorPageV2 from '../pages/EditorPageV2';
import ViewerPage from '../pages/ViewerPage';
import NotFoundPage from '../pages/NotFoundPage';
import LoginCallback from '../pages/LoginCallback';
import LoginPage from '../features/auth/components/LoginPage';
import HoriRunPage from '../pages/HoriRunPage';
import HoriCatchPage from '../pages/HoriCatchPage';
import HoriWhackPage from '../pages/HoriWhackPage';
import HoriMemoryPage from '../pages/HoriMemoryPage';
import HoriSimonPage from '../pages/HoriSimonPage';
import HoriJumpPage from '../pages/HoriJumpPage';
import GamesHubPage from '../pages/GamesHubPage';
import { AuthProvider } from '../features/auth/context/AuthContext';
import { RequireAuthedWithPin } from '../features/auth/guards/RequireAuthedWithPin';
import ParentHomePage from '../features/auth/pages/ParentHomePage';
import ParentReportsPage from '../features/auth/pages/ParentReportsPage';
import ParentProfilesPage from '../features/auth/pages/ParentProfilesPage';
import ParentSettingsPage from '../features/auth/pages/ParentSettingsPage';

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
      {
        path: 'library',
        element: (
          <ErrorBoundary>
            <LibraryPage />
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
      // v2 신규 저작도구 (실험적)
      {
        path: 'editor-v2/:bid',
        element: (
          <ErrorBoundary>
            <EditorPageV2 />
          </ErrorBoundary>
        ),
      },
      { path: 'editor-v2', element: <Navigate to="/library" replace /> },
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
        path: 'games',
        element: (
          <ErrorBoundary>
            <GamesHubPage />
          </ErrorBoundary>
        ),
      },
      {
        path: 'games/hori-run',
        element: (
          <ErrorBoundary>
            <HoriRunPage />
          </ErrorBoundary>
        ),
      },
      {
        path: 'games/hori-catch',
        element: (
          <ErrorBoundary>
            <HoriCatchPage />
          </ErrorBoundary>
        ),
      },
      {
        path: 'games/hori-whack',
        element: (
          <ErrorBoundary>
            <HoriWhackPage />
          </ErrorBoundary>
        ),
      },
      {
        path: 'games/hori-memory',
        element: (
          <ErrorBoundary>
            <HoriMemoryPage />
          </ErrorBoundary>
        ),
      },
      {
        path: 'games/hori-simon',
        element: (
          <ErrorBoundary>
            <HoriSimonPage />
          </ErrorBoundary>
        ),
      },
      {
        path: 'games/hori-jump',
        element: (
          <ErrorBoundary>
            <HoriJumpPage />
          </ErrorBoundary>
        ),
      },
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
