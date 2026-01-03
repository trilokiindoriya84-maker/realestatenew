import { Request, Response } from 'express';
import { db } from '../db';
import { publishedProperties } from '../db/schema';
import { sql, ilike, and, eq, desc } from 'drizzle-orm';

// Debug endpoint to check database content
export const debugDatabase = async (req: Request, res: Response): Promise<any> => {
    try {
        // Get all published properties with coordinates
        const allPublished = await db
            .select({
                uniqueId: publishedProperties.uniqueId,
                city: publishedProperties.city,
                locality: publishedProperties.locality,
                state: publishedProperties.state,
                latitude: publishedProperties.latitude,
                longitude: publishedProperties.longitude,
                isLive: publishedProperties.isLive,
                propertyTitle: publishedProperties.propertyTitle
            })
            .from(publishedProperties)
            .limit(10);
        
        // Get live published properties with coordinates
        const livePublished = await db
            .select({
                uniqueId: publishedProperties.uniqueId,
                city: publishedProperties.city,
                locality: publishedProperties.locality,
                state: publishedProperties.state,
                latitude: publishedProperties.latitude,
                longitude: publishedProperties.longitude,
                propertyTitle: publishedProperties.propertyTitle
            })
            .from(publishedProperties)
            .where(eq(publishedProperties.isLive, true))
            .limit(10);

        // Get properties with coordinates
        const propertiesWithCoords = await db
            .select({
                uniqueId: publishedProperties.uniqueId,
                city: publishedProperties.city,
                locality: publishedProperties.locality,
                state: publishedProperties.state,
                latitude: publishedProperties.latitude,
                longitude: publishedProperties.longitude,
                propertyTitle: publishedProperties.propertyTitle
            })
            .from(publishedProperties)
            .where(
                and(
                    eq(publishedProperties.isLive, true),
                    sql`${publishedProperties.latitude} IS NOT NULL`,
                    sql`${publishedProperties.longitude} IS NOT NULL`,
                    sql`${publishedProperties.latitude} != ''`,
                    sql`${publishedProperties.longitude} != ''`
                )
            )
            .limit(10);
        
        return res.json({
            success: true,
            data: {
                allPublished: allPublished.length,
                livePublished: livePublished.length,
                propertiesWithCoords: propertiesWithCoords.length,
                sampleProperties: allPublished.slice(0, 3),
                liveProperties: livePublished.slice(0, 3),
                coordProperties: propertiesWithCoords.slice(0, 3)
            }
        });
        
    } catch (error) {
        console.error('Debug database error:', error);
        return res.status(500).json({ 
            message: 'Debug error', 
            error: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
};

// Search locations from database and Mapbox
export const searchLocations = async (req: Request, res: Response): Promise<any> => {
    try {
        const { q: query } = req.query;
        
        if (!query || typeof query !== 'string' || query.trim().length < 2) {
            return res.status(400).json({ message: 'Query must be at least 2 characters long' });
        }

        const searchTerm = query.trim();

        // First check total live properties
        const totalLiveProperties = await db
            .select({ count: sql<number>`count(*)` })
            .from(publishedProperties)
            .where(eq(publishedProperties.isLive, true));

        // Search database for property locations (text-based)
        const propertyLocations = await db
            .select({
                city: publishedProperties.city,
                locality: publishedProperties.locality,
                state: publishedProperties.state,
                pincode: publishedProperties.pincode,
                propertyCount: sql<number>`count(*)`,
                avgPrice: sql<number>`avg(${publishedProperties.sellingPrice}::numeric)`,
            })
            .from(publishedProperties)
            .where(
                and(
                    eq(publishedProperties.isLive, true),
                    sql`(
                        ${publishedProperties.city} ILIKE ${`%${searchTerm}%`} OR 
                        ${publishedProperties.locality} ILIKE ${`%${searchTerm}%`} OR 
                        ${publishedProperties.state} ILIKE ${`%${searchTerm}%`} OR
                        ${publishedProperties.pincode} ILIKE ${`%${searchTerm}%`}
                    )`
                )
            )
            .groupBy(publishedProperties.city, publishedProperties.locality, publishedProperties.state, publishedProperties.pincode)
            .orderBy(desc(sql`count(*)`))
            .limit(5);

        // Search database for coordinate-based locations
        let coordinateBasedLocations: any[] = [];
        try {
            const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
            
            if (mapboxToken) {
                console.log(`Searching coordinates for: ${searchTerm}`);
                
                // Get coordinates for the searched location from Mapbox
                const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchTerm)}.json?access_token=${mapboxToken}&country=IN&limit=5`;
                
                const geocodeResponse = await fetch(geocodeUrl);
                
                if (geocodeResponse.ok) {
                    const geocodeData = await geocodeResponse.json();
                    console.log(`Mapbox geocode response for ${searchTerm}:`, geocodeData.features?.length || 0, 'features');
                    
                    if (geocodeData.features && geocodeData.features.length > 0) {
                        // For each Mapbox location, find nearby properties
                        for (const feature of geocodeData.features) {
                            const [searchLng, searchLat] = feature.center;
                            console.log(`Searching near coordinates: ${searchLat}, ${searchLng} for ${feature.place_name}`);
                            
                            // Find properties within 15km radius
                            const nearbyProperties = await db
                                .select({
                                    city: publishedProperties.city,
                                    locality: publishedProperties.locality,
                                    state: publishedProperties.state,
                                    pincode: publishedProperties.pincode,
                                    propertyCount: sql<number>`count(*)`,
                                    avgPrice: sql<number>`avg(${publishedProperties.sellingPrice}::numeric)`,
                                    searchLocation: sql<string>`${feature.place_name}`,
                                    // Add actual coordinates for debugging
                                    sampleLat: sql<string>`MIN(${publishedProperties.latitude})`,
                                    sampleLng: sql<string>`MIN(${publishedProperties.longitude})`,
                                })
                                .from(publishedProperties)
                                .where(
                                    and(
                                        eq(publishedProperties.isLive, true),
                                        sql`${publishedProperties.latitude} IS NOT NULL`,
                                        sql`${publishedProperties.longitude} IS NOT NULL`,
                                        sql`${publishedProperties.latitude} != ''`,
                                        sql`${publishedProperties.longitude} != ''`,
                                        // Use 15km radius for better matching
                                        sql`(
                                            6371 * acos(
                                                LEAST(1.0, GREATEST(-1.0,
                                                    cos(radians(${searchLat})) * 
                                                    cos(radians(CAST(${publishedProperties.latitude} AS NUMERIC))) * 
                                                    cos(radians(CAST(${publishedProperties.longitude} AS NUMERIC)) - radians(${searchLng})) + 
                                                    sin(radians(${searchLat})) * 
                                                    sin(radians(CAST(${publishedProperties.latitude} AS NUMERIC)))
                                                ))
                                            )
                                        ) <= 15`
                                    )
                                )
                                .groupBy(publishedProperties.city, publishedProperties.locality, publishedProperties.state, publishedProperties.pincode, sql`${feature.place_name}`)
                                .orderBy(desc(sql`count(*)`))
                                .limit(5);
                            
                            console.log(`Found ${nearbyProperties.length} nearby properties for ${feature.place_name}`);
                            if (nearbyProperties.length > 0) {
                                console.log('Sample property coordinates:', nearbyProperties[0].sampleLat, nearbyProperties[0].sampleLng);
                                // Calculate actual distance for debugging
                                const sampleLat = parseFloat(nearbyProperties[0].sampleLat);
                                const sampleLng = parseFloat(nearbyProperties[0].sampleLng);
                                const distance = calculateDistance(searchLat, searchLng, sampleLat, sampleLng);
                                console.log(`Distance between search (${searchLat}, ${searchLng}) and property (${sampleLat}, ${sampleLng}): ${distance.toFixed(2)}km`);
                            }
                            
                            coordinateBasedLocations.push(...nearbyProperties);
                        }
                    }
                } else {
                    console.error('Mapbox geocode failed:', geocodeResponse.status, geocodeResponse.statusText);
                }
            } else {
                console.error('Mapbox token not found');
            }
        } catch (error) {
            console.error('Coordinate-based location search error:', error);
        }

        // Helper function to calculate distance between two coordinates
        function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
            const R = 6371; // Earth's radius in kilometers
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLng = (lng2 - lng1) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                      Math.sin(dLng/2) * Math.sin(dLng/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c;
        }

        // Format database results (text-based)
        const databaseResults = propertyLocations.map((location, index) => {
            // Check if search term is a pincode (6 digits)
            const isPincodeSearch = /^\d{6}$/.test(searchTerm);
            
            let displayName = '';
            if (isPincodeSearch && location.pincode === searchTerm) {
                // For pincode search, show pincode prominently
                displayName = location.locality ? 
                    `${location.locality}, ${location.city} - ${location.pincode}` : 
                    `${location.city} - ${location.pincode}`;
            } else {
                // For regular search, show normal format
                displayName = location.locality ? 
                    `${location.locality}, ${location.city}, ${location.state}` : 
                    `${location.city}, ${location.state}`;
            }
            
            return {
                type: 'property',
                id: `db-${location.city}-${location.locality}-${location.pincode}-${index}`.toLowerCase().replace(/\s+/g, '-'),
                display_name: displayName,
                city: location.city,
                locality: location.locality,
                state: location.state,
                pincode: location.pincode,
                property_count: Number(location.propertyCount),
                avg_price: location.avgPrice ? Number(location.avgPrice) : null,
                search_type: isPincodeSearch ? 'pincode_match' : 'text_match'
            };
        });

        // Format coordinate-based results
        const coordinateResults = coordinateBasedLocations.map((location, index) => ({
            type: 'property',
            id: `coord-${location.city}-${location.locality}-${location.pincode}-${index}`.toLowerCase().replace(/\s+/g, '-'),
            display_name: location.locality ? 
                `${location.locality}, ${location.city}, ${location.state}` : 
                `${location.city}, ${location.state}`,
            city: location.city,
            locality: location.locality,
            state: location.state,
            pincode: location.pincode,
            property_count: Number(location.propertyCount),
            avg_price: location.avgPrice ? Number(location.avgPrice) : null,
            search_type: 'coordinate_match',
            search_location: location.searchLocation
        }));

        // Get Mapbox suggestions
        let mapboxResults: any[] = [];
        try {
            const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
            
            if (mapboxToken) {
                const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchTerm)}.json?access_token=${mapboxToken}&country=IN&types=place,locality,neighborhood,district,region,postcode&limit=8&language=en`;
                
                const mapboxResponse = await fetch(mapboxUrl);
                
                if (mapboxResponse.ok) {
                    const mapboxData = await mapboxResponse.json();
                    
                    mapboxResults = mapboxData.features?.map((feature: any) => {
                        // Extract clean location name and details
                        const placeName = feature.text || feature.place_name.split(',')[0];
                        const placeType = feature.place_type?.[0] || 'place';
                        
                        // Get context for additional info (state, country)
                        const context = feature.context || [];
                        let state = '';
                        let country = '';
                        
                        context.forEach((ctx: any) => {
                            if (ctx.id.startsWith('region')) {
                                state = ctx.text;
                            } else if (ctx.id.startsWith('country')) {
                                country = ctx.text;
                            }
                        });
                        
                        // Format display name like service platform
                        let displayName = placeName;
                        let subtitle = '';
                        
                        if (state && country) {
                            subtitle = `${state}, ${country}`;
                        } else if (state) {
                            subtitle = state;
                        } else if (country) {
                            subtitle = country;
                        }
                        
                        // Format place type for display
                        let typeDisplay = '';
                        switch (placeType) {
                            case 'place':
                                typeDisplay = 'City';
                                break;
                            case 'locality':
                                typeDisplay = 'Locality';
                                break;
                            case 'neighborhood':
                                typeDisplay = 'Area';
                                break;
                            case 'district':
                                typeDisplay = 'District';
                                break;
                            case 'region':
                                typeDisplay = 'Region';
                                break;
                            default:
                                typeDisplay = 'Place';
                        }
                        
                        return {
                            type: 'mapbox',
                            id: feature.id,
                            display_name: displayName,
                            subtitle: subtitle,
                            place_type_display: typeDisplay,
                            coordinates: feature.center,
                            place_type: placeType,
                            full_address: feature.place_name,
                        };
                    }) || [];
                }
            }
        } catch (error) {
            console.error('Mapbox API error:', error);
        }

        // If no results from either source, try a broader search
        if (databaseResults.length === 0 && coordinateResults.length === 0 && mapboxResults.length === 0) {
            // Try searching with partial match in database
            const broadDatabaseResults = await db
                .select({
                    city: publishedProperties.city,
                    locality: publishedProperties.locality,
                    state: publishedProperties.state,
                    pincode: publishedProperties.pincode,
                    propertyCount: sql<number>`count(*)`,
                    avgPrice: sql<number>`avg(${publishedProperties.sellingPrice}::numeric)`,
                })
                .from(publishedProperties)
                .where(
                    and(
                        eq(publishedProperties.isLive, true),
                        sql`(
                            ${publishedProperties.city} ILIKE ${`${searchTerm}%`} OR 
                            ${publishedProperties.locality} ILIKE ${`${searchTerm}%`} OR 
                            ${publishedProperties.state} ILIKE ${`${searchTerm}%`} OR
                            ${publishedProperties.pincode} ILIKE ${`${searchTerm}%`}
                        )`
                    )
                )
                .groupBy(publishedProperties.city, publishedProperties.locality, publishedProperties.state, publishedProperties.pincode)
                .orderBy(desc(sql`count(*)`))
                .limit(3);
            
            // Add broader results to database results
            const additionalDatabaseResults = broadDatabaseResults.map((location, index) => {
                // Check if search term is a pincode (6 digits)
                const isPincodeSearch = /^\d{6}$/.test(searchTerm);
                
                let displayName = '';
                if (isPincodeSearch && location.pincode === searchTerm) {
                    // For pincode search, show pincode prominently
                    displayName = location.locality ? 
                        `${location.locality}, ${location.city} - ${location.pincode}` : 
                        `${location.city} - ${location.pincode}`;
                } else {
                    // For regular search, show normal format
                    displayName = location.locality ? 
                        `${location.locality}, ${location.city}, ${location.state}` : 
                        `${location.city}, ${location.state}`;
                }
                
                return {
                    type: 'property',
                    id: `broad-${location.city}-${location.locality}-${location.pincode}-${index}`.toLowerCase().replace(/\s+/g, '-'),
                    display_name: displayName,
                    city: location.city,
                    locality: location.locality,
                    state: location.state,
                    pincode: location.pincode,
                    property_count: Number(location.propertyCount),
                    avg_price: location.avgPrice ? Number(location.avgPrice) : null,
                    search_type: isPincodeSearch ? 'pincode_partial' : 'text_partial'
                };
            });
            
            databaseResults.push(...additionalDatabaseResults);
        }

        // Combine results - database first (text + coordinate), then Mapbox 
        const combinedResults = [
            ...databaseResults,
            ...coordinateResults.filter((coordResult: any) => {
                // Remove duplicates with text-based results
                const exactMatch = databaseResults.some(db => {
                    return db.city === coordResult.city && 
                           db.locality === coordResult.locality && 
                           db.state === coordResult.state;
                });
                return !exactMatch;
            }),
            ...mapboxResults.filter((mapboxResult: any) => {
                // Only filter if it's an exact match with same type
                const exactMatch = [...databaseResults, ...coordinateResults].some(db => {
                    const dbLocationName = db.display_name.toLowerCase().trim();
                    const mapboxLocationName = mapboxResult.display_name.toLowerCase().trim();
                    
                    // Only filter if names are exactly the same
                    return dbLocationName === mapboxLocationName;
                });
                
                return !exactMatch;
            })
        ].slice(0, 10);

        return res.json({
            success: true,
            data: combinedResults,
            query: searchTerm,
            searchInfo: {
                textBasedResults: databaseResults.length,
                coordinateBasedResults: coordinateResults.length,
                mapboxResults: mapboxResults.length,
                totalCombined: combinedResults.length
            }
        });

    } catch (error) {
        console.error('Search locations error:', error);
        return res.status(500).json({ 
            message: 'Internal server error', 
            error: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
};

// Search properties by location
export const searchProperties = async (req: Request, res: Response): Promise<any> => {
    try {
        const { 
            location, 
            city, 
            locality, 
            state,
            pincode,
            propertyTypes, // Changed from propertyType to propertyTypes
            minPrice,
            maxPrice,
            bedrooms,
            bathrooms,
            minArea,
            maxArea,
            page = 1,
            limit = 20
        } = req.query;

        console.log('Search request received:');
        console.log('Query params:', req.query);
        console.log('Property types:', propertyTypes);
        console.log('Bedrooms:', bedrooms);
        console.log('Bathrooms:', bathrooms);

        let whereConditions = [eq(publishedProperties.isLive, true)];
        let coordinateBasedProperties: any[] = [];

        // Location-based search with coordinate matching
        if (location && typeof location === 'string') {
            // First try text-based search (including pincode)
            whereConditions.push(
                sql`(
                    ${publishedProperties.city} ILIKE ${`%${location}%`} OR 
                    ${publishedProperties.locality} ILIKE ${`%${location}%`} OR 
                    ${publishedProperties.state} ILIKE ${`%${location}%`} OR
                    ${publishedProperties.pincode} ILIKE ${`%${location}%`}
                )`
            );

            // Also try coordinate-based search using Mapbox reverse geocoding
            try {
                const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
                
                if (mapboxToken) {
                    console.log(`Coordinate search for location: ${location}`);
                    
                    // Get coordinates for the searched location from Mapbox
                    const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?access_token=${mapboxToken}&country=IN&limit=5`;
                    
                    const geocodeResponse = await fetch(geocodeUrl);
                    
                    if (geocodeResponse.ok) {
                        const geocodeData = await geocodeResponse.json();
                        console.log(`Mapbox geocode response:`, geocodeData.features?.length || 0, 'features');
                        
                        if (geocodeData.features && geocodeData.features.length > 0) {
                            // Try multiple Mapbox results for better matching
                            for (const feature of geocodeData.features) {
                                const [searchLng, searchLat] = feature.center;
                                console.log(`Searching near coordinates: ${searchLat}, ${searchLng} for ${feature.place_name}`);
                                
                                // Find properties within 15km radius
                                const radiusKm = 15;
                                
                                const coordinateBasedQuery = await db
                                    .select()
                                    .from(publishedProperties)
                                    .where(
                                        and(
                                            eq(publishedProperties.isLive, true),
                                            sql`${publishedProperties.latitude} IS NOT NULL`,
                                            sql`${publishedProperties.longitude} IS NOT NULL`,
                                            sql`${publishedProperties.latitude} != ''`,
                                            sql`${publishedProperties.longitude} != ''`,
                                            sql`(
                                                6371 * acos(
                                                    LEAST(1.0, GREATEST(-1.0,
                                                        cos(radians(${searchLat})) * 
                                                        cos(radians(CAST(${publishedProperties.latitude} AS NUMERIC))) * 
                                                        cos(radians(CAST(${publishedProperties.longitude} AS NUMERIC)) - radians(${searchLng})) + 
                                                        sin(radians(${searchLat})) * 
                                                        sin(radians(CAST(${publishedProperties.latitude} AS NUMERIC)))
                                                    ))
                                                )
                                            ) <= ${radiusKm}`
                                        )
                                    );
                                
                                console.log(`Found ${coordinateBasedQuery.length} properties within ${radiusKm}km for ${feature.place_name}`);
                                
                                // Add to coordinate-based properties (avoid duplicates)
                                coordinateBasedQuery.forEach(prop => {
                                    const exists = coordinateBasedProperties.some(existing => existing.uniqueId === prop.uniqueId);
                                    if (!exists) {
                                        coordinateBasedProperties.push(prop);
                                    }
                                });
                            }
                            
                            console.log(`Total coordinate-based properties found: ${coordinateBasedProperties.length}`);
                        }
                    } else {
                        console.error('Mapbox geocode failed:', geocodeResponse.status);
                    }
                } else {
                    console.error('Mapbox token not found for coordinate search');
                }
            } catch (error) {
                console.error('Coordinate-based search error:', error);
            }
        } else {
            // Specific location parameters
            if (city) {
                whereConditions.push(ilike(publishedProperties.city, `%${city}%`));
            }
            if (locality) {
                whereConditions.push(ilike(publishedProperties.locality, `%${locality}%`));
            }
            if (state) {
                whereConditions.push(ilike(publishedProperties.state, `%${state}%`));
            }
            if (pincode) {
                whereConditions.push(ilike(publishedProperties.pincode, `%${pincode}%`));
            }
        }

        // Apply other filters
        
        // Handle multiple property types (array)
        if (propertyTypes) {
            const propertyTypesList = Array.isArray(propertyTypes) ? propertyTypes : [propertyTypes];
            // Only apply filter if array is not empty (empty array means "All" is selected)
            if (propertyTypesList.length > 0 && propertyTypesList.some(type => type && typeof type === 'string' && type.trim())) {
                const validTypes = propertyTypesList.filter(type => type && typeof type === 'string' && type.trim());
                if (validTypes.length > 0) {
                    const propertyTypeConditions = validTypes.map(type => 
                        eq(publishedProperties.propertyType, type as string)
                    );
                    whereConditions.push(sql`(${sql.join(propertyTypeConditions, sql` OR `)})`);
                }
            }
        }
        
        if (minPrice) whereConditions.push(sql`${publishedProperties.sellingPrice}::numeric >= ${Number(minPrice)}`);
        if (maxPrice) whereConditions.push(sql`${publishedProperties.sellingPrice}::numeric <= ${Number(maxPrice)}`);
        
        // Handle multiple bedrooms (array)
        if (bedrooms) {
            const bedroomsList = Array.isArray(bedrooms) ? bedrooms : [bedrooms];
            // Only apply filter if array is not empty
            if (bedroomsList.length > 0 && bedroomsList.some(bedroom => bedroom && typeof bedroom === 'string' && bedroom.trim())) {
                const validBedrooms = bedroomsList.filter(bedroom => bedroom && typeof bedroom === 'string' && bedroom.trim());
                if (validBedrooms.length > 0) {
                    const bedroomConditions = validBedrooms.map(bedroom => 
                        eq(publishedProperties.bedrooms, bedroom as string)
                    );
                    whereConditions.push(sql`(${sql.join(bedroomConditions, sql` OR `)})`);
                }
            }
        }
        
        // Handle multiple bathrooms (array)
        if (bathrooms) {
            const bathroomsList = Array.isArray(bathrooms) ? bathrooms : [bathrooms];
            // Only apply filter if array is not empty
            if (bathroomsList.length > 0 && bathroomsList.some(bathroom => bathroom && typeof bathroom === 'string' && bathroom.trim())) {
                const validBathrooms = bathroomsList.filter(bathroom => bathroom && typeof bathroom === 'string' && bathroom.trim());
                if (validBathrooms.length > 0) {
                    const bathroomConditions = validBathrooms.map(bathroom => 
                        eq(publishedProperties.bathrooms, bathroom as string)
                    );
                    whereConditions.push(sql`(${sql.join(bathroomConditions, sql` OR `)})`);
                }
            }
        }
        
        if (minArea) whereConditions.push(sql`${publishedProperties.totalArea}::numeric >= ${Number(minArea)}`);
        if (maxArea) whereConditions.push(sql`${publishedProperties.totalArea}::numeric <= ${Number(maxArea)}`);

        const offset = (Number(page) - 1) * Number(limit);

        // Get text-based search results
        const textBasedResults = await db
            .select()
            .from(publishedProperties)
            .where(and(...whereConditions))
            .orderBy(desc(publishedProperties.publishedAt))
            .limit(Number(limit))
            .offset(offset);

        // Apply additional filters to coordinate-based results if any
        let filteredCoordinateResults: any[] = [];
        if (coordinateBasedProperties.length > 0) {
            filteredCoordinateResults = coordinateBasedProperties.filter((property: any) => {
                // Apply the same filters as text-based search
                if (propertyTypes) {
                    const propertyTypesList = Array.isArray(propertyTypes) ? propertyTypes : [propertyTypes];
                    const validTypes = propertyTypesList.filter(type => type && typeof type === 'string' && type.trim());
                    if (validTypes.length > 0 && !validTypes.includes(property.propertyType)) {
                        return false;
                    }
                }
                if (minPrice && Number(property.sellingPrice) < Number(minPrice)) return false;
                if (maxPrice && Number(property.sellingPrice) > Number(maxPrice)) return false;
                
                if (bedrooms) {
                    const bedroomsList = Array.isArray(bedrooms) ? bedrooms : [bedrooms];
                    const validBedrooms = bedroomsList.filter(bedroom => bedroom && typeof bedroom === 'string' && bedroom.trim());
                    if (validBedrooms.length > 0 && !validBedrooms.includes(property.bedrooms)) {
                        return false;
                    }
                }
                
                if (bathrooms) {
                    const bathroomsList = Array.isArray(bathrooms) ? bathrooms : [bathrooms];
                    const validBathrooms = bathroomsList.filter(bathroom => bathroom && typeof bathroom === 'string' && bathroom.trim());
                    if (validBathrooms.length > 0 && !validBathrooms.includes(property.bathrooms)) {
                        return false;
                    }
                }
                
                if (minArea && Number(property.totalArea) < Number(minArea)) return false;
                if (maxArea && Number(property.totalArea) > Number(maxArea)) return false;
                return true;
            });
        }

        // Combine results and remove duplicates
        const combinedResults = [...textBasedResults];
        
        // Add coordinate-based results that are not already in text-based results
        filteredCoordinateResults.forEach(coordProperty => {
            const alreadyExists = textBasedResults.some(textProperty => 
                textProperty.uniqueId === coordProperty.uniqueId
            );
            if (!alreadyExists) {
                combinedResults.push(coordProperty);
            }
        });

        // Sort combined results by published date
        combinedResults.sort((a, b) => {
            const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
            const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
            return dateB - dateA;
        });

        // Apply pagination to combined results
        const paginatedResults = combinedResults.slice(offset, offset + Number(limit));

        // Get total count for combined results
        const totalCount = combinedResults.length;
        const totalPages = Math.ceil(totalCount / Number(limit));

        return res.json({
            success: true,
            data: paginatedResults,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: totalCount,
                totalPages,
                hasNext: Number(page) < totalPages,
                hasPrev: Number(page) > 1
            },
            filters: {
                location: location || null,
                city: city || null,
                locality: locality || null,
                state: state || null,
                propertyTypes: propertyTypes || null,
                priceRange: { min: minPrice || null, max: maxPrice || null },
                bedrooms: bedrooms || null,
                bathrooms: bathrooms || null,
                areaRange: { min: minArea || null, max: maxArea || null }
            },
            searchInfo: {
                textBasedResults: textBasedResults.length,
                coordinateBasedResults: filteredCoordinateResults.length,
                totalCombined: combinedResults.length
            }
        });

    } catch (error) {
        console.error('Search properties error:', error);
        return res.status(500).json({ 
            message: 'Internal server error', 
            error: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
};