import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import LibraryPage from '../pages/LibraryPage';
import ViewerPage from '../pages/ViewerPage';
import NotFoundPage from '../pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
  },
  {
    path: '/library',
    element: <LibraryPage />,
  },
  {
    path: '/viewer/:id',
    element: <ViewerPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
