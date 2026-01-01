import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary, launchCamera, ImagePickerResponse, Asset } from 'react-native-image-picker';
import { COLORS } from '../../utils/constants';
import apiClient from '../../services/api.service';

interface VerificationData {
  fullName: string;
  fatherName: string;
  motherName: string;
  dateOfBirth: string;
  mobile: string;
  alternateMobile: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  aadharNumber: string;
  panNumber: string;
}

interface DocumentFiles {
  photo: any;
  aadharFront: any;
  aadharBack: any;
  panCard: any;
}

interface ExistingDocs {
  photo?: string;
  aadharFront?: string;
  aadharBack?: string;
  panCard?: string;
}

const VerificationScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [existingDocs, setExistingDocs] = useState<ExistingDocs>({});

  const [formData, setFormData] = useState<VerificationData>({
    fullName: '',
    fatherName: '',
    motherName: '',
    dateOfBirth: '',
    mobile: '',
    alternateMobile: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    aadharNumber: '',
    panNumber: '',
  });

  const [documents, setDocuments] = useState<DocumentFiles>({
    photo: null,
    aadharFront: null,
    aadharBack: null,
    panCard: null,
  });

  const steps = [
    { title: 'Personal Details', icon: 'person' },
    { title: 'Address Details', icon: 'location-on' },
    { title: 'Legal & Documents', icon: 'credit-card' },
  ];

  useEffect(() => {
    loadExistingData();
  }, []);

  const loadExistingData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/verification/status');
      
      if (response.data.data) {
        const data = response.data.data;
        setFormData({
          fullName: data.fullName || '',
          fatherName: data.fatherName || '',
          motherName: data.motherName || '',
          dateOfBirth: data.dateOfBirth || '',
          mobile: data.mobile || '',
          alternateMobile: data.alternateMobile || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          pincode: data.pincode || '',
          aadharNumber: data.aadharNumber || '',
          panNumber: data.panNumber || '',
        });

        if (data.documents) {
          setExistingDocs(data.documents);
        }
      }
    } catch (error) {
      console.log('No existing verification data found');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof VerificationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = (documentType: keyof DocumentFiles) => {
    Alert.alert(
      'Select Document',
      'Choose how you want to select your document',
      [
        { text: 'Camera', onPress: () => openCamera(documentType) },
        { text: 'Gallery', onPress: () => openGallery(documentType) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const openCamera = (documentType: keyof DocumentFiles) => {
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
        setDocuments(prev => ({
          ...prev,
          [documentType]: {
            uri: asset.uri || '',
            type: asset.type || 'image/jpeg',
            name: asset.fileName || `${documentType}_${Date.now()}.jpg`,
          },
        }));
      }
    });
  };

  const openGallery = (documentType: keyof DocumentFiles) => {
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
        setDocuments(prev => ({
          ...prev,
          [documentType]: {
            uri: asset.uri || '',
            type: asset.type || 'image/jpeg',
            name: asset.fileName || `${documentType}_${Date.now()}.jpg`,
          },
        }));
      }
    });
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Personal Details (including contact info)
        return !!(formData.fullName && formData.fatherName && formData.motherName && formData.dateOfBirth && formData.mobile);
      case 1: // Address Details
        return !!(formData.address && formData.city && formData.state && formData.pincode);
      case 2: // Legal Documents & Upload
        return !!(
          formData.aadharNumber && 
          formData.panNumber &&
          (existingDocs.photo || documents.photo) &&
          (existingDocs.aadharFront || documents.aadharFront)
        );
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    } else {
      Alert.alert('Incomplete', 'Please fill all required fields before proceeding');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const submitVerification = async () => {
    if (!validateStep(2)) {
      Alert.alert('Incomplete', 'Please complete all required fields and upload documents');
      return;
    }

    try {
      setSubmitting(true);

      const formDataToSend = new FormData();

      // Add text fields
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      // Add files
      if (documents.photo) {
        formDataToSend.append('photo', {
          uri: documents.photo.uri,
          type: documents.photo.type,
          name: documents.photo.name,
        } as any);
      }
      if (documents.aadharFront) {
        formDataToSend.append('aadharFront', {
          uri: documents.aadharFront.uri,
          type: documents.aadharFront.type,
          name: documents.aadharFront.name,
        } as any);
      }
      if (documents.aadharBack) {
        formDataToSend.append('aadharBack', {
          uri: documents.aadharBack.uri,
          type: documents.aadharBack.type,
          name: documents.aadharBack.name,
        } as any);
      }
      if (documents.panCard) {
        formDataToSend.append('panCard', {
          uri: documents.panCard.uri,
          type: documents.panCard.type,
          name: documents.panCard.name,
        } as any);
      }

      await apiClient.post('/verification/submit', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert(
        'Success',
        'Verification submitted successfully! Your documents are under review.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      console.error('Verification submission error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to submit verification'
      );
    } finally {
      setSubmitting(false);
    }
  };


  const renderPersonalDetails = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Personal Details</Text>
      <Text style={styles.stepSubtitle}>
        Enter details exactly as they appear on your ID documents
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="As per Aadhar"
          value={formData.fullName}
          onChangeText={(value) => handleInputChange('fullName', value)}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Date of Birth *</Text>
        <TextInput
          style={styles.input}
          placeholder="DD/MM/YYYY"
          value={formData.dateOfBirth}
          onChangeText={(value) => handleInputChange('dateOfBirth', value)}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Father's Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Father's full name"
          value={formData.fatherName}
          onChangeText={(value) => handleInputChange('fatherName', value)}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Mother's Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Mother's full name"
          value={formData.motherName}
          onChangeText={(value) => handleInputChange('motherName', value)}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Mobile Number *</Text>
        <TextInput
          style={styles.input}
          placeholder="Linked with Aadhar"
          value={formData.mobile}
          onChangeText={(value) => handleInputChange('mobile', value)}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Alternative Mobile Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Optional"
          value={formData.alternateMobile}
          onChangeText={(value) => handleInputChange('alternateMobile', value)}
          keyboardType="phone-pad"
        />
      </View>
    </View>
  );



  const renderAddressDetails = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Address Details</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Full Address *</Text>
        <TextInput
          style={styles.input}
          placeholder="House No, Street, Area"
          value={formData.address}
          onChangeText={(value) => handleInputChange('address', value)}
          multiline
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputContainer, styles.flex1]}>
          <Text style={styles.label}>City *</Text>
          <TextInput
            style={styles.input}
            placeholder="City name"
            value={formData.city}
            onChangeText={(value) => handleInputChange('city', value)}
          />
        </View>

        <View style={[styles.inputContainer, styles.flex1, styles.marginLeft]}>
          <Text style={styles.label}>State *</Text>
          <TextInput
            style={styles.input}
            placeholder="State name"
            value={formData.state}
            onChangeText={(value) => handleInputChange('state', value)}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>PIN Code *</Text>
        <TextInput
          style={styles.input}
          placeholder="6-digit PIN"
          value={formData.pincode}
          onChangeText={(value) => handleInputChange('pincode', value)}
          keyboardType="numeric"
          maxLength={6}
        />
      </View>
    </View>
  );

  const renderLegalAndDocuments = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Legal Documents & Upload</Text>
      <Text style={styles.stepSubtitle}>
        Enter document numbers and upload clear images
      </Text>

      {/* Legal Document Numbers */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Aadhar Number *</Text>
        <TextInput
          style={styles.input}
          placeholder="12-digit number"
          value={formData.aadharNumber}
          onChangeText={(value) => handleInputChange('aadharNumber', value)}
          keyboardType="numeric"
          maxLength={12}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>PAN Number *</Text>
        <TextInput
          style={styles.input}
          placeholder="10-character alphanumeric"
          value={formData.panNumber}
          onChangeText={(value) => handleInputChange('panNumber', value)}
          autoCapitalize="characters"
          maxLength={10}
        />
      </View>

      {/* Document Upload Section */}
      <Text style={[styles.stepTitle, { fontSize: 20, marginTop: 24, marginBottom: 8 }]}>
        Upload Documents
      </Text>
      <Text style={styles.stepSubtitle}>
        Upload clear images (JPG, PNG). Max 5MB each.
      </Text>

      {/* Photo */}
      <View style={styles.documentItem}>
        <Text style={styles.documentLabel}>Your Photo *</Text>
        {existingDocs.photo && !documents.photo && (
          <Text style={styles.existingDoc}>Current file uploaded</Text>
        )}
        <TouchableOpacity
          style={styles.documentButton}
          onPress={() => pickImage('photo')}
        >
          <Icon name="camera-alt" size={20} color={COLORS.primary} />
          <Text style={styles.documentButtonText}>
            {documents.photo ? 'Change Photo' : 'Select Photo'}
          </Text>
        </TouchableOpacity>
        {documents.photo && (
          <Text style={styles.selectedFile}>✓ New file selected</Text>
        )}
      </View>

      {/* Aadhar Front */}
      <View style={styles.documentItem}>
        <Text style={styles.documentLabel}>Aadhar Front Side *</Text>
        {existingDocs.aadharFront && !documents.aadharFront && (
          <Text style={styles.existingDoc}>Current file uploaded</Text>
        )}
        <TouchableOpacity
          style={styles.documentButton}
          onPress={() => pickImage('aadharFront')}
        >
          <Icon name="credit-card" size={20} color={COLORS.primary} />
          <Text style={styles.documentButtonText}>
            {documents.aadharFront ? 'Change Aadhar Front' : 'Select Aadhar Front'}
          </Text>
        </TouchableOpacity>
        {documents.aadharFront && (
          <Text style={styles.selectedFile}>✓ New file selected</Text>
        )}
      </View>

      {/* Aadhar Back */}
      <View style={styles.documentItem}>
        <Text style={styles.documentLabel}>Aadhar Back Side</Text>
        {existingDocs.aadharBack && !documents.aadharBack && (
          <Text style={styles.existingDoc}>Current file uploaded</Text>
        )}
        <TouchableOpacity
          style={styles.documentButton}
          onPress={() => pickImage('aadharBack')}
        >
          <Icon name="credit-card" size={20} color={COLORS.primary} />
          <Text style={styles.documentButtonText}>
            {documents.aadharBack ? 'Change Aadhar Back' : 'Select Aadhar Back'}
          </Text>
        </TouchableOpacity>
        {documents.aadharBack && (
          <Text style={styles.selectedFile}>✓ New file selected</Text>
        )}
      </View>

      {/* PAN Card */}
      <View style={styles.documentItem}>
        <Text style={styles.documentLabel}>PAN Card</Text>
        {existingDocs.panCard && !documents.panCard && (
          <Text style={styles.existingDoc}>Current file uploaded</Text>
        )}
        <TouchableOpacity
          style={styles.documentButton}
          onPress={() => pickImage('panCard')}
        >
          <Icon name="account-balance-wallet" size={20} color={COLORS.primary} />
          <Text style={styles.documentButtonText}>
            {documents.panCard ? 'Change PAN Card' : 'Select PAN Card'}
          </Text>
        </TouchableOpacity>
        {documents.panCard && (
          <Text style={styles.selectedFile}>✓ New file selected</Text>
        )}
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderPersonalDetails();
      case 1:
        return renderAddressDetails();
      case 2:
        return renderLegalAndDocuments();
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading verification data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Identity Verification</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Step Indicator */}
      <View style={styles.stepIndicator}>
        {steps.map((step, index) => (
          <View key={index} style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                {
                  backgroundColor:
                    index <= currentStep ? COLORS.primary : '#e5e7eb',
                },
              ]}
            >
              <Icon
                name={step.icon}
                size={16}
                color={index <= currentStep ? '#fff' : '#9ca3af'}
              />
            </View>
            <Text
              style={[
                styles.stepText,
                { color: index <= currentStep ? COLORS.primary : '#9ca3af' },
              ]}
            >
              {step.title}
            </Text>
          </View>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationButtons}>
        {currentStep > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={prevStep}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}

        {currentStep < steps.length - 1 ? (
          <TouchableOpacity
            style={[styles.nextButton, { flex: currentStep === 0 ? 1 : 0.5 }]}
            onPress={nextStep}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.submitButton, { flex: 0.5 }]}
            onPress={submitVerification}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  stepIndicator: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  stepItem: {
    alignItems: 'center',
    marginRight: 20,
    flex: 1,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepText: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },

  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  stepContent: {
    paddingTop: 0,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  marginLeft: {
    marginLeft: 12,
  },
  documentItem: {
    marginBottom: 24,
  },
  documentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  existingDoc: {
    fontSize: 12,
    color: '#10b981',
    marginBottom: 8,
  },
  documentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
  },
  documentButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  selectedFile: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 8,
    fontWeight: '600',
  },
  navigationButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  backButton: {
    flex: 0.5,
    backgroundColor: '#f3f4f6',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default VerificationScreen;