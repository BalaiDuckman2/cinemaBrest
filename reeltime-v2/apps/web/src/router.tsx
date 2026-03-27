import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/layout';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ReservationPage } from './pages/ReservationPage';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/reservation/:showtimeId', element: <ReservationPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
