'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Bed, Bath, Square, Filter, Heart } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface Property {
    uniqueId: string;
    slug: string;
    propertyTitle: string;
    propertyType: string;
    city: string;
    locality: string;
    state: string;
    sellingPrice: string;
    totalArea: string;
    areaUnit: string;
    bedrooms?: string;
    bathrooms?: string;
    publishedPhotos: string[];
    publishedAt: string;
}

interface SearchFilters {
    location: string;
    city: string;
    locality: string;
    state: string;
    pincode: string;
    propertyType: string;
    minPrice: string;
    maxPrice: string;
    bedrooms: string;
    bathrooms: string;
    minArea: string;
    maxArea: string;
}

interface SearchResponse {
    success: boolean;
    data: Property[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    filters: SearchFilters;
}

function SearchContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<SearchResponse['pagination'] | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const [savedProperties, setSavedProperties] = useState<Set<string>>(new Set());
    const [loadingSavedProperties, setLoadingSavedProperties] = useState(false);
    
    // Fetch saved properties when user is available
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
            console.log('Fetching saved properties...');
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
                console.log('No session token available');
                return;
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/saved-properties/ids`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Saved properties response:', data);
                // The API returns an array of property IDs directly
                const savedIds = new Set<string>(data);
                console.log('Saved property IDs:', Array.from(savedIds));
                setSavedProperties(savedIds);
            } else {
                console.error('Failed to fetch saved properties:', response.status, response.statusText);
                // Retry once if it fails
                if (response.status === 401) {
                    // Token might be expired, try refreshing
                    const { data: { session: newSession } } = await supabase.auth.refreshSession();
                    if (newSession?.access_token) {
                        const retryResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/saved-properties/ids`, {
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

    const handleSaveToggle = async (e: React.MouseEvent, propertyUniqueId: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            // Show a more user-friendly message before redirecting
            if (confirm('Please login to save properties. Would you like to go to the login page?')) {
                router.push('/login');
            }
            return;
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const isSaved = savedProperties.has(propertyUniqueId);

            if (!session?.access_token) {
                console.error('No access token available');
                if (confirm('Your session has expired. Please login again.')) {
                    router.push('/login');
                }
                return;
            }

            if (isSaved) {
                // Unsave
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/saved-properties/${propertyUniqueId}`, {
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
                    alert('Failed to remove from saved properties. Please try again.');
                    // Refresh saved properties to ensure consistency
                    fetchSavedProperties();
                }
            } else {
                // Save
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/saved-properties`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({ propertyUniqueId }),
                });

                if (response.ok) {
                    setSavedProperties(prev => new Set(prev).add(propertyUniqueId));
                } else {
                    const errorData = await response.json();
                    console.error('Save failed:', errorData);
                    alert(`Failed to save property: ${errorData.message || 'Please try again'}`);
                    // Refresh saved properties to ensure consistency
                    fetchSavedProperties();
                }
            }
        } catch (error) {
            console.error('Error toggling save:', error);
            alert('An error occurred. Please check your connection and try again.');
        }
    };

    // Filter states - ensure all values are always strings to prevent controlled/uncontrolled issues
    const [filters, setFilters] = useState<SearchFilters>({
        location: searchParams.get('location') || '',
        city: searchParams.get('city') || '',
        locality: searchParams.get('locality') || '',
        state: searchParams.get('state') || '',
        pincode: searchParams.get('pincode') || '',
        propertyType: searchParams.get('propertyType') || '',
        minPrice: searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('maxPrice') || '',
        bedrooms: searchParams.get('bedrooms') || '',
        bathrooms: searchParams.get('bathrooms') || '',
        minArea: searchParams.get('minArea') || '',
        maxArea: searchParams.get('maxArea') || '',
    });

    // Update filters when URL parameters change
    useEffect(() => {
        const newFilters: SearchFilters = {
            location: searchParams.get('location') || '',
            city: searchParams.get('city') || '',
            locality: searchParams.get('locality') || '',
            state: searchParams.get('state') || '',
            pincode: searchParams.get('pincode') || '',
            propertyType: searchParams.get('propertyType') || '',
            minPrice: searchParams.get('minPrice') || '',
            maxPrice: searchParams.get('maxPrice') || '',
            bedrooms: searchParams.get('bedrooms') || '',
            bathrooms: searchParams.get('bathrooms') || '',
            minArea: searchParams.get('minArea') || '',
            maxArea: searchParams.get('maxArea') || '',
        };
        
        // Only update if filters actually changed
        const filtersChanged = Object.keys(newFilters).some(
            key => newFilters[key as keyof SearchFilters] !== filters[key as keyof SearchFilters]
        );
        
        if (filtersChanged) {
            setFilters(newFilters);
            setCurrentPage(1); // Reset to first page when filters change
        }
    }, [searchParams]); // Remove filters from dependency array to prevent infinite loops

    // Fetch search results
    const fetchSearchResults = async (page = 1) => {
        try {
            setLoading(true);
            
            const params = new URLSearchParams();
            
            // Add all filters to params
            Object.entries(filters).forEach(([key, value]) => {
                if (value && value.trim()) {
                    params.set(key, value);
                }
            });
            
            params.set('page', page.toString());
            params.set('limit', '20');

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/search/properties?${params.toString()}`);
            
            if (response.ok) {
                const data: SearchResponse = await response.json();
                setProperties(data.data);
                setPagination(data.pagination);
            } else {
                console.error('Search failed with status:', response.status);
                setProperties([]);
                setPagination(null);
            }
        } catch (error) {
            console.error('Search error:', error);
            setProperties([]);
            setPagination(null);
        } finally {
            setLoading(false);
        }
    };

    // Initial load and when filters change
    useEffect(() => {
        fetchSearchResults(1);
        setCurrentPage(1);
    }, [filters]);

    // Handle filter changes - ensure values are always strings
    const updateFilter = (key: keyof SearchFilters, value: string) => {
        setFilters(prev => ({
            ...prev,
            [key]: value || '' // Ensure value is never undefined
        }));
    };

    // Clear all filters - ensure values are always strings
    const clearFilters = () => {
        setFilters({
            location: searchParams.get('location') || '',
            city: searchParams.get('city') || '',
            locality: searchParams.get('locality') || '',
            state: searchParams.get('state') || '',
            pincode: '',
            propertyType: '',
            minPrice: '',
            maxPrice: '',
            bedrooms: '',
            bathrooms: '',
            minArea: '',
            maxArea: '',
        });
    };

    // Format price for display
    const formatPrice = (price: string) => {
        const num = parseInt(price);
        if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
        if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
        return `₹${num.toLocaleString()}`;
    };

    // Get search location display
    const getSearchLocation = () => {
        if (filters.locality && filters.city) {
            return `${filters.locality}, ${filters.city}`;
        }
        if (filters.city) {
            return filters.city;
        }
        if (filters.location) {
            return filters.location;
        }
        return 'All Locations';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-6">
                {/* Search Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Properties in {getSearchLocation()}
                    </h1>
                    {pagination && (
                        <p className="text-gray-600">
                            {pagination.total} properties found
                        </p>
                    )}
                </div>

                <div className="flex gap-6">
                    {/* Filters Sidebar */}
                    <div className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-80 bg-white rounded-lg shadow-sm p-6 h-fit`}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Filters</h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                className="text-blue-600 hover:text-blue-700"
                            >
                                Clear All
                            </Button>
                        </div>

                        <div className="space-y-6">
                            {/* Property Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Property Type
                                </label>
                                <select
                                    value={filters.propertyType || ''}
                                    onChange={(e) => updateFilter('propertyType', e.target.value)}
                                    className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
                                >
                                    <option value="">All Types</option>
                                    <option value="House">House</option>
                                    <option value="Apartment">Apartment</option>
                                    <option value="Plot">Plot</option>
                                    <option value="Land">Land</option>
                                    <option value="Farm">Farm</option>
                                </select>
                            </div>

                            {/* Pincode */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Pincode
                                </label>
                                <Input
                                    type="text"
                                    placeholder="e.g., 452010"
                                    value={filters.pincode || ''}
                                    onChange={(e) => updateFilter('pincode', e.target.value)}
                                    maxLength={6}
                                    className="w-full"
                                />
                                <p className="text-xs text-gray-500 mt-1">Enter 6-digit pincode</p>
                            </div>

                            {/* Price Range */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Price Range
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Input
                                        type="number"
                                        placeholder="Min Price"
                                        value={filters.minPrice || ''}
                                        onChange={(e) => updateFilter('minPrice', e.target.value)}
                                    />
                                    <Input
                                        type="number"
                                        placeholder="Max Price"
                                        value={filters.maxPrice || ''}
                                        onChange={(e) => updateFilter('maxPrice', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Bedrooms */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Bedrooms
                                </label>
                                <select
                                    value={filters.bedrooms || ''}
                                    onChange={(e) => updateFilter('bedrooms', e.target.value)}
                                    className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
                                >
                                    <option value="">Any</option>
                                    <option value="1">1 BHK</option>
                                    <option value="2">2 BHK</option>
                                    <option value="3">3 BHK</option>
                                    <option value="4">4 BHK</option>
                                    <option value="5+">5+ BHK</option>
                                </select>
                            </div>

                            {/* Bathrooms */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Bathrooms
                                </label>
                                <select
                                    value={filters.bathrooms || ''}
                                    onChange={(e) => updateFilter('bathrooms', e.target.value)}
                                    className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
                                >
                                    <option value="">Any</option>
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                    <option value="4">4</option>
                                    <option value="5+">5+</option>
                                </select>
                            </div>

                            {/* Area Range */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Area Range (sq ft)
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Input
                                        type="number"
                                        placeholder="Min Area"
                                        value={filters.minArea || ''}
                                        onChange={(e) => updateFilter('minArea', e.target.value)}
                                    />
                                    <Input
                                        type="number"
                                        placeholder="Max Area"
                                        value={filters.maxArea || ''}
                                        onChange={(e) => updateFilter('maxArea', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        {/* Mobile Filter Toggle */}
                        <div className="lg:hidden mb-4">
                            <Button
                                variant="outline"
                                onClick={() => setShowFilters(!showFilters)}
                                className="w-full"
                            >
                                <Filter className="h-4 w-4 mr-2" />
                                {showFilters ? 'Hide Filters' : 'Show Filters'}
                            </Button>
                        </div>

                        {/* Loading State */}
                        {loading && (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {[...Array(6)].map((_, i) => (
                                    <Card key={i} className="animate-pulse">
                                        <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                                        <CardContent className="p-4">
                                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {/* Properties Grid */}
                        {!loading && properties.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {properties.map((property) => (
                                    <div key={property.uniqueId} className="relative">
                                        <Link
                                            href={`/${property.slug}/p/${property.uniqueId}`}
                                            className="block"
                                        >
                                            <Card className="hover:shadow-lg transition-shadow duration-200">
                                                <div className="relative h-48 overflow-hidden rounded-t-lg">
                                                    <img
                                                        src={property.publishedPhotos?.[0] || '/placeholder-property.jpg'}
                                                        alt={property.propertyTitle}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <Badge className="absolute top-2 left-2 bg-blue-600 text-white">
                                                        {property.propertyType}
                                                    </Badge>
                                                    {/* Save Button - Always visible, prompts login if needed */}
                                                    <button
                                                        onClick={(e) => handleSaveToggle(e, property.uniqueId)}
                                                        className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-sm transition-all duration-200 ${
                                                            user && savedProperties.has(property.uniqueId)
                                                                ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg'
                                                                : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-600 shadow-md'
                                                        }`}
                                                        title={
                                                            !user 
                                                                ? 'Login to save properties' 
                                                                : savedProperties.has(property.uniqueId) 
                                                                    ? 'Remove from saved' 
                                                                    : 'Save property'
                                                        }
                                                    >
                                                        <Heart 
                                                            className={`w-4 h-4 transition-all ${
                                                                user && savedProperties.has(property.uniqueId) ? 'fill-current' : ''
                                                            }`} 
                                                        />
                                                    </button>
                                                </div>
                                                <CardContent className="p-4">
                                                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                                                        {property.propertyTitle}
                                                    </h3>
                                                    
                                                    <div className="flex items-center text-gray-600 mb-2">
                                                        <MapPin className="h-4 w-4 mr-1" />
                                                        <span className="text-sm truncate">
                                                            {property.locality}, {property.city}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                                        {property.bedrooms && (
                                                            <div className="flex items-center">
                                                                <Bed className="h-4 w-4 mr-1" />
                                                                {property.bedrooms}
                                                            </div>
                                                        )}
                                                        {property.bathrooms && (
                                                            <div className="flex items-center">
                                                                <Bath className="h-4 w-4 mr-1" />
                                                                {property.bathrooms}
                                                            </div>
                                                        )}
                                                        <div className="flex items-center">
                                                            <Square className="h-4 w-4 mr-1" />
                                                            {property.totalArea} {property.areaUnit}
                                                        </div>
                                                    </div>

                                                    <div className="text-xl font-bold text-blue-600">
                                                        {formatPrice(property.sellingPrice)}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* No Results */}
                        {!loading && properties.length === 0 && (
                            <div className="text-center py-12">
                                <div className="text-gray-400 mb-4">
                                    <MapPin className="h-16 w-16 mx-auto" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    No properties found
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    Try adjusting your search filters or search for a different location.
                                </p>
                                <Button onClick={clearFilters} variant="outline">
                                    Clear Filters
                                </Button>
                            </div>
                        )}

                        {/* Pagination */}
                        {pagination && pagination.totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-8">
                                <Button
                                    variant="outline"
                                    disabled={!pagination.hasPrev}
                                    onClick={() => {
                                        const newPage = currentPage - 1;
                                        setCurrentPage(newPage);
                                        fetchSearchResults(newPage);
                                    }}
                                >
                                    Previous
                                </Button>
                                
                                <span className="px-4 py-2 text-sm text-gray-600">
                                    Page {pagination.page} of {pagination.totalPages}
                                </span>
                                
                                <Button
                                    variant="outline"
                                    disabled={!pagination.hasNext}
                                    onClick={() => {
                                        const newPage = currentPage + 1;
                                        setCurrentPage(newPage);
                                        fetchSearchResults(newPage);
                                    }}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        }>
            <SearchContent />
        </Suspense>
    );
}