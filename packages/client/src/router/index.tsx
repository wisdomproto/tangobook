import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { ErrorBoundary } from '../components/ErrorBoundary';
import LibraryPage from '../pages/LibraryPage';
import BookDetailPage from '../pages/BookDetailPage';
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

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    ),
    children: [
      { index: true, element: <AppLayout /> },
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
