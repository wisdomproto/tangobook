import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { ErrorBoundary } from '../components/ErrorBoundary';
import LibraryPage from '../pages/LibraryPage';
import BookDetailPage from '../pages/BookDetailPage';
import ViewerPage from '../pages/ViewerPage';
import NotFoundPage from '../pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
  },
  {
    path: '/library',
    element: (
      <ErrorBoundary>
        <LibraryPage />
      </ErrorBoundary>
    ),
  },
  {
    path: '/library/:id',
    element: (
      <ErrorBoundary>
        <BookDetailPage />
      </ErrorBoundary>
    ),
  },
  {
    path: '/viewer/:id',
    element: (
      <ErrorBoundary>
        <ViewerPage />
      </ErrorBoundary>
    ),
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
