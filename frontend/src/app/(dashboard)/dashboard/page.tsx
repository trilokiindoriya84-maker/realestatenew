
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    AlertCircle, Upload, Home, Plus, BadgeCheck, Loader2, 
    Building2, TrendingUp, Eye, CheckCircle2, 
    FileText, Shield, Sparkles, Mail, Heart, Clock
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function DashboardPage() {
    const { user, userProfile: cachedProfile } = useAuth();
    const [userProfile, setUserProfile] = useState<any>(cachedProfile);
    const [loadingProfile, setLoadingProfile] = useState(!cachedProfile);
    const [loadingStats, setLoadingStats] = useState(true);
    const [propertyStats, setPropertyStats] = useState({
        total: 0,
        approved: 0,
        myEnquiries: 0,
        savedProperties: 0
    });

    // Fetch profile ONLY on mount, not on visibility change
    useEffect(() => {
        if (!user) return;
        
        const fetchUserProfile = async () => {
            try {
                setLoadingProfile(true);
                const { data } = await api.get(`/users/profile?t=${Date.now()}`);
                setUserProfile(data);
            } catch (e) {
                setUserProfile({ 
                    isVerified: false, 
                    verificationStatus: 'unverified',
                    rejectionReason: null 
                });
            } finally {
                setLoadingProfile(false);
            }
        };
        
        fetchUserProfile();
    }, [user]); // Only runs when user changes, not on every mount

    // Fetch all stats in parallel for faster loading
    useEffect(() => {
        if (!user) return;

        const fetchStats = async () => {
            try {
                setLoadingStats(true);
                
                // Fetch all data in parallel using Promise.allSettled
                const [propertiesResult, enquiriesResult, savedResult] = await Promise.allSettled([
                    api.get('/properties/my-properties'),
                    api.get('/enquiries/my-enquiries'),
                    api.get('/saved-properties')
                ]);

                // Extract data from results
                const properties = propertiesResult.status === 'fulfilled' ? propertiesResult.value.data : [];
                const enquiries = enquiriesResult.status === 'fulfilled' ? enquiriesResult.value.data : [];
                const saved = savedResult.status === 'fulfilled' ? savedResult.value.data : [];

                const stats = {
                    total: properties.length,
                    approved: properties.filter((p: any) => p.status === 'approved').length,
                    myEnquiries: enquiries.length,
                    savedProperties: saved.length
                };
                
                setPropertyStats(stats);
            } catch (e) {
                console.error('Failed to fetch stats:', e);
            } finally {
                setLoadingStats(false);
            }
        };

        fetchStats();
    }, [user]);

    const isVerified = userProfile?.isVerified || userProfile?.verificationStatus === 'verified';
    const isPending = userProfile?.verificationStatus === 'pending';
    const isRejected = userProfile?.verificationStatus === 'rejected';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
            <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
                {/* Welcome Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
                            Welcome Back!
                            {isVerified && <BadgeCheck className="text-blue-600 w-8 h-8" />}
                        </h1>
                        <p className="text-slate-600 mt-2 text-lg">
                            {user?.user_metadata?.full_name || user?.email}
                        </p>
                    </div>
                    <Link href="/my-properties/add">
                        <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all">
                            <Plus className="w-5 h-5 mr-2" />
                            List New Property
                        </Button>
                    </Link>
                </div>

                {/* Verification Status Card */}
                {loadingProfile ? (
                    <Card className="border-slate-200 shadow-md">
                        <CardContent className="p-6 flex items-center gap-4">
                            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                            <div>
                                <h3 className="font-semibold text-slate-700">Loading verification status...</h3>
                                <p className="text-sm text-slate-500">Please wait...</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : isVerified ? (
                    <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-md">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-green-100 rounded-full">
                                    <BadgeCheck className="w-6 h-6 text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-green-900 flex items-center gap-2">
                                        Verification Approved
                                        <Sparkles className="w-5 h-5 text-green-600" />
                                    </h3>
                                    <p className="text-green-700 mt-1">
                                        Your identity has been verified! You can now list properties and connect with buyers.
                                    </p>
                                    <div className="flex flex-wrap gap-3 mt-4">
                                        <Link href="/my-properties/add">
                                            <Button className="bg-green-600 hover:bg-green-700 shadow-md">
                                                <Plus className="w-4 h-4 mr-2" />
                                                List Property
                                            </Button>
                                        </Link>
                                        <Link href="/my-properties">
                                            <Button variant="outline" className="border-green-600 text-green-700 hover:bg-green-50">
                                                <Home className="w-4 h-4 mr-2" />
                                                My Properties
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className={`shadow-md ${
                        isRejected ? 'border-red-200 bg-gradient-to-r from-red-50 to-rose-50' :
                        isPending ? 'border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50' :
                        'border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50'
                    }`}>
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-full ${
                                    isRejected ? 'bg-red-100' :
                                    isPending ? 'bg-blue-100' :
                                    'bg-amber-100'
                                }`}>
                                    <AlertCircle className={`w-6 h-6 ${
                                        isRejected ? 'text-red-600' :
                                        isPending ? 'text-blue-600' :
                                        'text-amber-600'
                                    }`} />
                                </div>
                                <div className="flex-1">
                                    <h3 className={`text-xl font-bold ${
                                        isRejected ? 'text-red-900' :
                                        isPending ? 'text-blue-900' :
                                        'text-amber-900'
                                    }`}>
                                        {isRejected ? 'Verification Rejected' :
                                         isPending ? 'Verification Under Review' :
                                         'Complete Your Verification'}
                                    </h3>
                                    <p className={`mt-1 ${
                                        isRejected ? 'text-red-700' :
                                        isPending ? 'text-blue-700' :
                                        'text-amber-700'
                                    }`}>
                                        {isRejected ? (
                                            `Reason: ${userProfile?.rejectionReason || 'Documents unclear'}. Please re-upload your documents.`
                                        ) : isPending ? (
                                            "Your documents are being reviewed by our team. You'll be notified once approved (usually within 24-48 hours)."
                                        ) : (
                                            "To start listing properties, please complete your identity verification with Aadhar and PAN documents."
                                        )}
                                    </p>
                                    {!isPending && (
                                        <Link href="/verification">
                                            <Button 
                                                variant="outline" 
                                                className={`mt-4 ${
                                                    isRejected ? 'border-red-600 text-red-700 hover:bg-red-50' :
                                                    'border-amber-600 text-amber-700 hover:bg-amber-50'
                                                }`}
                                            >
                                                <Upload className="w-4 h-4 mr-2" />
                                                {isRejected ? 'Re-upload Documents' : 'Start Verification'}
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Property Stats Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-slate-200 hover:shadow-lg transition-shadow cursor-pointer bg-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">Total Properties</CardTitle>
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Building2 className="h-5 w-5 text-blue-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loadingStats ? (
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            ) : (
                                <>
                                    <div className="text-3xl font-bold text-slate-900">{propertyStats.total}</div>
                                    <Link href="/my-properties">
                                        <p className="text-xs text-blue-600 hover:underline mt-2 flex items-center gap-1">
                                            View all <Eye className="w-3 h-3" />
                                        </p>
                                    </Link>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 hover:shadow-lg transition-shadow cursor-pointer bg-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">Approved</CardTitle>
                            <div className="p-2 bg-green-100 rounded-lg">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loadingStats ? (
                                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                            ) : (
                                <>
                                    <div className="text-3xl font-bold text-green-600">{propertyStats.approved}</div>
                                    <p className="text-xs text-slate-500 mt-2">Live on platform</p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Link href="/my-enquiries">
                        <Card className="border-slate-200 hover:shadow-lg transition-shadow cursor-pointer bg-white">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-slate-600">My Enquiries</CardTitle>
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Mail className="h-5 w-5 text-purple-600" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                {loadingStats ? (
                                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                                ) : (
                                    <>
                                        <div className="text-3xl font-bold text-purple-600">{propertyStats.myEnquiries}</div>
                                        <p className="text-xs text-slate-500 mt-2">Property enquiries</p>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/saved">
                        <Card className="border-slate-200 hover:shadow-lg transition-shadow cursor-pointer bg-white">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-slate-600">Saved Properties</CardTitle>
                                <div className="p-2 bg-pink-100 rounded-lg">
                                    <Heart className="h-5 w-5 text-pink-600" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                {loadingStats ? (
                                    <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
                                ) : (
                                    <>
                                        <div className="text-3xl font-bold text-pink-600">{propertyStats.savedProperties}</div>
                                        <p className="text-xs text-slate-500 mt-2">Saved for later</p>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                {/* Quick Actions & Info Cards */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Quick Actions Card */}
                    <Card className="border-slate-200 shadow-md bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5" />
                                Quick Actions
                            </CardTitle>
                            <CardDescription className="text-blue-100">
                                Get started with these actions
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Link href="/my-properties/add">
                                <Button variant="secondary" className="w-full justify-start bg-white/20 hover:bg-white/30 text-white border-white/30">
                                    <Plus className="w-4 h-4 mr-2" />
                                    List New Property
                                </Button>
                            </Link>
                            <Link href="/my-properties">
                                <Button variant="secondary" className="w-full justify-start bg-white/20 hover:bg-white/30 text-white border-white/30">
                                    <Home className="w-4 h-4 mr-2" />
                                    My Properties
                                </Button>
                            </Link>
                            <Link href="/my-enquiries">
                                <Button variant="secondary" className="w-full justify-start bg-white/20 hover:bg-white/30 text-white border-white/30">
                                    <Mail className="w-4 h-4 mr-2" />
                                    My Enquiries
                                </Button>
                            </Link>
                            <Link href="/saved">
                                <Button variant="secondary" className="w-full justify-start bg-white/20 hover:bg-white/30 text-white border-white/30">
                                    <Heart className="w-4 h-4 mr-2" />
                                    Saved Properties
                                </Button>
                            </Link>
                            {!isVerified && (
                                <Link href="/verification">
                                    <Button variant="secondary" className="w-full justify-start bg-white/20 hover:bg-white/30 text-white border-white/30">
                                        <BadgeCheck className="w-4 h-4 mr-2" />
                                        Complete Verification
                                    </Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>

                    {/* Security Card */}
                    <Card className="border-slate-200 shadow-md bg-white">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-slate-900">
                                <Shield className="w-5 h-5 text-green-600" />
                                Secure Platform
                            </CardTitle>
                            <CardDescription>
                                Your safety is our priority
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-slate-600">
                            <div className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span>All properties verified by legal team</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span>Document verification for all users</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span>Secure payment processing</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Performance Card */}
                    <Card className="border-slate-200 shadow-md bg-white">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-slate-900">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                                Platform Stats
                            </CardTitle>
                            <CardDescription>
                                Growing community
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm text-slate-600">Active Listings</span>
                                    <span className="text-sm font-semibold text-slate-900">1,234+</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2">
                                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm text-slate-600">Verified Users</span>
                                    <span className="text-sm font-semibold text-slate-900">5,678+</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2">
                                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
