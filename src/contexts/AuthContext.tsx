import { api } from "@/services/api";
import { ReactNode, createContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { setCookie, parseCookies } from 'nookies'

interface User {
    email: string;
    permissions: string[];
    roles: string[];

}

interface SignInCredentials {
    email: string;
    password: string;
}

interface AuthContextData {
    signIn(credentials: SignInCredentials): Promise<void>
    user: User
    isAuthenticated: boolean;
}

interface AuthProviderProps {
    children: ReactNode;
}



export const AuthContext = createContext({} as AuthContextData)

export function AuthProvider({ children }: AuthProviderProps) {
    const router = useRouter();

    const [user, setUser] = useState<User>()
    const isAuthenticated = !!user;

    useEffect(() => {
        const { 'nextauth.token': token } = parseCookies()

        if (token) {
            api.get('/me').then(response => {
                const {email, permissions, roles } = response.data
                setUser({email, permissions, roles})
            })
        }
    }, [])


    async function signIn({ email, password }: SignInCredentials) {
        try {
            const response = await api.post('sessions', {
                email,
                password
            })

            const {token, refreshToken, permissions, roles} = response.data

            // sessionStorage
            // localStorage - não funciona muito bem com o next
            // cookies

            setCookie(undefined, 'nextauth.token', token, {
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/'
            })
            setCookie(undefined, 'nextauth.refreshtoken', refreshToken, {
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/'
            })

            setUser({
                email,
                permissions,
                roles
            })

            api.defaults.headers['Authorization'] = `bearer ${token}`
    
            router.push('/dashboard')
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <AuthContext.Provider value={{ signIn, isAuthenticated, user }}>
            {children}
        </AuthContext.Provider>
    )
}
