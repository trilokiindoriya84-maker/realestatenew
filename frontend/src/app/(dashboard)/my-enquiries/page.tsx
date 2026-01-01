'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Phone,
  Clock,
  Loader2,
  Building2,
  ExternalLink,
  MessageSquare,
  MapPin,
  Calendar,
} from 'lucide-react';
import api from '@/lib/api';

interface Enquiry {
  enquiry: {
    uniqueId: string;
    propertyUniqueId: string;
    name: string;
    mobile: string;
    message: string;
    status: string;
    createdAt: string;
  };
  property: {
    uniqueId: string;
    slug: string;
    propertyTitle: string;
    propertyType: string;
    city: string;
    state: string;
    sellingPrice: string;
    publishedPhotos: string[] | null;
  } | null;
}

export default function MyEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchMyEnquiries();
  }, []);

  const fetchMyEnquiries = async () => {
    try {
      setLoading(true);
      const response = await api.get('/enquiries/my-enquiries');
      setEnquiries(response.data);
    } catch (error) {
      console.error('Error fetching enquiries:', error);
    } finally {
      setLoading(false);
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

  const formatPrice = (price: string) => {
    const numPrice = parseInt(price);
    if (numPrice >= 10000000) {
      return `₹${(numPrice / 10000000).toFixed(2)} Cr`;
    } else if (numPrice >= 100000) {
      return `₹${(numPrice / 100000).toFixed(2)} Lac`;
    } else {
      return `₹${numPrice.toLocaleString('en-IN')}`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'contacted':
        return 'bg-blue-100 text-blue-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Enquiries</h1>
        <p className="text-gray-600 mt-2">Track all your property enquiries</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : enquiries.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12">
          <div className="flex flex-col items-center justify-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Enquiries Yet</h3>
            <p className="text-gray-500 text-center mb-6">
              You haven't made any property enquiries yet.
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Properties
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {enquiries.map((item) => {
            const { enquiry, property } = item;
            
            if (!property) {
              return null;
            }

            return (
              <div
                key={enquiry.uniqueId}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6">
                  {/* Property Image */}
                  <div className="md:col-span-3">
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
                      {property.publishedPhotos && property.publishedPhotos.length > 0 ? (
                        <img
                          src={property.publishedPhotos[0]}
                          alt={property.propertyTitle}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Building2 className="w-12 h-12 text-gray-300" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Property & Enquiry Details */}
                  <div className="md:col-span-6 space-y-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {property.propertyTitle}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{property.city}, {property.state}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        {property.propertyType}
                      </span>
                      <span className="text-lg font-bold text-blue-600">
                        {formatPrice(property.sellingPrice)}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-gray-100">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Your Enquiry</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{enquiry.mobile}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(enquiry.createdAt)}</span>
                        </div>
                        {enquiry.message && (
                          <div className="flex items-start gap-2 text-gray-600">
                            <MessageSquare className="w-4 h-4 mt-0.5" />
                            <span className="line-clamp-2">{enquiry.message}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="md:col-span-3 flex flex-col justify-between items-end">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        enquiry.status
                      )}`}
                    >
                      {enquiry.status.charAt(0).toUpperCase() + enquiry.status.slice(1)}
                    </span>

                    <button
                      onClick={() =>
                        window.open(`/${property.slug}/p/${property.uniqueId}`, '_blank')
                      }
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Property
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
