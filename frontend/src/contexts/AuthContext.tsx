
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { AuthContextType, AuthState } from '@/types/auth';
import { AuthService } from '@/services/auth.service';
import { sessionCache } from '@/lib/sessionCache';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = 'trilokiindoriya@gmail.com';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        session: null,
        isLoading: true,
        isAdmin: false,
    });
    const [userProfile, setUserProfile] = useState<any>(null);
    const router = useRouter();

    // Load user profile asynchronously (non-blocking)
    const loadUserProfile = useCallback(async (session: any) => {
        try {
            // First sync user to ensure avatar is saved in database
            const syncResult = await AuthService.syncUser();
            
            // Then load profile with avatar
            const profileResult = await AuthService.getProfile();
            
            if (profileResult?.data) {
                // Check if user is blocked
                if (profileResult.data.isBlocked) {
                    await signOut();
                    return;
                }
                setUserProfile(profileResult.data);
            }
        } catch (e: any) {
            // Check if error is due to blocked user
            if (e?.response?.data?.code === 'USER_BLOCKED') {
                await signOut();
                return;
            }
            // Silent fail - profile is optional
            console.error('Failed to load user profile:', e);
        }
    }, []);

    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                
                if (!mounted) return;

                if (error) {
                    setState((prev) => ({ ...prev, isLoading: false }));
                    return;
                }
                
                if (session) {
                    // Update cache immediately
                    sessionCache.setSession(session);
                    
                    const isAdmin = session.user.email === ADMIN_EMAIL;
                    setState({ user: session.user, session, isLoading: false, isAdmin });
                    
                    // Load profile in background (non-blocking)
                    loadUserProfile(session).catch(() => {
                        // Silent fail
                    });
                } else {
                    sessionCache.clear();
                    setState((prev) => ({ ...prev, isLoading: false }));
                }
            } catch (error) {
                if (mounted) {
                    setState((prev) => ({ ...prev, isLoading: false }));
                }
            }
        };

        initAuth();

        // Periodic check for blocked status (every 30 seconds)
        const checkBlockedStatus = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session && session.user.email !== ADMIN_EMAIL) {
                    const profileResult = await AuthService.getProfile();
                    if (profileResult?.data?.isBlocked) {
                        await signOut();
                    }
                }
            } catch (e: any) {
                if (e?.response?.data?.code === 'USER_BLOCKED') {
                    await signOut();
                }
            }
        };

        const blockCheckInterval = setInterval(checkBlockedStatus, 30000); // Check every 30 seconds

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            if (session && event === 'SIGNED_IN') {
                // Update cache immediately
                sessionCache.setSession(session);
                
                const isAdmin = session.user.email === ADMIN_EMAIL;
                setState({ user: session.user, session, isLoading: false, isAdmin });
                
                if (session.user.email_confirmed_at) {
                    // Load profile in background (non-blocking)
                    loadUserProfile(session).catch(() => {
                        // Silent fail
                    });
                    
                    // Only redirect on fresh login from login/signup pages, not on token refresh
                    const currentPath = window.location.pathname;
                    const isFromAuthPage = currentPath.includes('/login') || currentPath.includes('/signup') || currentPath.includes('/auth/callback');
                    
                    if (event === 'SIGNED_IN' && isFromAuthPage) {
                        if (isAdmin) {
                            router.push('/admin');
                        } else {
                            router.push('/dashboard');
                        }
                    }
                }
            } else if (event === 'SIGNED_OUT') {
                sessionCache.clear();
                setUserProfile(null);
                setState({ user: null, session: null, isLoading: false, isAdmin: false });
            } else if (event === 'TOKEN_REFRESHED' && session) {
                // Update cache immediately on token refresh
                sessionCache.setSession(session);
                
                // Handle token refresh - update session without redirecting
                const isAdmin = session.user.email === ADMIN_EMAIL;
                setState(prev => ({ 
                    ...prev, 
                    session, 
                    user: session.user,
                    isAdmin 
                }));
                // No redirect on token refresh - user stays on current page
            } else if (session) {
                // Update cache for any session update
                sessionCache.setSession(session);
                
                // Handle any other session updates
                const isAdmin = session.user.email === ADMIN_EMAIL;
                setState(prev => ({
                    ...prev,
                    user: session.user,
                    session,
                    isAdmin,
                    isLoading: false
                }));
            } else {
                // No session
                sessionCache.clear();
                setState(prev => ({ ...prev, isLoading: false }));
            }
        });

        return () => {
            mounted = false;
            clearInterval(blockCheckInterval);
            subscription.unsubscribe();
        };
    }, [router, loadUserProfile]);

    const signInWithGoogle = async () => {
        try {
            await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });
        } catch (error) {
            throw error;
        }
    };

    const signOut = async () => {
        try {
            setState(prev => ({ ...prev, isLoading: true }));
            setUserProfile(null);
            sessionCache.clear();
            
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            
            setState({ user: null, session: null, isLoading: false, isAdmin: false });
            // Soft navigation using Next router (no full page reload)
            router.push('/login?blocked=true');
        } catch (error) {
            sessionCache.clear();
            setState(prev => ({ ...prev, isLoading: false }));
            // Fallback navigation
            router.push('/login?blocked=true');
        }
    };

    return (
        <AuthContext.Provider value={{ ...state, userProfile, signInWithGoogle, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
