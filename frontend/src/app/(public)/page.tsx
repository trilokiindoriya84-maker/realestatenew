import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Building2, ShieldCheck, Users } from 'lucide-react';
import PropertiesSection from '@/components/PropertiesSection';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

async function getPublishedProperties() {
    try {
        const response = await fetch(`${API_BASE_URL}/public/published-properties?limit=8`, {
            next: { revalidate: 30 } // Cache for 60 seconds
        });
        
        if (!response.ok) {
            console.error('Failed to fetch properties:', response.status);
            return [];
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching properties:', error);
        return [];
    }
}

export default async function HomePage() {
    // Fetch properties on server-side
    const properties = await getPublishedProperties();

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="relative py-20 lg:py-32 bg-slate-950 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent"></div>

                <div className="container relative z-10 px-4 mx-auto text-center">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6">
                        Trusted Real Estate <span className="text-blue-500">Marketplace</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10">
                        Buy and sell land, houses, and farms with complete confidence.
                        We verify every document and inspection so you don't have to worry.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/properties">
                            <Button size="lg" className="w-full sm:w-auto">
                                Explore Properties
                            </Button>
                        </Link>
                        <Link href="/dashboard">
                            <Button variant="outline" size="lg" className="w-full sm:w-auto bg-transparent text-white border-slate-600 hover:bg-white/10 hover:text-white">
                                Sell Property
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Properties Section */}
            <PropertiesSection initialProperties={properties} />

            {/* Features */}
            <section className="py-20 bg-slate-50">
                <div className="container px-4 mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-16 text-slate-900">Why Choose Us?</h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<ShieldCheck className="w-10 h-10 text-blue-600" />}
                            title="100% Verified"
                            description="Every property document is verified by our legal team before listing."
                        />
                        <FeatureCard
                            icon={<Users className="w-10 h-10 text-blue-600" />}
                            title="Secure Deals"
                            description="We facilitate the meetings and registry process to ensure safety."
                        />
                        <FeatureCard
                            icon={<Building2 className="w-10 h-10 text-blue-600" />}
                            title="Premium Listings"
                            description="High-quality details and images for every land or house."
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="mb-4">{icon}</div>
            <h3 className="text-xl font-semibold mb-2 text-slate-900">{title}</h3>
            <p className="text-slate-600">{description}</p>
        </div>
    );
}
