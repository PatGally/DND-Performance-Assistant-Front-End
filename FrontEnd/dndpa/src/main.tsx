import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {createBrowserRouter, RouterProvider} from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import ProtectedRoute from "./ProtectedRoute.tsx";
import './index.css'
import HomeDashboard from "./pages/logged-in/HomeDashboard.tsx";
import EncounterSimulation from "./pages/logged-in/EncounterSimulation.tsx";
import 'bootstrap/dist/css/bootstrap.min.css';
import HomePagePA from "./pages/HomePagePA.tsx";
import SignUp from "./pages/SignUp.tsx";
import SignIn from "./pages/SignIn.tsx";
import NotFoundPrivate from "./pages/NotFoundPrivate.tsx";
import NotFoundPublic from "./pages/NotFoundPublic";
import NotFoundRouter from "./pages/NoteFoundRouter.tsx";

const router = createBrowserRouter(
    [
        {path: '/', element: <HomePagePA />, errorElement: <NotFoundPublic />},
        {
            path: 'user-dashboard',
            element: <ProtectedRoute><HomeDashboard /></ProtectedRoute>,
            errorElement: <NotFoundPrivate />
        },
        {
            path: 'encounter-simulation',
            element: <ProtectedRoute><EncounterSimulation /></ProtectedRoute>,
            errorElement: <NotFoundPrivate/>
        },
        {path: 'sign-in', element: <SignIn />, errorElement: <NotFoundPublic/>},
        {path: 'sign-up', element: <SignUp />, errorElement: <NotFoundPublic/>},

        { path: '*', element: <NotFoundRouter /> },
    ]
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
          <RouterProvider router={router} />
      </GoogleOAuthProvider>

  </StrictMode>,
)
