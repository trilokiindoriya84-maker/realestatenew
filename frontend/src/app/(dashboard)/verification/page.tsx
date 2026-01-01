
'use client';

import { useState, useEffect, ChangeEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, User, CreditCard, ShieldCheck, AlertCircle, ExternalLink, MapPin, Phone, Check } from 'lucide-react';
import api from '@/lib/api';

export default function VerificationPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [existingDocs, setExistingDocs] = useState<any>(null);
    const [activeSection, setActiveSection] = useState(0);

    // Refs for scroll tracking
    const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState({
        fullName: '',
        fatherName: '',
        motherName: '',
        mobile: '',
        alternateMobile: '',
        dateOfBirth: '',
        aadharNumber: '',
        panNumber: '',
        address: '',
        city: '',
        state: '',
        pincode: ''
    });

    const [files, setFiles] = useState<{
        photo: File | null;
        aadharFront: File | null;
        aadharBack: File | null;
        panCard: File | null;
    }>({
        photo: null,
        aadharFront: null,
        aadharBack: null,
        panCard: null
    });

    // Progress sections
    const sections = [
        { id: 'personal', title: 'Personal Details', icon: User },
        { id: 'contact', title: 'Contact Info', icon: Phone },
        { id: 'address', title: 'Address Details', icon: MapPin },
        { id: 'legal', title: 'Legal Documents', icon: CreditCard },
        { id: 'documents', title: 'Upload Documents', icon: FileText }
    ];

    useEffect(() => {
        const fetchExistingData = async () => {
            try {
                const { data } = await api.get('/verification/status');
                if (data.data) {
                    setFormData({
                        fullName: data.data.fullName || '',
                        fatherName: data.data.fatherName || '',
                        motherName: data.data.motherName || '',
                        mobile: data.data.mobile || '',
                        alternateMobile: data.data.alternateMobile || '',
                        dateOfBirth: data.data.dateOfBirth || '',
                        aadharNumber: data.data.aadharNumber || '',
                        panNumber: data.data.panNumber || '',
                        address: data.data.address || '',
                        city: data.data.city || '',
                        state: data.data.state || '',
                        pincode: data.data.pincode || ''
                    });
                    if (data.data.documents) {
                        setExistingDocs(data.data.documents);
                    }
                }
            } catch (e) {
                // No existing data or fetch failed
            }
        };
        fetchExistingData();
    }, []);

    // Scroll tracking
    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + window.innerHeight / 2;

            let currentSection = 0;
            sectionRefs.current.forEach((ref, index) => {
                if (ref) {
                    const rect = ref.getBoundingClientRect();
                    const elementTop = rect.top + window.scrollY;
                    
                    if (scrollPosition >= elementTop) {
                        currentSection = index;
                    }
                }
            });

            setActiveSection(currentSection);
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll(); // Initial check
        
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (index: number) => {
        const section = sectionRefs.current[index];
        if (section) {
            const elementTop = section.getBoundingClientRect().top + window.scrollY;
            const offset = 100; // Offset for header
            
            window.scrollTo({
                top: elementTop - offset,
                behavior: 'smooth'
            });
        }
    };

    const handleTextChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>, field: keyof typeof files) => {
        if (e.target.files && e.target.files[0]) {
            setFiles({ ...files, [field]: e.target.files[0] });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Validation: If no existing doc AND no new file -> Error
        if (!existingDocs?.photo && !files.photo) { setError("Photo is required"); setLoading(false); return; }
        if (!existingDocs?.aadharFront && !files.aadharFront) { setError("Aadhar Front is required"); setLoading(false); return; }

        const data = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            data.append(key, value);
        });

        if (files.photo) data.append('photo', files.photo);
        if (files.aadharFront) data.append('aadharFront', files.aadharFront);
        if (files.aadharBack) data.append('aadharBack', files.aadharBack);
        if (files.panCard) data.append('panCard', files.panCard);

        try {
            await api.post('/verification/submit', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSuccess(true);
            setTimeout(() => router.push('/dashboard'), 3000);
        } catch (err: any) {
            console.error('Submission failed', err);
            setError(err.response?.data?.message || 'Failed to submit verification request');
        } finally {
            setLoading(false);
        }
    };

    const renderFileField = (label: string, field: keyof typeof files, existingUrl?: string) => (
        <div className="space-y-2">
            <Label className="text-sm font-medium">{label}</Label>
            {existingUrl && (
                <div className="text-xs flex items-center gap-2 mb-1">
                    <span className="text-slate-500">Current:</span>
                    <a href={existingUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                        View File <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
            )}
            <div className="flex items-center gap-2">
                <Input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileChange(e, field)}
                    required={!existingUrl}
                    className="text-sm"
                />
                {files[field] && <span className="text-xs text-green-600 font-medium whitespace-nowrap">New Selected</span>}
            </div>
        </div>
    );

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-green-50 rounded-lg border border-green-200">
                <ShieldCheck className="w-16 h-16 text-green-600 mb-4" />
                <h2 className="text-2xl font-bold text-green-800">Verification Submitted!</h2>
                <p className="text-green-700 mt-2">Your documents are under review. We will notify you once verified.</p>
                <p className="text-sm text-green-600 mt-4">Redirecting to dashboard...</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                <div className="flex gap-8 relative">
                    {/* Left Sidebar - Progress Bar */}
                    <div className="w-80 flex-shrink-0">
                        <div className="sticky top-20 bg-white border border-gray-200 rounded-lg shadow-sm p-6 max-h-[calc(100vh-6rem)] overflow-y-auto">
                            <div className="mb-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Identity Verification</h2>
                                <p className="text-sm text-gray-600">Complete all sections to verify your identity</p>
                            </div>

                            <div className="space-y-4">
                                {sections.map((section, index) => {
                                    const Icon = section.icon;
                                    const isActive = activeSection === index;
                                    const isCompleted = index < activeSection;

                                    return (
                                        <div
                                            key={section.id}
                                            onClick={() => scrollToSection(index)}
                                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                                isActive 
                                                    ? 'bg-blue-50 border border-blue-200' 
                                                    : isCompleted 
                                                    ? 'bg-green-50 border border-green-200' 
                                                    : 'hover:bg-gray-50 border border-transparent'
                                            }`}
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                isActive 
                                                    ? 'bg-blue-600 text-white' 
                                                    : isCompleted 
                                                    ? 'bg-green-600 text-white' 
                                                    : 'bg-gray-200 text-gray-600'
                                            }`}>
                                                {isCompleted ? (
                                                    <Check className="w-4 h-4" />
                                                ) : (
                                                    <Icon className="w-4 h-4" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className={`text-sm font-medium ${
                                                    isActive ? 'text-blue-900' : isCompleted ? 'text-green-900' : 'text-gray-900'
                                                }`}>
                                                    {section.title}
                                                </h3>
                                                <p className={`text-xs ${
                                                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                                                }`}>
                                                    {isCompleted ? 'Completed' : isActive ? 'In Progress' : 'Pending'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        <div ref={containerRef}>
                            <form onSubmit={handleSubmit} className="space-y-8">

                            {/* Personal Details */}
                            <div ref={el => { sectionRefs.current[0] = el; }}>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <User className="h-5 w-5" /> Personal Details
                                        </CardTitle>
                                        <CardDescription>Enter details exactly as they appear on your ID documents</CardDescription>
                                    </CardHeader>
                                    <CardContent className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                                            <Input id="fullName" placeholder="As per Aadhar" value={formData.fullName} onChange={handleTextChange} required className="h-9" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="dateOfBirth" className="text-sm font-medium">Date of Birth</Label>
                                            <Input id="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleTextChange} required className="h-9" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="fatherName" className="text-sm font-medium">Father's Name</Label>
                                            <Input id="fatherName" placeholder="Father's full name" value={formData.fatherName} onChange={handleTextChange} required className="h-9" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="motherName" className="text-sm font-medium">Mother's Name</Label>
                                            <Input id="motherName" placeholder="Mother's full name" value={formData.motherName} onChange={handleTextChange} required className="h-9" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Contact Details */}
                            <div ref={el => { sectionRefs.current[1] = el; }}>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Phone className="h-5 w-5" /> Contact Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="mobile" className="text-sm font-medium">Mobile Number</Label>
                                            <Input id="mobile" placeholder="Linked with Aadhar" value={formData.mobile} onChange={handleTextChange} required className="h-9" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="alternateMobile" className="text-sm font-medium">Alternative Mobile Number</Label>
                                            <Input id="alternateMobile" placeholder="Optional" value={formData.alternateMobile} onChange={handleTextChange} className="h-9" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Address Details */}
                            <div ref={el => { sectionRefs.current[2] = el; }}>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <MapPin className="h-5 w-5" /> Address Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="address" className="text-sm font-medium">Full Address</Label>
                                            <Input id="address" placeholder="House No, Street, Area" value={formData.address} onChange={handleTextChange} required className="h-9" />
                                        </div>
                                        <div className="grid gap-4 md:grid-cols-3">
                                            <div className="space-y-2">
                                                <Label htmlFor="city" className="text-sm font-medium">City</Label>
                                                <Input id="city" placeholder="City name" value={formData.city} onChange={handleTextChange} required className="h-9" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="state" className="text-sm font-medium">State</Label>
                                                <Input id="state" placeholder="State name" value={formData.state} onChange={handleTextChange} required className="h-9" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="pincode" className="text-sm font-medium">PIN Code</Label>
                                                <Input id="pincode" placeholder="6-digit PIN" value={formData.pincode} onChange={handleTextChange} required className="h-9" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Legal Details */}
                            <div ref={el => { sectionRefs.current[3] = el; }}>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <CreditCard className="h-5 w-5" /> Legal Documents
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="aadharNumber" className="text-sm font-medium">Aadhar Number</Label>
                                            <Input id="aadharNumber" placeholder="12-digit number" value={formData.aadharNumber} onChange={handleTextChange} required className="h-9" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="panNumber" className="text-sm font-medium">PAN Number</Label>
                                            <Input id="panNumber" placeholder="10-character alphanumeric" value={formData.panNumber} onChange={handleTextChange} required className="h-9" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Documents Upload */}
                            <div ref={el => { sectionRefs.current[4] = el; }}>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="h-5 w-5" /> Documents Upload
                                        </CardTitle>
                                        <CardDescription>Upload clear images (JPG, PNG) or PDF. Max 5MB each.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {/* Top Row: Photo and PAN Card */}
                                        <div className="grid gap-4 md:grid-cols-2">
                                            {renderFileField('Your Photo', 'photo', existingDocs?.photo)}
                                            {renderFileField('PAN Card Image', 'panCard', existingDocs?.panCard)}
                                        </div>
                                        
                                        {/* Bottom Row: Aadhar Front and Back */}
                                        <div className="grid gap-4 md:grid-cols-2">
                                            {renderFileField('Aadhar Front Side', 'aadharFront', existingDocs?.aadharFront)}
                                            {renderFileField('Aadhar Back Side', 'aadharBack', existingDocs?.aadharBack)}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-4 text-red-700 bg-red-50 rounded-lg">
                                    <AlertCircle className="w-5 h-5" />
                                    <p>{error}</p>
                                </div>
                            )}

                            <div className="flex justify-end gap-4 pt-6 pb-8">
                                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                                <Button type="submit" disabled={loading} className="w-32">
                                    {loading ? 'Submitting...' : 'Submit'}
                                </Button>
                            </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
