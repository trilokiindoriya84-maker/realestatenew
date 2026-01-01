'use client';

import { useState, useEffect } from 'react';
import { Shield, Eye, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface VerificationRequest {
  id: string;
  email: string;
  fullName: string;
  verificationStatus: string;
  isVerified: boolean;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  verificationDetails?: {
    fullName: string;
    fatherName: string;
    motherName: string;
    dateOfBirth: string;
    mobile: string;
    alternateMobile?: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    aadharNumber: string;
    panNumber: string;
    photoUrl: string;
    aadharFrontUrl: string;
    aadharBackUrl?: string;
    panCardUrl?: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    verifiedAt?: string;
  };
}

export default function ApprovedVerificationsPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/verification/requests');
      const data = response.data || [];
      // Show only verified requests
      const verifiedRequests = data.filter((u: any) => u.verificationStatus === 'verified');
      setRequests(verifiedRequests);
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK') {
        setError('Backend server is not running. Please start the backend server.');
      } else if (error.response?.status === 401) {
        setError('Authentication failed. Please login again.');
      } else if (error.response?.status === 403) {
        setError('Access denied. Admin privileges required.');
      } else {
        setError(error.response?.data?.message || error.message || 'Failed to fetch verification requests');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading approved verifications...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-red-600 gap-4">
          <AlertTriangle className="w-12 h-12" />
          <p className="text-lg font-medium">{error}</p>
          <button
            onClick={fetchRequests}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Approved Verifications</h1>
        <p className="text-gray-600 mt-2">View all verified users</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Verified</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{requests.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Verified Today</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {requests.filter(r => {
                  const today = new Date().toDateString();
                  const requestDate = new Date(r.updatedAt).toDateString();
                  return requestDate === today;
                }).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {requests.filter(r => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  const requestDate = new Date(r.updatedAt);
                  return requestDate >= weekAgo;
                }).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Approved Users Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Verified Users</h2>
        </div>
        
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Verified Users Yet</h3>
            <p className="text-gray-500">Approved users will appear here</p>
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
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verified On
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-green-600">
                            {(request.verificationDetails?.fullName || request.fullName || request.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            {request.verificationDetails?.fullName || request.fullName || 'No Name'}
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="text-sm text-gray-500">{request.email}</div>
                          {request.verificationDetails && (
                            <div className="text-xs text-gray-400 mt-1">
                              Father: {request.verificationDetails.fatherName}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {request.verificationDetails ? (
                        <div className="text-sm">
                          <div className="text-gray-900">{request.verificationDetails.mobile}</div>
                          {request.verificationDetails.alternateMobile && (
                            <div className="text-gray-500 text-xs">{request.verificationDetails.alternateMobile}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {request.verificationDetails ? (
                        <div className="text-sm">
                          <div className="text-gray-900">{request.verificationDetails.city}</div>
                          <div className="text-gray-500 text-xs">{request.verificationDetails.state}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.updatedAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/verification/${request.id}`}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Link>
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
