import React, {
    createContext,
    Fragment,
    useContext,
    useEffect,
    useState,
} from 'react';
export interface LoginProviderProps {
    children: React.ReactNode;
}
export const LoginContext = createContext({
    loggedIn: false,
    setLoggedIn: (loggedIn: boolean) => {},
});
export const LoginProvider = ({ children }: LoginProviderProps) => {
    const [loggedIn, setLoggedIn] = useState(false);
    return (
        <LoginContext.Provider value={{ loggedIn, setLoggedIn }}>
            {children}
        </LoginContext.Provider>
    );
};
export const useLoginContext = () => {
    return useContext(LoginContext);
};
