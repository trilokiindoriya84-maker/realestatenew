import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../../services/api.service';
import { API_ENDPOINTS } from '../../utils/constants';
import { SupabaseAuthService } from '../../services/supabase.service';
import { AuthService } from '../../services/auth.service';

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

const MyEnquiriesScreen: React.FC = () => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    checkAuthAndFetchEnquiries();
  }, []);

  const checkAuthAndFetchEnquiries = async () => {
    try {
      // Check if user is authenticated
      const session = await SupabaseAuthService.getSession();
      if (!session?.access_token) {
        Alert.alert(
          'Authentication Required', 
          'Please login to view your enquiries',
          [
            { text: 'OK', onPress: () => (navigation as any).navigate('Login') }
          ]
        );
        return;
      }
      
      // User is authenticated, fetch enquiries
      await fetchMyEnquiries();
    } catch (error) {
      console.error('Auth check error:', error);
      Alert.alert('Error', 'Failed to check authentication status');
    }
  };

  const fetchMyEnquiries = async () => {
    try {
      setLoading(true);
      console.log('Fetching enquiries from:', API_ENDPOINTS.MY_ENQUIRIES);
      
      // Ensure we have a valid auth token before making the request
      const session = await SupabaseAuthService.getSession();
      if (!session?.access_token) {
        console.log('No auth session found');
        Alert.alert('Authentication Required', 'Please login to view your enquiries');
        setEnquiries([]);
        return;
      }

      // Set the auth token
      await AuthService.setAuthToken(session.access_token);
      
      const response = await apiClient.get(API_ENDPOINTS.MY_ENQUIRIES);
      console.log('Enquiries response:', response);
      
      if (response.data && Array.isArray(response.data)) {
        console.log('Enquiries data:', response.data);
        setEnquiries(response.data);
      } else {
        console.log('No enquiries data received or invalid format');
        setEnquiries([]);
      }
    } catch (error: any) {
      console.error('Error fetching enquiries:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Failed to fetch enquiries';
      if (error.response?.status === 401) {
        errorMessage = 'Please login to view your enquiries';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Error', errorMessage);
      setEnquiries([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyEnquiries();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FEF3C7';
      case 'contacted':
        return '#DBEAFE';
      case 'closed':
        return '#F3F4F6';
      default:
        return '#F3F4F6';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#92400E';
      case 'contacted':
        return '#1E40AF';
      case 'closed':
        return '#374151';
      default:
        return '#374151';
    }
  };

  const navigateToPropertyDetails = (property: any) => {
    try {
      (navigation as any).navigate('PropertyDetails', { 
        propertyId: property.uniqueId 
      });
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Error', 'Failed to open property details');
    }
  };

  const renderEnquiryItem = ({ item }: { item: Enquiry }) => {
    const { enquiry, property } = item;

    if (!property) {
      return null;
    }

    return (
      <View style={styles.enquiryCard}>
        {/* Property Section */}
        <View style={styles.propertySection}>
          <View style={styles.imageContainer}>
            {property.publishedPhotos && property.publishedPhotos.length > 0 ? (
              <Image
                source={{ uri: property.publishedPhotos[0] }}
                style={styles.propertyImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Icon name="home" size={32} color="#9CA3AF" />
              </View>
            )}
          </View>

          <View style={styles.propertyInfo}>
            <View style={styles.propertyHeader}>
              <Text style={styles.propertyTitle} numberOfLines={2}>
                {property.propertyTitle}
              </Text>
              <View 
                style={[
                  styles.statusBadge, 
                  { backgroundColor: getStatusColor(enquiry.status) }
                ]}
              >
                <Text 
                  style={[
                    styles.statusText, 
                    { color: getStatusTextColor(enquiry.status) }
                  ]}
                >
                  {enquiry.status.charAt(0).toUpperCase() + enquiry.status.slice(1)}
                </Text>
              </View>
            </View>
            
            <View style={styles.locationRow}>
              <Icon name="location-on" size={16} color="#6B7280" />
              <Text style={styles.locationText} numberOfLines={1}>
                {property.city}, {property.state}
              </Text>
            </View>

            <View style={styles.priceTypeRow}>
              <View style={styles.typeTag}>
                <Text style={styles.typeText}>{property.propertyType}</Text>
              </View>
              <Text style={styles.priceText}>
                {formatPrice(property.sellingPrice)}
              </Text>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Enquiry Section */}
        <View style={styles.enquirySection}>
          <Text style={styles.enquirySectionTitle}>Your Enquiry Details</Text>
          
          <View style={styles.enquiryDetails}>
            <View style={styles.enquiryRow}>
              <View style={styles.enquiryItem}>
                <Icon name="phone" size={16} color="#3B82F6" />
                <Text style={styles.enquiryLabel}>Phone</Text>
                <Text style={styles.enquiryValue}>{enquiry.mobile}</Text>
              </View>
              
              <View style={styles.enquiryItem}>
                <Icon name="schedule" size={16} color="#3B82F6" />
                <Text style={styles.enquiryLabel}>Date</Text>
                <Text style={styles.enquiryValue}>
                  {formatDate(enquiry.createdAt)}
                </Text>
              </View>
            </View>
            
            {enquiry.message && (
              <View style={styles.messageContainer}>
                <View style={styles.messageHeader}>
                  <Icon name="message" size={16} color="#3B82F6" />
                  <Text style={styles.enquiryLabel}>Message</Text>
                </View>
                <Text style={styles.messageText} numberOfLines={3}>
                  {enquiry.message}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => navigateToPropertyDetails(property)}
          >
            <Icon name="visibility" size={18} color="#FFFFFF" />
            <Text style={styles.viewButtonText}>View Property</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Icon name="message" size={64} color="#D1D5DB" />
      </View>
      <Text style={styles.emptyTitle}>No Enquiries Yet</Text>
      <Text style={styles.emptySubtitle}>
        You haven't made any property enquiries yet.{'\n'}
        Start exploring properties to find your dream home!
      </Text>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={() => (navigation as any).navigate('Home')}
      >
        <Icon name="search" size={20} color="#FFFFFF" />
        <Text style={styles.browseButtonText}>Browse Properties</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Icon name="hourglass-empty" size={40} color="#3B82F6" />
        <Text style={styles.loadingText}>Loading enquiries...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (navigation as any).goBack()}
          >
            <Icon name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Enquiries</Text>
          <View style={styles.headerSpacer} />
        </View>
        <Text style={styles.headerSubtitle}>Track all your property enquiries</Text>
      </View>

      <FlatList
        data={enquiries}
        renderItem={renderEnquiryItem}
        keyExtractor={(item) => item.enquiry.uniqueId}
        contentContainerStyle={enquiries.length === 0 ? styles.emptyListContainer : styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
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
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  listContainer: {
    paddingVertical: 16,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  enquiryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  propertySection: {
    flexDirection: 'row',
    padding: 16,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 16,
  },
  propertyImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  propertyInfo: {
    flex: 1,
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  propertyTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginRight: 12,
    lineHeight: 22,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 4,
    flex: 1,
  },
  priceTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 11,
    color: '#1E40AF',
    fontWeight: '500',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },
  enquirySection: {
    padding: 16,
  },
  enquirySectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  enquiryDetails: {
    gap: 12,
  },
  enquiryRow: {
    flexDirection: 'row',
    gap: 16,
  },
  enquiryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  enquiryLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  enquiryValue: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '600',
    flex: 1,
  },
  messageContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  messageText: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 18,
  },
  actionSection: {
    padding: 16,
    paddingTop: 0,
  },
  viewButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  browseButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MyEnquiriesScreen;