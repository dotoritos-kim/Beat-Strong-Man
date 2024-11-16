import MainPage from 'Pages/Canvas/Index';
import BMSPlayer from 'Pages/Parser/BMSPlayer';
import React, { ReactElement, FC, JSXElementConstructor } from 'react';
import { Navigate } from 'react-router-dom';

interface PrivateRouteProps {
    path: string;
    exact?: boolean;
    component: JSX.Element;
    [x: string]: any;
}

interface PublicRouteProps {
    path: string;
    component: JSX.Element;
    [x: string]: any;
}
const authProtectedRoutes: PrivateRouteProps[] = [];
const publicRoutes: PublicRouteProps[] = [{ path: '/player', component: <MainPage /> }];

export { authProtectedRoutes, publicRoutes };
