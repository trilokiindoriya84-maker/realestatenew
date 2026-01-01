import apiClient from './api.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../utils/constants';
import { SupabaseAuthService } from './supabase.service';

export const AuthService = {
  // Sync user with backend (matches your web app)
  syncUser: async () => {
    try {
      // Ensure we have a valid token before making the request
      const session = await SupabaseAuthService.getSession();
      if (session?.access_token) {
        await AuthService.setAuthToken(session.access_token);
      }
      
      const response = await apiClient.post(API_ENDPOINTS.USERS_SYNC);
      return response.data;
    } catch (error) {
      console.error('Sync user error:', error);
      throw error;
    }
  },

  // Get user profile (matches your web app)
  getProfile: async () => {
    try {
      // Ensure we have a valid token before making the request
      const session = await SupabaseAuthService.getSession();
      if (session?.access_token) {
        await AuthService.setAuthToken(session.access_token);
      }
      
      const response = await apiClient.get(API_ENDPOINTS.USERS_PROFILE);
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },

  // Store auth token
  setAuthToken: async (token: string) => {
    await AsyncStorage.setItem('authToken', token);
  },

  // Get stored auth token
  getAuthToken: async (): Promise<string | null> => {
    return await AsyncStorage.getItem('authToken');
  },

  // Clear auth token
  clearAuthToken: async () => {
    await AsyncStorage.removeItem('authToken');
  },

  // Logout
  logout: async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userProfile');
  },
};
