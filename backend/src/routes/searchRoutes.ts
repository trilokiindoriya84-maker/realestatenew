import { Router } from 'express';
import * as searchController from '../controllers/searchController';

const router = Router();

// Debug endpoint
router.get('/debug', searchController.debugDatabase);

// Test Mapbox API directly
router.get('/test-mapbox/:query', async (req, res) => {
    try {
        const { query } = req.params;
        const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        
        if (!mapboxToken) {
            return res.json({ error: 'Mapbox token not found' });
        }
        
        const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&country=IN&types=place,locality,neighborhood,district,region,postcode&limit=8&language=en`;
        
        const response = await fetch(mapboxUrl);
        const data = await response.json();
        
        return res.json({
            query,
            mapboxUrl,
            status: response.status,
            features: data.features?.map((f: any) => ({
                text: f.text,
                place_name: f.place_name,
                place_type: f.place_type,
                context: f.context
            })) || []
        });
    } catch (error) {
        return res.json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
});

// Search locations (both database and Mapbox)
router.get('/locations', searchController.searchLocations);

// Search properties by location and filters
router.get('/properties', searchController.searchProperties);

export default router;