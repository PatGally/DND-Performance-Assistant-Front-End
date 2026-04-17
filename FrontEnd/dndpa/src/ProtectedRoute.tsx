import { Navigate } from 'react-router-dom';
import { isAuthenticated } from './utils/auth.ts';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isAuthenticated()) {
        return <Navigate to="/sign-in" replace />;
    }
    return <>{children}</>;
};

export default ProtectedRoute;