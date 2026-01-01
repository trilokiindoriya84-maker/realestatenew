'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, MapPin, Maximize2, Bed, Loader2, Heart, Trash2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

interface SavedProperty {
  uniqueId: string;
  slug: string;
  propertyTitle: string;
  propertyType: string;
  city: string;
  locality: string;
  totalArea: string;
  areaUnit: string;
  sellingPrice: string;
  publishedPhotos: string[] | null;
  bedrooms: string | null;
  savedAt: Date;
}

export default function SavedPropertiesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [properties, setProperties] = useState<SavedProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSavedProperties();
    }
  }, [user]);

  const fetchSavedProperties = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.error('No access token available');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/saved-properties`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProperties(data);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch saved properties:', errorData);
      }
    } catch (error) {
      console.error('Error fetching saved properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (propertyUniqueId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.error('No access token available');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/saved-properties/${propertyUniqueId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        setProperties(properties.filter(p => p.uniqueId !== propertyUniqueId));
      }
    } catch (error) {
      console.error('Error unsaving property:', error);
    }
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

  const getPropertyImage = (photos: string[] | null) => {
    if (photos && photos.length > 0) {
      return photos[0];
    }
    return 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80';
  };

  const getPropertyUrl = (slug: string, uniqueId: string) => {
    return `/${slug}/p/${uniqueId}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Saved Properties</h1>
          <p className="text-gray-600 mt-1">Properties you have saved for later</p>
        </div>
      </div>

      {properties.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Saved Properties</h3>
          <p className="text-gray-600 mb-6">You haven't saved any properties yet</p>
          <Link
            href="/"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Browse Properties
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => {
            const propertyUrl = getPropertyUrl(property.slug, property.uniqueId);

            return (
              <div
                key={property.uniqueId}
                className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
              >
                {/* Property Image */}
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  <Link href={propertyUrl}>
                    <img
                      src={getPropertyImage(property.publishedPhotos)}
                      alt={property.propertyTitle}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </Link>
                  {/* Property Type Badge */}
                  <div className="absolute top-3 left-3">
                    <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {property.propertyType}
                    </div>
                  </div>
                  {/* Unsave Button */}
                  <button
                    onClick={() => handleUnsave(property.uniqueId)}
                    className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                  {/* Price Badge */}
                  <div className="absolute bottom-3 right-3">
                    <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg">
                      <span className="text-blue-600 font-bold text-sm">
                        {formatPrice(property.sellingPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Property Info */}
                <div className="p-4">
                  {/* Title */}
                  <Link href={propertyUrl}>
                    <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {property.propertyTitle}
                    </h3>
                  </Link>

                  {/* Location */}
                  <div className="flex items-start gap-1.5 text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span className="text-sm line-clamp-1">
                      {property.locality}, {property.city}
                    </span>
                  </div>

                  {/* Property Details */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 border-t border-gray-100 pt-3">
                    {/* Area */}
                    <div className="flex items-center gap-1">
                      <Maximize2 className="w-4 h-4" />
                      <span className="font-medium">{property.totalArea} {property.areaUnit}</span>
                    </div>

                    {/* Bedrooms */}
                    {property.bedrooms && (
                      <div className="flex items-center gap-1">
                        <Bed className="w-4 h-4" />
                        <span className="font-medium">{property.bedrooms}</span>
                      </div>
                    )}
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
