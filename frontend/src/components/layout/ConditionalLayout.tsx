'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    
    // Check if current route is admin route
    const isAdminRoute = pathname?.startsWith('/admin');
    
    // For admin routes, don't show header/footer
    if (isAdminRoute) {
        return <>{children}</>;
    }
    
    // For all other routes, show header/footer
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
        </div>
    );
}