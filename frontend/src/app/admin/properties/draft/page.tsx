'use client';

import { useState, useEffect } from 'react';
import { FileText, Eye, Trash2, Loader2, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface Property {
  id: number;
  uniqueId: string;
  propertyTitle: string;
  propertyType: string;
  city: string;
  state: string;
  totalArea: string;
  areaUnit: string;
  createdAt: string;
  userId: string;
}

interface User {
  fullName: string;
  email: string;
}

export default function DraftPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchDraftProperties();
  }, []);

  const fetchDraftProperties = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/properties?status=draft');
      setProperties(response.data);
    } catch (error) {
      console.error('Error fetching draft properties:', error);
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
        <h1 className="text-3xl font-bold text-gray-900">Draft Properties</h1>
        <p className="text-gray-600 mt-2">Properties saved as draft by users</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <FileText className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500">No draft properties found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {properties.map((property) => (
                  <tr key={property.uniqueId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{property.propertyTitle || 'Untitled'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {property.propertyType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {property.city}, {property.state}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {property.totalArea} {property.areaUnit}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(property.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => router.push(`/admin/properties/view/${property.uniqueId}`)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
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
