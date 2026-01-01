import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';
import { AuthService } from './auth.service';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Config from '../config/environment';

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: Config.GOOGLE_WEB_CLIENT_ID,
  offlineAccess: true,
  hostedDomain: '',
  forceCodeForRefreshToken: true,
});

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const SupabaseAuthService = {
  // Sign up with email and password
  signUp: async (email: string, password: string, fullName: string, phoneNumber: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone_number: phoneNumber,
          },
        },
      });

      if (error) throw error;

      // If signup successful and session exists, sync with backend
      if (data.session) {
        await AuthService.setAuthToken(data.session.access_token);
        try {
          await AuthService.syncUser();
        } catch (syncError) {
          // Backend sync failed, but signup successful
        }
      }

      return data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // If login successful, sync with backend
      if (data.session) {
        await AuthService.setAuthToken(data.session.access_token);
        try {
          await AuthService.syncUser();
        } catch (syncError) {
          // Backend sync failed, but login successful
        }
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Sign in with Google
  signInWithGoogle: async () => {
    try {
      // Check if device supports Google Play Services
      await GoogleSignin.hasPlayServices({ 
        showPlayServicesUpdateDialog: true 
      });
      
      // Sign out any existing user first to ensure clean state
      try {
        await GoogleSignin.signOut();
      } catch (signOutError) {
        // No existing user to sign out
      }
      
      // Sign in with Google
      const userInfo = await GoogleSignin.signIn();
      
      if (userInfo.data?.idToken) {
        // Sign in with Supabase using Google ID token
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: userInfo.data.idToken,
        });

        if (error) {
          console.error('Supabase sign-in error:', error);
          throw new Error(`Supabase authentication failed: ${error.message}`);
        }

        // If login successful and session exists, sync with backend
        if (data.session) {
          await AuthService.setAuthToken(data.session.access_token);
          try {
            await AuthService.syncUser();
          } catch (syncError) {
            // Backend sync failed, but Google login successful
          }
        }

        return data;
      } else {
        throw new Error('Google Sign-In failed: No ID token received');
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      
      // Handle specific error cases with user-friendly messages
      if (error.code === 'SIGN_IN_CANCELLED') {
        throw new Error('Google Sign-In was cancelled by user');
      } else if (error.code === 'IN_PROGRESS') {
        throw new Error('Google Sign-In is already in progress');
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        throw new Error('Google Play Services not available. Please update Google Play Services.');
      } else if (error.code === 'DEVELOPER_ERROR') {
        throw new Error('Configuration error. Please contact support.');
      } else if (error.message?.includes('DEVELOPER_ERROR')) {
        throw new Error('App configuration error. Please ensure Google OAuth is properly set up.');
      } else {
        throw new Error(error.message || 'Google Sign-In failed. Please try again.');
      }
    }
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    // Clear local storage
    await AuthService.logout();
  },

  // Get current user
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  // Get current session
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  // Listen to auth state changes
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      // Call the callback immediately to avoid blocking
      callback(event, session);
      
      // Handle background tasks asynchronously without blocking
      if (event === 'SIGNED_IN' && session) {
        // Run in background without awaiting
        AuthService.setAuthToken(session.access_token).then(() => {
          return AuthService.syncUser();
        }).catch((syncError) => {
          // Backend sync failed during auth state change
        });
      }
      
      // If user signed out, clear local storage
      if (event === 'SIGNED_OUT') {
        AuthService.logout().catch((error) => {
          // Logout cleanup failed
        });
      }
    });
  },
};