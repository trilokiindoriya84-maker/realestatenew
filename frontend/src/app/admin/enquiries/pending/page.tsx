'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Phone, Clock, CheckCircle, XCircle, Loader2, Eye } from 'lucide-react';
import api from '@/lib/api';

interface Enquiry {
  uniqueId: string;
  propertyUniqueId: string;
  name: string;
  mobile: string;
  message: string;
  status: string;
  createdAt: string;
}

export default function PendingEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchPendingEnquiries();
  }, []);

  const fetchPendingEnquiries = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/enquiries/pending');
      setEnquiries(response.data);
    } catch (error) {
      console.error('Error fetching pending enquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (uniqueId: string, status: string) => {
    try {
      await api.put(`/admin/enquiries/${uniqueId}/status`, { status });
      // Remove from list or update status
      setEnquiries(enquiries.filter(e => e.uniqueId !== uniqueId));
      alert(`Enquiry marked as ${status}`);
    } catch (error) {
      console.error('Error updating enquiry status:', error);
      alert('Failed to update enquiry status');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Pending Enquiries</h1>
        <p className="text-gray-600 mt-2">New enquiries waiting for response</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : enquiries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Mail className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500">No pending enquiries</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {enquiries.map((enquiry) => (
                  <tr key={enquiry.uniqueId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{enquiry.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-900">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {enquiry.mobile}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 font-mono">{enquiry.propertyUniqueId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {enquiry.message || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        {formatDate(enquiry.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/admin/enquiries/${enquiry.uniqueId}`)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => updateStatus(enquiry.uniqueId, 'contacted')}
                          className="text-green-600 hover:text-green-800"
                          title="Mark as Contacted"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => updateStatus(enquiry.uniqueId, 'closed')}
                          className="text-red-600 hover:text-red-800"
                          title="Close Enquiry"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
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
