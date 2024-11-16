import React, { ReactComponentElement, ReactElement, Component, Fragment, useEffect } from 'react';
import { Link } from 'react-router-dom';
function HeaderPage() {
    return (
        <>
            <Fragment>
                <header
                    id="page-topbar"
                    className={'topbar-shadow'}
                    style={{ WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none', userSelect: 'none' }}
                >
                    <div className="layout-width"></div>
                </header>
            </Fragment>
        </>
    );
}

export default HeaderPage;
