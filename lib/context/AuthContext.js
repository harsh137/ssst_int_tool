'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Check session on mount
    useEffect(() => {
        async function loadUser() {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    if (data.authenticated) {
                        setCurrentUser(data.user);
                    }
                }
            } catch (err) {
                console.error('Failed to load user session', err);
            } finally {
                setIsLoading(false);
            }
        }
        loadUser();
    }, []);

    const login = async (mobile, password) => {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile, password })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setCurrentUser(data.user);
                return { success: true, user: data.user };
            }
            return { success: false, error: data.error || 'invalidCredentials' };
        } catch (error) {
            return { success: false, error: 'serverError' };
        }
    };

    const logout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout failed', error);
        } finally {
            setCurrentUser(null);
            router.push('/login');
        }
    };

    const refreshUser = (updatedUser) => {
        setCurrentUser(updatedUser);
    };

    return (
        <AuthContext.Provider value={{ currentUser, isLoading, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
