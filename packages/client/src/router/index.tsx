import { createBrowserRouter, Navigate, Outlet, useParams } from 'react-router-dom';
import { ErrorBoundary } from '@/design-system';
import { AppLayout } from '../components/AppLayout';
import { AppLayoutV2 } from '../components/AppLayoutV2';
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
import { CollectionPage, CategoryPage } from '../features/collection';
import { HoriRoomPage } from '../features/hori-room';
import {
  PlaygroundHubPage,
  WordMemoryPlayer,
  WordPopPlayer,
  WordFishingPlayer,
  WordShoppingPlayer,
  WordRunPlayer,
  WordSortCartPlayer,
  WordGardenPlayer,
} from '../features/playground';

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
        path: 'collection',
        element: (
          <ErrorBoundary>
            <CollectionPage />
          </ErrorBoundary>
        ),
      },
      {
        path: 'collection/:categoryId',
        element: (
          <ErrorBoundary>
            <CategoryPage />
          </ErrorBoundary>
        ),
      },
      {
        path: 'hori-room',
        element: (
          <ErrorBoundary>
            <HoriRoomPage />
          </ErrorBoundary>
        ),
      },
      {
        path: 'playground',
        element: (
          <ErrorBoundary>
            <PlaygroundHubPage />
          </ErrorBoundary>
        ),
      },
      {
        path: 'playground/word-memory',
        element: (
          <ErrorBoundary>
            <WordMemoryPlayer />
          </ErrorBoundary>
        ),
      },
      {
        path: 'playground/word-pop',
        element: (
          <ErrorBoundary>
            <WordPopPlayer />
          </ErrorBoundary>
        ),
      },
      {
        path: 'playground/word-fishing',
        element: (
          <ErrorBoundary>
            <WordFishingPlayer />
          </ErrorBoundary>
        ),
      },
      {
        path: 'playground/word-shopping',
        element: (
          <ErrorBoundary>
            <WordShoppingPlayer />
          </ErrorBoundary>
        ),
      },
      {
        path: 'playground/word-run',
        element: (
          <ErrorBoundary>
            <WordRunPlayer />
          </ErrorBoundary>
        ),
      },
      {
        path: 'playground/word-sort-cart',
        element: (
          <ErrorBoundary>
            <WordSortCartPlayer />
          </ErrorBoundary>
        ),
      },
      {
        path: 'playground/word-garden',
        element: (
          <ErrorBoundary>
            <WordGardenPlayer />
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
