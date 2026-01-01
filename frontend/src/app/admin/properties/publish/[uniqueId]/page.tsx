'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Globe, Loader2, Upload, X, MapPin } from 'lucide-react';
import api from '@/lib/api';
import MapboxAddressSearch from '@/components/MapboxAddressSearch';

interface PublishFormData {
  propertyType: string;
  propertyTitle: string;
  propertyDescription: string;
  state: string;
  district: string;
  city: string;
  locality: string;
  pincode: string;
  latitude: string;
  longitude: string;
  totalArea: string;
  areaUnit: string;
  propertyFacing: string;
  openSides: string;
  eastRoadWidth: string;
  westRoadWidth: string;
  northRoadWidth: string;
  southRoadWidth: string;
  bedrooms: string;
  bathrooms: string;
  floors: string;
  floorNumber: string;
  constructionStatus: string;
  landType: string;
  boundaryWall: string;
  amenities: any;
  sellingPrice: string;
  priceType: string;
  negotiable: string;
  circleRate: string;
  publishedPhotos: File[];
}

export default function PublishPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const [originalProperty, setOriginalProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [existingPublishedPhotos, setExistingPublishedPhotos] = useState<string[]>([]);
  const [isPublishedDataLoaded, setIsPublishedDataLoaded] = useState(false);
  
  const [formData, setFormData] = useState<PublishFormData>({
    propertyType: '',
    propertyTitle: '',
    propertyDescription: '',
    state: '',
    district: '',
    city: '',
    locality: '',
    pincode: '',
    latitude: '',
    longitude: '',
    totalArea: '',
    areaUnit: 'sqft',
    propertyFacing: '',
    openSides: '',
    eastRoadWidth: '',
    westRoadWidth: '',
    northRoadWidth: '',
    southRoadWidth: '',
    bedrooms: '',
    bathrooms: '',
    floors: '',
    floorNumber: '',
    constructionStatus: '',
    landType: '',
    boundaryWall: '',
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
    publishedPhotos: [],
  });

  useEffect(() => {
    if (params.uniqueId) {
      fetchPropertyForPublishing();
    }
  }, [params.uniqueId]);

  const fetchPropertyForPublishing = async () => {
    try {
      setLoading(true);
      
      // Get original property data
      const originalResponse = await api.get(`/admin/properties/${params.uniqueId}/details`);
      const originalData = originalResponse.data;
      setOriginalProperty(originalData);
      
      // Try to get existing published property first
      try {
        const publishedResponse = await api.get(`/admin/published-properties/${params.uniqueId}`);
        const publishedData = publishedResponse.data;
        
        // If published data exists, load it
        setFormData({
          propertyType: publishedData.propertyType || originalData.propertyType || '',
          propertyTitle: publishedData.propertyTitle || originalData.propertyTitle || '',
          propertyDescription: publishedData.propertyDescription || originalData.propertyDescription || '',
          state: publishedData.state || originalData.state || '',
          district: publishedData.district || originalData.district || '',
          city: publishedData.city || originalData.city || '',
          locality: publishedData.locality || originalData.locality || '',
          pincode: publishedData.pincode || originalData.pincode || '',
          latitude: publishedData.latitude || originalData.latitude || '',
          longitude: publishedData.longitude || originalData.longitude || '',
          totalArea: publishedData.totalArea || originalData.totalArea || '',
          areaUnit: publishedData.areaUnit || originalData.areaUnit || 'sqft',
          propertyFacing: publishedData.propertyFacing || originalData.propertyFacing || '',
          openSides: publishedData.openSides || originalData.openSides || '',
          eastRoadWidth: publishedData.eastRoadWidth || originalData.eastRoadWidth || '',
          westRoadWidth: publishedData.westRoadWidth || originalData.westRoadWidth || '',
          northRoadWidth: publishedData.northRoadWidth || originalData.northRoadWidth || '',
          southRoadWidth: publishedData.southRoadWidth || originalData.southRoadWidth || '',
          bedrooms: publishedData.bedrooms || originalData.bedrooms || '',
          bathrooms: publishedData.bathrooms || originalData.bathrooms || '',
          floors: publishedData.floors || originalData.floors || '',
          floorNumber: publishedData.floorNumber || originalData.floorNumber || '',
          constructionStatus: publishedData.constructionStatus || originalData.constructionStatus || '',
          landType: publishedData.landType || originalData.landType || '',
          boundaryWall: publishedData.boundaryWall || originalData.boundaryWall || '',
          amenities: publishedData.amenities || originalData.amenities || {
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
          sellingPrice: publishedData.sellingPrice || originalData.sellingPrice || '',
          priceType: publishedData.priceType || originalData.priceType || 'total',
          negotiable: publishedData.negotiable || originalData.negotiable || 'yes',
          circleRate: publishedData.circleRate || originalData.circleRate || '',
          publishedPhotos: [],
        });
        
        setExistingPublishedPhotos(publishedData.publishedPhotos || []);
        setIsPublishedDataLoaded(true);
      } catch (publishedError) {
        // No published property exists, load original data
        setFormData({
          propertyType: originalData.propertyType || '',
          propertyTitle: originalData.propertyTitle || '',
          propertyDescription: originalData.propertyDescription || '',
          state: originalData.state || '',
          district: originalData.district || '',
          city: originalData.city || '',
          locality: originalData.locality || '',
          pincode: originalData.pincode || '',
          latitude: originalData.latitude || '',
          longitude: originalData.longitude || '',
          totalArea: originalData.totalArea || '',
          areaUnit: originalData.areaUnit || 'sqft',
          propertyFacing: originalData.propertyFacing || '',
          openSides: originalData.openSides || '',
          eastRoadWidth: originalData.eastRoadWidth || '',
          westRoadWidth: originalData.westRoadWidth || '',
          northRoadWidth: originalData.northRoadWidth || '',
          southRoadWidth: originalData.southRoadWidth || '',
          bedrooms: originalData.bedrooms || '',
          bathrooms: originalData.bathrooms || '',
          floors: originalData.floors || '',
          floorNumber: originalData.floorNumber || '',
          constructionStatus: originalData.constructionStatus || '',
          landType: originalData.landType || '',
          boundaryWall: originalData.boundaryWall || '',
          amenities: originalData.amenities || {
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
          sellingPrice: originalData.sellingPrice || '',
          priceType: originalData.priceType || 'total',
          negotiable: originalData.negotiable || 'yes',
          circleRate: originalData.circleRate || '',
          publishedPhotos: [],
        });
        setIsPublishedDataLoaded(false);
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      alert('Error loading property data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      setFormData({
        ...formData,
        publishedPhotos: [...formData.publishedPhotos, ...newFiles]
      });
    }
  };

  const removeFile = (index: number) => {
    const updatedFiles = [...formData.publishedPhotos];
    updatedFiles.splice(index, 1);
    setFormData({
      ...formData,
      publishedPhotos: updatedFiles
    });
  };

  const removeExistingPhoto = (url: string) => {
    if (!confirm('Are you sure you want to remove this photo?')) return;
    
    const updatedPhotos = existingPublishedPhotos.filter(photo => photo !== url);
    setExistingPublishedPhotos(updatedPhotos);
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const dataToSave: any = { ...formData };
      delete dataToSave.publishedPhotos;

      // Upload new photos if any
      let uploadedPhotos: string[] = [];
      if (formData.publishedPhotos.length > 0) {
        const formDataUpload = new FormData();
        formData.publishedPhotos.forEach((file: File) => {
          formDataUpload.append('files', file);
        });
        formDataUpload.append('folder', 'published');
        formDataUpload.append('propertyUniqueId', params.uniqueId as string);

        const uploadResponse = await api.post('/properties/upload', formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedPhotos = uploadResponse.data.urls;
      }

      // Merge existing and new photos
      dataToSave.publishedPhotos = [...existingPublishedPhotos, ...uploadedPhotos];

      // Save published property data
      const response = await api.post(`/admin/published-properties/${params.uniqueId}`, dataToSave);
      
      // Update state
      setExistingPublishedPhotos(dataToSave.publishedPhotos);
      setFormData({ ...formData, publishedPhotos: [] });
      setIsPublishedDataLoaded(true);
      
      alert('Draft saved successfully!');
      return response.data; // Return the saved data for chaining
    } catch (error: any) {
      console.error('Error saving draft:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save draft';
      alert(`Error: ${errorMessage}`);
      throw error; // Re-throw for proper error handling in publish flow
    } finally {
      setSaving(false);
    }
  };

  const handlePublishLive = async () => {
    if (!formData.propertyTitle.trim()) {
      alert('Property title is required');
      return;
    }
    
    if (!formData.sellingPrice.trim()) {
      alert('Selling price is required');
      return;
    }

    if (existingPublishedPhotos.length + formData.publishedPhotos.length < 3) {
      alert('At least 3 photos are required to publish');
      return;
    }

    if (!confirm('Are you sure you want to publish this property live? It will be visible to all users on the website.')) {
      return;
    }

    setPublishing(true);
    try {
      // STEP 1: ALWAYS save draft first to ensure published property record exists
      console.log('Step 1: Ensuring published property record exists...');
      
      const dataToSave: any = { ...formData };
      delete dataToSave.publishedPhotos;

      // Upload new photos if any
      let uploadedPhotos: string[] = [];
      if (formData.publishedPhotos.length > 0) {
        const formDataUpload = new FormData();
        formData.publishedPhotos.forEach((file: File) => {
          formDataUpload.append('files', file);
        });
        formDataUpload.append('folder', 'published');
        formDataUpload.append('propertyUniqueId', params.uniqueId as string);

        const uploadResponse = await api.post('/properties/upload', formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedPhotos = uploadResponse.data.urls;
      }

      // Merge existing and new photos
      dataToSave.publishedPhotos = [...existingPublishedPhotos, ...uploadedPhotos];

      // Save/update published property data first
      await api.post(`/admin/published-properties/${params.uniqueId}`, dataToSave);
      
      // STEP 2: Now publish live
      const response = await api.post(`/admin/published-properties/${params.uniqueId}/publish`);
      
      // Update local state
      setExistingPublishedPhotos(dataToSave.publishedPhotos);
      setFormData({ ...formData, publishedPhotos: [] });
      setIsPublishedDataLoaded(true);
      
      alert('Property published successfully! It is now live on the website.');
      router.push('/admin/properties/published');
    } catch (error: any) {
      console.error('Error publishing property:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to publish property';
      alert(`Error: ${errorMessage}`);
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const propertyTypes = ['House', 'Apartment', 'Plot', 'Land', 'Farm'];
  const facingOptions = ['East', 'West', 'North', 'South', 'North-East', 'North-West', 'South-East', 'South-West'];
  const openSidesOptions = ['1 Side Open', '2 Side Open', '3 Side Open', '4 Side Open'];

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Publish Property</h1>
              <p className="text-gray-600 mt-1">
                {isPublishedDataLoaded 
                  ? 'Editing published property data' 
                  : 'Edit original property data for publishing'
                }
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              onClick={handlePublishLive}
              disabled={publishing}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Globe className="w-4 h-4" />
              {publishing ? 'Publishing...' : 'Publish Live'}
            </button>
          </div>
        </div>

        {/* Data Source Indicator */}
        <div className={`mb-6 p-4 rounded-lg border ${
          isPublishedDataLoaded 
            ? 'bg-green-50 border-green-200' 
            : 'bg-blue-50 border-blue-200'
        }`}>
          <p className={`text-sm font-medium ${
            isPublishedDataLoaded ? 'text-green-800' : 'text-blue-800'
          }`}>
            {isPublishedDataLoaded 
              ? '✓ Showing published property data (previously edited by admin)'
              : '📝 Showing original property data (submitted by user)'
            }
          </p>
        </div>

        <div className="space-y-6">
          {/* Property Type & Basic Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Property Details</h2>
            
            {/* Property Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.propertyType}
                onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Property Type</option>
                {propertyTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Property Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.propertyTitle}
                onChange={(e) => setFormData({ ...formData, propertyTitle: e.target.value })}
                placeholder="e.g., 3 BHK Independent House near Main Road"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Property Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Description
              </label>
              <textarea
                value={formData.propertyDescription}
                onChange={(e) => setFormData({ ...formData, propertyDescription: e.target.value })}
                placeholder="Describe the property in detail for potential buyers..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Location Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Location</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Locality</label>
                <input
                  type="text"
                  value={formData.locality}
                  onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Address Search with Mapbox */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Property Address
              </label>
              <MapboxAddressSearch
                onLocationSelect={(location) => {
                  setFormData({
                    ...formData,
                    latitude: location.latitude.toString(),
                    longitude: location.longitude.toString()
                  });
                }}
                placeholder="Search for exact property address..."
                initialValue={formData.latitude && formData.longitude ? 
                  `${formData.city}, ${formData.locality}, ${formData.district}, ${formData.state}` : 
                  ""
                }
                className="w-full"
              />
              {formData.latitude && formData.longitude && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <span className="font-medium">Location coordinates saved:</span>
                    <span>Lat: {parseFloat(formData.latitude).toFixed(6)}, Lng: {parseFloat(formData.longitude).toFixed(6)}</span>
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Search and select the exact property location for better visibility to buyers
              </p>
            </div>
          </div>

          {/* Property Specifications */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Property Specifications</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Area</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.totalArea}
                    onChange={(e) => setFormData({ ...formData, totalArea: e.target.value })}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Property Facing</label>
                <select
                  value={formData.propertyFacing}
                  onChange={(e) => setFormData({ ...formData, propertyFacing: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Facing</option>
                  {facingOptions.map((facing) => (
                    <option key={facing} value={facing}>{facing}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Open Sides</label>
                <select
                  value={formData.openSides}
                  onChange={(e) => setFormData({ ...formData, openSides: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Open Sides</option>
                  {openSidesOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Road Widths */}
            {formData.openSides && (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-3">Road Width for Each Open Side</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-2">East Side (feet)</label>
                    <input
                      type="number"
                      value={formData.eastRoadWidth}
                      onChange={(e) => setFormData({ ...formData, eastRoadWidth: e.target.value })}
                      placeholder="e.g., 20"
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-2">West Side (feet)</label>
                    <input
                      type="number"
                      value={formData.westRoadWidth}
                      onChange={(e) => setFormData({ ...formData, westRoadWidth: e.target.value })}
                      placeholder="e.g., 15"
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-2">North Side (feet)</label>
                    <input
                      type="number"
                      value={formData.northRoadWidth}
                      onChange={(e) => setFormData({ ...formData, northRoadWidth: e.target.value })}
                      placeholder="e.g., 25"
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-2">South Side (feet)</label>
                    <input
                      type="number"
                      value={formData.southRoadWidth}
                      onChange={(e) => setFormData({ ...formData, southRoadWidth: e.target.value })}
                      placeholder="e.g., 30"
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Building Specifications */}
            {(formData.propertyType === 'House' || formData.propertyType === 'Apartment') && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
                  <select
                    value={formData.bedrooms}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
                  <select
                    value={formData.bathrooms}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Floors</label>
                  <select
                    value={formData.floors}
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Floor Number</label>
                    <input
                      type="number"
                      value={formData.floorNumber}
                      onChange={(e) => setFormData({ ...formData, floorNumber: e.target.value })}
                      placeholder="e.g., 3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Construction Status</label>
                  <select
                    value={formData.constructionStatus}
                    onChange={(e) => setFormData({ ...formData, constructionStatus: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select</option>
                    <option value="ready">Ready to Move</option>
                    <option value="under-construction">Under Construction</option>
                  </select>
                </div>
              </div>
            )}

            {/* Land Specifications */}
            {(formData.propertyType === 'Plot' || formData.propertyType === 'Land' || formData.propertyType === 'Farm') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Land Type</label>
                  <select
                    value={formData.landType}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Boundary Wall</label>
                  <select
                    value={formData.boundaryWall}
                    onChange={(e) => setFormData({ ...formData, boundaryWall: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Nearby Amenities */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Nearby Amenities & Surroundings</h2>
            <p className="text-sm text-gray-600 mb-4">
              Select available amenities and specify their distance from the property
            </p>

            <div className="space-y-3">
              {Object.entries(formData.amenities).map(([key, amenity]: [string, any]) => (
                <div key={key} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg">
                  <label className="flex items-center gap-2 min-w-[200px]">
                    <input
                      type="checkbox"
                      checked={amenity.available}
                      onChange={(e) => setFormData({
                        ...formData,
                        amenities: {
                          ...formData.amenities,
                          [key]: {
                            ...formData.amenities[key],
                            available: e.target.checked
                          }
                        }
                      })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">{amenityLabels[key]}</span>
                  </label>

                  {amenity.available && (
                    <div className="flex-1">
                      <input
                        type="text"
                        value={amenity.distance}
                        onChange={(e) => setFormData({
                          ...formData,
                          amenities: {
                            ...formData.amenities,
                            [key]: {
                              ...formData.amenities[key],
                              distance: e.target.value
                            }
                          }
                        })}
                        placeholder="Distance (e.g., 500m, 2km)"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Price Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Price Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selling Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {formData.sellingPrice && (
                  <p className="text-xs text-gray-500 mt-1">
                    ₹ {parseInt(formData.sellingPrice).toLocaleString('en-IN')}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Type</label>
                <select
                  value={formData.priceType}
                  onChange={(e) => setFormData({ ...formData, priceType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="total">Total Price</option>
                  <option value="per-unit">Per Unit Price</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Negotiable</label>
                <select
                  value={formData.negotiable}
                  onChange={(e) => setFormData({ ...formData, negotiable: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="yes">Yes, Negotiable</option>
                  <option value="no">No, Fixed Price</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Circle Rate (Optional)</label>
                <input
                  type="number"
                  value={formData.circleRate}
                  onChange={(e) => setFormData({ ...formData, circleRate: e.target.value })}
                  placeholder="Government circle rate"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {formData.circleRate && (
                  <p className="text-xs text-gray-500 mt-1">
                    ₹ {parseInt(formData.circleRate).toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            </div>

            {/* Price Summary */}
            {formData.sellingPrice && formData.totalArea && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">Price Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-green-700">Total Price:</span>
                    <span className="font-semibold text-green-900 ml-2">
                      ₹ {parseInt(formData.sellingPrice).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-green-700">Price per {formData.areaUnit}:</span>
                    <span className="font-semibold text-green-900 ml-2">
                      ₹ {Math.round(parseInt(formData.sellingPrice) / parseInt(formData.totalArea)).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Published Photos */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Published Photos</h2>
            <p className="text-sm text-gray-600 mb-4">
              Upload photos that will be displayed to buyers on the website. Minimum 3 photos required.
            </p>
            
            {/* File Upload */}
            <div className="mb-4">
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png"
                onChange={(e) => handleFileChange(e.target.files)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Existing Published Photos */}
            {existingPublishedPhotos.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Current Published Photos</h3>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                  {existingPublishedPhotos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={photo}
                        alt={`Published ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        onClick={() => removeExistingPhoto(photo)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Photos to Upload */}
            {formData.publishedPhotos.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">New Photos to Upload</h3>
                <div className="space-y-2">
                  {formData.publishedPhotos.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded border">
                      <span className="text-sm text-gray-700 truncate flex-1">
                        {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                      <button
                        onClick={() => removeFile(index)}
                        className="ml-2 text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-gray-500 mt-2">
              Total photos: {existingPublishedPhotos.length + formData.publishedPhotos.length} 
              (Minimum 3 required to publish)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}