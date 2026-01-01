import { Metadata } from 'next';
import api from '@/lib/api';

interface Props {
  params: { slug: string; uniqueId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const response = await api.get(`/properties/view/${params.uniqueId}`);
    const property = response.data;

    const title = `${property.propertyTitle} - ${property.city}, ${property.state}`;
    const description = `${property.propertyType} for sale in ${property.locality}, ${property.city}. ${property.totalArea} ${property.areaUnit}. Price: ₹${parseInt(property.sellingPrice).toLocaleString('en-IN')}`;
    const url = `https://yoursite.com/${params.slug}/p/${params.uniqueId}`;
    const image = property.propertyPhotos?.[0] || '/default-property.jpg';

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url,
        images: [{ url: image }],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [image],
      },
      alternates: {
        canonical: url,
      },
    };
  } catch (error) {
    return {
      title: 'Property Not Found',
      description: 'The property you are looking for could not be found.',
    };
  }
}
