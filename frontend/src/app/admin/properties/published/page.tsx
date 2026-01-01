'use client';

import { useState, useEffect } from 'react';
import { Globe, Eye, Edit, Loader2, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface PublishedProperty {
  uniqueId: string; // Published property uniqueId
  originalPropertyUniqueId?: string; // Original property uniqueId (camelCase)
  original_property_unique_id?: string; // Original property uniqueId (snake_case - fallback)
  propertyTitle: string;
  propertyType: string;
  city: string;
  state: string;
  sellingPrice: string;
  isLive: boolean;
  publishedAt: string;
  slug: string;
}

export default function PublishedPropertiesPage() {
  const [properties, setProperties] = useState<PublishedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchPublishedProperties();
  }, []);

  const fetchPublishedProperties = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/published-properties');
      setProperties(response.data);
    } catch (error) {
      console.error('Error fetching published properties:', error);
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

  const toggleLiveStatus = async (property: PublishedProperty, currentStatus: boolean) => {
    // Get the original property unique ID (try both camelCase and snake_case)
    const originalUniqueId = property.originalPropertyUniqueId || property.original_property_unique_id;
    
    console.log('toggleLiveStatus called with:', { 
      originalUniqueId, 
      currentStatus,
      propertyKeys: Object.keys(property)
    });
    
    if (!originalUniqueId) {
      console.error('originalUniqueId is undefined! Property:', property);
      alert('Error: Property ID is missing');
      return;
    }
    
    try {
      const action = currentStatus ? 'unpublish' : 'publish';
      await api.post(`/admin/published-properties/${originalUniqueId}/${action}`);
      
      // Update local state
      setProperties(properties.map(prop => 
        prop.uniqueId === property.uniqueId
          ? { ...prop, isLive: !currentStatus }
          : prop
      ));
      
      alert(`Property ${currentStatus ? 'unpublished' : 'published'} successfully!`);
    } catch (error) {
      console.error('Error toggling live status:', error);
      alert('Failed to update property status');
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Published Properties</h1>
        <p className="text-gray-600 mt-2">Properties published for public viewing on website</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Building2 className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500">No published properties found</p>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Published</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {properties.map((property) => (
                  <tr key={property.uniqueId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{property.propertyTitle}</div>
                      <div className="text-xs text-gray-500">/{property.slug}</div>
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
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          property.isLive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {property.isLive ? 'Live' : 'Draft'}
                        </span>
                        
                        {/* Toggle Switch */}
                        <button
                          onClick={() => toggleLiveStatus(property, property.isLive)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            property.isLive ? 'bg-green-600' : 'bg-gray-300'
                          }`}
                          title={property.isLive ? 'Click to unpublish' : 'Click to publish'}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              property.isLive ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {property.publishedAt ? formatDate(property.publishedAt) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const originalId = property.originalPropertyUniqueId || property.original_property_unique_id;
                            if (originalId) {
                              router.push(`/admin/properties/publish/${originalId}`);
                            } else {
                              alert('Error: Property ID is missing');
                            }
                          }}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit Published Details"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        {property.isLive && (
                          <a
                            href={`/${property.slug}/p/${property.uniqueId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-800"
                            title="View Live Property"
                          >
                            <Eye className="w-5 h-5" />
                          </a>
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