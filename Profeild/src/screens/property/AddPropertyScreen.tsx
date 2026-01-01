import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary, launchCamera, ImagePickerResponse } from 'react-native-image-picker';
import { propertyService } from '../../services/property.service';
import { authService } from '../../services/auth.service';
import { Dropdown } from '../../components/Dropdown';

interface PropertyFormData {
  // Step 1: Property Type & Location
  propertyType: string;
  propertyTitle: string;
  propertyDescription: string;
  state: string;
  district: string;
  city: string;
  locality: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  totalArea: string;
  areaUnit: string;
  frontRoadWidth: string;
  roadWidthUnit: string;
  propertyFacing: string;
  openSides: string;
  eastRoadWidth: string;
  westRoadWidth: string;
  northRoadWidth: string;
  southRoadWidth: string;

  // Step 2: Specifications
  bedrooms?: string;
  bathrooms?: string;
  floors?: string;
  floorNumber?: string;
  constructionStatus?: string;
  landType?: string;
  boundaryWall?: string;
  amenities: {
    roadAccess: { available: boolean; distance: string };
    electricity: { available: boolean; distance: string };
    waterSupply: { available: boolean; distance: string };
    drainage: { available: boolean; distance: string };
    hospital: { available: boolean; distance: string };
    school: { available: boolean; distance: string };
    college: { available: boolean; distance: string };
    temple: { available: boolean; distance: string };
    mosque: { available: boolean; distance: string };
    church: { available: boolean; distance: string };
    market: { available: boolean; distance: string };
    busStand: { available: boolean; distance: string };
    railwayStation: { available: boolean; distance: string };
    highway: { available: boolean; distance: string };
  };

  // Step 3: Price Details
  sellingPrice: string;
  priceType: string;
  negotiable: string;
  circleRate: string;

  // Step 4: Documents
  documents: {
    propertyPhotos: string[];
    ownership: string[];
    saleDeed: string[];
    khasra: string[];
    approvedMap: string[];
    encumbrance: string[];
    identityProof: string[];
  };

  // Step 5: Review & Submit
  declaration: boolean;
}

const STEPS = [
  { id: 1, name: 'Property Details', icon: 'home' },
  { id: 2, name: 'Specifications', icon: 'description' },
  { id: 3, name: 'Price Details', icon: 'attach-money' },
  { id: 4, name: 'Documents', icon: 'upload-file' },
  { id: 5, name: 'Review & Submit', icon: 'check-circle' },
];

const PROPERTY_TYPES = [
  { label: 'House', value: 'House' },
  { label: 'Apartment', value: 'Apartment' },
  { label: 'Plot', value: 'Plot' },
  { label: 'Land', value: 'Land' },
  { label: 'Farm', value: 'Farm' },
];

const FACING_OPTIONS = [
  { label: 'East', value: 'East' },
  { label: 'West', value: 'West' },
  { label: 'North', value: 'North' },
  { label: 'South', value: 'South' },
  { label: 'North-East', value: 'North-East' },
  { label: 'North-West', value: 'North-West' },
  { label: 'South-East', value: 'South-East' },
  { label: 'South-West', value: 'South-West' },
];

const OPEN_SIDES_OPTIONS = [
  { label: '1 Side Open', value: '1 Side Open' },
  { label: '2 Side Open', value: '2 Side Open' },
  { label: '3 Side Open', value: '3 Side Open' },
  { label: '4 Side Open', value: '4 Side Open' },
];

const BEDROOM_OPTIONS = [
  { label: '1 BHK', value: '1' },
  { label: '2 BHK', value: '2' },
  { label: '3 BHK', value: '3' },
  { label: '4 BHK', value: '4' },
  { label: '5 BHK', value: '5' },
  { label: '6 BHK', value: '6' },
  { label: '7 BHK', value: '7' },
  { label: '8 BHK', value: '8' },
  { label: '9 BHK', value: '9' },
  { label: '10 BHK', value: '10' },
];

const BATHROOM_OPTIONS = [
  { label: '1 Bathroom', value: '1' },
  { label: '2 Bathrooms', value: '2' },
  { label: '3 Bathrooms', value: '3' },
  { label: '4 Bathrooms', value: '4' },
  { label: '5 Bathrooms', value: '5' },
  { label: '6 Bathrooms', value: '6' },
  { label: '7 Bathrooms', value: '7' },
  { label: '8 Bathrooms', value: '8' },
  { label: '9 Bathrooms', value: '9' },
  { label: '10 Bathrooms', value: '10' },
];

const LAND_TYPE_OPTIONS = [
  { label: 'Residential', value: 'residential' },
  { label: 'Commercial', value: 'commercial' },
  { label: 'Agricultural', value: 'agricultural' },
];

const AREA_UNIT_OPTIONS = [
  { label: 'Sq Ft', value: 'sqft' },
  { label: 'Sq Meter', value: 'sqm' },
  { label: 'Acre', value: 'acre' },
  { label: 'Bigha', value: 'bigha' },
];

const FLOORS_OPTIONS = [
  { label: '1 Floor', value: '1' },
  { label: '2 Floors', value: '2' },
  { label: '3 Floors', value: '3' },
  { label: '4 Floors', value: '4' },
  { label: '5 Floors', value: '5' },
];

const AMENITIES_LIST = [
  'roadAccess', 'electricity', 'waterSupply', 'drainage',
  'hospital', 'school', 'college', 'temple', 'mosque', 'church',
  'market', 'busStand', 'railwayStation', 'highway'
];

const AMENITY_LABELS: Record<string, string> = {
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

export default function AddPropertyScreen() {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<PropertyFormData>({
    propertyType: '',
    propertyTitle: '',
    propertyDescription: '',
    state: '',
    district: '',
    city: '',
    locality: '',
    pincode: '',
    latitude: null,
    longitude: null,
    totalArea: '',
    areaUnit: 'sqft',
    frontRoadWidth: '',
    roadWidthUnit: 'feet',
    propertyFacing: '',
    openSides: '',
    eastRoadWidth: '',
    westRoadWidth: '',
    northRoadWidth: '',
    southRoadWidth: '',
    amenities: {
      roadAccess: { available: false, distance: '' },
      electricity: { available: false, distance: '' },
      waterSupply: { available: false, distance: '' },
      drainage: { available: false, distance: '' },
      hospital: { available: false, distance: '' },
      school: { available: false, distance: '' },
      college: { available: false, distance: '' },
      temple: { available: false, distance: '' },
      mosque: { available: false, distance: '' },
      church: { available: false, distance: '' },
      market: { available: false, distance: '' },
      busStand: { available: false, distance: '' },
      railwayStation: { available: false, distance: '' },
      highway: { available: false, distance: '' },
    },
    sellingPrice: '',
    priceType: 'total',
    negotiable: 'yes',
    circleRate: '',
    documents: {
      propertyPhotos: [],
      ownership: [],
      saleDeed: [],
      khasra: [],
      approvedMap: [],
      encumbrance: [],
      identityProof: [],
    },
    declaration: false,
  });

  const validateStep = (step: number): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.propertyType) errors.propertyType = 'Property type is required';
      if (!formData.propertyTitle.trim()) errors.propertyTitle = 'Property title is required';
      if (!formData.state.trim()) errors.state = 'State is required';
      if (!formData.district.trim()) errors.district = 'District is required';
      if (!formData.city.trim()) errors.city = 'City is required';
      if (!formData.locality.trim()) errors.locality = 'Locality is required';
      if (!formData.pincode.trim()) errors.pincode = 'Pincode is required';
      else if (!/^\d{6}$/.test(formData.pincode)) errors.pincode = 'Pincode must be 6 digits';
      if (!formData.totalArea.trim()) errors.totalArea = 'Total area is required';
      if (!formData.propertyFacing) errors.propertyFacing = 'Property facing is required';
      if (!formData.openSides) errors.openSides = 'Open sides is required';
    }

    if (step === 2) {
      const isBuilding = ['House', 'Apartment'].includes(formData.propertyType);
      const isLand = ['Plot', 'Land', 'Farm'].includes(formData.propertyType);

      if (isBuilding) {
        if (!formData.bedrooms) errors.bedrooms = 'Number of bedrooms is required';
        if (!formData.bathrooms) errors.bathrooms = 'Number of bathrooms is required';
        if (!formData.floors) errors.floors = 'Number of floors is required';
        if (!formData.constructionStatus) errors.constructionStatus = 'Construction status is required';
      }

      if (isLand) {
        if (!formData.landType) errors.landType = 'Land type is required';
        if (!formData.boundaryWall) errors.boundaryWall = 'Boundary wall information is required';
      }
    }

    if (step === 3) {
      if (!formData.sellingPrice.trim()) errors.sellingPrice = 'Selling price is required';
      else if (isNaN(Number(formData.sellingPrice)) || Number(formData.sellingPrice) <= 0) {
        errors.sellingPrice = 'Please enter a valid price';
      }
    }

    if (step === 4) {
      // Step 4: Documents
      if (formData.documents.propertyPhotos.length < 3) {
        errors.propertyPhotos = 'At least 3 property photos are required';
      }
      if (formData.documents.ownership.length === 0) {
        errors.ownership = 'Ownership document is required';
      }
      if (formData.documents.saleDeed.length === 0) {
        errors.saleDeed = 'Sale deed is required';
      }
      if (formData.documents.identityProof.length === 0) {
        errors.identityProof = 'Identity proof is required';
      }
    }

    if (step === 5) {
      // Step 5: Declaration
      if (!formData.declaration) {
        errors.declaration = 'You must accept the declaration to proceed';
      }
    }

    return errors;
  };

  const updateAmenity = (key: string, field: string, value: any) => {
    setFormData({
      ...formData,
      amenities: {
        ...formData.amenities,
        [key]: {
          ...formData.amenities[key as keyof typeof formData.amenities],
          [field]: value
        }
      }
    });
  };

  const pickDocument = (documentType: keyof PropertyFormData['documents']) => {
    Alert.alert(
      'Select Document',
      'Choose an option to upload document',
      [
        { text: 'Camera', onPress: () => openCamera(documentType) },
        { text: 'Gallery', onPress: () => openGallery(documentType) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const openCamera = (documentType: keyof PropertyFormData['documents']) => {
    const options = {
      mediaType: 'photo' as const,
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    };

    launchCamera(options, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        console.log('User cancelled camera');
      } else if (response.errorCode) {
        console.log('Camera Error: ', response.errorMessage);
        Alert.alert('Error', response.errorMessage || 'Failed to take photo');
      } else if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        const newDocument = {
          uri: asset.uri || '',
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `${documentType}_${Date.now()}.jpg`,
        };
        
        setFormData(prev => ({
          ...prev,
          documents: {
            ...prev.documents,
            [documentType]: [...prev.documents[documentType], newDocument]
          }
        }));
      }
    });
  };

  const openGallery = (documentType: keyof PropertyFormData['documents']) => {
    const options = {
      mediaType: 'photo' as const,
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
        Alert.alert('Error', response.errorMessage || 'Failed to pick image');
      } else if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        const newDocument = {
          uri: asset.uri || '',
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `${documentType}_${Date.now()}.jpg`,
        };
        
        setFormData(prev => ({
          ...prev,
          documents: {
            ...prev.documents,
            [documentType]: [...prev.documents[documentType], newDocument]
          }
        }));
      }
    });
  };

  const removeDocument = (documentType: keyof PropertyFormData['documents'], index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [documentType]: prev.documents[documentType].filter((_, i) => i !== index)
      }
    }));
  };

  const handleNext = async () => {
    const validationErrors = validateStep(currentStep);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    await saveDraft();
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const handleBack = () => {
    setErrors({});
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      const dataToSave: any = { ...formData };
      
      // Remove documents from the data to save (they will be uploaded separately)
      delete dataToSave.documents;

      let currentPropertyId = propertyId;

      if (currentPropertyId) {
        await propertyService.updateProperty(currentPropertyId, dataToSave);
      } else {
        const response = await propertyService.createProperty(dataToSave);
        currentPropertyId = response.property.uniqueId;
        setPropertyId(currentPropertyId);
      }

      // Upload documents if we're on step 4 and have a property ID
      if (currentStep === 4 && currentPropertyId) {
        const uploadPromises = [];

        // Upload each document type
        for (const [docType, files] of Object.entries(formData.documents)) {
          if (files && files.length > 0) {
            // Filter out files that are already strings (already uploaded URLs)
            const newFiles = (files as any[]).filter((file: any) => typeof file === 'object' && file.uri);
            if (newFiles.length > 0) {
              uploadPromises.push(
                propertyService.uploadPropertyDocuments(currentPropertyId, docType, newFiles)
              );
            }
          }
        }

        if (uploadPromises.length > 0) {
          await Promise.all(uploadPromises);
          console.log('Documents uploaded successfully');
        }
      }
    } catch (error) {
      console.error('Save draft error:', error);
      Alert.alert('Error', 'Failed to save property. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (!propertyId) {
        Alert.alert('Error', 'Please save the property first by completing all steps');
        return;
      }

      await propertyService.submitProperty(propertyId);
      Alert.alert(
        'Success',
        'Property submitted for verification successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Submit error:', error);
      Alert.alert('Error', error.message || 'Failed to submit property');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {STEPS.map((step, index) => (
        <View key={step.id} style={styles.stepItem}>
          <View
            style={[
              styles.stepCircle,
              currentStep >= step.id ? styles.stepCircleActive : styles.stepCircleInactive,
            ]}
          >
            <Icon
              name={step.icon}
              size={20}
              color={currentStep >= step.id ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>
          <Text
            style={[
              styles.stepText,
              currentStep >= step.id ? styles.stepTextActive : styles.stepTextInactive,
            ]}
          >
            {step.name}
          </Text>
          {index < STEPS.length - 1 && (
            <View
              style={[
                styles.stepLine,
                currentStep > step.id ? styles.stepLineActive : styles.stepLineInactive,
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <ScrollView style={styles.stepContent}>
      <Text style={styles.stepTitle}>Property Type & Location</Text>

      {/* Property Type */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Property Type *</Text>
        <Dropdown
          options={PROPERTY_TYPES}
          selectedValue={formData.propertyType}
          onSelect={(value) => setFormData({ ...formData, propertyType: value })}
          placeholder="Select property type"
          error={errors.propertyType}
        />
      </View>

      {/* Property Title */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Property Title *</Text>
        <TextInput
          style={[styles.textInput, errors.propertyTitle && styles.textInputError]}
          value={formData.propertyTitle}
          onChangeText={(text) => setFormData({ ...formData, propertyTitle: text })}
          placeholder="e.g., 2 BHK Independent House near Main Road"
          multiline
        />
        {errors.propertyTitle && <Text style={styles.errorText}>{errors.propertyTitle}</Text>}
      </View>

      {/* Property Description */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Property Description</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={formData.propertyDescription}
          onChangeText={(text) => setFormData({ ...formData, propertyDescription: text })}
          placeholder="Describe your property in detail..."
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Location Fields */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>State *</Text>
        <TextInput
          style={[styles.textInput, errors.state && styles.textInputError]}
          value={formData.state}
          onChangeText={(text) => setFormData({ ...formData, state: text })}
          placeholder="e.g., Madhya Pradesh"
        />
        {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>District *</Text>
        <TextInput
          style={[styles.textInput, errors.district && styles.textInputError]}
          value={formData.district}
          onChangeText={(text) => setFormData({ ...formData, district: text })}
          placeholder="e.g., Indore"
        />
        {errors.district && <Text style={styles.errorText}>{errors.district}</Text>}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>City / Town / Village *</Text>
        <TextInput
          style={[styles.textInput, errors.city && styles.textInputError]}
          value={formData.city}
          onChangeText={(text) => setFormData({ ...formData, city: text })}
          placeholder="e.g., Indore"
        />
        {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Locality / Area Name *</Text>
        <TextInput
          style={[styles.textInput, errors.locality && styles.textInputError]}
          value={formData.locality}
          onChangeText={(text) => setFormData({ ...formData, locality: text })}
          placeholder="e.g., Vijay Nagar"
        />
        {errors.locality && <Text style={styles.errorText}>{errors.locality}</Text>}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Pincode *</Text>
        <TextInput
          style={[styles.textInput, errors.pincode && styles.textInputError]}
          value={formData.pincode}
          onChangeText={(text) => setFormData({ ...formData, pincode: text })}
          placeholder="e.g., 452010"
          keyboardType="numeric"
          maxLength={6}
        />
        {errors.pincode && <Text style={styles.errorText}>{errors.pincode}</Text>}
      </View>

      {/* Area Details */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Total Area *</Text>
        <View style={styles.rowContainer}>
          <TextInput
            style={[styles.textInput, styles.flexInput, errors.totalArea && styles.textInputError]}
            value={formData.totalArea}
            onChangeText={(text) => setFormData({ ...formData, totalArea: text })}
            placeholder="e.g., 1200"
            keyboardType="numeric"
          />
          <View style={styles.dropdownContainer}>
            <Dropdown
              options={AREA_UNIT_OPTIONS}
              selectedValue={formData.areaUnit}
              onSelect={(value) => setFormData({ ...formData, areaUnit: value })}
              placeholder="Unit"
            />
          </View>
        </View>
        {errors.totalArea && <Text style={styles.errorText}>{errors.totalArea}</Text>}
      </View>

      {/* Property Facing */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Property Facing *</Text>
        <Dropdown
          options={FACING_OPTIONS}
          selectedValue={formData.propertyFacing}
          onSelect={(value) => setFormData({ ...formData, propertyFacing: value })}
          placeholder="Select property facing direction"
          error={errors.propertyFacing}
        />
      </View>

      {/* Open Sides */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Open Sides *</Text>
        <Dropdown
          options={OPEN_SIDES_OPTIONS}
          selectedValue={formData.openSides}
          onSelect={(value) => setFormData({ ...formData, openSides: value })}
          placeholder="Select number of open sides"
          error={errors.openSides}
        />
      </View>

      {/* Road Width for Each Side */}
      {formData.openSides && (
        <View style={styles.roadWidthContainer}>
          <Text style={styles.roadWidthTitle}>Road Width for Each Open Side</Text>
          <Text style={styles.roadWidthSubtitle}>
            Enter the road width for each side that is open. Leave blank for closed sides.
          </Text>
          
          <View style={styles.roadWidthGrid}>
            <View style={styles.roadWidthField}>
              <Text style={styles.roadWidthLabel}>East Side (feet)</Text>
              <TextInput
                style={styles.roadWidthInput}
                value={formData.eastRoadWidth}
                onChangeText={(value) => setFormData({ ...formData, eastRoadWidth: value })}
                placeholder="e.g., 30"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.roadWidthField}>
              <Text style={styles.roadWidthLabel}>West Side (feet)</Text>
              <TextInput
                style={styles.roadWidthInput}
                value={formData.westRoadWidth}
                onChangeText={(value) => setFormData({ ...formData, westRoadWidth: value })}
                placeholder="e.g., 20"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.roadWidthField}>
              <Text style={styles.roadWidthLabel}>North Side (feet)</Text>
              <TextInput
                style={styles.roadWidthInput}
                value={formData.northRoadWidth}
                onChangeText={(value) => setFormData({ ...formData, northRoadWidth: value })}
                placeholder="e.g., 25"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.roadWidthField}>
              <Text style={styles.roadWidthLabel}>South Side (feet)</Text>
              <TextInput
                style={styles.roadWidthInput}
                value={formData.southRoadWidth}
                onChangeText={(value) => setFormData({ ...formData, southRoadWidth: value })}
                placeholder="e.g., 15"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );

  const renderStep2 = () => {
    const isBuilding = ['House', 'Apartment'].includes(formData.propertyType);
    const isLand = ['Plot', 'Land', 'Farm'].includes(formData.propertyType);

    return (
      <ScrollView style={styles.stepContent}>
        <Text style={styles.stepTitle}>Property Specifications</Text>

        {isBuilding && (
          <>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Number of Bedrooms *</Text>
              <Dropdown
                options={BEDROOM_OPTIONS}
                selectedValue={formData.bedrooms || ''}
                onSelect={(value) => setFormData({ ...formData, bedrooms: value })}
                placeholder="Select number of bedrooms"
                error={errors.bedrooms}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Number of Bathrooms *</Text>
              <Dropdown
                options={BATHROOM_OPTIONS}
                selectedValue={formData.bathrooms || ''}
                onSelect={(value) => setFormData({ ...formData, bathrooms: value })}
                placeholder="Select number of bathrooms"
                error={errors.bathrooms}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Number of Floors *</Text>
              <Dropdown
                options={FLOORS_OPTIONS}
                selectedValue={formData.floors || ''}
                onSelect={(value) => setFormData({ ...formData, floors: value })}
                placeholder="Select number of floors"
                error={errors.floors}
              />
            </View>

            {formData.propertyType === 'Apartment' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Floor Number</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.floorNumber || ''}
                  onChangeText={(text) => setFormData({ ...formData, floorNumber: text })}
                  placeholder="e.g., 3"
                  keyboardType="numeric"
                />
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Construction Status *</Text>
              <View style={styles.optionsGrid}>
                {['ready', 'under-construction'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.optionButton,
                      formData.constructionStatus === status && styles.optionButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, constructionStatus: status })}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        formData.constructionStatus === status && styles.optionTextActive,
                      ]}
                    >
                      {status === 'ready' ? 'Ready to Move' : 'Under Construction'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.constructionStatus && <Text style={styles.errorText}>{errors.constructionStatus}</Text>}
            </View>
          </>
        )}

        {isLand && (
          <>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Land Type *</Text>
              <Dropdown
                options={LAND_TYPE_OPTIONS}
                selectedValue={formData.landType || ''}
                onSelect={(value) => setFormData({ ...formData, landType: value })}
                placeholder="Select land type"
                error={errors.landType}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Boundary Wall *</Text>
              <View style={styles.optionsGrid}>
                {['yes', 'no'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionButton,
                      formData.boundaryWall === option && styles.optionButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, boundaryWall: option })}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        formData.boundaryWall === option && styles.optionTextActive,
                      ]}
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.boundaryWall && <Text style={styles.errorText}>{errors.boundaryWall}</Text>}
            </View>
          </>
        )}

        {/* Nearby Amenities & Surroundings */}
        <View style={styles.amenitiesSection}>
          <Text style={styles.amenitiesTitle}>Nearby Amenities & Surroundings</Text>
          <Text style={styles.amenitiesSubtitle}>
            Select available amenities and specify their distance from the property
          </Text>
          
          {AMENITIES_LIST.map((key) => (
            <View key={key} style={styles.amenityItem}>
              <TouchableOpacity
                style={styles.amenityCheckbox}
                onPress={() => updateAmenity(key, 'available', !formData.amenities[key as keyof typeof formData.amenities].available)}
              >
                <View style={[
                  styles.checkbox,
                  formData.amenities[key as keyof typeof formData.amenities].available && styles.checkboxChecked
                ]}>
                  {formData.amenities[key as keyof typeof formData.amenities].available && (
                    <Icon name="check" size={16} color="#FFFFFF" />
                  )}
                </View>
                <Text style={styles.amenityLabel}>{AMENITY_LABELS[key]}</Text>
              </TouchableOpacity>
              
              {formData.amenities[key as keyof typeof formData.amenities].available && (
                <TextInput
                  style={styles.amenityDistanceInput}
                  value={formData.amenities[key as keyof typeof formData.amenities].distance}
                  onChangeText={(text) => updateAmenity(key, 'distance', text)}
                  placeholder="Distance (e.g., 500m, 2km)"
                />
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderStep3 = () => (
    <ScrollView style={styles.stepContent}>
      <Text style={styles.stepTitle}>Price Details</Text>

      <View style={styles.infoBox}>
        <Icon name="info" size={20} color="#F59E0B" />
        <Text style={styles.infoText}>
          This platform is for SELLING properties only. Rental listings are not supported.
        </Text>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Expected Selling Price (₹) *</Text>
        <TextInput
          style={[styles.textInput, errors.sellingPrice && styles.textInputError]}
          value={formData.sellingPrice}
          onChangeText={(text) => setFormData({ ...formData, sellingPrice: text })}
          placeholder="e.g., 5000000"
          keyboardType="numeric"
        />
        {formData.sellingPrice && (
          <Text style={styles.priceDisplay}>
            ₹ {parseInt(formData.sellingPrice).toLocaleString('en-IN')}
          </Text>
        )}
        {errors.sellingPrice && <Text style={styles.errorText}>{errors.sellingPrice}</Text>}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Price Type *</Text>
        <View style={styles.optionsGrid}>
          {[
            { value: 'total', label: 'Total Price', desc: 'Complete property price' },
            { value: 'per-unit', label: 'Per Unit Price', desc: 'Price per Sq Ft / Acre' },
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                styles.priceTypeButton,
                formData.priceType === option.value && styles.optionButtonActive,
              ]}
              onPress={() => setFormData({ ...formData, priceType: option.value })}
            >
              <Text
                style={[
                  styles.optionText,
                  formData.priceType === option.value && styles.optionTextActive,
                ]}
              >
                {option.label}
              </Text>
              <Text style={styles.optionDesc}>{option.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Is Price Negotiable? *</Text>
        <View style={styles.optionsGrid}>
          {[
            { value: 'yes', label: 'Yes, Negotiable' },
            { value: 'no', label: 'No, Fixed Price' },
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                formData.negotiable === option.value && styles.optionButtonActive,
              ]}
              onPress={() => setFormData({ ...formData, negotiable: option.value })}
            >
              <Text
                style={[
                  styles.optionText,
                  formData.negotiable === option.value && styles.optionTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Government Circle Rate (Optional)</Text>
        <TextInput
          style={styles.textInput}
          value={formData.circleRate}
          onChangeText={(text) => setFormData({ ...formData, circleRate: text })}
          placeholder="e.g., 4500000"
          keyboardType="numeric"
        />
        <Text style={styles.helpText}>
          For reference only - helps buyers understand market rates
        </Text>
      </View>
    </ScrollView>
  );

  const renderStep4 = () => {
    const documentTypes = [
      { key: 'propertyPhotos', label: 'Property Photos', icon: 'photo-library', required: true, minCount: 3 },
      { key: 'ownership', label: 'Ownership Document / Registry', icon: 'description', required: true, minCount: 1 },
      { key: 'saleDeed', label: 'Sale Deed', icon: 'description', required: true, minCount: 1 },
      { key: 'identityProof', label: 'Identity Proof (Aadhaar / PAN)', icon: 'badge', required: true, minCount: 1 },
      { key: 'khasra', label: 'Khasra / Khata / Patta', icon: 'description', required: false, minCount: 0 },
      { key: 'approvedMap', label: 'Approved Map', icon: 'architecture', required: false, minCount: 0 },
      { key: 'encumbrance', label: 'Encumbrance Certificate', icon: 'verified', required: false, minCount: 0 },
    ];

    return (
      <ScrollView style={styles.stepContent}>
        <Text style={styles.stepTitle}>Property Photos & Documents</Text>

        <View style={styles.infoBox}>
          <Icon name="info" size={20} color="#2563EB" />
          <Text style={styles.infoText}>
            All documents will be verified by our legal team before your property is published.
            Please ensure all documents are clear and readable. Max 5MB per file.
          </Text>
        </View>

        {documentTypes.map((docType) => (
          <View key={docType.key} style={styles.documentSection}>
            <View style={styles.documentHeader}>
              <Icon name={docType.icon} size={20} color={docType.required ? "#059669" : "#6B7280"} />
              <Text style={styles.documentLabel}>
                {docType.label} {docType.required && <Text style={styles.documentRequired}>*</Text>}
              </Text>
              {docType.minCount > 0 && (
                <Text style={styles.documentCount}>
                  (Min {docType.minCount} {docType.minCount === 1 ? 'file' : 'files'})
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.documentUploadButton}
              onPress={() => pickDocument(docType.key as keyof PropertyFormData['documents'])}
            >
              <Icon name="add-a-photo" size={20} color="#2563EB" />
              <Text style={styles.documentUploadText}>
                {formData.documents[docType.key as keyof PropertyFormData['documents']].length > 0 
                  ? 'Add More Files' 
                  : 'Select Files'}
              </Text>
            </TouchableOpacity>

            {/* Show selected files */}
            {formData.documents[docType.key as keyof PropertyFormData['documents']].length > 0 && (
              <View style={styles.selectedFiles}>
                {formData.documents[docType.key as keyof PropertyFormData['documents']].map((file: any, index: number) => (
                  <View key={index} style={styles.selectedFile}>
                    <Icon name="insert-drive-file" size={16} color="#059669" />
                    <Text style={styles.selectedFileName} numberOfLines={1}>
                      {typeof file === 'string' ? `Document ${index + 1}` : file.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removeDocument(docType.key as keyof PropertyFormData['documents'], index)}
                      style={styles.removeFileButton}
                    >
                      <Icon name="close" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Show validation error */}
            {errors[docType.key] && (
              <Text style={styles.errorText}>{errors[docType.key]}</Text>
            )}
          </View>
        ))}

        {/* Upload Guidelines */}
        <View style={styles.uploadGuidelines}>
          <Text style={styles.guidelinesTitle}>Upload Guidelines:</Text>
          <Text style={styles.guidelinesText}>• Supported formats: JPG, PNG</Text>
          <Text style={styles.guidelinesText}>• Maximum file size: 5MB per file</Text>
          <Text style={styles.guidelinesText}>• Ensure documents are clear and readable</Text>
          <Text style={styles.guidelinesText}>• Property photos should show different angles</Text>
        </View>
      </ScrollView>
    );
  };

  const renderStep5 = () => (
    <ScrollView style={styles.stepContent}>
      <Text style={styles.stepTitle}>Review & Submit</Text>

      {/* Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Property Details</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Type:</Text>
          <Text style={styles.summaryValue}>{formData.propertyType}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Title:</Text>
          <Text style={styles.summaryValue}>{formData.propertyTitle}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Location:</Text>
          <Text style={styles.summaryValue}>{formData.city}, {formData.district}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Area:</Text>
          <Text style={styles.summaryValue}>{formData.totalArea} {formData.areaUnit}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Price:</Text>
          <Text style={styles.summaryValue}>
            ₹ {parseInt(formData.sellingPrice || '0').toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {/* Declaration */}
      <TouchableOpacity
        style={[styles.declarationContainer, errors.declaration && styles.declarationError]}
        onPress={() => setFormData({ ...formData, declaration: !formData.declaration })}
      >
        <View style={styles.checkbox}>
          {formData.declaration && <Icon name="check" size={16} color="#2563EB" />}
        </View>
        <Text style={styles.declarationText}>
          I confirm that all details provided are genuine and accurate. I understand that providing false information may result in legal action and permanent ban from the platform.
        </Text>
      </TouchableOpacity>
      {errors.declaration && <Text style={styles.errorText}>{errors.declaration}</Text>}

      {/* Info Box */}
      <View style={styles.successBox}>
        <Text style={styles.successTitle}>What happens next?</Text>
        <Text style={styles.successText}>• Your property will be reviewed by our verification team</Text>
        <Text style={styles.successText}>• Documents will be verified by our legal experts</Text>
        <Text style={styles.successText}>• You'll receive notification once approved (usually within 2-3 business days)</Text>
        <Text style={styles.successText}>• Only verified properties are published on the platform</Text>
      </View>
    </ScrollView>
  );

  const renderNavigationButtons = () => (
    <View style={styles.navigationContainer}>
      <TouchableOpacity
        style={[styles.navButton, styles.backButton, currentStep === 1 && styles.navButtonDisabled]}
        onPress={handleBack}
        disabled={currentStep === 1}
      >
        <Icon name="chevron-left" size={24} color={currentStep === 1 ? '#9CA3AF' : '#374151'} />
        <Text style={[styles.navButtonText, currentStep === 1 && styles.navButtonTextDisabled]}>
          Back
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navButton, styles.saveButton]}
        onPress={saveDraft}
        disabled={saving}
      >
        <Icon name="save" size={20} color="#2563EB" />
        <Text style={styles.saveButtonText}>
          {saving ? 'Saving...' : 'Save Draft'}
        </Text>
      </TouchableOpacity>

      {currentStep < 5 ? (
        <TouchableOpacity
          style={[styles.navButton, styles.nextButton]}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>Next</Text>
          <Icon name="chevron-right" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.submitButton,
            (!formData.declaration || loading) && styles.navButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!formData.declaration || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Icon name="check-circle" size={20} color="#FFFFFF" />
          )}
          <Text style={styles.submitButtonText}>
            {loading ? 'Submitting...' : 'Submit for Verification'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>List Property</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Content */}
        <View style={styles.content}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
        </View>

        {/* Navigation */}
        {renderNavigationButtons()}
      </KeyboardAvoidingView>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerRight: {
    width: 24,
  },
  stepIndicator: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepCircleActive: {
    backgroundColor: '#2563EB',
  },
  stepCircleInactive: {
    backgroundColor: '#E5E7EB',
  },
  stepText: {
    fontSize: 12,
    textAlign: 'center',
  },
  stepTextActive: {
    color: '#111827',
    fontWeight: '600',
  },
  stepTextInactive: {
    color: '#9CA3AF',
  },
  stepLine: {
    position: 'absolute',
    top: 20,
    left: '50%',
    right: '-50%',
    height: 2,
  },
  stepLineActive: {
    backgroundColor: '#2563EB',
  },
  stepLineInactive: {
    backgroundColor: '#E5E7EB',
  },
  content: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    padding: 16,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
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
  textInputError: {
    borderColor: '#EF4444',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  optionButtonActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  optionTextActive: {
    color: '#2563EB',
  },
  optionDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  priceTypeButton: {
    minWidth: '100%',
    alignItems: 'flex-start',
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  flexInput: {
    flex: 1,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
  },
  dropdownContainer: {
    width: 120,
    marginLeft: 8,
  },
  pickerText: {
    fontSize: 16,
    color: '#374151',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    marginLeft: 8,
  },
  priceDisplay: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  helpText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
    textAlign: 'right',
  },
  declarationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
  },
  declarationError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  declarationText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  successBox: {
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    padding: 16,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: '#047857',
    marginBottom: 4,
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  saveButton: {
    backgroundColor: '#EFF6FF',
  },
  nextButton: {
    backgroundColor: '#2563EB',
  },
  submitButton: {
    backgroundColor: '#059669',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 4,
  },
  navButtonTextDisabled: {
    color: '#9CA3AF',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563EB',
    marginLeft: 4,
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginRight: 4,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  documentNote: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 20,
  },
  documentNoteText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    lineHeight: 20,
  },
  documentsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  documentsListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  documentItemText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
  },
  documentRequired: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: 'bold',
  },
  skipDocuments: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 16,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563EB',
    marginLeft: 8,
    textAlign: 'center',
  },
  amenitiesSection: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  amenitiesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  amenitiesSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  amenityItem: {
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  amenityCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkboxChecked: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  amenityLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  amenityDistanceInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#F9FAFB',
  },
  documentSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  documentLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  documentCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  documentUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#2563EB',
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  documentUploadText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563EB',
    marginLeft: 8,
  },
  selectedFiles: {
    marginTop: 12,
  },
  selectedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  selectedFileName: {
    fontSize: 14,
    color: '#059669',
    marginLeft: 8,
    flex: 1,
  },
  removeFileButton: {
    padding: 4,
  },
  // Road Width Styles
  roadWidthContainer: {
    backgroundColor: '#EBF8FF',
    borderWidth: 1,
    borderColor: '#BEE3F8',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  roadWidthTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  roadWidthSubtitle: {
    fontSize: 12,
    color: '#1E40AF',
    marginBottom: 16,
  },
  roadWidthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  roadWidthField: {
    width: '48%',
  },
  roadWidthLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1E40AF',
    marginBottom: 6,
  },
  roadWidthInput: {
    borderWidth: 1,
    borderColor: '#93C5FD',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },
  uploadGuidelines: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  guidelinesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  guidelinesText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
});