import MainPage from 'Pages/BMS/Canvas/Index';
import BMSPlayer from 'Pages/BMS/Parser/BMSPlayer';
import React, { ReactElement, FC, JSXElementConstructor } from 'react';
import { Navigate } from 'react-router-dom';

interface PrivateRouteProps {
    path: string;
    exact?: boolean;
    component: JSX.Element;
    [x: string]: any;
}

interface BMSRouteProps {
    path: string;
    component: JSX.Element;
    [x: string]: any;
}
const authProtectedRoutes: PrivateRouteProps[] = [];
const bmsRoutes: BMSRouteProps[] = [{ path: '/player', component: <MainPage /> }];

export { authProtectedRoutes, bmsRoutes };
