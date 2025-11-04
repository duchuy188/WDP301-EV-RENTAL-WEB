/**
 * Geocoding Service using Mapbox API
 * Provides accurate geocoding and reverse geocoding for Vietnamese addresses
 */

// Mapbox Access Token - Get from https://account.mapbox.com/
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiZXYtcmVudGFsIiwiYSI6ImNtNGExYjN6ZzBjenoybHF6M2QzZDN6NW0ifQ.placeholder';

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  place_name: string;
  context?: {
    district?: string;
    city?: string;
    country?: string;
  };
  bbox?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
}

/**
 * Forward Geocoding: Convert address/place name to coordinates
 * @param query - Address or place name to search for
 * @param options - Additional options for the search
 */
export async function geocodeAddress(
  query: string,
  options: {
    country?: string;
    proximity?: [number, number]; // [longitude, latitude]
    types?: string[]; // e.g., ['district', 'place', 'locality']
  } = {}
): Promise<GeocodingResult | null> {
  try {
    const { country = 'vn', proximity, types } = options;
    
    // Build Mapbox Geocoding API URL
    const encodedQuery = encodeURIComponent(query);
    let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${MAPBOX_ACCESS_TOKEN}`;
    
    // Add country parameter for more accurate results
    if (country) {
      url += `&country=${country}`;
    }
    
    // Add proximity to bias results near a specific location
    if (proximity) {
      url += `&proximity=${proximity[0]},${proximity[1]}`;
    }
    
    // Add types to filter results
    if (types && types.length > 0) {
      url += `&types=${types.join(',')}`;
    }
    
    // Add language parameter for Vietnamese
    url += '&language=vi';
    
    // Limit results to 1 for better performance
    url += '&limit=1';
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Mapbox Geocoding API error:', response.statusText);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.features || data.features.length === 0) {
      console.warn('No results found for query:', query);
      return null;
    }
    
    const feature = data.features[0];
    const [longitude, latitude] = feature.center;
    
    // Extract district and city from context
    const context: GeocodingResult['context'] = {};
    if (feature.context) {
      feature.context.forEach((item: any) => {
        if (item.id.startsWith('district')) {
          context.district = item.text;
        } else if (item.id.startsWith('place') || item.id.startsWith('locality')) {
          context.city = item.text;
        } else if (item.id.startsWith('country')) {
          context.country = item.text;
        }
      });
    }
    
    const result: GeocodingResult = {
      latitude,
      longitude,
      place_name: feature.place_name,
      context,
      bbox: feature.bbox as [number, number, number, number] | undefined
    };
    
    console.log('Geocoded:', query, '→', result);
    return result;
    
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Reverse Geocoding: Convert coordinates to address
 * @param longitude - Longitude coordinate
 * @param latitude - Latitude coordinate
 */
export async function reverseGeocode(
  longitude: number,
  latitude: number
): Promise<GeocodingResult | null> {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_ACCESS_TOKEN}&language=vi&types=address,district,place`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Mapbox Reverse Geocoding API error:', response.statusText);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.features || data.features.length === 0) {
      console.warn('No address found for coordinates:', latitude, longitude);
      return null;
    }
    
    const feature = data.features[0];
    
    // Extract district and city from context
    const context: GeocodingResult['context'] = {};
    if (feature.context) {
      feature.context.forEach((item: any) => {
        if (item.id.startsWith('district')) {
          context.district = item.text;
        } else if (item.id.startsWith('place') || item.id.startsWith('locality')) {
          context.city = item.text;
        } else if (item.id.startsWith('country')) {
          context.country = item.text;
        }
      });
    }
    
    const result: GeocodingResult = {
      latitude,
      longitude,
      place_name: feature.place_name,
      context,
      bbox: feature.bbox as [number, number, number, number] | undefined
    };
    
    console.log('Reverse geocoded:', `[${latitude}, ${longitude}]`, '→', result);
    return result;
    
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

/**
 * Get accurate district name from coordinates
 * Useful for displaying correct district information on markers
 */
export async function getDistrictFromCoordinates(
  longitude: number,
  latitude: number
): Promise<string | null> {
  const result = await reverseGeocode(longitude, latitude);
  return result?.context?.district || null;
}

/**
 * Search for districts in a specific city
 * @param district - District name to search for
 * @param city - City name (e.g., "Ho Chi Minh City", "Hanoi")
 */
export async function searchDistrict(
  district: string,
  city: string = 'Ho Chi Minh City'
): Promise<GeocodingResult | null> {
  const query = `${district}, ${city}, Vietnam`;
  return geocodeAddress(query, {
    country: 'vn',
    types: ['district', 'locality', 'place']
  });
}

