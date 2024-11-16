import React, { ReactElement, useEffect, useState } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useLoginContext } from './LoginContext';

interface PrivateRouteProps {
    children?: ReactElement; // Router.tsx에서 PrivateRoute가 감싸고 있는 Componet Element
    authentication: boolean; // true :인증을 반드시 해야하만 접속가능, false : 인증을 반드시 안해야만 접속 가능
    subscribeCheck: boolean;
}

export function PrivateRoute({ authentication, subscribeCheck }: PrivateRouteProps): React.ReactElement | null {
    const { loggedIn, setLoggedIn } = useLoginContext();

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setIsLoading(true);
    }, []);
    /**
     * 로그인 했는지 여부
     * 로그인 했을 경우 : true 라는 텍스트 반환
     * 로그인 안했을 경우 : null or false(로그아웃 버튼 눌렀을경우 false로 설정) 반환
     */

    if (isLoading === false) return null;
    let page: JSX.Element | null = null;
    if (authentication) {
        // 인증이 반드시 필요한 페이지
        // 인증을 안했을 경우 로그인 페이지로, 했을 경우 해당 페이지로
        page = loggedIn === false ? <Navigate to="/login" /> : <Outlet />;
        return page;
    }

    page = loggedIn === false ? <Outlet /> : <Navigate to="/dashboard" />;

    return page;
}
