import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PropertyCard from '../../components/PropertyCard';
import BottomNavigation from '../../components/BottomNavigation';
import { SupabaseAuthService } from '../../services/supabase.service';
import apiClient from '../../services/api.service';
import { API_ENDPOINTS } from '../../utils/constants';
import { Property } from '../../types/property.types';

interface SavedProperty extends Property {
  isVerified?: boolean;
}

const SavedPropertiesScreen = () => {
  const navigation = useNavigation();
  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuthAndLoadProperties();
  }, []);

  const checkAuthAndLoadProperties = async () => {
    try {
      const currentUser = await SupabaseAuthService.getCurrentUser();
      setUser(currentUser);
      
      if (currentUser) {
        await loadSavedProperties();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setLoading(false);
    }
  };

  const loadSavedProperties = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(API_ENDPOINTS.SAVED_PROPERTIES);
      
      if (response.data && Array.isArray(response.data)) {
        setSavedProperties(response.data);
      } else {
        setSavedProperties([]);
      }
    } catch (error) {
      console.error('Error loading saved properties:', error);
      Alert.alert('Error', 'Failed to load saved properties');
      setSavedProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSavedProperties();
    setRefreshing(false);
  };

  const handleUnsaveProperty = async (propertyId: string) => {
    try {
      await apiClient.delete(`${API_ENDPOINTS.SAVED_PROPERTIES}/${propertyId}`);
      
      // Remove from local state
      setSavedProperties(prev => 
        prev.filter(property => property.uniqueId !== propertyId)
      );
      
      Alert.alert('Success', 'Property removed from saved list');
    } catch (error) {
      console.error('Error unsaving property:', error);
      Alert.alert('Error', 'Failed to remove property from saved list');
    }
  };

  const handlePropertyPress = (property: SavedProperty) => {
    // Navigate to property details
    (navigation as any).navigate('PropertyDetails', { propertyId: property.uniqueId });
  };

  const renderProperty = ({ item }: { item: SavedProperty }) => {
    // Ensure the property has all required fields for PropertyCard
    const propertyWithDefaults = {
      ...item,
      propertyDescription: item.propertyDescription || '',
      priceType: item.priceType || 'total',
    };
    
    return (
      <PropertyCard
        property={propertyWithDefaults}
        onPress={() => handlePropertyPress(item)}
        onSave={handleUnsaveProperty}
        isSaved={true}
        showSaveButton={true}
      />
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="favorite-border" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No Saved Properties</Text>
      <Text style={styles.emptySubtitle}>
        {!user 
          ? 'Please login to save properties and view them here'
          : 'Start saving properties you like to see them here'
        }
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => (navigation as any).goBack()}
            >
              <Icon name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Saved Properties</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F36F21" />
          <Text style={styles.loadingText}>Loading saved properties...</Text>
        </View>
        <BottomNavigation activeTab="Saved" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (navigation as any).goBack()}
          >
            <Icon name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Saved Properties</Text>
          <View style={styles.headerSpacer} />
        </View>
        {savedProperties.length > 0 && (
          <Text style={styles.headerSubtitle}>
            {savedProperties.length} {savedProperties.length === 1 ? 'property' : 'properties'} saved
          </Text>
        )}
      </View>

      <FlatList
        data={savedProperties}
        renderItem={renderProperty}
        keyExtractor={(item) => item.uniqueId}
        contentContainerStyle={[
          styles.listContainer,
          savedProperties.length === 0 && styles.emptyContainer
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
      />

      <BottomNavigation activeTab="Saved" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerSpacer: {
    width: 40, // Same width as back button to center the title
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  listContainer: {
    paddingTop: 16,
    paddingBottom: 100, // Space for bottom navigation
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SavedPropertiesScreen;