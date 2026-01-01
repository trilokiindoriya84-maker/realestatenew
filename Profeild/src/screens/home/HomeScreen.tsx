import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PropertyCard from '../../components/PropertyCard';
import BottomNavigation from '../../components/BottomNavigation';
import { PropertyService } from '../../services/property.service';
import { SupabaseAuthService } from '../../services/supabase.service';
import apiClient from '../../services/api.service';
import { Property } from '../../types/property.types';
import { API_ENDPOINTS } from '../../utils/constants';

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

const HomeScreen = () => {
  const navigation = useNavigation();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedTab, setSelectedTab] = useState('Buy');
  const [favoritePressed, setFavoritePressed] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [savedProperties, setSavedProperties] = useState<Set<string>>(new Set());
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const propertyTabs = ['Buy', 'Rent', 'Commercial', 'Plots'];

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const data = await PropertyService.getPublishedProperties(20);
      setProperties(data);
    } catch (error: any) {
      console.error('Error fetching properties:', error);
      Alert.alert('Error', 'Failed to load properties. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkAuthState = async () => {
    try {
      const currentUser = await SupabaseAuthService.getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        loadSavedProperties();
      }
    } catch (error) {
      // No user logged in
      setUser(null);
    }
  };

  const loadSavedProperties = async () => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.SAVED_PROPERTIES}/ids`);
      if (response.data && Array.isArray(response.data)) {
        const savedIds = new Set(response.data);
        setSavedProperties(savedIds);
      }
    } catch (error) {
      console.error('Error loading saved properties:', error);
    }
  };

  const handleSaveProperty = async (propertyId: string) => {
    if (!user) {
      Alert.alert(
        'Login Required',
        'Please login to save properties',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.navigate('Login' as never) },
        ]
      );
      return;
    }

    try {
      const isSaved = savedProperties.has(propertyId);
      
      if (isSaved) {
        // Unsave
        await apiClient.delete(`${API_ENDPOINTS.SAVED_PROPERTIES}/${propertyId}`);
        setSavedProperties(prev => {
          const newSet = new Set(prev);
          newSet.delete(propertyId);
          return newSet;
        });
        Alert.alert('Success', 'Property removed from saved list');
      } else {
        // Save
        await apiClient.post(API_ENDPOINTS.SAVED_PROPERTIES, { propertyUniqueId: propertyId });
        setSavedProperties(prev => new Set(prev).add(propertyId));
        Alert.alert('Success', 'Property saved successfully');
      }
    } catch (error) {
      console.error('Error saving/unsaving property:', error);
      Alert.alert('Error', 'Failed to update saved properties');
    }
  };

  useEffect(() => {
    fetchProperties();
    checkAuthState();

    // Listen to auth state changes
    const { data: { subscription } } = SupabaseAuthService.onAuthStateChange((_, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const handlePropertyPress = (property: Property) => {
    (navigation as any).navigate('PropertyDetails', { propertyId: property.uniqueId });
  };

  const handleAccountPress = () => {
    if (user) {
      navigation.navigate('Dashboard' as never);
    } else {
      navigation.navigate('Login' as never);
    }
  };

  // Handle search input changes with debouncing
  const handleSearchChange = (value: string) => {
    setSearchText(value);
    
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
      const response = await apiClient.get(`/search/locations?q=${encodeURIComponent(query)}`);
      
      if (response.data.success) {
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
    setSearchText('');
    setShowSuggestions(false);
    
    // Navigate to search screen with selected location
    if (suggestion.type === 'property') {
      (navigation as any).navigate('Search', {
        city: suggestion.city,
        locality: suggestion.locality,
        state: suggestion.state,
        pincode: suggestion.pincode,
      });
    } else {
      (navigation as any).navigate('Search', {
        location: suggestion.display_name,
      });
    }
  };

  // Handle search form submission
  const handleSearchSubmit = () => {
    if (searchText.trim()) {
      const query = searchText.trim();
      setSearchText('');
      setShowSuggestions(false);
      (navigation as any).navigate('Search', { location: query });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#666" />
        <Text style={styles.loadingText}>Loading properties...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={Platform.OS === 'ios' ? ['top'] : []}
    >
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />

      {/* Header - Profeild with Icon & Buttons */}
      <View style={styles.header}>
        <View style={styles.headerLogoContainer}>
          <Image 
            source={require('../../assets/headerlogo.png')} 
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => setFavoritePressed(!favoritePressed)}
          >
            <Icon 
              name={favoritePressed ? "favorite" : "favorite-border"} 
              size={28} 
              color="#666" 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={handleAccountPress}
          >
            {user?.user_metadata?.avatar_url ? (
              <Image
                source={{ uri: user.user_metadata.avatar_url }}
                style={styles.profileImage}
              />
            ) : (
              <Icon 
                name={user ? "person" : "person-outline"} 
                size={28} 
                color="#666" 
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity 
          activeOpacity={1}
          onPress={() => setShowSuggestions(false)}
          style={{ flex: 1 }}
        >
        {/* Search Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchBox}>
            <View style={styles.searchInputContainer}>
              <Icon name="location-on" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                placeholder="Search location or landmark..."
                placeholderTextColor="#999"
                style={styles.searchInput}
                value={searchText}
                onChangeText={handleSearchChange}
                onSubmitEditing={handleSearchSubmit}
                onFocus={() => {
                  if (suggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                onBlur={() => {
                  // Hide suggestions when input loses focus (with small delay to allow suggestion tap)
                  setTimeout(() => setShowSuggestions(false), 150);
                }}
                returnKeyType="search"
              />
              {isSearching && (
                <ActivityIndicator size="small" color="#F36F21" style={styles.searchLoader} />
              )}
            </View>
            <TouchableOpacity style={styles.searchButton} onPress={handleSearchSubmit}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
          
          {/* Search Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <ScrollView style={styles.suggestionsList} keyboardShouldPersistTaps="handled">
                {suggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={`${suggestion.id}-${index}`}
                    style={styles.suggestionItem}
                    onPress={() => handleSuggestionSelect(suggestion)}
                  >
                    <Icon name="location-on" size={16} color="#9CA3AF" style={styles.suggestionIcon} />
                    <View style={styles.suggestionContent}>
                      <Text style={styles.suggestionTitle}>{suggestion.display_name}</Text>
                      {suggestion.type === 'property' && suggestion.property_count && (
                        <Text style={styles.suggestionSubtitle}>
                          {suggestion.property_count} properties
                        </Text>
                      )}
                      {suggestion.type === 'mapbox' && (
                        <Text style={styles.suggestionSubtitle}>
                          {suggestion.subtitle && <Text>{suggestion.subtitle}</Text>}
                          {suggestion.place_type_display && (
                            <Text style={suggestion.subtitle ? { marginLeft: 8 } : {}}>
                              {suggestion.subtitle ? ' • ' : ''}{suggestion.place_type_display}
                            </Text>
                          )}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Tabs Section */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
            {propertyTabs.map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setSelectedTab(tab)}
                style={[styles.tabItem, selectedTab === tab && styles.tabItemActive]}
              >
                <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.tabDropdown}>
              <Icon name="keyboard-arrow-down" size={24} color="#666" />
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Banner Section */}
        <View style={styles.bannerContainer}>
          <Image
            source={require('../../../raj2.png')}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        </View>

        {/* Property List */}
        <View style={styles.listContainer}>
          {properties.length > 0 ? (
            properties.map((property) => (
              <PropertyCard
                key={property.uniqueId}
                property={property}
                onPress={() => handlePropertyPress(property)}
                onSave={handleSaveProperty}
                isSaved={savedProperties.has(property.uniqueId)}
                showSaveButton={true}
              />
            ))
          ) : (
            [1, 2, 3].map((item) => (
              <PropertyCard
                key={item}
                property={{
                  uniqueId: `mock-${item}`,
                  propertyTitle: `${item + 1} BHK Apartment in Bandra West`,
                  sellingPrice: `${85 + item * 20}00000`,
                  priceType: 'total',
                  city: 'Mumbai',
                  locality: 'Bandra West',
                  totalArea: '1100',
                  areaUnit: 'Sq.ft',
                  bedrooms: '2',
                  bathrooms: '2',
                  publishedPhotos: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'],
                  isVerified: item % 2 === 0,
                  slug: `mock-slug-${item}`,
                  propertyDescription: '',
                  propertyType: 'Apartment',
                  state: 'Maharashtra',
                  publishedAt: new Date(),
                } as any}
                onPress={() => { }}
                onSave={handleSaveProperty}
                isSaved={false}
                showSaveButton={true}
              />
            ))
          )}
        </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="Home" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },

  // Header
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 140,
    height: 48,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  iconButton: {
    position: 'relative',
  },
  profileImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F36F21',
  },

  scrollView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Search Section
  searchSection: {
    backgroundColor: '#fff',
    padding: 16,
    paddingBottom: 8,
  },
  searchBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    flexDirection: 'row',
    padding: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    paddingVertical: 8,
  },
  searchLoader: {
    marginLeft: 8,
  },
  searchButton: {
    backgroundColor: '#F36F21',
    borderRadius: 6,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },

  // Search Suggestions
  suggestionsContainer: {
    position: 'absolute',
    top: 120, // Position below the search section
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
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

  // Tabs
  tabsContainer: {
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  tabsScroll: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  tabItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  tabItemActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#F36F21',
    backgroundColor: '#fff',
    borderWidth: 0,
    borderRadius: 0,
    paddingVertical: 9,
  },
  tabText: {
    color: '#666',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#F36F21',
    fontWeight: 'bold',
  },
  tabDropdown: {
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    marginLeft: 4,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },

  // Banner
  bannerContainer: {
    marginHorizontal: 16,
    marginVertical: 12,
    height: 180,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  bannerTitle: {
    color: '#00264d',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
    textShadowColor: 'rgba(255,255,255,0.5)',
    textShadowRadius: 4,
  },
  bannerSubtitle: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },

  // List
  listContainer: {
    paddingBottom: 20,
  },
});

export default HomeScreen;
