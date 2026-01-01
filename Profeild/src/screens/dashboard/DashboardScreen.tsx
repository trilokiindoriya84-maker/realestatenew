import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SupabaseAuthService } from '../../services/supabase.service';
import { AuthService } from '../../services/auth.service';
import { PropertyService } from '../../services/property.service';
import apiClient from '../../services/api.service';
import { API_ENDPOINTS } from '../../utils/constants';
import BottomNavigation from '../../components/BottomNavigation';

const DashboardScreen = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [verificationData, setVerificationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalProperties: 0,
    approvedProperties: 0,
    myEnquiries: 0,
    savedProperties: 0,
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Get current user from Supabase
      const currentUser = await SupabaseAuthService.getCurrentUser();
      setUser(currentUser);

      if (currentUser) {
        // Sync user with backend first
        try {
          await AuthService.syncUser();
        } catch (syncError) {
          // User sync error (non-critical)
        }

        // Get user profile from backend
        try {
          const profile = await AuthService.getProfile();
          setUserProfile(profile);
        } catch (error) {
          // Profile fetch error
          // Set default profile if fetch fails
          setUserProfile({
            isVerified: false,
            verificationStatus: 'unverified',
            rejectionReason: null
          });
        }

        // Get verification status directly from verification endpoint
        try {
          const verificationResponse = await apiClient.get(API_ENDPOINTS.VERIFICATION_STATUS);
          setVerificationData(verificationResponse.data);
        } catch (error) {
          // Verification status fetch error
          // Set default verification data if fetch fails
          setVerificationData({
            status: 'unverified',
            isVerified: false,
            rejectionReason: null,
            data: null
          });
        }

        // Load user statistics
        await loadStats();
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Fetch all data in parallel using Promise.allSettled for better performance
      const [propertiesResult, enquiriesResult, savedResult] = await Promise.allSettled([
        apiClient.get(API_ENDPOINTS.MY_PROPERTIES),
        apiClient.get(API_ENDPOINTS.MY_ENQUIRIES),
        apiClient.get(API_ENDPOINTS.SAVED_PROPERTIES)
      ]);

      // Extract data from results
      const properties = propertiesResult.status === 'fulfilled' ? propertiesResult.value.data : [];
      const enquiries = enquiriesResult.status === 'fulfilled' ? enquiriesResult.value.data : [];
      const saved = savedResult.status === 'fulfilled' ? savedResult.value.data : [];

      const newStats = {
        totalProperties: properties.length,
        approvedProperties: properties.filter((p: any) => p.status === 'approved').length,
        myEnquiries: enquiries.length,
        savedProperties: saved.length,
      };
      
      setStats(newStats);
    } catch (error) {
      console.error('Error loading stats:', error);
      // Keep existing stats on error, don't reset to 0
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    
    // Clear any cached data
    setVerificationData(null);
    setUserProfile(null);
    
    await loadUserData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await SupabaseAuthService.signOut();
              await AuthService.logout();
              // Explicitly navigate to Login screen after logout
              navigation.navigate('Login' as never);
            } catch (error) {
              console.error('Logout error:', error);
              // Even if logout fails, navigate to login screen
              navigation.navigate('Login' as never);
            }
          },
        },
      ]
    );
  };

  const handleNavigateToProperties = () => {
    // Navigate to My Properties screen
    navigation.navigate('MyProperties' as never);
  };

  const handleNavigateToEnquiries = () => {
    // Navigate to My Enquiries screen
    navigation.navigate('MyEnquiries' as never);
  };

  const handleNavigateToSaved = () => {
    // Navigate to Saved Properties screen
    navigation.navigate('SavedProperties' as never);
  };

  const handleNavigateToAddProperty = async () => {
    try {
      console.log('Dashboard Add Property clicked - checking verification...');
      
      // Check verification status before allowing property listing
      if (!userProfile) {
        console.log('No user profile found');
        Alert.alert('Error', 'Unable to check verification status. Please try again.');
        return;
      }

      console.log('User profile:', userProfile);
      const isVerified = userProfile.isVerified || userProfile.verificationStatus === 'verified';
      console.log('Is verified:', isVerified, 'Verification status:', userProfile.verificationStatus);
      
      if (!isVerified) {
        console.log('User not verified, showing alert...');
        Alert.alert(
          'Verification Required',
          'Only verified users can list properties. Please complete your verification first.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Verify Now', 
              onPress: () => {
                console.log('Verify Now pressed from dashboard');
                navigation.navigate('Verification' as never);
              }
            }
          ]
        );
        return;
      }

      // User is verified, proceed to add property
      console.log('User verified, navigating to AddProperty');
      navigation.navigate('AddProperty' as never);
    } catch (error) {
      console.error('Error checking verification:', error);
      Alert.alert('Error', 'Unable to verify user status. Please try again.');
    }
  };

  const handleNavigateToVerification = () => {
    // Navigate to Verification screen
    navigation.navigate('Verification' as never);
  };

  const getVerificationStatus = () => {
    // Use verification data first, fallback to user profile
    const verificationStatus = verificationData?.status || userProfile?.verificationStatus;
    const isVerified = verificationData?.isVerified || userProfile?.isVerified || verificationStatus === 'verified';
    const rejectionReason = verificationData?.rejectionReason || userProfile?.rejectionReason;

    if (isVerified) {
      return { status: 'verified', color: '#10b981', text: 'Verified' };
    } else if (verificationStatus === 'pending') {
      return { status: 'pending', color: '#3b82f6', text: 'Verification Under Review' };
    } else if (verificationStatus === 'rejected') {
      return { status: 'rejected', color: '#ef4444', text: 'Verification Rejected' };
    } else {
      // This covers 'unverified' or null/undefined status
      return { status: 'unverified', color: '#f59e0b', text: 'Pending Verification' };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F36F21" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Icon name="person-outline" size={64} color="#9ca3af" />
          <Text style={styles.notLoggedInText}>Please login to access your dashboard</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login' as never)}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const verificationStatus = getVerificationStatus();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              {user?.user_metadata?.avatar_url ? (
                <Image
                  source={{ uri: user.user_metadata.avatar_url }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Icon name="person" size={32} color="#666" />
                </View>
              )}
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>
                {user?.user_metadata?.full_name || user?.email || 'User'}
              </Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <Icon name="refresh" size={24} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Icon name="logout" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Verification Status */}
        <View style={[styles.verificationCard, { borderColor: verificationStatus.color }]}>
          <View style={styles.verificationHeader}>
            <View style={[styles.verificationIcon, { backgroundColor: verificationStatus.color }]}>
              <Icon
                name={
                  verificationStatus.status === 'verified' ? 'verified' :
                  verificationStatus.status === 'pending' ? 'schedule' :
                  verificationStatus.status === 'rejected' ? 'error' : 'warning'
                }
                size={24}
                color="#fff"
              />
            </View>
            <View style={styles.verificationInfo}>
              <Text style={styles.verificationTitle}>{verificationStatus.text}</Text>
              <Text style={styles.verificationSubtitle}>
                {verificationStatus.status === 'verified' ? 'Your identity has been verified' :
                 verificationStatus.status === 'pending' ? 'Your documents are under review (24-48 hours)' :
                 verificationStatus.status === 'rejected' ? 'Please re-upload your documents' :
                 'Complete verification to list properties'}
              </Text>
            </View>
          </View>
          {verificationStatus.status !== 'verified' && verificationStatus.status !== 'pending' && (
            <TouchableOpacity 
              style={styles.verificationButton}
              onPress={handleNavigateToVerification}
            >
              <Text style={styles.verificationButtonText}>
                {verificationStatus.status === 'rejected' ? 'Re-upload Documents' : 'Complete Verification'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <TouchableOpacity style={styles.statCard} onPress={handleNavigateToProperties}>
            <View style={styles.statIcon}>
              <Icon name="home" size={24} color="#3b82f6" />
            </View>
            <Text style={styles.statNumber}>{stats.totalProperties}</Text>
            <Text style={styles.statLabel}>Total Properties</Text>
          </TouchableOpacity>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Icon name="check-circle" size={24} color="#10b981" />
            </View>
            <Text style={styles.statNumber}>{stats.approvedProperties}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>

          <TouchableOpacity style={styles.statCard} onPress={handleNavigateToEnquiries}>
            <View style={styles.statIcon}>
              <Icon name="mail" size={24} color="#8b5cf6" />
            </View>
            <Text style={styles.statNumber}>{stats.myEnquiries}</Text>
            <Text style={styles.statLabel}>Enquiries</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statCard} onPress={handleNavigateToSaved}>
            <View style={styles.statIcon}>
              <Icon name="favorite" size={24} color="#ec4899" />
            </View>
            <Text style={styles.statNumber}>{stats.savedProperties}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity style={styles.actionCard} onPress={handleNavigateToAddProperty}>
            <View style={styles.actionIcon}>
              <Icon name="add" size={24} color="#F36F21" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>List New Property</Text>
              <Text style={styles.actionSubtitle}>Add a new property for sale or rent</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleNavigateToProperties}>
            <View style={styles.actionIcon}>
              <Icon name="home" size={24} color="#3b82f6" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>My Properties</Text>
              <Text style={styles.actionSubtitle}>Manage your listed properties</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleNavigateToEnquiries}>
            <View style={styles.actionIcon}>
              <Icon name="mail" size={24} color="#8b5cf6" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>My Enquiries</Text>
              <Text style={styles.actionSubtitle}>View property enquiries</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleNavigateToSaved}>
            <View style={styles.actionIcon}>
              <Icon name="favorite" size={24} color="#ec4899" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Saved Properties</Text>
              <Text style={styles.actionSubtitle}>Properties you've saved</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Platform Info */}
        <View style={styles.platformInfo}>
          <Text style={styles.sectionTitle}>Platform Security</Text>
          <View style={styles.securityCard}>
            <View style={styles.securityFeature}>
              <Icon name="verified" size={20} color="#10b981" />
              <Text style={styles.securityText}>All properties verified by legal team</Text>
            </View>
            <View style={styles.securityFeature}>
              <Icon name="security" size={20} color="#10b981" />
              <Text style={styles.securityText}>Document verification for all users</Text>
            </View>
            <View style={styles.securityFeature}>
              <Icon name="payment" size={20} color="#10b981" />
              <Text style={styles.securityText}>Secure payment processing</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="Account" />
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
    color: '#6b7280',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notLoggedInText: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginVertical: 20,
  },
  loginButton: {
    backgroundColor: '#F36F21',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    padding: 8,
    marginRight: 8,
  },
  logoutButton: {
    padding: 8,
  },
  verificationCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  verificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  verificationInfo: {
    flex: 1,
  },
  verificationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  verificationSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  verificationButton: {
    marginTop: 16,
    backgroundColor: '#F36F21',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  verificationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    margin: '1%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  quickActions: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  platformInfo: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  securityCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  securityFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  securityText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
});

export default DashboardScreen;