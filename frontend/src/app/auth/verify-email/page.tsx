'use client';

import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Mail, CheckCircle2, RefreshCw } from 'lucide-react';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const email = searchParams.get('email');
    const [resending, setResending] = useState(false);
    const [resent, setResent] = useState(false);

    const resendEmail = async () => {
        if (!email) return;
        
        setResending(true);
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                }
            });
            
            if (!error) {
                setResent(true);
            }
        } catch (error) {
            console.error('Error resending email:', error);
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4 py-12 bg-slate-50">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-sm border border-slate-200">
                <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <Mail className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Check your email</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        We've sent a verification link to
                    </p>
                    <p className="font-medium text-slate-900">{email}</p>
                </div>

                <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-blue-800">
                                <p className="font-medium mb-1">Next steps:</p>
                                <ol className="list-decimal list-inside space-y-1">
                                    <li>Check your email inbox</li>
                                    <li>Click the verification link</li>
                                    <li>You'll be redirected to your dashboard</li>
                                </ol>
                            </div>
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="text-sm text-slate-500 mb-3">
                            Didn't receive the email?
                        </p>
                        
                        {resent ? (
                            <p className="text-sm text-green-600 font-medium">
                                ✓ Verification email sent successfully!
                            </p>
                        ) : (
                            <Button
                                variant="outline"
                                onClick={resendEmail}
                                disabled={resending}
                                className="w-full"
                            >
                                {resending ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    'Resend verification email'
                                )}
                            </Button>
                        )}
                    </div>
                </div>

                <div className="text-center">
                    <Link 
                        href="/login" 
                        className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                    >
                        Back to sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4 py-12 bg-slate-50">
                <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-sm border border-slate-200">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                            <Mail className="w-8 h-8 text-blue-600" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Loading...</h1>
                        <p className="mt-2 text-sm text-slate-600">Please wait</p>
                    </div>
                </div>
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}