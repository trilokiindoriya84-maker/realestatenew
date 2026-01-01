'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Eye, XCircle, Loader2, Building2, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface Property {
  id: number;
  uniqueId: string;
  propertyTitle: string;
  propertyType: string;
  city: string;
  state: string;
  sellingPrice: string;
  approvedAt: string;
}

export default function ApprovedPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchApprovedProperties();
  }, []);

  const fetchApprovedProperties = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/properties?status=approved');
      setProperties(response.data);
    } catch (error) {
      console.error('Error fetching approved properties:', error);
    } finally {
      setLoading(false);
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Approved Properties</h1>
        <p className="text-gray-600 mt-2">Properties verified and published on platform</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Building2 className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500">No approved properties found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approved</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {properties.map((property) => (
                  <tr key={property.uniqueId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{property.propertyTitle}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {property.propertyType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {property.city}, {property.state}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ₹ {parseInt(property.sellingPrice).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(property.approvedAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/admin/properties/view/${property.uniqueId}`)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => router.push(`/admin/properties/publish/${property.uniqueId}`)}
                          className="text-green-600 hover:text-green-800"
                          title="Publish Property"
                        >
                          <Globe className="w-5 h-5" />
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
