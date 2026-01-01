'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import {
  Home, MapPin, FileText, Upload, CheckCircle,
  ChevronRight, ChevronLeft, Save, Loader2
} from 'lucide-react';
import MapboxAddressSearch from '@/components/MapboxAddressSearch';

interface PropertyFormData {
  // Step 1
  propertyType: string;
  propertyTitle: string;
  propertyDescription: string; // New field
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
  // Road widths for each side
  eastRoadWidth: string;
  westRoadWidth: string;
  northRoadWidth: string;
  southRoadWidth: string;

  // Step 2
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

  // Step 3
  sellingPrice: string;
  priceType: string;
  negotiable: string;
  circleRate: string;

  // Step 4
  documents: {
    propertyPhotos: File[];
    ownership: File[];
    saleDeed: File[];
    khasra: File[];
    approvedMap: File[];
    encumbrance: File[];
    identityProof: File[];
  };

  // Step 5
  declaration: boolean;
}

const STEPS = [
  { id: 1, name: 'Property Details', icon: Home },
  { id: 2, name: 'Specifications', icon: FileText },
  { id: 3, name: 'Price Details', icon: MapPin },
  { id: 4, name: 'Documents', icon: Upload },
  { id: 5, name: 'Review & Submit', icon: CheckCircle },
];

export default function AddPropertyPage() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initial empty form data
  const initialFormData: PropertyFormData = {
    propertyType: '',
    propertyTitle: '',
    propertyDescription: '', // New field
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
    // Road widths for each side
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
  };

  const [formData, setFormData] = useState<PropertyFormData>(initialFormData);
  const [checkingVerification, setCheckingVerification] = useState(true);

  // Check if user is verified - fetch fresh data from API
  useEffect(() => {
    const checkVerification = async () => {
      try {
        setCheckingVerification(true);
        const { data } = await api.get(`/users/profile?t=${Date.now()}`);
        
        if (data.verificationStatus !== 'verified') {
          router.push('/verification');
        } else {
          setCheckingVerification(false);
        }
      } catch (error) {
        console.error('Error checking verification:', error);
        router.push('/verification');
      }
    };

    if (user) {
      checkVerification();
    }
  }, [user, router]);

  // CRITICAL: This page is ONLY for NEW properties - NEVER load from localStorage or database
  // For editing existing properties, use /properties/edit/[id] page
  useEffect(() => {
    // Always clear localStorage when this page loads
    // This ensures we start with a clean slate for new properties
    localStorage.removeItem('propertyDraft');
    localStorage.removeItem('currentPropertyId');
    
    // Reset form to initial empty state
    setFormData(initialFormData);
    setPropertyId(null);
    setCurrentStep(1);
  }, []);

  const handleNext = () => {
    // Validate current step
    const validationErrors = validateStep(currentStep);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Scroll to first error
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setErrors({});
    saveDraft();
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const handleBack = () => {
    setErrors({});
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const validateStep = (step: number): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      // Step 1: Property Type & Location
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
      // Step 2: Specifications
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
      // Step 3: Price Details
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

  const saveDraft = async () => {
    setSaving(true);
    try {
      // Prepare data to save
      const dataToSave: any = { ...formData };

      // Remove documents object (File objects can't be sent to backend)
      delete dataToSave.documents;

      // If we're on step 4 (documents) and have a propertyId, upload ONLY NEW files
      if (currentStep === 4 && propertyId) {
        const uploadedDocs: any = {};

        for (const [key, files] of Object.entries(formData.documents)) {
          // Only upload if there are NEW File objects (not already uploaded)
          if (files.length > 0 && files[0] instanceof File) {
            const formDataUpload = new FormData();
            files.forEach((file: File) => {
              formDataUpload.append('files', file);
            });
            formDataUpload.append('folder', key);
            formDataUpload.append('propertyUniqueId', propertyId);

            try {
              const response = await api.post('/properties/upload', formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' }
              });
              uploadedDocs[key] = response.data.urls;
            } catch (uploadError) {
              console.error(`Error uploading ${key}:`, uploadError);
            }
          }
        }

        // Add uploaded document URLs to data
        if (Object.keys(uploadedDocs).length > 0) {
          dataToSave.propertyPhotos = uploadedDocs.propertyPhotos || [];
          dataToSave.ownershipDocs = uploadedDocs.ownership || [];
          dataToSave.saleDeedDocs = uploadedDocs.saleDeed || [];
          dataToSave.khasraDocs = uploadedDocs.khasra || [];
          dataToSave.approvedMapDocs = uploadedDocs.approvedMap || [];
          dataToSave.encumbranceDocs = uploadedDocs.encumbrance || [];
          dataToSave.identityProofDocs = uploadedDocs.identityProof || [];

          // Clear File objects from formData after successful upload
          // This prevents re-uploading on next save
          setFormData({
            ...formData,
            documents: {
              propertyPhotos: [],
              ownership: [],
              saleDeed: [],
              khasra: [],
              approvedMap: [],
              encumbrance: [],
              identityProof: [],
            }
          });
        }
      }

      // Save to backend as draft
      if (propertyId) {
        // Update existing property
        await api.put(`/properties/${propertyId}`, dataToSave);
      } else {
        // Create new property
        const response = await api.post('/properties', dataToSave);
        const newPropertyUniqueId = response.data.property.uniqueId;
        setPropertyId(newPropertyUniqueId);
        localStorage.setItem('currentPropertyId', newPropertyUniqueId);
      }

      // Also save to localStorage as backup (with File objects for form state)
      localStorage.setItem('propertyDraft', JSON.stringify(formData));
    } catch (error) {
      console.error('Save draft error:', error);
      // Fallback to localStorage only
      localStorage.setItem('propertyDraft', JSON.stringify(formData));
    } finally {
      setTimeout(() => setSaving(false), 500);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Documents should already be uploaded in step 4
      // Just submit the property for review
      if (!propertyId) {
        alert('Please save the property first by clicking Next on each step');
        setLoading(false);
        return;
      }

      // Submit property for review (documents already uploaded in step 4)
      await api.post(`/properties/${propertyId}/submit`);

      // Clear draft
      localStorage.removeItem('propertyDraft');
      localStorage.removeItem('currentPropertyId');

      router.push('/my-properties?submitted=true');
    } catch (error: any) {
      console.error('Submit error:', error);
      alert(error.response?.data?.message || 'Failed to submit property');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (checkingVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Checking verification status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">List Property</h1>
          <p className="text-gray-600 mt-2">Fill in the details to list your property for sale</p>
        </div>

        {/* Main Content with Sidebar */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Stepper */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="font-semibold text-gray-900 mb-4">Progress</h2>
              <div className="space-y-4">
                {STEPS.map((step, index) => (
                  <div key={step.id} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${currentStep >= step.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-500'
                          }`}
                      >
                        <step.icon className="w-5 h-5" />
                      </div>
                      {index < STEPS.length - 1 && (
                        <div
                          className={`w-0.5 h-8 my-1 ${currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                        />
                      )}
                    </div>
                    <div className="flex-1 pt-2">
                      <div
                        className={`text-sm font-medium ${currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                          }`}
                      >
                        {step.name}
                      </div>
                      {currentStep === step.id && (
                        <div className="text-xs text-blue-600 mt-1">Current Step</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 space-y-6">
            {/* Form Content */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              {currentStep === 1 && <Step1 formData={formData} setFormData={setFormData} errors={errors} />}
              {currentStep === 2 && <Step2 formData={formData} setFormData={setFormData} errors={errors} />}
              {currentStep === 3 && <Step3 formData={formData} setFormData={setFormData} errors={errors} />}
              {currentStep === 4 && <Step4 formData={formData} setFormData={setFormData} errors={errors} />}
              {currentStep === 5 && <Step5 formData={formData} setFormData={setFormData} errors={errors} />}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-6">
              <button
                onClick={handleBack}
                disabled={currentStep === 1}
                className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              <button
                onClick={saveDraft}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Draft'}
              </button>

              {currentStep < 5 ? (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading || !formData.declaration}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Submit for Verification
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 1: Property Type & Location & Size
function Step1({ formData, setFormData, errors }: any) {
  const propertyTypes = ['House', 'Apartment', 'Plot', 'Land', 'Farm'];
  const facingOptions = ['East', 'West', 'North', 'South', 'North-East', 'North-West', 'South-East', 'South-West'];
  const openSidesOptions = ['1 Side Open', '2 Side Open', '3 Side Open', '4 Side Open'];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Property Type & Location</h2>

      {/* Show validation errors at top */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</p>
          <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
            {Object.values(errors).map((error: any, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Property Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Property Type <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {propertyTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFormData({ ...formData, propertyType: type })}
              className={`p-4 border-2 rounded-lg text-center transition ${
                formData.propertyType === type
                  ? 'border-blue-600 bg-blue-50 text-blue-600'
                  : errors.propertyType
                  ? 'border-red-300 hover:border-red-400'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
          <Home className="w-6 h-6 mx-auto mb-2" />
          <span className="text-sm font-medium">{type}</span>
        </button>
          ))}
      </div>
      {errors.propertyType && (
        <p className="text-sm text-red-600 mt-1">{errors.propertyType}</p>
      )}
    </div>

      {/* Property Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Property Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.propertyTitle}
          onChange={(e) => setFormData({ ...formData, propertyTitle: e.target.value })}
          placeholder="e.g., 2 BHK Independent House near Main Road"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.propertyTitle ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        {errors.propertyTitle && (
          <p className="text-sm text-red-600 mt-1">{errors.propertyTitle}</p>
        )}
      </div>

      {/* Property Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Property Description
        </label>
        <textarea
          value={formData.propertyDescription}
          onChange={(e) => setFormData({ ...formData, propertyDescription: e.target.value })}
          placeholder="Describe your property in detail... (e.g., Well-maintained house with modern amenities, good ventilation, parking space, etc.)"
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">Optional: Add detailed description to attract more buyers</p>
      </div>

  {/* Location Details */ }
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        State <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        value={formData.state}
        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
        placeholder="e.g., Madhya Pradesh"
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        District <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        value={formData.district}
        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
        placeholder="e.g., Indore"
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        City / Town / Village <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        value={formData.city}
        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
        placeholder="e.g., Indore"
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Locality / Area Name <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        value={formData.locality}
        onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
        placeholder="e.g., Vijay Nagar"
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Pincode <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        value={formData.pincode}
        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
        placeholder="e.g., 452010"
        maxLength={6}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  </div>

  {/* Map Location */ }
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
    <div className="flex items-start gap-3">
      <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
      <div className="flex-1">
        <h3 className="font-medium text-blue-900 mb-1">Property Address Search</h3>
        <p className="text-sm text-blue-700 mb-3">
          Search and select the exact address of your property
        </p>
        <MapboxAddressSearch
          onLocationSelect={(location) => {
            setFormData({
              ...formData,
              latitude: location.latitude,
              longitude: location.longitude
            });
          }}
          placeholder="Search for property address..."
          className="w-full"
        />
        {formData.latitude && formData.longitude && (
          <div className="mt-2 text-xs text-green-600">
            ✓ Location coordinates saved: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
          </div>
        )}
      </div>
    </div>
  </div>

  {/* Area Details & Property Orientation */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Total Area <span className="text-red-500">*</span>
      </label>
      <div className="flex gap-2">
        <input
          type="number"
          value={formData.totalArea}
          onChange={(e) => setFormData({ ...formData, totalArea: e.target.value })}
          placeholder="e.g., 1200"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          value={formData.areaUnit}
          onChange={(e) => setFormData({ ...formData, areaUnit: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="sqft">Sq Ft</option>
          <option value="sqm">Sq Meter</option>
          <option value="acre">Acre</option>
          <option value="bigha">Bigha</option>
        </select>
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Property Facing <span className="text-red-500">*</span>
      </label>
      <select
        value={formData.propertyFacing}
        onChange={(e) => setFormData({ ...formData, propertyFacing: e.target.value })}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="">Select Facing</option>
        {facingOptions.map((facing) => (
          <option key={facing} value={facing}>
            {facing}
          </option>
        ))}
      </select>
    </div>
  </div>

  {/* Open Sides */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-3">
      Open Sides <span className="text-red-500">*</span>
    </label>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {openSidesOptions.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setFormData({ ...formData, openSides: option })}
          className={`p-3 border-2 rounded-lg text-center transition ${
            formData.openSides === option
              ? 'border-blue-600 bg-blue-50 text-blue-600'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <span className="text-sm font-medium">{option}</span>
        </button>
      ))}
    </div>
  </div>

  {/* Road Widths for Each Side */}
  {formData.openSides && (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 className="font-medium text-blue-900 mb-3">Road Width for Each Open Side</h3>
      <p className="text-sm text-blue-700 mb-4">
        Enter the road width for each side that is open. Leave blank for closed sides.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-blue-800 mb-2">
            East Side (feet)
          </label>
          <input
            type="number"
            value={formData.eastRoadWidth}
            onChange={(e) => setFormData({ ...formData, eastRoadWidth: e.target.value })}
            placeholder="e.g., 30"
            className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-blue-800 mb-2">
            West Side (feet)
          </label>
          <input
            type="number"
            value={formData.westRoadWidth}
            onChange={(e) => setFormData({ ...formData, westRoadWidth: e.target.value })}
            placeholder="e.g., 20"
            className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-blue-800 mb-2">
            North Side (feet)
          </label>
          <input
            type="number"
            value={formData.northRoadWidth}
            onChange={(e) => setFormData({ ...formData, northRoadWidth: e.target.value })}
            placeholder="e.g., 25"
            className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-blue-800 mb-2">
            South Side (feet)
          </label>
          <input
            type="number"
            value={formData.southRoadWidth}
            onChange={(e) => setFormData({ ...formData, southRoadWidth: e.target.value })}
            placeholder="e.g., 15"
            className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  )}
    </div>
  );
}

// Step 2: Property Specifications & Nearby
function Step2({ formData, setFormData, errors }: any) {
  const isBuilding = ['House', 'Apartment'].includes(formData.propertyType);
  const isLand = ['Plot', 'Land', 'Farm'].includes(formData.propertyType);

  const amenitiesList = [
    'roadAccess', 'electricity', 'waterSupply', 'drainage',
    'hospital', 'school', 'college', 'temple', 'mosque', 'church',
    'market', 'busStand', 'railwayStation', 'highway'
  ];

  const amenityLabels: any = {
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

  const updateAmenity = (key: string, field: string, value: any) => {
    setFormData({
      ...formData,
      amenities: {
        ...formData.amenities,
        [key]: {
          ...formData.amenities[key],
          [field]: value
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Property Specifications</h2>

      {/* For House/Apartment */}
      {isBuilding && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Bedrooms <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.bedrooms || ''}
                onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <option key={num} value={num}>{num} BHK</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Bathrooms <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.bathrooms || ''}
                onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select</option>
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Floors <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.floors || ''}
                onChange={(e) => setFormData({ ...formData, floors: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select</option>
                {[1, 2, 3, 4, 5].map((num) => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>

            {formData.propertyType === 'Apartment' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Floor Number
                </label>
                <input
                  type="number"
                  value={formData.floorNumber || ''}
                  onChange={(e) => setFormData({ ...formData, floorNumber: e.target.value })}
                  placeholder="e.g., 3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Construction Status <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.constructionStatus || ''}
                onChange={(e) => setFormData({ ...formData, constructionStatus: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select</option>
                <option value="ready">Ready to Move</option>
                <option value="under-construction">Under Construction</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* For Plot/Land/Farm */}
      {isLand && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Land Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.landType || ''}
                onChange={(e) => setFormData({ ...formData, landType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="agricultural">Agricultural</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Boundary Wall <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.boundaryWall || ''}
                onChange={(e) => setFormData({ ...formData, boundaryWall: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Nearby Amenities */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Nearby Amenities & Surroundings</h3>
        <p className="text-sm text-gray-600 mb-4">
          Select available amenities and specify their distance from the property
        </p>

        <div className="space-y-3">
          {amenitiesList.map((key) => (
            <div key={key} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg">
              <label className="flex items-center gap-2 min-w-[200px]">
                <input
                  type="checkbox"
                  checked={formData.amenities[key].available}
                  onChange={(e) => updateAmenity(key, 'available', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">{amenityLabels[key]}</span>
              </label>

              {formData.amenities[key].available && (
                <div className="flex-1">
                  <input
                    type="text"
                    value={formData.amenities[key].distance}
                    onChange={(e) => updateAmenity(key, 'distance', e.target.value)}
                    placeholder="Distance (e.g., 500m, 2km)"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Step 3: Price Details
function Step3({ formData, setFormData, errors }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Price Details</h2>

      {/* Show validation errors */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</p>
          <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
            {Object.values(errors).map((error: any, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> This platform is for SELLING properties only. Rental listings are not supported.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Expected Selling Price (₹) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          value={formData.sellingPrice}
          onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
          placeholder="e.g., 5000000"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.sellingPrice ? 'border-red-300' : 'border-gray-300'
            }`}
        />
        {errors.sellingPrice && (
          <p className="text-sm text-red-600 mt-1">{errors.sellingPrice}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          {formData.sellingPrice && `₹ ${parseInt(formData.sellingPrice).toLocaleString('en-IN')}`}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Price Type <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, priceType: 'total' })}
            className={`p-4 border-2 rounded-lg text-left transition ${formData.priceType === 'total'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
              }`}
          >
            <div className="font-medium">Total Price</div>
            <div className="text-sm text-gray-600">Complete property price</div>
          </button>

          <button
            type="button"
            onClick={() => setFormData({ ...formData, priceType: 'per-unit' })}
            className={`p-4 border-2 rounded-lg text-left transition ${formData.priceType === 'per-unit'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
              }`}
          >
            <div className="font-medium">Per Unit Price</div>
            <div className="text-sm text-gray-600">Price per Sq Ft / Acre</div>
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Is Price Negotiable? <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, negotiable: 'yes' })}
            className={`p-3 border-2 rounded-lg transition ${formData.negotiable === 'yes'
                ? 'border-green-600 bg-green-50 text-green-700'
                : 'border-gray-200 hover:border-gray-300'
              }`}
          >
            Yes, Negotiable
          </button>

          <button
            type="button"
            onClick={() => setFormData({ ...formData, negotiable: 'no' })}
            className={`p-3 border-2 rounded-lg transition ${formData.negotiable === 'no'
                ? 'border-red-600 bg-red-50 text-red-700'
                : 'border-gray-200 hover:border-gray-300'
              }`}
          >
            No, Fixed Price
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Government Circle Rate (Optional)
        </label>
        <input
          type="number"
          value={formData.circleRate}
          onChange={(e) => setFormData({ ...formData, circleRate: e.target.value })}
          placeholder="e.g., 4500000"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          For reference only - helps buyers understand market rates
        </p>
      </div>
    </div>
  );
}

// Step 4: Documents Upload
function Step4({ formData, setFormData, errors }: any) {
  const handleFileChange = (key: string, files: FileList | null) => {
    if (files) {
      // Append new files to existing ones instead of replacing
      const existingFiles = formData.documents[key] || [];
      const newFiles = Array.from(files);

      setFormData({
        ...formData,
        documents: {
          ...formData.documents,
          [key]: [...existingFiles, ...newFiles]
        }
      });
    }
  };

  const removeFile = (key: string, index: number) => {
    const updatedFiles = [...formData.documents[key]];
    updatedFiles.splice(index, 1);

    setFormData({
      ...formData,
      documents: {
        ...formData.documents,
        [key]: updatedFiles
      }
    });
  };

  const documentTypes = [
    { key: 'propertyPhotos', label: 'Property Photos', required: true, accept: '.jpg,.jpeg,.png', note: 'Upload clear photos of your property (Min 3, Max 10 photos)' },
    { key: 'ownership', label: 'Ownership Document / Registry', required: true, accept: '.pdf,.jpg,.jpeg,.png', note: 'Accepted formats: PDF, JPG, PNG (Max 5MB per file)' },
    { key: 'saleDeed', label: 'Sale Deed', required: true, accept: '.pdf,.jpg,.jpeg,.png', note: 'Accepted formats: PDF, JPG, PNG (Max 5MB per file)' },
    { key: 'khasra', label: 'Khasra / Khata / Patta', required: false, accept: '.pdf,.jpg,.jpeg,.png', note: 'Required for land/plot properties' },
    { key: 'approvedMap', label: 'Approved Map', required: false, accept: '.pdf,.jpg,.jpeg,.png', note: 'Building plan approved by authorities' },
    { key: 'encumbrance', label: 'Encumbrance Certificate', required: false, accept: '.pdf,.jpg,.jpeg,.png', note: 'Shows property is free from legal dues' },
    { key: 'identityProof', label: 'Identity Proof (Aadhaar / PAN)', required: true, accept: '.pdf,.jpg,.jpeg,.png', note: 'Seller identity verification' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Property Photos & Documents</h2>

      {/* Show validation errors */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</p>
          <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
            {Object.values(errors).map((error: any, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Important:</strong> All documents will be verified by our legal team before your property is published.
          Please ensure all documents are clear and readable.
        </p>
      </div>

      <div className="space-y-4">
        {documentTypes.map((doc) => (
          <div key={doc.key} className={`border rounded-lg p-4 ${doc.key === 'propertyPhotos' ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {doc.label} {doc.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="file"
              multiple={doc.key === 'propertyPhotos'}
              accept={doc.accept}
              onChange={(e) => handleFileChange(doc.key, e.target.files)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              {doc.note}
            </p>
            {formData.documents[doc.key].length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-green-600">
                  ✓ {formData.documents[doc.key].length} file(s) selected
                </p>
                <div className="space-y-1">
                  {formData.documents[doc.key].map((file: File, index: number) => (
                    <div key={index} className="flex items-center justify-between bg-white px-3 py-2 rounded border border-gray-200">
                      <span className="text-sm text-gray-700 truncate flex-1">
                        {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(doc.key, index)}
                        className="ml-2 text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Step 5: Review & Submit
function Step5({ formData, setFormData, errors }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Review & Submit</h2>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Property Details</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-600">Type:</div>
            <div className="font-medium">{formData.propertyType}</div>
            <div className="text-gray-600">Title:</div>
            <div className="font-medium">{formData.propertyTitle}</div>
            <div className="text-gray-600">Location:</div>
            <div className="font-medium">{formData.city}, {formData.district}</div>
            <div className="text-gray-600">Area:</div>
            <div className="font-medium">{formData.totalArea} {formData.areaUnit}</div>
            <div className="text-gray-600">Price:</div>
            <div className="font-medium">₹ {parseInt(formData.sellingPrice || 0).toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      {/* Declaration */}
      <div className={`border rounded-lg p-4 ${errors.declaration ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.declaration}
            onChange={(e) => setFormData({ ...formData, declaration: e.target.checked })}
            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 mt-0.5"
          />
          <span className="text-sm text-gray-700">
            I confirm that all details and documents provided are genuine and accurate. I understand that providing false information may result in legal action and permanent ban from the platform.
          </span>
        </label>
        {errors.declaration && (
          <p className="text-sm text-red-600 mt-2">{errors.declaration}</p>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-green-900 mb-2">What happens next?</h3>
        <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
          <li>Your property will be reviewed by our verification team</li>
          <li>Documents will be verified by our legal experts</li>
          <li>You'll receive notification once approved (usually within 2-3 business days)</li>
          <li>Only verified properties are published on the platform</li>
        </ul>
      </div>
    </div>
  );
}
