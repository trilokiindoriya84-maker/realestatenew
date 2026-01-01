import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Linking, ActivityIndicator, View, TouchableOpacity, Text } from 'react-native';
import HomeScreen from '../screens/home/HomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import VerificationScreen from '../screens/verification/VerificationScreen';
import AddPropertyScreen from '../screens/property/AddPropertyScreen';
import EditPropertyScreen from '../screens/property/EditPropertyScreen';
import MyPropertiesScreen from '../screens/property/MyPropertiesScreen';
import SavedPropertiesScreen from '../screens/saved/SavedPropertiesScreen';
import PropertyDetailsScreen from '../screens/property/PropertyDetailsScreen';
import { SearchScreen } from '../screens/search/SearchScreen';
import MyEnquiriesScreen from '../screens/enquiry/MyEnquiriesScreen';
import { SupabaseAuthService } from '../services/supabase.service';

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: ['com.profeild://'],
  config: {
    screens: {
      Home: '',
      Login: 'login',
      Signup: 'signup',
      Dashboard: 'dashboard',
      Verification: 'verification',
      Search: 'search',
      AddProperty: 'add-property',
      EditProperty: 'edit-property/:uniqueId',
      MyProperties: 'my-properties',
      SavedProperties: 'saved-properties',
      PropertyDetails: 'property-details/:propertyId',
    },
  },
};

const AppNavigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    // Check initial auth state with timeout
    const checkAuthState = async () => {
      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth check timeout')), 5000)
        );
        
        const sessionPromise = SupabaseAuthService.getSession();
        
        const session = await Promise.race([sessionPromise, timeoutPromise]);
        
        if (mounted) {
          setIsAuthenticated(!!session);
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
        if (mounted) {
          setIsAuthenticated(false);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuthState();

    // Listen for auth state changes
    const { data: { subscription } } = SupabaseAuthService.onAuthStateChange((event, session) => {
      if (mounted) {
        setIsAuthenticated(!!session);
        setIsLoading(false);
      }
    });

    // Handle deep links when app is already open
    const handleDeepLink = (url: string) => {
      // Check if it's an auth callback
      if (url.includes('auth/callback')) {
        // Let Supabase handle the auth callback
        SupabaseAuthService.getSession().then((session) => {
          if (session && mounted) {
            setIsAuthenticated(true);
          }
        }).catch((error) => {
          console.error('Error handling auth callback:', error);
        });
      }
    };

    // Listen for deep links
    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Handle deep link if app was opened from a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
      linkingSubscription?.remove();
    };
  }, []);

  // Show loading screen while checking auth state
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={{ marginTop: 16, color: '#666', fontSize: 16 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer linking={linking}>
        <Stack.Navigator
          initialRouteName={isAuthenticated ? "Home" : "Login"}
          screenOptions={{
            headerShown: false, // Hide header for all screens by default
          }}>
          
          {/* Auth Screens */}
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={({ navigation }) => ({ 
              headerShown: true,
              title: 'Login',
              headerStyle: {
                backgroundColor: '#f97316',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
              headerRight: () => (
                <TouchableOpacity
                  onPress={() => navigation.navigate('Home' as never)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: 16,
                    marginRight: 4,
                  }}
                >
                  <Text style={{
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: '600',
                  }}>
                    Skip
                  </Text>
                </TouchableOpacity>
              ),
            })}
          />
          <Stack.Screen 
            name="Signup" 
            component={SignupScreen}
            options={{ 
              headerShown: true,
              title: 'Sign Up',
              headerStyle: {
                backgroundColor: '#f97316',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          />
          
          {/* App Screens */}
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Dashboard" 
            component={DashboardScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Verification" 
            component={VerificationScreen}
            options={{ headerShown: false }}
          />
          
          {/* Search Screen */}
          <Stack.Screen 
            name="Search" 
            component={SearchScreen}
            options={{ headerShown: false }}
          />
          
          {/* Property Screens */}
          <Stack.Screen 
            name="AddProperty" 
            component={AddPropertyScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="EditProperty" 
            component={EditPropertyScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="MyProperties" 
            component={MyPropertiesScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="SavedProperties" 
            component={SavedPropertiesScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="MyEnquiries" 
            component={MyEnquiriesScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="PropertyDetails" 
            component={PropertyDetailsScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

export default AppNavigator;
