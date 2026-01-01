import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { propertyService } from '../../services/property.service';
import { SupabaseAuthService } from '../../services/supabase.service';
import { AuthService } from '../../services/auth.service';

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

interface PropertiesData {
  all: Property[];
  draft: Property[];
  pending: Property[];
  approved: Property[];
  rejected: Property[];
}

type TabType = 'all' | 'draft' | 'pending' | 'approved' | 'rejected';

const TABS = [
  { id: 'all', label: 'All', icon: 'home' },
  { id: 'draft', label: 'Draft', icon: 'edit' },
  { id: 'pending', label: 'Pending', icon: 'schedule' },
  { id: 'approved', label: 'Approved', icon: 'check-circle' },
  { id: 'rejected', label: 'Rejected', icon: 'cancel' },
];

export default function MyPropertiesScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [properties, setProperties] = useState<PropertiesData>({
    all: [],
    draft: [],
    pending: [],
    approved: [],
    rejected: [],
  });

  // Fetch properties when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchProperties();
    }, [])
  );

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await propertyService.getUserProperties();
      
      // Group properties by status
      const grouped: PropertiesData = {
        all: response,
        draft: response.filter((p: Property) => p.status === 'draft'),
        pending: response.filter((p: Property) => p.status === 'pending'),
        approved: response.filter((p: Property) => p.status === 'approved'),
        rejected: response.filter((p: Property) => p.status === 'rejected'),
      };
      
      setProperties(grouped);
    } catch (error) {
      console.error('Error fetching properties:', error);
      Alert.alert('Error', 'Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProperties();
    setRefreshing(false);
  };

  const handleAddNew = async () => {
    try {
      console.log('MyProperties Add New clicked - checking verification...');
      
      // Get user profile to check verification status
      const session = await SupabaseAuthService.getSession();
      console.log('Session:', session ? 'Found' : 'Not found');
      
      if (!session?.access_token) {
        console.log('No session found, navigating to login');
        navigation.navigate('Login' as never);
        return;
      }

      // Set auth token and get profile
      await AuthService.setAuthToken(session.access_token);
      console.log('Auth token set, getting profile...');
      
      const profile = await AuthService.getProfile();
      console.log('Profile:', profile);
      
      const isVerified = profile.isVerified || profile.verificationStatus === 'verified';
      console.log('Is verified:', isVerified, 'Profile verification status:', profile.verificationStatus);
      
      if (!isVerified) {
        console.log('User not verified, showing alert...');
        Alert.alert(
          'Verification Required',
          'Only verified users can list properties. Please complete your verification first.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Verify Now', 
              onPress: () => {
                console.log('Verify Now pressed from MyProperties');
                navigation.navigate('Verification' as never);
              }
            }
          ]
        );
        return;
      }

      // User is verified, proceed to add property
      console.log('User verified, navigating to AddProperty');
      navigation.navigate('AddProperty' as never);
    } catch (error) {
      console.error('Error checking verification:', error);
      Alert.alert('Error', 'Unable to verify user status. Please try again.');
    }
  };

  const handleEdit = (property: Property) => {
    navigation.navigate('EditProperty' as never, { propertyId: property.uniqueId } as never);
  };

  const handleDelete = async (propertyUniqueId: string) => {
    Alert.alert(
      'Delete Property',
      'Are you sure you want to delete this property?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await propertyService.deleteProperty(propertyUniqueId);
              fetchProperties(); // Refresh list
              Alert.alert('Success', 'Property deleted successfully');
            } catch (error) {
              console.error('Error deleting property:', error);
              Alert.alert('Error', 'Failed to delete property');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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
      case 'draft':
        return { bg: '#F3F4F6', text: '#374151' };
      case 'pending':
        return { bg: '#FEF3C7', text: '#92400E' };
      case 'approved':
        return { bg: '#D1FAE5', text: '#065F46' };
      case 'rejected':
        return { bg: '#FEE2E2', text: '#991B1B' };
      default:
        return { bg: '#F3F4F6', text: '#374151' };
    }
  };

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.tabsRow}>
          {TABS.map((tab) => {
            const count = properties[tab.id as TabType].length;
            const isActive = activeTab === tab.id;
            
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setActiveTab(tab.id as TabType)}
              >
                <Icon
                  name={tab.icon}
                  size={20}
                  color={isActive ? '#2563EB' : '#6B7280'}
                />
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
                {count > 0 && (
                  <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                    <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="home" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No {activeTab} properties</Text>
      <Text style={styles.emptyDescription}>
        {activeTab === 'draft' && 'Start by adding a new property listing'}
        {activeTab === 'pending' && 'Properties submitted for verification will appear here'}
        {activeTab === 'approved' && 'Your approved properties will be listed here'}
        {activeTab === 'rejected' && 'Rejected properties will appear here'}
        {activeTab === 'all' && 'You haven\'t added any properties yet'}
      </Text>
      {(activeTab === 'draft' || activeTab === 'all') && (
        <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
          <Icon name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Property</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderPropertyCard = (property: Property) => {
    const statusColors = getStatusColor(property.status);
    const canEdit = property.status === 'draft' || property.status === 'rejected';
    const canDelete = property.status === 'draft';

    return (
      <View key={property.uniqueId} style={styles.propertyCard}>
        {/* Header */}
        <View style={styles.propertyHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
            <Text style={[styles.statusText, { color: statusColors.text }]}>
              {property.propertyType}
            </Text>
          </View>
          {canEdit && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEdit(property)}
              >
                <Icon name="edit" size={16} color="#2563EB" />
              </TouchableOpacity>
              {canDelete && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDelete(property.uniqueId)}
                >
                  <Icon name="delete" size={16} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={styles.propertyTitle} numberOfLines={2}>
          {property.propertyTitle || 'Untitled Property'}
        </Text>

        {/* Details */}
        <View style={styles.propertyDetails}>
          <View style={styles.detailRow}>
            <Icon name="square-foot" size={16} color="#6B7280" />
            <Text style={styles.detailText}>
              {property.totalArea} {property.areaUnit}
            </Text>
          </View>
          <Text style={styles.locationText}>
            {property.city}, {property.state}
          </Text>
          {property.sellingPrice && (
            <Text style={styles.priceText}>
              {formatPrice(property.sellingPrice)}
            </Text>
          )}
        </View>

        {/* Rejection Reason */}
        {property.status === 'rejected' && property.rejectionReason && (
          <View style={styles.rejectionContainer}>
            <View style={styles.rejectionHeader}>
              <Icon name="error" size={16} color="#EF4444" />
              <Text style={styles.rejectionTitle}>Rejection Reason:</Text>
            </View>
            <Text style={styles.rejectionText}>{property.rejectionReason}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.propertyFooter}>
          <Text style={styles.dateText}>
            {activeTab === 'draft' ? 'Last updated' : 'Created'}: {formatDate(property.updatedAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Properties</Text>
          <Text style={styles.headerSubtitle}>Manage your property listings</Text>
        </View>
        <TouchableOpacity style={styles.headerAddButton} onPress={handleAddNew}>
          <Icon name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      {renderTabs()}

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : properties[activeTab].length === 0 ? (
          renderEmptyState()
        ) : (
          <ScrollView
            style={styles.propertiesList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          >
            {properties[activeTab].map(renderPropertyCard)}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  headerAddButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#2563EB',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 8,
  },
  tabTextActive: {
    color: '#2563EB',
  },
  tabBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  tabBadgeActive: {
    backgroundColor: '#EFF6FF',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabBadgeTextActive: {
    color: '#2563EB',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#2563EB',
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  propertiesList: {
    flex: 1,
    padding: 16,
  },
  propertyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F9FAFB',
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    lineHeight: 22,
  },
  propertyDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  rejectionContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  rejectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rejectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#991B1B',
    marginLeft: 4,
  },
  rejectionText: {
    fontSize: 12,
    color: '#7F1D1D',
    lineHeight: 16,
  },
  propertyFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});