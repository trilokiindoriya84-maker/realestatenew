import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import PropertyCard from '../../components/PropertyCard';
import apiClient from '../../services/api.service';
import { Property } from '../../types/property.types';

interface LocationSuggestion {
  type: 'property' | 'mapbox';
  id: string;
  display_name: string;
  subtitle?: string;
  place_type_display?: string;
  city?: string;
  locality?: string;
  state?: string;
  pincode?: string;
  property_count?: number;
  avg_price?: number;
  coordinates?: [number, number];
  place_type?: string;
  full_address?: string;
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

export const SearchScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<SearchResponse['pagination'] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);



  // Filter states
  const [filters, setFilters] = useState<SearchFilters>({
    location: '',
    city: '',
    locality: '',
    state: '',
    pincode: '',
    propertyType: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    bathrooms: '',
    minArea: '',
    maxArea: '',
  });

  // Initialize with route params if any
  useEffect(() => {
    const params = route.params as any;
    console.log('SearchScreen route params:', params);
    
    if (params?.location) {
      setSearchQuery(params.location);
      setFilters(prev => ({ ...prev, location: params.location }));
      fetchSearchResults(1, { ...filters, location: params.location });
    } else if (params?.city) {
      const displayLocation = params.locality ? `${params.locality}, ${params.city}` : params.city;
      setSearchQuery(displayLocation);
      setFilters(prev => ({ 
        ...prev, 
        city: params.city, 
        locality: params.locality || '',
        state: params.state || ''
      }));
      fetchSearchResults(1, { 
        ...filters, 
        city: params.city, 
        locality: params.locality || '',
        state: params.state || ''
      });
    } else {
      // Load random properties when no search is performed
      console.log('No search params, loading random properties...');
      fetchSearchResults(1, filters);
    }
  }, [route.params]);

  // Handle search input changes with debouncing
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      await fetchLocationSuggestions(value.trim());
    }, 300);
  };

  // Fetch location suggestions from backend
  const fetchLocationSuggestions = async (query: string) => {
    try {
      setIsSearching(true);
      console.log('Fetching location suggestions for:', query);
      const response = await apiClient.get(`/search/locations?q=${encodeURIComponent(query)}`);
      
      console.log('Location suggestions response:', response.data);
      
      if (response.data.success) {
        console.log('Suggestions found:', response.data.data.length);
        setSuggestions(response.data.data || []);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: LocationSuggestion) => {
    setSearchQuery(suggestion.display_name);
    setShowSuggestions(false);
    
    // Update filters based on suggestion type
    let newFilters = { ...filters };
    if (suggestion.type === 'property') {
      if (suggestion.city) newFilters.city = suggestion.city;
      if (suggestion.locality) newFilters.locality = suggestion.locality;
      if (suggestion.state) newFilters.state = suggestion.state;
      if (suggestion.pincode) newFilters.pincode = suggestion.pincode;
      newFilters.location = '';
    } else {
      // For Mapbox results, use the clean display name for search
      newFilters.location = suggestion.display_name;
      newFilters.city = '';
      newFilters.locality = '';
      newFilters.state = '';
      newFilters.pincode = '';
    }
    
    setFilters(newFilters);
    fetchSearchResults(1, newFilters);
  };

  // Handle search form submission
  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      const newFilters = { ...filters, location: searchQuery.trim() };
      setFilters(newFilters);
      fetchSearchResults(1, newFilters);
    }
  };

  // Fetch search results
  const fetchSearchResults = async (page = 1, searchFilters = filters, append = false) => {
    try {
      setLoading(true);
      setShowSuggestions(false); // Hide suggestions when fetching results
      
      const params = new URLSearchParams();
      
      // Add all filters to params
      Object.entries(searchFilters).forEach(([key, value]) => {
        if (value && value.trim()) {
          params.append(key, value);
        }
      });
      
      params.append('page', page.toString());
      params.append('limit', '16'); // Load 16 properties at a time

      console.log('Fetching search results with URL:', `/search/properties?${params.toString()}`);
      const response = await apiClient.get(`/search/properties?${params.toString()}`);
      
      console.log('Search response:', response.data);
      
      if (response.data.success) {
        console.log('Properties found:', response.data.data.length);
        console.log('First property structure:', response.data.data[0]);
        
        if (append && page > 1) {
          // Append new properties to existing ones
          setProperties(prev => [...prev, ...response.data.data]);
        } else {
          // Replace properties with new results
          setProperties(response.data.data);
        }
        
        setPagination(response.data.pagination);
        setCurrentPage(page);
      } else {
        console.error('Search failed - no success flag');
        if (!append) {
          setProperties([]);
          setPagination(null);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      if (!append) {
        setProperties([]);
        setPagination(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // Update filter
  const updateFilter = (key: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [key]: value || '' };
    setFilters(newFilters);
  };

  // Load more properties
  const loadMoreProperties = () => {
    if (pagination && pagination.hasNext && !loading) {
      fetchSearchResults(currentPage + 1, filters, true);
    }
  };

  // Apply filters
  const applyFilters = () => {
    setShowFilters(false);
    fetchSearchResults(1, filters);
  };

  // Clear all filters
  const clearFilters = () => {
    const clearedFilters = {
      location: filters.location, // Keep location
      city: filters.city, // Keep city
      locality: filters.locality, // Keep locality
      state: filters.state, // Keep state
      pincode: '',
      propertyType: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      bathrooms: '',
      minArea: '',
      maxArea: '',
    };
    setFilters(clearedFilters);
    fetchSearchResults(1, clearedFilters);
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

  // Render suggestion item
  const renderSuggestion = ({ item }: { item: LocationSuggestion }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionSelect(item)}
    >
      <Icon name="location-on" size={16} color="#9CA3AF" style={styles.suggestionIcon} />
      <View style={styles.suggestionContent}>
        <Text style={styles.suggestionTitle}>{item.display_name}</Text>
        {item.type === 'property' && item.property_count && (
          <Text style={styles.suggestionSubtitle}>
            {item.property_count} properties
          </Text>
        )}
        {item.type === 'mapbox' && (
          <Text style={styles.suggestionSubtitle}>
            {item.subtitle && <Text>{item.subtitle}</Text>}
            {item.place_type_display && (
              <Text style={item.subtitle ? { marginLeft: 8 } : {}}>
                {item.subtitle ? ' • ' : ''}{item.place_type_display}
              </Text>
            )}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  // Render property item
  const renderProperty = ({ item }: { item: Property }) => {
    console.log('Rendering property:', item);
    
    try {
      return (
        <PropertyCard
          property={item}
          onPress={() => (navigation as any).navigate('PropertyDetails', { propertyId: item.uniqueId })}
          onSave={() => {}} // TODO: Add save functionality
          isSaved={false} // TODO: Add saved state
          showSaveButton={true}
        />
      );
    } catch (error) {
      console.error('Error rendering PropertyCard:', error);
      return (
        <View style={{ padding: 16, backgroundColor: '#ffebee', margin: 8, borderRadius: 8 }}>
          <Text style={{ color: '#c62828' }}>Error rendering property: {item.uniqueId}</Text>
          <Text style={{ color: '#666', fontSize: 12 }}>{String(error)}</Text>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Search */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Icon name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search locations..."
              value={searchQuery}
              onChangeText={handleSearchChange}
              onSubmitEditing={handleSearchSubmit}
              onBlur={() => {
                // Hide suggestions when input loses focus (with small delay to allow suggestion tap)
                setTimeout(() => setShowSuggestions(false), 150);
              }}
              returnKeyType="search"
            />
            {isSearching && (
              <ActivityIndicator size="small" color="#3B82F6" style={styles.searchLoader} />
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Icon name="tune" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}

      {/* Search Results */}
      <TouchableOpacity 
        style={styles.content} 
        activeOpacity={1}
        onPress={() => setShowSuggestions(false)}
      >
        {/* Search Header */}
        <View style={styles.searchHeader}>
          <Text style={styles.searchTitle}>
            Properties in {getSearchLocation()}
          </Text>
          {pagination && (
            <Text style={styles.searchCount}>
              {pagination.total} properties found
            </Text>
          )}
        </View>

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Searching properties...</Text>
          </View>
        )}

        {/* Properties List */}
        {!loading && properties.length > 0 && (
          <View>
            <FlatList
              data={properties}
              renderItem={renderProperty}
              keyExtractor={(item) => item.uniqueId}
              contentContainerStyle={styles.propertiesList}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false} // Disable FlatList scrolling to allow parent scroll
            />
            
            {/* Show More Button */}
            {pagination && pagination.hasNext && (
              <View style={styles.showMoreContainer}>
                <TouchableOpacity
                  style={styles.showMoreButton}
                  onPress={loadMoreProperties}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Icon name="expand-more" size={20} color="#FFFFFF" />
                      <Text style={styles.showMoreText}>Show More Properties</Text>
                    </>
                  )}
                </TouchableOpacity>
                
                {pagination && (
                  <Text style={styles.paginationInfo}>
                    Showing {properties.length} of {pagination.total} properties
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* No Results */}
        {!loading && properties.length === 0 && (
          <View style={styles.noResultsContainer}>
            <Icon name="location-off" size={64} color="#D1D5DB" />
            <Text style={styles.noResultsTitle}>
              {searchQuery ? 'No properties found' : 'No properties available'}
            </Text>
            <Text style={styles.noResultsText}>
              {searchQuery 
                ? 'Try adjusting your search filters or search for a different location.'
                : 'Properties will appear here when they are available.'
              }
            </Text>
            {searchQuery && (
              <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
                <Text style={styles.clearFiltersText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

      </TouchableOpacity>

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowFilters(false)}
      >
        <SafeAreaView style={styles.filtersModal}>
          <View style={styles.filtersHeader}>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Icon name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.filtersTitle}>Filters</Text>
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filtersContent}>
            {/* Property Type */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Property Type</Text>
              <View style={styles.filterOptions}>
                {['', 'House', 'Apartment', 'Plot', 'Land', 'Farm'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.filterOption,
                      filters.propertyType === type && styles.filterOptionSelected
                    ]}
                    onPress={() => updateFilter('propertyType', type)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.propertyType === type && styles.filterOptionTextSelected
                    ]}>
                      {type || 'All Types'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Pincode */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Pincode</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="e.g., 452010"
                value={filters.pincode}
                onChangeText={(value) => updateFilter('pincode', value)}
                maxLength={6}
                keyboardType="numeric"
              />
              <Text style={styles.filterHint}>Enter 6-digit pincode</Text>
            </View>

            {/* Price Range */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Price Range</Text>
              <View style={styles.filterRow}>
                <TextInput
                  style={[styles.filterInput, styles.filterInputHalf]}
                  placeholder="Min Price"
                  value={filters.minPrice}
                  onChangeText={(value) => updateFilter('minPrice', value)}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.filterInput, styles.filterInputHalf]}
                  placeholder="Max Price"
                  value={filters.maxPrice}
                  onChangeText={(value) => updateFilter('maxPrice', value)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Bedrooms */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Bedrooms</Text>
              <View style={styles.filterOptions}>
                {['', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map((bedroom) => (
                  <TouchableOpacity
                    key={bedroom}
                    style={[
                      styles.filterOption,
                      filters.bedrooms === bedroom && styles.filterOptionSelected
                    ]}
                    onPress={() => updateFilter('bedrooms', bedroom)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.bedrooms === bedroom && styles.filterOptionTextSelected
                    ]}>
                      {bedroom ? `${bedroom} BHK` : 'Any'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Bathrooms */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Bathrooms</Text>
              <View style={styles.filterOptions}>
                {['', '1', '2', '3', '4', '5+'].map((bathroom) => (
                  <TouchableOpacity
                    key={bathroom}
                    style={[
                      styles.filterOption,
                      filters.bathrooms === bathroom && styles.filterOptionSelected
                    ]}
                    onPress={() => updateFilter('bathrooms', bathroom)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.bathrooms === bathroom && styles.filterOptionTextSelected
                    ]}>
                      {bathroom || 'Any'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Area Range */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Area Range (sq ft)</Text>
              <View style={styles.filterRow}>
                <TextInput
                  style={[styles.filterInput, styles.filterInputHalf]}
                  placeholder="Min Area"
                  value={filters.minArea}
                  onChangeText={(value) => updateFilter('minArea', value)}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.filterInput, styles.filterInputHalf]}
                  placeholder="Max Area"
                  value={filters.maxArea}
                  onChangeText={(value) => updateFilter('maxArea', value)}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.filtersFooter}>
            <TouchableOpacity style={styles.applyFiltersButton} onPress={applyFilters}>
              <Text style={styles.applyFiltersText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  searchContainer: {
    flex: 1,
    marginRight: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  searchLoader: {
    marginLeft: 8,
  },
  filterButton: {
    padding: 8,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 80, // Position below the header
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    maxHeight: 300,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionsList: {
    maxHeight: 300,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  suggestionIcon: {
    marginTop: 2,
    marginRight: 12,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  suggestionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  searchHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  searchCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  propertiesList: {
    paddingVertical: 16,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  noResultsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  clearFiltersButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
  },
  clearFiltersText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    marginHorizontal: 8,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  paginationButtonTextDisabled: {
    color: '#9CA3AF',
  },
  paginationInfo: {
    fontSize: 14,
    color: '#6B7280',
    marginHorizontal: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  showMoreContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    gap: 8,
  },
  showMoreText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  filtersModal: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  clearAllText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
  filtersContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  filterGroup: {
    marginVertical: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    marginBottom: 8,
  },
  filterOptionSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  filterOptionTextSelected: {
    color: '#FFFFFF',
  },
  filterInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#374151',
    backgroundColor: '#FFFFFF',
  },
  filterInputHalf: {
    flex: 1,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  filtersFooter: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  applyFiltersButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyFiltersText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});