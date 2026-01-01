'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Building2,
  ExternalLink,
  Loader2,
  Shield,
  Home,
} from 'lucide-react';
import api from '@/lib/api';

interface EnquiryDetails {
  enquiry: {
    uniqueId: string;
    propertyUniqueId: string;
    buyerId: string | null;
    name: string;
    mobile: string;
    message: string;
    status: string;
    createdAt: string;
  };
  property: {
    uniqueId: string;
    slug: string;
    propertyTitle: string;
    propertyType: string;
    city: string;
    state: string;
    locality: string;
    sellingPrice: string;
    totalArea: string;
    areaUnit: string;
    publishedPhotos: string[] | null;
  };
  propertyOwner: {
    id: string;
    email: string;
    fullName: string;
    phoneNumber: string;
    isVerified: boolean;
    verificationStatus: string;
  };
  ownerVerification: {
    fullName: string;
    fatherName: string;
    motherName: string;
    dateOfBirth: string;
    mobile: string;
    alternateMobile: string | null;
    address: string;
    city: string;
    state: string;
    pincode: string;
    aadharNumber: string;
    panNumber: string;
    status: string;
  } | null;
  buyerVerification: {
    fullName: string;
    fatherName: string;
    motherName: string;
    dateOfBirth: string;
    mobile: string;
    alternateMobile: string | null;
    address: string;
    city: string;
    state: string;
    pincode: string;
    aadharNumber: string;
    panNumber: string;
    status: string;
  } | null;
}

export default function EnquiryViewPage() {
  const params = useParams();
  const router = useRouter();
  const { uniqueId } = params;

  const [details, setDetails] = useState<EnquiryDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (uniqueId) {
      fetchEnquiryDetails();
    }
  }, [uniqueId]);

  const fetchEnquiryDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/enquiries/${uniqueId}`);
      setDetails(response.data);
    } catch (error) {
      console.error('Error fetching enquiry details:', error);
      alert('Failed to load enquiry details');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: string) => {
    try {
      setUpdating(true);
      await api.put(`/admin/enquiries/${uniqueId}/status`, { status });
      alert(`Enquiry marked as ${status}`);
      fetchEnquiryDetails();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: string) => {
    const numPrice = parseInt(price);
    if (numPrice >= 10000000) {
      return `₹${(numPrice / 10000000).toFixed(2)} Cr`;
    } else if (numPrice >= 100000) {
      return `₹${(numPrice / 100000).toFixed(2)} Lac`;
    } else {
      return `₹${numPrice.toLocaleString('en-IN')}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!details) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-gray-500">Enquiry not found</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-blue-600 hover:underline"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { enquiry, property, propertyOwner, ownerVerification, buyerVerification } = details;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Enquiry Details</h1>
            <p className="text-gray-600 mt-1">ID: {enquiry.uniqueId}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              enquiry.status === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : enquiry.status === 'contacted'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {enquiry.status.charAt(0).toUpperCase() + enquiry.status.slice(1)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Property Owner Details */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Home className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Property Owner Details</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium text-gray-900">{propertyOwner.fullName || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{propertyOwner.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900">{propertyOwner.phoneNumber || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Verification Status</p>
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      propertyOwner.verificationStatus === 'verified'
                        ? 'bg-green-100 text-green-800'
                        : propertyOwner.verificationStatus === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {propertyOwner.verificationStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Owner Verification Details */}
            {ownerVerification && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">Verification Documents</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Father's Name</p>
                    <p className="font-medium text-gray-900">{ownerVerification.fatherName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Mother's Name</p>
                    <p className="font-medium text-gray-900">{ownerVerification.motherName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date of Birth</p>
                    <p className="font-medium text-gray-900">{ownerVerification.dateOfBirth}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Mobile</p>
                    <p className="font-medium text-gray-900">{ownerVerification.mobile}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium text-gray-900">
                      {ownerVerification.address}, {ownerVerification.city}, {ownerVerification.state} - {ownerVerification.pincode}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Aadhar Number</p>
                    <p className="font-medium text-gray-900">XXXX-XXXX-{ownerVerification.aadharNumber.slice(-4)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">PAN Number</p>
                    <p className="font-medium text-gray-900">{ownerVerification.panNumber}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Enquiry Sender Details */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-green-600" />
              <h2 className="text-xl font-bold text-gray-900">Enquiry Sender Details</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium text-gray-900">{enquiry.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Mobile</p>
                  <p className="font-medium text-gray-900">{enquiry.mobile}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Enquiry Date</p>
                  <p className="font-medium text-gray-900">{formatDate(enquiry.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Enquiry Sender Verification Details - Separate Box */}
          {buyerVerification && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-green-600" />
                <h2 className="text-xl font-bold text-gray-900">Enquiry Sender Verification Details</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium text-gray-900">{buyerVerification.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Father's Name</p>
                  <p className="font-medium text-gray-900">{buyerVerification.fatherName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Mother's Name</p>
                  <p className="font-medium text-gray-900">{buyerVerification.motherName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="font-medium text-gray-900">{buyerVerification.dateOfBirth}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Mobile</p>
                  <p className="font-medium text-gray-900">{buyerVerification.mobile}</p>
                </div>
                {buyerVerification.alternateMobile && (
                  <div>
                    <p className="text-sm text-gray-500">Alternate Mobile</p>
                    <p className="font-medium text-gray-900">{buyerVerification.alternateMobile}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium text-gray-900">
                    {buyerVerification.address}, {buyerVerification.city}, {buyerVerification.state} - {buyerVerification.pincode}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Aadhar Number</p>
                  <p className="font-medium text-gray-900">XXXX-XXXX-{buyerVerification.aadharNumber.slice(-4)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">PAN Number</p>
                  <p className="font-medium text-gray-900">{buyerVerification.panNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Verification Status</p>
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      buyerVerification.status === 'verified'
                        ? 'bg-green-100 text-green-800'
                        : buyerVerification.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {buyerVerification.status}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Property Details */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-900">Property Details</h2>
            </div>

            {property.publishedPhotos && property.publishedPhotos.length > 0 && (
              <div className="mb-4 rounded-lg overflow-hidden">
                <img
                  src={property.publishedPhotos[0]}
                  alt={property.propertyTitle}
                  className="w-full h-48 object-cover"
                />
              </div>
            )}

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Property Title</p>
                <p className="font-bold text-lg text-gray-900">{property.propertyTitle}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium text-gray-900">{property.propertyType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Area</p>
                  <p className="font-medium text-gray-900">{property.totalArea} {property.areaUnit}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium text-gray-900">
                  {property.locality}, {property.city}, {property.state}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Price</p>
                <p className="font-bold text-xl text-blue-600">{formatPrice(property.sellingPrice)}</p>
              </div>

              <button
                onClick={() => window.open(`/${property.slug}/p/${property.uniqueId}`, '_blank')}
                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="w-5 h-5" />
                View Property Details Page
              </button>
            </div>
          </div>

          {/* Enquiry Message */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-orange-600" />
              <h2 className="text-xl font-bold text-gray-900">Enquiry Message</h2>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-wrap">
                {enquiry.message || 'No message provided'}
              </p>
            </div>
          </div>

          {/* Actions */}
          {enquiry.status === 'pending' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Actions</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => updateStatus('contacted')}
                  disabled={updating}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-5 h-5" />
                  Mark as Contacted
                </button>
                <button
                  onClick={() => updateStatus('closed')}
                  disabled={updating}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-5 h-5" />
                  Close Enquiry
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
