import { useState, useEffect } from 'react';
import { reverseGeocode, GeocodingResult } from '../utils/geocodingService';

/**
 * React Hook to reverse geocode coordinates to address
 * Useful for displaying correct district/address on map markers
 */
export function useReverseGeocode(
  latitude?: number,
  longitude?: number,
  enabled: boolean = true
) {
  const [result, setResult] = useState<GeocodingResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !latitude || !longitude) {
      return;
    }

    let cancelled = false;

    const fetchAddress = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await reverseGeocode(longitude, latitude);
        
        if (!cancelled) {
          setResult(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
          setLoading(false);
        }
      }
    };

    fetchAddress();

    return () => {
      cancelled = true;
    };
  }, [latitude, longitude, enabled]);

  return {
    address: result?.place_name,
    district: result?.context?.district,
    city: result?.context?.city,
    fullResult: result,
    loading,
    error
  };
}

/**
 * Example usage in a component:
 * 
 * const MarkerWithAddress = ({ lat, lng }) => {
 *   const { address, district, loading } = useReverseGeocode(lat, lng);
 * 
 *   return (
 *     <Marker position={[lat, lng]}>
 *       <Popup>
 *         {loading ? 'Đang tải...' : (
 *           <>
 *             <p>Địa chỉ: {address}</p>
 *             <p>Quận: {district}</p>
 *           </>
 *         )}
 *       </Popup>
 *     </Marker>
 *   );
 * };
 */

