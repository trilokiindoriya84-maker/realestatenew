
'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User, LayoutDashboard, Heart, Search, MapPin } from 'lucide-react';

interface LocationSuggestion {
    type: 'property' | 'mapbox';
    id: string;
    display_name: string;
    subtitle?: string;
    place_type_display?: string;
    city?: string;
    locality?: string;
    state?: string;
    pincode?: string;
    property_count?: number;
    avg_price?: number;
    coordinates?: [number, number];
    place_type?: string;
    full_address?: string;
}

export function Header() {
    const { user, userProfile, signOut, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Sync search query with URL when on search page
    useEffect(() => {
        if (pathname === '/search') {
            const urlParams = new URLSearchParams(window.location.search);
            const locationParam = urlParams.get('location');
            const cityParam = urlParams.get('city');
            const localityParam = urlParams.get('locality');
            
            if (locationParam) {
                setSearchQuery(locationParam);
            } else if (cityParam && localityParam) {
                setSearchQuery(`${localityParam}, ${cityParam}`);
            } else if (cityParam) {
                setSearchQuery(cityParam);
            }
        }
    }, [pathname]);

    // Check if user is admin (hardcoded for now as per requirements)
    const isAdmin = user?.email === 'trilokiindoriya@gmail.com';
    
    // Use avatar from database (userProfile) if available, fallback to user_metadata
    const avatarUrl = userProfile?.avatarUrl || user?.user_metadata?.avatar_url;

    // Handle search input changes with debouncing
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (value.trim().length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            await fetchLocationSuggestions(value.trim());
        }, 300);
    };

    // Fetch location suggestions from backend
    const fetchLocationSuggestions = async (query: string) => {
        try {
            setIsSearching(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/search/locations?q=${encodeURIComponent(query)}`);
            
            if (response.ok) {
                const data = await response.json();
                setSuggestions(data.data || []);
                setShowSuggestions(true);
            }
        } catch (error) {
            console.error('Error fetching location suggestions:', error);
        } finally {
            setIsSearching(false);
        }
    };

    // Handle suggestion selection
    const handleSuggestionSelect = (suggestion: LocationSuggestion) => {
        setSearchQuery(suggestion.display_name);
        setShowSuggestions(false);
        
        // Navigate to search results page
        const searchParams = new URLSearchParams();
        if (suggestion.type === 'property') {
            if (suggestion.city) searchParams.set('city', suggestion.city);
            if (suggestion.locality) searchParams.set('locality', suggestion.locality);
            if (suggestion.state) searchParams.set('state', suggestion.state);
        } else {
            // For Mapbox results, use the clean display name for search
            searchParams.set('location', suggestion.display_name);
        }
        
        // If already on search page, replace the URL to update results
        if (pathname === '/search') {
            router.replace(`/search?${searchParams.toString()}`);
        } else {
            router.push(`/search?${searchParams.toString()}`);
        }
    };

    // Handle search form submission
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            setShowSuggestions(false);
            const searchUrl = `/search?location=${encodeURIComponent(searchQuery.trim())}`;
            
            // If already on search page, replace the URL to update results
            if (pathname === '/search') {
                router.replace(searchUrl);
            } else {
                router.push(searchUrl);
            }
        }
    };

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md dark:bg-black/80">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center">
                    <img 
                        src="/headerlogo.png" 
                        alt="Profeild Logo" 
                        className="h-16 w-auto object-contain"
                    />
                </Link>

                {/* Location Search Bar */}
                <div className="flex-1 max-w-md mx-8 relative" ref={searchRef}>
                    <form onSubmit={handleSearchSubmit} className="relative">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                type="text"
                                placeholder="Search locations..."
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                onFocus={() => {
                                    if (suggestions.length > 0) {
                                        setShowSuggestions(true);
                                    }
                                }}
                            />
                            {isSearching && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                </div>
                            )}
                        </div>
                    </form>

                    {/* Search Suggestions Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
                            {suggestions.map((suggestion, index) => (
                                <button
                                    key={`${suggestion.id}-${index}`}
                                    onClick={() => handleSuggestionSelect(suggestion)}
                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-start gap-3"
                                >
                                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-gray-900 truncate">
                                            {suggestion.display_name}
                                        </div>
                                        {suggestion.type === 'property' && suggestion.property_count && (
                                            <div className="text-sm text-gray-500 mt-1">
                                                {suggestion.property_count} properties
                                            </div>
                                        )}
                                        {suggestion.type === 'mapbox' && (
                                            <div className="text-sm text-gray-500 mt-1">
                                                {suggestion.subtitle && (
                                                    <span>{suggestion.subtitle}</span>
                                                )}
                                                {suggestion.place_type_display && (
                                                    <span className={suggestion.subtitle ? "ml-2" : ""}>
                                                        {suggestion.subtitle ? "• " : ""}{suggestion.place_type_display}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <nav className="flex items-center gap-4">
                    {isLoading ? (
                        <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200"></div>
                    ) : user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger className="outline-none">
                                <Avatar>
                                    <AvatarImage src={avatarUrl} />
                                    <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{user.user_metadata?.full_name || 'User'}</p>
                                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard" className="cursor-pointer">
                                        <LayoutDashboard className="mr-2 h-4 w-4" />
                                        Dashboard
                                    </Link>
                                </DropdownMenuItem>
                                {isAdmin && (
                                    <DropdownMenuItem asChild>
                                        <Link href="/admin" className="cursor-pointer">
                                            <User className="mr-2 h-4 w-4" />
                                            Admin Panel
                                        </Link>
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem asChild>
                                    <Link href="/saved" className="cursor-pointer">
                                        <Heart className="mr-2 h-4 w-4" />
                                        Saved Properties
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                    onClick={async (e) => {
                                        e.preventDefault();
                                        if (isSigningOut) return;
                                        
                                        setIsSigningOut(true);
                                        try {
                                            await signOut();
                                        } catch (error) {
                                            console.error('Signout error:', error);
                                        } finally {
                                            setIsSigningOut(false);
                                        }
                                    }} 
                                    className="text-red-600 cursor-pointer"
                                    disabled={isSigningOut}
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    {isSigningOut ? 'Signing Out...' : 'Sign Out'}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className="flex gap-2">
                            <Link href="/login">
                                <Button variant="ghost">Log In</Button>
                            </Link>
                            <Link href="/signup">
                                <Button>Sign Up</Button>
                            </Link>
                        </div>
                    )}
                </nav>
            </div>
        </header>
    );
}
