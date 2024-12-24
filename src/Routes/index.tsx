import React, { createContext, Fragment, useContext, useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';

//routes
import { authProtectedRoutes, bmsRoutes } from './allRoutes';
import { PrivateRoute } from './AuthProtected';

import IndexPage from '../Layouts';
import { LoginProvider } from './LoginContext';
import { BmsProvider } from 'Pages/BMS/BmsContext';
const Index = () => {
    const [domLoaded, setDomLoaded] = useState(false);

    useEffect(() => {
        setDomLoaded(true);
    }, []);
    const availableBMSRoutesPaths = bmsRoutes;
    const availableAuthRoutesPath = authProtectedRoutes;

    return (
        <>
            {domLoaded && (
                <LoginProvider>
                    <BmsProvider>
                        <Routes>
                            <Route element={<IndexPage />}>
                                <Route
                                    element={
                                        <>
                                            <PrivateRoute authentication={false} subscribeCheck={false} />
                                        </>
                                    }
                                >
                                    {availableBMSRoutesPaths.map((route, idx) => (
                                        <Route path={route.path} element={route.component} key={idx} />
                                    ))}
                                </Route>
                            </Route>
                        </Routes>
                    </BmsProvider>
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
