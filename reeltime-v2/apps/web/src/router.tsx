import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/layout';
import { HomePage } from './pages/HomePage';
import { SoireePage } from './pages/SoireePage';
import { MesSoireesPage } from './pages/MesSoireesPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/soiree', element: <SoireePage /> },
      { path: '/mes-soirees', element: <MesSoireesPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
