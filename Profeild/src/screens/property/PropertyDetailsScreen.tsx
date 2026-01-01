import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SupabaseAuthService } from '../../services/supabase.service';
import apiClient from '../../services/api.service';
import { API_ENDPOINTS } from '../../utils/constants';

const { width } = Dimensions.get('window');

interface PublishedProperty {
  uniqueId: string;
  slug: string;
  propertyTitle: string;
  propertyDescription: string | null;
  propertyType: string;
  state: string;
  district: string;
  city: string;
  locality: string;
  pincode: string;
  totalArea: string;
  areaUnit: string;
  propertyFacing: string;
  openSides: string;
  eastRoadWidth: string | null;
  westRoadWidth: string | null;
  northRoadWidth: string | null;
  southRoadWidth: string | null;
  sellingPrice: string;
  priceType: string;
  negotiable: string;
  circleRate: string | null;
  publishedPhotos: string[] | null;
  bedrooms: string | null;
  bathrooms: string | null;
  floors: string | null;
  floorNumber: string | null;
  landType: string | null;
  boundaryWall: string | null;
  amenities: any;
  publishedAt: Date | null;
}

interface EnquiryForm {
  name: string;
  mobile: string;
  message: string;
}

export default function PropertyDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { propertyId } = route.params as { propertyId: string };

  const [property, setProperty] = useState<PublishedProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [savingProperty, setSavingProperty] = useState(false);
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [enquiryForm, setEnquiryForm] = useState<EnquiryForm>({ 
    name: '', 
    mobile: '', 
    message: '' 
  });
  const [submittingEnquiry, setSubmittingEnquiry] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuthState();
    fetchProperty();
  }, []);

  useEffect(() => {
    if (user && property) {
      checkIfSaved();
    }
  }, [user, property]);

  const checkAuthState = async () => {
    try {
      const currentUser = await SupabaseAuthService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    }
  };

  const fetchProperty = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiClient.defaults.baseURL}/public/published-properties/${propertyId}`);
      
      if (!response.ok) {
        throw new Error('Property not found');
      }
      
      const data = await response.json();
      setProperty(data);
    } catch (error) {
      console.error('Error fetching property:', error);
      Alert.alert('Error', 'Failed to load property details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const checkIfSaved = async () => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.SAVED_PROPERTIES}/check/${propertyId}`);
      setIsSaved(response.data.isSaved);
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };

  const handleSaveToggle = async () => {
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
      setSavingProperty(true);
      
      if (isSaved) {
        // Unsave
        await apiClient.delete(`${API_ENDPOINTS.SAVED_PROPERTIES}/${propertyId}`);
        setIsSaved(false);
        Alert.alert('Success', 'Property removed from saved list');
      } else {
        // Save
        await apiClient.post(API_ENDPOINTS.SAVED_PROPERTIES, { propertyUniqueId: propertyId });
        setIsSaved(true);
        Alert.alert('Success', 'Property saved successfully');
      }
    } catch (error) {
      console.error('Error saving/unsaving property:', error);
      Alert.alert('Error', 'Failed to update saved properties');
    } finally {
      setSavingProperty(false);
    }
  };

  const handleEnquirySubmit = async () => {
    if (!enquiryForm.name || !enquiryForm.mobile) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (enquiryForm.mobile.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      setSubmittingEnquiry(true);
      
      const enquiryData = {
        propertyUniqueId: propertyId,
        name: enquiryForm.name,
        mobile: enquiryForm.mobile,
        message: enquiryForm.message,
        userId: user?.id || null,
      };

      const response = await fetch(`${apiClient.defaults.baseURL}/enquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(enquiryData),
      });

      if (response.ok) {
        Alert.alert('Success', 'Enquiry submitted successfully! We will contact you soon.');
        setShowEnquiryModal(false);
        setEnquiryForm({ name: '', mobile: '', message: '' });
      } else {
        const errorData = await response.json();
        Alert.alert('Error', `Failed to submit enquiry: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error submitting enquiry:', error);
      Alert.alert('Error', 'Failed to submit enquiry. Please try again.');
    } finally {
      setSubmittingEnquiry(false);
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

  const getPropertyImage = (photos: string[] | null, index: number) => {
    if (photos && photos.length > index) {
      return photos[index];
    }
    return 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80';
  };

  const getAmenityLabel = (key: string) => {
    const labelMap: { [key: string]: string } = {
      roadAccess: 'Road Access',
      electricity: 'Electricity Connection',
      waterSupply: 'Water Supply',
      drainage: 'Drainage',
      hospital: 'Hospital',
      school: 'School',
      college: 'College',
      temple: 'Temple',
      mosque: 'Mosque',
      church: 'Church',
      market: 'Market',
      busStand: 'Bus Stand',
      railwayStation: 'Railway Station',
      highway: 'Highway'
    };
    return labelMap[key] || key.replace(/([A-Z])/g, ' $1').trim();
  };

  const getAmenityDistance = (value: any) => {
    if (typeof value === 'object' && value !== null) {
      const obj = value as any;
      if (obj.distance) {
        return `${obj.distance}m away`;
      }
    }
    return null;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Property Details</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F36F21" />
          <Text style={styles.loadingText}>Loading property details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!property) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Property Details</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContainer}>
          <Icon name="home" size={64} color="#9CA3AF" />
          <Text style={styles.notFoundText}>Property not found</Text>
          <TouchableOpacity style={styles.goBackButton} onPress={() => navigation.goBack()}>
            <Text style={styles.goBackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const photos = property.publishedPhotos || [];
  
  // Filter amenities - only show those with true value
  const selectedAmenities = property.amenities && typeof property.amenities === 'object'
    ? Object.entries(property.amenities).filter(([key, value]) => {
        if (typeof value === 'boolean') return value === true;
        if (typeof value === 'string') return value === 'true' || value === 'yes';
        if (typeof value === 'object' && value !== null) {
          const obj = value as any;
          return obj.available === true || obj.available === 'true';
        }
        return false;
      })
    : [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Property Details</Text>
        <TouchableOpacity onPress={handleSaveToggle} disabled={savingProperty}>
          <Icon 
            name={isSaved ? "favorite" : "favorite-border"} 
            size={24} 
            color={isSaved ? "#EF4444" : "#111827"} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: getPropertyImage(photos, selectedImageIndex) }}
            style={styles.mainImage}
            resizeMode="cover"
          />
          
          {/* Photo Count Badge */}
          {photos.length > 0 && (
            <View style={styles.photoCountBadge}>
              <Icon name="photo-camera" size={14} color="#FFFFFF" />
              <Text style={styles.photoCountText}>{photos.length}</Text>
            </View>
          )}

          {/* Image Thumbnails */}
          {photos.length > 1 && (
            <ScrollView 
              horizontal 
              style={styles.thumbnailContainer}
              showsHorizontalScrollIndicator={false}
            >
              {photos.map((photo, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedImageIndex(index)}
                  style={[
                    styles.thumbnail,
                    selectedImageIndex === index && styles.thumbnailActive
                  ]}
                >
                  <Image source={{ uri: photo }} style={styles.thumbnailImage} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Property Info */}
        <View style={styles.propertyInfo}>
          {/* Title & Location */}
          <View style={styles.titleSection}>
            <Text style={styles.propertyTitle}>{property.propertyTitle}</Text>
            <View style={styles.locationContainer}>
              <Icon name="location-on" size={16} color="#6B7280" />
              <Text style={styles.locationText}>
                {property.locality}, {property.city}
              </Text>
            </View>
            <Text style={styles.pincodeText}>
              {property.state} - {property.pincode}
            </Text>
          </View>

          {/* Price */}
          <View style={styles.priceSection}>
            <Text style={styles.price}>{formatPrice(property.sellingPrice)}</Text>
            {property.negotiable === 'yes' && (
              <View style={styles.negotiableBadge}>
                <Text style={styles.negotiableText}>Negotiable</Text>
              </View>
            )}
            {property.circleRate && (
              <Text style={styles.circleRate}>
                Circle Rate: ₹{parseInt(property.circleRate).toLocaleString('en-IN')}
              </Text>
            )}
          </View>

          {/* Key Features */}
          <View style={styles.featuresGrid}>
            <View style={styles.featureItem}>
              <Icon name="home" size={20} color="#2563EB" />
              <Text style={styles.featureText}>{property.propertyType}</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="square-foot" size={20} color="#2563EB" />
              <Text style={styles.featureText}>{property.totalArea} {property.areaUnit}</Text>
            </View>
            {property.bedrooms ? (
              <View style={styles.featureItem}>
                <Icon name="bed" size={20} color="#2563EB" />
                <Text style={styles.featureText}>{property.bedrooms} BHK</Text>
              </View>
            ) : (
              <View style={styles.featureItem}>
                <Icon name="explore" size={20} color="#2563EB" />
                <Text style={styles.featureText}>{property.propertyFacing}</Text>
              </View>
            )}
            <View style={styles.featureItem}>
              <Icon name="layers" size={20} color="#2563EB" />
              <Text style={styles.featureText}>{property.openSides} Open</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.actionButton, 
                styles.saveButton,
                isSaved && styles.saveButtonActive
              ]}
              onPress={handleSaveToggle}
              disabled={savingProperty}
            >
              <Icon 
                name={isSaved ? "favorite" : "favorite-border"} 
                size={20} 
                color={isSaved ? "#FFFFFF" : "#2563EB"} 
              />
              <Text style={[styles.actionButtonText, isSaved && styles.saveButtonTextActive]}>
                {savingProperty ? 'Saving...' : isSaved ? 'Saved' : 'Save'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.enquiryButton]}
              onPress={() => setShowEnquiryModal(true)}
            >
              <Icon name="mail" size={20} color="#FFFFFF" />
              <Text style={[styles.actionButtonText, styles.enquiryButtonText]}>
                Send Enquiry
              </Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          {property.propertyDescription && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About this Property</Text>
              <Text style={styles.description}>{property.propertyDescription}</Text>
            </View>
          )}

          {/* Property Specifications */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Property Specifications</Text>
            <View style={styles.specGrid}>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Total Area</Text>
                <Text style={styles.specValue}>{property.totalArea} {property.areaUnit}</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Property Facing</Text>
                <Text style={styles.specValue}>{property.propertyFacing}</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Open Sides</Text>
                <Text style={styles.specValue}>{property.openSides}</Text>
              </View>
              {property.bedrooms && (
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Bedrooms</Text>
                  <Text style={styles.specValue}>{property.bedrooms} BHK</Text>
                </View>
              )}
              {property.bathrooms && (
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Bathrooms</Text>
                  <Text style={styles.specValue}>{property.bathrooms}</Text>
                </View>
              )}
              {property.floors && (
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Total Floors</Text>
                  <Text style={styles.specValue}>{property.floors}</Text>
                </View>
              )}
              {property.landType && (
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Land Type</Text>
                  <Text style={styles.specValue}>{property.landType}</Text>
                </View>
              )}
              {property.boundaryWall && (
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Boundary Wall</Text>
                  <Text style={styles.specValue}>{property.boundaryWall}</Text>
                </View>
              )}
              {property.eastRoadWidth && (
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>East Road Width</Text>
                  <Text style={styles.specValue}>{property.eastRoadWidth} ft</Text>
                </View>
              )}
              {property.westRoadWidth && (
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>West Road Width</Text>
                  <Text style={styles.specValue}>{property.westRoadWidth} ft</Text>
                </View>
              )}
              {property.northRoadWidth && (
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>North Road Width</Text>
                  <Text style={styles.specValue}>{property.northRoadWidth} ft</Text>
                </View>
              )}
              {property.southRoadWidth && (
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>South Road Width</Text>
                  <Text style={styles.specValue}>{property.southRoadWidth} ft</Text>
                </View>
              )}
            </View>
          </View>

          {/* Nearby Places */}
          {selectedAmenities.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nearby Places</Text>
              <View style={styles.amenitiesGrid}>
                {selectedAmenities.map(([key, value]) => {
                  const distance = getAmenityDistance(value);
                  return (
                    <View key={key} style={styles.amenityItem}>
                      <View style={styles.amenityIcon}>
                        <Icon name="place" size={16} color="#2563EB" />
                      </View>
                      <View style={styles.amenityInfo}>
                        <Text style={styles.amenityLabel}>{getAmenityLabel(key)}</Text>
                        {distance && (
                          <Text style={styles.amenityDistance}>{distance}</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Enquiry Modal */}
      <Modal
        visible={showEnquiryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEnquiryModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Enquiry</Text>
              <TouchableOpacity onPress={() => setShowEnquiryModal(false)}>
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={enquiryForm.name}
                  onChangeText={(text) => setEnquiryForm({ ...enquiryForm, name: text })}
                  placeholder="Enter your name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mobile Number *</Text>
                <TextInput
                  style={styles.textInput}
                  value={enquiryForm.mobile}
                  onChangeText={(text) => setEnquiryForm({ ...enquiryForm, mobile: text })}
                  placeholder="Enter 10-digit mobile number"
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Message (Optional)</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={enquiryForm.message}
                  onChangeText={(text) => setEnquiryForm({ ...enquiryForm, message: text })}
                  placeholder="Any specific requirements..."
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowEnquiryModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleEnquirySubmit}
                  disabled={submittingEnquiry}
                >
                  <Text style={styles.submitButtonText}>
                    {submittingEnquiry ? 'Submitting...' : 'Submit Enquiry'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerRight: {
    width: 24,
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 24,
  },
  goBackButton: {
    backgroundColor: '#F36F21',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  goBackButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    backgroundColor: '#F9FAFB',
  },
  mainImage: {
    width: width,
    height: width * 0.75,
  },
  photoCountBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  photoCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  thumbnailContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: '#2563EB',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  propertyInfo: {
    padding: 16,
  },
  titleSection: {
    marginBottom: 16,
  },
  propertyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  pincodeText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  priceSection: {
    marginBottom: 20,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  negotiableBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  negotiableText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  circleRate: {
    fontSize: 12,
    color: '#6B7280',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  featureItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  saveButton: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  saveButtonActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  enquiryButton: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  saveButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  enquiryButtonText: {
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  specGrid: {
    gap: 12,
  },
  specItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  specLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  specValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  amenitiesGrid: {
    gap: 12,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  amenityIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  amenityInfo: {
    flex: 1,
  },
  amenityLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  amenityDistance: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalForm: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  submitButton: {
    backgroundColor: '#10B981',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});