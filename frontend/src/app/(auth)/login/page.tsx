
'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Check if user was redirected due to being blocked
        if (searchParams.get('blocked') === 'true') {
            setError('You are blocked. Please contact administrator.');
        }
    }, [searchParams]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                throw error;
            }

            if (data.user) {
                // Check if user is blocked by calling profile API
                try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile`, {
                        headers: {
                            'Authorization': `Bearer ${data.session.access_token}`
                        }
                    });
                    
                    const result = await response.json();
                    
                    if (response.status === 403 && result.code === 'USER_BLOCKED') {
                        // User is blocked, sign them out
                        await supabase.auth.signOut();
                        setError('You are blocked. Please contact administrator.');
                        setLoading(false);
                        return;
                    }
                } catch (profileError) {
                    console.error('Error checking user status:', profileError);
                }
                
                // router.push('/dashboard'); // Handled by AuthContext
                // router.refresh(); 
            }
        } catch (err: any) {
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const signInWithGoogle = async () => {
        try {
            setLoading(true);
            setError(null);
            await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });
        } catch (err: any) {
            setError(err.message || 'Google sign-in failed');
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4 py-12 bg-slate-50">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-sm border border-slate-200">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Sign in to your account to manage your properties
                    </p>
                </div>

                <div className="space-y-4">
                    <Button
                        variant="outline"
                        className="w-full justify-center gap-2 h-11"
                        onClick={signInWithGoogle}
                    >
                        <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Continue with Google
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-slate-500">Or continue with</span>
                        </div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <Link
                                    href="/forgot-password"
                                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className={`p-3 rounded-md flex items-start gap-2 ${
                                error.includes('blocked') 
                                    ? 'bg-red-50 border border-red-200' 
                                    : 'bg-red-50'
                            }`}>
                                <AlertCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                                    error.includes('blocked') ? 'text-red-600' : 'text-red-500'
                                }`} />
                                <p className={`text-sm ${
                                    error.includes('blocked') ? 'text-red-800 font-medium' : 'text-red-600'
                                }`}>
                                    {error}
                                </p>
                            </div>
                        )}

                        <Button type="submit" className="w-full h-11" isLoading={loading}>
                            Sign in
                        </Button>
                    </form>
                </div>

                <p className="text-center text-sm text-slate-600">
                    Don't have an account?{' '}
                    <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4 py-12 bg-slate-50">
                <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-sm border border-slate-200">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back</h1>
                        <p className="mt-2 text-sm text-slate-600">Loading...</p>
                    </div>
                </div>
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
