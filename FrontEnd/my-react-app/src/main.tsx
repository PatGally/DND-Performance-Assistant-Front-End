import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {createBrowserRouter, RouterProvider} from 'react-router-dom';
import './index.css'
import HomeSignedOut from "./pages/HomeSignedOut.tsx";
import HomeDashboard from "./pages/logged-in/HomeDashboard.tsx";
import NotFoundPage from "./pages/NotFoundPage.tsx";
import Encounter from "./pages/logged-in/Encounter.tsx";
import EncounterSetup from "./pages/logged-in/EncounterSetup.tsx";
import 'bootstrap/dist/css/bootstrap.min.css';

const router = createBrowserRouter(
    [
        {path: '/', element: <HomeSignedOut />, errorElement: <NotFoundPage />},
        {path: 'user-dashboard', element: <HomeDashboard />, errorElement: <NotFoundPage />},
        {path: 'encounter-simulation', element: <Encounter />, errorElement: <NotFoundPage/>},
        {path: 'encounter-setup', element: <EncounterSetup />, errorElement: <NotFoundPage/>}
    ]
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
      {/*router provider is built using context api from react*/}
  </StrictMode>,
)
