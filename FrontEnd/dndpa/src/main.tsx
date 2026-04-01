import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {createBrowserRouter, RouterProvider} from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import ProtectedRoute from "./ProtectedRoute.tsx";
import './index.css'
import HomeDashboard from "./pages/logged-in/HomeDashboard.tsx";
import NotFoundPage from "./pages/NotFoundPage.tsx";
import Encounter from "./pages/logged-in/Encounter.tsx";
import EncounterSimulation from "./pages/logged-in/EncounterSimulation.tsx";
import 'bootstrap/dist/css/bootstrap.min.css';
import HomePage from "./pages/HomePage.tsx";
import SignUp from "./pages/SignUp.tsx";
import SignIn from "./pages/SignIn.tsx";

const router = createBrowserRouter(

    [
        {path: '/', element: <HomePage />, errorElement: <NotFoundPage />},
        {
            path: 'user-dashboard',
            element: <ProtectedRoute><HomeDashboard /></ProtectedRoute>,
            errorElement: <NotFoundPage />
        },
        {
            path: 'encounter-simulation',
            element: <ProtectedRoute><EncounterSimulation /></ProtectedRoute>,
            errorElement: <NotFoundPage/>
        },
        {
            path: 'encounter-setup',
            element: <ProtectedRoute><Encounter /></ProtectedRoute>,
            errorElement: <NotFoundPage/>
        },
        {path: 'sign-in', element: <SignIn />, errorElement: <NotFoundPage/>},
        {path: 'sign-up', element: <SignUp />, errorElement: <NotFoundPage/>}
    ]
);

createRoot(document.getElementById('root')!).render(
    //Todo hide the clientID
  <StrictMode>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
          <RouterProvider router={router} />
      </GoogleOAuthProvider>

  </StrictMode>,
)
