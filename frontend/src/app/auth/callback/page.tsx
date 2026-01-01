
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                // Handle the auth callback
                const { data, error } = await supabase.auth.getSession();
                
                if (error) {
                    console.error('Auth callback error:', error);
                    setError(error.message);
                    return;
                }

                if (data.session) {
                    // Successful authentication, redirect to dashboard
                    router.push('/dashboard');
                } else {
                    // No session, redirect to login
                    router.push('/login');
                }
            } catch (err) {
                console.error('Callback handling error:', err);
                setError('Authentication failed. Please try again.');
            }
        };

        // Also listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                router.push('/dashboard');
            } else if (event === 'SIGNED_OUT') {
                router.push('/login');
            }
        });

        handleAuthCallback();

        return () => {
            subscription.unsubscribe();
        };
    }, [router, searchParams]);

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <span className="text-red-600 text-2xl">✕</span>
                    </div>
                    <h2 className="text-xl font-semibold text-slate-800 mb-2">Authentication Failed</h2>
                    <p className="text-slate-500 mb-4">{error}</p>
                    <button
                        onClick={() => router.push('/login')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <h2 className="text-xl font-semibold text-slate-800">Verifying Login...</h2>
            <p className="text-slate-500">Please wait while we redirect you.</p>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <h2 className="text-xl font-semibold text-slate-800">Loading...</h2>
                <p className="text-slate-500">Please wait while we redirect you.</p>
            </div>
        }>
            <AuthCallbackContent />
        </Suspense>
    );
}
