'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, FileText, Clock, CheckCircle, Plus, Edit, Trash2, Loader2, XCircle, AlertCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  sellingPrice?: string;
  status: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

function MyPropertiesContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'pending' | 'approved' | 'rejected'>('all');
  const [properties, setProperties] = useState<{
    all: Property[];
    draft: Property[];
    pending: Property[];
    approved: Property[];
    rejected: Property[];
  }>({
    all: [],
    draft: [],
    pending: [],
    approved: [],
    rejected: [],
  });

  useEffect(() => {
    if (user) {
      fetchProperties();
    }
  }, [user]);

  // Handle success message from property submission
  useEffect(() => {
    if (searchParams.get('submitted') === 'true') {
      setShowSuccessMessage(true);
      setActiveTab('pending'); // Switch to pending tab to show the submitted property
      
      // Clear the URL parameter and hide message after 5 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
        router.replace('/my-properties', undefined);
      }, 5000);
    }
  }, [searchParams, router]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await api.get('/properties/my-properties');
      
      // Group properties by status
      const grouped = {
        all: response.data,
        draft: response.data.filter((p: Property) => p.status === 'draft'),
        pending: response.data.filter((p: Property) => p.status === 'pending'),
        approved: response.data.filter((p: Property) => p.status === 'approved'),
        rejected: response.data.filter((p: Property) => p.status === 'rejected'),
      };
      
      setProperties(grouped);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (property: Property) => {
    // Redirect to edit page using uniqueId
    router.push(`/my-properties/edit/${property.uniqueId}`);
  };

  const handleAddNew = () => {
    // Clear localStorage before adding new property
    localStorage.removeItem('currentPropertyId');
    localStorage.removeItem('propertyDraft');
    router.push('/my-properties/add');
  };

  const handleDelete = async (propertyUniqueId: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;
    
    try {
      await api.delete(`/properties/${propertyUniqueId}`);
      fetchProperties(); // Refresh list
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('Failed to delete property');
    }
  };

  const tabs = [
    { id: 'all', label: 'All', icon: Building2, count: properties.all.length },
    { id: 'draft', label: 'Draft', icon: FileText, count: properties.draft.length },
    { id: 'pending', label: 'Pending', icon: Clock, count: properties.pending.length },
    { id: 'approved', label: 'Approved', icon: CheckCircle, count: properties.approved.length },
    { id: 'rejected', label: 'Rejected', icon: XCircle, count: properties.rejected.length },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-green-800">Property Submitted Successfully!</h3>
                <p className="text-sm text-green-700 mt-1">
                  Your property has been submitted for verification. Our team will review it within 2-3 business days.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Properties</h1>
            <p className="text-gray-600 mt-2">Manage your property listings</p>
          </div>
          <button 
            onClick={handleAddNew}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Add New Property
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                    {tab.count > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : properties[activeTab].length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Building2 className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {activeTab} properties
              </h3>
              <p className="text-gray-500 mb-4">
                {activeTab === 'draft' && 'Start by adding a new property listing'}
                {activeTab === 'pending' && 'Properties submitted for verification will appear here'}
                {activeTab === 'approved' && 'Your approved properties will be listed here'}
              </p>
              {activeTab === 'draft' && (
                <button 
                  onClick={handleAddNew}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Property
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties[activeTab].map((property) => (
                <div key={property.uniqueId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      property.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                      property.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      property.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {property.propertyType}
                    </span>
                    {(activeTab === 'draft' || activeTab === 'rejected') && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(property)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit property"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {activeTab === 'draft' && (
                          <button
                            onClick={() => handleDelete(property.uniqueId)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {property.propertyTitle || 'Untitled Property'}
                  </h3>
                  
                  <div className="space-y-1 text-sm text-gray-600 mb-3">
                    <p className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {property.totalArea} {property.areaUnit}
                    </p>
                    <p>{property.city}, {property.state}</p>
                    {property.sellingPrice && (
                      <p className="font-medium text-gray-900">
                        ₹ {parseInt(property.sellingPrice).toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>

                  {/* Rejection Reason */}
                  {property.status === 'rejected' && property.rejectionReason && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-red-800 mb-1">Rejection Reason:</p>
                          <p className="text-xs text-red-700">{property.rejectionReason}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 border-t pt-2">
                    {activeTab === 'draft' ? 'Last updated' : 'Created'}: {formatDate(property.updatedAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MyPropertiesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Properties</h1>
              <p className="text-gray-600 mt-2">Loading...</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          </div>
        </div>
      </div>
    }>
      <MyPropertiesContent />
    </Suspense>
  );
}
