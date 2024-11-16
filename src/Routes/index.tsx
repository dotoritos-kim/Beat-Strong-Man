import React, { createContext, Fragment, useContext, useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';

//routes
import { authProtectedRoutes, publicRoutes } from './allRoutes';
import { PrivateRoute } from './AuthProtected';

import IndexPage from '../Layouts';
import { LoginProvider } from './LoginContext';
const Index = () => {
    const [domLoaded, setDomLoaded] = useState(false);

    useEffect(() => {
        setDomLoaded(true);
    }, []);
    const availablePublicRoutesPaths = publicRoutes;
    const availableAuthRoutesPath = authProtectedRoutes;

    return (
        <>
            {domLoaded && (
                <LoginProvider>
                    <Routes>
                        <Route element={<IndexPage />}>
                            <Route
                                element={
                                    <>
                                        <PrivateRoute authentication={false} subscribeCheck={false} />
                                    </>
                                }
                            >
                                {availablePublicRoutesPaths.map((route, idx) => (
                                    <Route path={route.path} element={route.component} key={idx} />
                                ))}
                            </Route>
                        </Route>
                    </Routes>
                    <Routes>
                        <Route element={<IndexPage />}>
                            <Route element={<PrivateRoute authentication={true} subscribeCheck={false} />}>
                                {availableAuthRoutesPath.map((route, idx) => (
                                    <Route path={route.path} element={route.component} key={idx} />
                                ))}
                            </Route>
                        </Route>
                    </Routes>
                </LoginProvider>
            )}
        </>
    );
};

export default Index;
