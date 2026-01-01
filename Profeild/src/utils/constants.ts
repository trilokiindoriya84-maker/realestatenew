import Config from '../config/environment';

// Backend API Configuration
export const API_BASE_URL = Config.API_BASE_URL;

// Default images
export const DEFAULT_IMAGES = {
  PROPERTY: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
  PLACEHOLDER: 'https://via.placeholder.com/300x200?text=No+Image',
};

export const COLORS = {
  primary: '#f97316', // Orange theme
  secondary: '#64748b',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  white: '#ffffff',
  black: '#000000',
  orange: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};

export const PROPERTY_TYPES = ['House', 'Apartment', 'Plot', 'Land', 'Farm'];

export const AREA_UNITS = ['sqft', 'sqm', 'acre', 'bigha'];

export const PRICE_TYPES = ['total', 'per-unit'];

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  USERS_SYNC: '/users/sync',
  USERS_PROFILE: '/users/profile',
  
  // Properties
  PUBLIC_PROPERTIES: '/public/published-properties',
  PROPERTIES: '/properties',
  MY_PROPERTIES: '/properties/my-properties',
  
  // Verification
  VERIFICATION_SUBMIT: '/verification/submit',
  VERIFICATION_STATUS: '/verification/status',
  
  // Enquiries
  ENQUIRIES: '/enquiries',
  MY_ENQUIRIES: '/enquiries/my-enquiries',
  
  // Saved Properties
  SAVED_PROPERTIES: '/saved-properties',
};
