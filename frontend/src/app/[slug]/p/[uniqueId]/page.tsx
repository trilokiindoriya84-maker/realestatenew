'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Building2, MapPin, Maximize2, Bed, Bath, Home, Compass, 
  Loader2, Phone, Mail, Share2, Heart, CheckCircle,
  ChevronRight, MapPinned, Layers, Tag, ShieldCheck, 
  FileText, Camera, TrendingUp, Wifi, Car, Zap, Droplets,
  Wind, Trees, Lock, Users, Dumbbell, Waves, School, 
  ShoppingBag, Church, Hospital, Train, Bus, Landmark
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

interface PublishedProperty {
  uniqueId: string;
  slug: string;
  propertyTitle: string;
  propertyDescription: string | null;
  propertyType: string;
  state: string;
  district: string;
  city: string;
  locality: string;
  pincode: string;
  totalArea: string;
  areaUnit: string;
  propertyFacing: string;
  openSides: string;
  eastRoadWidth: string | null;
  westRoadWidth: string | null;
  northRoadWidth: string | null;
  southRoadWidth: string | null;
  sellingPrice: string;
  priceType: string;
  negotiable: string;
  circleRate: string | null;
  publishedPhotos: string[] | null;
  bedrooms: string | null;
  bathrooms: string | null;
  floors: string | null;
  floorNumber: string | null;
  landType: string | null;
  boundaryWall: string | null;
  amenities: any;
  publishedAt: Date | null;
}

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { uniqueId } = params;
  const { user } = useAuth();
  
  const [property, setProperty] = useState<PublishedProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [savingProperty, setSavingProperty] = useState(false);
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [enquiryForm, setEnquiryForm] = useState({ name: '', mobile: '', message: '' });
  const [submittingEnquiry, setSubmittingEnquiry] = useState(false);

  useEffect(() => {
    if (uniqueId) {
      fetchProperty();
      if (user) {
        checkIfSaved();
      }
    }
  }, [uniqueId, user]);

  const fetchProperty = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/public/published-properties/${uniqueId}`);
      
      if (!response.ok) {
        throw new Error('Property not found');
      }
      
      const data = await response.json();
      setProperty(data);
    } catch (error) {
      console.error('Error fetching property:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfSaved = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(
        `${API_BASE_URL}/saved-properties/check/${uniqueId}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setIsSaved(data.isSaved);
      }
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };

  const handleSaveToggle = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      setSavingProperty(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        console.error('No access token available');
        alert('Please login again');
        router.push('/login');
        return;
      }

      if (isSaved) {
        // Unsave
        const response = await fetch(`${API_BASE_URL}/saved-properties/${uniqueId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
        
        if (response.ok) {
          setIsSaved(false);
        } else {
          const errorData = await response.json();
          console.error('Unsave failed:', errorData);
        }
      } else {
        // Save
        const response = await fetch(`${API_BASE_URL}/saved-properties`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ propertyUniqueId: uniqueId }),
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsSaved(true);
        } else {
          const errorData = await response.json();
          console.error('Save failed:', errorData);
          alert(`Failed to save property: ${errorData.message || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      alert(`Error: ${error}`);
    } finally {
      setSavingProperty(false);
    }
  };

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!enquiryForm.name || !enquiryForm.mobile) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSubmittingEnquiry(true);
      
      // Get user ID if logged in
      let userId = null;
      if (user) {
        userId = user.id;
      }
      
      console.log('Submitting enquiry:', {
        propertyUniqueId: uniqueId,
        name: enquiryForm.name,
        mobile: enquiryForm.mobile,
        message: enquiryForm.message,
        userId,
      });
      
      const response = await fetch(`${API_BASE_URL}/enquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyUniqueId: uniqueId,
          name: enquiryForm.name,
          mobile: enquiryForm.mobile,
          message: enquiryForm.message,
          userId, // Send user ID if logged in
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert('Enquiry submitted successfully! We will contact you soon.');
        setShowEnquiryModal(false);
        setEnquiryForm({ name: '', mobile: '', message: '' });
      } else {
        const errorData = await response.json();
        console.error('Enquiry submission failed:', errorData);
        alert(`Failed to submit enquiry: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error submitting enquiry:', error);
      alert('Failed to submit enquiry. Please try again.');
    } finally {
      setSubmittingEnquiry(false);
    }
  };

  const formatPrice = (price: string) => {
    const numPrice = parseInt(price);
    if (numPrice >= 10000000) {
      return `${(numPrice / 10000000).toFixed(2)} Cr`;
    } else if (numPrice >= 100000) {
      return `${(numPrice / 100000).toFixed(2)} Lac`;
    } else {
      return numPrice.toLocaleString('en-IN');
    }
  };

  const getPropertyImage = (photos: string[] | null, index: number) => {
    if (photos && photos.length > index) {
      return photos[index];
    }
    return 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80';
  };

  const getAmenityIcon = (key: string) => {
    const iconMap: { [key: string]: any } = {
      electricity: Zap,
      water: Droplets,
      parking: Car,
      garden: Trees,
      security: Lock,
      gym: Dumbbell,
      swimmingPool: Waves,
      clubHouse: Users,
      powerBackup: Zap,
      lift: Building2,
      park: Trees,
      wifi: Wifi,
      airConditioning: Wind,
      // Nearby places with proper icons
      church: Church,
      market: ShoppingBag,
      school: School,
      temple: Landmark,
      college: School,
      highway: MapPin,
      busStand: Bus,
      hospital: Hospital,
      railwayStation: Train,
      roadAccess: MapPin,
    };
    return iconMap[key] || MapPin;
  };

  const getAmenityLabel = (key: string) => {
    const labelMap: { [key: string]: string } = {
      electricity: 'Electricity',
      water: 'Water Supply',
      parking: 'Parking',
      garden: 'Garden',
      security: '24/7 Security',
      gym: 'Gymnasium',
      swimmingPool: 'Swimming Pool',
      clubHouse: 'Club House',
      powerBackup: 'Power Backup',
      lift: 'Lift',
      park: 'Park',
      wifi: 'Wi-Fi',
      airConditioning: 'Air Conditioning',
      // Nearby places
      church: 'Church',
      market: 'Market',
      school: 'School',
      temple: 'Temple',
      college: 'College',
      highway: 'Highway',
      busStand: 'Bus Stand',
      hospital: 'Hospital',
      railwayStation: 'Railway Station',
      roadAccess: 'Road Access',
    };
    return labelMap[key] || key.replace(/([A-Z])/g, ' $1').trim();
  };

  const getAmenityDistance = (value: any) => {
    if (typeof value === 'object' && value !== null) {
      const obj = value as any;
      if (obj.distance) {
        return `${obj.distance}m away`;
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Property not found</h2>
          <Link href="/" className="text-blue-600 hover:underline text-sm">
            Go back to home
          </Link>
        </div>
      </div>
    );
  }

  const photos = property.publishedPhotos || [];
  
  // Filter amenities - only show those with true value
  const selectedAmenities = property.amenities && typeof property.amenities === 'object'
    ? Object.entries(property.amenities).filter(([key, value]) => {
        // Check if value is true (boolean) or "true" (string) or distance/available is not empty
        if (typeof value === 'boolean') return value === true;
        if (typeof value === 'string') return value === 'true' || value === 'yes';
        if (typeof value === 'object' && value !== null) {
          // For objects like {distance: "30", available: true}
          const obj = value as any;
          return obj.available === true || obj.available === 'true';
        }
        return false;
      })
    : [];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Breadcrumb */}
        <div className="mb-4 flex items-center gap-2 text-xs text-gray-500">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/properties" className="hover:text-blue-600">Properties</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href={`/properties?type=${property.propertyType}`} className="hover:text-blue-600">{property.propertyType}</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-900 font-medium truncate max-w-xs">{property.propertyTitle}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Images (Sticky) */}
          <div className="lg:col-span-5 xl:col-span-5">
            <div className="sticky top-20 flex gap-3">
              {/* Thumbnails */}
              {photos.length > 1 && (
                <div className="hidden md:flex flex-col gap-2 w-20 flex-shrink-0">
                  {photos.slice(0, 6).map((photo, index) => (
                    <button
                      key={index}
                      onMouseEnter={() => setSelectedImageIndex(index)}
                      className={`w-full aspect-square rounded-md border-2 overflow-hidden transition-all ${
                        selectedImageIndex === index 
                          ? 'border-blue-600 ring-1 ring-blue-100' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={photo}
                        alt={`View ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Main Image */}
              <div className="flex-1 relative bg-gray-50 border border-gray-200 rounded-lg overflow-hidden group">
                <div className="aspect-[4/4] relative">
                  <img
                    src={getPropertyImage(photos, selectedImageIndex)}
                    alt={property.propertyTitle}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-zoom-in"
                  />

                  <button className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-lg text-gray-400 hover:text-red-500 transition-colors z-10">
                    <Heart className="w-5 h-5" />
                  </button>

                  <button className="absolute top-3 left-3 p-2 bg-white rounded-full shadow-lg text-gray-400 hover:text-blue-600 transition-colors z-10">
                    <Share2 className="w-5 h-5" />
                  </button>

                  {/* Photo Count Badge */}
                  {photos.length > 0 && (
                    <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2.5 py-1 rounded-full text-xs flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{photos.length} Photos</span>
                    </div>
                  )}
                </div>

                {/* Mobile Thumbnails */}
                {photos.length > 1 && (
                  <div className="flex md:hidden gap-2 p-3 overflow-x-auto scrollbar-hide">
                    {photos.map((photo, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`w-14 h-14 flex-shrink-0 rounded-md border-2 overflow-hidden ${
                          selectedImageIndex === index ? 'border-blue-600' : 'border-gray-200'
                        }`}
                      >
                        <img src={photo} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Action Buttons */}
            <div className="lg:hidden grid grid-cols-2 gap-2 mt-3 sticky bottom-0 bg-white p-3 border-t border-gray-200 z-20">
              <button
                onClick={handleSaveToggle}
                disabled={savingProperty}
                className={`py-2 font-medium rounded-full shadow-sm transition-colors flex items-center justify-center gap-1.5 text-sm ${
                  isSaved
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                {isSaved ? 'Saved' : 'Save'}
              </button>
              <button
                onClick={() => setShowEnquiryModal(true)}
                className="py-2 bg-green-600 text-white font-medium rounded-full shadow-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5 text-sm"
              >
                <Mail className="w-4 h-4" />
                Enquiry
              </button>
            </div>
          </div>

          {/* Right Column: Details */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-4">
            {/* Title & Location */}
            <div className="border-b border-gray-100 pb-3">
              <h1 className="text-xl md:text-2xl font-medium text-gray-900 mb-2">{property.propertyTitle}</h1>
              <div className="flex items-center gap-3 flex-wrap text-sm">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{property.locality}, {property.city}</span>
                </div>
                <span className="text-gray-300">|</span>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <MapPinned className="w-3.5 h-3.5" />
                  <span className="text-xs">{property.state} - {property.pincode}</span>
                </div>
              </div>
            </div>

            {/* Price Block */}
            <div className="space-y-1.5">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-medium text-gray-900">
                  <sup className="text-base">₹</sup>{formatPrice(property.sellingPrice)}
                </span>
                {property.negotiable === 'yes' && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                    Negotiable
                  </span>
                )}
              </div>
              {property.circleRate && (
                <div className="text-xs text-gray-500">
                  Circle Rate: <span className="font-medium text-gray-700">₹{parseInt(property.circleRate).toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            {/* Key Features */}
            <div className="grid grid-cols-4 gap-3 py-3 border-y border-gray-100">
              <div className="flex flex-col items-center text-center gap-1.5">
                <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="text-xs text-gray-600 font-medium">{property.propertyType}</span>
              </div>
              <div className="flex flex-col items-center text-center gap-1.5">
                <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                  <Maximize2 className="w-4 h-4" />
                </div>
                <span className="text-xs text-gray-600 font-medium">{property.totalArea} {property.areaUnit}</span>
              </div>
              {property.bedrooms ? (
                <div className="flex flex-col items-center text-center gap-1.5">
                  <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                    <Bed className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-gray-600 font-medium">{property.bedrooms} BHK</span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center gap-1.5">
                  <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                    <Compass className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-gray-600 font-medium">{property.propertyFacing}</span>
                </div>
              )}
              <div className="flex flex-col items-center text-center gap-1.5">
                <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-xs text-gray-600 font-medium">{property.openSides} Open</span>
              </div>
            </div>

            {/* Highlights */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-gray-900 text-sm">
                <Tag className="w-4 h-4 text-orange-600" />
                <span>Property Highlights</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="border border-gray-200 rounded-lg p-2.5 shadow-sm">
                  <h4 className="font-bold text-xs mb-0.5">Verified Property</h4>
                  <p className="text-xs text-gray-600">
                    All documents verified by our legal team
                  </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-2.5 shadow-sm">
                  <h4 className="font-bold text-xs mb-0.5">Ready to Move</h4>
                  <p className="text-xs text-gray-600">
                    Property is ready for immediate possession
                  </p>
                </div>
              </div>
            </div>

            {/* Services Icons */}
            <div className="grid grid-cols-4 gap-3 py-3 border-y border-gray-100">
              <div className="flex flex-col items-center text-center gap-1.5">
                <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-xs text-blue-600 font-medium">Verified</span>
              </div>
              <div className="flex flex-col items-center text-center gap-1.5">
                <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-xs text-blue-600 font-medium">Legal</span>
              </div>
              <div className="flex flex-col items-center text-center gap-1.5">
                <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="text-xs text-blue-600 font-medium">Best Price</span>
              </div>
              <div className="flex flex-col items-center text-center gap-1.5">
                <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                  <Camera className="w-4 h-4" />
                </div>
                <span className="text-xs text-blue-600 font-medium">Site Visit</span>
              </div>
            </div>

            {/* Desktop Contact Buttons */}
            <div className="hidden lg:flex gap-3 pt-2">
              <button
                onClick={handleSaveToggle}
                disabled={savingProperty}
                className={`flex-1 py-2.5 font-medium rounded-full shadow-sm transition-colors flex items-center justify-center gap-2 text-sm ${
                  isSaved
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                {savingProperty ? 'Saving...' : isSaved ? 'Saved' : 'Save Property'}
              </button>
              <button
                onClick={() => setShowEnquiryModal(true)}
                className="flex-1 py-2.5 bg-green-600 text-white font-medium rounded-full shadow-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Mail className="w-4 h-4" />
                Send Enquiry
              </button>
            </div>

            {/* Description */}
            {property.propertyDescription && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="text-base font-bold text-gray-900 mb-2">About this Property</h3>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{property.propertyDescription}</p>
              </div>
            )}

            {/* Property Specifications */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-base font-bold text-gray-900 mb-3">Property Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                <div className="flex py-1.5 border-b border-gray-100 text-sm">
                  <span className="text-gray-500 w-1/2">Total Area</span>
                  <span className="text-gray-900 font-medium">{property.totalArea} {property.areaUnit}</span>
                </div>
                <div className="flex py-1.5 border-b border-gray-100 text-sm">
                  <span className="text-gray-500 w-1/2">Property Facing</span>
                  <span className="text-gray-900 font-medium">{property.propertyFacing}</span>
                </div>
                <div className="flex py-1.5 border-b border-gray-100 text-sm">
                  <span className="text-gray-500 w-1/2">Open Sides</span>
                  <span className="text-gray-900 font-medium">{property.openSides}</span>
                </div>
                {property.bedrooms && (
                  <div className="flex py-1.5 border-b border-gray-100 text-sm">
                    <span className="text-gray-500 w-1/2">Bedrooms</span>
                    <span className="text-gray-900 font-medium">{property.bedrooms} BHK</span>
                  </div>
                )}
                {property.bathrooms && (
                  <div className="flex py-1.5 border-b border-gray-100 text-sm">
                    <span className="text-gray-500 w-1/2">Bathrooms</span>
                    <span className="text-gray-900 font-medium">{property.bathrooms}</span>
                  </div>
                )}
                {property.floors && (
                  <div className="flex py-1.5 border-b border-gray-100 text-sm">
                    <span className="text-gray-500 w-1/2">Total Floors</span>
                    <span className="text-gray-900 font-medium">{property.floors}</span>
                  </div>
                )}
                {property.landType && (
                  <div className="flex py-1.5 border-b border-gray-100 text-sm">
                    <span className="text-gray-500 w-1/2">Land Type</span>
                    <span className="text-gray-900 font-medium">{property.landType}</span>
                  </div>
                )}
                {property.boundaryWall && (
                  <div className="flex py-1.5 border-b border-gray-100 text-sm">
                    <span className="text-gray-500 w-1/2">Boundary Wall</span>
                    <span className="text-gray-900 font-medium">{property.boundaryWall}</span>
                  </div>
                )}
                {property.eastRoadWidth && (
                  <div className="flex py-1.5 border-b border-gray-100 text-sm">
                    <span className="text-gray-500 w-1/2">East Road Width</span>
                    <span className="text-gray-900 font-medium">{property.eastRoadWidth} ft</span>
                  </div>
                )}
                {property.westRoadWidth && (
                  <div className="flex py-1.5 border-b border-gray-100 text-sm">
                    <span className="text-gray-500 w-1/2">West Road Width</span>
                    <span className="text-gray-900 font-medium">{property.westRoadWidth} ft</span>
                  </div>
                )}
                {property.northRoadWidth && (
                  <div className="flex py-1.5 border-b border-gray-100 text-sm">
                    <span className="text-gray-500 w-1/2">North Road Width</span>
                    <span className="text-gray-900 font-medium">{property.northRoadWidth} ft</span>
                  </div>
                )}
                {property.southRoadWidth && (
                  <div className="flex py-1.5 border-b border-gray-100 text-sm">
                    <span className="text-gray-500 w-1/2">South Road Width</span>
                    <span className="text-gray-900 font-medium">{property.southRoadWidth} ft</span>
                  </div>
                )}
              </div>
            </div>

            {/* Amenities */}
            {selectedAmenities.length > 0 && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="text-base font-bold text-gray-900 mb-3">Nearby Places</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedAmenities.map(([key, value]) => {
                    const Icon = getAmenityIcon(key);
                    const distance = getAmenityDistance(value);
                    return (
                      <div key={key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-200">
                          <Icon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">{getAmenityLabel(key)}</p>
                          {distance && (
                            <p className="text-xs text-gray-500">{distance}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enquiry Modal */}
        {showEnquiryModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Send Enquiry</h3>
                <button
                  onClick={() => setShowEnquiryModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleEnquirySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={enquiryForm.name}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    value={enquiryForm.mobile}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, mobile: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter 10-digit mobile number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message (Optional)
                  </label>
                  <textarea
                    value={enquiryForm.message}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, message: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Any specific requirements..."
                  />
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEnquiryModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingEnquiry}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {submittingEnquiry ? 'Submitting...' : 'Submit Enquiry'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
