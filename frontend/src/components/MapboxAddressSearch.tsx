'use client';

import { useState, useRef, useEffect } from 'react';
import { MapPin, Search } from 'lucide-react';

interface LocationResult {
    id: string;
    place_name: string;
    center: [number, number]; // [longitude, latitude]
    place_type: string[];
    properties: {
        address?: string;
    };
    context?: Array<{
        id: string;
        text: string;
    }>;
}

interface MapboxAddressSearchProps {
    onLocationSelect: (location: { address: string; latitude: number; longitude: number }) => void;
    placeholder?: string;
    initialValue?: string;
    className?: string;
}

export default function MapboxAddressSearch({ 
    onLocationSelect, 
    placeholder = "Search for address...", 
    initialValue = "",
    className = ""
}: MapboxAddressSearchProps) {
    const [query, setQuery] = useState(initialValue);
    const [suggestions, setSuggestions] = useState<LocationResult[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState(initialValue);
    const searchRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Mapbox access token from environment
    const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    // Handle search input changes with debouncing
    const handleSearchChange = (value: string) => {
        setQuery(value);
        
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (value.trim().length < 3) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            await fetchLocationSuggestions(value.trim());
        }, 300);
    };

    // Fetch location suggestions from Mapbox
    const fetchLocationSuggestions = async (searchQuery: string) => {
        if (!MAPBOX_TOKEN) {
            console.error('Mapbox access token not found');
            return;
        }

        try {
            setIsSearching(true);
            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?` +
                `access_token=${MAPBOX_TOKEN}&` +
                `country=IN&` +
                `limit=5&` +
                `types=address,poi,place,locality,neighborhood`
            );
            
            if (response.ok) {
                const data = await response.json();
                setSuggestions(data.features || []);
                setShowSuggestions(true);
            }
        } catch (error) {
            console.error('Error fetching location suggestions:', error);
        } finally {
            setIsSearching(false);
        }
    };

    // Handle suggestion selection
    const handleSuggestionSelect = (suggestion: LocationResult) => {
        const address = suggestion.place_name;
        const [longitude, latitude] = suggestion.center;
        
        setQuery(address);
        setSelectedAddress(address);
        setShowSuggestions(false);
        
        // Call the callback with selected location
        onLocationSelect({
            address,
            latitude,
            longitude
        });
    };

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Format suggestion display
    const formatSuggestion = (suggestion: LocationResult) => {
        const parts = suggestion.place_name.split(', ');
        const mainText = parts[0];
        const subText = parts.slice(1).join(', ');
        
        return { mainText, subText };
    };

    return (
        <div className={`relative ${className}`} ref={searchRef}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                    type="text"
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onFocus={() => {
                        if (suggestions.length > 0) {
                            setShowSuggestions(true);
                        }
                    }}
                />
                {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    </div>
                )}
            </div>

            {/* Search Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
                    {suggestions.map((suggestion) => {
                        const { mainText, subText } = formatSuggestion(suggestion);
                        
                        return (
                            <button
                                key={suggestion.id}
                                onClick={() => handleSuggestionSelect(suggestion)}
                                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-start gap-3"
                            >
                                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 truncate">
                                        {mainText}
                                    </div>
                                    {subText && (
                                        <div className="text-sm text-gray-500 mt-1 truncate">
                                            {subText}
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Selected Address Display */}
            {selectedAddress && selectedAddress !== query && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-green-700">
                        <MapPin className="h-4 w-4" />
                        <span className="font-medium">Selected:</span>
                        <span className="truncate">{selectedAddress}</span>
                    </div>
                </div>
            )}
        </div>
    );
}