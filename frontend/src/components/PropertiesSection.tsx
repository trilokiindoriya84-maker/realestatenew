'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, MapPin, Maximize2, Bed, Bath, Heart, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

interface PublishedProperty {
    uniqueId: string;
    slug: string;
    propertyTitle: string;
    propertyDescription: string | null;
    propertyType: string;
    city: string;
    state: string;
    locality: string;
    totalArea: string;
    areaUnit: string;
    sellingPrice: string;
    priceType: string;
    publishedPhotos: string[] | null;
    bedrooms: string | null;
    bathrooms: string | null;
    publishedAt: Date | null;
}

interface PropertiesSectionProps {
    initialProperties: PublishedProperty[];
}

export default function PropertiesSection({ initialProperties }: PropertiesSectionProps) {
    const router = useRouter();
    const { user } = useAuth();
    const [properties, setProperties] = useState<PublishedProperty[]>(initialProperties);
    const [savedProperties, setSavedProperties] = useState<Set<string>>(new Set());
    const [loadingSavedProperties, setLoadingSavedProperties] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        if (user) {
            fetchSavedProperties();
        } else {
            // Clear saved properties when user logs out
            setSavedProperties(new Set());
        }
    }, [user]);

    const fetchSavedProperties = async () => {
        if (loadingSavedProperties) return; // Prevent multiple simultaneous calls
        
        try {
            setLoadingSavedProperties(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
                return;
            }

            const response = await fetch(`${API_BASE_URL}/saved-properties/ids`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                // The API returns an array of property IDs directly
                const savedIds = new Set<string>(data);
                setSavedProperties(savedIds);
            } else {
                console.error('Failed to fetch saved properties:', response.status, response.statusText);
                // Retry once if it fails
                if (response.status === 401) {
                    // Token might be expired, try refreshing
                    const { data: { session: newSession } } = await supabase.auth.refreshSession();
                    if (newSession?.access_token) {
                        const retryResponse = await fetch(`${API_BASE_URL}/saved-properties/ids`, {
                            headers: {
                                'Authorization': `Bearer ${newSession.access_token}`,
                            },
                        });
                        if (retryResponse.ok) {
                            const retryData = await retryResponse.json();
                            const savedIds = new Set<string>(retryData);
                            setSavedProperties(savedIds);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching saved properties:', error);
        } finally {
            setLoadingSavedProperties(false);
        }
    };

    const loadMoreProperties = async () => {
        if (loadingMore) return;
        
        try {
            setLoadingMore(true);
            const response = await fetch(`${API_BASE_URL}/public/published-properties?limit=16&random=true`);
            
            if (response.ok) {
                const newProperties = await response.json();
                // Filter out properties that are already displayed to avoid duplicates
                const existingIds = new Set(properties.map(p => p.uniqueId));
                const uniqueNewProperties = newProperties.filter((p: PublishedProperty) => !existingIds.has(p.uniqueId));
                
                setProperties(prev => [...prev, ...uniqueNewProperties]);
            } else {
                console.error('Failed to load more properties:', response.status);
            }
        } catch (error) {
            console.error('Error loading more properties:', error);
        } finally {
            setLoadingMore(false);
        }
    };

    const handleSaveToggle = async (e: React.MouseEvent, propertyUniqueId: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            router.push('/login');
            return;
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const isSaved = savedProperties.has(propertyUniqueId);

            if (!session?.access_token) {
                console.error('No access token available');
                alert('Please login again');
                router.push('/login');
                return;
            }

            if (isSaved) {
                // Unsave
                const response = await fetch(`${API_BASE_URL}/saved-properties/${propertyUniqueId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                    },
                });

                if (response.ok) {
                    setSavedProperties(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(propertyUniqueId);
                        return newSet;
                    });
                } else {
                    const errorData = await response.json();
                    console.error('Unsave failed:', errorData);
                    // Refresh saved properties to ensure consistency
                    fetchSavedProperties();
                }
            } else {
                // Save
                const response = await fetch(`${API_BASE_URL}/saved-properties`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({ propertyUniqueId }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setSavedProperties(prev => new Set(prev).add(propertyUniqueId));
                } else {
                    const errorData = await response.json();
                    console.error('Save failed:', errorData);
                    alert(`Failed to save: ${errorData.message || 'Unknown error'}`);
                    // Refresh saved properties to ensure consistency
                    fetchSavedProperties();
                }
            }
        } catch (error) {
            console.error('Error toggling save:', error);
            alert(`Error: ${error}`);
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

    if (properties.length === 0) {
        return null;
    }

    return (
        <section className="py-20 bg-white">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Featured Properties
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                        Explore our handpicked selection of verified properties
                    </p>
                </div>

                {/* Properties Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {properties.map((property) => {
                        const propertyUrl = getPropertyUrl(property.slug, property.uniqueId);
                        
                        return (
                            <Link
                                key={property.uniqueId}
                                href={propertyUrl}
                                className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100"
                            >
                                {/* Property Image */}
                                <div className="relative h-48 overflow-hidden bg-gray-100">
                                    <img
                                        src={getPropertyImage(property.publishedPhotos)}
                                        alt={property.propertyTitle}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        loading="lazy"
                                    />
                                    {/* Property Type Badge */}
                                    <div className="absolute top-3 left-3">
                                        <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                                            <Building2 className="w-3 h-3" />
                                            {property.propertyType}
                                        </div>
                                    </div>
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
                                    <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                                        {property.propertyTitle}
                                    </h3>

                                    {/* Location */}
                                    <div className="flex items-start gap-1.5 text-gray-600 mb-3">
                                        <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        <span className="text-sm line-clamp-1">
                                            {property.locality}, {property.city}
                                        </span>
                                    </div>

                                    {/* Property Details */}
                                    <div className="flex items-center justify-between text-sm text-gray-600 border-t border-gray-100 pt-3">
                                        <div className="flex items-center gap-4">
                                            {/* Area */}
                                            <div className="flex items-center gap-1">
                                                <Maximize2 className="w-4 h-4" />
                                                <span className="font-medium">{property.totalArea} {property.areaUnit}</span>
                                            </div>

                                            {/* Bedrooms - Only for House/Apartment */}
                                            {property.bedrooms && (
                                                <div className="flex items-center gap-1">
                                                    <Bed className="w-4 h-4" />
                                                    <span className="font-medium">{property.bedrooms}</span>
                                                </div>
                                            )}

                                            {/* Bathrooms - Only for House/Apartment */}
                                            {property.bathrooms && (
                                                <div className="flex items-center gap-1">
                                                    <Bath className="w-4 h-4" />
                                                    <span className="font-medium">{property.bathrooms}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Save Button */}
                                        <button
                                            onClick={(e) => handleSaveToggle(e, property.uniqueId)}
                                            className={`p-1.5 rounded-full transition-colors ${
                                                savedProperties.has(property.uniqueId)
                                                    ? 'text-red-600 hover:bg-red-50'
                                                    : 'text-gray-400 hover:bg-gray-100 hover:text-red-600'
                                            }`}
                                            title={savedProperties.has(property.uniqueId) ? 'Unsave' : 'Save'}
                                        >
                                            <Heart 
                                                className={`w-5 h-5 ${savedProperties.has(property.uniqueId) ? 'fill-current' : ''}`} 
                                            />
                                        </button>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Show More Button */}
                <div className="text-center">
                    <button
                        onClick={loadMoreProperties}
                        disabled={loadingMore}
                        className="inline-flex items-center space-x-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loadingMore ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                <span>Loading...</span>
                            </>
                        ) : (
                            <>
                                <Plus className="w-5 h-5" />
                                <span>Show More Properties</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </section>
    );
}