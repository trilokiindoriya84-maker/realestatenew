'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, User, Phone, MapPin, CreditCard, FileText, 
  CheckCircle, XCircle, Loader2, ExternalLink, Calendar 
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface UserData {
  id: string;
  email: string;
  fullName: string;
  verificationStatus: string;
  isVerified: boolean;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  verificationDetails?: {
    fullName: string;
    fatherName: string;
    motherName: string;
    dateOfBirth: string;
    mobile: string;
    alternateMobile?: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    aadharNumber: string;
    panNumber: string;
    photoUrl: string;
    aadharFrontUrl: string;
    aadharBackUrl?: string;
    panCardUrl?: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
}

export default function VerificationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/verification/requests');
      const allUsers = response.data || [];
      const user = allUsers.find((u: any) => u.id === userId);
      
      if (user) {
        setUserData(user);
      } else {
        setError('User not found');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('Are you sure you want to approve this verification?')) return;

    try {
      setProcessing(true);
      await api.post('/verification/action', {
        userId: userId,
        status: 'verified'
      });
      alert('User verification approved successfully!');
      router.push('/admin/verification');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to approve verification');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    const isVerified = userData?.verificationStatus === 'verified';
    const confirmMessage = isVerified 
      ? 'Are you sure you want to revoke this user\'s verification? They will be moved back to pending review.'
      : 'Are you sure you want to reject this verification?';

    if (!confirm(confirmMessage)) return;

    try {
      setProcessing(true);
      await api.post('/verification/action', {
        userId: userId,
        status: 'rejected',
        rejectionReason: rejectionReason
      });
      
      const successMessage = isVerified 
        ? 'User verification revoked successfully. User moved to pending review.'
        : 'User verification rejected';
      
      alert(successMessage);
      router.push('/admin/verification/pending');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to reject verification');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading verification details...</p>
        </div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="p-8">
        <div className="text-center text-red-600">
          <p className="text-lg font-medium">{error || 'User not found'}</p>
          <Link href="/admin/verification">
            <Button className="mt-4">Back to Verifications</Button>
          </Link>
        </div>
      </div>
    );
  }

  const details = userData.verificationDetails;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/verification" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Verifications
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Verification Review</h1>
            <p className="text-gray-600 mt-2">{userData.email}</p>
          </div>
          <div className="flex gap-3">
            {userData.verificationStatus === 'pending' && (
              <>
                <Button
                  onClick={handleReject}
                  disabled={processing}
                  variant="outline"
                  className="border-red-600 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {processing ? 'Processing...' : 'Reject'}
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={processing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {processing ? 'Processing...' : 'Approve'}
                </Button>
              </>
            )}
            {userData.verificationStatus === 'verified' && (
              <Button
                onClick={handleReject}
                disabled={processing}
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-2" />
                {processing ? 'Processing...' : 'Revoke Verification'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {!details ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No verification details submitted yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Full Name</Label>
                  <p className="font-medium">{details.fullName}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Date of Birth</Label>
                  <p className="font-medium">{new Date(details.dateOfBirth).toLocaleDateString('en-IN')}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Father's Name</Label>
                  <p className="font-medium">{details.fatherName}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Mother's Name</Label>
                  <p className="font-medium">{details.motherName}</p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Mobile Number</Label>
                  <p className="font-medium">{details.mobile}</p>
                </div>
                {details.alternateMobile && (
                  <div>
                    <Label className="text-gray-500">Alternate Mobile</Label>
                    <p className="font-medium">{details.alternateMobile}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Address Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Address Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-500">Full Address</Label>
                  <p className="font-medium">{details.address}</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-gray-500">City</Label>
                    <p className="font-medium">{details.city}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">State</Label>
                    <p className="font-medium">{details.state}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">PIN Code</Label>
                    <p className="font-medium">{details.pincode}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Legal Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Legal Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Aadhar Number</Label>
                  <p className="font-medium">{details.aadharNumber}</p>
                </div>
                <div>
                  <Label className="text-gray-500">PAN Number</Label>
                  <p className="font-medium">{details.panNumber}</p>
                </div>
              </CardContent>
            </Card>

            {/* Rejection Reason (if pending or verified) */}
            {(userData.verificationStatus === 'pending' || userData.verificationStatus === 'verified') && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">
                    {userData.verificationStatus === 'verified' ? 'Revocation Reason (Required)' : 'Rejection Reason (Optional)'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder={userData.verificationStatus === 'verified' 
                      ? "Enter reason for revoking verification..." 
                      : "Enter reason for rejection..."}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                  />
                  {userData.verificationStatus === 'verified' && (
                    <p className="text-sm text-gray-500 mt-2">
                      ⚠️ This will revoke the user's verified status and move them back to pending review.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Previous Rejection Reason */}
            {userData.rejectionReason && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-600">Previous Rejection Reason</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-red-800">{userData.rejectionReason}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Documents */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-500">Current Status</Label>
                  <div className="mt-2">
                    {userData.verificationStatus === 'verified' && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        ✓ Verified
                      </span>
                    )}
                    {userData.verificationStatus === 'rejected' && (
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                        ✗ Rejected
                      </span>
                    )}
                    {userData.verificationStatus === 'pending' && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                        ⏳ Pending Review
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-gray-500">Submitted On</Label>
                  <p className="font-medium flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(details.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Uploaded Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-500">Photo</Label>
                  <a 
                    href={details.photoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mt-1"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Photo
                  </a>
                </div>
                <div>
                  <Label className="text-gray-500">Aadhar Front</Label>
                  <a 
                    href={details.aadharFrontUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mt-1"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Aadhar Front
                  </a>
                </div>
                {details.aadharBackUrl && (
                  <div>
                    <Label className="text-gray-500">Aadhar Back</Label>
                    <a 
                      href={details.aadharBackUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mt-1"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Aadhar Back
                    </a>
                  </div>
                )}
                {details.panCardUrl && (
                  <div>
                    <Label className="text-gray-500">PAN Card</Label>
                    <a 
                      href={details.panCardUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mt-1"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View PAN Card
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
