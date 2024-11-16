import React, { ReactComponentElement, ReactElement, Component, Fragment, useEffect, useContext } from 'react';
import { Outlet } from 'react-router-dom';
import HeaderPage from './Header';
import FooterPage from './Footer';

function changeHTMLAttribute() {
    if (document.documentElement) document.documentElement.setAttribute('data-topbar', 'dark');
    return true;
}

const IndexPage = () => {
    changeHTMLAttribute();

    return (
        <Fragment>
            <div id="layout-wrapper">
                <HeaderPage />
                <div className="main-content">
                    <Outlet />
                </div>
            </div>
        </Fragment>
    );
};

export default IndexPage;
