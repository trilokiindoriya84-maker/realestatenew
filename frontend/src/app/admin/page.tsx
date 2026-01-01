'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  MessageSquare,
  UserCheck,
  TrendingUp,
  Clock,
  CheckCircle,
  Shield,
} from 'lucide-react';
import api from '@/lib/api';

interface DashboardStats {
  totalUsers: { value: number; change: string; trend: string };
  verifiedUsers: { value: number; change: string; trend: string };
  totalProperties: { value: number; change: string; trend: string };
  totalEnquiries: { value: number; change: string; trend: string };
  pendingVerifications: { value: number; change: string; trend: string };
  approvedProperties: { value: number; change: string; trend: string };
  newUsersToday: { value: number; change: string; trend: string };
  activeListings: { value: number; change: string; trend: string };
}

interface RecentUser {
  id: string;
  email: string;
  fullName: string;
  isVerified: boolean;
  createdAt: string;
}

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testBackend();
    fetchDashboardData();
  }, []);

  const testBackend = async () => {
    try {
      await api.get('/test');
    } catch (error) {
      // Silent error handling
    }
  };

  const fetchDashboardData = async () => {
    try {
      
      // Fetch users data
      const usersResponse = await api.get('/admin/users');
      const users = usersResponse.data || [];

      // Calculate stats
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const totalUsers = users.length;
      const verifiedUsers = users.filter((u: any) => u.isVerified).length;
      const newUsersToday = users.filter((u: any) => new Date(u.createdAt) >= today).length;

      // Mock stats for now - in real app these would come from API
      const calculatedStats: DashboardStats = {
        totalUsers: { value: totalUsers, change: '+12', trend: 'up' },
        verifiedUsers: { value: verifiedUsers, change: '+8', trend: 'up' },
        totalProperties: { value: 0, change: '0', trend: 'neutral' },
        totalEnquiries: { value: 0, change: '0', trend: 'neutral' },
        pendingVerifications: { value: totalUsers - verifiedUsers, change: '', trend: 'neutral' },
        approvedProperties: { value: 0, change: '0', trend: 'neutral' },
        newUsersToday: { value: newUsersToday, change: '', trend: 'up' },
        activeListings: { value: 0, change: '0', trend: 'neutral' },
      };

      setStats(calculatedStats);
      setRecentUsers(users.slice(0, 10));
    } catch (error: any) {
      // Error handling
      
      // Set default stats on error
      const defaultStats: DashboardStats = {
        totalUsers: { value: 0, change: '0', trend: 'neutral' },
        verifiedUsers: { value: 0, change: '0', trend: 'neutral' },
        totalProperties: { value: 0, change: '0', trend: 'neutral' },
        totalEnquiries: { value: 0, change: '0', trend: 'neutral' },
        pendingVerifications: { value: 0, change: '0', trend: 'neutral' },
        approvedProperties: { value: 0, change: '0', trend: 'neutral' },
        newUsersToday: { value: 0, change: '0', trend: 'neutral' },
        activeListings: { value: 0, change: '0', trend: 'neutral' },
      };
      
      setStats(defaultStats);
      setRecentUsers([]);
    } finally {
      setLoading(false);
    }
  };
  
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6">
                <div className="h-12 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statsConfig = stats ? [
    {
      title: 'Total Users',
      value: formatNumber(stats.totalUsers.value),
      change: `${stats.totalUsers.change >= '0' ? '+' : ''}${stats.totalUsers.change}%`,
      icon: Users,
      color: 'bg-blue-500',
      trend: stats.totalUsers.trend,
    },
    {
      title: 'Verified Users',
      value: formatNumber(stats.verifiedUsers.value),
      change: `${stats.verifiedUsers.change >= '0' ? '+' : ''}${stats.verifiedUsers.change}%`,
      icon: UserCheck,
      color: 'bg-green-500',
      trend: stats.verifiedUsers.trend,
    },
    {
      title: 'Total Properties',
      value: formatNumber(stats.totalProperties.value),
      change: `${stats.totalProperties.change >= '0' ? '+' : ''}${stats.totalProperties.change}%`,
      icon: Building2,
      color: 'bg-purple-500',
      trend: stats.totalProperties.trend,
    },
    {
      title: 'Total Enquiries',
      value: formatNumber(stats.totalEnquiries.value),
      change: `${stats.totalEnquiries.change >= '0' ? '+' : ''}${stats.totalEnquiries.change}%`,
      icon: MessageSquare,
      color: 'bg-orange-500',
      trend: stats.totalEnquiries.trend,
    },
    {
      title: 'Pending Verifications',
      value: stats.pendingVerifications.value.toString(),
      change: '',
      icon: Clock,
      color: 'bg-yellow-500',
      trend: 'neutral',
    },
    {
      title: 'Approved Properties',
      value: stats.approvedProperties.value.toString(),
      change: '',
      icon: CheckCircle,
      color: 'bg-emerald-500',
      trend: 'up',
    },
    {
      title: 'New Users Today',
      value: stats.newUsersToday.value.toString(),
      change: '',
      icon: TrendingUp,
      color: 'bg-cyan-500',
      trend: 'up',
    },
    {
      title: 'Active Listings',
      value: stats.activeListings.value.toString(),
      change: `${stats.activeListings.change >= '0' ? '+' : ''}${stats.activeListings.change}%`,
      icon: Shield,
      color: 'bg-pink-500',
      trend: stats.activeListings.trend,
    },
  ] : [];
  
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your real estate platform.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsConfig.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                {stat.change && (
                  <span
                    className={`text-sm font-medium ${
                      stat.trend === 'up' ? 'text-green-600' : 
                      stat.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                    }`}
                  >
                    {stat.change}
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-sm text-gray-600">{stat.title}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Users */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Recent Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                recentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {(user.fullName || user.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.fullName || 'No Name'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.isVerified
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {user.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}