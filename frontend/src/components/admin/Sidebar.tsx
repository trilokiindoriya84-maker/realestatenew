'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  MessageSquare,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Shield,
  FileCheck,
  UserCheck,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/admin',
  },
  {
    title: 'Users',
    icon: Users,
    href: '/admin/users',
  },
  {
    title: 'User Verification',
    icon: UserCheck,
    href: '/admin/verification',
    submenu: [
      {
        title: 'Pending Requests',
        icon: Shield,
        href: '/admin/verification/pending',
      },
      {
        title: 'Verified Users',
        icon: FileCheck,
        href: '/admin/verification/approved',
      },
    ],
  },
  {
    title: 'Properties',
    icon: Building2,
    href: '/admin/properties',
    submenu: [
      {
        title: 'Draft Properties',
        icon: FileCheck,
        href: '/admin/properties/draft',
      },
      {
        title: 'Pending Approval',
        icon: Shield,
        href: '/admin/properties/pending',
      },
      {
        title: 'Approved Properties',
        icon: Building2,
        href: '/admin/properties/approved',
      },
      {
        title: 'Published Properties',
        icon: Building2,
        href: '/admin/properties/published',
      },
    ],
  },
  {
    title: 'Enquiries',
    icon: MessageSquare,
    href: '/admin/enquiries',
    submenu: [
      { 
        title: 'Pending', 
        icon: Shield,
        href: '/admin/enquiries/pending' 
      },
      { 
        title: 'All Enquiries', 
        icon: MessageSquare,
        href: '/admin/enquiries' 
      },
    ],
  },
  {
    title: 'Settings',
    icon: Settings,
    href: '/admin/settings',
  },
];

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const router = useRouter();

  const toggleSubmenu = (title: string) => {
    setOpenSubmenu(openSubmenu === title ? null : title);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      // Use client-side navigation instead of full page reload
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  return (
    <aside
      className={`${
        collapsed ? 'w-20' : 'w-64'
      } bg-gray-900 text-white min-h-screen transition-all duration-300 flex flex-col`}
    >
      {/* Logo */}
      <div className="p-6 flex items-center justify-between border-b border-gray-800">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">Profeild Admin</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-gray-800 rounded-lg transition"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* User Info */}
      {!collapsed && user && (
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user.user_metadata?.full_name || 'Admin'}
              </p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const hasSubmenu = item.submenu && item.submenu.length > 0;
          const isSubmenuOpen = openSubmenu === item.title;

          return (
            <div key={item.href}>
              {hasSubmenu ? (
                <>
                  <button
                    onClick={() => toggleSubmenu(item.title)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                    title={collapsed ? item.title : ''}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span className="font-medium">{item.title}</span>}
                    </div>
                    {!collapsed && (
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          isSubmenuOpen ? 'rotate-180' : ''
                        }`}
                      />
                    )}
                  </button>
                  
                  {/* Submenu */}
                  {!collapsed && isSubmenuOpen && item.submenu && (
                    <div className="ml-4 mt-2 space-y-1">
                      {item.submenu.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const isSubActive = pathname === subItem.href;
                        
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                              isSubActive
                                ? 'bg-blue-700 text-white'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            }`}
                          >
                            {SubIcon && <SubIcon className="w-4 h-4 flex-shrink-0" />}
                            <span>{subItem.title}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                  title={collapsed ? item.title : ''}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="font-medium">{item.title}</span>}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleSignOut}
          className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors w-full"
          title={collapsed ? 'Logout' : ''}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}