'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AdminSidebar from '@/components/admin/Sidebar';
import { Loader2 } from 'lucide-react';

const ADMIN_EMAIL = 'trilokiindoriya@gmail.com';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [verifying, setVerifying] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const verifyAdmin = async () => {
      // Skip verification for login page
      if (pathname === '/admin/login') {
        setVerifying(false);
        return;
      }

      if (authLoading) return;

      if (!user) {
        router.push('/admin/login');
        return;
      }

      // Check if user email matches admin email
      if (user.email === ADMIN_EMAIL) {
        setIsAdmin(true);
      } else {
        router.push('/admin/login');
      }

      setVerifying(false);
    };

    verifyAdmin();
  }, [user, authLoading, router, pathname]);

  // Show login page without layout
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Show loading state
  if (authLoading || verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Show nothing if not admin (will redirect)
  if (!isAdmin) {
    return null;
  }

  // Show admin panel
  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}