import React from 'react';
import NotFoundPrivate from '../pages/NotFoundPrivate.tsx';
import NotFoundPublic from '../pages/NotFoundPublic.tsx';
import { isAuthenticated } from './auth.ts';

const NotFoundRouter: React.FC = () => {
    return isAuthenticated() ? <NotFoundPrivate /> : <NotFoundPublic />;
};

export default NotFoundRouter;