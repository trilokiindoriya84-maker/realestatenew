import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SupabaseAuthService } from '../services/supabase.service';
import { AuthService } from '../services/auth.service';
import apiClient from '../services/api.service';

interface BottomNavigationProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ 
  activeTab: propActiveTab, 
  onTabChange 
}) => {
  const navigation = useNavigation();
  const route = useRoute();
  const [activeTab, setActiveTab] = useState(propActiveTab || 'Home');
  const [user, setUser] = useState<any>(null);

  // Check auth state
  useEffect(() => {
    let mounted = true;
    
    const checkAuthState = async () => {
      try {
        const currentUser = await SupabaseAuthService.getCurrentUser();
        if (mounted) {
          setUser(currentUser);
        }
      } catch (error) {
        if (mounted) {
          setUser(null);
        }
      }
    };

    checkAuthState();

    // Listen to auth state changes
    const { data: { subscription } } = SupabaseAuthService.onAuthStateChange((event, session) => {
      if (mounted) {
        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Update active tab based on current route
  useEffect(() => {
    const routeName = route.name;
    switch (routeName) {
      case 'Home':
        setActiveTab('Home');
        break;
      case 'Dashboard':
        setActiveTab('Account');
        break;
      default:
        if (!propActiveTab) {
          setActiveTab('Home');
        }
    }
  }, [route.name, propActiveTab]);

  const handleAddPropertyPress = async () => {
    console.log('Add Property button pressed - checking verification...');
    
    try {
      // Get user profile to check verification status
      const session = await SupabaseAuthService.getSession();
      console.log('Session:', session ? 'Found' : 'Not found');
      
      if (!session?.access_token) {
        console.log('No session found, navigating to login');
        navigation.navigate('Login' as never);
        return;
      }

      // Set auth token and get profile
      await AuthService.setAuthToken(session.access_token);
      console.log('Auth token set, getting profile...');
      
      const profile = await AuthService.getProfile();
      console.log('Profile:', profile);
      
      const isVerified = profile.isVerified || profile.verificationStatus === 'verified';
      console.log('Is verified:', isVerified, 'Profile verification status:', profile.verificationStatus);
      
      if (!isVerified) {
        console.log('User not verified, showing alert...');
        // Force show alert with setTimeout to ensure it displays
        setTimeout(() => {
          Alert.alert(
            'Verification Required',
            'Only verified users can list properties. Please complete your verification first.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Verify Now', 
                onPress: () => {
                  console.log('Verify Now pressed');
                  navigation.navigate('Verification' as never);
                }
              }
            ]
          );
        }, 100);
        return;
      }

      // User is verified, proceed to add property
      console.log('User verified, navigating to AddProperty');
      navigation.navigate('AddProperty' as never);
    } catch (error) {
      console.error('Error checking verification:', error);
      // Show alert even if there's an error
      setTimeout(() => {
        Alert.alert(
          'Verification Required',
          'Only verified users can list properties. Please complete your verification first.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Verify Now', 
              onPress: () => navigation.navigate('Verification' as never)
            }
          ]
        );
      }, 100);
    }
  };

  const handleTabPress = (tab: string) => {
    setActiveTab(tab);
    
    // Call parent callback if provided
    if (onTabChange) {
      onTabChange(tab);
    }

    // Handle navigation based on tab
    switch (tab) {
      case 'Home':
        navigation.navigate('Home' as never);
        break;
      case 'Saved':
        // Navigate to saved properties screen
        navigation.navigate('SavedProperties' as never);
        break;
      case 'Search':
        // Navigate to search screen
        navigation.navigate('Search' as never);
        break;
      case 'Add':
        // Navigate to add property screen with verification check
        if (user) {
          handleAddPropertyPress();
        } else {
          navigation.navigate('Login' as never);
        }
        break;
      case 'Account':
        if (user) {
          navigation.navigate('Dashboard' as never);
        } else {
          navigation.navigate('Login' as never);
        }
        break;
    }
  };

  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => handleTabPress('Home')}
      >
        <Icon 
          name="home" 
          size={28} 
          color={activeTab === 'Home' ? "#F36F21" : "#666"} 
        />
        <Text style={[styles.navText, activeTab === 'Home' && styles.navTextActive]}>
          Home
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => handleTabPress('Saved')}
      >
        <Icon 
          name={activeTab === 'Saved' ? "favorite" : "favorite-border"} 
          size={28} 
          color={activeTab === 'Saved' ? "#F36F21" : "#666"} 
        />
        <Text style={[styles.navText, activeTab === 'Saved' && styles.navTextActive]}>
          Saved
        </Text>
      </TouchableOpacity>
      
      {/* Center Plus Button */}
      <TouchableOpacity 
        style={styles.centerNavItem}
        onPress={() => handleTabPress('Add')}
      >
        <View style={styles.plusButton}>
          <Icon 
            name="add" 
            size={28} 
            color="#fff" 
          />
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => handleTabPress('Search')}
      >
        <Icon 
          name="search" 
          size={28} 
          color={activeTab === 'Search' ? "#F36F21" : "#666"} 
        />
        <Text style={[styles.navText, activeTab === 'Search' && styles.navTextActive]}>
          Search
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => handleTabPress('Account')}
      >
        {user?.user_metadata?.avatar_url ? (
          <Image
            source={{ uri: user.user_metadata.avatar_url }}
            style={[
              styles.bottomNavProfileImage,
              activeTab === 'Account' && styles.bottomNavProfileImageActive
            ]}
          />
        ) : (
          <Icon 
            name={activeTab === 'Account' ? "person" : "person-outline"} 
            size={28} 
            color={activeTab === 'Account' ? "#F36F21" : "#666"} 
          />
        )}
        <Text style={[styles.navText, activeTab === 'Account' && styles.navTextActive]}>
          Account
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  centerNavItem: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    position: 'relative',
  },
  plusButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F36F21',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    position: 'absolute',
    bottom: 20,
    borderWidth: 3,
    borderColor: '#fff',
  },
  navText: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  navTextActive: {
    color: '#F36F21',
    fontWeight: 'bold',
  },
  bottomNavProfileImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  bottomNavProfileImageActive: {
    borderWidth: 2,
    borderColor: '#F36F21',
  },
});

export default BottomNavigation;