'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, Eye, Ban, Trash2, Loader2, Users, UserCheck, UserX, TrendingUp } from 'lucide-react';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  fullName?: string;
  role: string;
  isVerified: boolean;
  isBlocked?: boolean;
  createdAt: string;
  avatarUrl?: string;
}

interface UserStats {
  totalUsers: number;
  verifiedUsers: number;
  adminUsers: number;
  newUsers: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const response = await api.get('/admin/users');
      const userData = response.data || [];

      // Filter users based on search and role
      let filteredUsers = userData;
      
      if (searchQuery) {
        filteredUsers = filteredUsers.filter((user: User) =>
          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (user.fullName && user.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }

      if (roleFilter !== 'all') {
        filteredUsers = filteredUsers.filter((user: User) => user.role === roleFilter);
      }

      setUsers(filteredUsers);

      // Calculate stats
      const totalUsers = userData.length;
      const verifiedUsers = userData.filter((u: User) => u.isVerified).length;
      const adminUsers = userData.filter((u: User) => u.role === 'admin').length;
      const newUsers = userData.filter((u: User) => {
        const userDate = new Date(u.createdAt);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return userDate >= thirtyDaysAgo;
      }).length;

      setStats({
        totalUsers,
        verifiedUsers,
        adminUsers,
        newUsers,
      });
    } catch (error: any) {
      
      // Show user-friendly error message
      if (error.code === 'ERR_NETWORK') {
        alert('Backend server is not running. Please start the backend server.');
      } else if (error.response?.status === 401) {
        alert('Authentication failed. Please login again.');
        router.push('/admin/login');
      } else if (error.response?.status === 403) {
        alert('Access denied. Admin privileges required.');
      } else {
        alert('Failed to load users. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  const blockUser = async (userId: string) => {
    if (!confirm('Are you sure you want to block this user? They will not be able to login.')) return;
    
    setUpdating(userId);
    try {
      await api.put(`/admin/users/${userId}/block`);
      await fetchUsers();
      alert('User blocked successfully!');
    } catch (error) {
      alert('Failed to block user. Please try again.');
    } finally {
      setUpdating(null);
    }
  };

  const unblockUser = async (userId: string) => {
    setUpdating(userId);
    try {
      await api.put(`/admin/users/${userId}/unblock`);
      await fetchUsers();
      alert('User unblocked successfully!');
    } catch (error) {
      alert('Failed to unblock user. Please try again.');
    } finally {
      setUpdating(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
        <p className="text-gray-600 mt-2">Manage all registered users</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalUsers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Verified Users</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.verifiedUsers}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Admin Users</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.adminUsers}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <UserX className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New (30 days)</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.newUsers}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="all">All Roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Users className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Join Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.fullName || user.email}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {(user.fullName || user.email).charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.fullName || 'No Name'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'admin'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
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
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        {user.isBlocked ? (
                          <button
                            onClick={() => unblockUser(user.id)}
                            disabled={updating === user.id}
                            className="px-3 py-1 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition disabled:opacity-50 flex items-center gap-1"
                          >
                            <UserCheck className="w-4 h-4" />
                            {updating === user.id ? 'Unblocking...' : 'Unblock'}
                          </button>
                        ) : (
                          <button
                            onClick={() => blockUser(user.id)}
                            disabled={updating === user.id || user.role === 'admin'}
                            className="px-3 py-1 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition disabled:opacity-50 flex items-center gap-1"
                            title={user.role === 'admin' ? 'Cannot block admin users' : 'Block user'}
                          >
                            <Ban className="w-4 h-4" />
                            {updating === user.id ? 'Blocking...' : 'Block'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}