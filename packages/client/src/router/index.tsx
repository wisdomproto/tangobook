import { createBrowserRouter } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import EditorPage from '../pages/EditorPage';
import ViewerPage from '../pages/ViewerPage';
import NotFoundPage from '../pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/editor/:id',
    element: <EditorPage />,
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
