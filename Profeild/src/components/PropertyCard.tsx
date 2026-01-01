import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Property } from '../types/property.types';
import { DEFAULT_IMAGES } from '../utils/constants';

interface PropertyCardProps {
  property: Property & { isVerified?: boolean };
  onPress: () => void;
  onSave?: (propertyId: string) => void;
  isSaved?: boolean;
  showSaveButton?: boolean;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ 
  property, 
  onPress, 
  onSave, 
  isSaved = false, 
  showSaveButton = true 
}) => {
  const formatPrice = (price: string) => {
    const numPrice = parseInt(price);
    if (isNaN(numPrice)) return price;
    if (numPrice >= 10000000) {
      return `₹${(numPrice / 10000000).toFixed(2)} Cr`;
    } else if (numPrice >= 100000) {
      return `₹${(numPrice / 100000).toFixed(2)} Lac`;
    }
    return `₹${numPrice.toLocaleString('en-IN')}`;
  };

  const imageUrl = property.publishedPhotos?.[0] || DEFAULT_IMAGES.PROPERTY;

  // Determine badges
  const isVerified = property.isVerified;

  const getPropertyStats = () => {
    const parts = [];
    if (property.bedrooms) parts.push(`${property.bedrooms} Bed`);
    if (property.bathrooms) parts.push(`${property.bathrooms} Bath`);
    if (property.totalArea) parts.push(`${property.totalArea} ${property.areaUnit}`);
    return parts.join(' • ') || 'Residential Property';
  };

  const handleSavePress = (e: any) => {
    e.stopPropagation();
    if (onSave) {
      onSave(property.uniqueId);
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUrl }} style={styles.cardImg} resizeMode="cover" />

        <View style={styles.badgesContainer}>
          {isVerified && (
            <View style={[styles.badge, styles.badgeVerified]}>
              <Icon name="verified" size={10} color="#fff" style={styles.badgeIcon} />
              <Text style={styles.badgeText}>Verified</Text>
            </View>
          )}
        </View>

        {/* Save Button */}
        {showSaveButton && (
          <TouchableOpacity
            style={[styles.saveButton, isSaved && styles.saveButtonActive]}
            onPress={handleSavePress}
            activeOpacity={0.7}
          >
            <Icon 
              name={isSaved ? "favorite" : "favorite-border"} 
              size={18} 
              color={isSaved ? "#FFFFFF" : "#666666"} 
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.price}>{formatPrice(property.sellingPrice)}</Text>
        <Text style={styles.title} numberOfLines={2}>{property.propertyTitle}</Text>
        <Text style={styles.stats}>{getPropertyStats()}</Text>

        <View style={styles.locationContainer}>
          <Icon name="location-on" size={14} color="#777" style={{ marginRight: 2 }} />
          <Text style={styles.location} numberOfLines={1}>
            {property.locality ? `${property.locality}, ` : ''}{property.city}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    // Elevation for Android
    elevation: 3,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
    height: 140, // Fixed height for consistency
  },
  imageContainer: {
    width: '38%',
    height: '100%',
    position: 'relative',
  },
  cardImg: {
    width: '100%',
    height: '100%',
  },
  badgesContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeVerified: {
    backgroundColor: '#0066CC', // Blue
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  badgeIcon: {
    marginRight: 2,
  },
  contentContainer: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    lineHeight: 18,
  },
  stats: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  location: {
    fontSize: 12,
    color: '#777',
    flex: 1,
  },
  saveButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonActive: {
    backgroundColor: '#EF4444',
  },
});

export default PropertyCard;
