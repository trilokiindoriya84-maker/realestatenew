'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle, XCircle, Loader2, MapPin, Home, DollarSign, FileText } from 'lucide-react';
import api from '@/lib/api';

export default function PropertyViewPage() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revocationReason, setRevocationReason] = useState('');

  useEffect(() => {
    if (params.uniqueId) {
      fetchProperty();
    }
  }, [params.uniqueId]);

  const fetchProperty = async () => {
    try {
      setLoading(true);
      // Use admin endpoint to get property with user details
      const response = await api.get(`/admin/properties/${params.uniqueId}/details`);
      setProperty(response.data);
    } catch (error) {
      console.error('Error fetching property:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('Are you sure you want to approve this property?')) return;
    
    try {
      setActionLoading(true);
      await api.put(`/admin/properties/${params.uniqueId}/approve`);
      alert('Property approved successfully!');
      router.push('/admin/properties/approved');
    } catch (error) {
      console.error('Error approving property:', error);
      alert('Failed to approve property');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      setActionLoading(true);
      await api.put(`/admin/properties/${params.uniqueId}/reject`, { reason: rejectionReason });
      alert('Property rejected successfully!');
      router.push('/admin/properties/pending');
    } catch (error) {
      console.error('Error rejecting property:', error);
      alert('Failed to reject property');
    } finally {
      setActionLoading(false);
      setShowRejectModal(false);
    }
  };

  const handleRevoke = async () => {
    if (!revocationReason.trim()) {
      alert('Please provide a revocation reason');
      return;
    }

    try {
      setActionLoading(true);
      await api.put(`/admin/properties/${params.uniqueId}/revoke`, { reason: revocationReason });
      alert('Property approval revoked successfully! Property moved to pending review.');
      router.push('/admin/properties/pending');
    } catch (error) {
      console.error('Error revoking property approval:', error);
      alert('Failed to revoke property approval');
    } finally {
      setActionLoading(false);
      setShowRevokeModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-gray-500">Property not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {property.status === 'pending' && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={actionLoading}
              className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              Approve
            </button>
          </div>
        )}

        {property.status === 'approved' && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowRevokeModal(true)}
              disabled={actionLoading}
              className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Revoke Approval
            </button>
          </div>
        )}
      </div>

      {/* Status Badge */}
      <div className="mb-6">
        <span className={`px-4 py-2 rounded-full text-sm font-medium ${
          property.status === 'draft' ? 'bg-gray-100 text-gray-800' :
          property.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          property.status === 'approved' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
        </span>
      </div>

      {/* User Details Section */}
      {property.userDetails && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-blue-900">Property Owner Details</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Full Name */}
            {property.verificationDetails?.fullName && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Full Name</p>
                <p className="font-semibold text-gray-900">{property.verificationDetails.fullName}</p>
              </div>
            )}

            {/* Email */}
            {property.userDetails.email && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Email</p>
                <p className="font-semibold text-gray-900">{property.userDetails.email}</p>
              </div>
            )}

            {/* Mobile */}
            {property.verificationDetails?.mobile && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Mobile Number</p>
                <p className="font-semibold text-gray-900">{property.verificationDetails.mobile}</p>
              </div>
            )}

            {/* Alternate Mobile */}
            {property.verificationDetails?.alternateMobile && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Alternate Mobile</p>
                <p className="font-semibold text-gray-900">{property.verificationDetails.alternateMobile}</p>
              </div>
            )}

            {/* Father's Name */}
            {property.verificationDetails?.fatherName && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Father's Name</p>
                <p className="font-semibold text-gray-900">{property.verificationDetails.fatherName}</p>
              </div>
            )}

            {/* Mother's Name */}
            {property.verificationDetails?.motherName && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Mother's Name</p>
                <p className="font-semibold text-gray-900">{property.verificationDetails.motherName}</p>
              </div>
            )}

            {/* Date of Birth */}
            {property.verificationDetails?.dateOfBirth && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Date of Birth</p>
                <p className="font-semibold text-gray-900">{new Date(property.verificationDetails.dateOfBirth).toLocaleDateString('en-IN')}</p>
              </div>
            )}

            {/* Aadhaar Number */}
            {property.verificationDetails?.aadharNumber && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Aadhaar Number</p>
                <p className="font-semibold text-gray-900">XXXX-XXXX-{property.verificationDetails.aadharNumber.slice(-4)}</p>
              </div>
            )}

            {/* PAN Number */}
            {property.verificationDetails?.panNumber && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">PAN Number</p>
                <p className="font-semibold text-gray-900">{property.verificationDetails.panNumber}</p>
              </div>
            )}

            {/* Address */}
            {property.verificationDetails?.address && (
              <div className="bg-white rounded-lg p-4 shadow-sm md:col-span-2 lg:col-span-3">
                <p className="text-sm text-gray-600 mb-1">Address</p>
                <p className="font-semibold text-gray-900">
                  {property.verificationDetails.address}, {property.verificationDetails.city}, {property.verificationDetails.state} - {property.verificationDetails.pincode}
                </p>
              </div>
            )}
          </div>

          {/* Verification Documents */}
          {property.verificationDetails && (
            <div className="mt-6 pt-6 border-t border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Verification Documents</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {property.verificationDetails.photoUrl && (
                  <a
                    href={property.verificationDetails.photoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition text-center"
                  >
                    <div className="text-blue-600 mb-2">📷</div>
                    <p className="text-xs font-medium text-gray-700">Photo</p>
                  </a>
                )}
                {property.verificationDetails.aadharFrontUrl && (
                  <a
                    href={property.verificationDetails.aadharFrontUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition text-center"
                  >
                    <div className="text-blue-600 mb-2">🆔</div>
                    <p className="text-xs font-medium text-gray-700">Aadhaar Front</p>
                  </a>
                )}
                {property.verificationDetails.aadharBackUrl && (
                  <a
                    href={property.verificationDetails.aadharBackUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition text-center"
                  >
                    <div className="text-blue-600 mb-2">🆔</div>
                    <p className="text-xs font-medium text-gray-700">Aadhaar Back</p>
                  </a>
                )}
                {property.verificationDetails.panCardUrl && (
                  <a
                    href={property.verificationDetails.panCardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition text-center"
                  >
                    <div className="text-blue-600 mb-2">💳</div>
                    <p className="text-xs font-medium text-gray-700">PAN Card</p>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Property Details */}
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Home className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Property Details</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Property Type</p>
              <p className="font-medium">{property.propertyType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Title</p>
              <p className="font-medium">{property.propertyTitle}</p>
            </div>
            {property.propertyDescription && (
              <div className="col-span-2">
                <p className="text-sm text-gray-600">Description</p>
                <p className="font-medium">{property.propertyDescription}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Total Area</p>
              <p className="font-medium">{property.totalArea} {property.areaUnit}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Property Facing</p>
              <p className="font-medium">{property.propertyFacing}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Open Sides</p>
              <p className="font-medium">{property.openSides}</p>
            </div>
            {property.frontRoadWidth && (
              <div>
                <p className="text-sm text-gray-600">Front Road Width</p>
                <p className="font-medium">{property.frontRoadWidth} {property.roadWidthUnit}</p>
              </div>
            )}
          </div>

          {/* Road Width Details */}
          {(property.eastRoadWidth || property.westRoadWidth || property.northRoadWidth || property.southRoadWidth) && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Road Width Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {property.eastRoadWidth && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-600 font-medium">East Side</p>
                    <p className="font-semibold text-blue-900">{property.eastRoadWidth} feet</p>
                  </div>
                )}
                {property.westRoadWidth && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-600 font-medium">West Side</p>
                    <p className="font-semibold text-blue-900">{property.westRoadWidth} feet</p>
                  </div>
                )}
                {property.northRoadWidth && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-600 font-medium">North Side</p>
                    <p className="font-semibold text-blue-900">{property.northRoadWidth} feet</p>
                  </div>
                )}
                {property.southRoadWidth && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-600 font-medium">South Side</p>
                    <p className="font-semibold text-blue-900">{property.southRoadWidth} feet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Location */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Location</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">State</p>
              <p className="font-medium">{property.state}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">District</p>
              <p className="font-medium">{property.district}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">City</p>
              <p className="font-medium">{property.city}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Locality</p>
              <p className="font-medium">{property.locality}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pincode</p>
              <p className="font-medium">{property.pincode}</p>
            </div>
          </div>
        </div>

        {/* Specifications */}
        {(property.bedrooms || property.landType) && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold">Specifications</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {property.bedrooms && (
                <>
                  <div>
                    <p className="text-sm text-gray-600">Bedrooms</p>
                    <p className="font-medium">{property.bedrooms} BHK</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Bathrooms</p>
                    <p className="font-medium">{property.bathrooms}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Floors</p>
                    <p className="font-medium">{property.floors}</p>
                  </div>
                  {property.floorNumber && (
                    <div>
                      <p className="text-sm text-gray-600">Floor Number</p>
                      <p className="font-medium">{property.floorNumber}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Construction Status</p>
                    <p className="font-medium">{property.constructionStatus}</p>
                  </div>
                </>
              )}
              {property.landType && (
                <>
                  <div>
                    <p className="text-sm text-gray-600">Land Type</p>
                    <p className="font-medium">{property.landType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Boundary Wall</p>
                    <p className="font-medium">{property.boundaryWall}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Nearby Amenities */}
        {property.amenities && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-green-600" />
              <h2 className="text-xl font-semibold">Nearby Amenities & Surroundings</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(property.amenities).map(([key, amenity]: [string, any]) => {
                if (!amenity.available) return null;
                
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

                const amenityIcons: any = {
                  roadAccess: '🛣️',
                  electricity: '⚡',
                  waterSupply: '💧',
                  drainage: '🚰',
                  hospital: '🏥',
                  school: '🏫',
                  college: '🎓',
                  temple: '🛕',
                  mosque: '🕌',
                  church: '⛪',
                  market: '🏪',
                  busStand: '🚌',
                  railwayStation: '🚂',
                  highway: '🛣️'
                };

                return (
                  <div key={key} className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{amenityIcons[key] || '📍'}</span>
                      <p className="font-medium text-green-900">{amenityLabels[key] || key}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Available
                      </span>
                      {amenity.distance && (
                        <span className="text-sm text-green-700 font-medium">
                          {amenity.distance}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Show message if no amenities are available */}
            {!Object.values(property.amenities).some((amenity: any) => amenity.available) && (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No nearby amenities information available</p>
              </div>
            )}
          </div>
        )}

        {/* Price */}
        {property.sellingPrice && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold">Price Details</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Selling Price</p>
                <p className="font-medium text-lg">₹ {parseInt(property.sellingPrice).toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Price Type</p>
                <p className="font-medium">{property.priceType === 'total' ? 'Total Price' : 'Per Unit'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Negotiable</p>
                <p className="font-medium">{property.negotiable === 'yes' ? 'Yes' : 'No'}</p>
              </div>
              {property.circleRate && (
                <div>
                  <p className="text-sm text-gray-600">Circle Rate</p>
                  <p className="font-medium">₹ {parseInt(property.circleRate).toLocaleString('en-IN')}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Property Photos */}
        {property.propertyPhotos && property.propertyPhotos.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Property Photos</h2>
            <div className="grid grid-cols-3 gap-4">
              {property.propertyPhotos.map((photo: string, index: number) => (
                <div key={index} className="space-y-2">
                  <p className="text-xs text-gray-600">Photo {index + 1}</p>
                  <a
                    href={photo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src={photo}
                      alt={`Property ${index + 1}`}
                      className="w-full h-80 object-cover rounded-lg border border-gray-200 hover:border-blue-500 transition"
                    />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Property Documents */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Property Documents</h2>
          <div className="space-y-4">
            {/* Ownership Documents */}
            {property.ownershipDocs && property.ownershipDocs.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Ownership Documents</h3>
                <div className="space-y-2">
                  {property.ownershipDocs.map((doc: string, index: number) => (
                    <a
                      key={index}
                      href={doc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <FileText className="w-4 h-4" />
                      Document {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Sale Deed */}
            {property.saleDeedDocs && property.saleDeedDocs.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Sale Deed</h3>
                <div className="space-y-2">
                  {property.saleDeedDocs.map((doc: string, index: number) => (
                    <a
                      key={index}
                      href={doc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <FileText className="w-4 h-4" />
                      Document {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Khasra/Khata/Patta */}
            {property.khasraDocs && property.khasraDocs.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Khasra / Khata / Patta</h3>
                <div className="space-y-2">
                  {property.khasraDocs.map((doc: string, index: number) => (
                    <a
                      key={index}
                      href={doc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <FileText className="w-4 h-4" />
                      Document {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Approved Map */}
            {property.approvedMapDocs && property.approvedMapDocs.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Approved Map</h3>
                <div className="space-y-2">
                  {property.approvedMapDocs.map((doc: string, index: number) => (
                    <a
                      key={index}
                      href={doc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <FileText className="w-4 h-4" />
                      Document {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Encumbrance Certificate */}
            {property.encumbranceDocs && property.encumbranceDocs.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Encumbrance Certificate</h3>
                <div className="space-y-2">
                  {property.encumbranceDocs.map((doc: string, index: number) => (
                    <a
                      key={index}
                      href={doc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <FileText className="w-4 h-4" />
                      Document {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Identity Proof */}
            {property.identityProofDocs && property.identityProofDocs.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Identity Proof (Aadhaar / PAN)</h3>
                <div className="space-y-2">
                  {property.identityProofDocs.map((doc: string, index: number) => (
                    <a
                      key={index}
                      href={doc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <FileText className="w-4 h-4" />
                      Document {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* No documents message */}
            {(!property.ownershipDocs || property.ownershipDocs.length === 0) &&
             (!property.saleDeedDocs || property.saleDeedDocs.length === 0) &&
             (!property.khasraDocs || property.khasraDocs.length === 0) &&
             (!property.approvedMapDocs || property.approvedMapDocs.length === 0) &&
             (!property.encumbranceDocs || property.encumbranceDocs.length === 0) &&
             (!property.identityProofDocs || property.identityProofDocs.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No documents uploaded yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Reject Property</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Approval Modal */}
      {showRevokeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Revoke Property Approval</h3>
            <p className="text-sm text-gray-600 mb-4">
              ⚠️ This will revoke the property's approved status and move it back to pending review.
            </p>
            <textarea
              value={revocationReason}
              onChange={(e) => setRevocationReason(e.target.value)}
              placeholder="Enter revocation reason (e.g., Documents found to be invalid, Property information incorrect, etc.)..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              rows={4}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowRevokeModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRevoke}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {actionLoading ? 'Revoking...' : 'Revoke Approval'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
