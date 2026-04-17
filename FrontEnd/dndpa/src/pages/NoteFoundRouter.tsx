import React from 'react';
import NotFoundPrivate from './NotFoundPrivate';
import NotFoundPublic from './NotFoundPublic';
import { isAuthenticated } from '../utils/auth.ts';

const NotFoundRouter: React.FC = () => {
    return isAuthenticated() ? <NotFoundPrivate /> : <NotFoundPublic />;
};

export default NotFoundRouter;