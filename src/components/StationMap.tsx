import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Station } from '../types/station';
import { geocodeAddress } from '../utils/geocodingService';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icon for active stations
const activeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom icon for inactive stations
const inactiveIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface StationMapProps {
  stations: Station[];
  searchLocation?: string; // District or city name to search for
}

// Component to handle geocoding and zooming to location
const MapViewController: React.FC<{ 
  stations: Station[];
  searchLocation?: string;
}> = ({ stations, searchLocation }) => {
  const map = useMap();

  useEffect(() => {
    const handleMapView = async () => {
      const validStations = stations.filter(s => s.latitude && s.longitude);
      
      // If there's a search location, try to geocode it using Mapbox
      if (searchLocation && searchLocation.trim()) {
        try {
          // Build search query with Vietnam context
          const query = `${searchLocation}, Vietnam`;
          
          // Use Mapbox Geocoding API for more accurate results
          const result = await geocodeAddress(query, {
            country: 'vn',
            types: ['district', 'place', 'locality'],
            // Proximity to Ho Chi Minh City for better results
            proximity: [106.6297, 10.8231]
          });
          
          if (result) {
            // If we have bounding box, use it for better view
            if (result.bbox && result.bbox.length === 4) {
              const bounds = L.latLngBounds(
                [result.bbox[1], result.bbox[0]], // [minLat, minLng]
                [result.bbox[3], result.bbox[2]]  // [maxLat, maxLng]
              );
              map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
            } else {
              // Otherwise just center on the location
              map.setView([result.latitude, result.longitude], 13);
            }
          } else {
            // Fallback to fitting markers if geocoding fails
            if (validStations.length > 0) {
              const bounds = L.latLngBounds(
                validStations.map(s => [s.latitude!, s.longitude!])
              );
              map.fitBounds(bounds, { padding: [50, 50] });
            }
          }
        } catch (error) {
          console.error('Geocoding error:', error);
          // Fallback to fitting markers
          if (validStations.length > 0) {
            const bounds = L.latLngBounds(
              validStations.map(s => [s.latitude!, s.longitude!])
            );
            map.fitBounds(bounds, { padding: [50, 50] });
          }
        }
      } else if (validStations.length > 0) {
        // No search location, just fit all markers
        const bounds = L.latLngBounds(
          validStations.map(s => [s.latitude!, s.longitude!])
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    };

    // Add a small delay to ensure map is fully loaded
    const timer = setTimeout(() => {
      handleMapView();
    }, 100);

    return () => clearTimeout(timer);
  }, [stations, searchLocation, map]);

  return null;
};

const StationMap: React.FC<StationMapProps> = ({ stations, searchLocation }) => {
  // Mock coordinates for common districts in Vietnam
  const mockCoordinates: Record<string, { latitude: number; longitude: number }> = {
    // TP.HCM
    'quan 1': { latitude: 10.7756, longitude: 106.7019 },
    'quận 1': { latitude: 10.7756, longitude: 106.7019 },
    'quan 3': { latitude: 10.7869, longitude: 106.6818 },
    'quận 3': { latitude: 10.7869, longitude: 106.6818 },
    'thu duc': { latitude: 10.8505, longitude: 106.7718 },
    'thủ đức': { latitude: 10.8505, longitude: 106.7718 },
    'binh thanh': { latitude: 10.8142, longitude: 106.7011 },
    'bình thạnh': { latitude: 10.8142, longitude: 106.7011 },
    'tan binh': { latitude: 10.8006, longitude: 106.6525 },
    'tân bình': { latitude: 10.8006, longitude: 106.6525 },
    'phu nhuan': { latitude: 10.7992, longitude: 106.6836 },
    'phú nhuận': { latitude: 10.7992, longitude: 106.6836 },
    // Hà Nội
    'hoan kiem': { latitude: 21.0285, longitude: 105.8542 },
    'hoàn kiếm': { latitude: 21.0285, longitude: 105.8542 },
    'cau giay': { latitude: 21.0333, longitude: 105.7940 },
    'cầu giấy': { latitude: 21.0333, longitude: 105.7940 },
    'dong da': { latitude: 21.0144, longitude: 105.8253 },
    'đống đa': { latitude: 21.0144, longitude: 105.8253 },
    'ba dinh': { latitude: 21.0333, longitude: 105.8189 },
    'ba đình': { latitude: 21.0333, longitude: 105.8189 },
    // Đà Nẵng
    'hai chau': { latitude: 16.0471, longitude: 108.2068 },
    'hải châu': { latitude: 16.0471, longitude: 108.2068 },
    'son tra': { latitude: 16.0825, longitude: 108.2439 },
    'sơn trà': { latitude: 16.0825, longitude: 108.2439 },
  };

  // Function to assign coordinates to stations
  const getMockCoordinates = (station: any, index: number): { latitude: number; longitude: number } => {
    // If station already has coordinates, use them
    if (station.latitude && station.longitude) {
      return { latitude: station.latitude, longitude: station.longitude };
    }

    // Try to match from station name, address, district, or city
    const searchText = `${station.name || ''} ${station.address || ''} ${station.district || ''} ${station.city || ''}`.toLowerCase();
    
    for (const [district, coords] of Object.entries(mockCoordinates)) {
      if (searchText.includes(district)) {
        // Add small random offset to avoid exact overlapping
        return {
          latitude: coords.latitude + (Math.random() - 0.5) * 0.01,
          longitude: coords.longitude + (Math.random() - 0.5) * 0.01
        };
      }
    }

    // Default: TP.HCM center with offset based on index to spread out stations
    const baseLatitude = 10.8231;
    const baseLongitude = 106.6297;
    const offset = index * 0.02;
    
    return {
      latitude: baseLatitude + (offset % 0.1),
      longitude: baseLongitude + (Math.floor(offset / 0.1) * 0.02)
    };
  };

  // Add coordinates to all stations
  const stationsWithCoords = stations.map((station, index) => ({
    ...station,
    ...getMockCoordinates(station, index)
  }));

  // Filter stations that have valid coordinates (now all should have them)
  const validStations = stationsWithCoords.filter(s => s.latitude && s.longitude);

  // Default center (Ho Chi Minh City)
  const defaultCenter: [number, number] = [10.8231, 106.6297];

  // Debug log
  console.log('StationMap - Total stations:', stations.length);
  console.log('StationMap - Valid stations with coordinates:', validStations.length);
  console.log('StationMap - Search location:', searchLocation);

  if (stations.length === 0) {
    return (
      <div className="w-full h-[600px] flex flex-col items-center justify-center bg-gray-100 rounded-lg">
        <p className="text-gray-500 text-lg mb-2">Không có trạm nào để hiển thị</p>
        <p className="text-gray-400 text-sm">Vui lòng thử lại hoặc điều chỉnh bộ lọc</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] rounded-lg overflow-hidden shadow-lg">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapViewController stations={validStations} searchLocation={searchLocation} />
        {validStations.map((station) => (
          <Marker
            key={station._id}
            position={[station.latitude!, station.longitude!]}
            icon={station.status === 'active' ? activeIcon : inactiveIcon}
          >
            <Popup maxWidth={300}>
              <div className="p-2">
                <h3 className="font-bold text-lg mb-2">{station.name}</h3>
                {station.images && station.images.length > 0 && (
                  <img
                    src={station.images[0]}
                    alt={station.name}
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                )}
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Địa chỉ:</strong> {station.address}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Quận/Huyện:</strong> {station.district} - {station.city}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Điện thoại:</strong> {station.phone}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Email:</strong> {station.email}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Giờ mở cửa:</strong> {station.opening_time} - {station.closing_time}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Sức chứa:</strong> {station.current_vehicles}/{station.max_capacity}
                </p>
                <span
                  className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                    station.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {station.status === 'active' ? 'Đang hoạt động' : 'Không hoạt động'}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default StationMap;

