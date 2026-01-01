import apiClient from './api.service';
import { API_ENDPOINTS } from '../utils/constants';

export const PropertyService = {
  // Get all published properties
  getPublishedProperties: async (limit = 10) => {
    const response = await apiClient.get(`${API_ENDPOINTS.PUBLIC_PROPERTIES}?limit=${limit}`);
    return response.data;
  },

  // Get property by uniqueId
  getPropertyById: async (uniqueId: string) => {
    const response = await apiClient.get(`${API_ENDPOINTS.PUBLIC_PROPERTIES}/${uniqueId}`);
    return response.data;
  },

  // Create new property
  createProperty: async (propertyData: any) => {
    const response = await apiClient.post(API_ENDPOINTS.PROPERTIES, propertyData);
    return response.data;
  },

  // Update existing property
  updateProperty: async (uniqueId: string, propertyData: any) => {
    const response = await apiClient.put(`${API_ENDPOINTS.PROPERTIES}/${uniqueId}`, propertyData);
    return response.data;
  },

  // Get property for editing (with ownership check)
  getPropertyForEdit: async (uniqueId: string) => {
    const response = await apiClient.get(`${API_ENDPOINTS.PROPERTIES}/view/${uniqueId}`);
    return response.data;
  },

  // Submit property for review
  submitProperty: async (uniqueId: string) => {
    const response = await apiClient.post(`${API_ENDPOINTS.PROPERTIES}/${uniqueId}/submit`);
    return response.data;
  },

  // Get user properties
  getUserProperties: async () => {
    const response = await apiClient.get(API_ENDPOINTS.MY_PROPERTIES);
    return response.data;
  },

  // Delete property
  deleteProperty: async (uniqueId: string) => {
    const response = await apiClient.delete(`${API_ENDPOINTS.PROPERTIES}/${uniqueId}`);
    return response.data;
  },

  // Submit enquiry
  submitEnquiry: async (enquiryData: any) => {
    const response = await apiClient.post(API_ENDPOINTS.ENQUIRIES, enquiryData);
    return response.data;
  },

  // Get user enquiries
  getUserEnquiries: async () => {
    const response = await apiClient.get(API_ENDPOINTS.MY_ENQUIRIES);
    return response.data;
  },

  // Save property
  saveProperty: async (propertyUniqueId: string) => {
    const response = await apiClient.post(API_ENDPOINTS.SAVED_PROPERTIES, { propertyUniqueId });
    return response.data;
  },

  // Unsave property
  unsaveProperty: async (propertyUniqueId: string) => {
    const response = await apiClient.delete(`${API_ENDPOINTS.SAVED_PROPERTIES}/${propertyUniqueId}`);
    return response.data;
  },

  // Get saved properties
  getSavedProperties: async () => {
    const response = await apiClient.get(API_ENDPOINTS.SAVED_PROPERTIES);
    return response.data;
  },

  // Upload property documents
  uploadPropertyDocuments: async (propertyUniqueId: string, documentType: string, files: any[]) => {
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append('files', {
        uri: file.uri,
        type: file.type,
        name: file.name,
      } as any);
    });
    
    formData.append('folder', documentType);
    formData.append('propertyUniqueId', propertyUniqueId);

    const response = await apiClient.post(`${API_ENDPOINTS.PROPERTIES}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// Export as propertyService for consistency with imports
export const propertyService = PropertyService;
